/**
 * Color Mixin.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {Color} from './Color';


/**
 * <p>This mixin implement color and contrast changes for visual stimuli</p>
 *
 * @name module:util.ColorMixin
 * @mixin
 */
export let ColorMixin = (superclass) => class extends superclass
{
	constructor(args)
	{
		super(args);
	}


	/**
	 * Setter for Color attribute.
	 *
	 * @name module:util.ColorMixin#setColor
	 * @function
	 * @public
	 * @param {Color} color - the new color
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setColor(color, log)
	{
		this._setAttribute('color', color, log);

		this._needUpdate = true;
		this._needPixiUpdate = true;
	}


	/**
	 * Setter for Contrast attribute.
	 *
	 * @name module:util.ColorMixin#setContrast
	 * @function
	 * @public
	 * @param {number} contrast - the new contrast (must be between 0 and 1)
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setContrast(contrast, log)
	{
		this._setAttribute('contrast', contrast, log);

		this._needUpdate = true;
		this._needPixiUpdate = true;
	}


	/**
	 * Get a new contrasted Color.
	 *
	 * @name module:util.ColorMixin#getContrastedColor
	 * @function
	 * @public
	 * @param {string|number|Array.<number>} color - the color
	 * @param {number} contrast - the contrast (must be between 0 and 1)
	 */
	getContrastedColor(color, contrast)
	{
		const rgb = color.rgb.map(c => (c * 2.0 - 1.0) * contrast);
		return new Color(rgb, Color.COLOR_SPACE.RGB);
	}

};
