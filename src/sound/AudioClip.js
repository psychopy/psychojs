/**
 * AudioClip encapsulates an audio recording.
 *
 * @author Alain Pitiot and Sotiri Bakagiannis
 * @version 2022.2.3
 * @copyright (c) 2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { PsychoJS } from "../core/PsychoJS.js";
import { ExperimentHandler } from "../data/ExperimentHandler.js";
import { PsychObject } from "../util/PsychObject.js";
import * as util from "../util/Util.js";

/**
 * <p>AudioClip encapsulates an audio recording.</p>
 *
 * @extends PsychObject
 */
export class AudioClip extends PsychObject
{
	/**
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {String} [options.name= 'audioclip'] - the name used when logging messages
	 * @param {string} options.format the format for the audio file
	 * @param {number} options.sampleRateHz - the sampling rate
	 * @param {Blob} options.data - the audio data, in the given format, at the given sampling rate
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({ psychoJS, name, sampleRateHz, format, data, autoLog } = {})
	{
		super(psychoJS);

		this._addAttribute("name", name, "audioclip");
		this._addAttribute("format", format);
		this._addAttribute("sampleRateHz", sampleRateHz);
		this._addAttribute("data", data);
		this._addAttribute("autoLog", false, autoLog);
		this._addAttribute("status", AudioClip.Status.CREATED);

		// add a volume attribute, for playback:
		this._addAttribute("volume", 1.0);

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}

		// decode the blob into an audio buffer:
		this._decodeAudio();
	}

	/**
	 * Set the volume of the playback.
	 *
	 * @param {number} volume - the volume of the playback (must be between 0.0 and 1.0)
	 */
	setVolume(volume)
	{
		this._volume = volume;
	}

	/**
	 * Start playing the audio clip.
	 *
	 * @public
	 */
	async startPlayback()
	{
		this._psychoJS.logger.debug("request to play the audio clip");

		// wait for the decoding to complete:
		await this._decodeAudio();

		// note: we need to prepare the audio graph anew each time since, for instance, an
		// AudioBufferSourceNode can only be played once
		// ref: https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode

		// create a source node from the in-memory audio data in _audioBuffer:
		this._source = this._audioContext.createBufferSource();
		this._source.buffer = this._audioBuffer;

		// create a gain node, so we can control the volume:
		this._gainNode = this._audioContext.createGain();

		// connect the nodes:
		this._source.connect(this._gainNode);
		this._gainNode.connect(this._audioContext.destination);

		// set the volume:
		this._gainNode.gain.value = this._volume;

		// start the playback:
		this._source.start();
	}

	/**
	 * Stop playing the audio clip.
	 *
	 * @param {number} [fadeDuration = 17] - how long the fading out should last, in ms
	 */
	async stopPlayback(fadeDuration = 17)
	{
		// TODO deal with fade duration

		// stop the playback:
		this._source.stop();
	}

	/**
	 * Get the duration of the audio clip, in seconds.
	 *
	 * @returns {Promise<number>} the duration of the audio clip
	 */
	async getDuration()
	{
		// wait for the decoding to complete:
		await this._decodeAudio();

		return this._audioBuffer.duration;
	}

	/**
	 * Upload the audio clip to the pavlovia server.
	 *
	 * @public
	 */
	upload()
	{
		this._psychoJS.logger.debug("request to upload the audio clip to pavlovia.org");

		// add a format-dependent audio extension to the name:
		const filename = this._name + util.extensionFromMimeType(this._format);

		// if the audio recording cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the audio clip as a file for download:
		if (
			this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER
			|| this._psychoJS.config.experiment.status !== "RUNNING"
			|| this._psychoJS._serverMsg.has("__pilotToken")
		)
		{
			return this.download(filename);
		}

		// upload the data:
		return this._psychoJS.serverManager.uploadAudioVideo({
			mediaBlob: this._data,
			tag: filename
		});
	}

	/**
	 * Offer the audio clip to the participant as a sound file to download.
	 */
	download(filename = "audio.webm")
	{
		const anchor = document.createElement("a");
		anchor.href = window.URL.createObjectURL(this._data);
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}

	/**
	 * Transcribe the audio clip.
	 *
	 * @param {Object} options
	 * @param {Symbol} options.engine - the speech-to-text engine
	 * @param {String} options.languageCode - the BCP-47 language code for the recognition,
	 * 	e.g. 'en-GB'
	 * @return {Promise} a promise resolving to the transcript and associated
	 * 	transcription confidence
	 */
	async transcribe({ engine, languageCode } = {})
	{
		const response = {
			origin: "AudioClip.transcribe",
			context: `when transcribing audio clip: ${this._name}`,
		};

		this._psychoJS.logger.debug(response);

		// get the secret key from the experiment configuration:
		const fullEngineName = `sound.AudioClip.Engine.${Symbol.keyFor(engine)}`;
		let transcriptionKey;
		for (const key of this._psychoJS.config.experiment.keys)
		{
			if (key.name === fullEngineName)
			{
				transcriptionKey = key.value;
			}
		}
		if (typeof transcriptionKey === "undefined")
		{
			throw {
				...response,
				error: `missing key for engine: ${fullEngineName}`,
			};
		}

		// wait for the decoding to complete:
		await this._decodeAudio();

		// dispatch on engine:
		if (engine === AudioClip.Engine.GOOGLE)
		{
			return this._GoogleTranscribe(transcriptionKey, languageCode);
		}
		else
		{
			throw {
				...response,
				error: `unsupported speech-to-text engine: ${engine}`,
			};
		}
	}

	/**
	 * Transcribe the audio clip using the Google Cloud Speech-To-Text Engine.
	 *
	 * ref: https://cloud.google.com/speech-to-text/docs/reference/rest/v1/speech/recognize
	 *
	 * @protected
	 * @param {String} transcriptionKey - the secret key to the Google service
	 * @param {String} languageCode - the BCP-47 language code for the recognition, e.g. 'en-GB'
	 * @return {Promise} a promise resolving to the transcript and associated
	 * 	transcription confidence
	 */
	_GoogleTranscribe(transcriptionKey, languageCode)
	{
		return new Promise(async (resolve, reject) =>
		{
			// convert the Float32 PCM audio data to UInt16:
			const buffer = new ArrayBuffer(this._audioData.length * 2);
			const uint16View = new Uint16Array(buffer);
			for (let t = 0; t < this._audioData.length; ++t)
			{
				uint16View[t] = (this._audioData[t] < 0)
					? this._audioData[t] * 0x8000
					: this._audioData[t] * 0x7FFF;
			}

			// encode it to base64:
			const base64Data = this._base64ArrayBuffer(new Uint8Array(buffer));

			// query the Google speech-to-text service:
			const body = {
				config: {
					encoding: "LINEAR16",
					sampleRateHertz: this._sampleRateHz,
					languageCode,
				},
				audio: {
					content: base64Data,
				},
			};

			const url = `https://speech.googleapis.com/v1/speech:recognize?key=${transcriptionKey}`;

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			// convert the response to json:
			const decodedResponse = await response.json();
			this._psychoJS.logger.debug("speech.googleapis.com response:", JSON.stringify(decodedResponse));

			// TODO deal with more than one results and/or alternatives
			if (("results" in decodedResponse) && (decodedResponse.results.length > 0))
			{
				resolve(decodedResponse.results[0].alternatives[0]);
			}
			else
			{
				// no transcription available:
				resolve({
					transcript: "",
					confidence: -1,
				});
			}
		});
	}

	/**
	 * Decode the formatted audio data (e.g. webm) into a 32bit float PCM audio buffer.
	 *
	 * @protected
	 */
	_decodeAudio()
	{
		this._psychoJS.logger.debug("request to decode the data of the audio clip");

		// if the audio clip is ready, the PCM audio data is available in _audioData, a Float32Array:
		if (this._status === AudioClip.Status.READY)
		{
			return;
		}

		// if we are already decoding, wait until the process completed:
		if (this._status === AudioClip.Status.DECODING)
		{
			const self = this;
			return new Promise(function(resolve, reject)
			{
				self._decodingCallbacks.push(resolve);

				// self._errorCallback = reject; // TODO
			}.bind(this));
		}

		// otherwise, start decoding the input formatted audio data:
		this._status = AudioClip.Status.DECODING;
		this._audioData = null;
		this._source = null;
		this._gainNode = null;
		this._decodingCallbacks = [];

		this._audioContext = new (window.AudioContext || window.webkitAudioContext)({
			sampleRate: this._sampleRateHz,
		});

		const reader = new window.FileReader();
		reader.onloadend = async () =>
		{
			try
			{
				// decode the ArrayBuffer containing the formatted audio data (e.g. webm)
				// into an audio buffer:
				this._audioBuffer = await this._audioContext.decodeAudioData(reader.result);

				// get the Float32Array containing the PCM data:
				this._audioData = this._audioBuffer.getChannelData(0);

				// we are now ready to translate and play:
				this._status = AudioClip.Status.READY;

				// resolve all the promises waiting for the decoding to complete:
				for (const callback of this._decodingCallbacks)
				{
					callback();
				}
			}
			catch (error)
			{
				console.error(error);

				// TODO
			}
		};

		reader.onerror = (error) =>
		{
			// TODO
		};

		reader.readAsArrayBuffer(this._data);
	}

	/**
	 * Convert an array buffer to a base64 string.
	 *
	 * @note this is heavily inspired by the following post by @Grantlyk:
	 * https://gist.github.com/jonleighton/958841#gistcomment-1953137
	 * It is necessary since the following approach only works for small buffers:
	 * const dataAsString = String.fromCharCode.apply(null, new Uint8Array(buffer));
	 * base64Data = window.btoa(dataAsString);
	 *
	 * @protected
	 * @param arrayBuffer - the input buffer
	 * @return {string} the base64 encoded input buffer
	 */
	_base64ArrayBuffer(arrayBuffer)
	{
		let base64 = "";
		const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

		const bytes = new Uint8Array(arrayBuffer);
		const byteLength = bytes.byteLength;
		const byteRemainder = byteLength % 3;
		const mainLength = byteLength - byteRemainder;

		let a;
		let b;
		let c;
		let d;
		let chunk;

		// Main loop deals with bytes in chunks of 3
		for (let i = 0; i < mainLength; i += 3)
		{
			// Combine the three bytes into a single integer
			chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

			// Use bitmasks to extract 6-bit segments from the triplet
			a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
			b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
			c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
			d = chunk & 63; // 63       = 2^6 - 1

			// Convert the raw binary segments to the appropriate ASCII encoding
			base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
		}

		// Deal with the remaining bytes and padding
		if (byteRemainder === 1)
		{
			chunk = bytes[mainLength];

			a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

			// Set the 4 least significant bits to zero
			b = (chunk & 3) << 4; // 3   = 2^2 - 1

			base64 += `${encodings[a]}${encodings[b]}==`;
		}
		else if (byteRemainder === 2)
		{
			chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

			a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
			b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

			// Set the 2 least significant bits to zero
			c = (chunk & 15) << 2; // 15    = 2^4 - 1

			base64 += `${encodings[a]}${encodings[b]}${encodings[c]}=`;
		}

		return base64;
	}
}

/**
 * Recognition engines.
 *
 * @enum {Symbol}
 * @readonly
 */
AudioClip.Engine = {
	/**
	 * Google Cloud Speech-to-Text.
	 */
	GOOGLE: Symbol.for("GOOGLE"),
};

/**
 * AudioClip status.
 *
 * @enum {Symbol}
 * @readonly
 */
AudioClip.Status = {
	CREATED: Symbol.for("CREATED"),

	DECODING: Symbol.for("DECODING"),

	READY: Symbol.for("READY"),
};
