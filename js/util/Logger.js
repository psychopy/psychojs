/**
 * Logger
 * 
 * @author Alain Pitiot
 * @version 3.0.0b13
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import * as util from '../util/Util';


/**
 * <p>This class handles a variety of loggers, e.g. a browser console one (mostly for debugging), a remote one, etc.</p>
 * 
 * <p>Note: we use log4javascript.</p>
 * 
 * @name module:util.Logger
 * @class
 * @param {*} threshold - the logging threshold, e.g. log4javascript.Level.ERROR
 */
export class Logger {

	constructor(threshold) {
		// browser console logger:
		this.consoleLogger = log4javascript.getLogger('psychojs');

		const appender = new log4javascript.BrowserConsoleAppender();
		appender.setLayout(this._customConsoleLayout());
		appender.setThreshold(threshold);

		this.consoleLogger.addAppender(appender);
		this.consoleLogger.setLevel(threshold);


		/*
		let appender = new log4javascript.AjaxAppender('https://pavlovia.org/server?command=log');
		appender.setBatchSize(5);
		appender.setSendAllOnUnload(true);
		//appender.setFailCallback();
	
		let jsonLayout = new log4javascript.JsonLayout([false, true]);
		appender.setLayout(jsonLayout);*/
	}


	/**
	 * Create a custom console layout.
	 * 
	 * @name module:util.Logger#_customConsoleLayout
	 * @private
	 * @return {*} the custom layout
	 */
	_customConsoleLayout() {
		const customLayout = new log4javascript.PatternLayout("%p %f{1} | %m");

		customLayout.setCustomField('location', function (layout, loggingReference) {
			// we throw a fake exception to retrieve the stack trace
			try { (0)() } catch (e) {
				const stackEntries = e.stack.replace(/^.*?\n/, '').replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anon}(').split("\n");

				let relevantEntry;
				const browser = util.detectBrowser();
				if (browser == 'Firefox') {
					// look for entry immediately after those of log4javascript:
					for (let entry of stackEntries)
						if (entry.indexOf('log4javascript.min.js') <= 0) {
							relevantEntry = entry;
							break;
						}

					const buf = relevantEntry.split(':');
					const line = buf[buf.length - 2];
					const file = buf[buf.length - 3].split('/').pop();
					const method = relevantEntry.split('@')[0];

					return method + ' ' + file + ' ' + line;
				}
				else if (browser == 'Safari') {
					return 'unknown';
				}
				else if (browser == 'Chrome') {
					relevantEntry = stackEntries.pop();

					let buf = relevantEntry.split(' ');
					let fileLine = buf.pop();
					const method = buf.pop();
					buf = fileLine.split(':'); buf.pop();
					const line = buf.pop();
					const file = buf.pop().split('/').pop();

					return method + ' ' + file + ' ' + line;

				}
				else
					return 'unknown';
			}
		});

		return customLayout;
	}

}
