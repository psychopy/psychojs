/**
 * Grating Stimulus.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */



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
 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
 * @param {Color} [options.color= 'white'] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.texRes= 128] - the resolution of the text
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */

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
export class GratingStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
		name,
		tex,
		win,
		mask,
		pos,
		units,
		sf,
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
		this._addAttribute(
			"flipHoriz",
			flipHoriz,
			false,
			this._onChange(false, false),
		);
		this._addAttribute(
			"flipVert",
			flipVert,
			false,
			this._onChange(false, false),
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
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
			context: "when setting the texture of GratingStim: " + this._name,
		};

		try
		{
			// tex is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof tex === "undefined")
			{
				this.psychoJS.logger.warn("setting the tex of GratingStim: " + this._name + " with argument: undefined.");
				this.psychoJS.logger.debug("set the tex of GratingStim: " + this._name + " as: undefined");
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
			}

			const existingImage = this.getImage();
			const hasChanged = existingImage ? existingImage.src !== tex.src : true;

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
}
