/**
 * @file Manager responsible for the communication between the experiment running in the participant's browser and the remote PsychoJS manager running on the remote https://pavlovia.org server.
 * 
 * @author Alain Pitiot
 * @version 3.0.0b11
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import { PsychoJS } from './PsychoJS';
import { PsychObject } from '../util/PsychObject';
import * as util from '../util/Util';
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
 * @param {PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class ServerManager extends PsychObject {
	
	constructor({
		psychoJS,
		autoLog = false
	} = {}) {
		super(psychoJS);

		// session:
		this._session = {};

		// resources:
		this._resourceDirectory = undefined;
		this._resourcesMap = new Map();
		this._nbResources = -1;

		// howler.js' howls:
		this._howls = undefined;

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
	getConfiguration(configURL) {
		let response = { origin: 'ServerManager.getConfiguration', context: 'when reading the configuration file: ' + configURL };

		this._psychoJS.logger.debug('reading the configuration file: ' + configURL);
		return new Promise((resolve, reject) => {
			$.get(configURL, 'json')
				.done((config, textStatus) => {
					resolve({ ...response, config });
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					reject({ ...response, error: errorThrown });
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
	openSession() {
		let response = { origin: 'ServerManager.openSession', context: 'when opening a session for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('opening a session for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);

		let self = this;
		return new Promise((resolve, reject) => {
			const data = {
				experimentFullPath: self._psychoJS.config.experiment.fullpath
			};
			$.post(this._psychoJS.config.psychoJsManager.URL + '?command=open_session', data, null, 'json')
				.done((data, textStatus) => {
					// check for error:
					if ('error' in data) {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: data.error });
					}

					// get session token:
					if ('token' in data) {
						self._psychoJS.config.experiment.token = data.token;
						self.setStatus(ServerManager.Status.READY);
						resolve({ ...response, token: data.token });
					}
					else {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: 'unexpected answer from server: no token' });
					}
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					self.setStatus(ServerManager.Status.ERROR);
					reject({ ...response, error: 'request error: ' + textStatus });
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
	 * @returns {Promise<ServerManager.CloseSessionPromise>} the response
	 */
	closeSession() {
		let response = { origin: 'ServerManager.closeSession', context: 'when closing the session for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('closing the session for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);

		let self = this;
		return new Promise((resolve, reject) => {
			const data = {
				experimentFullPath: self._psychoJS.config.experiment.fullpath,
				'token': self._psychoJS.config.experiment.token
			};
			$.post(this._psychoJS.config.psychoJsManager.URL + '?command=close_session', data, null, 'json')
				.done((data, textStatus) => {
					// check for error:
					if ('error' in data) {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: data.error });
					}

					self.setStatus(ServerManager.Status.READY);
					resolve({ ...response, data });
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					self.setStatus(ServerManager.Status.ERROR);
					reject({ ...response, error: errorThrown });
				});
		});
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
	getResource(resourceName) {
		let response = { origin: 'ServerManager.getResource', context: 'when getting the value of  resource: ' + resourceName };

		const resourceValue = this._resourcesMap.get(resourceName);
		if (typeof resourceValue === 'undefined')
			throw { ...response, error: 'unknown resource' };

		return resourceValue;
	}


	/**
	 * Set the resource manager status.
	 * 
	 * @name module:core.ServerManager#setStatus
	 * @function
	 * @public
	 */
	setStatus(status) {
		let response = { origin: 'ServerManager.setStatus', context: 'when changing the status of the server manager to: ' + util.toString(status) };

		// check status:
		const statusKey = (typeof status === 'symbol') ? Symbol.keyFor(status) : null;
		if (!statusKey)
			throw { ...response, error: 'status must be a symbol' };
		if (!ServerManager.Status.hasOwnProperty(statusKey))
			throw { ...response, error: 'unknown status' };

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
	resetStatus() {
		return this.setStatus(ServerManager.Status.READY);
	}


	/**
	 * Asynchronously download the resources of the experiment from the remote PsychoJS manager and register them with the server manager.
	 * 
	 * @name module:core.ServerManager#downloadResources
	 * @function
	 * @public
	 */
	downloadResources() {
		let response = { origin: 'ServerManager.downloadResources', context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('downloading the resources for experiment: ' + this._psychoJS.config.experiment.name);

		// we use an anonymous async function since downloadResource is non-blocking
		// but we want to run the asynchronous _listResources and _downloadResources
		// in sequence
		let self = this;
		let download = async () => {
			try {
				// list the resources and register them:
				const { resources, resourceDirectory } = await self._listResources();
				self._psychoJS.config.experiment.resourceDirectory = resourceDirectory;
				for (const resource of resources)
					self._resourcesMap.set(resource, 'undefined');
				self._nbResources = resources.length;
				self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.RESOURCES_REGISTERED, count: self._nbResources });

				// download the registered resources:
				await self._downloadRegisteredResources();
			}
			catch (error) {
				console.log('error', error);
				throw { ...response, error: error };
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
	 * @param {string} key the data key
	 * @param {*} value the data value
	 * 
	 * @returns {Promise<ServerManager.UploadDataPromise>} the response
	 */
	uploadData(key, value) {
		let response = { origin: 'ServerManager.uploadData', context: 'when uploading participant\' results for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('uploading data for experiment: ' + this._psychoJS.config.experiment.name);
		this.setStatus(ServerManager.Status.BUSY);

		let data = {
			experimentFullPath: this._psychoJS.config.experiment.fullpath,
			token: this._psychoJS.config.experiment.token,
			key,
			value
		};
		// add gitlab ID of experiment if there is one:
		const gitlabConfig = this._psychoJS.config.gitlab;
		if (typeof gitlabConfig !== 'undefined' && typeof gitlabConfig.projectId !== 'undefined')
			data.projectId = gitlabConfig.projectId;


		// (*) upload data:
		const self = this;
		return new Promise((resolve, reject) => {
			$.post(this._psychoJS.config.psychoJsManager.URL + '?command=save_data', data, null, 'json')
				.done((data, textStatus) => {
					// check for error:
					if ('error' in data) {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: data.error });
					}

					// return the response from the PsychoJS manager:
					self.setStatus(ServerManager.Status.READY);
					resolve({ ...response, data });
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					self.setStatus(ServerManager.Status.ERROR);
					reject({ ...response, error: errorThrown });
				});
		});
	}


	/**
	 * List the resources available to the experiment.

	 * @name module:core.ServerManager#_listResources
	 * @function
	 * @private
	 */
	_listResources() {
		let response = { origin: 'ServerManager._listResourcesSession', context: 'when listing the resources for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('listing the resources for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);

		const self = this;
		return new Promise((resolve, reject) => {
			$.get(self._psychoJS.config.psychoJsManager.URL, {
				'command': 'list_resources',
				'experimentFullPath': self._psychoJS.config.experiment.fullpath,
				'token': self._psychoJS.config.experiment.token
			}, null, 'json')
				.done((data, textStatus) => {
					// check for error:
					if ('error' in data)
						reject({ ...response, error: data.error });

					if (!('resources' in data)) {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: 'unexpected answer from server: no resources' });
					}
					if (!('resourceDirectory' in data)) {
						self.setStatus(ServerManager.Status.ERROR);
						reject({ ...response, error: 'unexpected answer from server: no resourceDirectory' });
					}

					self.setStatus(ServerManager.Status.READY);
					resolve({ ...response, resources: data.resources, resourceDirectory: data.resourceDirectory });
				})
				.fail((jqXHR, textStatus, errorThrown) => {
					self.setStatus(ServerManager.Status.ERROR);
					reject({ ...response, error: errorThrown });
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
	_downloadRegisteredResources() {
		let response = { origin: 'ServerManager._downloadResources', context: 'when downloading the resources for experiment: ' + this._psychoJS.config.experiment.name };

		this._psychoJS.logger.debug('downloading the registered resources for experiment: ' + this._psychoJS.config.experiment.name);

		this.setStatus(ServerManager.Status.BUSY);
		this._nbLoadedResources = 0;


		// (*) set-up preload.js:
		this._resourceQueue = new createjs.LoadQueue(true, this._psychoJS.config.experiment.resourceDirectory);

		const self = this;
		this._resourceQueue.addEventListener("filestart", event => {
			self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.DOWNLOADING_RESOURCE, resource: event.item.id });
		});

		this._resourceQueue.addEventListener("fileload", event => {
			++self._nbLoadedResources;
			self._resourcesMap.set(event.item.id, event.result);
			self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.RESOURCE_DOWNLOADED, resource: event.item.id });
		});

		// loading completed:
		this._resourceQueue.addEventListener("complete", event => {
			self._resourceQueue.close();
			if (self._nbLoadedResources == self._nbResources) {
				self.setStatus(ServerManager.Status.READY);
				self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.DOWNLOAD_COMPLETED });
			}
		});

		// error: we throw an exception
		this._resourceQueue.addEventListener("error", event => {
			self.setStatus(ServerManager.Status.ERROR);
			throw { ...response, error: 'unable to download resource: ' + event.data.id + ' (' + event.title + ')' };
		});


		// (*) dispatch resources to preload.js or howler.js based on extension:
		let manifest = [];
		let soundFilenames = [];
		for (const resourceName of this._resourcesMap.keys()) {
			const resourceExtension = resourceName.split('.').pop();

			// preload.js with forced binary for xls and xlsx:
			if (['csv', 'odp', 'xls', 'xlsx'].indexOf(resourceExtension) > -1)
				manifest.push({ id: resourceName, src: resourceName, type: createjs.Types.BINARY });

			// sound files are loaded through howler.js:
			else if (['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'mp4', 'weba', 'webm', 'dolby', 'flac'].indexOf(resourceExtension) > -1)
				soundFilenames.push(resourceName);

			// preload.js for the other extensions (download type decided by preload.js):
			else
				manifest.push({ id: resourceName, src: resourceName });
		}


		// (*) start loading non-sound resources:
		this._resourceQueue.loadManifest(manifest);


		// (*) prepare and start loading sound resources:
		for (let soundFilename of soundFilenames) {
			const resourcePath = this._psychoJS.config.experiment.resourceDirectory + soundFilename;

			self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.DOWNLOADING_RESOURCE, resource: soundFilename });

			const howl = new Howl({
				src: resourcePath,
				preload: false,
				autoplay: false
			});

			howl.on('load', (event) => {
				++self._nbLoadedResources;
				self._resourcesMap.set(soundFilename, howl);
				self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.RESOURCE_DOWNLOADED, resource: soundFilename });

				if (self._nbLoadedResources == self._nbResources) {
					self.setStatus(ServerManager.Status.READY);
					self.emit(ServerManager.Event.RESOURCE, { message: ServerManager.Event.DOWNLOAD_COMPLETED });
				}
			});
			howl.on('loaderror', (id, error) => {
				throw { ...response, error: 'unable to download resource: ' + soundFilename + ' (' + util.toString(error) + ')' };
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