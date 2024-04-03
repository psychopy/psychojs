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
	 * @param {boolean} [options.draggable= false] - whether or not to make stim draggable with mouse/touch/other pointer device
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

		this._pixiTextureResource = undefined;

		// Used in case when youtubeUrl parameter is set to a proper youtube url.
		this._youtubePlayer = undefined;
		this._ytPlayerIsReady = false;

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
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setMovie(movie, log = false)
	{
		const response = {
			origin: "MovieStim.setMovie",
			context: `when setting the movie of MovieStim: ${this._name}`,
		};

		try
		{
			let htmlVideo = undefined;
			this._pixiTextureResource = undefined;

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
				let videoResource;

				// If movie is a string, then it should be the name of a resource, which we get:
				if (typeof movie === "string")
				{
					videoResource = this.psychoJS.serverManager.getResource(movie);
				}
				// If movie is a HTMLVideoElement, pass it as is:
				else if (movie instanceof HTMLVideoElement)
				{
					videoResource = movie;
				}
				// If movie is an instance of camera, get a video element from it:
				else if (movie instanceof Camera)
				{
					// old behaviour: feeding a Camera to MovieStim plays the live stream:
					videoResource = movie.getVideo();
					// TODO remove previous movie if there is one

					/*
					// new behaviour: feeding a Camera to MovieStim replays the video previously recorded by the Camera:
					const video = movie.getRecording();
					movie = video;
					*/
				}

				if (videoResource instanceof HTMLVideoElement)
				{
					htmlVideo = videoResource;
					htmlVideo.playsInline = true;
					this._pixiTextureResource = PIXI.Texture.from(htmlVideo, { resourceOptions: { autoPlay: false } });
					// Not using PIXI.Texture.from() on purpose, as it caches both PIXI.Texture and PIXI.BaseTexture.
					// As a result of that we can have multiple MovieStim instances using same PIXI.BaseTexture,
					// thus changing texture related properties like interpolation, or calling _pixi.destroy(true)
					// will affect all MovieStims which happen to share that BaseTexture.
					this._pixiTextureResource = new PIXI.Texture(new PIXI.BaseTexture(
						this._movie,
						{
							resourceOptions: { autoPlay: this.autoPlay }
						}
					));
				}
				else if (videoResource instanceof PIXI.Texture)
				{
					htmlVideo = videoResource.baseTexture.resource.source;
					this._pixiTextureResource = videoResource;
				}
				else
				{
					throw `${videoResource.toString()} is not a HTMLVideoElement nor PIXI.Texture!`;
				}

				this.psychoJS.logger.debug(`set the movie of MovieStim: ${this._name} as: src= ${htmlVideo.src}, size= ${htmlVideo.videoWidth}x${htmlVideo.videoHeight}, duration= ${htmlVideo.duration}s`);

				// ensure we have only one onended listener per HTMLVideoElement, since we can have several
				// MovieStim with the same underlying HTMLVideoElement
				// https://stackoverflow.com/questions/11455515
				// TODO: make it actually work!
				if (!htmlVideo.onended)
				{
					htmlVideo.onended = () =>
					{
						this.status = PsychoJS.Status.FINISHED;
					};
				}

				// Resize the stim when video is loaded. Otherwise this._pixiTextureResource.width is 1.
				const loadedDataCb = () =>
				{
					this.size = this._size;
					movie.removeEventListener("loadeddata", loadedDataCb);
				};

				if (movie.readyState < movie.HAVE_FUTURE_DATA)
				{
					movie.addEventListener("loadeddata", loadedDataCb)
				}

				this.hideYoutubePlayer();
			}

			this._setAttribute("movie", htmlVideo, log);
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
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setSize(size, log = false)
	{
		if (!Array.isArray(size))
		{
			size = [size, size];
		}

		if (Array.isArray(size) && size.length <= 1)
		{
			size = [size[0], size[0]];
		}

		for (let i = 0; i < size.length; i++)
		{
			try
			{
				size[i] = util.toNumerical(size[i]);
			}
			catch (err)
			{
				// Failed to convert to numeric. Set to NaN.
				size[ i ] = NaN;
			}
		}

		// If the html5Video is available and loaded enough, use information from it to convert NaN to proper values.
		if (this._movie !== undefined && this._movie.readyState >= this._movie.HAVE_FUTURE_DATA)
		{
			size = this._ensureNaNSizeConversion(size, this._movie);
		}

		if (this._pixiTextureResource !== undefined)
		{
			this._applySizeToPixi(size);
		}

		if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			// Handling youtube iframe resize here, since _updateIfNeeded aint going to be triggered due to absence of _pixi component.
			this._applySizeToYoutubeIframe(size);

			// Youtube player handles NaN size automatically. Leveraging that to cover unset size.
			// IMPORTANT! this._youtubePlayer.getSize() is not used intentionally, because it returns initial values event after different size was set.
			const ytPlayerBCR = this._youtubePlayer.getIframe().getBoundingClientRect();
			size = util.to_unit([ ytPlayerBCR.width, ytPlayerBCR.height ], "pix", this._win, this._units);
		}

		this._setAttribute("size", size, log);
	}

	/**
	 * Setter for the position attribute.
	 *
	 * @param {Array.<number>} pos - position of the center of the stimulus, in stimulus units
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setPos(pos, log = false)
	{
		super.setPos(pos, log);
		// if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
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
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
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
		if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
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
		if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
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
	_onYoutubePlayerReady (e)
	{
		this._ytPlayerIsReady = true;

		if (Number.isNaN(this._size[ 0 ]) || Number.isNaN(this._size[ 1 ]))
		{
			// Youtube player handles NaN size automatically. Leveraging that to cover unset size.
			// IMPORTANT! this._youtubePlayer.getSize() is not used intentionally, because it returns initial values event after different size was set.
			const ytPlayerBCR = this._youtubePlayer.getIframe().getBoundingClientRect();
			this._setAttribute("size", util.to_unit([ ytPlayerBCR.width, ytPlayerBCR.height ], "pix", this._win, this._units), true);
		}

		this.setVolume(this._volume, true);
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
			// Just in case for potential future requirements.
		}
		else if (e.data === YT.PlayerState.PAUSED)
		{
			// Just in case for potential future requirements.
		}
		else if (e.data === YT.PlayerState.ENDED)
		{
			// Just in case for potential future requirements.
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
	_onYoutubePlayerError (err)
	{
		// Just in case for potential future requirements.
		console.error("youtube player error:", arguments);
	}

	hideYoutubePlayer ()
	{
		if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			this._youtubePlayer.stopVideo();
			this._youtubePlayer.getIframe().parentElement.classList.add("hidden");
		}
	}

	showYoutubePlayer ()
	{
		if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			this._youtubePlayer.getIframe().parentElement.classList.remove("hidden");
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
		}

		const urlObj = new URL(urlString);
		if (this._youtubePlayer === undefined)
		{
			const vidSizePx = util.to_unit(this._size, this.units, this.win, "pix");

			await YoutubeIframeAPIHandler.init();

			this._youtubePlayer = YoutubeIframeAPIHandler.createPlayer({
				videoId: urlObj.searchParams.get("v"),
				width: vidSizePx[0],
				height: vidSizePx[ 1 ],
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

			// At this point youtube player is added to the page. Invoking position setter to ensure html element is placed as expected.
			this.pos = this._pos;
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
	 * @param {boolean} [log= false] - whether or not to log
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
	 * @param {boolean} [log= false] - whether or not to log
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
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			this._youtubePlayer.playVideo();
		}
	}

	/**
	 * Pause the movie.
	 *
	 * @param {boolean} [log= false] - whether or not to log
	 */
	pause(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		if (this._movie !== undefined)
		{
			this._movie.pause();
		}
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			this._youtubePlayer.pauseVideo();
		}
	}

	/**
	 * Stop the movie and reset to 0s.
	 *
	 * @param {boolean} [log= false] - whether or not to log
	 */
	stop(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		if (this._movie !== undefined)
		{
			this._movie.pause();
			this.seek(0, log);
		}
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
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
	 * @param {boolean} [log= false] - whether or not to log
	 */
	seek(timePoint, log = false)
	{
		if (this._movie !== undefined)
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
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			this._youtubePlayer.seekTo(timePoint);
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
		else if (this._youtubePlayer !== undefined && this._ytPlayerIsReady)
		{
			return this._youtubePlayer.getCurrentTime();
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
		this._youtubePlayer.setSize(size_px[ 0 ], size_px[ 1 ]);
	}

	/**
	 * Ensures to convert NaN in the size values to proper, numerical values using given texture dimensions.
	 *
	 * @param {Array} size
	 */
	_ensureNaNSizeConversion(size, html5Video)
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

			// No PIXI.Texture, also return immediately.
			if (this._pixiTextureResource === undefined)
			{
				return;
			}

			// create a PixiJS video sprite:
			this._pixiTextureResource.baseTexture.resource.autoPlay = this._autoPlay;
			this._pixi = new PIXI.Sprite(this._pixiTextureResource);

			if (this._autoPlay)
			{
				this._pixiTextureResource.baseTexture.resource.source.play();
			}

			// since _pixiTextureResource.width may not be immedialy available but the rest of the code needs its value
			// we arrange for repeated calls to _updateIfNeeded until we have a width:
			if (this._pixiTextureResource.width === 0)
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

		// initial setSize might be called with incomplete values like [512, null].
		// Before texture is loaded they are converted to [512, NaN].
		// At this point the texture is loaded and we can convert NaN to proper values.
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
	 * @name module:visual.MovieStim#_getDisplaySize
	 * @private
	 * @protected
	 * @return {number[]} the size of the displayed image
	 */
	_getDisplaySize()
	{
		let displaySize = this.size;

		if (typeof displaySize === "undefined")
		{
			// use the size of the texture, if we have access to it:
			if (typeof this._pixiTextureResource !== "undefined" && this._pixiTextureResource.width > 0)
			{
				const textureSize = [this._pixiTextureResource.width, this._pixiTextureResource.height];
				displaySize = util.to_unit(textureSize, "pix", this.win, this.units);
			}
		}

		return displaySize;
	}
}
