/**
 * Tone Player.
 *
 * @author Alain Pitiot
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2024 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as Tone from "tone";
import { isNumeric } from "../util/Util.js";
import { SoundPlayer } from "./SoundPlayer.js";

/**
 * <p>This class handles the playing of tones.</p>
 *
 * @extends SoundPlayer
 */
export class TonePlayer extends SoundPlayer
{
	/**
	 * <p>This class handles the playing of tones.</p>
	 *
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {number} [options.secs= 0.5] - duration of the tone (in seconds). If secs == -1, the sound will play indefinitely.
	 * @param {string|number} [options.note= 'C4'] - note (if string) or frequency (if number)
	 * @param {number} [options.volume= 1.0] - volume of the tone (must be between 0 and 1.0)
	 * @param {number} [options.loops= 0] - how many times to repeat the tone after it has played once. If loops == -1, the tone will repeat indefinitely until stopped.
	 */
	constructor({
		psychoJS,
		note = "C4",
		secs = 0.5,
		volume = 1.0,
		loops = 0,
		soundLibrary = TonePlayer.SoundLibrary.TONE_JS,
		autoLog = true,
	} = {})
	{
		super(psychoJS);

		this._addAttribute("note", note);
		this._addAttribute("duration_s", secs);
		this._addAttribute("volume", volume);
		this._addAttribute("loops", loops);
		this._addAttribute("soundLibrary", soundLibrary);
		this._addAttribute("autoLog", autoLog);

		// initialise the sound library:
		this._initSoundLibrary();

		// Tone.js Loop:
		this._toneLoop = null;

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Determine whether this player can play the given sound.
	 *
	 * <p>Note: if TonePlayer accepts the sound but Tone.js is not available, e.g. if the browser is IE11,
	 * we throw an exception.</p>
	 *
	 * @param {string|number} value - potential frequency or note
	 * @param {number} octave - the octave corresponding to the tone
	 * @return {Object|boolean} argument needed to instantiate a TonePlayer that can play the given sound
	 * 	or false otherwise
	 */
	static accept(value, octave)
	{
		// if the sound's value is an integer, we interpret it as a frequency:
		if (isNumeric(value))
		{
			return { note: value }
		}

		// if the sound's value is a string, we check whether it is a note:
		if (typeof value === "string")
		{
			// mapping between the PsychoPY notes and the standard ones:
			let psychopyToToneMap = new Map();
			for (const note of ["A", "B", "C", "D", "E", "F", "G"])
			{
				psychopyToToneMap.set(note, note);
				psychopyToToneMap.set(note + "fl", note + "b");
				psychopyToToneMap.set(note + "sh", note + "#");
			}

			// check whether the sound's value is a recognised note:
			const note = psychopyToToneMap.get(value);
			if (typeof note !== "undefined")
			{
				return { note: note + octave };
			}
		}

		// the value does not seem to correspond to a tone we can play:
		return false;
	}

	/**
	 * Get the duration of the sound.
	 *
	 * @return {number} the duration of the sound, in seconds
	 */
	getDuration()
	{
		return this.duration_s;
	}

	/**
	 * Set the duration of the tone.
	 *
	 * @param {number} secs - the duration of the tone (in seconds) If secs == -1, the sound will play indefinitely.
	 */
	setDuration(secs)
	{
		this.duration_s = secs;
	}

	/**
	 * Set the number of loops.
	 *
	 * @param {number} loops - how many times to repeat the track after it has played once. If loops == -1, the track will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		this._loops = loops;
	}

	/**
	 * Set the volume of the tone.
	 *
	 * @param {Integer} volume - the volume of the tone
	 * @param {boolean} [mute= false] - whether or not to mute the tone
	 */
	setVolume(volume, mute = false)
	{
		this._volume = volume;

		if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS)
		{
			if (typeof this._volumeNode !== "undefined")
			{
				this._volumeNode.mute = mute;
				this._volumeNode.volume.value = -60 + volume * 66;
				// this._synth.volume.value = -60 + volume * 66;
			}
			else
			{
				// TODO
			}
		}
		else
		{
			// TODO
		}
	}

	/**
	 * Set the note for tone.
	 *
 	 * @param {string|number} value - potential frequency or note
	 * @param {number} octave - the octave corresponding to the tone
	 */
	setTone(value = "C", octave = 4)
	{
		const args = TonePlayer.accept(value, octave);
		this._note = args.note;

		if (typeof this._synth !== "undefined")
		{
			this._synth.setNote(this._note);
		}
	}

	/**
	 * Start playing the sound.
	 *
	 * @param {boolean} [loops] - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	play(loops)
	{
		if (typeof loops !== "undefined")
		{
			this._loops = loops;
		}

		// if duration_s == -1, the sound should play indefinitely, therefore we use an arbitrarily long playing time
		const actualDuration_s = (this._duration_s === -1) ? 1000000 : this._duration_s;
		const self = this;
		let playToneCallback;
		if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS)
		{
			playToneCallback = () =>
			{
				self._synth.triggerAttackRelease(self._note, actualDuration_s, Tone.context.currentTime);
			};
		}
		else
		{
			playToneCallback = () =>
			{
				self._webAudioOscillator = self._audioContext.createOscillator();
				self._webAudioOscillator.type = "sine";
				self._webAudioOscillator.frequency.value = 440;
				self._webAudioOscillator.connect(self._audioContext.destination);
				const contextCurrentTime = self._audioContext.currentTime;
				self._webAudioOscillator.start(contextCurrentTime);
				self._webAudioOscillator.stop(contextCurrentTime + actualDuration_s);
			};
		}

		// play just once:
		if (this.loops === 0)
		{
			playToneCallback();
		}
		// repeat forever:
		else if (this.loops === -1)
		{
			this._toneId = Tone.Transport.scheduleRepeat(
				playToneCallback,
				this.duration_s,
				Tone.now(),
				Infinity,
			);
		}
		// repeat this._loops times:
		else
		{
			this._toneId = Tone.Transport.scheduleRepeat(
				playToneCallback,
				this.duration_s,
				Tone.now(),
				this.duration_s * (this._loops + 1),
			);
		}
	}

	/**
	 * Stop playing the sound immediately.
	 */
	stop()
	{
		if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS)
		{
			// trigger the release of the sound, immediately:
			this._synth.triggerRelease();

			// clear the repeat event if need be:
			if (this._toneId)
			{
				Tone.Transport.clear(this._toneId);
			}
		}
		else
		{
			const contextCurrentTime = this._audioContext.currentTime;
			this._webAudioOscillator.stop(contextCurrentTime);
		}
	}

	/**
	 * Initialise the sound library.
	 *
	 * <p>Note: if TonePlayer accepts the sound but Tone.js is not available, e.g. if the browser is IE11,
	 * we throw an exception.</p>
	 *
	 * @protected
	 */
	_initSoundLibrary()
	{
		const response = {
			origin: "TonePlayer._initSoundLibrary",
			context: "when initialising the sound library",
		};

		if (this._soundLibrary === TonePlayer.SoundLibrary.TONE_JS)
		{
			// check that Tone.js is available:
			if (typeof Tone === "undefined")
			{
				throw Object.assign(response, {
					error: "Tone.js is not available. A different sound library must be selected. Please contact the experiment designer.",
				});
			}

			// start the Tone Transport if it has not started already:
			if (typeof Tone !== "undefined" && Tone.Transport.state !== "started")
			{
				this.psychoJS.logger.info("[PsychoJS] start Tone Transport");
				Tone.Transport.start(Tone.now());

				// this is necessary to prevent Tone from introducing a delay when triggering a note
				// ( see https://github.com/Tonejs/Tone.js/issues/306#issuecomment-365989984 )
				Tone.context.lookAhead = 0;
			}

			// create a synth: we use a triangular oscillator with hardly any envelope:
			this._synthOtions = {
				oscillator: {
					type: "square", // 'triangle'
				},
				envelope: {
					attack: 0.001, // 1ms
					decay: 0.001, // 1ms
					sustain: 1,
					release: 0.001, // 1ms
				},
			};
			this._synth = new Tone.Synth(this._synthOtions);

			// connect it to a volume node:
			this._volumeNode = new Tone.Volume(-60 + this._volume * 66);
			this._synth.connect(this._volumeNode);

			// connect the volume node to the master output:
			if (typeof this._volumeNode.toDestination === "function")
			{
				this._volumeNode.toDestination();
			}
			else
			{
				this._volumeNode.toMaster();
			}
		}
		else
		{
			// create an AudioContext:
			if (typeof this._audioContext === "undefined")
			{
				const AudioContext = window.AudioContext || window.webkitAudioContext;

				// if AudioContext is not available (e.g. on IE), we throw an exception:
				if (typeof AudioContext === "undefined")
				{
					throw Object.assign(response, {
						error: `AudioContext is not available on your browser, ${this._psychoJS.browser}, please contact the experiment designer.`,
					});
				}

				this._audioContext = new AudioContext();
			}
		}
	}
}

/**
 *
 * @type {{TONE_JS: *, AUDIO_CONTEXT: *}}
 */
TonePlayer.SoundLibrary = {
	AUDIO_CONTEXT: Symbol.for("AUDIO_CONTEXT"),
	TONE_JS: Symbol.for("TONE_JS"),
};
