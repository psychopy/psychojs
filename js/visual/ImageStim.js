/**
 * Image Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import * as util from '../util/Util';


/**
 * Image Stimulus.
 *
 * @name module:visual.ImageStim
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
export class ImageStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({name, win, image, mask, pos, units, ori, size, color, opacity, contrast, texRes, depth, interpolate, flipHoriz, flipVert, autoDraw, autoLog} = {})
	{
		super({name, win, units, ori, opacity, depth, pos, size, autoDraw, autoLog});

		this._addAttribute(
			'image',
			image
		);
		this._addAttribute(
			'mask',
			mask
		);
		this._addAttribute(
			'color',
			color,
			'white',
			this._onChange(true, false)
		);
		this._addAttribute(
			'contrast',
			contrast,
			1.0,
			this._onChange(true, false)
		);
		this._addAttribute(
			'texRes',
			texRes,
			128,
			this._onChange(true, false)
		);
		this._addAttribute(
			'interpolate',
			interpolate,
			false,
			this._onChange(true, false)
		);
		this._addAttribute(
			'flipHoriz',
			flipHoriz,
			false,
			this._onChange(false, false)
		);
		this._addAttribute(
			'flipVert',
			flipVert,
			false,
			this._onChange(false, false)
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
	 * @name module:visual.ImageStim#setImage
	 * @public
	 * @param {HTMLImageElement | string} image - the name of the image resource or HTMLImageElement corresponding to the image
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setImage(image, log = false)
	{
		const response = {
			origin: 'ImageStim.setImage',
			context: 'when setting the image of ImageStim: ' + this._name
		};

		try
		{
			// image is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof image === 'undefined')
			{
				this.psychoJS.logger.warn('setting the image of ImageStim: ' + this._name + ' with argument: undefined.');
				this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: undefined');
			}
			else
			{
				// image is a string: it should be the name of a resource, which we load
				if (typeof image === 'string')
				{
					image = this.psychoJS.serverManager.getResource(image);
				}

				// image should now be an actual HTMLImageElement: we raise an error if it is not
				if (!(image instanceof HTMLImageElement))
				{
					throw 'the argument: ' + image.toString() + ' is not an image" }';
				}

				this.psychoJS.logger.debug('set the image of ImageStim: ' + this._name + ' as: src= ' + image.src + ', size= ' + image.width + 'x' + image.height);
			}

			this._setAttribute('image', image, log);

			this._onChange(true, true)();
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}



	/**
	 * Setter for the mask attribute.
	 *
	 * @name module:visual.ImageStim#setMask
	 * @public
	 * @param {HTMLImageElement | string} mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMask(mask, log = false)
	{
		const response = {
			origin: 'ImageStim.setMask',
			context: 'when setting the mask of ImageStim: ' + this._name
		};

		try
		{
			// mask is undefined: that's fine but we raise a warning in case this is a sympton of an actual problem
			if (typeof mask === 'undefined')
			{
				this.psychoJS.logger.warn('setting the mask of ImageStim: ' + this._name + ' with argument: undefined.');
				this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: undefined');
			}
			else
			{
				// mask is a string: it should be the name of a resource, which we load
				if (typeof mask === 'string')
				{
					mask = this.psychoJS.serverManager.getResource(mask);
				}

				// mask should now be an actual HTMLImageElement: we raise an error if it is not
				if (!(mask instanceof HTMLImageElement))
				{
					throw 'the argument: ' + mask.toString() + ' is not an image" }';
				}

				this.psychoJS.logger.debug('set the mask of ImageStim: ' + this._name + ' as: src= ' + mask.src + ', size= ' + mask.width + 'x' + mask.height);
			}

			this._setAttribute('mask', mask, log);

			this._onChange(true, false)();
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.ImageStim#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		const size = this._getDisplaySize();
		if (typeof size !== 'undefined')
		{
			this._boundingBox = new PIXI.Rectangle(
				this._pos[0] - size[0] / 2,
				this._pos[1] - size[1] / 2,
				size[0],
				size[1]
			);
		}

		// TODO take the orientation into account
	}



	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.ImageStim#_updateIfNeeded
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

			if (typeof this._pixi !== 'undefined')
			{
				this._pixi.destroy(true);
			}
			this._pixi = undefined;

			// no image to draw: return immediately
			if (typeof this._image === 'undefined')
			{
				return;
			}

			this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image));
			this._pixi = new PIXI.Sprite(this._texture);

			// add a mask if need be:
			if (typeof this._mask !== 'undefined')
			{
				this._maskTexture = new PIXI.Texture(new PIXI.BaseTexture(this._mask));
				this._pixi.mask = new PIXI.Sprite(this._maskTexture);

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

		this._pixi.zIndex = this._depth;
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this.win);
		const scaleX = size_px[0] / this._texture.width;
		const scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}



	/**
	 * Get the size of the display image, which is either that of the ImageStim or that of the image
	 * it contains.
	 *
	 * @name module:visual.ImageStim#_getDisplaySize
	 * @private
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (typeof displaySize === 'undefined')
		{
			// use the size of the texture, if we have access to it:
			if (typeof this._texture !== 'undefined' && this._texture.width > 0)
			{
				const textureSize = [this._texture.width, this._texture.height];
				displaySize = util.to_unit(textureSize, 'pix', this.win, this.units);
			}
		}

		return displaySize;
	}


}
