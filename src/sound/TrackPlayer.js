/**
 * Track Player.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {SoundPlayer} from './SoundPlayer.js';


/**
 * <p>This class handles the playback of sound tracks.</p>
 *
 * @name module:sound.TrackPlayer
 * @class
 * @extends SoundPlayer
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {Object} options.howl - the sound object (see {@link https://howlerjs.com/})
 * @param {number} [options.startTime= 0] - start of playback (in seconds)
 * @param {number} [options.stopTime= -1] - end of playback (in seconds)
 * @param {boolean} [options.stereo= true] whether or not to play the sound or track in stereo
 * @param {number} [options.volume= 1.0] - volume of the sound (must be between 0 and 1.0)
 * @param {number} [options.loops= 0] - how many times to repeat the track or tone after it has played *
 * @todo stopTime is currently not implemented (tracks will play from startTime to finish)
 * @todo stereo is currently not implemented
 */
export class TrackPlayer extends SoundPlayer
{
	constructor({
								psychoJS,
								howl,
								startTime = 0,
								stopTime = -1,
								stereo = true,
								volume = 0,
								loops = 0
							} = {})
	{
		super(psychoJS);

		this._addAttribute('howl', howl);
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
	 * @name module:sound.TrackPlayer.accept
	 * @function
	 * @static
	 * @public
	 * @param {module:sound.Sound} sound - the sound, which should be the name of an audio resource
	 * 	file
	 * @return {Object|undefined} an instance of TrackPlayer that can play the given track or undefined otherwise
	 */
	static accept(sound)
	{
		// if the sound's value is a string, we check whether it is the name of a resource:
		if (typeof sound.value === 'string')
		{
			const howl = sound.psychoJS.serverManager.getResource(sound.value);
			if (typeof howl !== 'undefined')
			{
				// build the player:
				const player = new TrackPlayer({
					psychoJS: sound.psychoJS,
					howl: howl,
					startTime: sound.startTime,
					stopTime: sound.stopTime,
					stereo: sound.stereo,
					loops: sound.loops,
					volume: sound.volume
				});
				return player;
			}
		}

		// TonePlayer is not an appropriate player for the given sound:
		return undefined;
	}


	/**
	 * Get the duration of the sound, in seconds.
	 *
	 * @name module:sound.TrackPlayer#getDuration
	 * @function
	 * @public
	 * @return {number} the duration of the track, in seconds
	 */
	getDuration()
	{
		return this._howl.duration();
	}


	/**
	 * Set the duration of the track.
	 *
	 * @name module:sound.TrackPlayer#setDuration
	 * @function
	 * @public
	 * @param {number} duration_s - the duration of the track in seconds
	 */
	setDuration(duration_s)
	{
		if (typeof this._howl !== 'undefined')
		{
			// Unfortunately Howler.js provides duration setting method
			this._howl._duration = duration_s;
		}
	}


	/**
	 * Set the volume of the tone.
	 *
	 * @name module:sound.TrackPlayer#setVolume
	 * @function
	 * @public
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
	 * @name module:sound.TrackPlayer#setLoops
	 * @function
	 * @public
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
	 * Start playing the sound.
	 *
	 * @name module:sound.TrackPlayer#play
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
			const self = this;
			this._howl.on('end', (event) =>
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
	 * @name module:sound.TrackPlayer#stop
	 * @function
	 * @public
	 * @param {number} [fadeDuration = 17] - how long should the fading out last in ms
	 */
	stop(fadeDuration = 17)
	{
		this._howl.once('fade', (id) => {
			this._howl.stop(id);
			this._howl.off('end');
		});
		this._howl.fade(this._howl.volume(), 0, fadeDuration, this._id);
	}

}
