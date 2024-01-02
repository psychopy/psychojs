/**
 * Grating Stimulus.
 *
 * @author Nikita Agafonov
 * @version 2021.2.3
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import {AdjustmentFilter} from "@pixi/filter-adjustment";
import { Color } from "../util/Color.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import defaultQuadVert from "./shaders/defaultQuad.vert";
import imageShader from "./shaders/imageShader.frag";
import sinShader from "./shaders/sinShader.frag";
import sqrShader from "./shaders/sqrShader.frag";
import sawShader from "./shaders/sawShader.frag";
import triShader from "./shaders/triShader.frag";
import sinXsinShader from "./shaders/sinXsinShader.frag";
import sqrXsqrShader from "./shaders/sqrXsqrShader.frag";
import circleShader from "./shaders/circleShader.frag";
import gaussShader from "./shaders/gaussShader.frag";
import crossShader from "./shaders/crossShader.frag";
import radRampShader from "./shaders/radRampShader.frag";
import raisedCosShader from "./shaders/raisedCosShader.frag";
import radialStim from "./shaders/radialShader.frag";

import defaultQuadVertWGL1 from "./shaders/wgl1/defaultQuad.vert";
import imageShaderWGL1 from "./shaders/wgl1/imageShader.frag";
import sinShaderWGL1 from "./shaders/wgl1/sinShader.frag";
import sqrShaderWGL1 from "./shaders/wgl1/sqrShader.frag";
import sawShaderWGL1 from "./shaders/wgl1/sawShader.frag";
import triShaderWGL1 from "./shaders/wgl1/triShader.frag";
import sinXsinShaderWGL1 from "./shaders/wgl1/sinXsinShader.frag";
import sqrXsqrShaderWGL1 from "./shaders/wgl1/sqrXsqrShader.frag";
import circleShaderWGL1 from "./shaders/wgl1/circleShader.frag";
import gaussShaderWGL1 from "./shaders/wgl1/gaussShader.frag";
import crossShaderWGL1 from "./shaders/wgl1/crossShader.frag";
import radRampShaderWGL1 from "./shaders/wgl1/radRampShader.frag";
import raisedCosShaderWGL1 from "./shaders/wgl1/raisedCosShader.frag";
import radialStimWGL1 from "./shaders/wgl1/radialShader.frag";

/**
 * Grating Stimulus.
 *
 * @extends VisualStim
 */
export class GratingStim extends VisualStim
{
	/**
	 * An object that keeps shaders source code and default uniform values for them.
	 * Shader source code is later used for construction of shader programs to create respective visual stimuli.
	 *
	 * @type {Object}
	 * @property {Object} imageShader - Renders provided image with applied effects (coloring, phase, frequency).
	 * @property {String} imageShader.shader - shader source code for the image based grating stimuli.
	 * @property {Object} imageShader.uniforms - default uniforms for the image based shader.
	 * @property {float} imageShader.uniforms.uFreq=1.0 - how much times image repeated within grating stimuli.
	 * @property {float} imageShader.uniforms.uPhase=0.0 - offset of the image along X axis.
	 * @property {float} imageShader.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} sin - Creates 2d sine wave image as if 1d sine graph was extended across Z axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Sine_wave}
	 * @property {String} sin.shader - shader source code for the sine wave stimuli
	 * @property {Object} sin.uniforms - default uniforms for sine wave shader
	 * @property {float} sin.uniforms.uFreq=1.0 - frequency of sine wave.
	 * @property {float} sin.uniforms.uPhase=0.0 - phase of sine wave.
	 * @property {float} sin.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} sqr - Creates 2d square wave image as if 1d square graph was extended across Z axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Square_wave}
	 * @property {String} sqr.shader - shader source code for the square wave stimuli
	 * @property {Object} sqr.uniforms - default uniforms for square wave shader
	 * @property {float} sqr.uniforms.uFreq=1.0 - frequency of square wave.
	 * @property {float} sqr.uniforms.uPhase=0.0 - phase of square wave.
	 * @property {float} sqr.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} saw - Creates 2d sawtooth wave image as if 1d sawtooth graph was extended across Z axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Sawtooth_wave}
	 * @property {String} saw.shader - shader source code for the sawtooth wave stimuli
	 * @property {Object} saw.uniforms - default uniforms for sawtooth wave shader
	 * @property {float} saw.uniforms.uFreq=1.0 - frequency of sawtooth wave.
	 * @property {float} saw.uniforms.uPhase=0.0 - phase of sawtooth wave.
	 * @property {float} saw.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} tri - Creates 2d triangle wave image as if 1d triangle graph was extended across Z axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Triangle_wave}
	 * @property {String} tri.shader - shader source code for the triangle wave stimuli
	 * @property {Object} tri.uniforms - default uniforms for triangle wave shader
	 * @property {float} tri.uniforms.uFreq=1.0 - frequency of triangle wave.
	 * @property {float} tri.uniforms.uPhase=0.0 - phase of triangle wave.
	 * @property {float} tri.uniforms.uPeriod=1.0 - period of triangle wave.
	 * @property {float} tri.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} sinXsin - Creates an image of two 2d sine waves multiplied with each other.
	 * {@link https://en.wikipedia.org/wiki/Sine_wave}
	 * @property {String} sinXsin.shader - shader source code for the two multiplied sine waves stimuli
	 * @property {Object} sinXsin.uniforms - default uniforms for shader
	 * @property {float} sinXsin.uniforms.uFreq=1.0 - frequency of sine wave (both of them).
	 * @property {float} sinXsin.uniforms.uPhase=0.0 - phase of sine wave (both of them).
	 * @property {float} sinXsin.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} sqrXsqr - Creates an image of two 2d square waves multiplied with each other.
	 * {@link https://en.wikipedia.org/wiki/Square_wave}
	 * @property {String} sqrXsqr.shader - shader source code for the two multiplied sine waves stimuli
	 * @property {Object} sqrXsqr.uniforms - default uniforms for shader
	 * @property {float} sqrXsqr.uniforms.uFreq=1.0 - frequency of sine wave (both of them).
	 * @property {float} sqrXsqr.uniforms.uPhase=0.0 - phase of sine wave (both of them).
	 * @property {float} sqrXsqr.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} circle - Creates a filled circle shape with sharp edges.
	 * @property {String} circle.shader - shader source code for filled circle.
	 * @property {Object} circle.uniforms - default uniforms for shader.
	 * @property {float} circle.uniforms.uRadius=1.0 - Radius of the circle. Ranges [0.0, 1.0], where 0.0 is circle so tiny it results in empty stim
	 * and 1.0 is circle that spans from edge to edge of the stim.
	 * @property {float} circle.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} gauss - Creates a 2d Gaussian image as if 1d Gaussian graph was rotated arount Y axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Gaussian_function}
	 * @property {String} gauss.shader - shader source code for Gaussian shader
	 * @property {Object} gauss.uniforms - default uniforms for shader
	 * @property {float} gauss.uniforms.uA=1.0 - A constant for gaussian formula (see link).
	 * @property {float} gauss.uniforms.uB=0.0 - B constant for gaussian formula (see link).
	 * @property {float} gauss.uniforms.uC=0.16 - C constant for gaussian formula (see link).
	 * @property {float} gauss.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} cross - Creates a filled cross shape with sharp edges.
	 * @property {String} cross.shader - shader source code for cross shader
	 * @property {Object} cross.uniforms - default uniforms for shader
	 * @property {float} cross.uniforms.uThickness=0.2 - Thickness of the cross. Ranges [0.0, 1.0], where 0.0 thickness makes a cross so thin it becomes
	 * invisible and results in an empty stim and 1.0 makes it so thick it fills the entire stim.
	 * @property {float} cross.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} radRamp - Creates 2d radial ramp image.
	 * @property {String} radRamp.shader - shader source code for radial ramp shader
	 * @property {Object} radRamp.uniforms - default uniforms for shader
	 * @property {float} radRamp.uniforms.uSqueeze=1.0 - coefficient that helps to modify size of the ramp. Ranges [0.0, Infinity], where 0.0 results in ramp being so large
	 * it fills the entire stim and Infinity makes it so tiny it's invisible.
	 * @property {float} radRamp.uniforms.uAlpha=1.0 - value of the alpha channel.
	 *
	 * @property {Object} raisedCos - Creates 2d raised-cosine image as if 1d raised-cosine graph was rotated around Y axis and observed from above.
	 * {@link https://en.wikipedia.org/wiki/Raised-cosine_filter}
	 * @property {String} raisedCos.shader - shader source code for raised-cosine shader
	 * @property {Object} raisedCos.uniforms - default uniforms for shader
	 * @property {float} raisedCos.uniforms.uBeta=0.25 - roll-off factor (see link).
	 * @property {float} raisedCos.uniforms.uPeriod=0.625 - reciprocal of the symbol-rate (see link).
	 * @property {float} raisedCos.uniforms.uAlpha=1.0 - value of the alpha channel.
	 */
	static #SHADERS = {
		imageShader: {
			shader: imageShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sin: {
			shader: sinShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sqr: {
			shader: sqrShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		saw: {
			shader: sawShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		tri: {
			shader: triShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uPeriod: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sinXsin: {
			shader: sinXsinShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sqrXsqr: {
			shader: sqrXsqrShader,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		circle: {
			shader: circleShader,
			uniforms: {
				uRadius: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		gauss: {
			shader: gaussShader,
			uniforms: {
				uA: 1.0,
				uB: 0.0,
				uC: 0.16,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		cross: {
			shader: crossShader,
			uniforms: {
				uThickness: 0.2,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		radRamp: {
			shader: radRampShader,
			uniforms: {
				uSqueeze: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		raisedCos: {
			shader: raisedCosShader,
			uniforms: {
				uBeta: 0.25,
				uPeriod: 0.625,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		radialStim: {
			shader: radialStim,
			uniforms: {
				uFreq: 20.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		}
	};

	static #SHADERSWGL1 = {
		imageShader: {
			shader: imageShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sin: {
			shader: sinShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sqr: {
			shader: sqrShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		saw: {
			shader: sawShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		tri: {
			shader: triShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uPeriod: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sinXsin: {
			shader: sinXsinShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		sqrXsqr: {
			shader: sqrXsqrShaderWGL1,
			uniforms: {
				uFreq: 1.0,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		circle: {
			shader: circleShaderWGL1,
			uniforms: {
				uRadius: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		gauss: {
			shader: gaussShaderWGL1,
			uniforms: {
				uA: 1.0,
				uB: 0.0,
				uC: 0.16,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		cross: {
			shader: crossShaderWGL1,
			uniforms: {
				uThickness: 0.2,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		radRamp: {
			shader: radRampShaderWGL1,
			uniforms: {
				uSqueeze: 1.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		raisedCos: {
			shader: raisedCosShaderWGL1,
			uniforms: {
				uBeta: 0.25,
				uPeriod: 0.625,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		},
		radialStim: {
			shader: radialStimWGL1,
			uniforms: {
				uFreq: 20.0,
				uStep: .0017,
				uDX: 1.,
				uPhase: 0.0,
				uColor: [1., 1., 1.],
				uAlpha: 1.0
			}
		}
	};

	/**
	 * Default size of the Grating Stimuli in pixels.
	 *
	 * @type {Array}
	 * @default [256, 256]
	 */
	static #DEFAULT_STIM_SIZE_PX = [256, 256]; // in pixels

	static #BLEND_MODES_MAP = {
		avg: PIXI.BLEND_MODES.NORMAL,
		add: PIXI.BLEND_MODES.ADD,
		mul: PIXI.BLEND_MODES.MULTIPLY,
		screen: PIXI.BLEND_MODES.SCREEN
	};

	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {String | HTMLImageElement} [options.tex="sin"] - the name of the predefined grating texture or image resource or the HTMLImageElement corresponding to the texture
	 * @param {String | HTMLImageElement} [options.mask] - the name of the mask resource or HTMLImageElement corresponding to the mask
	 * @param {String} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {number} [options.sf=1.0] - spatial frequency of the function used in grating stimulus
	 * @param {number} [options.phase=0.0] - phase of the function used in grating stimulus, multiples of period of that function
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered image (DEFAULT_STIM_SIZE_PX will be used if size is not specified)
	 * @param {Color} [options.color= "white"] - Foreground color of the stimulus. Can be String like "red" or "#ff0000" or Number like 0xff0000.
	 * @param {number} [options.opacity= 1.0] - Set the opacity of the stimulus. Determines how visible the stimulus is relative to background.
	 * @param {number} [options.contrast= 1.0] - Set the contrast of the stimulus, i.e. scales how far the stimulus deviates from the middle grey. Ranges [-1, 1].
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {boolean} [options.interpolate= false] - Whether to interpolate (linearly) the texture in the stimulus. Currently supports only image based gratings.
	 * @param {String} [options.blendmode= "avg"] - blend mode of the stimulus, determines how the stimulus is blended with the background. Supported values: "avg", "add", "mul", "screen".
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({
		name,
		tex = "sin",
		win,
		mask,
		pos,
		anchor,
		units,
		sf = 1.0,
		ori,
		phase,
		size,
		color,
		colorSpace,
		opacity,
		contrast = 1,
		depth,
		interpolate,
		blendmode,
		autoDraw,
		autoLog,
		maskParams
	} = {})
	{
		super({ name, win, units, ori, opacity, depth, pos, anchor, size, autoDraw, autoLog });

		this._adjustmentFilter = new AdjustmentFilter({
			contrast
		});
		this._addAttribute("tex", tex);
		this._addAttribute("mask", mask);
		this._addAttribute("SF", sf, GratingStim.#SHADERS[tex] ? GratingStim.#SHADERS[tex].uniforms.uFreq || 1.0 : 1.0);
		this._addAttribute("phase", phase, GratingStim.#SHADERS[tex] ? GratingStim.#SHADERS[tex].uniforms.uPhase || 0.0 : 0.0);
		this._addAttribute("color", color, "white");
		this._addAttribute("colorSpace", colorSpace, "RGB");
		this._addAttribute("contrast", contrast, 1.0, () => {
			this._adjustmentFilter.contrast = this._contrast;
		});
		this._addAttribute("blendmode", blendmode, "avg");
		this._addAttribute("interpolate", interpolate, false);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}

		if (!Array.isArray(this.size) || this.size.length === 0) {
			this.size = util.to_unit(GratingStim.#DEFAULT_STIM_SIZE_PX, "pix", this.win, this.units);
		}
		this._size_px = util.to_px(this.size, this.units, this.win);
	}

	/**
	 * Setter for the tex attribute.
	 *
	 * @param {HTMLImageElement | string} tex - the name of built in shader function or name of the image resource or HTMLImageElement corresponding to the image
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
			else if (GratingStim.#SHADERS[tex] !== undefined)
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
					throw "the argument: " + tex.toString() + " is not an image\" }";
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
			else if (GratingStim.#SHADERS[mask] !== undefined)
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
					throw "the argument: " + mask.toString() + " is not an image\" }";
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
	 * @protected
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this._size;

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

	/**
	 * Generate PIXI.Mesh object based on provided shader function name and uniforms.
	 * 
	 * @protected
	 * @param {String} shaderName - name of the shader. Must be one of the SHADERS
	 * @param {Object} uniforms - a set of uniforms to supply to the shader. Mixed together with default uniform values.
	 * @return {Pixi.Mesh} Pixi.Mesh object that represents shader and later added to the scene.
	 */
	_getPixiMeshFromPredefinedShaders (shaderName = "", uniforms = {}) {
		const geometry = new PIXI.Geometry();
		geometry.addAttribute(
			"aVertexPosition",
			[
				-this._size_px[0] * .5, -this._size_px[1] * .5,
				this._size_px[0] * .5, -this._size_px[1] * .5,
				this._size_px[0] * .5, this._size_px[1] * .5,
				-this._size_px[0] * .5, this._size_px[1] * .5
			],
			2
		);
		geometry.addAttribute(
			"aUvs",
			[0, 0, 1, 0, 1, 1, 0, 1],
			2
		);
		geometry.addIndex([0, 1, 2, 0, 2, 3]);
		let vertexSrc;
		let fragmentSrc;
		let uniformsFinal;
		if (this._win._renderer.context.webGLVersion >= 2)
		{
			vertexSrc = defaultQuadVert;
			fragmentSrc = GratingStim.#SHADERS[shaderName].shader;
			uniformsFinal = Object.assign({}, GratingStim.#SHADERS[shaderName].uniforms, uniforms);
		}
		else
		{
			vertexSrc = defaultQuadVertWGL1;
			fragmentSrc = GratingStim.#SHADERSWGL1[shaderName].shader;
			uniformsFinal = Object.assign({}, GratingStim.#SHADERSWGL1[shaderName].uniforms, uniforms);
		}
		const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniformsFinal);
		return new PIXI.Mesh(geometry, shader);
	}

	/**
	 * Set phase value for the function.
	 * 
	 * @param {number} phase - phase value
	 * @param {boolean} [log= false] - whether of not to log
	 */ 
	setPhase (phase, log = false) {
		this._setAttribute("phase", phase, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uPhase = -phase;
		}
	}

	/**
	 * Set color space value for the grating stimulus.
	 * 
	 * @param {String} colorSpaceVal - color space value
	 * @param {boolean} [log= false] - whether of not to log
	 */ 
	setColorSpace (colorSpaceVal = "RGB", log = false) {
		let colorSpaceValU = colorSpaceVal.toUpperCase();
		if (Color.COLOR_SPACE[colorSpaceValU] === undefined) {
			colorSpaceValU = "RGB";
		}
		const hasChanged = this._setAttribute("colorSpace", colorSpaceValU, log);
		if (hasChanged) {
			this.setColor(this._color);
		}
	}

	/**
	 * Set foreground color value for the grating stimulus.
	 * 
	 * @param {Color} colorVal - color value, can be String like "red" or "#ff0000" or Number like 0xff0000.
	 * @param {boolean} [log= false] - whether of not to log
	 */ 
	setColor (colorVal = "white", log = false) {
		const colorObj = (colorVal instanceof Color) ? colorVal : new Color(colorVal, Color.COLOR_SPACE[this._colorSpace])
		this._setAttribute("color", colorObj, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uColor = colorObj.rgbFull;
		}
	}

	/**
	 * Determines how visible the stimulus is relative to background.
	 * 
	 * @param {number} [opacity=1] opacity - The value should be a single float ranging 1.0 (opaque) to 0.0 (transparent).
	 * @param {boolean} [log= false] - whether of not to log
	 */ 
	setOpacity (opacity = 1, log = false) {
		this._setAttribute("opacity", opacity, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uAlpha = opacity;
		}
	}

	/**
	 * Set spatial frequency value for the function.
	 * 
	 * @param {number} sf - spatial frequency value
	 * @param {boolean} [log=false] - whether or not to log
	 */ 
	setSF (sf, log = false) {
		this._setAttribute("SF", sf, log);
		if (this._pixi instanceof PIXI.Mesh) {
			this._pixi.shader.uniforms.uFreq = sf;
		}
	}

	/**
	 * Set blend mode of the grating stimulus.
	 * 
	 * @param {String} blendMode - blend mode, can be one of the following: ["avg", "add", "mul", "screen"].
	 * @param {boolean} [log=false] - whether or not to log
	 */ 
	setBlendmode (blendMode = "avg", log = false) {
		this._setAttribute("blendmode", blendMode, log);
		if (this._pixi !== undefined) {
			let pixiBlendMode = GratingStim.#BLEND_MODES_MAP[blendMode];
			if (pixiBlendMode === undefined) {
				pixiBlendMode = PIXI.BLEND_MODES.NORMAL;
			}
			if (this._pixi.filters) {
				this._pixi.filters[this._pixi.filters.length - 1].blendMode = pixiBlendMode;
			} else {
				this._pixi.blendMode = pixiBlendMode;
			}
		}
	}

	/**
	 * Whether to interpolate (linearly) the texture in the stimulus.
	 * 
	 * @param {boolean} interpolate - interpolate or not.
	 * @param {boolean} [log=false] - whether or not to log
	 */ 
	setInterpolate (interpolate = false, log = false) {
		this._setAttribute("interpolate", interpolate, log);
		if (this._pixi instanceof PIXI.Mesh && this._pixi.shader.uniforms.uTex instanceof PIXI.Texture) {
			this._pixi.shader.uniforms.uTex.baseTexture.scaleMode = interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST;
			this._pixi.shader.uniforms.uTex.baseTexture.update();
		}
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
			// Vertices are set directly with origin at [0, 0], centered around it.
			// Subtracting 0.5 from anchorNum vals to get desired effect.
			const anchorNum = this._anchorTextToNum(this._anchor);
			this._pixi.pivot.x = (anchorNum[0] - 0.5) * this._pixi.scale.x * this._pixi.width;
			this._pixi.pivot.y = (anchorNum[1] - 0.5) * this._pixi.scale.y * this._pixi.height;
		}
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
			this._size_px = util.to_px(this._size, this.units, this.win);
			let shaderName;
			let shaderUniforms;
			let currentUniforms = {};
			if (typeof this._pixi !== "undefined")
			{
				if (this._pixi instanceof PIXI.Mesh) {
					Object.assign(currentUniforms, this._pixi.shader.uniforms);
				}
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
				// Not using PIXI.Texture.from() on purpose, as it caches both PIXI.Texture and PIXI.BaseTexture.
				// As a result of that we can have multiple GratingStim instances using same PIXI.BaseTexture,
				// thus changing texture related properties like interpolation, or calling _pixi.destroy(true)
				// will affect all GratingStims who happen to share that BaseTexture.
				shaderName = "imageShader";
				let shaderTex = new PIXI.Texture(new PIXI.BaseTexture(this._tex, {
					wrapMode: PIXI.WRAP_MODES.REPEAT,
					scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST
				}));
				shaderUniforms = {
					uTex: shaderTex,
					uFreq: this._SF,
					uPhase: this._phase,
					uColor: this._color.rgbFull
				};
			}
			else
			{
				shaderName = this._tex;
				shaderUniforms = {
					uFreq: this._SF,
					uPhase: this._phase,
					uColor: this._color.rgbFull
				};
			}
			this._pixi = this._getPixiMeshFromPredefinedShaders(shaderName, Object.assign(shaderUniforms, currentUniforms));
			this._pixi.filters = [this._adjustmentFilter];

			// add a mask if need be:
			if (typeof this._mask !== "undefined")
			{
				if (this._mask instanceof HTMLImageElement)
				{
					// Building new PIXI.BaseTexture each time we create a mask. See notes on shader texture creation above.
					this._pixi.mask = PIXI.Sprite.from(new PIXI.Texture(new PIXI.BaseTexture(this._mask)));
					this._pixi.mask.width = this._size_px[0];
					this._pixi.mask.height = this._size_px[1];
					this._pixi.addChild(this._pixi.mask);
				}
				else
				{
					const maskMesh = this._getPixiMeshFromPredefinedShaders(this._mask);

					// Since maskMesh is centered around (0, 0) (has vertices going around it),
					// offsetting maskMesh position to properly cover render target texture,
					// which created with top-left corner at (0, 0).
					maskMesh.position.set(this._size_px[0] * 0.5, this._size_px[1] * 0.5);

					// For some reason setting PIXI.Mesh as .mask doesn't do anything,
					// rendering mask to texture for further use.
					const rt = PIXI.RenderTexture.create({
						width: this._size_px[0],
						height: this._size_px[1],
						scaleMode: this._interpolate ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST
					});
					this.win._renderer.render(maskMesh, {
						renderTexture: rt
					});
					const maskSprite = new PIXI.Sprite.from(rt);
					this._pixi.mask = maskSprite;
					this._pixi.addChild(maskSprite);
				}
				// Since grating mesh is centered around (0, 0), setting mask's anchor to center to properly cover target image.
				this._pixi.mask.anchor.set(0.5);
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

		this._pixi.zIndex = -this._depth;
		this.opacity = this._opacity;
		this.anchor = this._anchor;

		// set the scale:
		this._pixi.scale.x = 1;
		this._pixi.scale.y = -1;

		let pos = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.position.set(pos.x, pos.y);
		this._pixi.rotation = -this.ori * Math.PI / 180;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}
}
