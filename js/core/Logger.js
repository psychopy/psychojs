/**
 * Logger
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import * as util from '../util/Util';
import {MonotonicClock} from '../util/Clock';
import {ExperimentHandler} from '../data/ExperimentHandler';


/**
 * <p>This class handles a variety of loggers, e.g. a browser console one (mostly for debugging),
 * a remote one, etc.</p>
 *
 * <p>Note: we use log4javascript for the console logger, and our own for the server logger.</p>
 *
 * @name module:core.Logger
 * @class
 * @param {*} threshold - the logging threshold, e.g. log4javascript.Level.ERROR
 */
export class Logger
{

	constructor(psychoJS, threshold)
	{
		this._psychoJS = psychoJS;

		// browser console logger:
		this.consoleLogger = log4javascript.getLogger('psychojs');

		const appender = new log4javascript.BrowserConsoleAppender();
		appender.setLayout(this._customConsoleLayout());
		appender.setThreshold(threshold);

		this.consoleLogger.addAppender(appender);
		this.consoleLogger.setLevel(threshold);


		// server logger:
		this._serverLogs = [];
		this._serverLevel = Logger.ServerLevel.WARNING;
	}



	/**
	 * Change the logging level.
	 *
	 * @name module:core.Logger#setLevel
	 * @public
	 * @param {module:core.Logger.ServerLevel} serverLevel - the new logging level
	 */
	setLevel(serverLevel)
	{
		this._serverLevel = serverLevel;
	}



	/**
	 * Log a server message at the EXP level.
	 *
	 * @name module:core.Logger#exp
	 * @public
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
	 * @name module:core.Logger#data
	 * @public
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
	 * @name module:core.Logger#log
	 * @public
	 * @param {string} msg - the message to be logged.
	 * @param {module:core.Logger.ServerLevel} level - logging level
	 * @param {number} [time] - the logging time
	 * @param {object} [obj] - the associated object (e.g. a Trial)
	 */
	log(msg, level, time, obj)
	{
		if (typeof time === 'undefined')
		{
			time = MonotonicClock.getReferenceTime();
		}

		this._serverLogs.push({
			msg,
			level,
			time,
			obj: util.toString(obj)
		});

	}



	/**
	 * Flush all server logs to the server.
	 *
	 * <p>Note: the logs are compressed using Pako's zlib algorithm.
	 * See https://github.com/nodeca/pako for details.</p>
	 *
	 * @name module:core.Logger#flush
	 * @public
	 */
	async flush()
	{
		const response = {
			origin: 'Logger.flush',
			context: 'when flushing participant\'s logs for experiment: ' + this._psychoJS.config.experiment.fullpath
		};

		this._psychoJS.logger.info('[PsychoJS] Flush server logs.');

		// server level value:
		const serverLevelValue = this._getValue(this._serverLevel);

		// prepare formatted logs:
		let formattedLogs = '';
		for (const log of this._serverLogs)
		{
			// we add the log message only if its level is >= _serverLevel
			const levelValue = this._getValue(log.level);
			if (levelValue >= serverLevelValue)
			{
				let formattedLog = util.toString(log.time) +
					'\t' + Symbol.keyFor(log.level) +
					'\t' + log.msg;
				if (log.obj !== 'undefined')
				{
					formattedLog += '\t' + log.obj;
				}
				formattedLog += '\n';

				formattedLogs += formattedLog;
			}
		}

		// send logs to the server or display them in the console:
		if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER &&
			this._psychoJS.config.experiment.status === 'RUNNING' &&
			!this._psychoJS._serverMsg.has('__pilotToken'))
		{
			// if the pako compression library is present, we compress the logs:
			if (typeof pako !== 'undefined')
			{
				try
				{
					const utf16DeflatedLogs = pako.deflate(formattedLogs, {to: 'string'});
					// const utf16DeflatedLogs = pako.deflate(unescape(encodeURIComponent(formattedLogs)), {to: 'string'});
					const base64DeflatedLogs = btoa(utf16DeflatedLogs);

					return await this._psychoJS.serverManager.uploadLog(base64DeflatedLogs, true);
				}
				catch (error)
				{
					console.error('log compression error:', error);
					throw Object.assign(response, {error: error});
				}
			}
			else
			// the pako compression library is not present, we do not compress the logs:
			{
				return await this._psychoJS.serverManager.uploadLog(formattedLogs, false);
			}
		}
		else
		{
			this._psychoJS.logger.debug('\n' + formattedLogs);
		}
	}



	/**
	 * Create a custom console layout.
	 *
	 * @name module:core.Logger#_customConsoleLayout
	 * @private
	 * @return {*} the custom layout
	 */
	_customConsoleLayout()
	{
		const detectedBrowser = this._psychoJS.browser;

		const customLayout = new log4javascript.PatternLayout("%p %f{1} | %m");
		customLayout.setCustomField('location', function (layout, loggingReference)
		{
			// we throw a fake exception to retrieve the stack trace
			try
			{
				// (0)();
				throw Error('fake exception');
			}
			catch (e)
			{
				const stackEntries = e.stack.replace(/^.*?\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anon}(').split("\n");

				let relevantEntry;
				if (detectedBrowser === 'Firefox')
				{
					// look for entry immediately after those of log4javascript:
					for (let entry of stackEntries)
					{
						if (entry.indexOf('log4javascript.min.js') <= 0)
						{
							relevantEntry = entry;
							break;
						}
					}

					const buf = relevantEntry.split(':');
					const line = buf[buf.length - 2];
					const file = buf[buf.length - 3].split('/').pop();
					const method = relevantEntry.split('@')[0];

					return method + ' ' + file + ' ' + line;
				}
				else if (detectedBrowser === 'Safari')
				{
					return 'unknown';
				}
				else if (detectedBrowser === 'Chrome')
				{
					relevantEntry = stackEntries.pop();

					let buf = relevantEntry.split(' ');
					let fileLine = buf.pop();
					const method = buf.pop();
					buf = fileLine.split(':');
					buf.pop();
					const line = buf.pop();
					const file = buf.pop().split('/').pop();

					return method + ' ' + file + ' ' + line;
				}
				else
				{
					return 'unknown';
				}
			}
		});

		return customLayout;
	}



	/**
	 * Get the integer value associated with a logging level.
	 *
	 * @name module:core.Logger#_getValue
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
 * @name module:core.Logger#ServerLevel
 * @enum {Symbol}
 * @readonly
 * @public
 *
 * @note These are similar to PsychoPy's logging levels, as defined in logging.py
 */
Logger.ServerLevel = {
	CRITICAL: Symbol.for('CRITICAL'),
	ERROR: Symbol.for('ERROR'),
	WARNING: Symbol.for('WARNING'),
	DATA: Symbol.for('DATA'),
	EXP: Symbol.for('EXP'),
	INFO: Symbol.for('INFO'),
	DEBUG: Symbol.for('DEBUG'),
	NOTSET: Symbol.for('NOTSET')
};


/**
 * Server logging level values.
 *
 * <p>We use those values to determine whether a log is to be sent to the server or not.</p>
 *
 * @name module:core.Logger#_ServerLevelValue
 * @enum {number}
 * @readonly
 * @protected
 */
Logger._ServerLevelValue = {
	'CRITICAL': 50,
	'ERROR': 40,
	'WARNING': 30,
	'DATA': 25,
	'EXP': 22,
	'INFO': 20,
	'DEBUG': 10,
	'NOTSET': 0
};
