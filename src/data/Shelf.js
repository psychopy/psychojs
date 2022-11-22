/**
 * Shelf handles persistent key/value pairs, or records, which are stored in the shelf collection on the
 * server, and can be accessed and manipulated in a concurrent fashion.
 *
 * @author Alain Pitiot
 * @version 2021.2.3
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from "../util/PsychObject.js";
import {PsychoJS} from "../core/PsychoJS.js";
import {ExperimentHandler} from "./ExperimentHandler";
import {Scheduler} from "../util/Scheduler.js";


/**
 * <p>Shelf handles persistent key/value pairs, or records, which are stored in the shelf collection on the
 * server, and can be accessed and manipulated in a concurrent fashion.</p>
 *
 * @extends PsychObject
 */
export class Shelf extends PsychObject
{
	/**
	 * Maximum number of components in a key
	 * @type {number}
	 * @note this value should mirror that on the server, i.e. the server also checks that the key is valid
	 */
	static #MAX_KEY_LENGTH = 10;

	/**
	 * @memberOf module:data
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS 	the PsychoJS instance
	 * @param {boolean} [options.autoLog= false] 				whether to log
	 */
	constructor({psychoJS, autoLog = false } = {})
	{
		super(psychoJS);

		this._addAttribute('autoLog', autoLog);
		this._addAttribute('status', Shelf.Status.READY);

		// minimum period of time, in ms, before two calls to Shelf methods, i.e. throttling:
		this._throttlingPeriod_ms = 500.0;

		// timestamp of the last actual call to a Shelf method:
		this._lastCallTimestamp = 0.0;
		// timestamp of the last scheduled call to a Shelf method:
		this._lastScheduledCallTimestamp = 0.0;
	}

	/**
	 * Get the value of a record of type BOOLEAN associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					 	key as an array of key components
	 * @param {boolean} options.defaultValue		the default value returned if no record with the given key exists
	 * 	on the shelf
	 * @return {Promise<boolean>}								the value associated with the key
	 * @throws {Object.<string, *>} 						exception if there is a record associated with the given key
	 * 	but it is not of type BOOLEAN
	 */
	getBooleanValue({key, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.BOOLEAN, {defaultValue});
	}

	/**
	 * Set the value of a record of type BOOLEAN associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 	key as an array of key components
	 * @param {boolean} options.value 		the new value
	 * @return {Promise<boolean>}					the new value
	 * @throws {Object.<string, *>} 			exception if value is not a boolean, or if there is no record with the given
	 * 	key, or if there is a record but it is locked or it is not of type BOOLEAN
	 */
	setBooleanValue({key, value} = {})
	{
		// check the value:
		if (typeof value !== "boolean")
		{
			throw {
				origin: "Shelf.setIntegerValue",
				context: `when setting the value of the BOOLEAN record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be a boolean"
			};
		}

		// update the value:
		const update = {
			action: "SET",
			value
		};
		return this._updateValue(key, Shelf.Type.BOOLEAN, update);
	}

	/**
	 * Flip the value of a record of type BOOLEAN associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @return {Promise<boolean>}				the new, flipped, value
	 * @throws {Object.<string, *>} 		exception if there is no record with the given key, or
	 * 	if there is a record but it is not of type BOOLEAN
	 */
	flipBooleanValue({key} = {})
	{
		// update the value:
		const update = {
			action: "FLIP"
		};
		return this._updateValue(key, Shelf.Type.BOOLEAN, update);
	}

	/**
	 * Get the value of a record of type INTEGER associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 			key as an array of key components
	 * @param {number} options.defaultValue		the default value returned if no record with the given key
	 * 	exists on the shelf
	 * @return {Promise<number>}							the value associated with the key
	 * @throws {Object.<string, *>} 					exception if there is no record with the given key,
	 * 	or if there is a record but it is locked or it is not of type BOOLEAN
	 */
	getIntegerValue({key, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.INTEGER, {defaultValue});
	}

	/**
	 * Set the value of a record of type INTEGER associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @param {number} options.value 		the new value
	 * @return {Promise<number>} 				the new value
	 * @throws {Object.<string, *>} 		exception if value is not an integer, or or if there is no record
	 * 	with the given key, or if there is a record but it is locked or it is not of type INTEGER
	 */
	setIntegerValue({key, value} = {})
	{
		// check the value:
		if (!Number.isInteger(value))
		{
			throw {
				origin: "Shelf.setIntegerValue",
				context: `when setting the value of the INTEGER record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be an integer"
			};
		}

		// update the value:
		const update = {
			action: "SET",
			value
		};
		return this._updateValue(key, Shelf.Type.INTEGER, update);
	}

	/**
	 * Add a delta to  the value of a record of type INTEGER associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 	key as an array of key components
	 * @param {number} options.delta 		the delta, positive or negative, to add to the value
	 * @return {Promise<number>} 					the new value
	 * @throws {Object.<string, *>} 			exception if delta is not an integer, or if there is no record with the given
	 * 	key, or if there is a record but it is locked or it is not of type INTEGER
	 */
	addIntegerValue({key, delta} = {})
	{
		// check the delta:
		if (!Number.isInteger(delta))
		{
			throw {
				origin: "Shelf.setIntegerValue",
				context: `when adding a value to the value of the INTEGER record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be an integer"
			};
		}

		// update the value:
		const update = {
			action: "ADD",
			delta
		};
		return this._updateValue(key, Shelf.Type.INTEGER, update);
	}

	/**
	 * Get the value of a record of type TEXT associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					 	key as an array of key components
	 * @param {string} options.defaultValue		the default value returned if no record with the given key exists on
	 * 	the shelf
	 * @return {Promise<string>}									the value associated with the key
	 * @throws {Object.<string, *>} 						exception if there is a record associated with the given key but it is
	 * 	not of type TEXT
	 */
	getTextValue({key, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.TEXT, {defaultValue});
	}

	/**
	 * Set the value of a record of type TEXT associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 	key as an array of key components
	 * @param {string} options.value 			the new value
	 * @return {Promise<string>} 					the new value
	 * @throws {Object.<string, *>} 			exception if value is not a string, or if there is a record associated
	 * 	with the given key but it is not of type TEXT
	 */
	setTextValue({key, value} = {})
	{
		// check the value:
		if (typeof value !== "string")
		{
			throw {
				origin: "Shelf.setTextValue",
				context: `when setting the value of the TEXT record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be a string"
			};
		}

		// update the value:
		const update = {
			action: "SET",
			value
		};
		return this._updateValue(key, Shelf.Type.TEXT, update);
	}

	/**
	 * Get the value of a record of type LIST associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					 			key as an array of key components
	 * @param {Array.<*>} options.defaultValue		the default value returned if no record with the given key exists on
	 * 	the shelf
	 * @return {Promise<Array.<*>>}								the value associated with the key
	 * @throws {Object.<string, *>} 								exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type LIST
	 */
	getListValue({key, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.LIST, {defaultValue});
	}

	/**
	 * Set the value of a record of type LIST associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 		key as an array of key components
	 * @param {Array.<*>} options.value 	the new value
	 * @return {Promise<Array.<*>>}				the new value
	 * @throws {Object.<string, *>} 				exception if value is not an array or if there is no record with the given key,
	 * 	or if there is a record but it is locked or it is not of type LIST
	 */
	setListValue({key, value} = {})
	{
		// check the value:
		if (!Array.isArray(value))
		{
			throw {
				origin: "Shelf.setListValue",
				context: `when setting the value of the LIST record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be an array"
			};
		}

		// update the value:
		const update = {
			action: "SET",
			value
		};
		return this._updateValue(key, Shelf.Type.LIST, update);
	}

	/**
	 * Append an element, or a list of elements, to the value of a record of type LIST associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @param {*} options.elements 		the element or list of elements to be appended
	 * @return {Promise<Array.<*>>}		the new value
	 * @throws {Object.<string, *>} 		exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type LIST
	 */
	appendListValue({key, elements} = {})
	{
		// update the value:
		const update = {
			action: "APPEND",
			elements
		};
		return this._updateValue(key, Shelf.Type.LIST, update);
	}

	/**
	 * Pop an element, at the given index, from the value of a record of type LIST associated
	 * with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key						key as an array of key components
	 * @param {number} [options.index = -1] 	the index of the element to be popped
	 * @return {Promise<*>}											the popped element
	 * @throws {Object.<string, *>} 						exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type LIST
	 */
	popListValue({key, index = -1} = {})
	{
		// update the value:
		const update = {
			action: "POP",
			index
		};
		return this._updateValue(key, Shelf.Type.LIST, update);
	}

	/**
	 * Empty the value of a record of type LIST associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @return {Promise<Array.<*>>}		the new, empty value, i.e. []
	 * @throws {Object.<string, *>} 		exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type LIST
	 */
	clearListValue({key} = {})
	{
		// update the value:
		const update = {
			action: "CLEAR"
		};
		return this._updateValue(key, Shelf.Type.LIST, update);
	}

	/**
	 * Shuffle the elements of the value of a record of type LIST associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @return {Promise<Array.<*>>}		the new, shuffled value
	 * @throws {Object.<string, *>} 		exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type LIST
	 */
	shuffleListValue({key} = {})
	{
		// update the value:
		const update = {
			action: "SHUFFLE"
		};
		return this._updateValue(key, Shelf.Type.LIST, update);
	}


	/**
	 * Get the names of the fields in the dictionary record associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		key as an array of key components
	 * @return {Promise<string[]>}			the list of field names
	 * @throws {Object.<string, *>} 		exception if there is no record with the given key, or if there is a record
	 * 	but it is locked or it is not of type DICTIONARY
	 */
	async getDictionaryFieldNames({key} = {})
	{
		return this._getValue(key, Shelf.Type.DICTIONARY, {fieldNames: true});
	}

	/**
	 * Get the value of a given field in the dictionary record associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					 	key as an array of key components
	 * @param {string} options.fieldName				the name of the field
	 * @param {boolean} options.defaultValue		the default value returned if no record with the given key exists on
	 * 	the shelf, or if is a record of type DICTIONARY with the given key but it has no such field
	 * @return {Promise<*>}											the value of that field
	 * @throws {Object.<string, *>} 						exception if there is no record with the given key,
	 * 	or if there is a record but it is locked or it is not of type DICTIONARY
	 */
	async getDictionaryFieldValue({key, fieldName, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.DICTIONARY, {fieldName, defaultValue});
	}

	/**
	 * Set a field in the dictionary record associated to the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					key as an array of key components
	 * @param {string} options.fieldName			the name of the field
	 * @param {*} options.fieldValue					the value of the field
	 * @return {Promise<Object.<string, *>>}	the updated dictionary
	 * @throws {Object.<string, *>} 					exception if there is no record with the given key,
	 * 	or if there is a record but it is locked or it is not of type DICTIONARY
	 */
	async setDictionaryFieldValue({key, fieldName, fieldValue} = {})
	{
		// update the value:
		const update = {
			action: "FIELD_SET",
			fieldName,
			fieldValue
		};
		return this._updateValue(key, Shelf.Type.DICTIONARY, update);
	}

	/**
	 * Get the value of a record of type DICTIONARY associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key		 									key as an array of key components
	 * @param {Object.<string, *>} options.defaultValue		the default value returned if no record with the given key
	 * 	exists on the shelf
	 * @return {Promise<Object.<string, *>>}							the value associated with the key
	 * @throws {Object.<string, *>} 											exception if there is no record with the given key,
	 * 	or if there is a record but it is locked or it is not of type DICTIONARY
	 */
	getDictionaryValue({key, defaultValue} = {})
	{
		return this._getValue(key, Shelf.Type.DICTIONARY, {defaultValue});
	}

	/**
	 * Set the value of a record of type DICTIONARY associated with the given key.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key							key as an array of key components
	 * @param {Object.<string, *>} options.value 	the new value
	 * @return {Promise<Object.<string, *>>} 			the new value
	 * @throws {Object.<string, *>} 							exception if value is not an object, or or if there is no record
	 * 	with the given key, or if there is a record but it is locked or it is not of type DICTIONARY
	 */
	setDictionaryValue({key, value} = {})
	{
		// check the value:
		if (typeof value !== "object")
		{
			throw {
				origin: "Shelf.setDictionaryValue",
				context: `when setting the value of the DICTIONARY record associated with the key: ${JSON.stringify(key)}`,
				error: "the value should be an object"
			};
		}

		// update the value:
		const update = {
			action: "SET",
			value
		};
		return this._updateValue(key, Shelf.Type.DICTIONARY, update);
	}

	/**
	 * Schedulable component that will block the experiment until the counter associated with the given key
	 * has been incremented by the given amount.
	 *
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
	 * Get the name of a group, using a counterbalanced design.
	 *
	 * @param {Object} options
	 * @param {string[]} options.key					key as an array of key components
	 * @param {string[]} options.groups				the names of the groups
	 * @param {number[]} options.groupSizes		the size of the groups
	 * @return {Promise<{string, boolean}>}		an object with the name of the selected group and whether all groups
	 * 	have been depleted
	 */
	async counterBalanceSelect({key, groups, groupSizes} = {})
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
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/counterbalance`;
			const data = {
				key,
				groups,
				groupSizes
			};

			// query the server:
			const putResponse = await fetch(url, {
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
			const document = await putResponse.json();

			if (putResponse.status !== 200)
			{
				throw ('error' in document) ? document.error : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return {
				group: document.group,
				finished: document.finished
			};
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}


	/**
	 * Update the value associated with the given key.
	 *
	 * <p>This is a generic method, typically called from the Shelf helper methods, e.g. setBinaryValue.</p>
	 *
	 * @param {string[]} key					 	key as an array of key components
	 * @param {Shelf.Type} type 				the type of the record associated with the given key
	 * @param {*} update 							the desired update
	 * @return {Promise<any>}					the updated value
	 * @throws {Object.<string, *>} 	exception if there is no record associated with the given key or if there is one
	 * 	but it is not of the given type
	 */
	async _updateValue(key, type, update)
	{
		const response = {
			origin: 'Shelf._updateValue',
			context: `when updating the value of the ${Symbol.keyFor(type)} record associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("_updateValue");
			this._checkKey(key);

			// prepare the request:
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/value`;
			const data = {
				key,
				type: Symbol.keyFor(type),
				update
			};

			// query the server:
			const postResponse = await fetch(url, {
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
			const document = await postResponse.json();

			if (postResponse.status !== 200)
			{
				throw ('error' in document) ? document.error : document;
			}

			// return the updated value:
			this._status = Shelf.Status.READY;
			return document.value;
		}
		catch (error)
		{
			this._status = Shelf.Status.ERROR;
			throw {...response, error};
		}
	}

	/**
	 * Get the value associated with the given key.
	 *
	 * <p>This is a generic method, typically called from the Shelf helper methods, e.g. getBinaryValue.</p>
	 *
	 * @param {string[]} key					key as an array of key components
	 * @param {Shelf.Type} type 			the type of the record associated with the given key
	 * @param {Object} [options] 			the options, e.g. the default value returned if no record with the
	 * given key exists on the shelf
	 * @return {Promise<any>}					the value
	 * @throws {Object.<string, *>} 	exception if there is a record associated with the given key but it is not of
	 * 	the given type
	 */
	async _getValue(key, type, options)
	{
		const response = {
			origin: 'Shelf._getValue',
			context: `when getting the value of the ${Symbol.keyFor(type)} record associated with key: ${JSON.stringify(key)}`
		};

		try
		{
			await this._checkAvailability("_getValue");
			this._checkKey(key);

			// prepare the request:
			const url = `${this._psychoJS.config.pavlovia.URL}/api/v2/shelf/${this._psychoJS.config.session.token}/value`;
			const data = {
				key,
				type: Symbol.keyFor(type)
			};

			if (typeof options !== 'undefined')
			{
				for (const attribute in options)
				{
					if (typeof options[attribute] !== "undefined")
					{
						data[attribute] = options[attribute];
					}
				}
			}

			// query the server:
			const putResponse = await fetch(url, {
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

			const document = await putResponse.json();

			if (putResponse.status !== 200)
			{
				throw ('error' in document) ? document.error : document;
			}

			// return the value:
			this._status = Shelf.Status.READY;
			return document.value;
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
	 * <p>Since all Shelf methods call _checkAvailability, we also use it as a means to throttle those calls.</p>
	 *
	 * @param {string} [methodName=""] - name of the method requiring a check
	 * @throws {Object.<string, *>} exception if it is not possible to run the given shelf command
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
			};
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
	 * @param {object} key 							key whose validity is to be checked
	 * @throws {Object.<string, *>} 	exception if the key is invalid
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
 * @enum {Symbol}
 * @readonly
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

/**
 * Shelf record types.
 *
 * @enum {Symbol}
 * @readonly
 */
Shelf.Type = {
	INTEGER: Symbol.for('INTEGER'),
	TEXT: Symbol.for('TEXT'),
	DICTIONARY: Symbol.for('DICTIONARY'),
	BOOLEAN: Symbol.for('BOOLEAN'),
	LIST: Symbol.for('LIST')
};
