/**
 * Event Emitter.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import * as util from './Util';


/**
 * <p>EventEmitter implements the classic observer/observable pattern.</p>
 *
 * <p>Note: this is heavily inspired by http://www.datchley.name/es6-eventemitter/</p>
 *
 * @name module:util.EventEmitter
 * @class
 *
 * @example
 * let observable = new EventEmitter();
 * let uuid1 = observable.on('change', data => { console.log(data); });
 * observable.emit("change", { a: 1 });
 * observable.off("change", uuid1);
 * observable.emit("change", { a: 1 });
 */
export class EventEmitter
{
	constructor()
	{
		this._listeners = new Map();
		this._onceUuids = new Map();
	}


	/**
	 * Listener called when this instance emits an event for which it is registered.
	 *
	 * @callback module:util.EventEmitter~Listener
	 * @param {object} data - the data passed to the listener
	 */


	/**
	 * Register a new listener for events with the given name emitted by this instance.
	 *
	 * @name module:util.EventEmitter#on
	 * @function
	 * @public
	 * @param {String} name - the name of the event
	 * @param {module:util.EventEmitter~Listener} listener - a listener called upon emission of the event
	 * @return string - the unique identifier associated with that (event, listener) pair (useful to remove the listener)
	 */
	on(name, listener)
	{
		// check that the listener is a function:
		if (typeof listener !== 'function')
		{
			throw new TypeError('listener must be a function');
		}

		// generate a new uuid:
		let uuid = util.makeUuid();

		// add the listener to the event map:
		if (!this._listeners.has(name))
		{
			this._listeners.set(name, []);
		}
		this._listeners.get(name).push({uuid, listener});

		return uuid;
	}


	/**
	 * Register a new listener for the given event name, and remove it as soon as the event has been emitted.
	 *
	 * @name module:util.EventEmitter#once
	 * @function
	 * @public
	 * @param {String} name - the name of the event
	 * @param {module:util.EventEmitter~Listener} listener - a listener called upon emission of the event
	 * @return string - the unique identifier associated with that (event, listener) pair (useful to remove the listener)
	 */
	once(name, listener)
	{
		let uuid = this.on(name, listener);

		if (!this._onceUuids.has(name))
		{
			this._onceUuids.set(name, []);
		}
		this._onceUuids.get(name).push(uuid);

		return uuid;
	}


	/**
	 * Remove the listener with the given uuid associated to the given event name.
	 *
	 * @name module:util.EventEmitter#off
	 * @function
	 * @public
	 * @param {String} name - the name of the event
	 * @param {module:util.EventEmitter~Listener} listener - a listener called upon emission of the event
	 */
	off(name, uuid)
	{
		let relevantUuidListeners = this._listeners.get(name);

		if (relevantUuidListeners && relevantUuidListeners.length)
		{
			this._listeners.set(name, relevantUuidListeners.filter(uuidlistener => (uuidlistener.uuid != uuid)));
			return true;
		}
		return false;
	}


	/**
	 * Emit an event with a given name and associated data.
	 *
	 * @name module:util.EventEmitter#emit
	 * @function
	 * @public
	 * @param {String} name - the name of the event
	 * @param {object} data - the data of the event
	 * @return {boolean} true if at least one listener has been registered for that event, and false otherwise
	 */
	emit(name, data)
	{
		let relevantUuidListeners = this._listeners.get(name);
		if (relevantUuidListeners && relevantUuidListeners.length)
		{
			let onceUuids = this._onceUuids.get(name);
			let self = this;
			relevantUuidListeners.forEach(({uuid, listener}) =>
			{
				listener(data);

				if (typeof onceUuids !== 'undefined' && onceUuids.includes(uuid))
				{
					self.off(name, uuid);
				}
			});
			return true;
		}

		return false;
	}


}
