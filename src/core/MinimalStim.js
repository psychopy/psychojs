/**
 * Base class for all stimuli.
 *
 * @author Alain Pitiot
 * @version 2022.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { PsychObject } from "../util/PsychObject.js";
import * as util from "../util/Util.js";
import { PsychoJS } from "./PsychoJS.js";

/**
 * <p>MinimalStim is the base class for all stimuli.</p>
 *
 * @extends PsychObject
 */
export class MinimalStim extends PsychObject
{
	/**
	 * @memberof module:core
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= win.autoLog] - whether to log
	 */
	constructor({ name, win, autoDraw, autoLog } = {})
	{
		super(win._psychoJS, name);

		// the PIXI representation of the stimulus:
		this._pixi = undefined;

		this._addAttribute(
			"win",
			win,
			undefined,
		);
		this._addAttribute(
			"autoDraw",
			autoDraw,
			false,
		);
		this._addAttribute(
			"autoLog",
			autoLog,
			(typeof win !== "undefined" && win !== null) ? win.autoLog : false,
		);

		this._needUpdate = false;
		this.status = PsychoJS.Status.NOT_STARTED;
	}

	/**
	 * Setter for the autoDraw attribute.
	 *
	 * @param {boolean} autoDraw - the new value
	 * @param {boolean} [log= false] - whether to log
	 */
	setAutoDraw(autoDraw, log = false)
	{
		this._setAttribute("autoDraw", autoDraw, log);

		// autoDraw = true: add the stimulus to the draw list if it's not there already
		if (this._autoDraw)
		{
			this.draw();
		}
		// autoDraw = false: remove the stimulus from the draw list (and from the root container if it's already there)
		else
		{
			this.hide();
		}
	}

	/**
	 * Draw this stimulus on the next frame draw.
	 */
	draw()
	{
		if (this.win)
		{
			const index = this._win._drawList.indexOf(this);

			// if the stimulus is not already in the draw list:
			if (index < 0)
			{
				// update the stimulus if need be before we add its PIXI representation to the window container:
				this._updateIfNeeded();
				if (typeof this._pixi === "undefined")
				{
					this.psychoJS.logger.warn("the Pixi.js representation of this stimulus is undefined.");
				}
				else
				{
					this._win.addPixiObject(this._pixi);
					this.win._drawList.push(this);
				}
			}
			else
			{
				// the stimulus is already in the list, if it needs to be updated, we remove it
				// from the window container, update it, then put it back:
				if (this._needUpdate && typeof this._pixi !== "undefined")
				{
					this._win.removePixiObject(this._pixi);
					this._updateIfNeeded();
					this._win.addPixiObject(this._pixi);
				}
			}
		}

		this.status = PsychoJS.Status.STARTED;
	}

	/**
	 * Hide this stimulus on the next frame draw.
	 */
	hide()
	{
		if (this._win)
		{
			const index = this._win._drawList.indexOf(this);
			if (index >= 0)
			{
				this._win._drawList.splice(index, 1);

				// if the stimulus has a pixi representation, remove it from the root container:
				if (typeof this._pixi !== "undefined")
				{
					this._win.removePixiObject(this._pixi);
				}
			}
			this.status = PsychoJS.Status.STOPPED;
		}
	}

	/**
	 * Determine whether an object is inside this stimulus.
	 *
	 * @abstract
	 * @param {Object} object - the object
	 * @param {String} units - the stimulus units
	 */
	contains(object, units)
	{
		throw {
			origin: "MinimalStim.contains",
			context: `when determining whether stimulus: ${this._name} contains object: ${util.toString(object)}`,
			error: "this method is abstract and should not be called.",
		};
	}

	/**
	 * Release the PIXI representation, if there is one.
	 *
	 * @param {boolean} [log= false] - whether to log
	 */
	release(log = false)
	{
		this._setAttribute("autoDraw", false, log);
		this.status = PsychoJS.Status.STOPPED;

		if (typeof this._pixi !== "undefined")
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
	 * @abstract
	 * @protected
	 */
	_updateIfNeeded()
	{
		throw {
			origin: "MinimalStim._updateIfNeeded",
			context: "when updating stimulus: " + this._name,
			error: "this method is abstract and should not be called.",
		};
	}
}
