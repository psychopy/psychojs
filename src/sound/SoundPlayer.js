/**
 * Sound player interface
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { PsychObject } from "../util/PsychObject.js";

/**
 * <p>SoundPlayer is an interface for the sound players, who are responsible for actually playing the sounds, i.e. the tracks or the tones.</p>
 *
 * @interface
 * @extends PsychObject
 */
export class SoundPlayer extends PsychObject
{
	/**
	 * @memberOf module:sound
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 */
	constructor(psychoJS)
	{
		super(psychoJS);
	}

	/**
	 * Start playing the sound.
	 *
	 * @abstract
	 * @param {number} [loops] - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	play(loops)
	{
		throw {
			origin: "SoundPlayer.play",
			context: "when starting the playback of a sound",
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Stop playing the sound immediately.
	 *
	 * @abstract
	 */
	stop()
	{
		throw {
			origin: "SoundPlayer.stop",
			context: "when stopping the playback of a sound",
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Get the duration of the sound, in seconds.
	 *
	 * @abstract
	 */
	getDuration()
	{
		throw {
			origin: "SoundPlayer.getDuration",
			context: "when getting the duration of the sound",
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Set the duration of the sound, in seconds.
	 *
	 * @abstract
	 */
	setDuration(duration_s)
	{
		throw {
			origin: "SoundPlayer.setDuration",
			context: "when setting the duration of the sound",
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Set the number of loops.
	 *
	 * @abstract
	 * @param {number} loops - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		throw {
			origin: "SoundPlayer.setLoops",
			context: "when setting the number of loops",
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Set the volume of the tone.
	 *
	 * @abstract
	 * @param {Integer} volume - the volume of the tone
	 * @param {boolean} [mute= false] - whether or not to mute the tone
	 */
	setVolume(volume, mute = false)
	{
		throw {
			origin: "SoundPlayer.setVolume",
			context: "when setting the volume of the sound",
			error: "this method is abstract and should not be called.",
		};
	}
}
