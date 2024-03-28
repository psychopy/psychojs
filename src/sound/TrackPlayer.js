/**
 * Track Player.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { SoundPlayer } from "./SoundPlayer.js";
import { Howl } from "howler";

/**
 * <p>This class handles the playback of sound tracks.</p>
 *
 * @extends SoundPlayer
 * @todo stopTime is currently not implemented (tracks will play from startTime to finish)
 * @todo stereo is currently not implemented
 */
export class TrackPlayer extends SoundPlayer
{
	/**
	 * @memberOf module:sound
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {Object} options.howl - the sound object (see {@link https://howlerjs.com/})
	 * @param {number} [options.startTime= 0] - start of playback (in seconds)
	 * @param {number} [options.stopTime= -1] - end of playback (in seconds)
	 * @param {boolean} [options.stereo= true] whether or not to play the sound or track in stereo
	 * @param {number} [options.volume= 1.0] - volume of the sound (must be between 0 and 1.0)
	 * @param {number} [options.loops= 0] - how many times to repeat the track or tone after it has played
	 */
	constructor({
		psychoJS,
		howl,
		startTime = 0,
		stopTime = -1,
		stereo = true,
		volume = 0,
		loops = 0,
	} = {})
	{
		super(psychoJS);

		this._addAttribute("howl", howl);
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
	 * @param {string} value - the sound, which should be the name of an audio resource file
	 * @return {boolean} whether or not value is supported
	 */
	static checkValueSupport (value)
	{
		if (typeof value === "string")
		{
			return true;
		}

		return false;
	}

	/**
	 * Determine whether this player can play the given sound.
	 *
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 * @param {string} value - the sound value, which should be the name of an audio resource
	 * 	file
	 * @return {Object|boolean} argument needed to instantiate a TrackPlayer that can play the given sound
	 * 	or false otherwise
	 */
	static accept(psychoJS, value)
	{
		// value should be a string:
		if (typeof value === "string")
		{
			// check whether the value is the name of a resource:
			const howl = psychoJS.serverManager.getResource(value);
			if (typeof howl !== "undefined")
			{
				return { howl };
			}
		}

		// TonePlayer is not an appropriate player for the given sound:
		return false;
	}

	/**
	 * Get the duration of the sound, in seconds.
	 *
	 * @return {number} the duration of the track, in seconds
	 */
	getDuration()
	{
		return this._howl.duration();
	}

	/**
	 * Set the duration of the track.
	 *
	 * @param {number} duration_s - the duration of the track in seconds
	 */
	setDuration(duration_s)
	{
		if (typeof this._howl !== "undefined")
		{
			// Unfortunately Howler.js provides duration setting method
			this._howl._duration = duration_s;
		}
	}

	/**
	 * Set the volume of the tone.
	 *
	 * @param {Integer} volume - the volume of the track (must be between 0 and 1.0)
	 * @param {boolean} [mute= false] - whether or not to mute the track
	 */
	setVolume(volume, mute = false)
	{
		this._volume = volume;

		this._howl.volume(volume);
		this._howl.mute(mute);
	}

	/**
	 * Set the number of loops.
	 *
	 * @param {number} loops - how many times to repeat the track after it has played once. If loops == -1, the track will repeat indefinitely until stopped.
	 */
	setLoops(loops)
	{
		this._loops = loops;
		this._currentLoopIndex = -1;

		if (loops === 0)
		{
			this._howl.loop(false);
		}
		else
		{
			this._howl.loop(true);
		}
	}

	/**
	 * Set new track to play.
	 *
	 * @param {Object|string} track - a track resource name or Howl object (see {@link https://howlerjs.com/})
	 */
	setTrack(track)
	{
		let newHowl = undefined;

		if (typeof track === "string")
		{
			newHowl = this.psychoJS.serverManager.getResource(track);
		}
		else if (track instanceof Howl)
		{
			newHowl = track;
		}

		if (newHowl !== undefined)
		{
			this._howl.once("fade", (id) =>
			{
				this._howl.stop(id);
				this._howl.off("end");
				this._howl = newHowl;
			});
			this._howl.fade(this._howl.volume(), 0, 17, this._id);
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
			const self = this;
			this._howl.on("end", (event) =>
			{
				++this._currentLoopIndex;
				if (self._currentLoopIndex > self._loops)
				{
					self.stop();
				}
				else
				{
					self._howl.seek(self._startTime);
					self._id = self._howl.play();
					self._howl.fade(0, self._volume, fadeDuration, self._id);
				}
			});
		}

		this._howl.seek(this._startTime);
		this._id = this._howl.play();
		this._howl.fade(0, this._volume, fadeDuration, this._id);
	}

	/**
	 * Stop playing the sound immediately.
	 *
	 * @param {number} [fadeDuration = 17] - how long should the fading out last in ms
	 */
	stop(fadeDuration = 17)
	{
		this._howl.once("fade", (id) =>
		{
			this._howl.stop(id);
			this._howl.off("end");
		});
		this._howl.fade(this._howl.volume(), 0, fadeDuration, this._id);
	}
}
