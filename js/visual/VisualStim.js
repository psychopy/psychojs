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
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
 * @param {number} [options.size= 1.0] - the size
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
								pos = [0, 0],
								size,
								autoDraw,
								autoLog
							} = {})
	{
		super({win, name, autoDraw, autoLog});

		this._addAttributes(VisualStim, units, ori, opacity, pos, size);

		this._needUpdate = true;
	}


	/**
	 * Force a refresh of the stimulus.
	 *
	 * @name module:visual.VisualStim#refresh
	 * @public
	 */
	refresh()
	{
		this._needUpdate = true;
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

		this._setAttribute('size', size, log);

		this._needUpdate = true;
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
		this._setAttribute('ori', ori, log);

		let radians = ori * 0.017453292519943295;
		this._rotationMatrix = [[Math.cos(radians), -Math.sin(radians)],
			[Math.sin(radians), Math.cos(radians)]];

		//this._needVertexUpdate = true ; // need to update update vertices
		this._needUpdate = true;
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
		this._setAttribute('pos', util.toNumerical(pos), log);

		this._needUpdate = true;
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
		this._setAttribute('opacity', opacity, log);

		this._needUpdate = true;
	}

}
