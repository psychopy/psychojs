/**
 * Polygonal Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {ShapeStim} from './ShapeStim';
import {Color} from '../util/Color';


/**
 * <p>Polygonal visual stimulus.</p>
 *
 * @name module:visual.Polygon
 * @class
 * @extends ShapeStim
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {number} [options.lineWidth= 1.5] - the line width
 * @param {Color} [options.lineColor= Color('white')] the line color
 * @param {Color} options.fillColor - the fill color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.edges= 3] - the number of edges of the polygon
 * @param {number} [options.radius= 0.5] - the radius of the polygon
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
export class Polygon extends ShapeStim
{
	constructor({name, win, lineWidth, lineColor, fillColor, opacity, edges, radius, pos, size, ori, units, contrast, depth, interpolate, autoDraw, autoLog} = {})
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

		this._psychoJS.logger.debug('create a new Polygon with name: ', name);

		this._addAttribute(
			'edges',
			edges,
			3
		);
		this._addAttribute(
			'radius',
			radius,
			0.5
		);

		this._updateVertices();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}



	/**
	 * Setter for the radius attribute.
	 *
	 * @name module:visual.Polygon#setRadius
	 * @public
	 * @param {number} radius - the polygon radius
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setRadius(radius, log = false)
	{
		const hasChanged = this._setAttribute('radius', radius, log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}



	/**
	 * Setter for the edges attribute.
	 *
	 * @name module:visual.Polygon#setEdges
	 * @public
	 * @param {number} edges - the number of edges
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setEdges(edges, log = false)
	{
		const hasChanged = this._setAttribute('edges', Math.round(edges), log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}



	/**
	 * Update the vertices.
	 *
	 * @name module:visual.Polygon#_updateVertices
	 * @private
	 */
	_updateVertices()
	{
		this._psychoJS.logger.debug('update the vertices of Polygon: ', this.name);

		const angle = 2.0 * Math.PI / this._edges;
		const vertices = [];
		for (let v = 0; v < this._edges; ++v)
		{
			vertices.push([Math.sin(v * angle) * this._radius, Math.cos(v * angle) * this._radius]);
		}

		this.setVertices(vertices);
	}

}
