/**
 * Logger
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import log4javascript from "log4javascript";
import pako from "pako";
import { ExperimentHandler } from "../data/ExperimentHandler.js";
import { MonotonicClock } from "../util/Clock.js";
import * as util from "../util/Util.js";

/**
 * <p>This class handles a variety of loggers, e.g. a browser console one (mostly for debugging),
 * a remote one, etc.</p>
 *
 * <p>Note: we use log4javascript for the console logger, and our own for the server logger.</p>
 */
export class Logger
{
	/**
	 * @memberof module:core
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 * @param {*} threshold - the logging threshold, e.g. log4javascript.Level.ERROR
	 */
	constructor(psychoJS, threshold)
	{
		this._psychoJS = psychoJS;

		// browser console logger:
		this.consoleLogger = log4javascript.getLogger("psychojs");

		const appender = new log4javascript.BrowserConsoleAppender();
		appender.setLayout(this._customConsoleLayout());
		appender.setThreshold(threshold);

		this.consoleLogger.addAppender(appender);
		this.consoleLogger.setLevel(threshold);

		// server logger:
		this._serverLogs = [];
		this._serverLevel = Logger.ServerLevel.WARNING;
		this._serverLevelValue = this._getValue(this._serverLevel);

		// throttling of server logs
		this._throttling = {
			// period of time (in seconds) over which we consider the number of logged messages:
			window: 1,
			// threshold (i.e. number of messages over the throttling window) at which point
			// we start throttling:
			threshold: 20,
			// throttling factor: 10 -> only 1 in 10 messages is logged
			factor: 10,
			// minimum duration (in seconds) of throttling
			minimumDuration: 2,
			// time at which throttling started:
			startOfThrottling: 0,
			// whether or not we are currently throttling:
			isThrottling: false,
			// throttling message index:
			index: 0,
			// whether or not the designer has already been warned:
			designerWasWarned: false,
		};
	}

	/**
	 * Change the logging level.
	 *
	 * @param {module:core.Logger.ServerLevel} serverLevel - the new logging level
	 */
	setLevel(serverLevel)
	{
		this._serverLevel = serverLevel;
		this._serverLevelValue = this._getValue(this._serverLevel);
	}

	/**
	 * Log a server message at the EXP level.
	 *
	 * @param {string} msg - the message to be logged.
	 * @param {number} [time] - the logging time
	 * @param {object} [obj] - the associated object (e.g. a Trial)
	 */
	exp(msg, time, obj)
	{
		this.log(msg, Logger.ServerLevel.EXP, time, obj);
	}

	/**
	 * Log a server message at the DATA level.
	 *
	 * @param {string} msg - the message to be logged.
	 * @param {number} [time] - the logging time
	 * @param {object} [obj] - the associated object (e.g. a Trial)
	 */
	data(msg, time, obj)
	{
		this.log(msg, Logger.ServerLevel.DATA, time, obj);
	}

	/**
	 * Log a server message.
	 *
	 * @param {string} msg - the message to be logged.
	 * @param {module:core.Logger.ServerLevel} level - logging level
	 * @param {number} [time] - the logging time
	 * @param {object} [obj] - the associated object (e.g. a Trial)
	 */
	log(msg, level, time, obj)
	{
		// only log if the level is higher or equal to the previously defined server level:
		const levelValue = this._getValue(level);
		if (levelValue < this._serverLevelValue)
		{
			return;
		}

		if (typeof time === "undefined")
		{
			time = MonotonicClock.getReferenceTime();
		}

		/* [coming soon]
		// check whether we need to throttle:
		if (this._throttle(time))
		{
			return;
		}
	 */

		this._serverLogs.push({
			msg,
			level,
			time,
			obj: util.toString(obj),
		});
	}

	/**
	 * Check whether or not a log messages must be throttled.
	 *
	 * @protected
	 * @param {number} time - the time of the latest log message
	 * @return {boolean} whether or not to log the message
	 */
	_throttle(time)
	{
		// if more messages than this._throttling.threshold have been logged between
		// time and the start of the throttling window, we need to throttle:
		if (this._serverLogs.length > this._throttling.threshold)
		{
			const timeAtStartThrottlingWindow = this._serverLogs[this._serverLogs.length - 1 - this._throttling.threshold].time;
			if (time - timeAtStartThrottlingWindow < this._throttling.window)
			{
				// warn the designer if we are not already throttling:
				if (!this._throttling.isThrottling)
				{
					const msg = `<p>[time= ${time.toFixed(3)}] More than ${this._throttling.threshold} messages were logged in the past ${this._throttling.window}s.</p>`
						+ `<p>We are now throttling: only 1 in ${this._throttling.factor} messages will be logged.</p>`
						+ `<p>You may want to change your experiment's logging level. Please see <a href="https://www.psychopy.org/api/logging.html">psychopy.org/api/logging.html</a> for details.</p>`;

					// console warning:
					this._psychoJS.logger.warn(msg);

					// in PILOTING mode and locally, we also warn the experimenter with a dialog box,
					// but only once:
					if (
						!this._throttling.designerWasWarned
						&& (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.LOCAL
							|| this._psychoJS.config.experiment.status === "PILOTING")
					)
					{
						this._throttling.designerWasWarned = true;

						this._psychoJS.gui.dialog({
							warning: msg,
							showOK: true,
						});
					}

					this._throttling.isThrottling = true;
					this._throttling.startOfThrottling = time;
					this._throttling.index = 0;
				}

				++this._throttling.index;
				if (this._throttling.index < this._throttling.factor)
				{
					// no logging
					return true;
				}
				else
				{
					this._throttling.index = 0;
				}
			}
			else
			{
				if (
					this._throttling.isThrottling
					&& (time - this._throttling.startOfThrottling) > this._throttling.minimumDuration
				)
				{
					this._psychoJS.logger.info(`[time= ${time.toFixed(3)}] Log messages are not throttled any longer.`);
					this._throttling.isThrottling = false;
				}
			}
		}

		return false;
	}

	/**
	 * Flush all server logs to the server.
	 *
	 * <p>Note: the logs are compressed using Pako's zlib algorithm.
	 * See https://github.com/nodeca/pako for details.</p>
	 */
	async flush()
	{
		const response = {
			origin: "Logger.flush",
			context: "when flushing participant's logs for experiment: " + this._psychoJS.config.experiment.fullpath,
		};

		this._psychoJS.logger.info("[PsychoJS] Flush server logs.");

		// prepare the formatted logs:
		let formattedLogs = "";
		for (const log of this._serverLogs)
		{
			let formattedLog = util.toString(log.time)
				+ "\t" + Symbol.keyFor(log.level)
				+ "\t" + log.msg;
			if (log.obj !== "undefined")
			{
				formattedLog += "\t" + log.obj;
			}
			formattedLog += "\n";

			formattedLogs += formattedLog;
		}

		// send logs to the server or display them in the console:
		if (
			this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER
			&& this._psychoJS.config.experiment.status === "RUNNING"
			&& !this._psychoJS._serverMsg.has("__pilotToken")
		)
		{
			// if the pako compression library is present, we compress the logs:
			if (typeof pako !== "undefined")
			{
				try
				{
					const utf16DeflatedLogs = pako.deflate(formattedLogs, { to: "string" });
					// const utf16DeflatedLogs = pako.deflate(unescape(encodeURIComponent(formattedLogs)), {to: 'string'});
					const base64DeflatedLogs = btoa(utf16DeflatedLogs);

					return await this._psychoJS.serverManager.uploadLog(base64DeflatedLogs, true);
				}
				catch (error)
				{
					console.error("log compression error:", error);
					throw Object.assign(response, { error: error });
				}
			}
			// the pako compression library is not present, we do not compress the logs:
			else
			{
				return await this._psychoJS.serverManager.uploadLog(formattedLogs, false);
			}
		}
		else
		{
			this._psychoJS.logger.debug("\n" + formattedLogs);
		}
	}

	/**
	 * Create a custom console layout.
	 *
	 * @protected
	 * @return {*} the custom layout
	 */
	_customConsoleLayout()
	{
		const detectedBrowser = util.detectBrowser();

		const customLayout = new log4javascript.PatternLayout("%p %d{HH:mm:ss.SSS} %f{1} | %m");
		customLayout.setCustomField("location", function(layout, loggingReference)
		{
			// we throw a fake exception to retrieve the stack trace
			try
			{
				// (0)();
				throw Error("fake exception");
			}
			catch (e)
			{
				const stackEntries = e.stack.replace(/^.*?\n/, "").replace(/(?:\n@:0)?\s+$/m, "").replace(/^\(/gm, "{anon}(").split("\n");

				let relevantEntry;
				if (detectedBrowser === "Firefox")
				{
					// look for entry immediately after those of log4javascript:
					for (let entry of stackEntries)
					{
						if (entry.indexOf("log4javascript.min.js") <= 0)
						{
							relevantEntry = entry;
							break;
						}
					}

					const buf = relevantEntry.split(":");
					const line = buf[buf.length - 2];
					const file = buf[buf.length - 3].split("/").pop();
					const method = relevantEntry.split("@")[0];

					return method + " " + file + ":" + line;
				}
				else if (detectedBrowser === "Safari")
				{
					return "unknown";
				}
				else if (detectedBrowser === "Chrome")
				{
					relevantEntry = stackEntries.pop();

					let buf = relevantEntry.split(" ");
					let fileLine = buf.pop();
					const method = buf.pop();
					buf = fileLine.split(":");
					buf.pop();
					const line = buf.pop();
					const file = buf.pop().split("/").pop();

					return method + " " + file + ":" + line;
				}
				else
				{
					return "unknown";
				}
			}
		});

		return customLayout;
	}

	/**
	 * Get the integer value associated with a logging level.
	 *
	 * @protected
	 * @param {module:core.Logger.ServerLevel} level - the logging level
	 * @return {number} - the value associated with the logging level, or 30 is the logging level is unknown.
	 */
	_getValue(level)
	{
		const levelAsString = Symbol.keyFor(level);
		return (levelAsString in Logger._ServerLevelValue) ? Logger._ServerLevelValue[levelAsString] : 30;
	}
}

/**
 * Server logging level.
 *
 * @enum {Symbol}
 * @readonly
 *
 * @note These are similar to PsychoPy's logging levels, as defined in logging.py
 */
Logger.ServerLevel = {
	CRITICAL: Symbol.for("CRITICAL"),
	ERROR: Symbol.for("ERROR"),
	WARNING: Symbol.for("WARNING"),
	DATA: Symbol.for("DATA"),
	EXP: Symbol.for("EXP"),
	INFO: Symbol.for("INFO"),
	DEBUG: Symbol.for("DEBUG"),
	NOTSET: Symbol.for("NOTSET"),
};

/**
 * Server logging level values.
 *
 * <p>We use those values to determine whether a log is to be sent to the server or not.</p>
 *
 * @enum {number}
 * @readonly
 * @protected
 */
Logger._ServerLevelValue = {
	"CRITICAL": 50,
	"ERROR": 40,
	"WARNING": 30,
	"DATA": 25,
	"EXP": 22,
	"INFO": 20,
	"DEBUG": 10,
	"NOTSET": 0,
};
