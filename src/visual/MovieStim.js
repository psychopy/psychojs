/**
 * Movie Stimulus.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { PsychoJS } from "../core/PsychoJS.js";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import {Camera} from "../hardware/Camera.js";


/**
 * Movie Stimulus.
 *
 * @extends VisualStim
 * @todo autoPlay does not work for the moment.
 */
export class MovieStim extends VisualStim
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {string | HTMLVideoElement | module:visual.Camera} movie - the name of a
	 * movie resource or of a HTMLVideoElement or of a Camera component
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
	 * @param {Color} [options.color= Color('white')] the background color
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {number} [options.contrast= 1.0] - the contrast
	 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
	 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
	 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
	 * @param {boolean} [options.loop= false] - whether or not to loop the movie
	 * @param {number} [options.volume= 1.0] - the volume of the audio track (must be between 0.0 and 1.0)
	 * @param {boolean} [options.noAudio= false] - whether or not to play the audio
	 * @param {boolean} [options.autoPlay= true] - whether or not to autoplay the video
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({ name, win, movie, pos, anchor, units, ori, size, color, opacity, contrast, interpolate, flipHoriz, flipVert, loop, volume, noAudio, autoPlay, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, opacity, pos, anchor, size, autoDraw, autoLog });

		this.psychoJS.logger.debug("create a new MovieStim with name: ", name);

		// movie and movie control:
		this._addAttribute(
			"movie",
			movie,
		);
		this._addAttribute(
			"volume",
			volume,
			1.0,
			this._onChange(false, false),
		);
		this._addAttribute(
			"noAudio",
			noAudio,
			false,
			this._onChange(false, false),
		);
		this._addAttribute(
			"autoPlay",
			autoPlay,
			true,
			this._onChange(false, false),
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
		this._addAttribute(
			"interpolate",
			interpolate,
			false,
			this._onChange(true, false),
		);

		// colors:
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
			"loop",
			loop,
			false,
			this._onChange(false, false),
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		// check whether the fastSeek method on HTMLVideoElement is implemented:
		const videoElement = document.createElement("video");
		this._hasFastSeek = (typeof videoElement.fastSeek === "function");

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Setter for the movie attribute.
	 *
	 * @param {string | HTMLVideoElement | module:visual.Camera} movie - the name of a
	 * movie resource or of a HTMLVideoElement or of a Camera component
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMovie(movie, log = false)
	{
		const response = {
			origin: "MovieStim.setMovie",
			context: `when setting the movie of MovieStim: ${this._name}`,
		};

		try
		{
			// movie is undefined: that's fine but we raise a warning in case this is
			// a symptom of an actual problem
			if (typeof movie === "undefined")
			{
				this.psychoJS.logger.warn(
					`setting the movie of MovieStim: ${this._name} with argument: undefined.`);
				this.psychoJS.logger.debug(`set the movie of MovieStim: ${this._name} as: undefined`);
			}

			else
			{
				// if movie is a string, then it should be the name of a resource, which we get:
				if (typeof movie === "string")
				{
					movie = this.psychoJS.serverManager.getResource(movie);
				}

				// if movie is an instance of camera, get a video element from it:
				else if (movie instanceof Camera)
				{
					// old behaviour: feeding a Camera to MovieStim plays the live stream:
					const video = movie.getVideo();
					// TODO remove previous one if there is one
					movie = video;

					/*
					// new behaviour: feeding a Camera to MovieStim replays the video previously recorded by the Camera:
					const video = movie.getRecording();
					movie = video;
				 */
				}

				// check that movie is now an HTMLVideoElement
				if (!(movie instanceof HTMLVideoElement))
				{
					throw `${movie.toString()} is not a video`;
				}

				this.psychoJS.logger.debug(`set the movie of MovieStim: ${this._name} as: src= ${movie.src}, size= ${movie.videoWidth}x${movie.videoHeight}, duration= ${movie.duration}s`);

				// ensure we have only one onended listener per HTMLVideoElement, since we can have several
				// MovieStim with the same underlying HTMLVideoElement
				// https://stackoverflow.com/questions/11455515
				if (!movie.onended)
				{
					movie.onended = () =>
					{
						this.status = PsychoJS.Status.FINISHED;
					};
				}
			}

			this._setAttribute("movie", movie, log);
			this._needUpdate = true;
			this._needPixiUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Reset the stimulus.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	reset(log = false)
	{
		this.status = PsychoJS.Status.NOT_STARTED;
		this._movie.pause();
		this.seek(0, log);
	}

	/**
	 * Start playing the movie.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	play(log = false)
	{
		this.status = PsychoJS.Status.STARTED;

		// As found on https://goo.gl/LdLk22
		const playPromise = this._movie.play();

		if (playPromise !== undefined)
		{
			playPromise.catch((error) =>
			{
				throw {
					origin: "MovieStim.play",
					context: `when attempting to play MovieStim: ${this._name}`,
					error,
				};
			});
		}
	}

	/**
	 * Pause the movie.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	pause(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		this._movie.pause();
	}

	/**
	 * Stop the movie and reset to 0s.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	stop(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		this._movie.pause();
		this.seek(0, log);
	}

	/**
	 * Jump to a specific timepoint
	 *
	 * <p>Note: seek is experimental and does not work on all browsers at the moment.</p>
	 *
	 * @param {number} timePoint - the timepoint to which to jump (in second)
	 * @param {boolean} [log= false] - whether of not to log
	 */
	seek(timePoint, log = false)
	{
		if (timePoint < 0 || timePoint > this._movie.duration)
		{
			throw {
				origin: "MovieStim.seek",
				context: `when seeking to timepoint: ${timePoint} of MovieStim: ${this._name}`,
				error: `the timepoint does not belong to [0, ${this._movie.duration}`,
			};
		}

		if (this._hasFastSeek)
		{
			this._movie.fastSeek(timePoint);
		}
		else
		{
			try
			{
				this._movie.currentTime = timePoint;
			}
			catch (error)
			{
				throw {
					origin: "MovieStim.seek",
					context: `when seeking to timepoint: ${timePoint} of MovieStim: ${this._name}`,
					error,
				};
			}
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
		const size = this._getDisplaySize();
		if (typeof size !== "undefined")
		{
			this._boundingBox = new PIXI.Rectangle(
				this._pos[0] - (size[0] / 2),
				this._pos[1] - (size[1] / 2),
				size[0],
				size[1],
			);
		}

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
				// Leave original video in place
				// https://pixijs.download/dev/docs/PIXI.Sprite.html#destroy
				this._pixi.destroy({
					children: true,
					texture: true,
					baseTexture: false,
				});
			}
			this._pixi = undefined;

			// no movie to draw: return immediately
			if (typeof this._movie === "undefined")
			{
				return;
			}

			// create a PixiJS video sprite:
			this._texture = PIXI.Texture.from(this._movie, { resourceOptions: { autoPlay: this.autoPlay } });
			this._pixi = new PIXI.Sprite(this._texture);

			// since _texture.width may not be immedialy available but the rest of the code needs its value
			// we arrange for repeated calls to _updateIfNeeded until we have a width:
			if (this._texture.width === 0)
			{
				this._needUpdate = true;
				this._needPixiUpdate = true;
				return;
			}
		}

		// audio:
		this._movie.muted = this._noAudio;
		this._movie.volume = this._volume;

		// loop:
		this._movie.loop = this._loop;

		// opacity:
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this.win);
		const scaleX = size_px[0] / this._texture.width;
		const scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (movie centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;
		this.anchor = this._anchor;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}

	/**
	 * Get the size of the display image, which is either that of the ImageStim or that of the image
	 * it contains.
	 *
	 * @protected
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (typeof displaySize === "undefined")
		{
			// use the size of the texture, if we have access to it:
			if (typeof this._texture !== "undefined" && this._texture.width > 0)
			{
				const textureSize = [this._texture.width, this._texture.height];
				displaySize = util.to_unit(textureSize, "pix", this.win, this.units);
			}
		}

		return displaySize;
	}
}
