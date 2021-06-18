/**
 * AudioClip Player.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {SoundPlayer} from './SoundPlayer';
import {AudioClip} from "./AudioClip";


/**
 * <p>This class handles the playback of an audio clip, e.g. a microphone recording.</p>
 *
 * @name module:sound.AudioClipPlayer
 * @class
 * @extends SoundPlayer
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {Object} options.audioClip - the module:sound.AudioClip
 * @param {number} [options.startTime= 0] - start of playback (in seconds)
 * @param {number} [options.stopTime= -1] - end of playback (in seconds)
 * @param {boolean} [options.stereo= true] whether or not to play the sound or track in stereo
 * @param {number} [options.volume= 1.0] - volume of the sound (must be between 0 and 1.0)
 * @param {number} [options.loops= 0] - how many times to repeat the track or tone after it has played *
 */
export class AudioClipPlayer extends SoundPlayer
{
	constructor({
								psychoJS,
								audioClip,
								startTime = 0,
								stopTime = -1,
								stereo = true,
								volume = 0,
								loops = 0
							} = {})
	{
		super(psychoJS);

		this._addAttribute('audioClip', audioClip);
		this._addAttribute('startTime', startTime);
		this._addAttribute('stopTime', stopTime);
		this._addAttribute('stereo', stereo);
		this._addAttribute('loops', loops);
		this._addAttribute('volume', volume);

		this._currentLoopIndex = -1;
	}


	/**
	 * Determine whether this player can play the given sound.
	 *
	 * @name module:sound.AudioClipPlayer.accept
	 * @function
	 * @static
	 * @public
	 * @param {module:sound.Sound} sound - the sound object, which should be an AudioClip
	 * @return {Object|undefined} an instance of AudioClipPlayer if sound is an AudioClip or undefined otherwise
	 */
	static accept(sound)
	{
		if (sound.value instanceof AudioClip)
		{
			// build the player:
			const player = new AudioClipPlayer({
				psychoJS: sound.psychoJS,
				audioClip: sound.value,
				startTime: sound.startTime,
				stopTime: sound.stopTime,
				stereo: sound.stereo,
				loops: sound.loops,
				volume: sound.volume
			});
			return player;
		}

		// AudioClipPlayer is not an appropriate player for the given sound:
		return undefined;
	}


	/**
	 * Get the duration of the AudioClip, in seconds.
	 *
	 * @name module:sound.AudioClipPlayer#getDuration
	 * @function
	 * @public
	 * @return {number} the duration of the track, in seconds
	 */
	getDuration()
	{
		// TODO
		return -1;
	}


	/**
	 * Set the duration of the default sprite.
	 *
	 * @name module:sound.AudioClipPlayer#setDuration
	 * @function
	 * @public
	 * @param {number} duration_s - the duration of the clip in seconds
	 */
	setDuration(duration_s)
	{
		// TODO
	}


	/**
	 * Set the volume of the playback.
	 *
	 * @name module:sound.AudioClipPlayer#setVolume
	 * @function
	 * @public
	 * @param {Integer} volume - the volume of the playback (must be between 0 and 1.0)
	 * @param {boolean} [mute= false] - whether or not to mute the playback
	 */
	setVolume(volume, mute = false)
	{
		this._volume = volume;

		// TODO
	}


	/**
	 * Set the number of loops.
	 *
	 * @name module:sound.AudioClipPlayer#setLoops
	 * @function
	 * @public
	 * @param {number} loops - how many times to repeat the clip after it has played once. If loops == -1, the clip will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		this._loops = loops;
		this._currentLoopIndex = -1;

		// TODO
	}


	/**
	 * Start playing the sound.
	 *
	 * @name module:sound.AudioClipPlayer#play
	 * @function
	 * @public
	 * @param {number} loops - how many times to repeat the track after it has played once. If loops == -1, the track will repeat indefinitely until stopped.
	 * @param {number} [fadeDuration = 17] - how long should the fading in last in ms
	 */
	play(loops, fadeDuration = 17)
	{
		if (typeof loops !== 'undefined')
		{
			this.setLoops(loops);
		}

		// handle repeats:
		if (loops > 0)
		{
			// TODO
		}

		this._audioClip.startPlayback();
	}


	/**
	 * Stop playing the sound immediately.
	 *
	 * @name module:sound.AudioClipPlayer#stop
	 * @function
	 * @public
	 * @param {number} [fadeDuration = 17] - how long should the fading out last in ms
	 */
	stop(fadeDuration = 17)
	{
		this._audioClip.stopPlayback();
	}

}
