/**
 * Movie Stimulus.
 *
 * @author Alain Pitiot & Nikita Agafonov
 * @copyright (c) 2020-2025 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { PsychoJS } from "../core/PsychoJS.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";
import {Camera} from "../hardware/Camera.js";
import YouTubeIframeAPIHandler from "./YouTubeIframeAPI.js";

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
	 * @param {string} [options.youtubeUrl] - Url of a YouTube video.
	 * @param {boolean} [options.showYoutubeControls] - whether to show YouTube player controls.
	 * @oaram {boolean} [options.disableYoutubePlayerKeyboardControls=false] - if true, the YouTube player will not
	 * respond to keyboard controls.
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
	 * @param {Color} [options.color= Color('white')] the background color
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {number} [options.contrast= 1.0] - the contrast
	 * @param {boolean} [options.interpolate= false] - whether the image is interpolated
	 * @param {boolean} [options.flipHoriz= false] - whether to flip horizontally
	 * @param {boolean} [options.flipVert= false] - whether to flip vertically
	 * @param {boolean} [options.loop= false] - whether to loop the movie
	 * @param {number} [options.volume= 1.0] - the volume of the audio track (must be between 0.0 and 1.0)
	 * @param {boolean} [options.noAudio= false] - whether to play the audio
	 * @param {boolean} [options.autoPlay= true] - whether to autoplay the video
	 * @param {boolean} [options.autoDraw= false] - whether the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether to log
	 * @param {boolean} [options.draggable= false] - whether to make stim draggable with mouse/touch/other pointer device
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
		autoLog,
		draggable
	} = {})
	{
		super({ name, win, units, ori, opacity, pos, anchor, size, autoDraw, autoLog, draggable });

		this.psychoJS.logger.debug("create a new MovieStim with name: ", name);

		this._addAttribute(
			"movie",
			movie,
		);

		// YouTube controls:
		this._youTubePlayer = undefined;
		this._youTubePlayerIsReady = false;

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

		// scheduled seek timepoint:
		this._scheduledSeekTimePoint = null;

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
	 * @param {boolean} [log= false] - whether to log
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
				// if movie is a string, then it should either be the name of a resource, or a YouTube URL:
				if (typeof movie === "string")
				{
					// test whether movie is a YouTube URL:
					if (movie.indexOf("https://www.youtube.com/watch?") === 0)
					{
						return this.setYoutubeUrl(movie, log);
					}
					
					// since it is not a URL, it must be the name of a resource:
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

				// resize the stimulus when the video is loaded
				// this prevents this._texture.width from being stuck at 1px.
				const onLoadedData = () =>
				{
					// TODO this is a Nikita-level hack, look into it and possibly update it
					this.size = this._size;

					movie.removeEventListener("loadeddata", onLoadedData);
				};

				if (movie.readyState < movie.HAVE_FUTURE_DATA)
				{
					movie.addEventListener("loadeddata", onLoadedData);
				}

				this.hideYouTubePlayer();
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
	 * @param {boolean} [log= false] - whether to log
	 */
	setSize(size, log = false)
	{
		// sanitize the size parameter:

		// (a) make sure it is an array of size 2:
		if (!Array.isArray(size))
		{
			size = [size, size];
		}
		if (size.length <= 1)
		{
			size = [size[0], size[0]];
		}

		// (b) make sure that all size values are numbers:
		for (let i = 0; i < size.length; ++i)
		{
			try
			{
				size[i] = util.toNumerical(size[i]);
			}
			catch (err)
			{
				size[i] = NaN;
			}
		}

		// (c) if a html5Video element is available and we have enough data loaded to query its size then do so:
		if (typeof this._movie !== "undefined" && this._movie.readyState >= this._movie.HAVE_FUTURE_DATA)
		{
			size = this._updateSizeFromHtml5Video(size, this._movie);
		}

		// change the scale of the underlying PIXI component:
		if (typeof this._texture !== "undefined")
		{
			this._applySizeToPixi(size);
		}

		// we handle the resizing of the YouTube iframe here, since _updateIfNeeded only acts upon the _pixi
		// component, which is not involved when runing YouTube videos
		if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._applySizeToYoutubeIframe(size);

			// note: (a) since Youtube player handles NaN size automatically, we use it here.
			//        (b) we are not using this._youtubePlayer.getSize() is not used intentionally, because it returns
			//        the initial values even after a different size has been set.
			const ytPlayerBCR = this._youTubePlayer.getIframe().getBoundingClientRect();
			size = util.to_unit([ ytPlayerBCR.width, ytPlayerBCR.height ], "pix", this._win, this._units);
		}

		this._setAttribute("size", size, log);
	}

	/**
	 * Setter for the position attribute.
	 *
	 * @param {Array.<number>} pos - position of the center of the stimulus, in stimulus units
	 * @param {boolean} [log= false] - whether to log
	 */
	setPos(pos, log = false)
	{
		super.setPos(pos, log);
		// if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		if (this._youTubePlayer !== undefined)
		{
			const pos_px = util.to_px(pos, this._units, this._win, false);
			pos_px[1] *= this._win._rootContainer.scale.y;
			this._youTubePlayer.getIframe().style.transform = `translate3d(${pos_px[0]}px, ${pos_px[1]}px, 0)`;
		}
	}

	/**
	 * Setter for the volume attribute.
	 *
	 * @param {number} vol - desired volume of the movie in [0, 1].
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setVolume(vol, log = false)
	{
		this._setAttribute("volume", vol, log);
		if (this._movie !== undefined)
		{
			this._movie.volume = vol;
		}
		else if (this._youTubePlayer !== undefined && this._youTubePlayerIsReady)
		{
			// Original movie takes volume in [0, 1], whereas youtube's player [0, 100].
			this._youTubePlayer.setVolume(vol * 100);
		}
	}

	/**
	 * Draw this stimulus on the next frame draw.
	 */
	draw()
	{
		super.draw();
		if (this._youTubePlayer !== undefined && this._youTubePlayerIsReady)
		{
			this.showYouTubePlayer();
		}
	}

	/**
	 * Hide this stimulus on the next frame draw.
	 */
	hide()
	{
		super.hide();
		if (this._youTubePlayer !== undefined && this._youTubePlayerIsReady)
		{
			this.hideYouTubePlayer();
		}
	}

	/**
	 * Handling youtube player being ready to work.
	 *
	 * @param {*} event - YouTube Player Event
	 */
	_onYoutubePlayerReady(event)
	{
		this._youTubePlayerIsReady = true;

		if (Number.isNaN(this._size[ 0 ]) || Number.isNaN(this._size[ 1 ]))
		{
			// Youtube player handles NaN size automatically. Leveraging that to cover unset size.
			// IMPORTANT! this._youtubePlayer.getSize() is not used intentionally, because it returns initial values event after different size was set.
			const ytPlayerBCR = this._youTubePlayer.getIframe().getBoundingClientRect();
			this._setAttribute(
				"size",
				util.to_unit([ ytPlayerBCR.width, ytPlayerBCR.height ], "pix", this._win, this._units),
				true
			);
		}

		this.setVolume(this._volume, true);

		// if a seek has been scheduled, apply it now that the player is ready:
		if (this._scheduledSeekTimePoint)
		{
			this.seek(this._scheduledSeekTimePoint);
		}
	}

	/**
	 * Callback called upon changes to the YouTube Player state, e.g. PLAYING, PAUSED.
	 *
	 * @param {*} event - YouTube Player Event
	 */
	_onYoutubePlayerStateChange(event)
	{
		if (event.data === YT.PlayerState.PLAYING)
		{
			// placeholder
		}
		else if (event.data === YT.PlayerState.PAUSED)
		{
			// placeholder
		}
		else if (event.data === YT.PlayerState.ENDED)
		{
			// placeholder
		}
	}

	/**
	 * Handling youtube player errors.
	 *
	 */
	_onYoutubePlayerError(error)
	{
		console.error("youtube player error:", error);
	}

	/**
	 * Hide the YouTube Player, if there is one to hide.
	 * @returns void
	 */
	hideYouTubePlayer()
	{
		if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.stopVideo();
			this._youTubePlayer.getIframe().parentElement.classList.add("hidden");
		}
	}

	/**
	 * Show the YouTube Player, if there is one to show.
	 * @returns void
	 */
	showYouTubePlayer()
	{
		if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.getIframe().parentElement.classList.remove("hidden");
		}
	}

	/**
	 * Setter for the youtubeUrl attribute.
	 *
	 * @param {string} url - url of a YouTube video
	 * @param {boolean} [log= false] - whether to log
	 */
	async setYoutubeUrl(url = "", log = false)
	{
		if (url.length === 0)
		{
			this.hideYouTubePlayer();
			return;
		}

		// Handling the case when there's already regular movie is set.
		if (this._movie !== undefined)
		{
			this.stop();
			this.setMovie(undefined);

			// Removing stimuli from the drawing list.
			this.hide();
		}

		const urlObj = new URL(url);
		if (this._youTubePlayer === undefined)
		{
			const vidSizePx = util.to_unit(this._size, this.units, this.win, "pix");

			await YouTubeIframeAPIHandler.init();

			this._youTubePlayer = YouTubeIframeAPIHandler.createPlayer({
				videoId: urlObj.searchParams.get("v"),
				width: vidSizePx[0],
				height: vidSizePx[ 1 ],
				playerVars: {
					rel: 0,
					playsinline: 1,
					modestbranding: 1,
					disablekb: Number(this._disableYoutubePlayerKeyboardControls) || 0,
					autoplay: Number(this._autoPlay) || 0,
					controls: Number(this._showYoutubeControls) || 0,
					loop: Number(this._loop) || 0,
				},
				events: {
					onReady: this._onYoutubePlayerReady.bind(this),
					onStateChange: this._onYoutubePlayerStateChange.bind(this),
					onError: this._onYoutubePlayerError.bind(this),

					// onPlaybackQualityChange:
					// onPlaybackRateChange:
					// onApiChange:
				}
			});

			// At this point youtube player is added to the page. Invoking position setter to ensure html element is placed as expected.
			this.pos = this._pos;
		}
		else
		{
			this._youTubePlayer.loadVideoById(urlObj.searchParams.get("v"));
			this.showYouTubePlayer();
		}
	}

	/**
	 * Reset the stimulus.
	 *
	 * @param {boolean} [log= false] - whether to log
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
	 * @param {boolean} [log= false] - whether to log
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
		else if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.playVideo();
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
		else if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.pauseVideo();
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
		if (typeof this._movie !== "undefined")
		{
			this._movie.pause();
			this.seek(0, log);
		}
		else if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.stopVideo();
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
		const response = {
			origin: "MovieStim.seek",
			context: `when seeking to timepoint: ${timePoint} of MovieStim: ${this._name}`
		};

		if (typeof this._movie !== "undefined")
		{
			if (timePoint < 0 || timePoint > this._movie.duration)
			{
				throw { ...response, error: `the timepoint does not belong to [0, ${this._movie.duration}`};
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
					throw { ...response, error};
				}
			}
		}

		else if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			this._youTubePlayer.seekTo(timePoint);
		}

		else
		{
			// schedule a seek:
			this._scheduledSeekTimePoint = timePoint;
		}
	}

	/**
	 * Get the elapsed time in seconds since the video started playing.
	 *
	 * @return {number} playback time.
	 */
	getPlaybackTime ()
	{
		if (typeof this._movie !== "undefined")
		{
			return this._movie.currentTime;
		}
		else if (typeof this._youTubePlayer !== "undefined" && this._youTubePlayerIsReady)
		{
			return this._youTubePlayer.getCurrentTime();
		}

		return 0;
	}

	/**
	 * Applies given size values to underlying pixi component of the stim.
	 *
	 * @param {Array} size
	 */
	_applySizeToPixi(size)
	{
		const size_px = util.to_px(size, this._units, this._win);
		const scaleX = size_px[0] / this._movie.videoWidth;
		const scaleY = size_px[1] / this._movie.videoHeight;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;
	}

	/**
	 * Applies given size values to youtube iframe.
	 *
	 * @param {*} size
	 */
	_applySizeToYoutubeIframe(size)
	{
		const size_px = util.to_px(size, this._units, this._win);
		this._youTubePlayer.setSize(size_px[ 0 ], size_px[ 1 ]);
	}

	/**
	 * Replace those size values that are NaN by values obtained from the HTML5 Video element.
	 * @param {Array} size - the input size array, possibly containing NaN values
	 * @returns {Array} the updated size array
	 */
	_updateSizeFromHtml5Video(size, html5Video)
	{
		if (Number.isNaN(size[0]) && Number.isNaN(size[1]))
		{
			size = util.to_unit([html5Video.videoWidth, html5Video.videoHeight], "pix", this._win, this._units);
		}
		else if (Number.isNaN(size[0]))
		{
			size[0] = size[1] * (html5Video.videoWidth / html5Video.videoHeight);
		}
		else if (Number.isNaN(size[1]))
		{
			size[1] = size[0] / (html5Video.videoWidth / html5Video.videoHeight);
		}

		return size;
	}

	/**
	 * Estimate the bounding box.
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
			// this._texture = PIXI.Texture.from(this._movie, { resourceOptions: { autoPlay: this.autoPlay } });
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

		// note: initial setSize might be called with incomplete values like [512, null].
		// Before texture is loaded they are converted to [512, NaN].
		// At this point the texture is loaded, and we can convert NaN to proper values.
		this.size = this._size;

		// set the position, rotation, and anchor (movie centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;
		this.anchor = this._anchor;

		// re-estimate the bounding box, as the texture's width may now be available:
		this._estimateBoundingBox();
	}

	/**
	 * Get the size of the display image, which is either that of the MovieStim or that of the image
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
