/**
 * Manager responsible for the communication between the experiment running in the participant's browser and the remote PsychoJS manager running on the remote https://pavlovia.org server.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {PsychoJS} from './PsychoJS';
import {PsychObject} from '../util/PsychObject';
import * as util from '../util/Util';
import {ExperimentHandler} from "../data/ExperimentHandler";
import {MonotonicClock} from "../util/Clock";

// import { Howl } from 'howler';


/**
 * <p>This manager handles all communications between the experiment running in the participant's browser and the remote PsychoJS manager running on the [pavlovia.org]{@link http://pavlovia.org} server, <em>in an asynchronous manner</em>.</p>
 * <p>It is responsible for reading the configuration file of an experiment, for opening and closing a session, for listing and downloading resources, and for uploading results and log.</p>
 * <p>Note: The Server Manager uses [Promises]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise} to deal with asynchronicity, is mostly called by {@link PsychoJS}, and is not exposed to the experiment code.</p>
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

	constructor({
								psychoJS,
								autoLog = false
							} = {})
	{
		super(psychoJS);

		// session:
		this._session = {};

		// resources is a map of {name: string, path: string} -> data: any
		this._resources = new Map();
		this._nbResources = -1;

		this._addAttributes(ServerManager, autoLog);
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
			$.get(configURL, 'json')
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
			$.post(url, data, null, 'json')
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
				$.ajax({
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
	 * @param {string} name of the requested resource
	 * @return {Object} value of the resource
	 * @throws {Object.<string, *>} exception if no resource with that name has previously been registered
	 */
	getResource(name)
	{
		const response = {
			origin: 'ServerManager.getResource',
			context: 'when getting the value of resource: ' + name
		};

		const path_data = this._resources.get(name);
		if (typeof path_data === 'undefined')
		// throw { ...response, error: 'unknown resource' };
		{
			throw Object.assign(response, {error: 'unknown resource'});
		}

		return path_data.data;
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
	 * Asynchronously download resources for the experiment and register them with the server manager.
	 *
	 * <ul>
	 *   <li>For an experiment running locally: the root directory for the specified resources is that of index.html
	 *   unless they are prepended with a protocol, such as http:// or https://.</li>
	 *   <li>For an experiment running on the server: if no resources are specified, all files in the resources directory
	 *   of the experiment are downloaded, otherwise we only download the specified resources. All resources are assumed
	 *   local to index.html unless they are prepended with a protocol.</li>
	 * </ul>
	 *
	 * @name module:core.ServerManager#downloadResources
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @function
	 * @public
	 */
	downloadResources(resources = [])
	{
		const response = {
			origin: 'ServerManager.downloadResources',
			context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
		};

		this._psychoJS.logger.debug('downloading resources for experiment: ' + this._psychoJS.config.experiment.name);

		// we use an anonymous async function here since downloadResources is non-blocking (asynchronous)
		// but we want to run the asynchronous _listResources and _downloadResources in sequence
		const self = this;
		const newResources = new Map();
		let download = async () =>
		{
			try
			{
				if (self._psychoJS.config.environment === ExperimentHandler.Environment.SERVER)
				{
					// no resources specified, we register them all:
					if (resources.length === 0)
					{
						// list the resources from the resources directory of the experiment on the server:
						const serverResponse = await self._listResources();
						for (const name of serverResponse.resources)
						{
							self._resources.set(name, {path: serverResponse.resourceDirectory + '/' + name});
						}
					}
					else
					{
						// only registered the specified resources:
						for (const {name, path} of resources)
						{
							self._resources.set(name, {path});
							newResources.set(name, {path});
						}
					}
				}
				else
				{
					// register the specified resources:
					for (const {name, path} of resources)
					{
						self._resources.set(name, {path});
						newResources.set(name, {path});
					}
				}

				self._nbResources = self._resources.size;
				for (const name of self._resources.keys())
				{
					this._psychoJS.logger.debug('resource:', name, self._resources.get(name).path);
				}

				self.emit(ServerManager.Event.RESOURCE, {
					message: ServerManager.Event.RESOURCES_REGISTERED,
					count: self._nbResources
				});

				// download the registered resources:
				await self._downloadRegisteredResources(newResources);
			}
			catch (error)
			{
				console.log('error', error);
				// throw { ...response, error: error };
				throw Object.assign(response, {error});
			}
		};

		download();
	}


	/**
	 * @typedef ServerManager.UploadDataPromise
	 * @property {string} origin the calling method
	 * @property {string} context the context
	 * @property {Object.<string, *>} [error] an error message if we could not upload the data
	 */
	/**
	 * Asynchronously upload experiment data to the remote PsychoJS manager.
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

				$.post(url, data, null, 'json')
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
	 * Asynchronously upload experiment logs to the remote PsychoJS manager.
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

			$.post(url, data, null, 'json')
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

			$.get(url, data, null, 'json')
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
	 * Download the resources previously registered.
	 *
	 * <p>Note: we use the [preloadjs library]{@link https://www.createjs.com/preloadjs}.</p>
	 *
	 * @name module:core.ServerManager#_downloadRegisteredResources
	 * @function
	 * @private
	 */
	_downloadRegisteredResources(resources = new Map())
	{
		const response = {
			origin: 'ServerManager._downloadResources',
			context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name
		};

		this._psychoJS.logger.debug('downloading the registered resources for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);
		this._nbLoadedResources = 0;


		// (*) set-up preload.js:
		this._resourceQueue = new createjs.LoadQueue(true); //, this._psychoJS.config.experiment.resourceDirectory);

		const self = this;

		const filesToDownload = resources.size ? resources : this._resources;

		this._resourceQueue.addEventListener("filestart", event =>
		{
			self.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.DOWNLOADING_RESOURCE,
				resource: event.item.id
			});
		});

		this._resourceQueue.addEventListener("fileload", event =>
		{
			++self._nbLoadedResources;
			let path_data = self._resources.get(event.item.id);
			path_data.data = event.result;
			self.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.RESOURCE_DOWNLOADED,
				resource: event.item.id
			});
		});

		// loading completed:
		this._resourceQueue.addEventListener("complete", event =>
		{
			self._resourceQueue.close();
			if (self._nbLoadedResources === filesToDownload.size)
			{
				self.setStatus(ServerManager.Status.READY);
				self.emit(ServerManager.Event.RESOURCE, {message: ServerManager.Event.DOWNLOAD_COMPLETED});
			}
		});

		// error: we throw an exception
		this._resourceQueue.addEventListener("error", event =>
		{
			self.setStatus(ServerManager.Status.ERROR);
			const resourceId = (typeof event.data !== 'undefined') ? event.data.id : 'UNKNOWN RESOURCE';
			// throw { ...response, error: 'unable to download resource: ' + resourceId + ' (' + event.title + ')' };
			throw Object.assign(response, {error: 'unable to download resource: ' + resourceId + ' (' + event.title + ')'});
		});


		// (*) dispatch resources to preload.js or howler.js based on extension:
		let manifest = [];
		let soundResources = [];
		for (const [name, path_data] of filesToDownload)
		{
			const nameParts = name.toLowerCase().split('.');
			const extension = (nameParts.length > 1) ? nameParts.pop() : undefined;

			// warn the user if the resource does not have any extension:
			if (typeof extension === 'undefined')
			{
				this.psychoJS.logger.warn(`"${name}" does not appear to have an extension, which may negatively impact its loading. We highly recommend you add an extension.`);
			}

			// preload.js with forced binary for xls and xlsx:
			if (['csv', 'odp', 'xls', 'xlsx'].indexOf(extension) > -1)
			{
				manifest.push({id: name, src: path_data.path, type: createjs.Types.BINARY});
			}/* ascii .csv are adequately handled in binary format
			// forced text for .csv:
			else if (['csv'].indexOf(resourceExtension) > -1)
				manifest.push({ id: resourceName, src: resourceName, type: createjs.Types.TEXT });
			*/

			// sound files are loaded through howler.js:
			else if (['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'weba', 'dolby', 'flac'].indexOf(extension) > -1)
			{
				soundResources.push(name);

				if (extension === 'wav')
				{
					this.psychoJS.logger.warn(`wav files are not supported by all browsers. We recommend you convert "${name}" to another format, e.g. mp3`);
				}
			}

			// preload.js for the other extensions (download type decided by preload.js):
			else
			{
				manifest.push({id: name, src: path_data.path});
			}
		}


		// (*) start loading non-sound resources:
		if (manifest.length > 0)
		{
			this._resourceQueue.loadManifest(manifest);
		}
		else
		{
			if (this._nbLoadedResources === filesToDownload.size)
			{
				this.setStatus(ServerManager.Status.READY);
				this.emit(ServerManager.Event.RESOURCE, {message: ServerManager.Event.DOWNLOAD_COMPLETED});
			}
		}


		// (*) prepare and start loading sound resources:
		for (const name of soundResources)
		{
			self.emit(ServerManager.Event.RESOURCE, {
				message: ServerManager.Event.DOWNLOADING_RESOURCE,
				resource: name
			});
			const path_data = self._resources.get(name);
			const howl = new Howl({
				src: path_data.path,
				preload: false,
				autoplay: false
			});

			howl.on('load', (event) =>
			{
				++self._nbLoadedResources;
				path_data.data = howl;
				// self._resources.set(resource.name, howl);
				self.emit(ServerManager.Event.RESOURCE, {
					message: ServerManager.Event.RESOURCE_DOWNLOADED,
					resource: name
				});

				if (self._nbLoadedResources === filesToDownload.size)
				{
					self.setStatus(ServerManager.Status.READY);
					self.emit(ServerManager.Event.RESOURCE, {message: ServerManager.Event.DOWNLOAD_COMPLETED});
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
	 * Event: resources all registered
	 */
	RESOURCES_REGISTERED: Symbol.for('RESOURCES_REGISTERED'),
	/**
	 * Event: resource download has started
	 */
	DOWNLOADING_RESOURCE: Symbol.for('DOWNLOADING_RESOURCE'),
	/**
	 * Event: resource has been downloaded
	 */
	RESOURCE_DOWNLOADED: Symbol.for('RESOURCE_DOWNLOADED'),
	/**
	 * Event: resources all downloaded
	 */
	DOWNLOAD_COMPLETED: Symbol.for('DOWNLOAD_COMPLETED'),

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
