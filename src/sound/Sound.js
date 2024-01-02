/** @module sound */
/**
 * Sound stimulus.
 *
 * @author Alain Pitiot, Nikita Agafonov
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { PsychoJS } from "../core/PsychoJS.js";
import { PsychObject } from "../util/PsychObject.js";
import { AudioClipPlayer } from "./AudioClipPlayer.js";
import { TonePlayer } from "./TonePlayer.js";
import { TrackPlayer } from "./TrackPlayer.js";

/**
 * <p>This class handles sound playing (tones and tracks)</p>
 *
 * <ul>
 * <li> If value is a number then a tone will be generated at that frequency in Hz.</li>
 * <li> It value is a string, it must either be a note in the PsychoPy format (e.g 'A', 'Bfl', 'B', 'C', 'Csh'), in which case an octave must also be given, or the name of the resource track.</li>
 * </ul>
 *
 * <p> Note: the PsychoPy hamming parameter has not been implemented yet. It might be rather tricky to do so using
 * Tone.js</p>
 *
 * @example
 * [...]
 * const track = new Sound({
 *   win: psychoJS.window,
 *   value: 440,
 *   secs: 0.5
 * });
 * track.setVolume(1.0);
 * track.play(2);
 *
 * @extends PsychObject
 */
export class Sound extends PsychObject
{
	/**
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {number|string} [options.value= 'C'] - the sound value (see above for a full description)
	 * @param {number} [options.octave= 4] - the octave corresponding to the tone (if applicable)
	 * @param {number} [options.secs= 0.5] - duration of the tone (in seconds) If secs == -1, the sound will play indefinitely.
	 * @param {number} [options.startTime= 0] - start of playback for tracks (in seconds)
	 * @param {number} [options.stopTime= -1] - end of playback for tracks (in seconds)
	 * @param {boolean} [options.stereo= true] whether or not to play the sound or track in stereo
	 * @param {number} [options.volume= 1.0] - volume of the sound (must be between 0 and 1.0)
	 * @param {number} [options.loops= 0] - how many times to repeat the track or tone after it has played once. If loops == -1, the track or tone will repeat indefinitely until stopped.
	 * @param {boolean} [options.autoLog= true] whether or not to log
	 */
	constructor({
		name,
		win,
		value = "C",
		octave = 4,
		secs = 0.5,
		startTime = 0,
		stopTime = -1,
		stereo = true,
		volume = 1.0,
		loops = 0,
		// hamming = true,
		autoLog = true,
	} = {})
	{
		super(win._psychoJS, name);

		// the SoundPlayer, e.g. TonePlayer:
		this._player = undefined;

		this._addAttribute("win", win);
		this._addAttribute("octave", octave);
		this._addAttribute("secs", secs);
		this._addAttribute("startTime", startTime);
		this._addAttribute("stopTime", stopTime);
		this._addAttribute("stereo", stereo);
		this._addAttribute("volume", volume);
		this._addAttribute("loops", loops);
		this._addAttribute("autoLog", autoLog);

		// note: setValue will identify the appropriate SoundPlayer and possibly instantiate it
		// consequently _addAtribute("value") needs to be the last one so the other attributes are already set
		this._addAttribute("value", value);

		this.status = PsychoJS.Status.NOT_STARTED;
	}

	/**
	 * Start playing the sound.
	 *
	 * <p> Note: Sounds are played independently from the stimuli of the experiments, i.e. the experiment will not stop until the sound is finished playing.
	 * Repeat calls to play may results in the sounds being played on top of each other.</p>
	 *
	 * @param {number} loops how many times to repeat the sound after it plays once. If loops == -1, the sound will repeat indefinitely until stopped.
	 * @param {boolean} [log= true] whether to log
	 */
	play(loops, log = true)
	{
		this.status = PsychoJS.Status.STARTED;
		this._player.play(loops);
	}

	/**
	 * Stop playing the sound immediately.
	 *
	 * @param {Object} options
	 * @param {boolean} [options.log= true] - whether to log
	 */
	stop({
		log = true,
	} = {})
	{
		this._player.stop();
		this.status = PsychoJS.Status.STOPPED;
	}

	/**
	 * Get the duration of the sound, in seconds.
	 *
	 * @return {number} the duration of the sound, in seconds
	 */
	getDuration()
	{
		return this._player.getDuration();
	}

	/**
	 * Set the playing volume of the sound.
	 *
	 * @param {number} volume - the volume (values should be between 0 and 1)
	 * @param {boolean} [mute= false] - whether or not to mute the sound
	 * @param {boolean} [log= true] - whether to log
	 */
	setVolume(volume, mute = false, log = true)
	{
		this._setAttribute("volume", volume, log);

		if (typeof this._player !== "undefined")
		{
			this._player.setVolume(volume, mute);
		}
	}

	/**
	 * Set the sound value.
	 *
	 * @param {object} sound - a sound instance to replace the current one
	 * @param {boolean} [log= true] - whether to log
	 */
	setSound(sound, log = true)
	{
		if (!(sound instanceof Sound))
		{
			throw {
				origin: "Sound.setSound",
				context: "when setting the sound",
				error: "the argument should be an instance of the Sound class.",
			};
		}

		this._setAttribute("value", sound.value, log);

		if (typeof this._player !== "undefined")
		{
			this._player = this._player.constructor.accept(this);
		}

		return this;
	}

	/**
	 * Set the sound value.
	 *
	 * @param {number|string} [value = "C"] - the sound value
	 * @param {number} [octave = 4] - the octave corresponding to the tone (if applicable)
	 * @param {boolean} [log=true] - whether to log
   */
	setValue(value = "C", octave = 4, log = true)
	{
		this._setAttribute("value", value, log);

		const args = {
			psychoJS: this._psychoJS,
			stereo: this._stereo,
			volume: this._volume,
			loops: this._loops,
			startTime: this._startTime,
			stopTime: this._stopTime,
			secs: this._secs
		}

		let playerArgs = TonePlayer.accept(value, octave);
		if (playerArgs)
		{
			if (this._player instanceof TonePlayer)
			{
				this._player.setTone(value, octave);
			}
			else
			{
				this._player = new TonePlayer(Object.assign(args, playerArgs));
			}
			return;
		}

		playerArgs = TrackPlayer.accept(this._psychoJS, value);
		if (playerArgs)
		{
			if (this._player instanceof TrackPlayer)
			{
				this._player.setTrack(value);
			}
			else
			{
				this._player = new TrackPlayer(Object.assign(args, playerArgs));
			}
			return;
		}

		playerArgs = AudioClipPlayer.accept(this._psychoJS, value);
		if (playerArgs)
		{
			if (this._player instanceof AudioClipPlayer)
			{
				this._player.setAudioClip(value);
			}
			else
			{
				this._player = new AudioClipPlayer(Object.assign(args, playerArgs));
			}
			return;
		}

		throw {
			origin: "Sound.setValue",
			context: "when setting the sound value",
			error: "could not find an appropriate player.",
		};

	}

	/**
	 * Set the number of loops.
	 *
	 * @param {number} [loops=0] - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 * @param {boolean} [log=true] - whether to log
	 */
	setLoops(loops = 0, log = true)
	{
		this._setAttribute("loops", loops, log);

		if (typeof this._player !== "undefined")
		{
			this._player.setLoops(loops);
		}
	}

	/**
	 * Set the duration (in seconds)
	 *
	 * @param {number} [secs=0.5] - duration of the tone (in seconds) If secs == -1, the sound will play indefinitely.
	 * @param {boolean} [log=true] - whether to log
	 */
	setSecs(secs = 0.5, log = true)
	{
		this._setAttribute("secs", secs, log);

		if (typeof this._player !== "undefined")
		{
			this._player.setDuration(secs);
		}
	}

	/**
	 * Identify the appropriate player for the sound.
	 *
	 * @protected
	 * @return {SoundPlayer} the appropriate SoundPlayer
	 * @throws {Object.<string, *>} exception if no appropriate SoundPlayer could be found for the sound
	 */
	_getPlayer()
	{
		const acceptFns = [
			(sound) => TonePlayer.accept(sound),
			(sound) => TrackPlayer.accept(sound),
			(sound) => AudioClipPlayer.accept(sound),
		];

		for (const acceptFn of acceptFns)
		{
			this._player = acceptFn(this);
			if (typeof this._player !== "undefined")
			{
				return this._player;
			}
		}

		throw {
			origin: "SoundPlayer._getPlayer",
			context: "when finding a player for the sound",
			error: "could not find an appropriate player.",
		};
	}
}
