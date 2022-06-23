/** @module core */
/**
 * Main component of the PsychoJS library.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import log4javascript from "log4javascript";
import { ExperimentHandler } from "../data/ExperimentHandler.js";
import { MonotonicClock } from "../util/Clock.js";
import { Scheduler } from "../util/Scheduler.js";
import * as util from "../util/Util.js";
import { EventManager } from "./EventManager.js";
import { GUI } from "./GUI.js";
import { Logger } from "./Logger.js";
import { ServerManager } from "./ServerManager.js";
import { Window } from "./Window.js";
import {Shelf} from "../data/Shelf";

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

	get shelf()
	{
		return this._shelf;
	}

	/**
	 * @constructor
	 * @public
	 */
	constructor({
		debug = true,
		collectIP = false,
		hosts = [],
		topLevelStatus = true,
	} = {})
	{
		// logging:
		this._logger = new Logger(this, (debug) ? log4javascript.Level.DEBUG : log4javascript.Level.INFO);
		this._captureErrors();

		// detect the browser:
		this._browser = util.detectBrowser();
		this.logger.info("[PsychoJS] Detected browser:", this._browser);

		// core clock:
		this._monotonicClock = new MonotonicClock();

		// managers:
		this._eventManager = new EventManager(this);
		this._serverManager = new ServerManager({
			psychoJS: this,
		});

		// add the pavlovia server to the list of hosts:
		const hostsWithPavlovia = new Set([...hosts, "https://pavlovia.org/run/", "https://run.pavlovia.org/"]);
		this._hosts = Array.from(hostsWithPavlovia);

		// GUI:
		this._gui = new GUI(this);

		// IP:
		this._collectIP = collectIP;

		// main scheduler:
		this._scheduler = new Scheduler(this);

		// Window:
		this._window = undefined;

		// Shelf:
		this._shelf = new Shelf({psychoJS: this});

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

		this.logger.info("[PsychoJS] Initialised.");
		this.logger.info("[PsychoJS] @version 2022.2.0");

		// hide the initialisation message:
		const root = document.getElementById("root");
		root.classList.add("is-ready");
	}

	/**
	 * Get the experiment's environment.
	 *
	 * @returns {ExperimentHandler.Environment | undefined} the environment of the experiment, or undefined
	 */
	getEnvironment()
	{
		if (typeof this._config === "undefined")
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
		gamma,
		units,
		waitBlanking,
		autoLog,
	} = {})
	{
		this.logger.info("[PsychoJS] Open Window.");

		if (typeof this._window !== "undefined")
		{
			throw {
				origin: "PsychoJS.openWindow",
				context: "when opening a Window",
				error: "A Window has already been opened.",
			};
		}

		this._window = new Window({
			psychoJS: this,
			name,
			fullscr,
			color,
			gamma,
			units,
			waitBlanking,
			autoLog,
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
		this.logger.debug("schedule task: ", task.toString().substring(0, 50), "...");

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
		this.logger.debug("schedule condition: ", condition.toString().substring(0, 50), "...");

		this._scheduler.addConditional(condition, thenScheduler, elseScheduler);
	}

	/**
	 * Start the experiment.
	 *
	 * <p>The resources are specified in the following fashion:
	 * <ul>
	 *   <li>For an experiment running locally: the root directory for the specified resources is that of index.html
	 *   unless they are prepended with a protocol, such as http:// or https://.</li>
	 *   <li>For an experiment running on the server: if no resources are specified, all files in the resources directory
	 *   of the experiment are downloaded, otherwise we only download the specified resources. All resources are assumed
	 *   local to index.html unless they are prepended with a protocol.</li>
	 *   <li>If resources is null: we do not download any resources.</li>
	 * </ul>
	 * </p>
	 *
	 * @param {Object} options
	 * @param {string} [options.configURL=config.json] - the URL of the configuration file
	 * @param {string} [options.expName=UNKNOWN] - the name of the experiment
	 * @param {Object.<string, *>} [options.expInfo] - additional information about the experiment
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @async
	 * @public
	 */
	async start({ configURL = "config.json", expName = "UNKNOWN", expInfo = {}, resources = [], dataFileName } = {})
	{
		this.logger.debug();

		const response = { origin: "PsychoJS.start", context: "when starting the experiment" };

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
					IP: "X",
					hostname: "X",
					city: "X",
					region: "X",
					country: "X",
					location: "X",
				};
			}

			// setup the experiment handler:
			this._experiment = new ExperimentHandler({
				psychoJS: this,
				extraInfo: expInfo,
				dataFileName
			});

			// setup the logger:
			// my.logger.console.setLevel(psychoJS.logging.WARNING);
			// my.logger.server.set({'level':psychoJS.logging.WARNING, 'experimentInfo': my.expInfo});

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
					event.returnValue = "";
				};
				window.addEventListener("beforeunload", this.beforeunloadCallback);

				// when the user closes the tab or browser, we attempt to close the session,
				// optionally save the results, and release the WebGL context
				// note: we communicate with the server using the Beacon API
				const self = this;
				window.addEventListener("unload", (event) =>
				{
					if (self._config.session.status === "OPEN")
					{
						// save the incomplete results if need be:
						if (self._config.experiment.saveIncompleteResults)
						{
							self._experiment.save({ sync: true });
						}

						// close the session:
						self._serverManager.closeSession(false, true);
					}

					if (typeof self._window !== "undefined")
					{
						self._window.close();
					}
				});
			}

			// start the asynchronous download of resources:
			this._serverManager.prepareResources(resources);

			// start the experiment:
			this.logger.info("[PsychoJS] Start Experiment.");
			await this._scheduler.start();
		}
		catch (error)
		{
			// this._gui.dialog({ error: { ...response, error } });
			this._gui.dialog({ error: Object.assign(response, { error }) });
		}
	}

	/**
	 * Block the experiment until the specified resources have been downloaded.
	 *
	 * <p>Note: only those resources that have not already been downloaded at that point are
	 * considered.</p>
	 *
	 * <ul>
	 *   <li>For an experiment running locally: the root directory for the specified resources is that of index.html
	 *   unless they are prepended with a protocol, such as http:// or https://.</li>
	 *   <li>For an experiment running on the server: if no resources are specified, all files in the resources directory
	 *   of the experiment are downloaded, otherwise we only download the specified resources. All resources are assumed
	 *   local to index.html unless they are prepended with a protocol.</li>
	 *
	 * @param {Array.<{name: string, path: string}>} [resources=[]] - the list of resources
	 * @public
	 */
	waitForResources(resources = [])
	{
		const response = {
			origin: "PsychoJS.waitForResources",
			context: "while waiting for resources to be downloaded",
		};

		try
		{
			return this.serverManager.waitForResources(resources);
		}
		catch (error)
		{
			// this._gui.dialog({ error: { ...response, error } });
			this._gui.dialog({ error: Object.assign(response, { error }) });
		}
	}

	/**
	 * Make the attributes of the given object those of window, such that they become global.
	 *
	 * @param {Object.<string, *>} obj the object whose attributes are to become global
	 * @public
	 */
	importAttributes(obj)
	{
		this.logger.debug("import attributes from: ", util.toString(obj));

		if (typeof obj === "undefined")
		{
			return;
		}

		for (const attribute in obj)
		{
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
	async quit({ message, isCompleted = false } = {})
	{
		this.logger.info("[PsychoJS] Quit.");

		this._experiment.experimentEnded = true;
		this._status = PsychoJS.Status.FINISHED;

		try
		{
			// stop the main scheduler:
			this._scheduler.stop();

			// remove the beforeunload listener:
			if (this.getEnvironment() === ExperimentHandler.Environment.SERVER)
			{
				window.removeEventListener("beforeunload", this.beforeunloadCallback);
			}

			// save the results and the logs of the experiment:
			this.gui.dialog({
				warning: "Closing the session. Please wait a few moments.",
				showOK: false,
			});
			if (isCompleted || this._config.experiment.saveIncompleteResults)
			{
				if (!this._serverMsg.has("__noOutput"))
				{
					await this._experiment.save();
					await this._logger.flush();
				}
			}

			// close the session:
			if (this.getEnvironment() === ExperimentHandler.Environment.SERVER)
			{
				await this._serverManager.closeSession(isCompleted);
			}

			// thank participant for waiting and either quit or redirect:
			let text = "Thank you for your patience.<br/><br/>";
			text += (typeof message !== "undefined") ? message : "Goodbye!";
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
					if (isCompleted && typeof self._completionUrl !== "undefined")
					{
						window.location = self._completionUrl;
					}
					else if (!isCompleted && typeof self._cancellationUrl !== "undefined")
					{
						window.location = self._cancellationUrl;
					}
				},
			});
		}
		catch (error)
		{
			console.error(error);
			this._gui.dialog({ error });
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
		const response = {
			origin: "PsychoJS.configure",
			context: "when configuring PsychoJS for the experiment",
		};

		try
		{
			this.status = PsychoJS.Status.CONFIGURING;

			// if the experiment is running from an approved hosts, e.e pavlovia.org,
			// we read the configuration file:
			const experimentUrl = window.location.href;
			const isHost = this._hosts.some(url => experimentUrl.indexOf(url) === 0);
			if (isHost)
			{
				const serverResponse = await this._serverManager.getConfiguration(configURL);
				this._config = serverResponse.config;

				// update the configuration for legacy experiments, which had a psychoJsManager
				// block instead of a pavlovia block, with URL pointing to https://pavlovia.org/server
				if ("psychoJsManager" in this._config)
				{
					delete this._config.psychoJsManager;
					this._config.pavlovia = {
						URL: "https://pavlovia.org",
					};
				}

				// tests for the presence of essential blocks in the configuration:
				if (!("experiment" in this._config))
				{
					throw "missing experiment block in configuration";
				}
				if (!("name" in this._config.experiment))
				{
					throw "missing name in experiment block in configuration";
				}
				if (!("fullpath" in this._config.experiment))
				{
					throw "missing fullpath in experiment block in configuration";
				}
				if (!("pavlovia" in this._config))
				{
					throw "missing pavlovia block in configuration";
				}
				if (!("URL" in this._config.pavlovia))
				{
					throw "missing URL in pavlovia block in configuration";
				}
				if (!("gitlab" in this._config))
				{
					throw "missing gitlab block in configuration";
				}
				if (!("projectId" in this._config.gitlab))
				{
					throw "missing projectId in gitlab block in configuration";
				}

				this._config.environment = ExperimentHandler.Environment.SERVER;
			}
			// otherwise we create an ad-hoc configuration:
			else
			{
				this._config = {
					environment: ExperimentHandler.Environment.LOCAL,
					experiment: {
						name,
						saveFormat: ExperimentHandler.SaveFormat.CSV,
						saveIncompleteResults: true,
						keys: [],
					},
				};
			}

			// get the server parameters (those starting with a double underscore):
			this._serverMsg = new Map();
			util.getUrlParameters().forEach((value, key) =>
			{
				if (key.indexOf("__") === 0)
				{
					this._serverMsg.set(key, value);
				}
			});

			this.status = PsychoJS.Status.CONFIGURED;
			this.logger.debug("configuration:", util.toString(this._config));
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, { error });
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
			origin: "PsychoJS._getParticipantIPInfo",
			context: "when getting the IP information of the participant",
		};

		this.logger.debug("getting the IP information of the participant");

		this._IP = {};
		try
		{
			const url = "http://www.geoplugin.net/json.gp";
			const response = await fetch(url, {
				method: "GET",
				mode: "cors",
				cache: "no-cache",
				credentials: "same-origin",
				redirect: "follow",
				referrerPolicy: "no-referrer"
			});
			if (response.status !== 200)
			{
				throw `unable to obtain the IP of the participant: ${response.statusText}`;
			}
			const geoData = await response.json();

			this._IP = {
				IP: geoData.geoplugin_request,
				country: geoData.geoplugin_countryName,
				latitude: geoData.geoplugin_latitude,
				longitude: geoData.geoplugin_longitude,
			};
			this.logger.debug("IP information of the participant: " + util.toString(this._IP));
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, { error });
		}
	}

	/**
	 * Capture all errors and display them in a pop-up error box.
	 *
	 * @protected
	 */
	_captureErrors()
	{
		this.logger.debug("capturing all errors and showing them in a pop up window");

		const self = this;
		window.onerror = function(message, source, lineno, colno, error)
		{
			console.error(error);

			document.body.setAttribute(
				"data-error",
				JSON.stringify({
					message: message,
					source: source,
					lineno: lineno,
					colno: colno,
					error: error,
				}),
			);

			self._gui.dialog({ "error": error });

			return true;
		};
		window.onunhandledrejection = function(error)
		{
			console.error(error?.reason);
			if (error?.reason?.stack === undefined)
			{
				// No stack? Error thrown by PsychoJS; stringify whole error
				document.body.setAttribute("data-error", JSON.stringify(error?.reason));
			}
			else
			{
				// Yes stack? Error thrown by JS; stringify stack
				document.body.setAttribute("data-error", JSON.stringify(error?.reason?.stack));
			}
			self._gui.dialog({ error: error?.reason });
			return true;
		};
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
	NOT_CONFIGURED: Symbol.for("NOT_CONFIGURED"),
	CONFIGURING: Symbol.for("CONFIGURING"),
	CONFIGURED: Symbol.for("CONFIGURED"),
	NOT_STARTED: Symbol.for("NOT_STARTED"),
	STARTED: Symbol.for("STARTED"),
	PAUSED: Symbol.for("PAUSED"),
	FINISHED: Symbol.for("FINISHED"),
	STOPPED: Symbol.for("FINISHED"), // Symbol.for('STOPPED')
	ERROR: Symbol.for("ERROR"),
};
