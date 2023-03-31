/**
 * Manager handling the recording of audio signal.
 *
 * @author Alain Pitiot and Sotiri Bakagiannis
 * @version 2022.2.3
 * @copyright (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { PsychoJS } from "../core/PsychoJS.js";
import { ExperimentHandler } from "../data/ExperimentHandler.js";
import { Clock } from "../util/Clock.js";
import { PsychObject } from "../util/PsychObject.js";
import * as util from "../util/Util.js";
import { AudioClip } from "./AudioClip.js";

/**
 * <p>This manager handles the recording of audio signal.</p>
 *
 * @extends PsychObject
 */
export class Microphone extends PsychObject
{
	/**
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {string} [options.format='audio/webm;codecs=opus'] the format for the audio file
	 * @param {number} [options.sampleRateHz= 48000] - the audio sampling rate, in Hz
	 * @param {Clock} [options.clock= undefined] - an optional clock
	 * @param {boolean} [options.autoLog= false] - whether to log
	 */
	constructor({ win, name, format, sampleRateHz, clock, autoLog } = {})
	{
		super(win._psychoJS);

		this._addAttribute("win", win, undefined);
		this._addAttribute("name", name, "microphone");
		this._addAttribute("format", format, "audio/webm;codecs=opus", this._onChange);
		this._addAttribute("sampleRateHz", sampleRateHz, 48000, this._onChange);
		this._addAttribute("clock", clock, new Clock());
		this._addAttribute("autoLog", autoLog, autoLog);
		this._addAttribute("status", PsychoJS.Status.NOT_STARTED);

		// prepare the recording:
		this._prepareRecording();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Submit a request to start the recording.
	 *
	 * <p>Note that it typically takes 50ms-200ms for the recording to actually starts once
	 * a request to start has been submitted.</p>
	 *
	 * @return {Promise} promise fulfilled when the recording actually started
	 */
	start()
	{
		// if the microphone is currently paused, a call to start resumes it
		// with a new recording:
		if (this._status === PsychoJS.Status.PAUSED)
		{
			return this.resume({ clear: true });
		}

		if (this._status !== PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug("request to start audio recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record audio";
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
				this._psychoJS.logger.error("unable to start the audio recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Microphone.start",
					context: "when starting the audio recording for microphone: " + this._name,
					error,
				};
			}
		}
	}

	/**
	 * Submit a request to stop the recording.
	 *
	 * @param {Object} options
	 * @param {string} [options.filename] the name of the file to which the audio recording will be
	 * 	saved
	 * @return {Promise} promise fulfilled when the recording actually stopped, and the recorded
	 * 	data was made available
	 */
	stop({ filename } = {})
	{
		if (this._status === PsychoJS.Status.STARTED || this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to stop audio recording");

			this._stopOptions = {
				filename,
			};

			// note: calling the stop method of the MediaRecorder will first raise a dataavailable event,
			// and then a stop event
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
	 * @return {Promise} promise fulfilled when the recording actually paused
	 */
	pause()
	{
		if (this._status === PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug("request to pause audio recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record audio";
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
				self._psychoJS.logger.error("unable to pause the audio recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Microphone.pause",
					context: "when pausing the audio recording for microphone: " + this._name,
					error,
				};
			}
		}
	}

	/**
	 * Submit a request to resume the recording.
	 *
	 * <p>resume has no effect if the recording was not previously paused.</p>
	 *
	 * @param {Object} options
	 * @param {boolean} [options.clear= false] whether or not to empty the audio buffer before
	 * 	resuming the recording
	 * @return {Promise} promise fulfilled when the recording actually resumed
	 */
	resume({ clear = false } = {})
	{
		if (this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to resume audio recording");

			try
			{
				if (!this._recorder)
				{
					throw "the recorder has not been created yet, possibly because the participant has not given the authorisation to record audio";
				}

				// empty the audio buffer is needed:
				if (clear)
				{
					this._audioBuffer = [];
					this._audioBuffer.length = 0;
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
				self._psychoJS.logger.error("unable to resume the audio recording: " + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: "Microphone.resume",
					context: "when resuming the audio recording for microphone: " + this._name,
					error,
				};
			}
		}
	}

	/**
	 * Submit a request to flush the recording.
	 *
	 * @return {Promise} promise fulfilled when the data has actually been made available
	 */
	flush()
	{
		if (this._status === PsychoJS.Status.STARTED || this._status === PsychoJS.Status.PAUSED)
		{
			this._psychoJS.logger.debug("request to flush audio recording");

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
	 * Offer the audio recording to the participant as a sound file to download.
	 *
	 * @param {string} filename the filename
	 */
	download(filename = "audio.webm")
	{
		const audioBlob = new Blob(this._audioBuffer);

		const anchor = document.createElement("a");
		anchor.href = window.URL.createObjectURL(audioBlob);
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}

	/**
	 * Upload the audio recording to the pavlovia server.
	 *
	 * @param {string} tag an optional tag for the audio file
	 */
	async upload({ tag } = {})
	{
		// default tag: the name of this Microphone object
		if (typeof tag === "undefined")
		{
			tag = this._name;
		}

		// add a format-dependent audio extension to the tag:
		tag += util.extensionFromMimeType(this._format);

		// if the audio recording cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the audio recording as a file for download:
		if (
			this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER
			|| this._psychoJS.config.experiment.status !== "RUNNING"
			|| this._psychoJS._serverMsg.has("__pilotToken")
		)
		{
			return this.download(tag);
		}

		// upload the blob:
		const audioBlob = new Blob(this._audioBuffer);
		return this._psychoJS.serverManager.uploadAudioVideo({
			mediaBlob: audioBlob,
			tag
		});
	}

	/**
	 * Get the current audio recording as an AudioClip in the given format.
	 *
 	 * @param {string} tag an optional tag for the audio clip
	 * @param {boolean} [flush=false] whether or not to first flush the recording
	 */
	async getRecording({ tag, flush = false } = {})
	{
		// default tag: the name of this Microphone object
		if (typeof tag === "undefined")
		{
			tag = this._name;
		}

		const audioClip = new AudioClip({
			psychoJS: this._psychoJS,
			name: tag,
			format: this._format,
			sampleRateHz: this._sampleRateHz,
			data: new Blob(this._audioBuffer),
		});

		return audioClip;
	}

	/**
	 * Callback for changes to the recording settings.
	 *
	 * <p>Changes to the settings require the recording to stop and be re-started.</p>
	 *
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
	 * @protected
	 */
	async _prepareRecording()
	{
		// empty the audio buffer:
		this._audioBuffer = [];
		this._recorder = null;

		// create a new audio recorder:
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				advanced: [
					{
						channelCount: 1,
						sampleRate: this._sampleRateHz,
					},
				],
			},
		});

		// check that the specified format is supported, use default if it is not:
		let options;
		if (typeof this._format === "string" && MediaRecorder.isTypeSupported(this._format))
		{
			options = { type: this._format };
		}
		else
		{
			this._psychoJS.logger.warn(`The specified audio format, ${this._format}, is not supported by this browser, using the default format instead`);
		}

		this._recorder = new MediaRecorder(stream, options);

		// setup the callbacks:
		const self = this;

		// called upon Microphone.start(), at which point the audio data starts being gathered
		// into a blob:
		this._recorder.onstart = () =>
		{
			self._audioBuffer = [];
			self._audioBuffer.length = 0;
			self._clock.reset();
			self._status = PsychoJS.Status.STARTED;
			self._psychoJS.logger.debug("audio recording started");

			// resolve the Microphone.start promise:
			if (self._startCallback)
			{
				self._startCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Microphone.pause():
		this._recorder.onpause = () =>
		{
			self._status = PsychoJS.Status.PAUSED;
			self._psychoJS.logger.debug("audio recording paused");

			// resolve the Microphone.pause promise:
			if (self._pauseCallback)
			{
				self._pauseCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Microphone.resume():
		this._recorder.onresume = () =>
		{
			self._status = PsychoJS.Status.STARTED;
			self._psychoJS.logger.debug("audio recording resumed");

			// resolve the Microphone.resume promise:
			if (self._resumeCallback)
			{
				self._resumeCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called when audio data is available, typically upon Microphone.stop() or Microphone.flush():
		this._recorder.ondataavailable = (event) =>
		{
			const data = event.data;

			// add data to the buffer:
			self._audioBuffer.push(data);
			self._psychoJS.logger.debug("audio data added to the buffer");

			// resolve the data available promise, if needed:
			if (self._dataAvailableCallback)
			{
				self._dataAvailableCallback(self._psychoJS.monotonicClock.getTime());
			}
		};

		// called upon Microphone.stop(), after data has been made available:
		this._recorder.onstop = () =>
		{
			self._psychoJS.logger.debug("audio recording stopped");
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
			self._psychoJS.logger.error("audio recording error: " + JSON.stringify(event));
			self._status = PsychoJS.Status.ERROR;
		};
	}
}
