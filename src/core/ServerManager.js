/**
 * Manager responsible for the communication between the experiment running in the participant's browser and the pavlovia.org server.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { Howl } from 'howler';
import {PsychoJS} from './PsychoJS';
import {PsychObject} from '../util/PsychObject';
import * as util from '../util/Util';
import {ExperimentHandler} from "../data/ExperimentHandler";
import {MonotonicClock} from "../util/Clock";


/**
 * <p>This manager handles all communications between the experiment running in the participant's browser and the [pavlovia.org]{@link http://pavlovia.org} server, <em>in an asynchronous manner</em>.</p>
 * <p>It is responsible for reading the configuration file of an experiment, for opening and closing a session, for listing and downloading resources, and for uploading results, logs, and audio recordings.</p>
 *
 * @name module:core.ServerManager
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class ServerManager extends PsychObject
{
	/**
	 * Used to indicate to the ServerManager that all resources must be registered (and
	 * subsequently downloaded)
	 *
	 * @type {symbol}
	 * @readonly
	 * @public
	 */
	static ALL_RESOURCES = Symbol.for('ALL_RESOURCES');


	constructor({
								psychoJS,
								autoLog = false
							} = {})
	{
		super(psychoJS);

		// session:
		this._session = {};

		// resources is a map of <name: string, { path: string, status: ResourceStatus, data: any }>
		this._resources = new Map();

		this._addAttribute('autoLog', autoLog);
		this._addAttribute('status', ServerManager.Status.READY);
	}


	/**
	 * @typedef ServerManager.GetConfigurationPromise
	 * @property {string} origin the calling method
	 * @property {string} context the context
	 * @property {Object.<string, *>} [config] the configuration
	 * @property {Object.<string, *>} [error] an error message if we could not read the configuration file
	 */
	/**
	 * Read the configuration file for the experiment.
	 *
	 * @name module:core.ServerManager#getConfiguration
	 * @function
	 * @public
	 * @param {string} configURL - the URL of the configuration file
	 *
	 * @returns {Promise<ServerManager.GetConfigurationPromise>} the response
	 */
	getConfiguration(configURL)
	{
		const response = {
			origin: 'ServerManager.getConfiguration',
			context: 'when reading the configuration file: ' + configURL
		};

		this._psychoJS.logger.debug('reading the configuration file: ' + configURL);
		const self = this;
		return new Promise((resolve, reject) =>
		{
			jQuery.get(configURL, 'json')
				.done((config, textStatus) =>
				{
					// resolve({ ...response, config });
					resolve(Object.assign(response, {config}));
				})
				.fail((jqXHR, textStatus, errorThrown) =>
				{
					self.setStatus(ServerManager.Status.ERROR);

					const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
					console.error('error:', errorMsg);

					reject(Object.assign(response, {error: errorMsg}));
				});
		});
	}


	/**
	 * @typedef ServerManager.OpenSessionPromise
	 * @property {string} origin the calling method
	 * @property {string} context the context
	 * @property {string} [token] the session token
	 * @property {Object.<string, *>} [error] an error message if we could not open the session
	 */
	/**
	 * Open a session for this experiment on the remote PsychoJS manager.
	 *
	 * @name module:core.ServerManager#openSession
	 * @function
	 * @public
	 * @returns {Promise<ServerManager.OpenSessionPromise>} the response
	 */
	openSession()
	{
		const response = {
			origin: 'ServerManager.openSession',
			context: 'when opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.debug('opening a session for experiment: ' + this._psychoJS.config.experiment.fullpath);

		this.setStatus(ServerManager.Status.BUSY);

		// prepare POST query:
		let data = {};
		if (this._psychoJS._serverMsg.has('__pilotToken'))
		{
			data.pilotToken = this._psychoJS._serverMsg.get('__pilotToken');
		}

		// query pavlovia server:
		const self = this;
		return new Promise((resolve, reject) =>
		{
			const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) + '/sessions';
			jQuery.post(url, data, null, 'json')
				.done((data, textStatus) =>
				{
					if (!('token' in data))
					{
						self.setStatus(ServerManager.Status.ERROR);
						reject(Object.assign(response, {error: 'unexpected answer from server: no token'}));
						// reject({...response, error: 'unexpected answer from server: no token'});
					}
					if (!('experiment' in data))
					{
						self.setStatus(ServerManager.Status.ERROR);
						// reject({...response, error: 'unexpected answer from server: no experiment'});
						reject(Object.assign(response, {error: 'unexpected answer from server: no experiment'}));
					}

					self._psychoJS.config.session = {
						token: data.token,
						status: 'OPEN'
					};
					self._psychoJS.config.experiment.status = data.experiment.status2;
					self._psychoJS.config.experiment.saveFormat = Symbol.for(data.experiment.saveFormat);
					self._psychoJS.config.experiment.saveIncompleteResults = data.experiment.saveIncompleteResults;
					self._psychoJS.config.experiment.license = data.experiment.license;
					self._psychoJS.config.experiment.runMode = data.experiment.runMode;

					// secret keys for various services, e.g. Google Speech API
					if ('keys' in data.experiment)
					{
						self._psychoJS.config.experiment.keys = data.experiment.keys;
					}
					else
					{
						self._psychoJS.config.experiment.keys = [];
					}

					self.setStatus(ServerManager.Status.READY);
					// resolve({ ...response, token: data.token, status: data.status });
					resolve(Object.assign(response, {token: data.token, status: data.status}));
				})
				.fail((jqXHR, textStatus, errorThrown) =>
				{
					self.setStatus(ServerManager.Status.ERROR);

					const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
					console.error('error:', errorMsg);

					reject(Object.assign(response, {error: errorMsg}));
				});
		});
	}


	/**
	 * @typedef ServerManager.CloseSessionPromise
	 * @property {string} origin the calling method
	 * @property {string} context the context
	 * @property {Object.<string, *>} [error] an error message if we could not close the session (e.g. if it has not previously been opened)
	 */
	/**
	 * Close the session for this experiment on the remote PsychoJS manager.
	 *
	 * @name module:core.ServerManager#closeSession
	 * @function
	 * @public
	 * @param {boolean} [isCompleted= false] - whether or not the experiment was completed
	 * @param {boolean} [sync= false] - whether or not to communicate with the server in a synchronous manner
	 * @returns {Promise<ServerManager.CloseSessionPromise> | void} the response
	 */
	async closeSession(isCompleted = false, sync = false)
	{
		const response = {
			origin: 'ServerManager.closeSession',
			context: 'when closing the session for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.debug('closing the session for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);

		// prepare DELETE query:
		const url = this._psychoJS.config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) + '/sessions/' + this._psychoJS.config.session.token;

		// synchronous query the pavlovia server:
		if (sync)
		{
			/* This is now deprecated in most browsers.
			const request = new XMLHttpRequest();
			request.open("DELETE", url, false);
			request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			request.send(JSON.stringify(data));
			 */
			/* This does not work in Chrome before of a CORS bug
			await fetch(url, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json;charset=UTF-8' },
				body: JSON.stringify(data),
				// keepalive makes it possible for the request to outlive the page (e.g. when the participant closes the tab)
				keepalive: true
			});
			 */
			const formData = new FormData();
			formData.append('isCompleted', isCompleted);
			navigator.sendBeacon(url + '/delete', formData);
			this._psychoJS.config.session.status = 'CLOSED';
		}
		// asynchronously query the pavlovia server:
		else
		{
			const self = this;
			return new Promise((resolve, reject) =>
			{
				jQuery.ajax({
					url,
					type: 'delete',
					data: {isCompleted},
					dataType: 'json'
				})
					.done((data, textStatus) =>
					{
						self.setStatus(ServerManager.Status.READY);
						self._psychoJS.config.session.status = 'CLOSED';

						// resolve({ ...response, data });
						resolve(Object.assign(response, {data}));
					})
					.fail((jqXHR, textStatus, errorThrown) =>
					{
						self.setStatus(ServerManager.Status.ERROR);

						const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
						console.error('error:', errorMsg);

						reject(Object.assign(response, {error: errorMsg}));
					});
			});
		}
	}


	/**
	 * Get the value of a resource.
	 *
	 * @name module:core.ServerManager#getResource
	 * @function
	 * @public
	 * @param {string} name - name of the requested resource
	 * @param {boolean} [errorIfNotDownloaded = false] whether or not to throw an exception if the
	 * resource status is not DOWNLOADED
	 * @return {Object} value of the resource, or undefined if the resource has been registered
	 * but not downloaded yet.
	 * @throws {Object.<string, *>} exception if no resource with that name has previously been registered
	 */
	getResource(name, errorIfNotDownloaded = false)
	{
		const response = {
			origin: 'ServerManager.getResource',
			context: 'when getting the value of resource: ' + name
		};

		const pathStatusData = this._resources.get(name);

		if (typeof pathStatusData === 'undefined')
		{
			// throw { ...response, error: 'unknown resource' };
			throw Object.assign(response, {error: 'unknown resource'});
		}

		if (errorIfNotDownloaded && pathStatusData.status !== ServerManager.ResourceStatus.DOWNLOADED)
		{
			throw Object.assign(response, {
				error: name + ' is not available for use (yet), its current status is: ' +
					util.toString(pathStatusData.status)
			});
		}

		return pathStatusData.data;
	}


	/**
	 * Get the status of a resource.
	 *
	 * @name module:core.ServerManager#getResourceStatus
	 * @function
	 * @public
	 * @param {string} name of the requested resource
	 * @return {core.ServerManager.ResourceStatus} status of the resource
	 * @throws {Object.<string, *>} exception if no resource with that name has previously been registered
	 */
	getResourceStatus(name)
	{
		const response = {
			origin: 'ServerManager.getResourceStatus',
			context: 'when getting the status of resource: ' + name
		};

		const pathStatusData = this._resources.get(name);
		if (typeof pathStatusData === 'undefined')
		{
			// throw { ...response, error: 'unknown resource' };
			throw Object.assign(response, {error: 'unknown resource'});
		}

		return pathStatusData.status;
	}


	/**
	 * Set the resource manager status.
	 *
	 * @name module:core.ServerManager#setStatus
	 * @function
	 * @public
	 */
	setStatus(status)
	{
		const response = {
			origin: 'ServerManager.setStatus',
			context: 'when changing the status of the server manager to: ' + util.toString(status)
		};

		// check status:
		const statusKey = (typeof status === 'symbol') ? Symbol.keyFor(status) : null;
		if (!statusKey)
		// throw { ...response, error: 'status must be a symbol' };
		{
			throw Object.assign(response, {error: 'status must be a symbol'});
		}
		if (!ServerManager.Status.hasOwnProperty(statusKey))
		// throw { ...response, error: 'unknown status' };
		{
			throw Object.assign(response, {error: 'unknown status'});
		}

		this._status = status;

		// inform status listeners:
		this.emit(ServerManager.Event.STATUS, this._status);

		return this._status;
	}


	/**
	 * Reset the resource manager status to ServerManager.Status.READY.
	 *
	 * @name module:core.ServerManager#resetStatus
	 * @function
	 * @public
	 * @return {ServerManager.Status.READY} the new status
	 */
	resetStatus()
	{
		return this.setStatus(ServerManager.Status.READY);
	}


	/**
	 * Prepare resources for the experiment: register them with the server manager and possibly
	 * start downloading them right away.
	 *
	 * <ul>
	 *   <li>For an experiment running locally: the root directory for the specified resources is that of index.html
	 *   unless they are prepended with a protocol, such as http:// or https://.</li>
	 *   <li>For an experiment running on the server: if no resources are specified, all files in the resources directory
	 *   of the experiment are downloaded, otherwise we only download the specified resources. All resources are assumed
	 *   local to index.html unless they are prepended with a protocol.</li>
	 *   <li>If resources is null, then we do not download any resources</li>
	 * </ul>
	 *
	 * @name module:core.ServerManager#prepareResources
	 * @param {Array.<{name: string, path: string, download: boolean} | Symbol>} [resources=[]] - the list of resources
	 * @function
	 * @public
	 */
	async prepareResources(resources = [])
	{
		const response = {
			origin: 'ServerManager.prepareResources',
			context: 'when preparing resources for experiment: ' + this._psychoJS.config.experiment.name
		};

		this._psychoJS.logger.debug('preparing resources for experiment: ' + this._psychoJS.config.experiment.name);

		try
		{
			const resourcesToDownload = new Set();

			// register the resources:
			if (resources !== null)
			{
				if (!Array.isArray(resources))
				{
					throw "resources should be an array of objects";
				}

				// whether all resources have been requested:
				const allResources = (resources.length === 1 && resources[0] === ServerManager.ALL_RESOURCES);

				// if the experiment is hosted on the pavlovia.org server and
				// resources is [ServerManager.ALL_RESOURCES], then we register all the resources
				// in the "resources" sub-directory
				if (this._psychoJS.config.environment === ExperimentHandler.Environment.SERVER
					&& allResources)
				{
					// list the resources from the resources directory of the experiment on the server:
					const serverResponse = await this._listResources();

					// register and mark for download those resources that have not been
					// registered already:
					for (const name of serverResponse.resources)
					{
						if (!this._resources.has(name))
						{
							const path = serverResponse.resourceDirectory + '/' + name;
							this._resources.set(name, {
								status: ServerManager.ResourceStatus.REGISTERED,
								path,
								data: undefined
							});
							this._psychoJS.logger.debug('registered resource:', name, path);
							resourcesToDownload.add(name);
						}
					}
				}

				// if the experiment is hosted locally (localhost) or if specific resources were given
				// then we register those specific resources, if they have not been registered already
				else
				{
					// we cannot ask for all resources to be registered locally, since we cannot list
					// them:
					if (this._psychoJS.config.environment === ExperimentHandler.Environment.LOCAL
						&& allResources)
					{
						throw "resources must be manually specified when the experiment is running locally: ALL_RESOURCES cannot be used";
					}

					for (let {name, path, download} of resources)
					{
						if (!this._resources.has(name))
						{
							// to deal with potential CORS issues, we use the pavlovia.org proxy for resources
							// not hosted on pavlovia.org:
							if ((path.toLowerCase().indexOf('www.') === 0 ||
								path.toLowerCase().indexOf('http:') === 0 ||
								path.toLowerCase().indexOf('https:') === 0) &&
								(path.indexOf('pavlovia.org') === -1))
							{
								path = 'https://pavlovia.org/api/v2/proxy/' + path;
							}

							this._resources.set(name, {
								status: ServerManager.ResourceStatus.REGISTERED,
								path,
								data: undefined
							});
							this._psychoJS.logger.debug('registered resource:', name, path);

							// download resources by default:
							if (typeof download === 'undefined' || download)
							{
								resourcesToDownload.add(name);
							}
						}
					}
				}
			}

			// download those registered resources for which download = true:
			/*await*/ this._downloadResources(resourcesToDownload);
		}
		catch (error)
		{
			console.log('error', error);
			throw Object.assign(response, {error});
			// throw { ...response, error: error };
		}
	}


	/**
	 * Block the experiment until the specified resources have been downloaded.
	 *
	 * @name module:core.ServerManager#waitForResources
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @function
	 * @public
	 */
	waitForResources(resources = [])
	{
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
		};

	}


	/**
	 * @typedef ServerManager.UploadDataPromise
	 * @property {string} origin the calling method
	 * @property {string} context the context
	 * @property {Object.<string, *>} [error] an error message if we could not upload the data
	 */
	/**
	 * Asynchronously upload experiment data to the pavlovia server.
	 *
	 * @name module:core.ServerManager#uploadData
	 * @function
	 * @public
	 * @param {string} key - the data key (e.g. the name of .csv file)
	 * @param {string} value - the data value (e.g. a string containing the .csv header and records)
	 * @param {boolean} [sync= false] - whether or not to communicate with the server in a synchronous manner
	 *
	 * @returns {Promise<ServerManager.UploadDataPromise>} the response
	 */
	uploadData(key, value, sync = false)
	{
		const response = {
			origin: 'ServerManager.uploadData',
			context: 'when uploading participant\'s results for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.debug('uploading data for experiment: ' + this._psychoJS.config.experiment.fullpath);
		this.setStatus(ServerManager.Status.BUSY);

		const url = this._psychoJS.config.pavlovia.URL +
			'/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) +
			'/sessions/' + this._psychoJS.config.session.token +
			'/results';

		// synchronous query the pavlovia server:
		if (sync)
		{
			const formData = new FormData();
			formData.append('key', key);
			formData.append('value', value);
			navigator.sendBeacon(url, formData);
		}
		// asynchronously query the pavlovia server:
		else
		{
			const self = this;
			return new Promise((resolve, reject) =>
			{
				const data = {
					key,
					value
				};

				jQuery.post(url, data, null, 'json')
					.done((serverData, textStatus) =>
					{
						self.setStatus(ServerManager.Status.READY);
						resolve(Object.assign(response, {serverData}));
					})
					.fail((jqXHR, textStatus, errorThrown) =>
					{
						self.setStatus(ServerManager.Status.ERROR);

						const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
						console.error('error:', errorMsg);

						reject(Object.assign(response, {error: errorMsg}));
					});
			});
		}
	}



	/**
	 * Asynchronously upload experiment logs to the pavlovia server.
	 *
	 * @name module:core.ServerManager#uploadLog
	 * @function
	 * @public
	 * @param {string} logs - the base64 encoded, compressed, formatted logs
	 * @param {boolean} [compressed=false] - whether or not the logs are compressed
	 * @returns {Promise<ServerManager.UploadDataPromise>} the response
	 */
	uploadLog(logs, compressed = false)
	{
		const response = {
			origin: 'ServerManager.uploadLog',
			context: 'when uploading participant\'s log for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.debug('uploading server log for experiment: ' + this._psychoJS.config.experiment.fullpath);
		this.setStatus(ServerManager.Status.BUSY);

		// prepare the POST query:
		const info = this.psychoJS.experiment.extraInfo;
		const participant = ((typeof info.participant === 'string' && info.participant.length > 0) ? info.participant : 'PARTICIPANT');
		const experimentName = (typeof info.expName !== 'undefined') ? info.expName : this.psychoJS.config.experiment.name;
		const datetime = ((typeof info.date !== 'undefined') ? info.date : MonotonicClock.getDateStr());
		const filename = participant + '_' + experimentName + '_' + datetime + '.log';
		const data = {
			filename,
			logs,
			compressed
		};

		// query the pavlovia server:
		const self = this;
		return new Promise((resolve, reject) =>
		{
			const url = self._psychoJS.config.pavlovia.URL +
				'/api/v2/experiments/' + encodeURIComponent(self._psychoJS.config.experiment.fullpath) +
				'/sessions/' + self._psychoJS.config.session.token +
				'/logs';

			jQuery.post(url, data, null, 'json')
				.done((serverData, textStatus) =>
				{
					self.setStatus(ServerManager.Status.READY);
					resolve(Object.assign(response, {serverData}));
				})
				.fail((jqXHR, textStatus, errorThrown) =>
				{
					self.setStatus(ServerManager.Status.ERROR);

					const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
					console.error('error:', errorMsg);

					reject(Object.assign(response, {error: errorMsg}));
				});
		});
	}



	/**
	 * Asynchronously upload audio data to the pavlovia server.
	 *
	 * @name module:core.ServerManager#uploadAudio
	 * @function
	 * @public
	 * @param {Blob} audioBlob - the audio blob to be uploaded
	 * @param {string} tag - additional tag
	 * @returns {Promise<ServerManager.UploadDataPromise>} the response
	 */
	async uploadAudio(audioBlob, tag)
	{
		const response = {
			origin: 'ServerManager.uploadAudio',
			context: 'when uploading audio data for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		try
		{
			if (this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER ||
				this._psychoJS.config.experiment.status !== 'RUNNING' ||
				this._psychoJS._serverMsg.has('__pilotToken'))
			{
				throw 'audio recordings can only be uploaded to the server for experiments running on the server';
			}

			this._psychoJS.logger.debug('uploading audio data for experiment: ' + this._psychoJS.config.experiment.fullpath);
			this.setStatus(ServerManager.Status.BUSY);

			// prepare the request:
			const info = this.psychoJS.experiment.extraInfo;
			const participant = ((typeof info.participant === 'string' && info.participant.length > 0) ? info.participant : 'PARTICIPANT');
			const experimentName = (typeof info.expName !== 'undefined') ? info.expName : this.psychoJS.config.experiment.name;
			const datetime = ((typeof info.date !== 'undefined') ? info.date : MonotonicClock.getDateStr());
			const filename = participant + '_' + experimentName + '_' + datetime + '_' + tag;

			const formData = new FormData();
			formData.append('audio', audioBlob, filename);

			const url = this._psychoJS.config.pavlovia.URL +
				'/api/v2/experiments/' + this._psychoJS.config.gitlab.projectId +
				'/sessions/' + this._psychoJS.config.session.token +
				'/audio';

			// query the pavlovia server:
			const response = await fetch(url, {
				method: 'POST',
				mode: 'cors', // no-cors, *cors, same-origin
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'same-origin', // include, *same-origin, omit
				redirect: 'follow', // manual, *follow, error
				referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
				body: formData
			});
			const jsonResponse = await response.json();

			// deal with server errors:
			if (!response.ok)
			{
				throw jsonResponse;
			}

			this.setStatus(ServerManager.Status.READY);
			return jsonResponse;
		}
		catch (error)
		{
			this.setStatus(ServerManager.Status.ERROR);
			console.error(error);

			throw {...response, error};
		}

	}



	/**
	 * List the resources available to the experiment.

	 * @name module:core.ServerManager#_listResources
	 * @function
	 * @private
	 */
	_listResources()
	{
		const response = {
			origin: 'ServerManager._listResourcesSession',
			context: 'when listing the resources for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.debug('listing the resources for experiment: ' +
			this._psychoJS.config.experiment.fullpath);

		this.setStatus(ServerManager.Status.BUSY);

		// prepare GET data:
		const data = {
			'token': this._psychoJS.config.session.token
		};

		// query pavlovia server:
		const self = this;
		return new Promise((resolve, reject) =>
		{
			const url = this._psychoJS.config.pavlovia.URL +
				'/api/v2/experiments/' + encodeURIComponent(this._psychoJS.config.experiment.fullpath) +
				'/resources';

			jQuery.get(url, data, null, 'json')
				.done((data, textStatus) =>
				{
					if (!('resources' in data))
					{
						self.setStatus(ServerManager.Status.ERROR);
						// reject({ ...response, error: 'unexpected answer from server: no resources' });
						reject(Object.assign(response, {error: 'unexpected answer from server: no resources'}));
					}
					if (!('resourceDirectory' in data))
					{
						self.setStatus(ServerManager.Status.ERROR);
						// reject({ ...response, error: 'unexpected answer from server: no resourceDirectory' });
						reject(Object.assign(response, {error: 'unexpected answer from server: no resourceDirectory'}));
					}

					self.setStatus(ServerManager.Status.READY);
					// resolve({ ...response, resources: data.resources, resourceDirectory: data.resourceDirectory });
					resolve(Object.assign(response, {
						resources: data.resources,
						resourceDirectory: data.resourceDirectory
					}));
				})
				.fail((jqXHR, textStatus, errorThrown) =>
				{
					self.setStatus(ServerManager.Status.ERROR);

					const errorMsg = util.getRequestError(jqXHR, textStatus, errorThrown);
					console.error('error:', errorMsg);

					reject(Object.assign(response, {error: errorMsg}));
				});
		});

	}



	/**
	 * Download the specified resources.
	 *
	 * <p>Note: we use the [preloadjs library]{@link https://www.createjs.com/preloadjs}.</p>
	 *
	 * @name module:core.ServerManager#_downloadResources
	 * @function
	 * @protected
	 * @param {Set} resources - a set of names of previously registered resources
	 */
	_downloadResources(resources)
	{
		const response = {
			origin: 'ServerManager._downloadResources',
			context: 'when downloading resources for experiment: ' + this._psychoJS.config.experiment.name
		};

		this._psychoJS.logger.debug('downloading resources for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);
		this.emit(ServerManager.Event.RESOURCE, {
			message: ServerManager.Event.DOWNLOADING_RESOURCES,
			count: resources.size
		});

		this._nbLoadedResources = 0;


		// (*) set-up preload.js:
		this._resourceQueue = new createjs.LoadQueue(true, '', true);

		const self = this;

		// the loading of a specific resource has started:
		this._resourceQueue.addEventListener("filestart", event =>
		{
			const pathStatusData = self._resources.get(event.item.id);
			pathStatusData.status =  ServerManager.ResourceStatus.DOWNLOADING;

			self.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.DOWNLOADING_RESOURCE,
				resource: event.item.id
			});
		});

		// the loading of a specific resource has completed:
		this._resourceQueue.addEventListener("fileload", event =>
		{
			const pathStatusData = self._resources.get(event.item.id);
			pathStatusData.data = event.result;
			pathStatusData.status =  ServerManager.ResourceStatus.DOWNLOADED;

			++ self._nbLoadedResources;
			self.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.RESOURCE_DOWNLOADED,
				resource: event.item.id
			});
		});

		// the loading of all given resources completed:
		this._resourceQueue.addEventListener("complete", event =>
		{
			self._resourceQueue.close();
			if (self._nbLoadedResources === resources.size)
			{
				self.setStatus(ServerManager.Status.READY);
				self.emit(ServerManager.Event.RESOURCE, {
					message: ServerManager.Event.DOWNLOAD_COMPLETED
				});
			}
		});

		// error: we throw an exception
		this._resourceQueue.addEventListener("error", event =>
		{
			self.setStatus(ServerManager.Status.ERROR);
			if (typeof event.item !== 'undefined')
			{
				const pathStatusData = self._resources.get(event.item.id);
				pathStatusData.status =  ServerManager.ResourceStatus.ERROR;
				throw Object.assign(response, {
					error: 'unable to download resource: ' + event.item.id + ' (' + event.title + ')'
				});
			}
			else
			{
				console.error(event);

				if (event.title === 'FILE_LOAD_ERROR' && typeof event.data !== 'undefined')
				{
					const id = event.data.id;
					const title = event.data.src;

					throw Object.assign(response, {
						error: 'unable to download resource: ' + id + ' (' + title + ')'
					});
				}

				else
				{
					throw Object.assign(response, {
						error: 'unspecified download error'
					});
				}

			}
		});


		// (*) dispatch resources to preload.js or howler.js based on extension:
		let manifest = [];
		const soundResources = new Set();
		for (const name of resources)
		{
			const nameParts = name.toLowerCase().split('.');
			const extension = (nameParts.length > 1) ? nameParts.pop() : undefined;

			// warn the user if the resource does not have any extension:
			if (typeof extension === 'undefined')
			{
				this.psychoJS.logger.warn(`"${name}" does not appear to have an extension, which may negatively impact its loading. We highly recommend you add an extension.`);
			}

			const pathStatusData = this._resources.get(name);
			if (typeof pathStatusData === 'undefined')
			{
				throw Object.assign(response, {error: name + ' has not been previously registered'});
			}
			if (pathStatusData.status !== ServerManager.ResourceStatus.REGISTERED)
			{
				throw Object.assign(response, {error: name + ' is already downloaded or is currently already downloading'});
			}

			// preload.js with forced binary for xls and xlsx:
			if (['csv', 'odp', 'xls', 'xlsx'].indexOf(extension) > -1)
			{
				manifest.push(/*new createjs.LoadItem().set(*/{
					id: name,
					src: pathStatusData.path,
					type: createjs.Types.BINARY,
					crossOrigin: 'Anonymous'
				}/*)*/);
			}
			/* ascii .csv are adequately handled in binary format
			// forced text for .csv:
			else if (['csv'].indexOf(resourceExtension) > -1)
				manifest.push({ id: resourceName, src: resourceName, type: createjs.Types.TEXT });
			*/

			// sound files are loaded through howler.js:
			else if (['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'weba', 'dolby', 'flac'].indexOf(extension) > -1)
			{
				soundResources.add(name);

				if (extension === 'wav')
				{
					this.psychoJS.logger.warn(`wav files are not supported by all browsers. We recommend you convert "${name}" to another format, e.g. mp3`);
				}
			}

			// preload.js for the other extensions (download type decided by preload.js):
			else
			{
				manifest.push(/*new createjs.LoadItem().set(*/{
					id: name,
					src: pathStatusData.path,
					crossOrigin: 'Anonymous'
				}/*)*/);
			}
		}


		// (*) start loading non-sound resources:
		if (manifest.length > 0)
		{
			this._resourceQueue.loadManifest(manifest);
		}
		else
		{
			if (this._nbLoadedResources === resources.size)
			{
				this.setStatus(ServerManager.Status.READY);
				this.emit(ServerManager.Event.RESOURCE, {
					message: ServerManager.Event.DOWNLOAD_COMPLETED});
			}
		}


		// (*) prepare and start loading sound resources:
		for (const name of soundResources)
		{
			const pathStatusData = this._resources.get(name);
			pathStatusData.status =  ServerManager.ResourceStatus.DOWNLOADING;
			this.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.DOWNLOADING_RESOURCE,
				resource: name
			});
			const howl = new Howl({
				src: pathStatusData.path,
				preload: false,
				autoplay: false
			});

			howl.on('load', (event) =>
			{
				++ self._nbLoadedResources;
				pathStatusData.data = howl;

				pathStatusData.status =  ServerManager.ResourceStatus.DOWNLOADED;
				self.emit(ServerManager.Event.RESOURCE, {
					message: ServerManager.Event.RESOURCE_DOWNLOADED,
					resource: name
				});

				if (self._nbLoadedResources === resources.size)
				{
					self.setStatus(ServerManager.Status.READY);
					self.emit(ServerManager.Event.RESOURCE, {
						message: ServerManager.Event.DOWNLOAD_COMPLETED});
				}
			});

			howl.on('loaderror', (id, error) =>
			{
				// throw { ...response, error: 'unable to download resource: ' + name + ' (' + util.toString(error) + ')' };
				throw Object.assign(response, {error: 'unable to download resource: ' + name + ' (' + util.toString(error) + ')'});
			});

			howl.load();
		}

	}

}


/**
 * Server event
 *
 * <p>A server event is emitted by the manager to inform its listeners of either a change of status, or of a resource related event (e.g. download started, download is completed).</p>
 *
 * @name module:core.ServerManager#Event
 * @enum {Symbol}
 * @readonly
 * @public
 */
ServerManager.Event = {
	/**
	 * Event type: resource event
	 */
	RESOURCE: Symbol.for('RESOURCE'),

	/**
	 * Event: resources have started to download
	 */
	DOWNLOADING_RESOURCES: Symbol.for('DOWNLOADING_RESOURCES'),

	/**
	 * Event: a specific resource download has started
	 */
	DOWNLOADING_RESOURCE: Symbol.for('DOWNLOADING_RESOURCE'),

	/**
	 * Event: a specific resource has been downloaded
	 */
	RESOURCE_DOWNLOADED: Symbol.for('RESOURCE_DOWNLOADED'),

	/**
	 * Event: resources have all downloaded
	 */
	DOWNLOADS_COMPLETED: Symbol.for('DOWNLOAD_COMPLETED'),

	/**
	 * Event type: status event
	 */
	STATUS: Symbol.for('STATUS')
};


/**
 * Server status
 *
 * @name module:core.ServerManager#Status
 * @enum {Symbol}
 * @readonly
 * @public
 */
ServerManager.Status = {
	/**
	 * The manager is ready.
	 */
	READY: Symbol.for('READY'),

	/**
	 * The manager is busy, e.g. it is downloaded resources.
	 */
	BUSY: Symbol.for('BUSY'),

	/**
	 * The manager has encountered an error, e.g. it was unable to download a resource.
	 */
	ERROR: Symbol.for('ERROR')
};


/**
 * Resource status
 *
 * @name module:core.ServerManager#ResourceStatus
 * @enum {Symbol}
 * @readonly
 * @public
 */
ServerManager.ResourceStatus = {
	/**
	 * The resource has been registered.
	 */
	REGISTERED: Symbol.for('REGISTERED'),

	/**
	 * The resource is currently downloading.
	 */
	DOWNLOADING: Symbol.for('DOWNLOADING'),

	/**
	 * The resource has been downloaded.
	 */
	DOWNLOADED: Symbol.for('DOWNLOADED'),

	/**
	 * There was an error during downloading, or the resource is in an unknown state.
	 */
	ERROR: Symbol.for('ERROR'),
};
