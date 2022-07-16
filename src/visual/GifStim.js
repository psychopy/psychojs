/**
 * Gif Stimulus.
 *
 * @author Nikita Agafonov
 * @version 2022.2.0
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import {Camera} from "../hardware";
// import { parseGIF, decompressFrames } from "gifuct-js";
import { AnimatedGIF } from "./AnimatedGIF.js";
import { parseGIF, decompressFrames, decompressFramesContiguous } from "../util/GifParser.js";

/**
 * Gif Stimulus.
 *
 * @name module:visual.GifStim
 * @class
 * @extends VisualStim
 * @mixes ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {string | HTMLImageElement} options.image - the name of the image resource or the HTMLImageElement corresponding to the image
 * @param {string | HTMLImageElement} options.mask - the name of the mask resource or HTMLImageElement corresponding to the mask
 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
 * @param {Color} [options.color= 'white'] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.texRes= 128] - the resolution of the text
 * @param {boolean} [options.loop= true] - whether or not to loop the animation
 * @param {boolean} [options.autoPlay= true] - whether or not to autoPlay the animation
 * @param {boolean} [options.animationSpeed= 1] - animation speed, works as multiplyer e.g. 1 - normal speed, 0.5 - half speed, 2 - twice as fast etc.
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class GifStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
		name,
		win,
		image,
		mask,
		pos,
		units,
		ori,
		size,
		color,
		opacity,
		contrast,
		texRes,
		depth,
		interpolate,
		loop,
		autoPlay,
		animationSpeed,
		flipHoriz,
		flipVert,
		autoDraw,
		autoLog
	} = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, size, autoDraw, autoLog });

		this._resource = undefined;

		this._addAttribute(
			"image",
			image,
		);
		this._addAttribute(
			"mask",
			mask,
		);
		this._addAttribute(
			"color",
			color,
			"white",
			this._onChange(true, false),
		);
		this._addAttribute(
			"contrast",
			contrast,
			1.0,
			this._onChange(true, false),
		);
		this._addAttribute(
			"texRes",
			texRes,
			128,
			this._onChange(true, false),
		);
		this._addAttribute(
			"interpolate",
			interpolate,
			false
		);
		this._addAttribute(
			"flipHoriz",
			flipHoriz,
			false,
			this._onChange(false, false),
		);
		this._addAttribute(
			"flipVert",
			flipVert,
			false,
			this._onChange(false, false),
		);
		this._addAttribute(
			"loop",
			loop,
			true
		);
		this._addAttribute(
			"autoPlay",
			autoPlay,
			true
		);
		this._addAttribute(
			"animationSpeed",
			animationSpeed,
			1
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Getter for the playing property.
	 *
	 * @name module:visual.GifStim#isPlaying
	 * @public
	 */
	get isPlaying ()
	{
		if (this._pixi)
		{
			return this._pixi.playing;
		}
		return false;
	}

	/**
	 * Getter for the duration property. Shows animation duration time in milliseconds.
	 *
	 * @name module:visual.GifStim#duration
	 * @public
	 */
	get duration ()
	{
		if (this._pixi)
		{
			return this._pixi.duration;
		}
	}

	/**
	 * Starts GIF playback.
	 *
	 * @name module:visual.GifStim#play
	 * @public
	 */
	play ()
	{
		if (this._pixi)
		{
			this._pixi.play();
		}
	}

	/**
	 * Pauses GIF playback.
	 *
	 * @name module:visual.GifStim#pause
	 * @public
	 */
	pause ()
	{
		if (this._pixi)
		{
			this._pixi.stop();
		}
	}

	/**
	 * Set wether or not to loop the animation.
	 *
	 * @name module:visual.GifStim#setLoop
	 * @public
	 * @param {boolean} [loop=true] - flag value
	 * @param {boolean} [log=false] - whether or not to log.
	 */
	setLoop (loop, log = false)
	{
		this._setAttribute("loop", loop, log);
		if (this._pixi)
		{
			this._pixi.loop = loop;
		}
	}

	/**
	 * Set wether or not to autoplay the animation.
	 *
	 * @name module:visual.GifStim#setAutoPlay
	 * @public
	 * @param {boolean} [autoPlay=true] - flag value
	 * @param {boolean} [log=false] - whether or not to log.
	 */
	setAutoPlay (autoPlay, log = false)
	{
		this._setAttribute("autoPlay", autoPlay, log);
		if (this._pixi)
		{
			this._pixi.autoPlay = autoPlay;
		}
	}

	/**
	 * Set animation speed of the animation.
	 *
	 * @name module:visual.GifStim#setAnimationSpeed
	 * @public
	 * @param {boolean} [animationSpeed=1] - multiplyer of the animation speed e.g. 1 - normal, 0.5 - half speed, 2 - twice as fast.
	 * @param {boolean} [log=false] - whether or not to log.
	 */
	setAnimationSpeed (animationSpeed = 1, log = false)
	{
		this._setAttribute("animationSpeed", animationSpeed, log);
		if (this._pixi)
		{
			this._pixi.animationSpeed = animationSpeed;
		}
	}

	/**
	 * Setter for the image attribute.
	 *
	 * @name module:visual.GifStim#setImage
	 * @public
	 * @param {HTMLImageElement | string} image - the name of the image resource or HTMLImageElement corresponding to the image
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setImage(image, log = false)
	{
		const response = {
			origin: "GifStim.setImage",
			context: "when setting the image of GifStim: " + this._name,
		};

		try
		{
			// image is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof image === "undefined")
			{
				this.psychoJS.logger.warn("setting the image of GifStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the image of GifStim: " + this._name + " as: undefined");
			}
			else if (typeof image === "string")
			{
				// image is a string: it should be the name of a resource, which we load
				const fullRD = this.psychoJS.serverManager.getFullResourceData(image);
				console.log("gif resource", fullRD);
				if (fullRD.cachedData === undefined)
				{
					// How GIF works: http://www.matthewflickinger.com/lab/whatsinagif/animation_and_transparency.asp
					let t0 = performance.now();
					let parsedGif = parseGIF(fullRD.data);
					let pt = performance.now() - t0;
					let t2 = performance.now();
					let decompressedFrames = decompressFrames(parsedGif, false);
					let dect = performance.now() - t2;
					this._resource = { parsedGif, decompressedFrames };
					this.psychoJS.serverManager.cacheResourceData(image, this._resource);
					// let t2c = performance.now();
					// let pixels2 = decompressFramesContiguous(gif, false);
					// window.pixels2 = pixels2;
					// let dect2 = performance.now() - t2c;
					console.log(`animated gif "${this._name}",`, "parse=", pt, "decompress=", dect);
				}
				else
				{
					this._resource = fullRD.cachedData;
				}

				// this.psychoJS.logger.debug(`set resource of GifStim: ${this._name} as ArrayBuffer(${this._resource.length})`);
				const hasChanged = this._setAttribute("image", image, log);
				if (hasChanged)
				{
					this._onChange(true, true)();
				}
			}
		}
		catch (error)
		{
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Setter for the mask attribute.
	 *
	 * @name module:visual.GifStim#setMask
	 * @public
	 * @param {HTMLImageElement | string} mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMask(mask, log = false)
	{
		const response = {
			origin: "GifStim.setMask",
			context: "when setting the mask of GifStim: " + this._name,
		};

		try
		{
			// mask is undefined: that's fine but we raise a warning in case this is a sympton of an actual problem
			if (typeof mask === "undefined")
			{
				this.psychoJS.logger.warn("setting the mask of GifStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the mask of GifStim: " + this._name + " as: undefined");
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
					throw "the argument: " + mask.toString() + ' is not an image" }';
				}

				this.psychoJS.logger.debug("set the mask of GifStim: " + this._name + " as: src= " + mask.src + ", size= " + mask.width + "x" + mask.height);
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
	 * Whether to interpolate (linearly) the texture in the stimulus.
	 *
	 * @name module:visual.GifStim#setInterpolate
	 * @public
	 * @param {boolean} interpolate - interpolate or not.
	 * @param {boolean} [log=false] - whether or not to log
	 */
	setInterpolate (interpolate = false, log = false)
	{
		this._setAttribute("interpolate", interpolate, log);
		if (this._pixi instanceof PIXI.Sprite) {
			this._pixi.texture.baseTexture.scaleMode = interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST;
			this._pixi.texture.baseTexture.update();
		}
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.GifStim#_estimateBoundingBox
	 * @function
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

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.GifStim#_updateIfNeeded
	 * @private
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		// update the PIXI representation, if need be:
		if (this._needPixiUpdate)
		{
			this._needPixiUpdate = false;

			if (typeof this._pixi !== "undefined")
			{
				this._pixi.destroy(true);
			}
			this._pixi = undefined;

			// no image to draw: return immediately
			if (typeof this._resource === "undefined")
			{
				return;
			}

			const gifOpts =
			{
				generateFullFrames: false,
				scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST,
				loop: this._loop,
				autoPlay: this._autoPlay,
				animationSpeed: this._animationSpeed
			};

			let t = performance.now();
			this._pixi = new AnimatedGIF(
				this._resource.decompressedFrames,
				{ width: this._resource.parsedGif.lsd.width, height: this._resource.parsedGif.lsd.height, ...gifOpts }
			);
			console.log(`animatedGif "${this._name}" instancing:`, performance.now() - t);

			// add a mask if need be:
			if (typeof this._mask !== "undefined")
			{
				// Building new PIXI.BaseTexture each time we create a mask, to avoid PIXI's caching and use a unique resource.
				this._pixi.mask = PIXI.Sprite.from(new PIXI.Texture(new PIXI.BaseTexture(this._mask)));

				// a 0.5, 0.5 anchor is required for the mask to be aligned with the image
				this._pixi.mask.anchor.x = 0.5;
				this._pixi.mask.anchor.y = 0.5;

				this._pixi.addChild(this._pixi.mask);
			}

			// since _texture.width may not be immediately available but the rest of the code needs its value
			// we arrange for repeated calls to _updateIfNeeded until we have a width:
			if (this._pixi.texture.width === 0)
			{
				this._needUpdate = true;
				this._needPixiUpdate = true;
				return;
			}

			// const colorFilter = new PIXI.filters.ColorMatrixFilter();
			// colorFilter.matrix[0] = 2;
			// colorFilter.matrix[6] = 1;
			// colorFilter.matrix[12] = 1;
			// // colorFilter.alpha = 1;
			// colorFilter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
			// console.log(colorFilter.matrix);
			// this._pixi.filters = [colorFilter];
		}

		this._pixi.zIndex = -this._depth;
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this.win);
		const scaleX = size_px[0] / this._pixi.texture.width;
		const scaleY = size_px[1] / this._pixi.texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}

	/**
	 * Get the size of the display image, which is either that of the GifStim or that of the image
	 * it contains.
	 *
	 * @name module:visual.GifStim#_getDisplaySize
	 * @private
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (this._pixi && typeof displaySize === "undefined")
		{
			// use the size of the texture, if we have access to it:
			if (typeof this._pixi.texture !== "undefined" && this._pixi.texture.width > 0)
			{
				const textureSize = [this._pixi.texture.width, this._pixi.texture.height];
				displaySize = util.to_unit(textureSize, "pix", this.win, this.units);
			}
		}

		return displaySize;
	}
}
