/**
 * Image Stimulus.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import {Camera} from "../hardware";

/**
 * Image Stimulus.
 *
 * @extends VisualStim
 * @mixes ColorMixin
 */
export class ImageStim extends util.mix(VisualStim).with(ColorMixin)
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {string | HTMLImageElement} options.image - the name of the image resource or the HTMLImageElement corresponding to the image
	 * @param {string | HTMLImageElement} options.mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
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
	 * @param {ImageStim.AspectRatioStrategy} [options.aspectRatio= ImageStim.AspectRatioStrategy.VARIABLE] - the aspect ratio handling strategy
	 * @param {number} [options.blurVal= 0] - the blur value. Goes 0 to as hish as you like. 0 is no blur.
	 */
	constructor({
		name,
		win,
		image,
		mask,
		pos,
		anchor,
		units,
		ori,
		size,
		color,
		opacity,
		contrast,
		texRes,
		depth,
		interpolate,
		flipHoriz,
		flipVert,
		autoDraw,
		autoLog,
		aspectRatio,
		blurVal
	} = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, anchor, size, autoDraw, autoLog });

		// Holds an instance of PIXI blur filter. Used if blur value is passed.
		this._blurFilter = undefined;

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
			"aspectRatio",
			aspectRatio,
			ImageStim.AspectRatioStrategy.VARIABLE,
			this._onChange(true, true),
		);
		this._addAttribute(
			"blurVal",
			blurVal,
			0
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
	 * @param {HTMLImageElement | string} image - the name of the image resource or HTMLImageElement corresponding to the image
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setImage(image, log = false)
	{
		const response = {
			origin: "ImageStim.setImage",
			context: "when setting the image of ImageStim: " + this._name,
		};

		try
		{
			// image is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof image === "undefined")
			{
				this.psychoJS.logger.warn("setting the image of ImageStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the image of ImageStim: " + this._name + " as: undefined");
			}
			else
			{
				// image is a string: it should be the name of a resource, which we load
				if (typeof image === "string")
				{
					image = this.psychoJS.serverManager.getResource(image);
				}

				if (image instanceof Camera)
				{
					const video = image.getVideo();
					// TODO remove previous one if there is one
					// document.body.appendChild(video);
					image = video;
				}

				// image should now be either an HTMLImageElement or an HTMLVideoElement:
				if (image instanceof HTMLImageElement)
				{
					this.psychoJS.logger.debug("set the image of ImageStim: " + this._name + " as: src= " + image.src + ", size= " + image.width + "x" + image.height);
				}
				else if (image instanceof HTMLVideoElement)
				{
					this.psychoJS.logger.debug(`set the image of ImageStim: ${this._name} as: src= ${image.src}, size= ${image.videoWidth}x${image.videoHeight}, duration= ${image.duration}s`);
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
	 * @param {HTMLImageElement | string} mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMask(mask, log = false)
	{
		const response = {
			origin: "ImageStim.setMask",
			context: "when setting the mask of ImageStim: " + this._name,
		};

		try
		{
			// mask is undefined: that's fine but we raise a warning in case this is a sympton of an actual problem
			if (typeof mask === "undefined")
			{
				this.psychoJS.logger.warn("setting the mask of ImageStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the mask of ImageStim: " + this._name + " as: undefined");
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

				this.psychoJS.logger.debug("set the mask of ImageStim: " + this._name + " as: src= " + mask.src + ", size= " + mask.width + "x" + mask.height);
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

	setBlurVal (blurVal = 0, log = false)
	{
		this._setAttribute("blurVal", blurVal, log);
		if (this._pixi instanceof PIXI.Sprite)
		{
			if (this._blurFilter === undefined)
			{
				this._blurFilter = new PIXI.filters.BlurFilter();
				this._blurFilter.blur = blurVal;
			}
			else
			{
				this._blurFilter.blur = blurVal;
			}

			// this._pixi might get destroyed and recreated again with no filters.
			if (this._pixi.filters instanceof Array && this._pixi.filters.indexOf(this._blurFilter) === -1)
			{
				this._pixi.filters.push(this._blurFilter);
			}
			else
			{
				this._pixi.filters = [this._blurFilter];
			}
		}
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

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
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
				this._pixi.filters = null;
				this._pixi.destroy(true);
			}
			this._pixi = undefined;

			// no image to draw: return immediately
			if (typeof this._image === "undefined")
			{
				return;
			}

			// deal with both static images and videos:
			if (this._image instanceof HTMLImageElement)
			{
				// Not using PIXI.Texture.from() on purpose, as it caches both PIXI.Texture and PIXI.BaseTexture.
				// As a result of that we can have multiple ImageStim instances using same PIXI.BaseTexture,
				// thus changing texture related properties like interpolation, or calling _pixi.destroy(true)
				// will affect all ImageStims who happen to share that BaseTexture.
				const texOpts =
				{
					scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST
				};
				this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image, texOpts));
			}
			else if (this._image instanceof HTMLVideoElement)
			{
				const texOpts =
				{
					resourceOptions: { autoPlay: true },
					scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST
				};
				this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image, texOpts));
			}

			if (this.aspectRatio === ImageStim.AspectRatioStrategy.HORIZONTAL_TILING)
			{
				const [width_px, _] = util.to_px([this.size[0], 0], this.units, this.win);
				this._pixi = PIXI.TilingSprite.from(this._texture, 1, 1);
				this._pixi.width = width_px;
				this._pixi.height = this._texture.height;
			}
			else
			{
				this._pixi = PIXI.Sprite.from(this._texture);
			}


			// add a mask if need be:
			if (typeof this._mask !== "undefined")
			{
				// Building new PIXI.BaseTexture each time we create a mask. See notes on this._texture creation above.
				this._pixi.mask = PIXI.Sprite.from(new PIXI.Texture(new PIXI.BaseTexture(this._mask)));

				// a 0.5, 0.5 anchor is required for the mask to be aligned with the image
				this._pixi.mask.anchor.x = 0.5;
				this._pixi.mask.anchor.y = 0.5;

				this._pixi.addChild(this._pixi.mask);
			}

			// since _texture.width may not be immediately available but the rest of the code needs its value
			// we arrange for repeated calls to _updateIfNeeded until we have a width:
			if (this._texture.width === 0)
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
		let scaleX = size_px[0] / this._texture.width;
		let scaleY = size_px[1] / this._texture.height;
		if (this.aspectRatio === ImageStim.AspectRatioStrategy.FIT_TO_WIDTH)
		{
			scaleY = scaleX;
		}
		else if (this.aspectRatio === ImageStim.AspectRatioStrategy.FIT_TO_HEIGHT)
		{
			scaleX = scaleY;
		}
		else if (this.aspectRatio === ImageStim.AspectRatioStrategy.HORIZONTAL_TILING)
		{
			scaleX = 1.0;
			scaleY = 1.0;
		}

		// note: this calls VisualStim.setAnchor, which properly sets the PixiJS anchor
		// from the PsychoPy text format
		this.anchor = this._anchor;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;

		if (this._blurVal > 0)
		{
			this.setBlurVal(this._blurVal);
		}

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}

	/**
	 * Get the size of the display image, which is either that of the ImageStim or that of the image
	 * it contains.
	 *
	 * @protected
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (typeof displaySize === "undefined")
		{
			// use the size of the texture, if we have access to it:
			if (typeof this._texture !== "undefined" && this._texture.width > 0)
			{
				const textureSize = [this._texture.width, this._texture.height];
				displaySize = util.to_unit(textureSize, "pix", this.win, this.units);
			}
		}
		else
		{
			if (this.aspectRatio === ImageStim.AspectRatioStrategy.FIT_TO_WIDTH)
			{
				// use the size of the texture, if we have access to it:
				if (typeof this._texture !== "undefined" && this._texture.width > 0)
				{
					displaySize = [displaySize[0], displaySize[0] * this._texture.height / this._texture.width];
				}
			}
			else if (this.aspectRatio === ImageStim.AspectRatioStrategy.FIT_TO_HEIGHT)
			{
				// use the size of the texture, if we have access to it:
				if (typeof this._texture !== "undefined" && this._texture.width > 0)
				{
					displaySize = [displaySize[1] * this._texture.width / this._texture.height, displaySize[1]];
				}
			}
			else if (this.aspectRatio === ImageStim.AspectRatioStrategy.HORIZONTAL_TILING)
			{
				// use the size of the texture, if we have access to it:
				if (typeof this._texture !== "undefined" && this._texture.width > 0)
				{
					displaySize = [displaySize[0], this._texture.height];
				}
			}
		}

		return displaySize;
	}
}

/**
 * ImageStim Aspect Ratio Strategy.
 *
 * @enum {Symbol}
 * @readonly
 */
ImageStim.AspectRatioStrategy = {
	FIT_TO_WIDTH: Symbol.for("FIT_TO_WIDTH"),
	HORIZONTAL_TILING: Symbol.for("HORIZONTAL_TILING"),
	FIT_TO_HEIGHT: Symbol.for("FIT_TO_HEIGHT"),
	VARIABLE: Symbol.for("VARIABLE"),
};
