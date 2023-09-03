/**
 * Pie Stimulus.
 *
 * @author Stefan Bucher
 */

import { Color } from "../util/Color.js";
import { ShapeStim } from "./ShapeStim.js";

/**
 * <p>Pie visual stimulus.</p>
 *
 * @extends ShapeStim
 */
export class Pie extends ShapeStim
{
	/**
	 * <p>Pie visual stimulus.</p>
	 *
	 * Creates a pie shape which is a circle with a wedge cut-out.
    This shape is sometimes referred to as a Pac-Man shape which is often
    used for creating Kanizsa figures. However, the shape can be adapted for
    other uses.
	 *
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {number} [options.lineWidth= 1.5] - the line width
	 * @param {Color} [options.lineColor= Color('white')] the line color
	 * @param {Color} options.fillColor - the fill color
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {number} [options.edges= 32] - the number of edges of the pie
	 * @param {number} [options.start= 0.0] - Start angle of the filled region of the shape in
        degrees.
	 * @param {number} [options.end= 90.0] - end angle of the filled region of the shape in
        degrees.
	 * @param {number} [options.radius= 0.5] - the radius of the pie
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
	constructor({ name, win, lineWidth, lineColor, fillColor, opacity, edges, start, end, radius, pos, size, ori, units, contrast, depth, interpolate, autoDraw, autoLog } = {})
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
			autoLog,
		});

		this._psychoJS.logger.debug("create a new pie with name: ", name);

		this._addAttribute(
			"edges",
			edges,
			32,
		);
		this._addAttribute(
			"start",
			edges,
			0.0,
		);
		this._addAttribute(
			"end",
			edges,
			90.0,
		);
		this._addAttribute(
			"radius",
			radius,
			0.5,
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
	 * @param {number} radius - the pie radius
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setRadius(radius, log = false)
	{
		const hasChanged = this._setAttribute("radius", radius, log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}

	/**
	 * Setter for the start attribute.
	 *
	 * @param {number} start - the pie radius
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setRadius(start, log = false)
	{
		const hasChanged = this._setAttribute("start", start, log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}


	/**
	 * Setter for the end attribute.
	 *
	 * @param {number} end - the pie radius
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setRadius(end, log = false)
	{
		const hasChanged = this._setAttribute("end", end, log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}


	/**
	 * Setter for the edges attribute.
	 *
	 * @param {number} edges - the number of edges
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setEdges(edges, log = false)
	{
		const hasChanged = this._setAttribute("edges", Math.round(edges), log);

		if (hasChanged)
		{
			this._updateVertices();
		}
	}

	/**
	 * Update the vertices.
	 *
	 * @protected
	 * @name module:visual.Pie#_updateVertices
	 */
	_updateVertices()
	{
		this._psychoJS.logger.debug("update the vertices of Pie: ", this.name);

		const startRadians =  2.0 * Math.PI * this._start / 360.0
		const endRadians = 2.0 * Math.PI * this._end / 360.0

		const angle = (endRadians - startRadians) / this._edges;
		const vertices = [0,0];
		for (let v = 0; v < this._edges; ++v)
		{
			vertices.push([Math.sin(startRadians + v * angle) * this._radius, Math.cos(startRadians + v * angle) * this._radius]);
		}
		vertices.push([0,0]);

		this.setVertices(vertices);
	}
}