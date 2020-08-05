/**
 * Base class for all visual stimuli.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {MinimalStim} from '../core/MinimalStim';
import {WindowMixin} from '../core/WindowMixin';
import * as util from '../util/Util';


/**
 * Base class for all visual stimuli.
 *
 * @name module:visual.VisualStim
 * @class
 * @extends MinimalStim
 * @mixes WindowMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
 * @param {number} [options.size= 1.0] - the size
 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class VisualStim extends util.mix(MinimalStim).with(WindowMixin)
{
	constructor({
								name,
								win,
								units,
								ori = 0.0,
								opacity = 1.0,
								depth = 0,
								pos = [0, 0],
								size,
								clipMask = null,
								autoDraw,
								autoLog
							} = {})
	{
		super({win, name, autoDraw, autoLog});

		this._addAttributes(VisualStim, units, ori, opacity, depth, pos, size, clipMask);

		// bounding box of the stimulus, in stimulus units
		// note: boundingBox does not take the orientation into account
		this._addAttribute('boundingBox', PIXI.Rectangle.EMPTY);

		this._needUpdate = true;

		// the pixi representation needs to be updated:
		this._needPixiUpdate = true;
	}



	/**
	 * Force a refresh of the stimulus.
	 *
	 * refresh() is called, in particular, when the Window is resized.
	 *
	 * @name module:visual.VisualStim#refresh
	 * @public
	 */
	refresh()
	{
		this._needUpdate = true;
		this._needPixiUpdate = true;

		// estimate the bounding box:
		this._estimateBoundingBox();
	}



	/**
	 * Setter for the size attribute.
	 *
	 * @name module:visual.VisualStim#setSize
	 * @public
	 * @param {number | number[]} size - the stimulus size
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setSize(size, log = false)
	{
		// size is either undefined or a tuple of numbers:
		if (typeof size !== 'undefined')
		{
			size = util.toNumerical(size);
			if (!Array.isArray(size))
			{
				size = [size, size];
			}
		}

		const hasChanged = this._setAttribute('size', size, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			// the pixi representation needs to be updated:
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the orientation attribute.
	 *
	 * @name module:visual.VisualStim#setOri
	 * @public
	 * @param {number} ori - the orientation in degree with 0 as the vertical position, positive values rotate clockwise.
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setOri(ori, log = false)
	{
		const hasChanged = this._setAttribute('ori', ori, log);

		if (hasChanged)
		{
			let radians = ori * 0.017453292519943295;
			this._rotationMatrix = [[Math.cos(radians), -Math.sin(radians)],
				[Math.sin(radians), Math.cos(radians)]];

			this._needUpdate = true;
			// the pixi representation needs to be updated:
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the position attribute.
	 *
	 * @name module:visual.VisualStim#setPos
	 * @public
	 * @param {Array.<number>} pos - position of the center of the stimulus, in stimulus units
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setPos(pos, log = false)
	{
		const prevPos = this._pos;
		const hasChanged = this._setAttribute('pos', util.toNumerical(pos), log);

		if (hasChanged)
		{
			this._needUpdate = true;
			
			// update the bounding box, without calling _estimateBoundingBox:
			this._boundingBox.x += this._pos[0] - prevPos[0];
			this._boundingBox.y += this._pos[1] - prevPos[1];
		}
	}



	/**
	 * Setter for the opacity attribute.
	 *
	 * @name module:visual.VisualStim#setOpacity
	 * @public
	 * @param {number} opacity - the opacity: 0 is completely transparent, 1 is fully opaque
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setOpacity(opacity, log = false)
	{
		const hasChanged = this._setAttribute('opacity', opacity, log);

		if (hasChanged)
		{
			this._needUpdate = true;
		}
	}



	/**
	 * Determine whether an object is inside the bounding box of the stimulus.
	 *
	 * @name module:visual.VisualStim#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the object is inside the bounding box of the text
	 */
	contains(object, units)
	{
		// get the position of the object, in pixel coordinates:
		const objectPos_px = util.getPositionFromObject(object, units);

		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'VisualStim.contains',
				context: 'when determining whether VisualStim: ' + this._name + ' contains object: ' + util.toString(object),
				error: 'unable to determine the position of the object'
			};
		}

		// test for inclusion:
		return this._getBoundingBox_px().contains(objectPos_px[0], objectPos_px[1]);
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.VisualStim#_estimateBoundingBox
	 * @function
	 * @protected
	 */
	_estimateBoundingBox()
	{
		throw {
			origin: 'VisualStim._estimateBoundingBox',
			context: `when estimating the bounding box of visual stimulus: ${this._name}`,
			error: 'this method is abstract and should not be called.'
		};
	}



	/**
	 * Get the bounding box in pixel coordinates
	 *
	 * @name module:visual.VisualStim#contains
	 * @function
	 * @protected
	 * @returns {PIXI.Rectangle} the bounding box, in pixel coordinates
	 */
	_getBoundingBox_px()
	{
		if (this._units === 'pix')
		{
			return this._boundingBox.clone();
		}
		else if (this._units === 'norm')
		{
			return new PIXI.Rectangle(
				this._boundingBox.x * this._win.size[0] / 2,
				this._boundingBox.y * this._win.size[1] / 2,
				this._boundingBox.width * this._win.size[0] / 2,
				this._boundingBox.height * this._win.size[1] / 2
			);
		}
		else if (this._units === 'height')
		{
			const minSize = Math.min(this._win.size[0], this._win.size[1]);
			return new PIXI.Rectangle(
				this._boundingBox.x * minSize,
				this._boundingBox.y * minSize,
				this._boundingBox.width * minSize,
				this._boundingBox.height * minSize
			);
		}
		else
		{
			throw Object.assign(response, {error: `unknown units: ${this._units}`});
		}
	}

}
