/**
 * PIXI utilities.
 *
 * @authors Alain Pitiot, Sotiri Bakagiannis, Thomas Pronk
 * @version 2022.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { to_px } from "./Util.js";

/**
 * Convert a position to a PIXI Point.
 *
 * @name module:util.to_pixiPoint
 * @function
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @param {boolean} [integerCoordinates = false] - whether or not to round the PIXI Point coordinates.
 * @returns {number[]} the position as a PIXI Point
 */
export function to_pixiPoint(pos, posUnit, win, integerCoordinates = false)
{
	const pos_px = to_px(pos, posUnit, win);
	if (integerCoordinates)
	{
		return new PIXI.Point(Math.round(pos_px[0]), Math.round(pos_px[1]));
	}
	else
	{
		return new PIXI.Point(pos_px[0], pos_px[1]);
	}
}
