/**
 * Sound player interface
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from '../util/PsychObject';


/**
 * <p>SoundPlayer is an interface for the sound players, who are responsible for actually playing the sounds, i.e. the tracks or the tones.</p>
 *
 * @name module:sound.SoundPlayer
 * @interface
 * @extends PsychObject
 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
 */
export class SoundPlayer extends PsychObject
{
	constructor(psychoJS)
	{
		super(psychoJS);
	}


	/**
	 * Determine whether this player can play the given sound.
	 *
	 * @name module:sound.SoundPlayer.accept
	 * @function
	 * @static
	 * @public
	 * @abstract
	 * @param {module:sound.Sound} - the sound
	 * @return {Object|undefined} an instance of the SoundPlayer that can play the sound, or undefined if none could be found
	 */
	static accept(sound)
	{
		throw {
			origin: 'SoundPlayer.accept',
			context: 'when evaluating whether this player can play a given sound',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Start playing the sound.
	 *
	 * @name module:sound.SoundPlayer#play
	 * @function
	 * @public
	 * @abstract
	 * @param {number} [loops] - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	play(loops)
	{
		throw {
			origin: 'SoundPlayer.play',
			context: 'when starting the playback of a sound',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Stop playing the sound immediately.
	 *
	 * @name module:sound.SoundPlayer#stop
	 * @function
	 * @public
	 * @abstract
	 */
	stop()
	{
		throw {
			origin: 'SoundPlayer.stop',
			context: 'when stopping the playback of a sound',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Get the duration of the sound, in seconds.
	 *
	 * @name module:sound.SoundPlayer#getDuration
	 * @function
	 * @public
	 * @abstract
	 */
	getDuration()
	{
		throw {
			origin: 'SoundPlayer.getDuration',
			context: 'when getting the duration of the sound',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Set the duration of the sound, in seconds.
	 *
	 * @name module:sound.SoundPlayer#setDuration
	 * @function
	 * @public
	 * @abstract
	 */
	setDuration(duration_s)
	{
		throw {
			origin: 'SoundPlayer.setDuration',
			context: 'when setting the duration of the sound',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Set the number of loops.
	 *
	 * @name module:sound.SoundPlayer#setLoops
	 * @function
	 * @public
	 * @abstract
	 * @param {number} loops - how many times to repeat the sound after it has played once. If loops == -1, the sound will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		throw {
			origin: 'SoundPlayer.setLoops',
			context: 'when setting the number of loops',
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Set the volume of the tone.
	 *
	 * @name module:sound.SoundPlayer#setVolume
	 * @function
	 * @public
	 * @abstract
	 * @param {Integer} volume - the volume of the tone
	 * @param {boolean} [mute= false] - whether or not to mute the tone
	 */
	setVolume(volume, mute = false)
	{
		throw {
			origin: 'SoundPlayer.setVolume',
			context: 'when setting the volume of the sound',
			error: 'this method is abstract and should not be called.'
		};
	}

}
