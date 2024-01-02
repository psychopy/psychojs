/**
 * Window responsible for displaying the experiment stimuli
 *
 * @author Alain Pitiot & Nikita Agafonov
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import {AdjustmentFilter} from "@pixi/filter-adjustment";
import { MonotonicClock } from "../util/Clock.js";
import { Color } from "../util/Color.js";
import { PsychObject } from "../util/PsychObject.js";
import { Logger } from "./Logger.js";
import { hasTouchScreen } from "../util/Util.js";

/**
 * <p>Window displays the various stimuli of the experiment.</p>
 * <p>It sets up a [PIXI]{@link http://www.pixijs.com/} renderer, which we use to render the experiment stimuli.</p>
 *
 * @extends PsychObject
 */
export class Window extends PsychObject
{
	/**
	 * Check whether PsychoJS/Pixi.js is actually using WebGL in the participant's browser, i.e.
	 * hardware acceleration, rather than software emulation or Pixi.js' canvas fallback.
	 *
	 * @return true if WebGL is supported and false if it is not or if it is supported
	 * 	only through software emulation
	 */
	static checkWebGLSupport()
	{
		// Note: in order to detect whether the participant's browser has hardware acceleration turned off
		// we set FAIL_IF_MAJOR_PERFORMANCE_CAVEAT to true. This ensures that the WebGL context creation that
		// takes place in PIXI.utils.isWebGLSupported fails if the performance is low, which is typically the case
		// with software emulation.
		// See details here: https://registry.khronos.org/webgl/specs/latest/1.0/#5.2
		PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = true;
		return PIXI.utils.isWebGLSupported();
	}

	/**
	 * Getter for monitorFramePeriod.
	 *
	 * @name module:core.Window#monitorFramePeriod
	 * @return the estimated monitor frame period
	 */
	get monitorFramePeriod()
	{
		return 1.0 / this.getActualFrameRate();
	}

	/**
	 * @memberof module:core
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {string} [options.name] the name of the window
	 * @param {boolean} [options.fullscr= false] whether or not to go fullscreen
	 * @param {Color} [options.color= Color('black')] the background color of the window
	 * @param {number} [options.gamma= 1] sets the divisor for gamma correction. In other words gamma correction is calculated as pow(rgb, 1/gamma)
	 * @param {number} [options.contrast= 1] sets the contrast value
	 * @param {string} [options.units= 'pix'] the units of the window
	 * @param {boolean} [options.waitBlanking= false] whether or not to wait for all rendering operations to be done
	 * before flipping
	 * @param {boolean} [options.autoLog= true] whether or not to log
	 */
	constructor({
		psychoJS,
		name,
		fullscr = false,
		color = new Color("black"),
		gamma = 1,
		contrast = 1,
		units = "pix",
		waitBlanking = false,
		autoLog = true,
	} = {})
	{
		super(psychoJS, name);

		// messages to be logged at the next "flip":
		this._msgToBeLogged = [];

		// storing AdjustmentFilter instance to access later;
		this._adjustmentFilter = new AdjustmentFilter({
			gamma,
			contrast
		});

		// list of all elements, in the order they are currently drawn:
		this._drawList = [];

		this._addAttribute("fullscr", fullscr);
		this._addAttribute("color", color, new Color("black"), () => {
			if (this._backgroundSprite) {
				this._backgroundSprite.tint = this._color.int;
			}
		});
		this._addAttribute("gamma", gamma, 1, () => {
			this._adjustmentFilter.gamma = this._gamma;
		});
		this._addAttribute("contrast", contrast, 1, () => {
			this._adjustmentFilter.contrast = this._contrast;
		});
		this._addAttribute("units", units);
		this._addAttribute("waitBlanking", waitBlanking);
		this._addAttribute("autoLog", autoLog);
		this._addAttribute("size", []);

		// setup PIXI:
		this._setupPixi();

		this._frameCount = 0;

		this._flipCallbacks = [];

		// fullscreen listener:
		this._windowAlreadyInFullScreen = false;
		const self = this;
		document.addEventListener("fullscreenchange", (event) =>
		{
			self._windowAlreadyInFullScreen = !!document.fullscreenElement;

			console.log("windowAlreadyInFullScreen:", self._windowAlreadyInFullScreen);

			// the Window and all of the stimuli need to be updated:
			self._needUpdate = true;
			for (const stimulus of self._drawList)
			{
				stimulus._needUpdate = true;
			}
		});

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Close the window.
	 *
	 * <p> Note: this actually only removes the canvas used to render the experiment stimuli.</p>
	 */
	close()
	{
		if (!this._renderer)
		{
			return;
		}

		this._rootContainer.destroy();
		
		if (document.body.contains(this._renderer.view))
		{
			document.body.removeChild(this._renderer.view);
		}

		// destroy the renderer and the WebGL context:
		if (typeof this._renderer.gl !== "undefined")
		{
			const extension = this._renderer.gl.getExtension("WEBGL_lose_context");
			extension.loseContext();
		}

		this._renderer.destroy();

		window.removeEventListener("resize", this._resizeCallback);
		window.removeEventListener("orientationchange", this._resizeCallback);

		this._renderer = null;
	}

	/**
	 * Estimate the frame rate.
	 *
	 * @return {number} rAF based delta time based approximation, 60.0 by default
	 */
	getActualFrameRate()
	{
		// gets updated frame by frame
		const lastDelta = this.psychoJS.scheduler._lastDelta;
		const fps = (lastDelta === 0) ? 60.0 : (1000.0 / lastDelta);

		return fps;
	}

	/**
	 * Take the browser full screen if possible.
	 */
	adjustScreenSize()
	{
		// (!window.screenTop && !window.screenY) does not work in all browsers on all operating systems (e.g. Chrome on
		// Windows). As far as I can ascertain, as of 2019.08.01 there still does not seem to be a reliable way to
		// test whether the window is already fullscreen.
		// this._windowAlreadyInFullScreen = (!window.screenTop && !window.screenY);

		if (this.fullscr /* && !this._windowAlreadyInFullScreen*/)
		{
			this._psychoJS.logger.debug("Resizing Window: ", this._name, "to full screen.");

			if (typeof document.documentElement.requestFullscreen === "function")
			{
				document.documentElement.requestFullscreen()
					.catch(() =>
					{
						this.psychoJS.logger.warn("Unable to go fullscreen.");
					});
			}
			else if (typeof document.documentElement.mozRequestFullScreen === "function")
			{
				document.documentElement.mozRequestFullScreen();
			}
			else if (typeof document.documentElement.webkitRequestFullscreen === "function")
			{
				document.documentElement.webkitRequestFullscreen();
			}
			else if (typeof document.documentElement.msRequestFullscreen === "function")
			{
				document.documentElement.msRequestFullscreen();
			}
			else
			{
				this.psychoJS.logger.warn("Unable to go fullscreen.");
			}
		}
	}

	/**
	 * Take the browser back from full screen if needed.
	 */
	closeFullScreen()
	{
		if (this.fullscr)
		{
			this._psychoJS.logger.debug("Resizing Window: ", this._name, "back from full screen.");

			if (typeof document.exitFullscreen === "function")
			{
				document.exitFullscreen()
					.catch(() =>
					{
						this.psychoJS.logger.warn("Unable to close fullscreen.");
					});
			}
			else if (typeof document.mozCancelFullScreen === "function")
			{
				document.mozCancelFullScreen();
			}
			else if (typeof document.webkitExitFullscreen === "function")
			{
				document.webkitExitFullscreen();
			}
			else if (typeof document.msExitFullscreen === "function")
			{
				document.msExitFullscreen();
			}
			else
			{
				this.psychoJS.logger.warn("Unable to close fullscreen.");
			}
		}
	}

	/**
	 * Log a message.
	 *
	 * <p> Note: the message will be time-stamped at the next call to requestAnimationFrame.</p>
	 *
	 * @param {Object} options
	 * @param {String} options.msg the message to be logged
	 * @param {module:util.Logger.ServerLevel} [level = module:util.Logger.ServerLevel.EXP] the log level
	 * @param {Object} [obj] the object associated with the message
	 */
	logOnFlip({
		msg,
		level = Logger.ServerLevel.EXP,
		obj,
	} = {})
	{
		this._msgToBeLogged.push({ msg, level, obj });
	}

	/**
	 * Callback function for callOnFlip.
	 *
	 * @callback module:core.Window~OnFlipCallback
	 * @param {*} [args] optional arguments
	 */
	/**
	 * Add a callback function that will run after the next screen flip, i.e. immediately after the next rendering of the
	 * Window.
	 *
	 * <p>This is typically used to reset a timer or clock.</p>
	 *
	 * @param {module:core.Window~OnFlipCallback} flipCallback - callback function.
	 * @param {...*} flipCallbackArgs - arguments for the callback function.
	 */
	callOnFlip(flipCallback, ...flipCallbackArgs)
	{
		this._flipCallbacks.push({ function: flipCallback, arguments: flipCallbackArgs });
	}

	/**
	 * Add PIXI.DisplayObject to the container displayed on the scene (window)
	 */
	addPixiObject(pixiObject)
	{
		this._stimsContainer.addChild(pixiObject);
	}

	/**
	 * Remove PIXI.DisplayObject from the container displayed on the scene (window)
	 */
	removePixiObject(pixiObject)
	{
		this._stimsContainer.removeChild(pixiObject);	
	}

	/**
	 * Render the stimuli onto the canvas.
	 */
	render()
	{
		if (!this._renderer)
		{
			return;
		}

		this._frameCount++;

		// render the PIXI container:
		this._renderer.render(this._rootContainer);

		if (typeof this._renderer.gl !== "undefined")
		{
			// this is to make sure that the GPU is done rendering, it may not be necessary
			// [http://www.html5gamedevs.com/topic/27849-detect-when-view-has-been-rendered/]
			this._renderer.gl.readPixels(0, 0, 1, 1, this._renderer.gl.RGBA, this._renderer.gl.UNSIGNED_BYTE, new Uint8Array(4));

			// blocks execution until the rendering is fully done:
			if (this._waitBlanking)
			{
				this._renderer.gl.finish();
			}
		}

		// call the callOnFlip functions and remove them:
		for (let callback of this._flipCallbacks)
		{
			callback["function"](...callback["arguments"]);
		}
		this._flipCallbacks = [];

		// log:
		this._writeLogOnFlip();

		// prepare the scene for the next animation frame:
		this._refresh();
	}

	/**
	 * Update this window, if need be.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		if (this._needUpdate)
		{
			if (this._renderer)
			{
				this._renderer.backgroundColor = this._color.int;
				this._backgroundSprite.tint = this._color.int;
			}

			// we also change the background color of the body since
			// the dialog popup may be longer than the window's height:
			document.body.style.backgroundColor = this._color.hex;

			this._needUpdate = false;
		}
	}

	/**
	 * Recompute this window's draw list and _container children for the next animation frame.
	 *
	 * @protected
	 */
	_refresh()
	{
		this._updateIfNeeded();

		// if a stimuli needs to be updated, we remove it from the window container,
		// update it, then put it back
		for (const stimulus of this._drawList)
		{
			if (stimulus._needUpdate && typeof stimulus._pixi !== "undefined")
			{
				this._stimsContainer.removeChild(stimulus._pixi);
				stimulus._updateIfNeeded();
				this._stimsContainer.addChild(stimulus._pixi);
			}
		}
	}

	/**
	 * Force an update of all stimuli in this window's drawlist.
	 *
	 * @protected
	 */
	_fullRefresh()
	{
		this._needUpdate = true;

		for (const stimulus of this._drawList)
		{
			stimulus.refresh();
		}

		this._refresh();
	}

	/**
	 * Setup PIXI.
	 *
	 * <p>A new renderer is created and a container is added to it. The renderer's touch and mouse events
	 * are handled by the {@link EventManager}.</p>
	 *
	 * @protected
	 */
	_setupPixi()
	{
		// the size of the PsychoJS Window is always that of the browser
		this._size[0] = window.innerWidth;
		this._size[1] = window.innerHeight;

		if (this._psychoJS._checkWebGLSupport)
		{
			// see checkWebGLSupport() method for details.
			PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = true;
		}

		// create a PIXI renderer and add it to the document:
		this._renderer = PIXI.autoDetectRenderer({
			width: this._size[0],
			height: this._size[1],
			backgroundColor: this.color.int,
			powerPreference: "high-performance",
			resolution: window.devicePixelRatio,
		});
		this._renderer.view.style.transform = "translatez(0)";
		this._renderer.view.style.position = "absolute";
		document.body.appendChild(this._renderer.view);

		// we also change the background color of the body since the dialog popup may be longer than the window's height:
		document.body.style.backgroundColor = this._color.hex;

		// filters in PIXI work in a slightly unexpected fashion:
		// when setting this._rootContainer.filters, filtering itself
		// ignores backgroundColor of this._renderer and in addition to that
		// all child elements of this._rootContainer ignore backgroundColor when blending.
		// To circumvent that creating a separate PIXI.Sprite that serves as background color.
		// Then placing all Stims to a separate this._stimsContainer which hovers on top of
		// background sprite so that if we need to move all stims at once, the background sprite
		// won't get affected.
		this._backgroundSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		this._backgroundSprite.tint = this.color.int;
		this._backgroundSprite.width = this._size[0];
		this._backgroundSprite.height = this._size[1];
		this._backgroundSprite.anchor.set(.5);
		this._stimsContainer = new PIXI.Container();
		this._stimsContainer.sortableChildren = true;

		// create a top-level PIXI container:
		this._rootContainer = new PIXI.Container();
		this._rootContainer.addChild(this._backgroundSprite, this._stimsContainer);
    
		// sorts children according to their zIndex value. Higher zIndex means it will be moved towards the end of the array,
		// and thus rendered on top of previous one.
		this._rootContainer.sortableChildren = true;
    
		this._rootContainer.interactive = true;
		this._rootContainer.filters = [this._adjustmentFilter];

		// set the initial size of the PIXI renderer and the position of the root container:
		Window._resizePixiRenderer(this);

		// touch/mouse events are treated by PsychoJS' event manager:
		this.psychoJS.eventManager.addMouseListeners(this._renderer);

		// update the renderer size and the Window's stimuli whenever the browser's size or orientation change:
		this._resizeCallback = (e) =>
		{
			// if the user device is a mobile phone or tablet (we use the presence of a touch screen as a
			// proxy), we need to detect whether the change in size is due to the appearance of a virtual keyboard
			// in which case we do not want to resize the canvas. This is rather tricky and so we resort to
			// the below trick. It would be better to use the VirtualKeyboard API, but it is not widely
			// available just yet, as of 2023-06.
			const keyboardHeight = 300;
			if (hasTouchScreen() && (window.screen.height - window.visualViewport.height) > keyboardHeight)
			{
				return;
			}

			Window._resizePixiRenderer(this, e);
			this._backgroundSprite.width = this._size[0];
			this._backgroundSprite.height = this._size[1];
			this._fullRefresh();
		};
		window.addEventListener("resize", this._resizeCallback);
		window.addEventListener("orientationchange", this._resizeCallback);
	}

	/**
	 * Adjust the size of the renderer and the position of the root container
	 * in response to a change in the browser's size.
	 *
	 * @protected
	 * @param {module:core.Window} pjsWindow - the PsychoJS Window
	 * @param event
	 */
	static _resizePixiRenderer(pjsWindow, event)
	{
		pjsWindow._psychoJS.logger.debug("resizing Window: ", pjsWindow._name, "event:", JSON.stringify(event));

		// update the size of the PsychoJS Window:
		pjsWindow._size[0] = window.innerWidth;
		pjsWindow._size[1] = window.innerHeight;

		// update the PIXI renderer:
		pjsWindow._renderer.view.style.width = pjsWindow._size[0] + "px";
		pjsWindow._renderer.view.style.height = pjsWindow._size[1] + "px";
		pjsWindow._renderer.view.style.left = "0px";
		pjsWindow._renderer.view.style.top = "0px";
		pjsWindow._renderer.resize(pjsWindow._size[0], pjsWindow._size[1]);

		// setup the container such that (0,0) is at the centre of the window
		// with positive coordinates to the right and top:
		pjsWindow._rootContainer.position.x = pjsWindow._size[0] / 2.0;
		pjsWindow._rootContainer.position.y = pjsWindow._size[1] / 2.0;
		pjsWindow._rootContainer.scale.y = -1;
	}

	/**
	 * Send all logged messages to the {@link Logger}.
	 *
	 * @protected
	 */
	_writeLogOnFlip()
	{
		const logTime = MonotonicClock.getReferenceTime();
		for (const entry of this._msgToBeLogged)
		{
			this._psychoJS.experimentLogger.log(entry.msg, entry.level, logTime, entry.obj);
		}

		this._msgToBeLogged = [];
	}
}
