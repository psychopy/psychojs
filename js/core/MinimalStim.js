/**
 * Base class for all stimuli.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from '../util/PsychObject';
import {PsychoJS} from './PsychoJS';


/**
 * <p>MinimalStim is the base class for all stimuli.</p>
 *
 * @name module:core.MinimalStim
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= win.autoLog] - whether or not to log
 */
export class MinimalStim extends PsychObject
{
	constructor({
								name,
								win,
								autoDraw = false,
								autoLog = win.autoLog
							} = {})
	{
		super(win._psychoJS, name);

		// the PIXI representation of the stimulus:
		this._pixi = undefined;

		this._addAttributes(MinimalStim, win, autoDraw, autoLog);

		this._needUpdate = false;
		this.status = PsychoJS.Status.NOT_STARTED;
	}


	/**
	 * Setter for the autoDraw attribute.
	 *
	 * @name module:core.MinimalStim#setAutoDraw
	 * @function
	 * @public
	 * @param {boolean} autoDraw - the new value
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setAutoDraw(autoDraw, log = false)
	{
		let response = {
			origin: 'MinimalStim.setAutoDraw',
			context: 'when setting the autoDraw attribute of stimulus: ' + this._name
		};

		this._setAttribute('autoDraw', autoDraw, log);

		const index = this.win._drawList.indexOf(this);

		// autoDraw = true: add the stimulus to the draw list if it's not there already
		if (this._autoDraw)
		{
			if (this.win)
			{
				// if the stimilus is not already in the draw list:
				if (index < 0)
				{
					// update the stimulus if need be before we add its PIXI representation to the window container:
					this._updateIfNeeded();
					if (typeof this._pixi === 'undefined')
					{
						this.psychoJS.logger.warn('the Pixi.js representation of this stimulus is undefined.');
					}// throw Object.assign(response, { error: 'the PIXI representation of the stimulus is unavailable'});
					else
					{
						this.win._rootContainer.addChild(this._pixi);
						this.win._drawList.push(this);
					}
				}
				else
				{
					// the stimulus is already in the list, if it needs to be updated, we remove it
					// from the window container, update it, then put it back:
					if (this._needUpdate && typeof this._pixi !== 'undefined')
					{
						this.win._rootContainer.removeChild(this._pixi);
						this._updateIfNeeded();
						this.win._rootContainer.addChild(this._pixi);
					}
				}
			}

			this.status = PsychoJS.Status.STARTED;
		}

		// autoDraw = false: remove the stimulus from the draw list and window container if it's already there
		else
		{
			if (this.win)
			{
				// if the stimulus is in the draw list, remove it from the list and from the window container:
				if (index >= 0)
				{
					this.win._drawList.splice(index, 1);
					if (typeof this._pixi !== 'undefined')
					{
						this.win._rootContainer.removeChild(this._pixi);
					}
				}
			}

			this.status = PsychoJS.Status.STOPPED;
		}
	}


	/**
	 * Draw this stimulus on the next frame draw.
	 *
	 * @name module:core.MinimalStim#draw
	 * @function
	 * @public
	 */
	draw()
	{
		this._updateIfNeeded();

		if (this.win && this.win._drawList.indexOf(this) < 0 && typeof this._pixi !== 'undefined')
		{
			this.win._container.addChild(this._pixi);
			this.win._drawList.push(this);
		}
	}


	/**
	 * Determine whether an object is inside this stimulus.
	 *
	 * @name module:core.MinimalStim#contains
	 * @function
	 * @abstract
	 * @public
	 * @param {Object} object - the object
	 * @param {String} units - the stimulus units
	 */
	contains(object, units)
	{
		throw {
			origin: 'MinimalStim.contains',
			context: `when determining whether stimulus: ${this._name} contains object: ${util.toString(object)}`,
			error: 'this method is abstract and should not be called.'
		};
	}


	/**
	 * Release the PIXI representation, if there is one.
	 *
	 * @name module:core.MinimalStim#release
	 * @function
	 * @public
	 */
	release()
	{
		this._setAttribute('autoDraw', false, log);
		this.status = PsychoJS.Status.STOPPED;

		if (typeof this._pixi !== 'undefined')
		{
			this._pixi.destroy(true);
			this._pixi = undefined;
		}
	}


	/**
	 * Update the stimulus, if necessary.
	 *
	 * Note: this is an abstract function, which should not be called.
	 *
	 * @name module:core.MinimalStim#_updateIfNeeded
	 * @function
	 * @abstract
	 * @private
	 */
	_updateIfNeeded()
	{
		throw {
			origin: 'MinimalStim._updateIfNeeded',
			context: 'when updating stimulus: ' + this._name,
			error: 'this method is abstract and should not be called.'
		};
	}
}
