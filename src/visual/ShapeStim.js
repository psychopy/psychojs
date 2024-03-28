/**
 * Basic Shape Stimulus.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { WindowMixin } from "../core/WindowMixin.js";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";

/**
 * <p>This class provides the basic functionality of shape stimuli.</p>
 *
 * @extends VisualStim
 * @mixes ColorMixin
 */
export class ShapeStim extends util.mix(VisualStim).with(ColorMixin, WindowMixin)
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {number} options.lineWidth - the line width
	 * @param {Color} [options.lineColor= 'white'] the line color
	 * @param {Color} options.fillColor - the fill color
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {Array.<Array.<number>>} [options.vertices= [[-0.5, 0], [0, 0.5], [0.5, 0]]] - the shape vertices
	 * @param {boolean} [options.closeShape= true] - whether or not the shape is closed
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the shape
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 * @param {number} [options.size= 1.0] - the size
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {string} options.units - the units of the stimulus vertices, size and position
	 * @param {number} [options.contrast= 1.0] - the contrast
	 * @param {number} [options.depth= 0] - the depth
	 * @param {boolean} [options.interpolate= true] - whether or not the shape is interpolated
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({ name, win, lineWidth, lineColor, fillColor, opacity, vertices, closeShape, pos, anchor, size, ori, units, contrast, depth, interpolate, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, opacity, pos, anchor, depth, size, autoDraw, autoLog });

		// the PIXI polygon corresponding to the vertices, in pixel units:
		this._pixiPolygon_px = undefined;
		// the vertices (in pixel units):
		this._vertices_px = undefined;

		// shape:
		if (typeof size === "undefined" || size === null)
		{
			this.size = [1.0, 1.0];
		}
		this._addAttribute(
			"vertices",
			vertices,
			[[-0.5, 0], [0, 0.5], [0.5, 0]],
		);
		this._addAttribute(
			"closeShape",
			closeShape,
			true,
			this._onChange(true, false),
		);
		this._addAttribute(
			"interpolate",
			interpolate,
			true,
			this._onChange(true, false),
		);

		this._addAttribute(
			"lineWidth",
			lineWidth,
			1.5,
			this._onChange(true, true),
		);

		// colors:
		this._addAttribute(
			"lineColor",
			lineColor,
			"white",
			this._onChange(true, false),
		);
		this._addAttribute(
			"fillColor",
			fillColor,
			undefined,
			this._onChange(true, false),
		);
		this._addAttribute(
			"contrast",
			contrast,
			1.0,
			this._onChange(true, false),
		);
	}

	/**
	 * Setter for the vertices attribute.
	 *
	 * @param {Array.<Array.<number>>} vertices - the vertices
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setVertices(vertices, log = false)
	{
		const response = {
			origin: "ShapeStim.setVertices",
			context: "when setting the vertices of ShapeStim: " + this._name,
		};

		this._psychoJS.logger.debug("set the vertices of ShapeStim:", this.name);

		try
		{
			// if vertices is a string, we check whether it is a known shape:
			if (typeof vertices === "string")
			{
				if (vertices in ShapeStim.KnownShapes)
				{
					vertices = ShapeStim.KnownShapes[vertices];
				}
				else
				{
					throw `unknown shape: ${vertices}`;
				}
			}

			this._setAttribute("vertices", vertices, log);

			this._onChange(true, true)();
		}
		catch (error)
		{
			throw Object.assign(response, { error: error });
		}
	}

	/**
	 * Determine whether an object is inside the bounding box of the ShapeStim.
	 *
	 * This is overridden in order to provide a finer inclusion test.
	 *
	 * @override
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the object is inside the bounding box of the ShapeStim
	 */
	contains(object, units)
	{
		// get the position of the object, in pixel coordinates:
		const objectPos_px = util.getPositionFromObject(object, units);

		if (typeof objectPos_px === "undefined")
		{
			throw {
				origin: "VisualStim.contains",
				context: "when determining whether VisualStim: " + this._name + " contains object: " + util.toString(object),
				error: "unable to determine the position of the object",
			};
		}

		// test for inclusion:
		const pos_px = util.to_px(this.pos, this.units, this.win);
		this._getVertices_px();
		const polygon_px = this._vertices_px.map((v) => [v[0] + pos_px[0], v[1] + pos_px[1]]);
		return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	}

	/**
	 * Setter for the anchor attribute.
	 *
	 * @param {string} anchor - anchor of the stim
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setAnchor (anchor = "center", log = false)
	{
		this._setAttribute("anchor", anchor, log);
		if (this._pixi !== undefined)
		{
			// since vertices are passed directly, usually assuming origin at [0, 0]
			// and already being centered around it, subtracting 0.5 from anchorNum vals
			// to get a desired effect.
			const anchorNum = this._anchorTextToNum(this._anchor);
			this._pixi.pivot.x = (anchorNum[0] - 0.5) * this._pixi.scale.x * this._pixi.width;
			this._pixi.pivot.y = (anchorNum[1] - 0.5) * -this._pixi.scale.y * this._pixi.height;
		}
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		this._getVertices_px();

		// left, top, right, bottom limits:
		const limits_px = [
			Number.POSITIVE_INFINITY,
			Number.POSITIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
			Number.NEGATIVE_INFINITY,
		];
		for (const vertex of this._vertices_px)
		{
			limits_px[0] = Math.min(limits_px[0], vertex[0]);
			limits_px[1] = Math.min(limits_px[1], vertex[1]);
			limits_px[2] = Math.max(limits_px[2], vertex[0]);
			limits_px[3] = Math.max(limits_px[3], vertex[1]);
		}

		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] + this._getLengthUnits(limits_px[0]),
			this._pos[1] + this._getLengthUnits(limits_px[1]),
			this._getLengthUnits(limits_px[2] - limits_px[0]),
			this._getLengthUnits(limits_px[3] - limits_px[1]),
		);

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
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

			if (typeof this._pixi !== "undefined")
			{
				this._pixi.destroy(true);
			}
			this._pixi = undefined;

			// get the PIXI polygon (this also updates _vertices_px):
			this._getPixiPolygon();

			// prepare the polygon in the given color and opacity:
			this._pixi = new PIXI.Graphics();
			this._pixi.lineStyle(this._lineWidth, this._lineColor.int, this._opacity, 0.5);
			if (typeof this._fillColor !== "undefined" && this._fillColor !== null)
			{
				const contrastedColor = this.getContrastedColor(new Color(this._fillColor), this._contrast);
				this._pixi.beginFill(contrastedColor.int, this._opacity);
			}
			this._pixi.drawPolygon(this._pixiPolygon_px);
			if (typeof this._fillColor !== "undefined" && this._fillColor !== null)
			{
				this._pixi.endFill();
			}

			this._pixi.zIndex = -this._depth;
			this.anchor = this._anchor;
		}

		// set polygon position and rotation:
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180.0;
	}

	/**
	 * Get the PIXI polygon (in pixel units) corresponding to the vertices.
	 *
	 * @protected
	 * @return {Object} the PIXI polygon corresponding to this stimulus vertices.
	 */
	_getPixiPolygon()
	{
		// make sure the vertices in pixel units are available:
		this._getVertices_px();

		// flatten the vertex_px, which is an array of arrays:
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
		// destroy the previous PIXI polygon and create a new one:
		this._pixiPolygon_px = new PIXI.Polygon(coords_px);
		this._pixiPolygon_px.closeStroke = this._closeShape;
		return this._pixiPolygon_px;
	}

	/**
	 * Get the vertices in pixel units.
	 *
	 * @protected
	 * @return {Array.<number[]>} the vertices (in pixel units)
	 */
	_getVertices_px()
	{
		// handle flipping:
		let flip = [1.0, 1.0];
		if ("_flipHoriz" in this && this._flipHoriz)
		{
			flip[0] = -1.0;
		}
		if ("_flipVert" in this && this._flipVert)
		{
			flip[1] = -1.0;
		}

		// handle size, flipping, and convert to pixel units:
		this._vertices_px = this._vertices.map((v) =>
			util.to_px(
				[v[0] * this._size[0] * flip[0], v[1] * this._size[1] * flip[1]],
				this._units,
				this._win,
			)
		);

		return this._vertices_px;
	}
}

/**
 * Known shapes.
 *
 * @readonly
 */
ShapeStim.KnownShapes = {
	cross: [
		[-0.1, +0.5], // up
		[+0.1, +0.5],
		[+0.1, +0.1],
		[+0.5, +0.1], // right
		[+0.5, -0.1],
		[+0.1, -0.1],
		[+0.1, -0.5], // down
		[-0.1, -0.5],
		[-0.1, -0.1],
		[-0.5, -0.1], // left
		[-0.5, +0.1],
		[-0.1, +0.1],
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
		[-0.09, 0.18],
	],

	triangle: [
        [+0.0, 0.5],  // Point
        [-0.5, -0.5],  // Bottom left
        [+0.5, -0.5],  // Bottom right
    ],

	rectangle: [
			[-.5,  .5],  // Top left
			[ .5,  .5],  // Top right
			[ .5, -.5],  // Bottom left
			[-.5, -.5],  // Bottom right
	],

	arrow: [
			[0.0, 0.5],
			[-0.5, 0.0],
			[-1/6, 0.0],
			[-1/6, -0.5],
			[1/6, -0.5],
			[1/6, 0.0],
			[0.5, 0.0],
	],
};
// Alias some names for convenience
ShapeStim.KnownShapes['star'] = ShapeStim.KnownShapes['star7']
