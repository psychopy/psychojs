/**
 * Manager handling the live transcription of speech into text.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {Clock} from "../util/Clock";
import {PsychObject} from "../util/PsychObject";
import {PsychoJS} from "../core/PsychoJS";


/**
 * Transcript.
 */
export class Transcript
{
	/**
	 * Object holding a transcription result.
	 *
	 * @param {SpeechRecognition} transcriber - the transcriber
	 * @param {string} text - the transcript
	 * @param {number} confidence - confidence in the transcript
	 */
	constructor(transcriber, text = '', confidence = 0.0)
	{
		// recognised text:
		this.text = text;

		// confidence in the recognition:
		this.confidence = confidence;

		// time the speech started, relative to the Transcriber clock:
		this.speechStart = transcriber._speechStart;

		// time the speech ended, relative to the Transcriber clock:
		this.speechEnd = transcriber._speechEnd;

		// time a recognition result was produced, relative to the Transcriber clock:
		this.time = transcriber._recognitionTime;
	}
}


/**
 * <p>This manager handles the live transcription of speech into text.</p>
 *
 * @extends PsychObject
 * @todo deal with alternatives, interim results, and recognition errors
 */
export class SpeechRecognition extends PsychObject
{
	/**
	 * <p>This manager handles the live transcription of speech into text.</p>
	 *
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {String} options.name - the name used when logging messages
	 * @param {number} [options.bufferSize= 10000] - the maximum size of the circular transcript buffer
	 * @param {String[]} [options.continuous= true] - whether to continuously recognise
	 * @param {String[]} [options.lang= 'en-US'] - the spoken language
	 * @param {String[]} [options.interimResults= false] - whether to make interim results available
	 * @param {String[]} [options.maxAlternatives= 1] - the maximum number of recognition alternatives
	 * @param {String[]} [options.tokens= [] ] - the tokens to be recognised. This is experimental technology, not available in all browser.
	 * @param {Clock} [options.clock= undefined] - an optional clock
	 * @param {boolean} [options.autoLog= false] - whether to log
	 *
	 * @todo deal with alternatives, interim results, and recognition errors
	 */
	constructor({psychoJS, name, bufferSize, continuous, lang, interimResults, maxAlternatives, tokens, clock, autoLog} = {})
	{
		super(psychoJS);

		this._addAttribute('name', name, 'speech recognition');
		this._addAttribute('bufferSize', bufferSize, 10000);
		this._addAttribute('continuous', continuous, true, this._onChange);
		this._addAttribute('lang', lang, 'en-US', this._onChange);
		this._addAttribute('interimResults', interimResults, false, this._onChange);
		this._addAttribute('maxAlternatives', maxAlternatives, 1, this._onChange);
		this._addAttribute('tokens', tokens, [], this._onChange);
		this._addAttribute('clock', clock, new Clock());
		this._addAttribute('autoLog', false, autoLog);
		this._addAttribute('status', PsychoJS.Status.NOT_STARTED);

		this._prepareRecognition();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Start the speech recognition process.
	 *
	 * @return {Promise} promise fulfilled when the process actually starts
	 */
	start()
	{
		if (this._status !== PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug('request to start the speech recognition process');

			try
			{
				if (!this._recognition)
				{
					throw 'the speech recognition has not been initialised yet, possibly because the participant has not given the authorisation to record audio';
				}

				this._recognition.start();

				// return a promise, which will be satisfied when the process actually starts,
				// which is also when the reset of the clock and the change of status takes place
				const self = this;
				return new Promise((resolve, reject) =>
				{
					self._startCallback = resolve;
					self._errorCallback = reject;
				});
			}
			catch (error)
			{
				// TODO Strangely, start sometimes fails with the message that the recognition has already started. It is most probably a bug in the implementation of the Web Speech API. We need to catch this particular error and no throw on this occasion

				this._psychoJS.logger.error('unable to start the speech to text transcription: ' + JSON.stringify(error));
				this._status = PsychoJS.Status.ERROR;

				throw {
					origin: 'Transcriber.start',
					context: 'when starting the speech to text transcription with transcriber: ' + this._name,
					error
				};
			}

		}

	}


	/**
	 * Stop the speech recognition process.
	 *
	 * @return {Promise} promise fulfilled when the process actually stops
	 */
	stop()
	{
		if (this._status === PsychoJS.Status.STARTED)
		{
			this._psychoJS.logger.debug('request to stop the speech recognition process');

			this._recognition.stop();

			// return a promise, which will be satisfied when the process actually stops:
			const self = this;
			return new Promise((resolve, reject) =>
			{
				self._stopCallback = resolve;
				self._errorCallback = reject;
			});
		}
	}


	/**
	 * Get the list of transcripts still in the buffer, i.e. those that have not been
	 * previously cleared by calls to getTranscripts with clear = true.
	 *
	 * @param {Object} options
	 * @param {string[]} [options.transcriptList= []]] - the list of transcripts texts to consider. If transcriptList is empty, we consider all transcripts.
	 * @param {boolean} [options.clear= false] - whether or not to keep in the buffer the transcripts for a subsequent call to getTranscripts. If a keyList has been given and clear = true, we only remove from the buffer those keys in keyList
	 * @return {Transcript[]} the list of transcripts still in the buffer
	 */
	getTranscripts({
									 transcriptList = [],
									 clear = true
								 } = {})
	{
		// if nothing in the buffer, return immediately:
		if (this._bufferLength === 0)
		{
			return [];
		}

		// iterate over the buffer, from start to end, and discard the null transcripts (i.e. those
		// previously cleared):
		const filteredTranscripts = [];
		const bufferWrap = (this._bufferLength === this._bufferSize);
		let i = bufferWrap ? this._bufferIndex : -1;
		do
		{
			i = (i + 1) % this._bufferSize;

			const transcript = this._circularBuffer[i];
			if (transcript)
			{
				// if the transcriptList is empty of the transcript text is in the transcriptList:
				if (transcriptList.length === 0 || transcriptList.includes(transcript.text))
				{
					filteredTranscripts.push(transcript);

					if (clear)
					{
						this._circularBuffer[i] = null;
					}
				}
			}
		} while (i !== this._bufferIndex);

		return filteredTranscripts;
	}


	/**
	 * Clear all transcripts and resets the circular buffers.
	 */
	clearTranscripts()
	{
		// circular buffer of transcripts:
		this._circularBuffer = new Array(this._bufferSize);
		this._bufferLength = 0;
		this._bufferIndex = -1;
	}


	/**
	 * Callback for changes to the recognition settings.
	 *
	 * <p>Changes to the recognition settings require the speech recognition process
	 * to be stopped and be re-started.</p>
	 *
	 * @protected
	 */
	_onChange()
	{
		if (this._status === PsychoJS.Status.STARTED)
		{
			this.stop();
		}

		this._prepareRecognition();

		this.start();
	}


	/**
	 * Prepare the speech recognition process.
	 *
	 * @protected
	 */
	_prepareRecognition()
	{
		// setup the circular buffer of transcripts:
		this.clearTranscripts();

		// recognition settings:
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		this._recognition = new SpeechRecognition();
		this._recognition.continuous = this._continuous;
		this._recognition.lang = this._lang;
		this._recognition.interimResults = this._interimResults;
		this._recognition.maxAlternatives = this._maxAlternatives;

		// grammar list with tokens added:
		if (Array.isArray(this._tokens) && this._tokens.length > 0)
		{
			const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

			// note: we accepts JSGF encoded strings, and relative weight indicator between 0.0 and 1.0
			// ref: https://www.w3.org/TR/jsgf/
			const name = "NULL";
			const grammar = `#JSGF V1.0; grammar ${name}; public <${name}> = ${this._tokens.join('|')};`
			const grammarList = new SpeechGrammarList();
			grammarList.addFromString(grammar, 1);
			this._recognition.grammars = grammarList;
		}

		// setup the callbacks:
		const self = this;

		// called when the start of a speech is detected:
		this._recognition.onspeechstart = (e) =>
		{
			this._currentSpeechStart = this._clock.getTime();
			self._psychoJS.logger.debug('speech started');
		}

		// called when the end of a speech is detected:
		this._recognition.onspeechend = () =>
		{
			this._currentSpeechEnd = this._clock.getTime();
			// this._recognition.stop();
			self._psychoJS.logger.debug('speech ended');
		}

		// called when the recognition actually started:
		this._recognition.onstart = () =>
		{
			this._clock.reset();
			this._status = PsychoJS.Status.STARTED;
			self._psychoJS.logger.debug('speech recognition started');

			// resolve the SpeechRecognition.start promise, if need be:
			if (self._startCallback())
			{
				self._startCallback({
					time: self._psychoJS.monotonicClock.getTime()
				});
			}
		}

		// called whenever stop() or abort() are called:
		this._recognition.onend = () =>
		{
			this._status = PsychoJS.Status.STOPPED;
			self._psychoJS.logger.debug('speech recognition ended');

			// resolve the SpeechRecognition.stop promise, if need be:
			if (self._stopCallback)
			{
				self._stopCallback({
					time: self._psychoJS.monotonicClock.getTime()
				});
			}
		}

		// called whenever a new result is available:
		this._recognition.onresult = (event) =>
		{
			this._recognitionTime = this._clock.getTime();

			// do not process the results if the Recogniser is not STARTED:
			if (self._status !== PsychoJS.Status.STARTED)
			{
				return;
			}

			// in continuous recognition mode, we need to get the result at resultIndex,
			// otherwise we pick the first result
			const resultIndex = (self._continuous) ? event.resultIndex : 0;

			// TODO at the moment we consider only the first alternative:
			const alternativeIndex = 0;

			const results = event.results;
			const text = results[resultIndex][alternativeIndex].transcript;
			const confidence = results[resultIndex][alternativeIndex].confidence;

			// create a new transcript:
			const transcript = new Transcript(self, text, confidence);

			// insert it in the circular transcript buffer:
			self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
			self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
			self._circularBuffer[self._bufferIndex] = transcript;

			self._psychoJS.logger.debug('speech recognition transcript: ', JSON.stringify(transcript));
		}

		// called upon recognition errors:
		this._recognition.onerror = (event) =>
		{
			// lack of speech is not an error:
			if (event.error === 'no-speech')
			{
				return;
			}

			self._psychoJS.logger.error('speech recognition error: ', JSON.stringify(event));
			self._status = PsychoJS.Status.ERROR;
		}
	}

}


