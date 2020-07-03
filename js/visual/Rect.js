/**
 * Rectangular Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {ShapeStim} from './ShapeStim';
import {Color} from '../util/Color';


/**
 * <p>Rectangular visual stimulus.</p>
 *
 * @name module:visual.Rect
 * @class
 * @extends ShapeStim
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {number} [options.lineWidth= 1.5] - the line width
 * @param {Color} [options.lineColor= Color('white')] the line color
 * @param {Color} options.fillColor - the fill color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.width= 0.5] - the width of the rectangle
 * @param {number} [options.height= 0.5] - the height of the rectangle
 * @param {Array.<number>} [options.pos= [0, 0]] - the position
 * @param {number} [options.size= 1.0] - the size
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {string} options.units - the units of the stimulus vertices, size and position
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth
 * @param {boolean} [options.interpolate= true] - whether or not the shape is interpolated
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class Rect extends ShapeStim
{
	constructor({
								name,
								win,
								lineWidth = 1.5,
								lineColor = new Color('white'),
								fillColor,
								opacity = 1.0,
								width = 0.5,
								height = 0.5,
								pos = [0, 0],
								size = 1.0,
								ori = 0.0,
								units,
								contrast = 1.0,
								depth = 0,
								interpolate = true,
								autoDraw,
								autoLog
							} = {})
	{
		super({
			name,
			win,
			lineWidth,
			lineColor,
			fillColor,
			opacity,
			pos,
			ori,
			size,
			units,
			contrast,
			depth,
			interpolate,
			autoDraw,
			autoLog
		});

		this._psychoJS.logger.debug('create a new Rect with name: ', name);

		this._addAttributes(Rect, width, height);

		this._updateVertices();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Setter for the width attribute.
	 *
	 * @name module:visual.Rect#setWidth
	 * @public
	 * @param {number} width - the rectange width
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setWidth(width, log = false)
	{
		this._psychoJS.logger.debug('set the width of Rect: ', this.name, 'to: ', width);

		this._setAttribute('width', width, log);
		this._updateVertices();
	}


	/**
	 * Setter for the height attribute.
	 *
	 * @name module:visual.Rect#setHeight
	 * @public
	 * @param {number} height - the rectange height
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setHeight(height, log = false)
	{
		this._psychoJS.logger.debug('set the height of Rect: ', this.name, 'to: ', height);

		this._setAttribute('height', height, log);
		this._updateVertices();
	}


	/**
	 * Update the vertices.
	 *
	 * @name module:visual.Rect#_updateVertices
	 * @private
	 */
	_updateVertices()
	{
		this._psychoJS.logger.debug('update the vertices of Rect: ', this.name);

		const halfWidth = this._width / 2.0;
		const halfHeight = this._height / 2.0;

		this.setVertices([
			[-halfWidth, -halfHeight],
			[halfWidth, -halfHeight],
			[halfWidth, halfHeight],
			[-halfWidth, halfHeight]
		]);
	}

}
