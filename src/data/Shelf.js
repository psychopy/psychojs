/**
 * Shelf handles persistent key/value pairs, which are stored in the shelf collection on the
 * server, and accesses in a concurrent fashion.
 *
 * @author Alain Pitiot
 * @version 2021.1.4
 * @copyright (c) 2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import {PsychObject} from "../util/PsychObject";


/**
 * <p>Shelf handles persistent key/value pairs, which are stored in the shelf collection on the
 * server, and accesses in a concurrent fashion</p>
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

	constructor({
								psychoJS,
								autoLog = false
							} = {})
	{
		super(psychoJS);

		this._addAttribute('autoLog', autoLog);
		this._addAttribute('status', Shelf.Status.READY);
	}


	increment()
	{/*
		// prepare a PsychoJS component:
		this._waitForDownloadComponent = {
			status: PsychoJS.Status.NOT_STARTED,
			clock: new Clock(),
			resources: new Set()
		};

		const self = this;
		return () =>
		{
			const t = self._waitForDownloadComponent.clock.getTime();

			// start the component:
			if (t >= 0.0 && self._waitForDownloadComponent.status === PsychoJS.Status.NOT_STARTED)
			{
				self._waitForDownloadComponent.tStart = t;
				self._waitForDownloadComponent.status = PsychoJS.Status.STARTED;

				// if resources is an empty array, we consider all registered resources:
				if (resources.length === 0)
				{
					for (const [name, {status, path, data}] of this._resources)
					{
						resources.append({ name, path });
					}
				}

				// only download those resources not already downloaded or downloading:
				const resourcesToDownload = new Set();
				for (let {name, path} of resources)
				{
					// to deal with potential CORS issues, we use the pavlovia.org proxy for resources
					// not hosted on pavlovia.org:
					if ( (path.toLowerCase().indexOf('www.') === 0 ||
						path.toLowerCase().indexOf('http:') === 0 ||
						path.toLowerCase().indexOf('https:') === 0) &&
						(path.indexOf('pavlovia.org') === -1) )
					{
						path = 'https://devlovia.org/api/v2/proxy/' + path;
					}

					const pathStatusData = this._resources.get(name);

					// the resource has not been registered yet:
					if (typeof pathStatusData === 'undefined')
					{
						self._resources.set(name, {
							status: ServerManager.ResourceStatus.REGISTERED,
							path,
							data: undefined
						});
						self._waitForDownloadComponent.resources.add(name);
						resourcesToDownload.add(name);
						self._psychoJS.logger.debug('registered resource:', name, path);
					}

					// the resource has been registered but is not downloaded yet:
					else if (typeof pathStatusData.status !== ServerManager.ResourceStatus.DOWNLOADED)
						// else if (typeof pathStatusData.data === 'undefined')
					{
						self._waitForDownloadComponent.resources.add(name);
					}

				}

				// start the download:
				self._downloadResources(resourcesToDownload);
			}

			// check whether all resources have been downloaded:
			for (const name of self._waitForDownloadComponent.resources)
			{
				const pathStatusData = this._resources.get(name);

				// the resource has not been downloaded yet: loop this component
				if (typeof pathStatusData.status !== ServerManager.ResourceStatus.DOWNLOADED)
					// if (typeof pathStatusData.data === 'undefined')
				{
					return Scheduler.Event.FLIP_REPEAT;
				}
			}

			// all resources have been downloaded: move to the next component:
			self._waitForDownloadComponent.status = PsychoJS.Status.FINISHED;
			return Scheduler.Event.NEXT;
		};*/
	}




	/**
	 * Increment the integer counter corresponding to the given key by the given amount.
	 *
	 * @param {string[]} [key = [] ] key as an array of key components
	 * @param {number} [increment = 1] increment
	 * @return {Promise<any>}
	 */
	async _increment(key = [], increment = 1)
	{
		const response = {
			origin: 'Shelf.increment',
			context: 'when incrementing an integer counter'
		};

		try
		{
			this._status = Shelf.Status.BUSY;

			if (!Array.isArray(key) || key.length === 0)
			{
				throw 'the key must be a non empty array';
			}

			// prepare the request:
			const componentList = key.reduce((list, component) => list + '+' + component, '');
			const url = this._psychoJS.config.pavlovia.URL + '/api/v2/shelf/' + componentList;
			const data = { increment };

			// query the server:
			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors', // no-cors, *cors, same-origin
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'same-origin', // include, *same-origin, omit
				headers: {
					'Content-Type': 'application/json',
					'session-token': ''
				},
				redirect: 'follow', // manual, *follow, error
				referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
				body: JSON.stringify(data)
			});

			// convert the response to json:
			const document = await response.json();

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
