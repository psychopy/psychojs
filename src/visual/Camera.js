/**
 * Manager handling the recording of video signal.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {Clock} from "../util/Clock.js";
import {PsychObject} from "../util/PsychObject.js";
import {PsychoJS} from "../core/PsychoJS.js";
import * as util from "../util/Util.js";
import {ExperimentHandler} from "../data/ExperimentHandler.js";
// import {VideoClip} from "./VideoClip";


/**
 * <p>This manager handles the recording of video signal.</p>
 *
 * @name module:visual.Camera
 * @class
 * @param {Object} options
 * @param @param {module:core.Window} options.win - the associated Window
 * @param {string} [options.format='video/webm;codecs=vp9'] the video format
 * @param {Clock} [options.clock= undefined] - an optional clock
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo add video constraints as parameter
 */
export class Camera extends PsychObject
{
	/**
	 * @constructor
	 * @public
	 */
	constructor({win, name, format, clock, autoLog} = {})
	{
		super(win._psychoJS);

		this._addAttribute("win", win, undefined);
		this._addAttribute("name", name, "camera");
		this._addAttribute("format", format, "video/webm;codecs=vp9", this._onChange);
		this._addAttribute("clock", clock, new Clock());
		this._addAttribute("autoLog", autoLog, false);
		this._addAttribute("status", PsychoJS.Status.NOT_STARTED);

		// prepare the recording:
		this._prepareRecording();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Get the underlying video stream.
	 *
	 * @name module:visual.Camera#getStream
	 * @function
	 * @public
	 * @returns {MediaStream} the video stream
	 */
	getStream()
	{
		return this._stream;
	}


	/**
	 * Get a video element pointing to the Camera stream.
	 *
	 * @name module:visual.Camera#getVideo
	 * @function
	 * @public
	 * @returns {HTMLVideoElement} a video element
	 */
	getVideo()
	{
		// note: we need to return a new video each time, since the camera feed can be used by
		// several stimuli and one of them might pause the feed

		// create a video with the appropriate size:
		const video = document.createElement("video");
		this._videos.push(video);

		video.width = this._streamSettings.width;
		video.height = this._streamSettings.height;
		video.autoplay = true;

		// prevent clicking:
		video.onclick = (mouseEvent) =>
		{
			mouseEvent.preventDefault();
			return false;
		};

		// use the camera stream as source for the video:
		video.srcObject = this._stream;

		return video;
	}


	/**
	 * Submit a request to start the recording.
	 *
	 * @name module:visual.Camera#start
	 * @function
	 * @public
	 * @return {Promise} promise fulfilled when the recording actually started
	 */
	start()
	{
		// if the camera is currently paused, a call to start resumes it
		// with a new recording:
		if (this._status === PsychoJS.Status.PAUSED)
		{
			return this.resume({clear: true});
		}


		if (this._status !== PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug("request to start video recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record video";
				}

				this._recorder.start();

				// return a promise, which will be satisfied when the recording actually starts, which
				// is also when the reset of the clock and the change of status takes place
				const self = this;
				return new Promise((resolve, reject) =>
				{
					self._startCallback = resolve;
					self._errorCallback = reject;
				});
			}
			catch (error)
			{
				this._psychoJS.logger.error("unable to start the video recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Camera.start",
					context: "when starting the video recording for camera: " + this._name,
					error
				};
			}

		}

	}


	/**
	 * Submit a request to stop the recording.
	 *
	 * @name module:visual.Camera#stop
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {string} [options.filename] the name of the file to which the video recording
	 * 	will be saved
	 * @return {Promise} promise fulfilled when the recording actually stopped, and the recorded
	 * 	data was made available
	 */
	stop({filename} = {})
	{
		if (this._status === PsychoJS.Status.STARTED || this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to stop video recording");

			// stop the videos:
			for (const video of this._videos)
			{
				video.pause();
			}

			this._stopOptions = {
				filename
			};

			// note: calling the stop method of the MediaRecorder will first raise
			// a dataavailable event, and then a stop event
			// ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop
			this._recorder.stop();

			// return a promise, which will be satisfied when the recording actually stops and the data
			// has been made available:
			const self = this;
			return new Promise((resolve, reject) =>
			{
				self._stopCallback = resolve;
				self._errorCallback = reject;
			});
		}
	}


	/**
	 * Submit a request to pause the recording.
	 *
	 * @name module:visual.Camera#pause
	 * @function
	 * @public
	 * @return {Promise} promise fulfilled when the recording actually paused
	 */
	pause()
	{
		if (this._status === PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug("request to pause video recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record video";
				}

				// note: calling the pause method of the MediaRecorder raises a pause event
				this._recorder.pause();

				// return a promise, which will be satisfied when the recording actually pauses:
				const self = this;
				return new Promise((resolve, reject) =>
				{
					self._pauseCallback = resolve;
					self._errorCallback = reject;
				});
			}
			catch (error)
			{
				self._psychoJS.logger.error("unable to pause the video recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Camera.pause",
					context: "when pausing the video recording for camera: " + this._name,
					error
				};
			}

		}
	}


	/**
	 * Submit a request to resume the recording.
	 *
	 * <p>resume has no effect if the recording was not previously paused.</p>
	 *
	 * @name module:visual.Camera#resume
	 * @function
	 * @param {Object} options
	 * @param {boolean} [options.clear= false] whether or not to empty the video buffer before
	 * 	resuming the recording
	 * @return {Promise} promise fulfilled when the recording actually resumed
	 */
	resume({clear = false } = {})
	{
		if (this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to resume video recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record video";
				}

				// empty the audio buffer is needed:
				if (clear)
				{
					this._audioBuffer = [];
					this._videoBuffer.length = 0;
				}

				this._recorder.resume();

				// return a promise, which will be satisfied when the recording actually resumes:
				const self = this;
				return new Promise((resolve, reject) =>
				{
					self._resumeCallback = resolve;
					self._errorCallback = reject;
				});
			}
			catch (error)
			{
				self._psychoJS.logger.error("unable to resume the video recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Camera.resume",
					context: "when resuming the video recording for camera: " + this._name,
					error
				};
			}

		}
	}


	/**
	 * Submit a request to flush the recording.
	 *
	 * @name module:visual.Camera#flush
	 * @function
	 * @public
	 * @return {Promise} promise fulfilled when the data has actually been made available
	 */
	flush()
	{
		if (this._status === PsychoJS.Status.STARTED || this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to flush video recording");

			// note: calling the requestData method of the MediaRecorder will raise a
			// dataavailable event
			// ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/requestData
			this._recorder.requestData();

			// return a promise, which will be satisfied when the data has been made available:
			const self = this;
			return new Promise((resolve, reject) =>
			{
				self._dataAvailableCallback = resolve;
				self._errorCallback = reject;
			});
		}
	}


	/**
	 * Offer the audio recording to the participant as a video file to download.
	 *
	 * @name module:visual.Camera#download
	 * @function
	 * @public
	 * @param {string} filename - the filename of the video file
	 */
	download(filename = "video.webm")
	{
		const videoBlob = new Blob(this._videoBuffer);

		const anchor = document.createElement("a");
		anchor.href = window.URL.createObjectURL(videoBlob);
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}


	/**
	 * Upload the video recording to the pavlovia server.
	 *
	 * @name module:visual.Camera#upload
	 * @function
	 * @public
	 * @param @param {Object} options
	 * @param {string} options.tag an optional tag for the video file
	 * @param {boolean} [options.waitForCompletion= false] whether or not to wait for completion
	 * 	before returning
	 */
	async upload({tag, waitForCompletion = false} = {})
	{
		// default tag: the name of this Camera object
		if (typeof tag === "undefined")
		{
			tag = this._name;
		}

		// add a format-dependent video extension to the tag:
		tag += util.extensionFromMimeType(this._format);


		// if the video recording cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the video recording as a file for download:
		if (this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER ||
			this._psychoJS.config.experiment.status !== "RUNNING" ||
			this._psychoJS._serverMsg.has("__pilotToken"))
		{
			return this.download(tag);
		}

		// upload the blob:
		const videoBlob = new Blob(this._videoBuffer);
		return this._psychoJS.serverManager.uploadAudioVideo(videoBlob, tag, waitForCompletion);
	}


	/**
	 * Get the current video recording as a VideoClip in the given format.
	 *
	 * @name module:visual.Camera#getRecording
	 * @function
	 * @public
	 * @param {string} tag an optional tag for the video clip
	 * @param {boolean} [flush=false] whether or not to first flush the recording
	 */
	async getRecording({tag, flush = false} = {})
	{
		// default tag: the name of this Microphone object
		if (typeof tag === "undefined")
		{
			tag = this._name;
		}

		// TODO
	}


	/**
	 * Callback for changes to the recording settings.
	 *
	 * <p>Changes to the settings require the recording to stop and be re-started.</p>
	 *
	 * @name module:visual.Camera#_onChange
	 * @function
	 * @protected
	 */
	_onChange()
	{
		if (this._status === PsychoJS.Status.STARTED)
		{
			this.stop();
		}

		this._prepareRecording();

		this.start();
	}


	/**
	 * Prepare the recording.
	 *
	 * @name module:visual.Camera#_prepareRecording
	 * @function
	 * @protected
	 */
	async _prepareRecording()
	{
		// empty the video buffer:
		this._videoBuffer = [];
		this._recorder = null;
		this._videos = [];

		// create a new stream with ideal dimensions:
		// TODO use size constraints
		this._stream = await navigator.mediaDevices.getUserMedia({
			video: true
		});

		// check the actual width and height:
		this._streamSettings = this._stream.getVideoTracks()[0].getSettings();
		this._psychoJS.logger.debug(`camera stream settings: ${JSON.stringify(this._streamSettings)}`);


		// check that the specified format is supported, use default if it is not:
		let options;
		if (typeof this._format === "string" && MediaRecorder.isTypeSupported(this._format))
		{
			options = { type: this._format };
		}
		else
		{
			this._psychoJS.logger.warn(`The specified video format, ${this._format}, is not supported by this browser, using the default format instead`);
		}


		// create a video recorder:
		this._recorder = new MediaRecorder(this._stream, options);


		// setup the callbacks:
		const self = this;

		// called upon Camera.start(), at which point the audio data starts being gathered
		// into a blob:
		this._recorder.onstart = () =>
		{
			self._videoBuffer = [];
			self._videoBuffer.length = 0;
			self._clock.reset();
			self._status = PsychoJS.Status.STARTED;
			self._psychoJS.logger.debug("video recording started");

			// resolve the Microphone.start promise:
			if (self._startCallback)
			{
				self._startCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Camera.pause():
		this._recorder.onpause = () =>
		{
			self._status = PsychoJS.Status.PAUSED;
			self._psychoJS.logger.debug("video recording paused");

			// resolve the Microphone.pause promise:
			if (self._pauseCallback)
			{
				self._pauseCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Camera.resume():
		this._recorder.onresume = () =>
		{
			self._status = PsychoJS.Status.STARTED;
			self._psychoJS.logger.debug("video recording resumed");

			// resolve the Microphone.resume promise:
			if (self._resumeCallback)
			{
				self._resumeCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called when video data is available, typically upon Camera.stop() or Camera.flush():
		this._recorder.ondataavailable = (event) =>
		{
			const data = event.data;

			// add data to the buffer:
			self._videoBuffer.push(data);
			self._psychoJS.logger.debug("video data added to the buffer");

			// resolve the data available promise, if needed:
			if (self._dataAvailableCallback)
			{
				self._dataAvailableCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Camera.stop(), after data has been made available:
		this._recorder.onstop = () =>
		{
			self._psychoJS.logger.debug("video recording stopped");
			self._status = PsychoJS.Status.NOT_STARTED;

			// resolve the Microphone.stop promise:
			if (self._stopCallback)
			{
				self._stopCallback(self._psychoJS.monotonicClock.getTime());
			}

			// treat stop options if there are any:

			// download to a file, immediately offered to the participant:
			if (typeof self._stopOptions.filename === "string")
			{
				self.download(self._stopOptions.filename);
			}
		};

		// called upon recording errors:
		this._recorder.onerror = (event) =>
		{
			// TODO
			self._psychoJS.logger.error("video recording error: " + JSON.stringify(event));
			self._status = PsychoJS.Status.ERROR;
		};

	}

}


