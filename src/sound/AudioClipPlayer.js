/**
 * AudioClip Player.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { AudioClip } from "./AudioClip.js";
import { SoundPlayer } from "./SoundPlayer.js";

/**
 * <p>This class handles the playback of an audio clip, e.g. a microphone recording.</p>
 *
 * @extends SoundPlayer
 */
export class AudioClipPlayer extends SoundPlayer
{
	/**
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {Object} options.audioClip - the module:sound.AudioClip
	 * @param {number} [options.startTime= 0] - start of playback (in seconds)
	 * @param {number} [options.stopTime= -1] - end of playback (in seconds)
	 * @param {boolean} [options.stereo= true] whether or not to play the sound or track in stereo
	 * @param {number} [options.volume= 1.0] - volume of the sound (must be between 0 and 1.0)
	 * @param {number} [options.loops= 0] - how many times to repeat the track or tone after it has played *
	 */
	constructor({
		psychoJS,
		audioClip,
		startTime = 0,
		stopTime = -1,
		stereo = true,
		volume = 0,
		loops = 0,
	} = {})
	{
		super(psychoJS);

		this._addAttribute("audioClip", audioClip);
		this._addAttribute("startTime", startTime);
		this._addAttribute("stopTime", stopTime);
		this._addAttribute("stereo", stereo);
		this._addAttribute("loops", loops);
		this._addAttribute("volume", volume);

		this._currentLoopIndex = -1;
	}

	/**
	 * Determine whether this player can play the given sound.
	 *
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 * @param {string} value - the sound value, which should be the name of an audio resource
	 * 	file
	 * @return {Object|boolean} argument needed to instantiate a AudioClipPlayer that can play the given sound
	 * 	or false otherwise
	 */
	static accept(psychoJS, value)
	{
		if (value instanceof AudioClip)
		{
			return { audioClip: value };
		}

		// AudioClipPlayer is not an appropriate player for the given sound:
		return false;
	}

	/**
	 * Get the duration of the AudioClip, in seconds.
	 *
	 * @return {number} the duration of the clip, in seconds
	 */
	getDuration()
	{
		return this._audioClip.getDuration();
	}

	/**
	 * Set the duration of the audio clip.
	 *
	 * @param {number} duration_s - the duration of the clip in seconds
	 */
	setDuration(duration_s)
	{
		// TODO

		throw {
			origin: "AudioClipPlayer.setDuration",
			context: "when setting the duration of the playback for audio clip player: " + this._name,
			error: "not implemented yet",
		};
	}

	/**
	 * Set the volume of the playback.
	 *
	 * @param {number} volume - the volume of the playback (must be between 0.0 and 1.0)
	 * @param {boolean} [mute= false] - whether or not to mute the playback
	 */
	setVolume(volume, mute = false)
	{
		this._volume = volume;

		this._audioClip.setVolume((mute) ? 0.0 : volume);
	}

	/**
	 * Set the number of loops.
	 *
	 * @param {number} loops - how many times to repeat the clip after it has played once. If loops == -1, the clip will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		this._loops = loops;
		this._currentLoopIndex = -1;

		// TODO
	}

	/**
	 * Set the audio clip.
	 *
	 * @param {Object} options.audioClip - the module:sound.AudioClip.
	 */
	setAudioClip(audioClip)
	{
		if (audioClip instanceof AudioClip)
		{
			if (this._audioClip !== undefined)
			{
				this.stop();
			}
			this._audioClip = audioClip;
		}
	}

	/**
	 * Start playing the sound.
	 *
	 * @param {number} loops - how many times to repeat the track after it has played once. If loops == -1, the track will repeat indefinitely until stopped.
	 * @param {number} [fadeDuration = 17] - how long should the fading in last in ms
	 */
	play(loops, fadeDuration = 17)
	{
		if (typeof loops !== "undefined")
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
	 * @param {number} [fadeDuration = 17] - how long the fading out should last, in ms
	 */
	stop(fadeDuration = 17)
	{
		this._audioClip.stopPlayback(fadeDuration);
	}
}
