/** @module core */
/**
 * Main component of the PsychoJS library.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {Scheduler} from '../util/Scheduler';
import {ServerManager} from './ServerManager';
import {ExperimentHandler} from '../data/ExperimentHandler';
import {EventManager} from './EventManager';
import {Window} from './Window';
import {GUI} from './GUI';
import {MonotonicClock} from '../util/Clock';
import {Logger} from './Logger';
import * as util from '../util/Util';


/**
 * <p>PsychoJS manages the lifecycle of an experiment. It initialises the PsychoJS library and its various components (e.g. the {@link ServerManager}, the {@link EventManager}), and is used by the experiment to schedule the various tasks.</p>
 *
 * @class
 * @param {Object} options
 * @param {boolean} [options.debug= true] whether or not to log debug information in the browser console
 * @param {boolean} [options.collectIP= false] whether or not to collect the IP information of the participant
 */
export class PsychoJS
{
	/**
	 * Properties
	 */
	get status()
	{
		return this._status;
	}

	set status(status)
	{
		this._status = status;
	}

	get config()
	{
		return this._config;
	}

	get window()
	{
		return this._window;
	}

	get serverManager()
	{
		return this._serverManager;
	}

	get experiment()
	{
		return this._experiment;
	}

	get scheduler()
	{
		return this._scheduler;
	}

	get monotonicClock()
	{
		return this._monotonicClock;
	}

	get logger()
	{
		return this._logger.consoleLogger;
	}

	get experimentLogger()
	{
		return this._logger;
	}

	get eventManager()
	{
		return this._eventManager;
	}

	get gui()
	{
		return this._gui;
	}

	get IP()
	{
		return this._IP;
	}

	// this._serverMsg is a bi-directional message board for communications with the pavlovia.org server:
	get serverMsg()
	{
		return this._serverMsg;
	}

	get browser()
	{
		return this._browser;
	}


	/**
	 * @constructor
	 * @public
	 */
	constructor({
								debug = true,
								collectIP = false,
								topLevelStatus = true
							} = {})
	{
		// logging:
		this._logger = new Logger(this, (debug) ? log4javascript.Level.DEBUG : log4javascript.Level.INFO);
		this._captureErrors();

		// detect the browser:
		this._browser = util.detectBrowser();
		this.logger.info('[PsychoJS] Detected browser:', this._browser);

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

		// make the PsychoJS.Status accessible from the top level of the generated experiment script
		// in order to accommodate PsychoPy's Code Components
		if (topLevelStatus)
		{
			this._makeStatusTopLevel();
		}

		this.logger.info('[PsychoJS] Initialised.');
		this.logger.info('[PsychoJS] @version 2020.2');

		// Hide #root::after
		$('#root').addClass('is-ready');
	}


	/**
	 * Get the experiment's environment.
	 *
	 * @returns {ExperimentHandler.Environment | undefined} the environment of the experiment, or undefined
	 */
	getEnvironment()
	{
		if (typeof this._config === 'undefined')
		{
			return undefined;
		}
		return this._config.environment;
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
	 * @param {boolean} [options.autoLog] whether or not to log
	 * @param {boolean} [options.waitBlanking] whether or not to wait for all rendering operations to be done
	 * before flipping
	 * @throws {Object.<string, *>} exception if a window has already been opened
	 *
	 * @public
	 */
	openWindow({
							 name,
							 fullscr,
							 color,
							 units,
							 waitBlanking,
							 autoLog
						 } = {})
	{
		this.logger.info('[PsychoJS] Open Window.');

		if (typeof this._window !== 'undefined')
		{
			throw {
				origin: 'PsychoJS.openWindow',
				context: 'when opening a Window',
				error: 'A Window has already been opened.'
			};
		}

		this._window = new Window({
			psychoJS: this,
			name,
			fullscr,
			color,
			units,
			waitBlanking,
			autoLog
		});
	}


	/**
	 * Set the completion and cancellation URL to which the participant will be redirect at the end of the experiment.
	 *
	 * @param {string} completionUrl  - the completion URL
	 * @param {string} cancellationUrl - the cancellation URL
	 */
	setRedirectUrls(completionUrl, cancellationUrl)
	{
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
	schedule(task, args)
	{
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
	scheduleCondition(condition, thenScheduler, elseScheduler)
	{
		this.logger.debug('schedule condition: ', condition.toString().substring(0, 50), '...');

		this._scheduler.addConditional(condition, thenScheduler, elseScheduler);
	}


	/**
	 * Start the experiment.
	 *
	 * @param {Object} options
	 * @param {string} [options.configURL=config.json] - the URL of the configuration file
	 * @param {string} [options.expName=UNKNOWN] - the name of the experiment
	 * @param {Object.<string, *>} [options.expInfo] - additional information about the experiment
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @async
	 * @public
	 *
	 * @todo: close session on window or tab close
	 */
	async start({configURL = 'config.json', expName = 'UNKNOWN', expInfo = {}, resources = []} = {})
	{
		this.logger.debug();

		const response = {origin: 'PsychoJS.start', context: 'when starting the experiment'};

		try
		{
			// configure the experiment:
			await this._configure(configURL, expName);

			// get the participant IP:
			if (this._collectIP)
			{
				this._getParticipantIPInfo();
			}
			else
			{
				this._IP = {
					IP: 'X',
					hostname: 'X',
					city: 'X',
					region: 'X',
					country: 'X',
					location: 'X'
				};
			}

			// setup the experiment handler:
			this._experiment = new ExperimentHandler({
				psychoJS: this,
				extraInfo: expInfo
			});

			// setup the logger:
			//my.logger.console.setLevel(psychoJS.logging.WARNING);
			//my.logger.server.set({'level':psychoJS.logging.WARNING, 'experimentInfo': my.expInfo});

			// if the experiment is running on the server:
			if (this.getEnvironment() === ExperimentHandler.Environment.SERVER)
			{
				// open a session:
				await this._serverManager.openSession();

				// warn the user when they attempt to close the tab or browser:
				this.beforeunloadCallback = (event) =>
				{
					// preventDefault should ensure that the user gets prompted:
					event.preventDefault();

					// Chrome requires returnValue to be set:
					event.returnValue = '';
				};
				window.addEventListener('beforeunload', this.beforeunloadCallback);


				// when the user closes the tab or browser, we attempt to close the session, optionally save the results,
				// and release the WebGL context
				// note: we communicate with the server using the Beacon API
				const self = this;
				window.addEventListener('unload', (event) =>
				{
					if (self._config.session.status === 'OPEN')
					{
						// save the incomplete results if need be:
						if (self._config.experiment.saveIncompleteResults)
						{
							self._experiment.save({sync: true});
						}

						// close the session:
						self._serverManager.closeSession(false, true);
					}

					if (typeof self._window !== 'undefined')
					{
						self._window.close();
					}
				});

			}


			// start the asynchronous download of resources:
			this._serverManager.downloadResources(resources);

			// start the experiment:
			this.logger.info('[PsychoJS] Start Experiment.');
			this._scheduler.start();
		}
		catch (error)
		{
			// this._gui.dialog({ error: { ...response, error } });
			this._gui.dialog({error: Object.assign(response, {error})});
		}
	}


	/**
	 * Synchronously download resources for the experiment.
	 *
	 * <ul>
	 *   <li>For an experiment running locally: the root directory for the specified resources is that of index.html
	 *   unless they are prepended with a protocol, such as http:// or https://.</li>
	 *   <li>For an experiment running on the server: if no resources are specified, all files in the resources directory
	 *   of the experiment are downloaded, otherwise we only download the specified resources. All resources are assumed
	 *   local to index.html unless they are prepended with a protocol.</li>
	 *
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @async
	 * @public
	 */
	async downloadResources(resources = [])
	{
		try
		{
			await this.serverManager.downloadResources(resources);
		}
		catch (error)
		{
			// this._gui.dialog({ error: { ...response, error } });
			this._gui.dialog({error: Object.assign(response, {error})});
		}
	}


	/**
	 * Make the attributes of the given object those of PsychoJS and those of
	 * the top level variable (e.g. window) as well.
	 *
	 * @param {Object.<string, *>} obj the object whose attributes we will mirror
	 * @public
	 */
	importAttributes(obj)
	{
		this.logger.debug('import attributes from: ', util.toString(obj));

		if (typeof obj === 'undefined')
		{
			return;
		}

		for (const attribute in obj)
		{
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
	async quit({message, isCompleted = false} = {})
	{
		this.logger.info('[PsychoJS] Quit.');

		this._experiment.experimentEnded = true;
		this._status = PsychoJS.Status.FINISHED;

		try
		{
			// stop the main scheduler:
			this._scheduler.stop();

			// remove the beforeunload listener:
			if (this.getEnvironment() === ExperimentHandler.Environment.SERVER)
			{
				window.removeEventListener('beforeunload', this.beforeunloadCallback);
			}

			// save the results and the logs of the experiment:
			this.gui.dialog({
				warning: 'Closing the session. Please wait a few moments.',
				showOK: false
			});
			if (isCompleted || this._config.experiment.saveIncompleteResults)
			{
				await this._experiment.save();
				await this._logger.flush();
			}

			// close the session:
			if (this.getEnvironment() === ExperimentHandler.Environment.SERVER)
			{
				await this._serverManager.closeSession(isCompleted);
			}

			// thank participant for waiting and either quit or redirect:
			let text = 'Thank you for your patience.<br/><br/>';
			text += (typeof message !== 'undefined') ? message : 'Goodbye!';
			const self = this;
			this._gui.dialog({
				message: text,
				onOK: () =>
				{
					// close the window:
					self._window.close();

					// remove everything from the browser window:
					while (document.body.hasChildNodes())
					{
						document.body.removeChild(document.body.lastChild);
					}

					// return from fullscreen if we were there:
					this._window.closeFullScreen();

					// redirect if redirection URLs have been provided:
					if (isCompleted && typeof self._completionUrl !== 'undefined')
					{
						window.location = self._completionUrl;
					}
					else if (!isCompleted && typeof self._cancellationUrl !== 'undefined')
					{
						window.location = self._cancellationUrl;
					}
				}
			});

		}
		catch (error)
		{
			console.error(error);
			this._gui.dialog({error});
		}
	}


	/**
	 * Configure PsychoJS for the running experiment.
	 *
	 * @async
	 * @protected
	 * @param {string} configURL - the URL of the configuration file
	 * @param {string} name - the name of the experiment
	 */
	async _configure(configURL, name)
	{
		const response = {origin: 'PsychoJS.configure', context: 'when configuring PsychoJS for the experiment'};

		try
		{
			this.status = PsychoJS.Status.CONFIGURING;

			// if the experiment is running from the pavlovia.org server, we read the configuration file:
			const experimentUrl = window.location.href;
			if (experimentUrl.indexOf('https://run.pavlovia.org/') === 0 || experimentUrl.indexOf('https://pavlovia.org/run/') === 0)
			{
				const serverResponse = await this._serverManager.getConfiguration(configURL);
				this._config = serverResponse.config;

				// legacy experiments had a psychoJsManager block instead of a pavlovia block, and the URL
				// pointed to https://pavlovia.org/server
				if ('psychoJsManager' in this._config)
				{
					delete this._config.psychoJsManager;
					this._config.pavlovia = {
						URL: 'https://pavlovia.org'
					};
				}

				// tests for the presence of essential blocks in the configuration:
				if (!('experiment' in this._config))
				{
					throw 'missing experiment block in configuration';
				}
				if (!('name' in this._config.experiment))
				{
					throw 'missing name in experiment block in configuration';
				}
				if (!('fullpath' in this._config.experiment))
				{
					throw 'missing fullpath in experiment block in configuration';
				}
				if (!('pavlovia' in this._config))
				{
					throw 'missing pavlovia block in configuration';
				}
				if (!('URL' in this._config.pavlovia))
				{
					throw 'missing URL in pavlovia block in configuration';
				}

				this._config.environment = ExperimentHandler.Environment.SERVER;

			}
			else
			// otherwise we create an ad-hoc configuration:
			{
				this._config = {
					environment: ExperimentHandler.Environment.LOCAL,
					experiment: {
						name,
						saveFormat: ExperimentHandler.SaveFormat.CSV,
						saveIncompleteResults: true
					}
				};
			}

			// get the server parameters (those starting with a double underscore):
			this._serverMsg = new Map();
			util.getUrlParameters().forEach((value, key) =>
			{
				if (key.indexOf('__') === 0)
				{
					this._serverMsg.set(key, value);
				}
			});


			this.status = PsychoJS.Status.CONFIGURED;
			this.logger.debug('configuration:', util.toString(this._config));
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Get the IP information of the participant, asynchronously.
	 *
	 * <p>Note: we use [http://www.geoplugin.net/json.gp]{@link http://www.geoplugin.net/json.gp}.</p>
	 * @protected
	 */
	async _getParticipantIPInfo()
	{
		const response = {
			origin: 'PsychoJS._getParticipantIPInfo',
			context: 'when getting the IP information of the participant'
		};

		this.logger.debug('getting the IP information of the participant');

		this._IP = {};
		try
		{
			const geoResponse = await $.get('http://www.geoplugin.net/json.gp');
			const geoData = JSON.parse(geoResponse);
			this._IP = {
				IP: geoData.geoplugin_request,
				country: geoData.geoplugin_countryName,
				latitude: geoData.geoplugin_latitude,
				longitude: geoData.geoplugin_longitude
			};
			this.logger.debug('IP information of the participant: ' + util.toString(this._IP));
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Capture all errors and display them in a pop-up error box.
	 *
	 * @protected
	 */
	_captureErrors()
	{
		this.logger.debug('capturing all errors using window.onerror');

		const self = this;
		window.onerror = function (message, source, lineno, colno, error)
		{
			console.error(error);
			self._gui.dialog({"error": error});
			return true;
		};

		/* NOT UNIVERSALLY SUPPORTED YET
		window.addEventListener('unhandledrejection', event => {
			console.error(error);
			self._gui.dialog({"error" : error});
			return true;
		});*/

	}


	/**
	 * Make the various Status top level, in order to accommodate PsychoPy's Code Components.
	 * @private
	 */
	_makeStatusTopLevel()
	{
		for (const status in PsychoJS.Status)
		{
			window[status] = PsychoJS.Status[status];
		}
	}

}


/**
 * PsychoJS status.
 *
 * @enum {Symbol}
 * @readonly
 * @public
 *
 * @note PsychoPy is currently moving away from STOPPED and replacing STOPPED by FINISHED.
 * For backward compatibility reasons, we are keeping
 * STOPPED in PsychoJS, but the Symbol is the same as that of FINISHED.
 */
PsychoJS.Status = {
	NOT_CONFIGURED: Symbol.for('NOT_CONFIGURED'),
	CONFIGURING: Symbol.for('CONFIGURING'),
	CONFIGURED: Symbol.for('CONFIGURED'),
	NOT_STARTED: Symbol.for('NOT_STARTED'),
	STARTED: Symbol.for('STARTED'),
	FINISHED: Symbol.for('FINISHED'),

	STOPPED: Symbol.for('FINISHED') //Symbol.for('STOPPED')
};

