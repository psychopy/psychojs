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
import YoutubeIframeAPIHandler  from "./YoutubeIframeAPI.js";


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
	 * @param {string} [options.youtubeUrl] - link to a youtube video. If this parameter is present, movie stim will embed a youtube video to an experiment.
	 * @param {boolean} [options.showYoutubeControls] - whether or not to show youtube player controls.
	 * @oaram {boolean} [options.disableYoutubePlayerKeyboardControls=false] - Setting the parameter's value to true causes the youtube player to not respond to keyboard controls.
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
	constructor({
		name,
		win,
		movie,
		youtubeUrl,
		showYoutubeControls,
		disableYoutubePlayerKeyboardControls,
		pos,
		anchor,
		units,
		ori,
		size,
		color,
		opacity,
		contrast,
		interpolate,
		flipHoriz,
		flipVert,
		loop,
		volume,
		noAudio,
		autoPlay,
		autoDraw,
		autoLog
	} = {})
	{
		super({ name, win, units, ori, opacity, pos, anchor, size, autoDraw, autoLog });

		this.psychoJS.logger.debug("create a new MovieStim with name: ", name);

		// Used in case when youtubeUrl parameter is set to a proper youtube url.
		this._youtubePlayer = undefined;

		this._bindedHandlers = {
			_handleResize: this._handleResize.bind(this)
		};

		// movie and movie control:
		this._addAttribute(
			"movie",
			movie,
		);
		this._addAttribute(
			"youtubeUrl",
			youtubeUrl,
			""
		);
		this._addAttribute(
			"showYoutubeControls",
			showYoutubeControls,
			true
		);
		this._addAttribute(
			"disableYoutubePlayerKeyboardControls",
			disableYoutubePlayerKeyboardControls,
			false
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

				this.hideYoutubePlayer();
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
	 * Setter for the size attribute.
	 *
	 * @param {undefined | null | number | number[]} size - the stimulus size
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setSize(size, log = false)
	{
		// size is either undefined, null, or a tuple of numbers:
		if (typeof size !== "undefined" && size !== null)
		{
			size = util.toNumerical(size);
			if (!Array.isArray(size))
			{
				size = [size, size];
			}
		}

		const hasChanged = this._setAttribute("size", size, log);

		if (hasChanged)
		{
			this._onChange(true, true)();
		}

		// Handling youtube iframe resize here, since _updateIfNeeded aint going to be triggered due to absence of _pixi.
		if (this._youtubePlayer !== undefined)
		{
			let vidSizePx;
			if (this._size === undefined || this._size === null)
			{
				vidSizePx = util.to_unit(this._win.size, "pix", this.win, "pix");
			}
			else
			{
				vidSizePx = util.to_unit(this._size, this.units, this.win, "pix");
			}

			this._youtubePlayer.setSize(vidSizePx[0], vidSizePx[1]);
		}
	}

	/**
	 * Setter for the position attribute.
	 *
	 * @param {Array.<number>} pos - position of the center of the stimulus, in stimulus units
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setPos(pos, log = false)
	{
		super.setPos(pos);
		if (this._youtubePlayer !== undefined)
		{
			const pos_px = util.to_px(pos, this._units, this._win, false);
			pos_px[1] *= this._win._rootContainer.scale.y;
			this._youtubePlayer.getIframe().style.transform = `translate3d(${pos_px[0]}px, ${pos_px[1]}px, 0)`;
		}
	}

	/**
	 * Setter for the volume attribute.
	 *
	 * @param {number} volume - desired volume of the movie in [0, 1].
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setVolume(vol, log = false)
	{
		this._setAttribute("volume", vol, log);
		if (this._movie !== undefined)
		{
			this._movie.volume = vol;
		}
		else if (this._youtubePlayer !== undefined)
		{
			// Original movie takes volume in [0, 1], whereas youtube's player [0, 100].
			this._youtubePlayer.setVolume(vol * 100);
		}
	}

	/**
	 * Draw this stimulus on the next frame draw.
	 */
	draw()
	{
		super.draw();
		if (this._youtubePlayer !== undefined)
		{
			this.showYoutubePlayer();
		}
	}

	/**
	 * Hide this stimulus on the next frame draw.
	 */
	hide()
	{
		super.hide();
		if (this._youtubePlayer !== undefined)
		{
			this.hideYoutubePlayer();
		}
	}

	/**
	 * Handling youtube player being ready to work.
	 *
	 * @param {string} link to a youtube video. If this parameter is present, movie stim will embed a youtube video to an experiment.
	 * @param {boolean} [log= false] - whether or not to log.
	 */
	_onYoutubePlayerReady ()
	{
		console.log("yt player rdy", arguments);
	}

	/**
	 * Handling youtube player state change.
	 *
	 * @param {string} link to a youtube video. If this parameter is present, movie stim will embed a youtube video to an experiment.
	 * @param {boolean} [log= false] - whether or not to log.
	 */
	_onYoutubePlayerStateChange (e)
	{
		if (e.data === YT.PlayerState.PLAYING)
		{
			console.log("playing");
		}
		else if (e.data === YT.PlayerState.PAUSED)
		{
			console.log("paused");
		}
		else if (e.data === YT.PlayerState.ENDED)
		{
			console.log("done");
		}
		else if (e.data === YT.PlayerState.ENDED)
		{
			// Just in case for potential future requirements.
		}
	}

	/**
	 * Handling youtube player errors.
	 *
	 * @param {string} link to a youtube video. If this parameter is present, movie stim will embed a youtube video to an experiment.
	 * @param {boolean} [log= false] - whether or not to log.
	 */
	_onYoutubePlayerError ()
	{
		console.log("handling yt errors", arguments);
	}

	_handleResize (e)
	{
		if (this._youtubePlayer === undefined)
		{
			return;
		}

		// If size wasn't set, matching window size.
		if (this._size === undefined || this._size === null)
		{
			const vidSizePx = util.to_unit(this._win.size, "pix", this.win, "pix");
			this._youtubePlayer.setSize(vidSizePx[0], vidSizePx[1]);
		}
	}

	hideYoutubePlayer ()
	{
		if (this._youtubePlayer !== undefined)
		{
			this._youtubePlayer.stopVideo();
			this._youtubePlayer.getIframe().classList.add("hidden");
		}
	}

	showYoutubePlayer ()
	{
		if (this._youtubePlayer !== undefined)
		{
			this._youtubePlayer.getIframe().classList.remove("hidden");
		}
	}

	/**
	 * Setter for the youtubeUrl attribute.
	 *
	 * @param {string} link to a youtube video. If this parameter is present, movie stim will embed a youtube video to an experiment.
	 * @param {boolean} [log= false] - whether or not to log.
	 */
	async setYoutubeUrl (urlString = "", log = false)
	{
		if (urlString.length === 0)
		{
			// if (this._youtubePlayer !== undefined)
			// {
			// 	this._youtubePlayer.destroy();
			// 	this._youtubePlayer = undefined;
			// 	window.removeEventListener("resize", this._bindedHandlers._handleResize);
			// }
			this.hideYoutubePlayer();
			return;
		}

		// Handling the case when there's already regular movie is set.
		if (this._movie !== undefined)
		{
			this.stop();
			this.setMovie(undefined);

			// Removing stimuli from the drawing list.
			this.hide();

			// if (this._pixi !== undefined)
			// {
			// 	// https://pixijs.download/dev/docs/PIXI.Sprite.html#destroy
			// 	this._pixi.destroy({
			// 		children: true,
			// 		texture: true,
			// 		baseTexture: false,
			// 	});
			// 	this._pixi = undefined;
			// 	this._texture = undefined;
			// }
		}

		const urlObj = new URL(urlString);

		if (this._youtubePlayer === undefined)
		{
			// This should be handled systematically, using PsychoJS's window object. Which in turn should be extended to emit "resize" events.
			window.addEventListener("resize", this._bindedHandlers._handleResize);

			let vidSizePx;

			// If size wasn't set, matching window size.
			if (this._size === undefined || this._size === null)
			{
				vidSizePx = util.to_unit(this._win.size, "pix", this.win, "pix");
			}
			else
			{
				vidSizePx = util.to_unit(this._size, this.units, this.win, "pix");
			}

			await YoutubeIframeAPIHandler.init();
			this._youtubePlayer = YoutubeIframeAPIHandler.createPlayer({
				videoId: urlObj.searchParams.get("v"),
				width: vidSizePx[0],
				height: vidSizePx[1],
				playerVars: {
					"rel": 0,
					"playsinline": 1,
					"modestbranding": 1,
					"disablekb": Number(this._disableYoutubePlayerKeyboardControls) || 0,
					"autoplay": Number(this._autoPlay) || 0,
					"controls": Number(this._showYoutubeControls) || 0,
					"loop": Number(this._loop) || 0,
				},
				events: {
					"onReady": this._onYoutubePlayerReady.bind(this),
					"onStateChange": this._onYoutubePlayerStateChange.bind(this),
					"onError": this._onYoutubePlayerError.bind(this),
					// "onPlaybackQualityChange":
					// "onPlaybackRateChange":
					// "onApiChange":
				}
			});
		}
		else
		{
			this._youtubePlayer.loadVideoById(urlObj.searchParams.get("v"));
			this.showYoutubePlayer();
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

		if (this._movie !== undefined)
		{
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
		else if (this._youtubePlayer !== undefined)
		{
			this._youtubePlayer.playVideo();
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
		if (this._movie !== undefined)
		{
			this._movie.pause();
		}
		else if (this._youtubePlayer !== undefined)
		{
			this._youtubePlayer.pauseVideo();
		}
	}

	/**
	 * Stop the movie and reset to 0s.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	stop(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		if (this._movie !== undefined)
		{
			this._movie.pause();
			this.seek(0, log);
		}
		else if (this._youtubePlayer !== undefined)
		{
			this._youtubePlayer.stopVideo();
		}
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
	 * Get the elapsed time in seconds since the video started playing.
	 *
	 * @return {number} playback time.
	 */
	getPlaybackTime ()
	{
		if (this._movie !== undefined)
		{
			return this._movie.currentTime;
		}
		else if (this._youtubePlayer !== undefined)
		{
			return this._youtubePlayer.getCurrentTime();
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

			// Not using PIXI.Texture.from() on purpose, as it caches both PIXI.Texture and PIXI.BaseTexture.
			// As a result of that we can have multiple MovieStim instances using same PIXI.BaseTexture,
			// thus changing texture related properties like interpolation, or calling _pixi.destroy(true)
			// will affect all MovieStims which happen to share that BaseTexture.
			this._texture = new PIXI.Texture(new PIXI.BaseTexture(
				this._movie,
				{
					resourceOptions: { autoPlay: this.autoPlay }
				}
			));

			// create a PixiJS video sprite:
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
