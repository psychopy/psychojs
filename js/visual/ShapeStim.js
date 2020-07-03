/** @module visual */
/**
 * Basic Shape Stimulus.
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
 * <p>This class provides the basic functionalities of shape stimuli.</p>
 *
 * @class
 * @extends VisualStim
 * @mixes ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {number} options.lineWidth - the line width
 * @param {Color} [options.lineColor= Color('white')] the line color
 * @param {Color} options.fillColor - the fill color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {Array.<Array.<number>>} [options.vertices= [[-0.5, 0], [0, 0.5], [0.5, 0]]] - the shape vertices
 * @param {boolean} [options.closeShape= true] - whether or not the shape is closed
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the shape
 * @param {number} [options.size= 1.0] - the size
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {string} options.units - the units of the stimulus vertices, size and position
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth
 * @param {boolean} [options.interpolate= true] - whether or not the shape is interpolated
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class ShapeStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
								name,
								win,
								lineWidth = 1.5,
								lineColor = new Color('white'),
								fillColor,
								opacity = 1.0,
								vertices = [[-0.5, 0], [0, 0.5], [0.5, 0]],
								closeShape = true,
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
		super({name, win, units, ori, opacity, pos, size, autoDraw, autoLog});

		// the PIXI polygon corresponding to the vertices, in pixel units:
		this._pixiPolygon_px = undefined;

		// whether the vertices need to be updated:
		this._needVertexUpdate = true;
		// the vertices (in pixel units):
		this._vertices_px = undefined;

		this._addAttributes(ShapeStim, lineWidth, lineColor, fillColor, vertices, closeShape, contrast, depth, interpolate);
	}


	/**
	 * Force a refresh of the stimulus.
	 *
	 * @name module:visual.ShapeStim#refresh
	 * @public
	 */
	refresh()
	{
		super.refresh();

		this._needVertexUpdate = true;
	}


	/**
	 * Setter for the size attribute.
	 *
	 * @name module:visual.ShapeStim#setSize
	 * @public
	 * @param {number | number[]} size - the stimulus size
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setSize(size, log = false)
	{
		super.setSize(size, log);

		this._needVertexUpdate = true;
	}


	/**
	 * Setter for the line width attribute.
	 *
	 * @name module:visual.ShapeStim#setLineWidth
	 * @public
	 * @param {number} lineWidth - the line width
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setLineWidth(lineWidth, log = false)
	{
		this._setAttribute('lineWidth', lineWidth, log);

		this._needUpdate = true;
	}


	/**
	 * Setter for the line color attribute.
	 *
	 * @name module:visual.ShapeStim#setLineColor
	 * @public
	 * @param {Color} lineColor - the line color
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setLineColor(lineColor, log = false)
	{
		this._setAttribute('lineColor', lineColor, log);

		this._needUpdate = true;
	}


	/**
	 * Setter for the fill color attribute.
	 *
	 * @name module:visual.ShapeStim#setFillColor
	 * @public
	 * @param {Color} fillColor - the fill color
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFillColor(fillColor, log = false)
	{
		this._setAttribute('fillColor', fillColor, log);

		this._needUpdate = true;
	}


	/**
	 * Setter for the vertices attribute.
	 *
	 * @name module:visual.ShapeStim#setVertices
	 * @public
	 * @param {Array.<Array.<number>>} vertices - the vertices
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setVertices(vertices, log = false)
	{
		const response = {
			origin: 'ShapeStim.setVertices',
			context: 'when setting the vertices of ShapeStim: ' + this._name
		};

		this._psychoJS.logger.debug('set the vertices of ShapeStim:', this.name);

		try
		{
			// if vertices is a string, we check whether it is a known shape:
			if (typeof vertices === 'string')
			{
				if (vertices in ShapeStim.KnownShapes)
				{
					vertices = ShapeStim.KnownShapes[vertices];
				}
				else
				{
					throw 'unknown shape';
				}
			}

			this._setAttribute('vertices', vertices, log);
			// this._setAttribute({
			// 	name: 'vertices',
			// 	value: vertices,
			// 	assert: v => (v != null) && (typeof v !== 'undefined') && Array.isArray(v) )
			// 	log);

			this._needVertexUpdate = true;
			this._needUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, {error: error});
		}
	}


	/**
	 * Determine whether this stimulus contains the given object.
	 *
	 * @name module:visual.ShapeStim#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the stimulus contains the object
	 */
	contains(object, units)
	{
		this._psychoJS.logger.debug('test whether BaseShameStim:', this.name, 'contains object: ', ('name' in object) ? object.name : object);

		// get position of object:
		const objectPos_px = util.getPositionFromObject(object, units);
		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'ShapeStim.contains',
				context: 'when determining whether BaseShameStim: ' + this._name + ' contains object: ' + util.toString(object),
				error: 'unable to determine the position of the object'
			};
		}

		// test for inclusion
		// note: the vertices are centered around (0, 0) so we need to add to them the stimulus' position
		const pos_px = util.to_px(this.pos, this.units, this.win);
		const polygon_px = this._vertices_px.map(v => [v[0] + pos_px[0], v[1] + pos_px[1]]);

		return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	}


	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.ShapeStim#_updateIfNeeded
	 * @private
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		this._getPolygon(/*true*/); // this also updates _vertices_px

		this._pixi = undefined;

		// no polygon to draw: return immediately
		if (typeof this._pixiPolygon_px === 'undefined')
		{
			return;
		}

		// prepare the polygon in the given color and opacity:
		this._pixi = new PIXI.Graphics();
		this._pixi.lineStyle(this._lineWidth, this._lineColor.int, this._opacity, 0.5);
		if (typeof this._fillColor !== 'undefined')
		{
			this._pixi.beginFill(this._fillColor.int, this._opacity);
		}
		this._pixi.drawPolygon(this._pixiPolygon_px);
		if (typeof this._fillColor !== 'undefined')
		{
			this._pixi.endFill();
		}

		// set polygon position and rotation:
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = this.ori * Math.PI / 180.0;
	}


	/**
	 * Get the PIXI polygon (in pixel units) corresponding to the vertices.
	 *
	 * @name module:visual.ShapeStim#_getPolygon
	 * @private
	 * @return {Object} the PIXI polygon corresponding to this stimulus vertices.
	 */
	_getPolygon(/*force = false*/)
	{
		if (!this._needVertexUpdate)
		{
			return;
		}
		this._needVertexUpdate = false;

		console.log('>>>>>>>>> CREATING PIXI POLYGON!!!!');


		//if (!force && typeof this._pixiPolygon_px !== 'undefined')
		//	return this._pixiPolygon_px;

		// make sure the vertices in pixel units are available, and flatten the array of arrays:
		this._getVertices_px(/*force*/);
		let coords_px = [];
		for (const vertex_px of this._vertices_px)
		{
			coords_px.push.apply(coords_px, vertex_px);
		}

		// close the polygon if need be:
		if (coords_px.length >= 6 && this._closeShape)
		{
			// note: we first check whether the vertices already define a closed polygon:
			const n = coords_px.length;
			if (coords_px[0] !== coords_px[n - 2] || coords_px[1] !== coords_px[n - 1])
			{
				coords_px.push(coords_px[0]);
				coords_px.push(coords_px[1]);
			}
		}

		// create the PIXI polygon:
		this._pixiPolygon_px = new PIXI.Polygon(coords_px);
		return this._pixiPolygon_px;
	}


	/**
	 * Get the vertices in pixel units.
	 *
	 * @name module:visual.ShapeStim#_getVertices_px
	 * @protected
	 * @return {Array.<number[]>} the vertices (in pixel units)
	 */
	_getVertices_px(/*force = false*/)
	{
		/*if (!force && typeof this._vertices_px !== 'undefined')
			return this._vertices_px;*/

		// handle flipping:
		let flip = [1.0, 1.0];
		if ('_flipHoriz' in this && this._flipHoriz)
		{
			flip[0] = -1.0;
		}
		if ('_flipVert' in this && this._flipVert)
		{
			flip[1] = -1.0;
		}

		// handle size, flipping, and convert to pixel units:
		this._vertices_px = this._vertices.map(v => util.to_px([v[0] * this._size[0] * flip[0], v[1] * this._size[1] * flip[1]], this._units, this._win));

		return this._vertices_px;
	}

}


/**
 * Known shapes.
 *
 * @readonly
 * @public
 */
ShapeStim.KnownShapes = {
	cross: [
		[-0.1, +0.5], // up
		[+0.1, +0.5],
		[+0.1, +0.1],
		[+0.5, +0.1],  // right
		[+0.5, -0.1],
		[+0.1, -0.1],
		[+0.1, -0.5],  // down
		[-0.1, -0.5],
		[-0.1, -0.1],
		[-0.5, -0.1],  // left
		[-0.5, +0.1],
		[-0.1, +0.1]
	],

	star7: [
		[0.0, 0.5],
		[0.09, 0.18],
		[0.39, 0.31],
		[0.19, 0.04],
		[0.49, -0.11],
		[0.16, -0.12],
		[0.22, -0.45],
		[0.0, -0.2],
		[-0.22, -0.45],
		[-0.16, -0.12],
		[-0.49, -0.11],
		[-0.19, 0.04],
		[-0.39, 0.31],
		[-0.09, 0.18]
	]

};
