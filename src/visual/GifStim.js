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
import { AnimatedGIF } from "@pixi/gif";
import { parseGIF, decompressFrames } from "gifuct-js";

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
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class GifStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({ name, win, image, mask, pos, units, ori, size, color, opacity, contrast, texRes, depth, interpolate, flipHoriz, flipVert, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, size, autoDraw, autoLog });

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

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Setter for the image attribute.
	 *
	 * @name module:visual.GifStim#setImage
	 * @public
	 * @param {HTMLImageElement | string} image - the name of the image resource or HTMLImageElement corresponding to the image
	 * @param {boolean} [log= false] - whether of not to log
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
			else
			{
				// image is a string: it should be the name of a resource, which we load
				if (typeof image === "string")
				{
					image = this.psychoJS.serverManager.getResource(image);
				}

				if (image instanceof ArrayBuffer)
				{
					this.psychoJS.logger.debug(`set the image of GifStim: ${this._name} as ArrayBuffer(${image.length})`);
				}
				else
				{
					throw "the argument: " + image.toString() + ' is neither an image nor a video" }';
				}
			}

			const existingImage = this.getImage();
			const hasChanged = existingImage ? existingImage.src !== image.src : true;

			this._setAttribute("image", image, log);

			if (hasChanged)
			{
				this._onChange(true, true)();
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
	setInterpolate (interpolate = false, log = false) {
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
			if (typeof this._image === "undefined")
			{
				return;
			}

			if (this._image instanceof ArrayBuffer)
			{
				const gifOpts =
				{
					scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST
				};
				let t = performance.now();
				// How GIF works: http://www.matthewflickinger.com/lab/whatsinagif/animation_and_transparency.asp
				let gif = parseGIF(this._image);
				let pt = performance.now() - t;
				let t2 = performance.now();
				let frames = decompressFrames(gif, true);
				let dect = performance.now() - t2;
				window.parsedGif = gif;
				window.frames = frames;

				let i, j;
				let patchRow = 0;
				let patchCol = 0;
				let time = 0;
				let idFrames = new Array(frames.length);
				let pixelData = new Uint8ClampedArray(gif.lsd.width * gif.lsd.height * 4);
				let offset = 0;
				let t3 = performance.now();
				for (i = 0; i < frames.length; i++) {
					// offset = (gif.lsd.width * frames[i].dims.top + frames[i].dims.left) * 4;
					// patchRow = 0;
					// pixelData.set(frames[i].patch, offset);
					for (j = 0; j < frames[i].patch.length; j += 4) {
						if (frames[i].patch[j + 3] > 0) {
							patchRow = (j / (frames[i].dims.width * 4)) | 0;
							offset = (gif.lsd.width * (frames[i].dims.top + patchRow) + frames[i].dims.left) * 4;
							patchCol = (j % (frames[i].dims.width * 4));
							pixelData[offset + patchCol] = frames[i].patch[j];
							pixelData[offset + patchCol + 1] = frames[i].patch[j + 1];
							pixelData[offset + patchCol + 2] = frames[i].patch[j + 2];
							pixelData[offset + patchCol + 3] = frames[i].patch[j + 3];
						}
					}
					idFrames[i] = {
						imageData: new ImageData(new Uint8ClampedArray(pixelData), gif.lsd.width, gif.lsd.height),
						start: time,
						end: time + frames[i].delay
					};
					time += frames[i].delay;
				}

				let idcomposet = performance.now() - t3;
				this._pixi = new AnimatedGIF(idFrames, { width: gif.lsd.width, height: gif.lsd.height, ...gifOpts });
				console.log("animated gif, parse=", pt, "decompress=", dect, "id compose=", idcomposet, "total=", performance.now() - t);

				// t = performance.now();
				// this._pixi = AnimatedGIF.fromBuffer(this._image, gifOpts);
				// console.log("pixi animated gif took", performance.now() - t);
			}

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
