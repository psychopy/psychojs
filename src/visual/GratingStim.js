/**
 * Grating Stimulus.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import defaultQuadVert from './shaders/defaultQuad.vert';
import sinShader from './shaders/sinShader.frag';
import gaussShader from './shaders/gaussShader.frag';

const DEFINED_FUNCTIONS = {
	sin: sinShader,
	sqr: undefined,
	saw: undefined,
	tri: undefined,
	sinXsin: undefined,
	sqrXsqr: undefined,
	circle: undefined,
	gauss: gaussShader,
	cross: undefined,
	radRamp: undefined,
	raisedCos: undefined
};

const DEFAULT_STIM_SIZE = [256, 256]; // in pixels

/**
 * Grating Stimulus.
 *
 * @name module:visual.GratingStim
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
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
 * @param {Color} [options.color= 'white'] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.texRes= 128] - the resolution of the text
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */

export class GratingStim extends util.mix(VisualStim).with(ColorMixin)
{
	// win,
	// tex="sin",
	// mask="none",
	// units="",
	// pos=(0.0, 0.0),
	// size=None,
	// sf=None,
	// ori=0.0,
	// phase=(0.0, 0.0),
	// texRes=128,
	// rgb=None,
	// dkl=None,
	// lms=None,
	// color=(1.0, 1.0, 1.0),
	// colorSpace='rgb',
	// contrast=1.0,
	// opacity=None,
	// depth=0,
	// rgbPedestal=(0.0, 0.0, 0.0),
	// interpolate=False,
	// blendmode='avg',
	// name=None,
	// autoLog=None,
	// autoDraw=False,
	// maskParams=None)
	constructor({
		name,
		tex,
		win,
		mask,
		pos,
		units,
		spatialFrequency = 10.,
		ori,
		phase,
		size,
		rgb,
	    dkl,
	    lms,
		color,
		colorSpace,
		opacity,
		contrast,
		texRes,
		depth,
		rgbPedestal,
		interpolate,
		blendmode,
		autoDraw,
		autoLog,
		maskParams
	} = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, size, autoDraw, autoLog });

		this._addAttribute(
			"tex",
			tex,
		);
		this._addAttribute(
			"mask",
			mask,
		);
		this._addAttribute(
			"spatialFrequency",
			spatialFrequency,
			10.
		);
		this._addAttribute(
			"phase",
			phase,
			0.
		);
		this._addAttribute(
			"color",
			color,
			"white",
			this._onChange(true, false),
		);
		this._addAttribute(
			"contrast",
			contrast,
			1.0,
			this._onChange(true, false),
		);
		this._addAttribute(
			"texRes",
			texRes,
			128,
			this._onChange(true, false),
		);
		this._addAttribute(
			"interpolate",
			interpolate,
			false,
			this._onChange(true, false),
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}

		if (!Array.isArray(this.size) || this.size.length === 0) {
			this.size = util.to_unit(DEFAULT_STIM_SIZE, "pix", this.win, this.units);
		}
		this._sizeInPixels = util.to_px(this.size, this.units, this.win);
	}

	/**
	 * Setter for the image attribute.
	 *
	 * @name module:visual.GratingStim#setImage
	 * @public
	 * @param {HTMLImageElement | string} image - the name of the image resource or HTMLImageElement corresponding to the image
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setTex(tex, log = false)
	{
		const response = {
			origin: "GratingStim.setTex",
			context: "when setting the tex of GratingStim: " + this._name,
		};

		try
		{
			let hasChanged = false;

			// tex is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof tex === "undefined")
			{
				this.psychoJS.logger.warn("setting the tex of GratingStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the tex of GratingStim: " + this._name + " as: undefined");
			}
			else if (DEFINED_FUNCTIONS[tex] !== undefined)
			{
				// tex is a string and it is one of predefined functions available in shaders
				this.psychoJS.logger.debug("the tex is one of predefined functions. Set the tex of GratingStim: " + this._name + " as: " + tex);
				const curFuncName = this.getTex();
				hasChanged = curFuncName ? curFuncName !== tex : true;
			}
			else
			{
				// tex is a string: it should be the name of a resource, which we load
				if (typeof tex === "string")
				{
					tex = this.psychoJS.serverManager.getResource(tex);
				}

				// tex should now be an actual HTMLImageElement: we raise an error if it is not
				if (!(tex instanceof HTMLImageElement))
				{
					throw "the argument: " + tex.toString() + ' is not an image" }';
				}

				this.psychoJS.logger.debug("set the tex of GratingStim: " + this._name + " as: src= " + tex.src + ", size= " + tex.width + "x" + tex.height);
				const existingImage = this.getTex();
				hasChanged = existingImage ? existingImage.src !== tex.src : true;
			}

			this._setAttribute("tex", tex, log);

			if (hasChanged)
			{
				this._onChange(true, true)();
			}
		}
		catch (error)
		{
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Setter for the mask attribute.
	 *
	 * @name module:visual.GratingStim#setMask
	 * @public
	 * @param {HTMLImageElement | string} mask - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMask(mask, log = false)
	{
		const response = {
			origin: "GratingStim.setMask",
			context: "when setting the mask of GratingStim: " + this._name,
		};

		try
		{
			// mask is undefined: that's fine but we raise a warning in case this is a sympton of an actual problem
			if (typeof mask === "undefined")
			{
				this.psychoJS.logger.warn("setting the mask of GratingStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the mask of GratingStim: " + this._name + " as: undefined");
			}
			else if (DEFINED_FUNCTIONS[mask] !== undefined)
			{
				// mask is a string and it is one of predefined functions available in shaders
				this.psychoJS.logger.debug("the mask is one of predefined functions. Set the mask of GratingStim: " + this._name + " as: " + mask);
			}
			else
			{
				// mask is a string: it should be the name of a resource, which we load
				if (typeof mask === "string")
				{
					mask = this.psychoJS.serverManager.getResource(mask);
				}

				// mask should now be an actual HTMLImageElement: we raise an error if it is not
				if (!(mask instanceof HTMLImageElement))
				{
					throw "the argument: " + mask.toString() + ' is not an image" }';
				}

				this.psychoJS.logger.debug("set the mask of GratingStim: " + this._name + " as: src= " + mask.src + ", size= " + mask.width + "x" + mask.height);
			}

			this._setAttribute("mask", mask, log);

			this._onChange(true, false)();
		}
		catch (error)
		{
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Get the size of the display image, which is either that of the GratingStim or that of the image
	 * it contains.
	 *
	 * @name module:visual.GratingStim#_getDisplaySize
	 * @private
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (typeof displaySize === "undefined")
		{
			// use the size of the pixi element, if we have access to it:
			if (typeof this._pixi !== "undefined" && this._pixi.width > 0)
			{
				const pixiContainerSize = [this._pixi.width, this._pixi.height];
				displaySize = util.to_unit(pixiContainerSize, "pix", this.win, this.units);
			}
		}

		return displaySize;
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.GratingStim#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		const size = this._getDisplaySize();
		if (typeof size !== "undefined")
		{
			this._boundingBox = new PIXI.Rectangle(
				this._pos[0] - size[0] / 2,
				this._pos[1] - size[1] / 2,
				size[0],
				size[1],
			);
		}

		// TODO take the orientation into account
	}

	_getPixiMeshFromPredefinedShaders (funcName = '', uniforms = {}) {
		const geometry = new PIXI.Geometry();
		geometry.addAttribute(
			'aVertexPosition',
			[
				0, 0,
				this._sizeInPixels[0], 0,
				this._sizeInPixels[0], this._sizeInPixels[1],
				0, this._sizeInPixels[1]
			],
			2
		);
		geometry.addAttribute(
			'aUvs',
			[0, 0, 1, 0, 1, 1, 0, 1],
			2
		);
		geometry.addIndex([0, 1, 2, 0, 2, 3]);
		const vertexSrc = defaultQuadVert;
	    const fragmentSrc = DEFINED_FUNCTIONS[funcName];
	    const uniformsFinal = Object.assign(uniforms, {
	    	// for future default uniforms
	    });
		const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniformsFinal);
		return new PIXI.Mesh(geometry, shader);
	}

	setPhase (phase, log = false) {
		this._setAttribute("phase", phase, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uPhase = phase;
		} else if (this._pixi instanceof PIXI.TilingSprite) {
			this._pixi.tilePosition.x = -phase * (this._sizeInPixels[0] * this._pixi.tileScale.x) / (2 * Math.PI)
		}
	}

	setSpatialFrequency (sf, log = false) {
		this._setAttribute("spatialFrequency", sf, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uFreq = sf;
		} else if (this._pixi instanceof PIXI.TilingSprite) {
			// tileScale units are pixels, so converting function frequency to pixels
			// and also taking into account possible size difference between used texture and requested stim size
			this._pixi.tileScale.x = (1 / sf) * (this._pixi.width / this._pixi.texture.width);
		}
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.GratingStim#_updateIfNeeded
	 * @private
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

			// no image to draw: return immediately
			if (typeof this._tex === "undefined")
			{
				return;
			}

			if (this._tex instanceof HTMLImageElement)
			{
				this._pixi = PIXI.TilingSprite.from(this._tex, {
					width: this._sizeInPixels[0],
					height: this._sizeInPixels[1]
				});
				this.setPhase(this._phase);
				this.setSpatialFrequency(this._spatialFrequency);
			}
			else
			{
				this._pixi = this._getPixiMeshFromPredefinedShaders(this._tex, {
					uFreq: this._spatialFrequency,
					uPhase: this._phase
				});
			}
			this._pixi.pivot.set(this._pixi.width * .5, this._pixi.width * .5);

			// add a mask if need be:
			if (typeof this._mask !== "undefined")
			{
				if (this._mask instanceof HTMLImageElement)
				{
					this._pixi.mask = PIXI.Sprite.from(this._mask);
					this._pixi.addChild(this._pixi.mask);
				}
				else
				{
					// for some reason setting PIXI.Mesh as .mask doesn't do anything,
					// rendering mask to texture for further use.
					const maskMesh = this._getPixiMeshFromPredefinedShaders(this._mask);
					const rt = PIXI.RenderTexture.create({
						width: this._sizeInPixels[0],
						height: this._sizeInPixels[1]
					});
					this.win._renderer.render(maskMesh, {
						renderTexture: rt
					});
					const maskSprite = new PIXI.Sprite.from(rt);
					this._pixi.mask = maskSprite;
					this._pixi.addChild(maskSprite);
				}
			}

			// since _pixi.width may not be immediately available but the rest of the code needs its value
			// we arrange for repeated calls to _updateIfNeeded until we have a width:
			if (this._pixi.width === 0)
			{
				this._needUpdate = true;
				this._needPixiUpdate = true;
				return;
			}
		}

		this._pixi.zIndex = this._depth;
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		this._sizeInPixels = util.to_px(displaySize, this.units, this.win);
		const scaleX = this._sizeInPixels[0] / this._pixi.width;
		const scaleY = this._sizeInPixels[1] / this._pixi.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		let pos = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.position.set(pos.x, pos.y);
		this._pixi.rotation = this.ori * Math.PI / 180;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}
}
