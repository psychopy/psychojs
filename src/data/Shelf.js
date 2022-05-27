/** @module data */
/**
 * Shelf handles persistent key/value pairs, which are stored in the shelf collection on the
 * server, and accessed in a safe, concurrent fashion.
 *
 * @author Alain Pitiot
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from "../util/PsychObject.js";
import { PsychoJS } from "../core/PsychoJS.js";
import {ExperimentHandler} from "./ExperimentHandler";
import { Scheduler } from "../util/Scheduler.js";


/**
 * <p>Shelf handles persistent key/value pairs, which are stored in the shelf collection on the
 * server, and accessed in a safe, concurrent fashion.</p>
 *
 * @name module:data.Shelf
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class Shelf extends PsychObject
{
	/**
	 * Maximum number of components in a key
	 * @name module:data.Shelf.#MAX_KEY_LENGTH
	 * @type {number}
	 * @note this value should mirror that on the server, i.e. the server also checks that the key is valid
	 */
	static #MAX_KEY_LENGTH = 10;

	constructor({psychoJS, autoLog = false } = {})
	{
		super(psychoJS);

		this._addAttribute('autoLog', autoLog);
		this._addAttribute('status', Shelf.Status.READY);

		// minimum period of time, in ms, before two calls to Shelf methods, i.e. throttling:
		this._throttlingPeriod_ms = 5000.0;

		// timestamp of the last actual call to a Shelf method:
		this._lastCallTimestamp = 0.0;
		// timestamp of the last scheduled call to a Shelf method:
		this._lastScheduledCallTimestamp = 0.0;
	}

	/**
	 * Get the value associated with the given key.
	 *
	 * @name module:data.Shelf#getValue
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] 	key as an array of key components
	 * @param [defaultValue]					default value
	 * @return {Promise<any>}
	 */
	async getValue(key = [], defaultValue)
	{
		const response = {
			origin: 'Shelf.getValue',
			context: `when getting the value associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("getValue");
			this._checkKey(key);

			// prepare the request:
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/value`;
			const data = {
				key
			};
			if (typeof defaultValue !== 'undefined')
			{
				data['defaultValue'] = defaultValue;
			}

			// query the server:
			const response = await fetch(url, {
				method: 'PUT',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return document['value'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Set the value associated with the given key.
	 *
	 * <p>This creates a new key/value pair if the key was previously unknown.</p>
	 *
	 * @name module:data.Shelf#setValue
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @param value
	 * @return {Promise<any>}
	 */
	async setValue(key = [], value)
	{
		const response = {
			origin: 'Shelf.setValue',
			context: `when setting the value associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("setValue");
			this._checkKey(key);

			// prepare the request:
			// const componentList = key.reduce((list, component) => list + '+' + component, '');
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/value`;
			const data = {
				key,
				value
			};

			// query the server:
			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return document['record']['value'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Get the names of the fields in the dictionary record associated with the given key.
	 *
	 * @name module:data.Shelf#getDictionaryFieldNames
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @return {Promise<any>}
	 */
	async getDictionaryFieldNames(key = [])
	{
		const response = {
			origin: 'Shelf.getDictionaryFieldNames',
			context: `when getting the names of the fields in the dictionary record associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("getDictionaryFieldNames");
			this._checkKey(key);

			// prepare the request:
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/dictionary/fields`;
			const data = {
				key
			};

			// query the server:
			const response = await fetch(url, {
				method: 'PUT',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the field names:
			this._status = Shelf.Status.READY;
			return document['fieldNames'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Get the value of a given field in the dictionary record associated with the given key.
	 *
	 * @name module:data.Shelf#getDictionaryValue
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] 	key as an array of key components
	 * @param {string} fieldName			the name of the field
	 * @param [defaultValue]					default value
	 * @return {Promise<any>}
	 */
	async getDictionaryValue(key = [], fieldName, defaultValue)
	{
		const response = {
			origin: 'Shelf.getDictionaryFieldNames',
			context: `when getting value of field: ${fieldName} in the dictionary record associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("getDictionaryValue");
			this._checkKey(key);

			// prepare the request:
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/dictionary/values`;
			const data = {
				key,
				fieldName
			};
			if (typeof defaultValue !== 'undefined')
			{
				data['defaultValue'] = defaultValue;
			}

			// query the server:
			const response = await fetch(url, {
				method: 'PUT',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the value:
			this._status = Shelf.Status.READY;
			return document['value'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Set a field in the dictionary record associated to the given key.
	 *
	 * @name module:data.Shelf#setDictionaryField
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @param fieldName
	 * @param fieldValue
	 * @return {Promise<any>}
	 */
	async setDictionaryField(key = [], fieldName, fieldValue)
	{
		const response = {
			origin: 'Shelf.setDictionaryField',
			context: `when setting a field with name: ${fieldName} in the dictionary record associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("setDictionaryField");
			this._checkKey(key);

			// prepare the request:
			// const componentList = key.reduce((list, component) => list + '+' + component, '');
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/dictionary/fields`;
			const data = {
				key,
				fieldName,
				fieldValue
			};

			// query the server:
			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return document['record']['value'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Schedulable component that will block the experiment until the counter associated with the given key
	 * has been incremented by the given amount.
	 *
	 * @name module:data.Shelf#incrementComponent
	 * @function
	 * @public
	 * @param key
	 * @param increment
	 * @param callback
	 * @returns {function(): module:util.Scheduler.Event|Symbol|*} a component that can be scheduled
	 *
	 * @example
	 * const flowScheduler = new Scheduler(psychoJS);
	 * var experimentCounter = '<>';
	 * flowScheduler.add(psychoJS.shelf.incrementComponent(['counter'], 1, (value) => experimentCounter = value));
	 */
	incrementComponent(key = [], increment = 1, callback)
	{
		const response = {
			origin: 'Shelf.incrementComponent',
			context: 'when making a component to increment a shelf counter'
		};

		try
		{
			// TODO replace this._incrementComponent by a component with a unique name
			let incrementComponent = {};
			incrementComponent.status = PsychoJS.Status.NOT_STARTED;
			return () =>
			{
				if (incrementComponent.status === PsychoJS.Status.NOT_STARTED)
				{
					incrementComponent.status = PsychoJS.Status.STARTED;
					this.increment(key, increment)
						.then( (newValue) =>
						{
							callback(newValue);
							incrementComponent.status = PsychoJS.Status.FINISHED;
						});
				}

				return (incrementComponent.status === PsychoJS.Status.FINISHED) ?
					Scheduler.Event.NEXT :
					Scheduler.Event.FLIP_REPEAT;
			};
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Increment the integer counter associated with the given key by the given amount.
	 *
	 * @name module:data.Shelf#increment
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @param {number} [increment = 1] increment
	 * @return {Promise<any>}
	 */
	async increment(key = [], increment = 1)
	{
		const response = {
			origin: 'Shelf.increment',
			context: `when incrementing the integer counter with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("increment");
			this._checkKey(key);

			// prepare the request:
			// const componentList = key.reduce((list, component) => list + '+' + component, '');
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/counter`;
			const data = {
				key,
				increment
			};

			// query the server:
			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return document['value'];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Get the name of a group, using a counterbalanced design.
	 *
	 * @name module:data.Shelf#counterBalanceSelect
	 * @function
	 * @public
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @param {string[]} groups				the names of the groups
	 * @param {number[]} groupSizes		the size of the groups
	 * @return {Promise<any>}
	 */
	async counterBalanceSelect(key = [], groups, groupSizes)
	{
		const response = {
			origin: 'Shelf.counterBalanceSelect',
			context: `when getting the name of a group, using a counterbalanced design, with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("counterBalanceSelect");
			this._checkKey(key);

			// prepare the request:
			// const componentList = key.reduce((list, component) => list + '+' + component, '');
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/counterbalance`;
			const data = {
				key,
				groups,
				groupSizes
			};

			// query the server:
			const response = await fetch(url, {
				method: 'PUT',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

			if (response.status !== 200)
			{
				throw ('error' in document) ? document['error'] : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return [ document['group'], document['finished'] ];
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Check whether it is possible to run a given shelf command.
	 *
	 * @name module:data.Shelf#_checkAvailability
	 * @function
	 * @public
	 * @param {string} [methodName=""] name of the method requiring a check
	 * @throw {Object.<string, *>} exception when it is not possible to run the given shelf command
	 */
	_checkAvailability(methodName = "")
	{
		// Shelf requires access to the server, where the key/value pairs are stored:
		if (this._psychoJS.config.environment !== ExperimentHandler.Environment.SERVER)
		{
			throw {
				origin: 'Shelf._checkAvailability',
				context: 'when checking whether Shelf is available',
				error: 'the experiment has to be run on the server: shelf commands are not available locally'
			}
		}

		// throttle calls to Shelf methods:
		const self = this;
		return new Promise((resolve, reject) =>
		{
			const now = performance.now();

			// if the last scheduled call already occurred, schedule this one as soon as possible,
			// taking into account the throttling period:
			let timeoutDuration;
			if (now > self._lastScheduledCallTimestamp)
			{
				timeoutDuration = Math.max(0.0, self._throttlingPeriod_ms - (now - self._lastCallTimestamp));
				self._lastScheduledCallTimestamp = now + timeoutDuration;
			}
			// otherwise, schedule it after the next call:
			else
			{
				self._lastScheduledCallTimestamp += self._throttlingPeriod_ms;
				timeoutDuration = self._lastScheduledCallTimestamp;
			}

			setTimeout(
				() => {
					self._lastCallTimestamp = performance.now();
					self._status = Shelf.Status.BUSY;
					resolve();
					},
				timeoutDuration
			);
		});
	}

	/**
	 * Check the validity of the key.
	 *
	 * @name module:data.Shelf#_checkKey
	 * @function
	 * @public
	 * @param {object} key key whose validity is to be checked
	 * @throw {Object.<string, *>} exception when the key is invalid
	 */
	_checkKey(key)
	{
		// the key must be a non empty array:
		if (!Array.isArray(key) || key.length === 0)
		{
			throw 'the key must be a non empty array';
		}

		if (key.length > Shelf.#MAX_KEY_LENGTH)
		{
			throw 'the key consists of too many components';
		}

		// the only @<component> in the key should be @designer and @experiment
		// TODO
	}
}


/**
 * Shelf status
 *
 * @name module:data.Shelf#Status
 * @enum {Symbol}
 * @readonly
 * @public
 */
Shelf.Status = {
	/**
	 * The shelf is ready.
	 */
	READY: Symbol.for('READY'),

	/**
	 * The shelf is busy, e.g. storing or retrieving values.
	 */
	BUSY: Symbol.for('BUSY'),

	/**
	 * The shelf has encountered an error.
	 */
	ERROR: Symbol.for('ERROR')
};
