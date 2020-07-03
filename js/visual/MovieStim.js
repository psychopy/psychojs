/**
 * Movie Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import * as util from '../util/Util';
import {PsychoJS} from "../core/PsychoJS";


/**
 * Movie Stimulus.
 *
 * @name module:visual.MovieStim
 * @class
 * @extends VisualStim
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {string | HTMLVideoElement} options.movie - the name of the movie resource or the HTMLVideoElement corresponding to the movie
 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
 * @param {string} [options.units= 'norm'] - the units of the stimulus vertices, size and position
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.size] - the size of the rendered image (the size of the image will be used if size is not specified)
 * @param {Color} [options.color= Color('white')] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {boolean} [options.interpolate= false] - whether or not the image is interpolated
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip vertically
 * @param {boolean} [options.loop= false] - whether or not to loop the movie
 * @param {number} [options.volume= 1.0] - the volume of the audio track (must be between 0.0 and 1.0)
 * @param {boolean} [options.noAudio= false] - whether or not to play the audio
 * @param {boolean} [options.autoPlay= true] - whether or not to autoplay the video
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo autoPlay does not work for the moment.
 */
export class MovieStim extends VisualStim
{
	constructor({
								name,
								win,
								movie,
								pos,
								units,
								ori,
								size,
								color = new Color('white'),
								opacity = 1.0,
								contrast = 1.0,
								interpolate = false,
								flipHoriz = false,
								flipVert = false,
								loop = false,
								volume = 1.0,
								noAudio = false,
								autoPlay = true,
								autoDraw,
								autoLog
							} = {})
	{
		super({name, win, units, ori, opacity, pos, size, autoDraw, autoLog});

		this.psychoJS.logger.debug('create a new MovieStim with name: ', name);

		this._addAttributes(MovieStim, movie, color, contrast, interpolate, flipHoriz, flipVert, loop, volume, noAudio, autoPlay);

		// check whether the fastSeek method on HTMLVideoElement is implemented:
		const videoElement = document.createElement('video');
		this._hasFastSeek = (typeof videoElement.fastSeek === 'function');

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Setter for the movie attribute.
	 *
	 * @name module:visual.MovieStim#setMovie
	 * @public
	 * @param {string | HTMLVideoElement} movie - the name of the movie resource or the HTMLVideoElement corresponding to the movie
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMovie(movie, log = false)
	{
		const response = {
			origin: 'MovieStim.setMovie',
			context: 'when setting the movie of MovieStim: ' + this._name
		};

		try
		{
			// movie is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof movie === 'undefined')
			{
				this.psychoJS.logger.warn('setting the movie of MovieStim: ' + this._name + ' with argument: undefined.');
				this.psychoJS.logger.debug('set the movie of MovieStim: ' + this._name + ' as: undefined');
			}
			else
			{
				// movie is a string: it should be the name of a resource, which we load
				if (typeof movie === 'string')
				{
					movie = this.psychoJS.serverManager.getResource(movie);
				}

				// movie should now be an actual HTMLVideoElement: we raise an error if it is not
				if (!(movie instanceof HTMLVideoElement))
				{
					throw 'the argument: ' + movie.toString() + ' is not a video" }';
				}

				this.psychoJS.logger.debug(`set the movie of MovieStim: ${this._name} as: src= ${movie.src}, size= ${movie.videoWidth}x${movie.videoHeight}, duration= ${movie.duration}s`);
			}

			this._setAttribute('movie', movie, log);

			// change status of stimulus when movie finish playing:
			this._movie.onended = () =>
			{
				this.status = PsychoJS.Status.FINISHED;
			};

			this._needUpdate = true;
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Setter for the volume attribute.
	 *
	 * @param {number} volume - the volume of the audio track (must be between 0.0 and 1.0)
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setVolume(volume, log = false)
	{
		this._setAttribute('volume', volume, log);

		this._needUpdate = true;
	}

	/**
	 * Setter for the noAudio attribute.
	 *
	 * @param {boolean} noAudio - whether or not to mute the audio
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setNoAudio(noAudio, log = false)
	{
		this._setAttribute('noAudio', noAudio, log);

		this._needUpdate = true;
	}

	/**
	 * Setter for the flipVert attribute.
	 *
	 * @name module:visual.MovieStim#setFlipVert
	 * @public
	 * @param {boolean} flipVert - whether or not to flip vertically
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipVert(flipVert, log = false)
	{
		this._setAttribute('flipVert', flipVert, log);

		this._needUpdate = true;
	}


	/**
	 * Setter for the flipHoriz attribute.
	 *
	 * @name module:visual.MovieStim#setFlipHoriz
	 * @public
	 * @param {boolean} flipHoriz - whether or not to flip horizontally
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipHoriz(flipHoriz, log = false)
	{
		this._setAttribute('flipHoriz', flipHoriz, log);

		this._needUpdate = true;
	}


	/**
	 * Reset the stimulus.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	reset(log = false)
	{
		this.status = PsychoJS.Status.NOT_STARTED;
		this._movie.pause();
		if (this._hasFastSeek)
		{
			this._movie.fastSeek(0);
		}
	}


	/**
	 * Start playing the movie.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	play(log = false)
	{
		this.status = PsychoJS.Status.STARTED;
		this._movie.play();
	}


	/**
	 * Pause the movie.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	pause(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		this._movie.pause();
	}


	/**
	 * Stop the movie and reset to 0s.
	 *
	 * @param {boolean} [log= false] - whether of not to log
	 */
	stop(log = false)
	{
		this.status = PsychoJS.Status.STOPPED;
		this._movie.pause();
		if (this._hasFastSeek)
		{
			this._movie.fastSeek(0);
		}
	}


	/**
	 * Jump to a specific timepoint
	 *
	 * <p>Note: seek is experimental and does not work on all browsers at the moment.</p>
	 *
	 * @param {number} timePoint - the timepoint to which to jump (in second)
	 * @param {boolean} [log= false] - whether of not to log
	 */
	seek(timePoint, log = false)
	{
		if (timePoint < 0 || timePoint > this._movie.duration)
		{
			throw {
				origin: 'MovieStim.seek',
				context: `when seeking to timepoint: ${timePoint} of MovieStim: ${this._name}`,
				error: `the timepoint does not belong to [0, ${this._movie.duration}`
			};
		}


		if (this._hasFastSeek)
		{
			this._movie.fastSeek(timePoint);
		}
	}


	/**
	 * Determine whether the given object is inside this movie.
	 *
	 * @name module:visual.MovieStim#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the image contains the object
	 */
	contains(object, units)
	{
		// get position of object:
		let objectPos_px = util.getPositionFromObject(object, units);
		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'MovieStim.contains',
				context: `when determining whether MovieStim: ${this._name} contains object: ${util.toString(object)}`,
				error: 'unable to determine the position of the object'
			};
		}

		// test for inclusion:
		// note: since _pixi.anchor is [0.5, 0.5] the movie is actually centered on pos
		let pos_px = util.to_px(this.pos, this.units, this._win);
		let size_px = util.to_px(this.size, this.units, this._win);
		const polygon_px = [
			[pos_px[0] - size_px[0] / 2, pos_px[1] - size_px[1] / 2],
			[pos_px[0] + size_px[0] / 2, pos_px[1] - size_px[1] / 2],
			[pos_px[0] + size_px[0] / 2, pos_px[1] + size_px[1] / 2],
			[pos_px[0] - size_px[0] / 2, pos_px[1] + size_px[1] / 2]];

		return util.IsPointInsidePolygon(objectPos_px, polygon_px);
	}


	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.MovieStim#_updateIfNeeded
	 * @private
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		this._pixi = undefined;

		// no movie to draw: return immediately
		if (typeof this._movie === 'undefined')
		{
			return;
		}

		// create a PixiJS video sprite:
		this._texture = PIXI.Texture.fromVideo(this._movie);
		this._pixi = new PIXI.Sprite(this._texture);


		// since _texture.width may not be immedialy available but the rest of the code needs its value
		// we arrange for repeated calls to _updateIfNeeded until we have a width:
		if (this._texture.width === 0)
		{
			this._needUpdate = true;
			return;
		}


		// audio:
		this._movie.muted = this._noAudio;
		this._movie.volume = this._volume;

		// autoplay and loop:
		this._texture.baseTexture.autoPlay = this.autoPlay;
		this._movie.loop = this._loop;

		// opacity:
		this._pixi.alpha = this.opacity;

		// stimulus size:
		// note: we use the size of the texture if MovieStim has no specified size:
		let stimSize = this.size;
		if (typeof stimSize === 'undefined')
		{
			const textureSize = [this._texture.width, this._texture.height];
			stimSize = util.to_unit(textureSize, 'pix', this.win, this.units);
		}

		// set the scale:
		const size_px = util.to_px(stimSize, this.units, this.win);
		const scaleX = size_px[0] / this._texture.width;
		const scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (movie centered on pos):
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;
	}


}
