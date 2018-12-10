/**
 * Graphic User Interface
 *
 * @author Alain Pitiot
 * @version 3.0.0b11
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import { PsychoJS } from './PsychoJS';
import { ServerManager } from './ServerManager';
import { Scheduler } from '../util/Scheduler';
import { Clock } from '../util/Clock';
import * as util from '../util/Util';


/**
 * @class
 * Graphic User Interface
 * 
 * @name module:core.GUI
 * @class
 * @param {PsychoJS} psychoJS the PsychoJS instance
 */
export class GUI
{

	get dialogComponent() { return this._dialogComponent; }

	constructor(psychoJS)
	{
		this._psychoJS = psychoJS;

		// gui listens to RESOURCE events from the server manager:
		psychoJS.serverManager.on(ServerManager.Event.RESOURCE, (signal) => { this._onResourceEvents(signal); });
	}


	/**
	 * <p>Create a dialog box that (a) enables the participant to set some
	 * experimental values (e.g. the session name), (b) shows progress of resource
	 * download, and (c) enables the partipant to cancel the experiment.</p>
	 * 
	 * <b>Setting experiment values</b>
	 * <p>DlgFromDict displays an input field for all values in the dictionary.
	 * It is possible to specify default values e.g.:</p>
	 * <code>let expName = 'stroop';<br>
	 * let expInfo = {'participant':'', 'session':'01'};<br>
	 * psychoJS.schedule(psychoJS.gui.DlgFromDict({dictionary: expInfo, title: expName}));</code>
	 * <p>If the participant cancels (by pressing Cancel or by closing the dialog box), then
	 * the dictionary remains unchanged.</p>
	 * 
	 * @name module:core.GUI#DlgFromDict
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {Object} options.dictionary - associative array of values for the participant to set
	 * @param {String} options.title - name of the project
	 */
	DlgFromDict({
		dictionary,
		title
	})
	{
		// get info from URL:
		const infoFromUrl = util.getUrlParameters();

		this._progressMsg = '&nbsp;';
		this._progressBarMax = 0;
		this._OkButtonDisabled = true;


		// prepare PsychoJS component:
		this._dialogComponent = {};
		this._dialogComponent.status = PsychoJS.Status.NOT_STARTED;
		const dialogClock = new Clock();
		let self = this;
		let loop = () => {
			const t = dialogClock.getTime();

			if (t >= 0.0 && self._dialogComponent.status === PsychoJS.Status.NOT_STARTED) {
				self._dialogComponent.tStart = t;
				self._dialogComponent.status = PsychoJS.Status.STARTED;
				
				// prepare jquery UI dialog box:
				let htmlCode = 
					'<div id="expDialog" title="' + title + '">' + 
					'<p class="validateTips">Fields marked with an asterisk (*) are required.</p>';
				for (const key in dictionary)
				{
					// only create an input if the key is not in the URL:
					let inUrl = false;
					const cleanedDictKey = key.trim().toLowerCase();
					for (const [urlKey, urlValue] of infoFromUrl) {
						const cleanedUrlKey = urlKey.trim().toLowerCase();
						if (cleanedUrlKey == cleanedDictKey) {
							inUrl = true;
							break;
						}
					}

					if (!inUrl) {
						htmlCode = htmlCode + 
						'<label for="' + key + '">' + key + '</label>' +
						'<input type="text" name="' + key + '" id="' + key + '_id" value="' + dictionary[key] + '" class="text ui-widget-content ui-corner-all">';
					}
				}
				htmlCode = htmlCode + '<hr><div id="progressMsg" class="progress">' + self._progressMsg + '</div>';
				htmlCode = htmlCode + '<div id="progressbar"></div></div>';
				let dialogElement = document.getElementById('root');
				dialogElement.innerHTML = htmlCode;
				
				// init and open dialog box:
				self._dialogComponent.button = 'Cancel';
				$("#expDialog").dialog({
					width: 400,
					modal: true,
					closeOnEscape: false,
					buttons: [
						{
							id: "buttonOk",
							text: "Ok",
							disabled: self._OkButtonDisabled,
							click: function() {
								
								// update dictionary:
								for (const key in dictionary) {
									const input = document.getElementById(key + "_id");
									if (input)
										dictionary[key] = input.value;
								}
								
								self._dialogComponent.button = 'OK';
								$("#expDialog").dialog( "close" );

								// switch to full screen if requested:
								self._psychoJS.window.adjustScreenSize();
							}
						},
						{
							id: "buttonCancel",
							text: "Cancel",
							click: function() {
								self._dialogComponent.button = 'Cancel';
								$("#expDialog").dialog( "close" );
							}
						}
					],
					// close is called by both buttons and when the user clicks on the cross:
					close : function() {
						//$.unblockUI();
						self._dialogComponent.status = PsychoJS.Status.FINISHED;
					}
				})
				// change colour of title bar
				.prev(".ui-dialog-titlebar").css("background", "green");

				// block UI until user has pressed dialog button:
				// note: block UI does not allow for text to be entered in the dialog form boxes, alas!
				//$.blockUI({ message: "", baseZ: 1});
				
				// show dialog box:
				$("#expDialog").dialog("open");
				$("#progressbar").progressbar({value: self._progressBarCurrentIncrement});
				$("#progressbar").progressbar("option", "max", self._progressBarMax);
			}

			if (self._dialogComponent.status === PsychoJS.Status.FINISHED)
				return Scheduler.Event.NEXT;
			else
				return Scheduler.Event.FLIP_REPEAT;
		}

		return loop;
	}


	/**
	 * Listener for resource event from the [Server Manager]{@link ServerManager}.
	 * 
	 * @name module:core.GUI#_onResourceEvents
	 * @function
	 * @private
	 * @param {Object.<string, string|Symbol>} signal the signal
	 */
	_onResourceEvents(signal) {
		let response = { origin: 'GUI._onResourceEvents', context: 'when handling a resource event' };

		this._psychoJS.logger.debug('signal: ' + util.toString(signal));

		// all resources have been registered:
		if (signal.message === ServerManager.Event.RESOURCES_REGISTERED) {
			// for each resource, we have a 'downloading resource' and a 'resource downloaded' message:
			this._progressBarMax = signal.count * 2;
			$("#progressbar").progressbar("option", "max", this._progressBarMax);
			
			this._progressBarCurrentIncrement = 0;
			$("#progressMsg").text('all resources registered.');
		}
		
		// all the resources have been downloaded: show the ok button 
		else if (signal.message === ServerManager.Event.DOWNLOAD_COMPLETED) {
			this._OkButtonDisabled = false;
			$("#buttonOk").button({ disabled: this._OkButtonDisabled });
			$("#progressMsg").text('all resources downloaded.');
		}
		
		// update progress bar:
		else if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCE || signal.message === ServerManager.Event.RESOURCE_DOWNLOADED)
		{
			if (typeof this._progressBarCurrentIncrement === 'undefined')
				this._progressBarCurrentIncrement = 0;

			if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCE)
				$("#progressMsg").text(signal.resource + ': downloading...');
			else
				$("#progressMsg").text(signal.resource + ': downloaded.');

			++ this._progressBarCurrentIncrement;
			$("#progressbar").progressbar("option", "value", this._progressBarCurrentIncrement);
		}

		// unknown message: we just display it
		else
			$("#progressMsg").text(signal.message);
	}


	/**
	 * @callback GUI.onOK
	 */
	/**
	 * Show a message to the participant in a dialog box.
	 * 
	 * <p>This function can be used to display both warning and error messages.</p>
	 * 
	 * @name module:core.GUI#dialog
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {string} options.message - the message to be displayed
	 * @param {Object.<string, *>} options.error - an exception
	 * @param {string} options.warning - a warning message
	 * @param {boolean} [options.showOK=true] - specifies whether to show the OK button
	 * @param {GUI.onOK} [options.onOK] - function called when the participant presses the OK button
	 */
	dialog({
		message,
		warning,
		error,
		showOK = true,
		onOK
	} = {}) {
		// destroy previous dialog box:
		this.destroyDialog();

		// we are displaying an error:
		if (typeof error !== 'undefined') {
			this._psychoJS.logger.fatal(util.toString(error));

			var htmlCode = '<div id="msgDialog" title="Error">';
			htmlCode += '<p class="validateTips">Unfortunately we encountered an error:</p>';
			
			// go through the error stack:
			htmlCode += '<ul>';
			while (true) {
				if (typeof error === 'object' && 'context' in error) {
					htmlCode += '<li>' + error.context + '</li>';
					error = error.error;
				} else {
					htmlCode += '<li><b>' + error  + '</b></li>';
					break;
				}		
			}
			htmlCode += '</ul>';

			htmlCode += '<p>Try to run the experiment again. If the error persists, contact the experimenter.</p>';
			var titleColour = 'red';
		}

		// we are displaying a message:
		else if (typeof message !== 'undefined') {
			htmlCode = '<div id="msgDialog" title="Message">'
				+ '<p class="validateTips">' + message + '</p>';
			titleColour = 'green';
		}

		// we are displaying a warning:
		else if (typeof warning !== 'undefined') {
			htmlCode = '<div id="msgDialog" title="Warning">'
				+ '<p class="validateTips">' + warning + '</p>';
			titleColour = 'orange';
		}

		htmlCode = htmlCode + '</div>';
		var dialogElement = document.getElementById('root');
		dialogElement.innerHTML = htmlCode;
		
		// init dialog box:
		$("#msgDialog").dialog({dialogClass: 'no-close', width: '80%', modal: true, closeOnEscape: false})
		// change colour of title bar
		.prev(".ui-dialog-titlebar").css("background", titleColour);
		
		// add OK button if need be:
		if (showOK) {
			$("#msgDialog").dialog("option", "buttons", [
				{
					id: "buttonOk",
					text: "Ok",
					click: function() {
						$(this).dialog("close");
						
						// execute callback function:
						if (typeof onOK !== 'undefined')
							onOK();
					}
				}]);
		}

		// show dialog box:
		$("#msgDialog").dialog("open");
	}


	/**
	 * Destroy the currently opened dialog box.
	 * 
	 * @name module:core.GUI#dialog
	 * @function
	 * @public
	 */
	destroyDialog()
	{
		if ($("#expDialog").length) {
			$("#expDialog").dialog("destroy");
		}
		if ($("#msgDialog").length) {
			$("#msgDialog").dialog("destroy");
		}
	}

}
