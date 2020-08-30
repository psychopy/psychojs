/**
 * Manager responsible for the interactions between the experiment's stimuli and the mouse.
 *
 * @author Alain Pitiot
 * @author Sotiri Bakagiannis  - isPressedIn
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychoJS} from './PsychoJS';
import {PsychObject} from '../util/PsychObject';
import * as util from '../util/Util';


/**
 * <p>This manager handles the interactions between the experiment's stimuli and the mouse.</p>
 * <p>Note: the unit of Mouse is that of its associated Window.</p>
 *
 * @name module:core.Mouse
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {boolean} [options.autoLog= true] - whether or not to log
 *
 * @todo visible is not handled at the moment (mouse is always visible)
 */
export class Mouse extends PsychObject
{

	constructor({
								name,
								win,
								autoLog = true
							} = {})
	{
		super(win._psychoJS, name);

		// note: those are in window units:
		this._lastPos = undefined;
		this._prevPos = undefined; // used for motion detection and timing
		this._movedistance = 0.0;

		const units = win.units;
		const visible = 1;
		this._addAttributes(Mouse, win, units, visible, autoLog);

		this.status = PsychoJS.Status.NOT_STARTED;
	}


	/**
	 * Get the current position of the mouse in mouse/Window units.
	 *
	 * @name module:core.Mouse#getPos
	 * @function
	 * @public
	 * @return {Array.number} the position of the mouse in mouse/Window units
	 */
	getPos()
	{
		// get mouse position in the canvas:
		const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
		let pos_px = mouseInfo.pos.slice();

		// convert to the associated window's reference frame with (0,0) as the centre of the window:
		pos_px[0] = pos_px[0] - this.win.size[0] / 2;
		pos_px[1] = this.win.size[1] / 2 - pos_px[1];

		// convert to window units:
		this._lastPos = util.to_win(pos_px, 'pix', this._win);

		return this._lastPos;
	}


	/**
	 * Get the position of the mouse relative to that at the last call to getRel
	 * or getPos, in mouse/Window units.
	 *
	 * @name module:core.Mouse#getRel
	 * @function
	 * @public
	 * @return {Array.number} the relation position of the mouse in mouse/Window units.
	 */
	getRel()
	{
		if (typeof this._lastPos === 'undefined')
		{
			return this.getPos();
		}
		else
		{
			// note: (this.getPos()-lastPos) would not work here since getPos changes this._lastPos
			const lastPos = this._lastPos;
			const pos = this.getPos();
			return [-lastPos[0] + pos[0], -lastPos[1] + pos[1]];
		}
	}


	/**
	 * Get the travel of the mouse scroll wheel since the last call to getWheelRel.
	 *
	 * <p>Note: Even though this method returns a [x, y] array, for most wheels/systems y is the only
	 * value that varies.</p>
	 *
	 * @name module:core.Mouse#getWheelRel
	 * @function
	 * @public
	 * @return {Array.number} the mouse scroll wheel travel
	 */
	getWheelRel()
	{
		const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
		const wheelRel_px = mouseInfo.wheelRel.slice();

		// convert to window units:
		const wheelRel = util.to_win(wheelRel_px, 'pix', this._win);

		mouseInfo.wheelRel = [0, 0];
		return wheelRel;
	}


	/**
	 * Get the status of each button (pressed or released) and, optionally, the time elapsed between  the last call to [clickReset]{@link module:core.Mouse#clickReset} and the pressing or releasing of the buttons.
	 *
	 * <p>Note: clickReset is typically called at stimulus onset. When the participant presses a button, the time elapsed since the clickReset is stored internally and can be accessed any time afterwards with getPressed.</p>
	 *
	 * @name module:core.Mouse#getPressed
	 * @function
	 * @public
	 * @param {boolean} [getTime= false] whether or not to also return timestamps
	 * @return {Array.number | Array.<Array.number>} either an array of size 3 with the status (1 for pressed, 0 for released) of each mouse button [left, center, right], or a tuple with that array and another array of size 3 with the timestamps.
	 */
	getPressed(getTime = false)
	{
		const buttonPressed = this.psychoJS.eventManager.getMouseInfo().buttons.pressed.slice();
		if (!getTime)
		{
			return buttonPressed;
		}
		else
		{
			const buttonTimes = this.psychoJS.eventManager.getMouseInfo().buttons.times.slice();
			return [buttonPressed, buttonTimes];
		}
	}


	/**
	 * Helper method for checking whether a stimulus has had any button presses within bounds.
	 *
	 * @name module:core.Mouse#isPressedIn
	 * @function
	 * @public
	 * @param {object|module:visual.VisualStim} shape A type of visual stimulus or object having a `contains()` method.
	 * @param {object|number} [buttons] The target button index potentially tucked inside an object.
	 * @param {object} [options]
	 * @param {object|module:visual.VisualStim} [options.shape]
	 * @param {number} [options.buttons]
	 * @return {boolean} Whether button pressed is contained within stimulus.
	 */
	isPressedIn(...args)
	{
		// Look for options given in object literal form, cut out falsy inputs
		const [{ shape: shapeMaybe, buttons: buttonsMaybe } = {}] = args.filter(v => !!v);

		// Helper to check if some object features a certain key
		const hasKey = key => object => !!(object && object[key]);

		// Shapes are expected to be instances of stimuli, or at
		// the very least objects featuring a `contains()` method
		const isShape = hasKey('contains');

		// Go through arguments array looking for a shape if options object offers none
		const shapeFound = isShape(shapeMaybe) ? shapeMaybe : args.find(isShape);
		// Default to input (pass through)
		const shape = shapeFound || shapeMaybe;

		// Buttons values may be extracted from an object
		// featuring the `buttons` key, or found as integers
		// in the arguments array
		const hasButtons = hasKey('buttons');
		const { isInteger } = Number;
		// Prioritize buttons value given as part of an options object,
		// then look for the first occurrence in the arguments array of either
		// an integer or an extra object with a `buttons` key
		const buttonsFound = isInteger(buttonsMaybe) ? buttonsMaybe : args.find(o => hasButtons(o) || isInteger(o));
		// Worst case scenario `wanted` ends up being an empty object
		const { buttons: wanted = buttonsFound || buttonsMaybe } = buttonsFound || {};

		// Will throw if stimulus is falsy or non-object like
		if (typeof shape.contains === 'function')
		{
			const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
			const { pressed } = mouseInfo.buttons;

			// If no specific button wanted, any pressed will do
			const hasButtonPressed = isInteger(wanted) ? pressed[wanted] > 0 : pressed.some(v => v > 0);

			return hasButtonPressed && shape.contains(this);
		}

		return false;
	}


	/**
	 * Determine whether the mouse has moved beyond a certain distance.
	 *
	 * <p><b>distance</b>
	 * <ul>
	 * <li>mouseMoved() or mouseMoved(undefined, false): determine whether the mouse has moved at all since the last
	 * call to [getPos]{@link module:core.Mouse#getPos}</li>
	 * <li>mouseMoved(distance: number, false): determine whether the mouse has travelled further than distance, in terms of line of sight</li>
	 * <li>mouseMoved(distance: [number,number], false): determine whether the mouse has travelled horizontally or vertically further then the given horizontal and vertical distances</li>
	 * </ul></p>
	 *
	 * <p><b>reset</b>
	 * <ul>
	 * <li>mouseMoved(distance, true): reset the mouse move clock, return false</li>
	 * <li>mouseMoved(distance, 'here'): return false</li>
	 * <li>mouseMoved(distance, [x: number, y: number]: artifically set the previous mouse position to the given coordinates and determine whether the mouse moved further than the given distance</li>
	 * </ul></p>
	 *
	 * @name module:core.Mouse#mouseMoved
	 * @function
	 * @public
	 * @param {undefined|number|Array.number} [distance] - the distance to which the mouse movement is compared (see above for a full description)
	 * @param {boolean|String|Array.number} [reset= false] - see above for a full description
	 * @return {boolean} see above for a full description
	 */
	mouseMoved(distance, reset = false)
	{
		// make sure that _lastPos is defined:
		if (typeof this._lastPos === 'undefined')
		{
			this.getPos();
		}
		this._prevPos = this._lastPos.slice();
		this.getPos();

		if (typeof reset === 'boolean' && reset == false)
		{
			if (typeof distance === 'undefined')
			{
				return (this._prevPos[0] != this._lastPos[0]) || (this._prevPos[1] != this._lastPos[1]);
			}
			else
			{
				if (typeof distance === 'number')
				{
					this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
					return (this._movedistance > distance);
				}
				if (this._prevPos[0] + distance[0] - this._lastPos[0] > 0.0)
				{
					return true;
				} // moved on X-axis
				if (this._prevPos[1] + distance[1] - this._lastPos[0] > 0.0)
				{
					return true;
				} // moved on Y-axis
				return false;
			}
		}

		else if (typeof reset === 'boolean' && reset == true)
		{
			// reset the moveClock:
			this.psychoJS.eventManager.getMouseInfo().moveClock.reset();
			return false;
		}

		else if (reset === 'here')
		{
			// set to wherever we are
			this._prevPos = this._lastPos.clone();
			return false;
		}

		else if (reset instanceof Array)
		{
			// an (x,y) array
			// reset to (x,y) to check movement from there
			this._prevPos = reset.slice();
			if (!distance)
			{
				return false;
			}// just resetting prevPos, not checking distance
			else
			{
				// checking distance of current pos to newly reset prevposition
				if (typeof distance === 'number')
				{
					this._movedistance = Math.sqrt((this._prevPos[0] - this._lastPos[0]) * (this._prevPos[0] - this._lastPos[0]) + (this._prevPos[1] - this._lastPos[1]) * (this._prevPos[1] - this._lastPos[1]));
					return (this._movedistance > distance);
				}

				if (Math.abs(this._lastPos[0] - this._prevPos[0]) > distance[0])
				{
					return true;
				}  // moved on X-axis
				if (Math.abs(this._lastPos[1] - this._prevPos[1]) > distance[1])
				{
					return true;
				}  // moved on Y-axis

				return false;
			}
		}

		else
		{
			return false;
		}
	}


	/**
	 * Get the amount of time elapsed since the last mouse movement.
	 *
	 * @name module:core.Mouse#mouseMoveTime
	 * @function
	 * @public
	 * @return {number} the time elapsed since the last mouse movement
	 */
	mouseMoveTime()
	{
		return this.psychoJS.eventManager.getMouseInfo().moveClock.getTime();
	}


	/**
	 * Reset the clocks associated to the given mouse buttons.
	 *
	 * @name module:core.Mouse#clickReset
	 * @function
	 * @public
	 * @param {Array.number} [buttons= [0,1,2]] the buttons to reset (0: left, 1: center, 2: right)
	 */
	clickReset(buttons = [0, 1, 2])
	{
		const mouseInfo = this.psychoJS.eventManager.getMouseInfo();
		for (const b of buttons)
		{
			mouseInfo.buttons.clocks[b].reset();
			mouseInfo.buttons.times[b] = 0.0;
		}
	}


}

