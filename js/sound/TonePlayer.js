/**
 * Tone Player.
 *
 * @author Alain Pitiot
 * @version 3.1.4
 * @copyright (c) 2019 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */

import { SoundPlayer } from './SoundPlayer';


/**
 * <p>This class handles the playing of tones.</p>
 * 
 * @name module:sound.TonePlayer
 * @class
 * @extends SoundPlayer
 * @param {Object} options
 * @param {PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {number} [options.duration_s= 0.5] - duration of the tone (in seconds)
 * @param {string|number} [options.note= 'C4'] - note (if string) or frequency (if number)
 * @param {number} [options.volume= 1.0] - volume of the tone (must be between 0 and 1.0)
 * @param {number} [options.loops= 0] - how many times to repeat the tone after it has played once. If loops == -1, the tone will repeat indefinitely until stopped.
 */
export class TonePlayer extends SoundPlayer {
	constructor({
		psychoJS,
		note = 'C4',
		duration_s = 0.5,
		volume = 1.0,
		loops = 0
	} = {}) {
		super(psychoJS);

		this._addAttributes(TonePlayer, note, duration_s, volume, loops);


		// create a synth: we use a triangular oscillator with hardly any envelope:
		this._synthOtions = {
			oscillator: {
				type: 'triangle'
			},
			envelope: {
				attack: 0.001,
				decay: 0.001,
				sustain: 1,
				release: 0.001
			}
		};
		this._synth = new Tone.Synth(this._synthOtions);

		// connect it to a volume node:
		this._volumeNode = new Tone.Volume(-60 + volume * 66);
		this._synth.connect(this._volumeNode);

		// connect the volume node to the master output:
		this._volumeNode.toMaster();

		// tonejs Loop:
		this._toneLoop = null;
	}


	/**
	 * Determine whether this player can play the given sound.
	 *
	 * @name module:sound.TonePlayer.accept
	 * @function
	 * @static
	 * @public
	 * @param {module:sound.Sound} - the sound
	 * @return {Object|undefined} an instance of TonePlayer that can play the given sound or undefined otherwise
	 */
	static accept(sound) {
		// if the sound's value is an integer, we interpret it as a frequency:
		if ($.isNumeric(sound.value)) {
			// build the player:
			const player = new TonePlayer({
				psychoJS: sound.psychoJS,
				note: sound.value,
				duration_s: sound.secs,
				volume: sound.volume,
				loops: sound.loops
			});
			return player;
		}

		// if the sound's value is a string, we check whether it is a note:
		if (typeof sound.value === 'string') {
			// mapping between the PsychoPY notes and the standard ones:
			let psychopyToToneMap = new Map();
			for (const note of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
				psychopyToToneMap.set(note, note);
				psychopyToToneMap.set(note + 'fl', note + 'b');
				psychopyToToneMap.set(note + 'sh', note + '#');
			}

			// check whether the sound's value is a recognised note:
			const note = psychopyToToneMap.get(sound.value);
			if (typeof note !== 'undefined') {
				// build the player:
				const player = new TonePlayer({
					psychoJS: sound.psychoJS,
					note: note + sound.octave,
					duration_s: sound.secs,
					volume: sound.volume,
					loops: sound.loops
				});
				return player;
			}
		}

		// TonePlayer is not an appropriate player for the given sound:
		return undefined;
	}


	/**
	 * Get the duration of the sound.
	 *
	 * @name module:sound.TonePlayer#getDuration
	 * @function
	 * @public
	 * @return {number} the duration of the sound, in seconds
	 */
	getDuration()
	{
		return this.duration_s;
	}


	/**
	 * Set the number of loops.
	 *
	 * @name module:sound.TonePlayer#setLoops
	 * @function
	 * @public
	 * @param {number} loops - how many times to repeat the track after it has played once. If loops == -1, the track will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		this._loops = loops;
	}


	/**
	 * Set the volume of the tone.
	 * 
	 * @name module:sound.TonePlayer#setVolume
	 * @function
	 * @public
	 * @param {Integer} volume - the volume of the tone
	 * @param {boolean} [mute= false] - whether or not to mute the tone
	 */
	setVolume(volume, mute = false) {
		this._volume = volume;

		if (typeof this._volumeNode !== 'undefined') {
			this._volumeNode.mute = mute;
			this._synth.volume.value = -60 + volume * 66;
		}
	}


	/**
	 * Start playing the sound.
	 *
	 * @name module:sound.TonePlayer#play
	 * @function
	 * @public
	 * @param {boolean} [loops] - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	play(loops) {
		if (typeof loops !== 'undefined')
			this._loops = loops;

		const self = this;
		const callback = time => { self._synth.triggerAttackRelease(self._note, self.duration_s, Tone.now()); };

		if (this.loops === 0)
			this._toneId = Tone.Transport.scheduleOnce(callback, Tone.now());
		else if (this.loops === -1)
			this._toneId = Tone.Transport.scheduleRepeat(
				callback,
				this.duration_s,
				Tone.now(),
				Tone.Infinity
			);
		else
			this._toneId = Tone.Transport.scheduleRepeat(
				callback,
				this.duration_s,
				Tone.now(),
				this.duration_s * (this._loops+1)
			);
}


	/**
	 * Stop playing the sound immediately.
	 *
	 * @name module:sound.TonePlayer#stop
	 * @function
	 * @public
	 */
	stop() {
		if (this._toneId)
			Tone.Transport.clear(this._toneId);
	}
}

// Start the Tone Transport
Tone.Transport.start(Tone.now());
