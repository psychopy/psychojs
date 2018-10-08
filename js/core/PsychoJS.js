/** @module core */
/**
 * @file Main component of the PsychoJS library.
 *
 * @author Alain Pitiot
 * @version 3.0.0b10
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License.
 */


import { Scheduler } from '../util/Scheduler';
import { ServerManager } from './ServerManager';
import { ExperimentHandler } from '../data/ExperimentHandler';
import { EventManager } from './EventManager';
import { Window } from './Window';
import { GUI } from './GUI';
import { MonotonicClock } from '../util/Clock';
import { Logger } from '../util/Logger';
import * as util from '../util/Util';


/**
 * <p>PsychoJS manages the lifecycle of an experiment. It initialises the PsychoJS library and its various components (e.g. the {@link ServerManager}, the {@link EventManager}), and is used by the experiment to schedule the various tasks.</p>
 * 
 * @class
 * @param {Object} options
 * @param {boolean} [options.debug= true] whether or not to log debug information in the browser console
 * @param {boolean} [options.collectIP= false] whether or not to collect the IP information of the participant
 */
export class PsychoJS {
	/**
	 * Properties
	 */
	get status() { return this._status; }
	set status(sts) {
		this._status = sts;
	}
	get config() { return this._config; }
	get window() { return this._window; }
	get serverManager() { return this._serverManager; }
	get experiment() { return this._experiment; }
	get scheduler() { return this._scheduler; }
	get monotonicClock() { return this._monotonicClock; }
	get logger() { return this._logger.consoleLogger; }
	get eventManager() { return this._eventManager; }
	get gui() { return this._gui; }
	get IP() { return this._IP; }


	/**
	 * @constructor
	 * @public
	 */
	constructor({
		debug = true,
		collectIP = false
	} = {}) {
		// logging:
		this._logger = new Logger((debug) ? log4javascript.Level.DEBUG : log4javascript.Level.INFO);
		this._captureErrors();

		// core clock:
		this._monotonicClock = new MonotonicClock();

		// managers:
		this._eventManager = new EventManager(this);
		this._serverManager = new ServerManager({
			psychoJS: this
		});

		// GUI:
		this._gui = new GUI(this);

		// IP:
		this._collectIP = collectIP;

		// main scheduler:
		this._scheduler = new Scheduler(this);

		// Window:
		this._window = undefined;

		// redirection URLs:
		this._cancellationUrl = undefined;
		this._completionUrl = undefined;


		// status:
		this._status = PsychoJS.Status.NOT_CONFIGURED;

		this.logger.info('[PsychoJS] Initialised.');
	}


	/**
	 * Open a PsychoJS Window.
	 * 
	 * <p>This opens a PIXI canvas.</p>
	 * <p>Note: we can only open one window.</p>
	 * 
	 * @param {Object} options
	 * @param {string} [options.name] the name of the window
	 * @param {boolean} [options.fullscr] whether or not to go fullscreen
	 * @param {Color} [options.color] the background color of the window
	 * @param {string} [options.units] the units of the window
	 * @param {boolean} [options.autoLog] whether of not to log
	 * @throws {Object.<string, *>} exception if a window has already been opened
	 * 
	 * @public
	 */
	openWindow({
		name,
		fullscr,
		color,
		units,
		autoLog
	} = {}) {
		this.logger.info('[PsychoJS] Open Window.');

		if (typeof this._window !== 'undefined')
			throw { origin : 'PsychoJS.openWindow', context : 'when opening a Window', error : 'A Window has already been opened.' };

		this._window = new Window({
			psychoJS: this,
			name,
			fullscr,
			color,
			units,
			autoLog
		});
	}

	/**
	 * Set the completion and cancellation URL to which the participant will be redirect at the end of the experiment.
	 * 
	 * @param {string} completionUrl  - the completion URL
	 * @param {string} cancellationUrl - the cancellation URL
	 */
	setRedirectUrls(completionUrl, cancellationUrl) {
		this._completionUrl = completionUrl;
		this._cancellationUrl = cancellationUrl;
	}

	/**
	 * Schedule a task.
	 * 
	 * @param task - the task to be scheduled
	 * @param args - arguments for that task
	 * @public
	 */
	schedule(task, args) {
		this.logger.debug('schedule task: ', task.toString().substring(0, 50), '...');

		this._scheduler.add(task, args);
	}


	/**
	 * @callback PsychoJS.condition
	 * @return {boolean} true if the thenScheduler is to be run, false if the elseScheduler is to be run
	 */
	/**
	 * Schedule a series of task based on a condition.
	 * 
	 * @param {PsychoJS.condition} condition 
	 * @param {Scheduler} thenScheduler scheduler to run if the condition is true
	 * @param {Scheduler} elseScheduler scheduler to run if the condition is false
	 * @public
	 */
	scheduleCondition(condition, thenScheduler, elseScheduler) {
		this.logger.debug('schedule condition: ', condition.toString().substring(0, 50), '...');

		this._scheduler.addConditional(condition, thenScheduler, elseScheduler);
	}


	/**
	 * Start the experiment.
	 * 
	 * @param {Object} options
	 * @param {string} [options.configURL=config.json] - the URL of the configuration file
	 * @param {Object.<string, *>} [options.expInfo] - additional information about the experiment
	 * @async
	 * @public
	 */
	async start({ configURL = 'config.json', expInfo } = {}) {
		this.logger.debug();

		let response = { origin: 'PsychoJS.start', context: 'when starting the experiment' };

		try {
			// configure the experiment:
			await this._configure(configURL);

			// get the participant IP:
			if (this._collectIP) {
				// get IP info of participant
				// note: since we make a GET call to http://ipinfo.io to get the IP info,
				// it will not be immediately available.
				this._getParticipantIPInfo();
			} else {
				this._IP = {};
				this._IP['IP'] = 'X';
				this._IP['hostname'] = 'X';
				this._IP['city'] = 'X';
				this._IP['region'] = 'X';
				this._IP['country'] = 'X';
				this._IP['location'] = 'X';
			}

			// setup the experiment handler:
			this._experiment = new ExperimentHandler({
				psychoJS: this,
				extraInfo: expInfo
			});

			// setup the logger:
			//my.logger.console.setLevel(psychoJS.logging.WARNING);
			//my.logger.server.set({'level':psychoJS.logging.WARNING, 'saveTo':'EXPERIMENT_SERVER', 'experimentInfo': my.expInfo});

			// open a new session:
			await this._serverManager.openSession();

			// start the asynchronous download of resources:
			this._serverManager.downloadResources();

			// start the experiment:
			this.logger.info('[PsychoJS] Start Experiment.');
			this._scheduler.start();
		}
		catch (error) {
			this._gui.dialog({ error: { ...response, error } });
		}
	}


	/**
	 * Make the attributes of the given object those of PsychoJS and those of
	 * the top level variable (e.g. window) as well.
	 * 
	 * @param {Object.<string, *>} obj the object whose attributes we will mirror
	 * @public
	 */
	importAttributes(obj) {
		this.logger.debug('import attributes from: ', util.toString(obj));

		if (typeof obj === 'undefined')
			return;

		for (const attribute in obj) {
			// this[attribute] = obj[attribute];
			window[attribute] = obj[attribute];
		}
	}


	/**
	 * Close everything and exit nicely at the end of the experiment,
	 * potentially redirecting to one of the URLs previously specified by setRedirectUrls.
	 * 
	 * <p>Note: if the resource manager is busy, we inform the participant
	 * that he or she needs to wait for a bit.</p>
	 * 
	 * @param {Object} options
	 * @param {string} [options.message] - optional message to be displayed in a dialog box before quitting
	 * @param {boolean} [options.isCompleted = false] - whether or not the participant has completed the experiment
	 * @async
	 * @public
	 */
	async quit({ message, isCompleted = false } = {}) {
		this.logger.info('[PsychoJS] Quit.');

		try {
			// save the results and the logs of the experiment:
			this.gui.dialog({ warning: 'Saving the experiment results and closing the session. Please wait a few moments.', showOK: false });
			await this._experiment.save();

			// close the session:
			await this._serverManager.closeSession();

			// stop the main scheduler:
			this._scheduler.stop();

			// thank participant for waiting and quit or redirect:
			let text = 'Thank you for your patience. The data have been saved.<br/><br/>';
			text += (typeof message !== 'undefined') ? message : 'Goodbye!';
			const self = this;
			this._gui.dialog({
				message: text, onOK: () => {
					// close the window:
					self._window.close();

					// destroy dialog boxes:
					self._gui.destroyDialog();

					// remove everything from the browser window:
					while (document.body.hasChildNodes())
						document.body.removeChild(document.body.lastChild);

					// redirect if redirection URLs have been provided:
					if (isCompleted && typeof self._completionUrl !== 'undefined')
						window.location = self._completionUrl;
					else if (!isCompleted && typeof self._cancellationUrl !== 'undefined')
						window.location = self._cancellationUrl;
				}
			});

		}
		catch (error) {
			console.error(error);
			this._gui.dialog({ "error": error });
		}
	}


	/**
	 * Configure PsychoJS for the running experiment.
	 * 
	 * @async
	 * @protected
	 * @param {string} configURL - the URL of the configuration file
	 */
	async _configure(configURL) {
		let response = { origin: 'PsychoJS.configure', context: 'when configuring PsychoJS for the experiment' };

		try {
			this.status = PsychoJS.Status.CONFIGURING;
			const response = await this._serverManager.getConfiguration(configURL);
			this.status = PsychoJS.Status.CONFIGURED;
			this._config = response.config;

			this.logger.debug('configuration:', util.toString(response.config));

			// tests for the presence of essential blocks in the configuration:
			if (!('experiment' in this._config))
				throw 'missing experiment block in configuration';
			if (!('name' in this._config.experiment))
				throw 'missing name in experiment block in configuration';
			if (!('fullpath' in this._config.experiment))
				throw 'missing fullpath in experiment block in configuration';
			if (!('psychoJsManager' in this._config))
				throw 'missing psychoJsManager block in configuration';
			if (!('URL' in this._config.psychoJsManager))
				throw 'missing URL in psychoJsManager block in configuration';

			return response;
		}
		catch (error) {
			throw { ...response, error };
		}
	}


	/**
	 * Get the IP information of the participant, asynchronously.
	 *
	 * <p>Note: we use [http://www.geoplugin.net/json.gp]{@link http://www.geoplugin.net/json.gp}.</p>
	 * @protected
	 */
	async _getParticipantIPInfo() {
		let response = { origin: 'PsychoJS._getParticipantIPInfo', context: 'when get the IP information of the participant' };

		this.logger.debug('getting the IP information of the participant');

		this._IP = {};

		let self = this;
		try {
			const geoResponse = await $.get('http://www.geoplugin.net/json.gp');
			const geoData = JSON.parse(geoResponse);
			self._IP['IP'] = geoData.geoplugin_request;
			self._IP['country'] = geoData.geoplugin_countryName;
			self._IP['latitude'] = geoData.geoplugin_latitude;
			self._IP['longitude'] = geoData.geoplugin_longitude;
			self.logger.debug('IP information of the participant: ' + util.toString(self._IP));
		}
		catch (error) {
			throw { ...response, error };
		}
	}


	/**
	 * Capture all errors and display them in a pop-up error box.
	 * 
	 * @protected
	 */
	_captureErrors() {
		this.logger.debug('capturing all errors using window.onerror');

		const self = this;
		window.onerror = function (message, source, lineno, colno, error) {
			console.error(error);
			self._gui.dialog({ "error": error });
			return true;
		}

		/* NOT UNIVERSALLY SUPPORTED YET
		window.addEventListener('unhandledrejection', event => {
			console.error(error);
			self._gui.dialog({"error" : error});
			return true;
		});*/

	}

}

/**
 * PsychoJS status
 * 
 * @enum {Symbol}
 * @readonly
 * @public
 */
PsychoJS.Status = {
	NOT_CONFIGURED: Symbol.for('NOT_CONFIGURED'),
	CONFIGURING: Symbol.for('CONFIGURING'),
	CONFIGURED: Symbol.for('CONFIGURED'),
	NOT_STARTED: Symbol.for('NOT_STARTED'),
	STARTED: Symbol.for('STARTED'),
	STOPPED: Symbol.for('STOPPED'),
	FINISHED: Symbol.for('FINISHED')
};

