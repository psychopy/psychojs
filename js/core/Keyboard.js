/**
 * Manager handling the keyboard events.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {Clock, MonotonicClock} from "../util/Clock";
import {PsychObject} from "../util/PsychObject";
import {PsychoJS} from "./PsychoJS";
import {EventManager} from "./EventManager";


/**
 * @name module:core.KeyPress
 * @class
 *
 * @param {string} code - W3C Key Code
 * @param {number} tDown - time of key press (keydown event) relative to the global Monotonic Clock
 * @param {string | undefined} name - pyglet key name
 */
export class KeyPress
{
	constructor(code, tDown, name)
	{
		this.code = code;
		this.tDown = tDown;
		this.name = (typeof name !== 'undefined') ? name : EventManager.w3c2pyglet(code);

		// duration of the keypress (time between keydown and keyup events) or undefined if there was no keyup
		this.duration = undefined;

		// time of keydown event relative to Keyboard clock:
		this.rt = undefined;
	}
}


/**
 * <p>This manager handles all keyboard events. It is a substitute for the keyboard component of EventManager. </p>
 *
 * @name module:core.Keyboard
 * @class
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {number} [options.bufferSize= 10000] - the maximum size of the circular keyboard event buffer
 * @param {boolean} [options.waitForStart= false] - whether or not to wait for a call to module:core.Keyboard#start
 * before recording keyboard events
 * @param {Clock} [options.clock= undefined] - an optional clock
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class Keyboard extends PsychObject
{

	constructor({
								psychoJS,
								bufferSize = 10000,
								waitForStart = false,
								clock,
								autoLog = false,
							} = {})
	{

		super(psychoJS);

		if (typeof clock === 'undefined')
		{
			clock = new Clock();
		} //this._psychoJS.monotonicClock;

		this._addAttributes(Keyboard, bufferSize, waitForStart, clock, autoLog);
		// start recording key events if need be:
		this._addAttribute('status', (waitForStart) ? PsychoJS.Status.NOT_STARTED : PsychoJS.Status.STARTED);

		// setup circular buffer:
		this.clearEvents();

		// add key listeners:
		this._addKeyListeners();

	}


	/**
	 * Start recording keyboard events.
	 *
	 * @name module:core.Keyboard#start
	 * @function
	 * @public
	 *
	 */
	start()
	{
		this._status = PsychoJS.Status.STARTED;
	}


	/**
	 * Stop recording keyboard events.
	 *
	 * @name module:core.Keyboard#stop
	 * @function
	 * @public
	 *
	 */
	stop()
	{
		this._status = PsychoJS.Status.STOPPED;
	}


	/**
	 * @typedef Keyboard.KeyEvent
	 *
	 * @property {string} W3C key code
	 * @property {string} W3C key
	 * @property {string} pyglet key
	 * @property {module:core.Keyboard#KeyStatus} key status
	 * @property {number} timestamp (in seconds)
	 */
	/**
	 * Get the list of those keyboard events still in the buffer, i.e. those that have not been
	 * previously cleared by calls to getKeys with clear = true.
	 *
	 * @name module:core.Keyboard#getEvents
	 * @function
	 * @public
	 * @return {Keyboard.KeyEvent[]} the list of events still in the buffer
	 */
	getEvents()
	{
		if (this._bufferLength === 0)
		{
			return [];
		}


		// iterate over the buffer, from start to end, and discard the null event:
		let filteredEvents = [];
		const bufferWrap = (this._bufferLength === this._bufferSize);
		let i = bufferWrap ? this._bufferIndex : -1;
		do
		{
			i = (i + 1) % this._bufferSize;
			const keyEvent = this._circularBuffer[i];
			if (keyEvent)
			{
				filteredEvents.push(keyEvent);
			}
		} while (i !== this._bufferIndex);

		return filteredEvents;
	}


	/**
	 * Get the list of keys pressed or pushed by the participant.
	 *
	 * @name module:core.Keyboard#getKeys
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {string[]} [options.keyList= []]] - the list of keys to consider. If keyList is empty, we consider all keys.
	 * Note that we use pyglet keys here, to make the PsychoJs code more homogeneous with PsychoPy.
	 * @param {boolean} [options.waitRelease= true] - whether or not to include those keys pressed but not released. If
	 * waitRelease = false, key presses without a corresponding key release will have an undefined duration.
	 * @param {boolean} [options.clear= false] - whether or not to keep in the buffer the key presses or pushes for a subsequent call to getKeys. If a keyList has been given and clear = true, we only remove from the buffer those keys in keyList
	 * @return {KeyPress[]} the list of keys that were pressed (keydown followed by keyup) or pushed
	 * (keydown with no subsequent keyup at the time getKeys is called).
	 */
	getKeys({
						keyList = [],
						waitRelease = true,
						clear = true
					} = {})
	{

		// if nothing in the buffer, return immediately:
		if (this._bufferLength === 0)
		{
			return [];
		}

		let keyPresses = [];

		// iterate over the circular buffer, looking for keyup events:
		const bufferWrap = (this._bufferLength === this._bufferSize);
		let i = bufferWrap ? this._bufferIndex : -1;
		do
		{
			i = (i + 1) % this._bufferSize;

			const keyEvent = this._circularBuffer[i];
			if (keyEvent && keyEvent.status === Keyboard.KeyStatus.KEY_UP)
			{
				// check that the key is in the keyList:
				if (keyList.length === 0 || keyList.includes(keyEvent.pigletKey))
				{
					// look for a corresponding, preceding keydown event:
					const precedingKeydownIndex = keyEvent.keydownIndex;
					if (typeof precedingKeydownIndex !== 'undefined')
					{
						const precedingKeydownEvent = this._circularBuffer[precedingKeydownIndex];
						if (precedingKeydownEvent)
						{
							// prepare KeyPress and add it to the array:
							const tDown = precedingKeydownEvent.timestamp;
							const keyPress = new KeyPress(keyEvent.code, tDown, keyEvent.pigletKey);
							keyPress.rt = tDown - this._clock.getLastResetTime();
							keyPress.duration = keyEvent.timestamp - precedingKeydownEvent.timestamp;
							keyPresses.push(keyPress);

							if (clear)
							{
								this._circularBuffer[precedingKeydownIndex] = null;
							}
						}
					}

					/* old approach: the circular buffer contains independent keydown and keyup events:
					let j = i - 1;
					do {
						if (j === -1 && bufferWrap)
							j = this._bufferSize - 1;

						const precedingKeyEvent = this._circularBuffer[j];

						if (precedingKeyEvent &&
							(precedingKeyEvent.key === keyEvent.key) &&
							(precedingKeyEvent.status === Keyboard.KeyStatus.KEY_DOWN)) {
							duration = keyEvent.timestamp - precedingKeyEvent.timestamp;

							if (clear)
							// rather than modify the circular buffer, which is computationally expensive,
							// we simply nullify the keyEvent:
								this._circularBuffer[j] = null;

							break;
						}

						j = j - 1;
					} while ((bufferWrap && j !== i) || (j > -1));*/

					if (clear)
					{
						this._circularBuffer[i] = null;
					}

				}
			}

		} while (i !== this._bufferIndex);


		// if waitRelease = false, we iterate again over the map of unmatched keydown events:
		if (!waitRelease)
		{
			for (const unmatchedKeyDownIndex of this._unmatchedKeydownMap.values())
			{
				const keyEvent = this._circularBuffer[unmatchedKeyDownIndex];
				if (keyEvent)
				{
					// check that the key is in the keyList:
					if (keyList.length === 0 || keyList.includes(keyEvent.pigletKey))
					{
						const tDown = keyEvent.timestamp;
						const keyPress = new KeyPress(keyEvent.code, tDown, keyEvent.pigletKey);
						keyPress.rt = tDown - this._clock.getLastResetTime();
						keyPresses.push(keyPress);

						if (clear)
						{
							this._unmatchedKeydownMap.delete(keyEvent.code);
							this._circularBuffer[unmatchedKeyDownIndex] = null;
						}
					}
				}
			}
			/* old approach: the circular buffer contains independent keydown and keyup events:
			let i = bufferWrap ? this._bufferIndex : -1;
			do {
				i = (i + 1) % this._bufferSize;

				const keyEvent = this._circularBuffer[i];
				if (keyEvent && keyEvent.status === Keyboard.KeyStatus.KEY_DOWN) {
					// check that the key is in the keyList:
					const pigletKey = EventManager.w3c2pyglet(keyEvent.code);
					if (keyList.length === 0 || keyList.includes(pigletKey)) {
						keyPresses.push(new KeyPress(keyEvent.code, keyEvent.timestamp, pigletKey));

						if (clear)
							// rather than modify the circular buffer, which is computationally expensive, we simply nullify
							// the keyEvent:
							this._circularBuffer[i] = null;
					}
				}

			} while (i !== this._bufferIndex);*/
		}


		// if clear = true and the keyList is empty, we clear all the events:
		if (clear && keyList.length === 0)
		{
			this.clearEvents();
		}


		return keyPresses;
	}


	/**
	 * Clear all events and resets the circular buffers.
	 *
	 * @name module:core.Keyboard#clearEvents
	 * @function
	 */
	clearEvents()
	{
		// circular buffer of key events (keydown and keyup):
		this._circularBuffer = new Array(this._bufferSize);
		this._bufferLength = 0;
		this._bufferIndex = -1;
		this._previousKeydownKey = undefined;

		// (code => circular buffer index) map of keydown events not yet matched to keyup events:
		this._unmatchedKeydownMap = new Map();
	}


	/**
	 * Test whether a list of KeyPress's contains one with a particular name.
	 *
	 * @name module:core.Keyboard#includes
	 * @function
	 * @static
	 * @param {module:core.KeyPress[]} keypressList - list of KeyPress's
	 * @param {string } keyName - pyglet key name, e.g. 'escape', 'left'
	 * @return {boolean} whether or not a KeyPress with the given pyglet key name is present in the list
	 */
	static includes(keypressList, keyName)
	{
		if (!Array.isArray(keypressList))
		{
			return false;
		}

		const value = keypressList.find((keypress) => keypress.name === keyName);
		return (typeof value !== 'undefined');
	}


	/**
	 * Add key listeners to the document.
	 *
	 * @name module:core.Keyboard#_addKeyListeners
	 * @function
	 * @private
	 */
	_addKeyListeners()
	{
		this._previousKeydownKey = undefined;
		const self = this;


		// add a keydown listener:
		window.addEventListener("keydown", (event) =>
			// document.addEventListener("keydown", (event) =>
		{
			// only consider non-repeat events, i.e. only the first keydown event associated with a participant
			// holding a key down:
			if (event.repeat)
			{
				return;
			}

			const timestamp = MonotonicClock.getReferenceTime(); // timestamp in seconds

			if (this._status !== PsychoJS.Status.STARTED)
			{
				return;
			}

			/**
			 * DEPRECATED: we now use event.repeat
			// since keydown events will repeat as long as the key is pressed, we need to track the last pressed key:
			if (event.key === self._previousKeydownKey)
				return;
			 */
			self._previousKeydownKey = event.key;

			let code = event.code;

			// take care of legacy Microsoft browsers (IE11 and pre-Chromium Edge):
			if (typeof code === 'undefined')
			{
				code = EventManager.keycode2w3c(event.keyCode);
			}

			let pigletKey = EventManager.w3c2pyglet(code);


			self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
			self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
			self._circularBuffer[self._bufferIndex] = {
				code,
				key: event.key,
				pigletKey,
				status: Keyboard.KeyStatus.KEY_DOWN,
				timestamp
			};

			self._unmatchedKeydownMap.set(event.code, self._bufferIndex);

			self._psychoJS.logger.trace('keydown: ', event.key);

			event.stopPropagation();
		});


		// add a keyup listener:
		window.addEventListener("keyup", (event) =>
			// document.addEventListener("keyup", (event) =>
		{
			const timestamp = MonotonicClock.getReferenceTime(); // timestamp in seconds

			if (this._status !== PsychoJS.Status.STARTED)
			{
				return;
			}

			self._previousKeydownKey = undefined;

			let code = event.code;

			// take care of legacy Microsoft Edge:
			if (typeof code === 'undefined')
			{
				code = EventManager.keycode2w3c(event.keyCode);
			}

			let pigletKey = EventManager.w3c2pyglet(code);

			self._bufferIndex = (self._bufferIndex + 1) % self._bufferSize;
			self._bufferLength = Math.min(self._bufferLength + 1, self._bufferSize);
			self._circularBuffer[self._bufferIndex] = {
				code,
				key: event.key,
				pigletKey,
				status: Keyboard.KeyStatus.KEY_UP,
				timestamp
			};

			// get the corresponding keydown event
			// note: if more keys are down than there are slots in the circular buffer, there might
			// not be a corresponding keydown event
			const correspondingKeydownIndex = self._unmatchedKeydownMap.get(event.code);
			if (typeof correspondingKeydownIndex !== 'undefined')
			{
				self._circularBuffer[self._bufferIndex].keydownIndex = correspondingKeydownIndex;
				self._unmatchedKeydownMap.delete(event.code);
			}

			self._psychoJS.logger.trace('keyup: ', event.key);

			event.stopPropagation();
		});

	}
}


/**
 * Keyboard KeyStatus.
 *
 * @name module:core.Keyboard#KeyStatus
 * @enum {Symbol}
 * @readonly
 * @public
 */
Keyboard.KeyStatus = {
	KEY_DOWN: Symbol.for('KEY_DOWN'),
	KEY_UP: Symbol.for('KEY_UP')
};
