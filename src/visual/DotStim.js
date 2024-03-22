/**
 * Dot Stimulus.
 *
 * @author Nikita Agafonov
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import {AdjustmentFilter} from "@pixi/filter-adjustment";
import { Color } from "../util/Color.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";

/**
 * Grating Stimulus.
 *
 * @extends VisualStim
 */
export class DotStim extends VisualStim
{
	/**
	 * Default size of the Dot Stimuli in pixels.
	 *
	 * @type {Array}
	 * @default [256, 256]
	 */
	static #DEFAULT_STIM_SIZE_PX = [256, 256]; // in pixels

	static #BLEND_MODES_MAP = {
		avg: PIXI.BLEND_MODES.NORMAL,
		add: PIXI.BLEND_MODES.ADD,
		mul: PIXI.BLEND_MODES.MULTIPLY,
		screen: PIXI.BLEND_MODES.SCREEN
	};

	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {String | HTMLImageElement} [options.tex="sin"] - the name of the predefined grating texture or image resource or the HTMLImageElement corresponding to the texture
	 * @param {String | HTMLImageElement} [options.mask] - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {String} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {number} [options.sf=1.0] - spatial frequency of the function used in grating stimulus
	 * @param {number} [options.phase=0.0] - phase of the function used in grating stimulus, multiples of period of that function
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered image (DEFAULT_STIM_SIZE_PX will be used if size is not specified)
	 * @param {Color} [options.color= "white"] - Foreground color of the stimulus. Can be String like "red" or "#ff0000" or Number like 0xff0000.
	 * @param {number} [options.opacity= 1.0] - Set the opacity of the stimulus. Determines how visible the stimulus is relative to background.
	 * @param {number} [options.contrast= 1.0] - Set the contrast of the stimulus, i.e. scales how far the stimulus deviates from the middle grey. Ranges [-1, 1].
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {boolean} [options.interpolate= false] - Whether to interpolate (linearly) the texture in the stimulus. Currently supports only image based gratings.
	 * @param {String} [options.blendmode= "avg"] - blend mode of the stimulus, determines how the stimulus is blended with the background. Supported values: "avg", "add", "mul", "screen".
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({
		name,
		win,
		units,
		nDots = 1,
		coherence = 0.5,
		pos = [0, 0],
		size = [ 1, 1 ],
		fieldShape = "sqr",
		dotSize = 2,
		dotLife = 3,
		dir = 0.0,
		speed = 0.5,
		signalDots = "same",
		noiseDots = "direction",
		anchor,
		ori,
		color,
		colorSpace,
		opacity,
		contrast = 1,
		depth,
		interpolate,
		blendmode,
		autoDraw,
		autoLog,
	} = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, anchor, size, autoDraw, autoLog });

		this._pixi = new PIXI.Container();
		this._adjustmentFilter = new AdjustmentFilter({ contrast });

		this._addAttribute("coherence", coherence, coherence);
		this._addAttribute("nDots", nDots, nDots);
		this._addAttribute("fieldShape", fieldShape, fieldShape);
		this._addAttribute("dotSize", dotSize, dotSize);
		this._addAttribute("dotLife", dotLife, dotLife);
		this._addAttribute("speed", speed, speed);
		this._addAttribute("dir", dir, dir);
		this._addAttribute("signalDots", signalDots, signalDots);
		this._addAttribute("noiseDots", noiseDots, noiseDots);
		this._addAttribute("color", color, "white");
		this._addAttribute("colorSpace", colorSpace, "RGB");
		this._addAttribute("contrast",
			contrast,
			1.0,
			() => { this._adjustmentFilter.contrast = this._contrast; }
		);
		this._addAttribute("blendmode", blendmode, "avg");
		this._addAttribute("interpolate", interpolate, false);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}

		if (!Array.isArray(this.size) || this.size.length === 0)
		{
			this.size = util.to_unit(DotStim.#DEFAULT_STIM_SIZE_PX, "pix", this.win, this.units);
		}

		this._positioningFunctions = {
			"sqr": this._getRandomPositionWithinSquareField,
			"circle": this._getRandomPosWithinCircleField
		};

		this._size_px = util.to_px(this.size, this.units, this.win);
		this._dotsLife = new Float32Array(nDots);
		this._dotsDir = new Float32Array(nDots);

		// TODO: DEBUG.
		// const s = new PIXI.Sprite(PIXI.Texture.WHITE);
		// s.width = this._size_px[ 0 ];
		// s.height = this._size_px[ 1 ];
		// s.tint = 0xff0000;
		// this._pixi.addChild(s);

		this._spawnDots();
	}

	_getRandomPositionWithinSquareField()
	{
		const fieldWidth = this._size_px[ 0 ];
		const fieldHeight = this._size_px[ 1 ];
		const x = Math.min(Math.random() * fieldWidth, fieldWidth - this._dotSize);
		const y = Math.min(Math.random() * fieldHeight, fieldHeight - this._dotSize);

		return { x, y };
	}

	_getRandomPosWithinCircleField()
	{
		const fieldRadius = this._size_px[ 0 ] * 0.5 - this._dotSize * 0.5;
		const f = Math.random() * 2 * Math.PI - Math.PI;
		const r = Math.random();
		const x = Math.cos(f) * fieldRadius * r + this._size_px[0] * 0.5;
		const y = Math.sin(f) * fieldRadius * r + this._size_px[1] * 0.5;

		return { x, y };
	}

	_configureDot()
	{
		const positioningFunc = this._positioningFunctions[ this._fieldShape ];

		return {
			position: positioningFunc.call(this),
			lifetime: Math.random() * this._dotLife
		};
	}

	_spawnDots()
	{
		let i;
		let dot;
		let dotConfig;
		const coherentDots = Math.round(this._coherence * this._nDots);

		for (i = 0; i < this._nDots; i ++)
		{
			// TODO: ensure this is an optimal way to do this.
			dot = new PIXI.Graphics();
			dot.beginFill(0xffffff);
			dot.arc(0, 0, this._dotSize * 0.5, 0, Math.PI * 2);
			dot.endFill();
			dotConfig = this._configureDot();
			dot.x = dotConfig.position.x;
			dot.y = dotConfig.position.y;
			this._pixi.addChild(dot);
			this._dotsLife[ i ] = dotConfig.lifetime;
			this._dotsDir[ i ] = this._dir;
			if (i > coherentDots)
			{
				this._dotsDir[ i ] = Math.random() * 360;
			}
		}
	}

	_updateDots()
	{
		let dotConfig;
		let i;
		for (i = 0; i < this._nDots; i++)
		{
			// Ignore lifetime dot updates if initial dotLife setting was explicitly set to 0.
			if (this._dotLife > 0)
			{
				this._dotsLife[ i ] = Math.max(0, this._dotsLife[ i ] - 1);
				if (this._dotsLife[ i ] === 0)
				{
					dotConfig = this._configureDot();
					this._pixi.children[ i ].x = dotConfig.position.x;
					this._pixi.children[ i ].y = dotConfig.position.y;
					this._dotsLife[ i ] = dotConfig.lifetime;
				}
			}

			// Move dots.
			if (this._noiseDots === "direction")
			{
				const x = Math.cos(this._dotsDir[ i ] * Math.PI / 180);
				const y = Math.sin(this._dotsDir[ i ] * Math.PI / 180);

				// TODO: ensure this is adequate conversion of speed.
				const speed_px = util.to_px([ this._speed, this._speed ], this.units, this.win)[ 0 ];

				this._pixi.children[ i ].x += x * speed_px;
				this._pixi.children[ i ].y += y * speed_px;
			}

			// Field bounds check.
			if (this._fieldShape === "sqr")
			{
				if (this._pixi.children[ i ].x < 0 ||
					this._pixi.children[ i ].y < 0 ||
					this._pixi.children[ i ].x + this._dotSize > this._size_px[ 0 ] ||
					this._pixi.children[ i ].y + this._dotSize > this._size_px[ 1 ])
				{
					// Reset position if out of bounds.
					dotConfig = this._configureDot();
					this._pixi.children[ i ].x = dotConfig.position.x;
					this._pixi.children[ i ].y = dotConfig.position.y;
				}
			}
			else if (this._fieldShape === "circle")
			{
				// Shift positions back to the origin for ease of calculations.
				const x = this._pixi.children[ i ].x - this._size_px[ 0 ] * 0.5;
				const y = this._pixi.children[ i ].y - this._size_px[ 1 ] * 0.5;
				const l = Math.sqrt(x * x + y * y);
				const r = this._size_px[ 0 ] * 0.5;

				if (l > r)
				{
					// Reset position if out of bounds.
					dotConfig = this._configureDot();
					this._pixi.children[ i ].x = dotConfig.position.x;
					this._pixi.children[ i ].y = dotConfig.position.y;
				}
			}
		}
	}

	/**
	 * Setter for the mask attribute.
	 *
	 * @param {HTMLImageElement | string} mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMask(mask, log = false)
	{
		const response = {
			origin: "DotStim.setMask",
			context: "when setting the mask of DotStim: " + this._name,
		};

		try
		{
			// mask is undefined: that's fine but we raise a warning in case this is a sympton of an actual problem
			if (typeof mask === "undefined")
			{
				this.psychoJS.logger.warn("setting the mask of DotStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the mask of DotStim: " + this._name + " as: undefined");
			}
			else
			{
				// mask is a string: it should be the name of a resource, which we load
				if (typeof mask === "string")
				{
					mask = this.psychoJS.serverManager.getResource(mask);
				}

				// mask should now be an actual HTMLImageElement: we raise an error if it is not
				if (!(mask instanceof HTMLImageElement))
				{
					throw "the argument: " + mask.toString() + " is not an image\" }";
				}

				this.psychoJS.logger.debug("set the mask of DotStim: " + this._name + " as: src= " + mask.src + ", size= " + mask.width + "x" + mask.height);
			}

			this._setAttribute("mask", mask, log);

			this._onChange(true, false)();
		}
		catch (error)
		{
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Get the size of the display image, which is either that of the DotStim or that of the image
	 * it contains.
	 *
	 * @protected
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this._size;

		if (typeof displaySize === "undefined")
		{
			// use the size of the pixi element, if we have access to it:
			if (typeof this._pixi !== "undefined" && this._pixi.width > 0)
			{
				const pixiContainerSize = [this._pixi.width, this._pixi.height];
				displaySize = util.to_unit(pixiContainerSize, "pix", this.win, this.units);
			}
		}

		return displaySize;
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		const size = this._getDisplaySize();
		if (typeof size !== "undefined")
		{
			this._boundingBox = new PIXI.Rectangle(
				this._pos[0] - size[0] / 2,
				this._pos[1] - size[1] / 2,
				size[0],
				size[1],
			);
		}
	}

	/**
	 * Set color space value for the grating stimulus.
	 *
	 * @param {String} colorSpaceVal - color space value
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setColorSpace (colorSpaceVal = "RGB", log = false)
	{
		let colorSpaceValU = colorSpaceVal.toUpperCase();
		if (Color.COLOR_SPACE[colorSpaceValU] === undefined)
		{
			colorSpaceValU = "RGB";
		}
		const hasChanged = this._setAttribute("colorSpace", colorSpaceValU, log);
		if (hasChanged)
		{
			this.setColor(this._color);
		}
	}

	/**
	 * Set foreground color value for the grating stimulus.
	 *
	 * @param {Color} colorVal - color value, can be String like "red" or "#ff0000" or Number like 0xff0000.
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setColor (colorVal = "white", log = false)
	{
		const colorObj = (colorVal instanceof Color) ? colorVal : new Color(colorVal, Color.COLOR_SPACE[this._colorSpace])
		this._setAttribute("color", colorObj, log);
		// TODO: update dots?
	}

	/**
	 * Determines how visible the stimulus is relative to background.
	 *
	 * @param {number} [opacity=1] opacity - The value should be a single float ranging 1.0 (opaque) to 0.0 (transparent).
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setOpacity (opacity = 1, log = false)
	{
		this._setAttribute("opacity", opacity, log);
		if (this._pixi)
		{
			this._pixi.opacity = opacity;
		}
	}

	/**
	 * Set blend mode of the grating stimulus.
	 *
	 * @param {String} blendMode - blend mode, can be one of the following: ["avg", "add", "mul", "screen"].
	 * @param {boolean} [log=false] - whether or not to log
	 */
	setBlendmode (blendMode = "avg", log = false)
	{
		this._setAttribute("blendmode", blendMode, log);
		if (this._pixi !== undefined)
		{
			let pixiBlendMode = DotStim.#BLEND_MODES_MAP[blendMode];
			if (pixiBlendMode === undefined)
			{
				pixiBlendMode = PIXI.BLEND_MODES.NORMAL;
			}
			if (this._pixi.filters)
			{
				this._pixi.filters[this._pixi.filters.length - 1].blendMode = pixiBlendMode;
			}
			else
			{
				this._pixi.blendMode = pixiBlendMode;
			}
		}
	}

	/**
	 * Whether to interpolate (linearly) the texture in the stimulus.
	 *
	 * @param {boolean} interpolate - interpolate or not.
	 * @param {boolean} [log=false] - whether or not to log
	 */
	setInterpolate (interpolate = false, log = false)
	{
		this._setAttribute("interpolate", interpolate, log);
	}

	/**
	 * Setter for the anchor attribute.
	 *
	 * @param {string} anchor - anchor of the stim
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setAnchor (anchor = "center", log = false)
	{
		this._setAttribute("anchor", anchor, log);
		if (this._pixi !== undefined)
		{
			const anchorNum = this._anchorTextToNum(this._anchor);
			this._pixi.pivot.x = anchorNum[0] * this._pixi.scale.x * this._size_px[0];
			this._pixi.pivot.y = anchorNum[1] * this._pixi.scale.y * this._size_px[1];
		}
	}

	setCoherence(c = 1, log = false)
	{
		const coherence = Math.max(0, Math.min(1, c));
		this._setAttribute("coherence", coherence, log);
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		// Always update dots.
		this._updateDots();

		// if (!this._needUpdate)
		// {
		// 	return;
		// }

		// this._needUpdate = false;

		// if (this._needPixiUpdate)
		// {
		// 	this._needPixiUpdate = false;
		// }

		this._size_px = util.to_px(this._size, this.units, this.win);
		this._pixi.zIndex = -this._depth;
		this.opacity = this._opacity;
		this.anchor = this._anchor;

		// set the scale:
		this._pixi.scale.x = 1;
		this._pixi.scale.y = 1;

		let pos = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.position.set(pos.x, pos.y);
		this._pixi.rotation = -this.ori * Math.PI / 180;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}
}
