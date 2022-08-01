/** **/
/**
 * Manager handling the recording of video signal.
 *
 * @author Alain Pitiot
 * @version 2022.2.0
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
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
 * @name module:hardware.Camera
 * @class
 * @param {Object} options
 * @param {module:core.Window} options.win - the associated Window
 * @param {string} [options.format='video/webm;codecs=vp9'] the video format
 * @param {Clock} [options.clock= undefined] - an optional clock
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo add video constraints as parameter
 */
export class Camera extends PsychObject
{
	constructor({win, name, format, clock, autoLog} = {})
	{
		super(win._psychoJS);

		this._addAttribute("win", win, undefined);
		this._addAttribute("name", name, "camera");
		this._addAttribute("format", format, "video/webm;codecs=vp9", this._onChange);
		this._addAttribute("clock", clock, new Clock());
		this._addAttribute("autoLog", autoLog, false);
		this._addAttribute("status", PsychoJS.Status.NOT_STARTED);

		this._stream = null;
		this._recorder = null;

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Prompt the user for permission to use the camera on their device.
	 *
	 * @name module:hardware.Camera#authorize
	 * @function
	 * @public
	 * @param {boolean} [showDialog=false] - whether to open a dialog box to inform the
	 * 	participant to wait for the camera to be initialised
	 * @param {string} [dialogMsg] - the dialog message
	 * @returns {boolean} whether or not the camera is ready to record
	 */
	async authorize(showDialog = false, dialogMsg = undefined)
	{
		const response = {
			origin: "Camera.authorize",
			context: "when authorizing access to the device's camera"
		};

		// open pop-up dialog, if required:
		if (showDialog)
		{
			dialogMsg ??= "Please wait a few moments while the camera initialises. You may need to grant permission to your browser to use the camera.";
			this.psychoJS.gui.dialog({
				warning: dialogMsg,
				showOK: false,
			});
		}

		try
		{
			// prompt for permission and get a MediaStream:
			// TODO use size constraints [https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia]
			this._stream = await navigator.mediaDevices.getUserMedia({
				video: true
			});
		}
		catch (error)
		{
			// close the dialog, if need be:
			if (showDialog)
			{
				this.psychoJS.gui.closeDialog();
			}

			this._status = PsychoJS.Status.ERROR;
			throw {...response, error};
		}

		// close the dialog, if need be:
		if (showDialog)
		{
			this.psychoJS.gui.closeDialog();
		}
	}

	/**
	 * Query whether the camera is ready to record.
	 *
	 * @name module:hardware.Camera#isReady
	 * @function
	 * @public
	 * @returns {boolean} true if the camera is ready to record, false otherwise
	 */
	get isReady()
	{
		return (this._recorder !== null);
	}

	/**
	 * Get the underlying video stream.
	 *
	 * @name module:hardware.Camera#getStream
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
	 * @name module:hardware.Camera#getVideo
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
	 * Open the video stream.
	 *
	 * @name module:hardware.Camera#open
	 * @function
	 * @public
	 */
	open()
	{
		if (this._stream === null)
		{
			throw {
				origin: "Camera.open",
				context: "when opening the camera's video stream",
				error: "access to the camera has not been authorized, or no camera could be found"
			};
		}

		// prepare the recording:
		this._prepareRecording();
	}

	/**
	 * Submit a request to start the recording.
	 *
	 * @name module:hardware.Camera#record
	 * @function
	 * @public
	 * @return {Promise} promise fulfilled when the recording actually starts
	 */
	record()
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
					origin: "Camera.record",
					context: "when starting the video recording for camera: " + this._name,
					error
				};
			}

		}

	}

	/**
	 * Submit a request to stop the recording.
	 *
	 * @name module:hardware.Camera#stop
	 * @function
	 * @public
	 * @param {Object} options
	 * @return {Promise} promise fulfilled when the recording actually stopped, and the recorded
	 * 	data was made available
	 */
	stop()
	{
		if (this._status === PsychoJS.Status.STARTED || this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to stop video recording");

			// stop the videos:
			for (const video of this._videos)
			{
				video.pause();
			}

			// note: calling the MediaRecorder.stop will first raise a dataavailable event, and then a stop event
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
	 * @name module:hardware.Camera#pause
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
	 * @name module:hardware.Camera#resume
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
	 * @name module:hardware.Camera#flush
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
	 * Get the current video recording as a VideoClip in the given format.
	 *
	 * @name module:hardware.Camera#getRecording
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
	 * Upload the video recording to the pavlovia server.
	 *
	 * @name module:hardware.Camera#_upload
	 * @function
	 * @protected
	 * @param {string} tag an optional tag for the video file
	 * @param {boolean} [waitForCompletion= false] whether to wait for completion
	 * 	before returning
	 * @param {boolean} [showDialog=false] - whether to open a dialog box to inform the participant to wait for the data to be uploaded to the server
	 * @param {string} [dialogMsg=""] - default message informing the participant to wait for the data to be uploaded to the server
	 */
	save({tag, waitForCompletion = false, showDialog = false, dialogMsg = ""} = {})
	{
		this._psychoJS.logger.info("[PsychoJS] Save video recording.");

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
			const videoBlob = new Blob(this._videoBuffer);

			const anchor = document.createElement("a");
			anchor.href = window.URL.createObjectURL(videoBlob);
			anchor.download = tag;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);

			return;
		}

		// upload the blob:
		const videoBlob = new Blob(this._videoBuffer);
		return this._psychoJS.serverManager.uploadAudioVideo({
			mediaBlob: videoBlob,
			tag,
			waitForCompletion,
			showDialog,
			dialogMsg});
	}

	/**
	 * Close the camera stream.
	 *
	 * @name module:hardware.Camera#close
	 * @function
	 * @public
	 * @returns {Promise<void>} promise fulfilled when the stream has stopped and is now closed
	 */
	async close()
	{
		await this.stop();

		this._videos = [];
		this._stream = null;
		this._recorder = null;
	}

	/**
	 * Callback for changes to the recording settings.
	 *
	 * <p>Changes to the settings require the recording to stop and be re-started.</p>
	 *
	 * @name module:hardware.Camera#_onChange
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
	 * @name module:hardware.Camera#_prepareRecording
	 * @function
	 * @protected
	 */
	_prepareRecording()
	{
		// empty the video buffer:
		this._videoBuffer = [];
		this._recorder = null;
		this._videos = [];

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

			// resolve the Camera.start promise:
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

			// resolve the Camera.pause promise:
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

			// resolve the Camera.resume promise:
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
			self._status = PsychoJS.Status.STOPPED;

			// resolve the Camera.stop promise:
			if (self._stopCallback)
			{
				self._stopCallback(self._psychoJS.monotonicClock.getTime());
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


