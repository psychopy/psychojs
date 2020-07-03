/**
 * Image Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
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
 * @param {Color} [options.color= Color('white')] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth
 * @param {number} [options.texRes= 128] - the resolution of the text
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class ImageStim extends util.mix(VisualStim).with(ColorMixin)
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
								color = new Color('white'),
								opacity = 1.0,
								contrast = 1.0,
								texRes = 128,
								depth = 0,
								interpolate = false,
								flipHoriz = false,
								flipVert = false,
								autoDraw,
								autoLog
							} = {})
	{
		super({name, win, units, ori, opacity, pos, size, autoDraw, autoLog});

		this.psychoJS.logger.debug('create a new ImageStim with name: ', name);

		this._addAttributes(ImageStim, image, mask, color, contrast, texRes, interpolate, depth, flipHoriz, flipVert);

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

			this._needUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Setter for the mask attribute.
	 *
	 * @name module:visual.ImageStim#setImage
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

			this._needUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Setter for the flipVert attribute.
	 *
	 * @name module:visual.ImageStim#setFlipVert
	 * @public
	 * @param {boolean} flipVert - whether or not to flip vertically
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipVert(flipVert, log = false)
	{
		this._setAttribute('flipVert', flipVert, log);

		this._needUpdate = true;
	}


	/**
	 * Setter for the flipHoriz attribute.
	 *
	 * @name module:visual.ImageStim#setFlipHoriz
	 * @public
	 * @param {boolean} flipHoriz - whether or not to flip horizontally
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipHoriz(flipHoriz, log = false)
	{
		this._setAttribute('flipHoriz', flipHoriz, log);

		this._needUpdate = true;
	}


	/**
	 * Determine whether the given object is inside this image.
	 *
	 * @name module:visual.ImageStim#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the image contains the object
	 */
	contains(object, units)
	{
		if (typeof this._image === 'undefined')
		{
			return false;
		}

		// get position of object:
		let objectPos_px = util.getPositionFromObject(object, units);
		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'ImageStim.contains',
				context: 'when determining whether ImageStim: ' + this._name + ' contains object: ' + util.toString(object),
				error: 'unable to determine the position of the object'
			};
		}

		// test for inclusion:
		// note: since _pixi.anchor is [0.5, 0.5] the image is actually centered on pos
		let pos_px = util.to_px(this.pos, this.units, this._win);
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this._win);
		const polygon_px = [
			[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2],
			[pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2],
			[pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2],
			[pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];

		return util.IsPointInsidePolygon(objectPos_px, polygon_px);
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

		this._pixi = undefined;

		// no image to draw: return immediately
		if (typeof this._image === 'undefined')
		{
			return;
		}

		// prepare the image:
		this._texture = new PIXI.Texture(new PIXI.BaseTexture(this._image));
		//this._texture = new PIXI.Texture(PIXI.BaseTexture.fromImage(this._image));
		this._pixi = new PIXI.Sprite(this._texture);
		this._pixi.zOrder = this.depth;

		// add a mask if need be:
		if (typeof this._mask !== 'undefined')
		{
			this._maskTexture = new PIXI.Texture(new PIXI.BaseTexture(this._mask));
			this._pixi.mask = new PIXI.Sprite(this._maskTexture); //PIXI.Sprite.fromImage(this._mask);

			// the following is required for the mask to be aligned with the image
			this._pixi.mask.anchor.x = 0.5;
			this._pixi.mask.anchor.y = 0.5;
			this._pixi.addChild(this._pixi.mask);
		}

		// since _texture.width may not be immediately available but the rest of the code needs its value
		// we arrange for repeated calls to _updateIfNeeded until we have a width:
		if (this._texture.width === 0)
		{
			this._needUpdate = true;
			return;
		}

		this._pixi.alpha = this.opacity;


		// const colorFilter = new PIXI.filters.ColorMatrixFilter();
		// colorFilter.matrix[0] = 2;
		// colorFilter.matrix[6] = 1;
		// colorFilter.matrix[12] = 1;
		// // colorFilter.alpha = 1;
		// colorFilter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
		// console.log(colorFilter.matrix);
		// this._pixi.filters = [colorFilter];


		// stimulus size:
		// note: we use the size of the texture if ImageStim has no specified size:
		const displaySize = this._getDisplaySize();

		// set the scale:
		const size_px = util.to_px(displaySize, this.units, this.win);
		var scaleX = size_px[0] / this._texture.width;
		var scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;
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
			const textureSize = [this._texture.width, this._texture.height];
			displaySize = util.to_unit(textureSize, 'pix', this.win, this.units);
		}

		return displaySize;
	}


}
