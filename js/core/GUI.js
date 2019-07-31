/**
 * Graphic User Interface
 *
 * @author Alain Pitiot
 * @version 3.1.5
 * @copyright (c) 2019 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {PsychoJS} from './PsychoJS';
import {ServerManager} from './ServerManager';
import {Scheduler} from '../util/Scheduler';
import {Clock} from '../util/Clock';
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

		this._dialogScalingFactor = 0;
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
		this._allResourcesDownloaded = false;
		this._requiredKeys = [];
		this._nbSetRequiredKeys = 0;


		// prepare PsychoJS component:
		this._dialogComponent = {};
		this._dialogComponent.status = PsychoJS.Status.NOT_STARTED;
		const dialogClock = new Clock();
		const self = this;

		return () => {
			const t = dialogClock.getTime();

			if (t >= 0.0 && self._dialogComponent.status === PsychoJS.Status.NOT_STARTED) {
				self._dialogComponent.tStart = t;
				self._dialogComponent.status = PsychoJS.Status.STARTED;

				// prepare jquery UI dialog box:
				let htmlCode =
					'<div id="expDialog" title="' + title + '">' +

					// '<p style="font-size: 0.8em; padding: 0.5em; margin-bottom: 0.5em; color: #FFAA00; border: 1px solid #FFAA00;">&#9888; This experiment uses a deprecated version of the PsychoJS library. Consider updating to a newer version (e.g. by updating PsychoPy and re-exporting the experiment).</p>'+

					'<p class="validateTips">Fields marked with an asterisk (*) are required.</p>';

				// add a comboboxes or text areas for each entry in the dictionary:
				htmlCode += '<form>';
				for (const key in dictionary) {
					const value = dictionary[key];
					const keyId = key + '_id';

					// only create an input if the key is not in the URL:
					let inUrl = false;
					const cleanedDictKey = key.trim().toLowerCase();
					for (const [urlKey, urlValue] of infoFromUrl) {
						const cleanedUrlKey = urlKey.trim().toLowerCase();
						if (cleanedUrlKey === cleanedDictKey) {
							inUrl = true;
							break;
						}
					}

					if (!inUrl) {
						htmlCode += '<label for="' + key + '">' + key + '</label>';

						// if the field is required:
						if (key.slice(-1) === '*')
							self._requiredKeys.push(key);

						// if value is an array, we create a select drop-down menu:
						if (Array.isArray(value)) {
							htmlCode += '<select name="' + key + '" id="' + keyId + '" class="text ui-widget-content' +
								' ui-corner-all">';

							// if the field is required, we add an empty option and select it:
							if (key.slice(-1) === '*')
								htmlCode += '<option disabled selected>...</option>';

							for (const option of value)
								htmlCode += '<option>' + option + '</option>';

							htmlCode += '</select>';
							$('#' + keyId).selectmenu({classes: {}});
						}

						// otherwise we use a single string input:
						else /*if (typeof value === 'string')*/
							htmlCode += '<input type="text" name="' + key + '" id="' + keyId + '" value="' + value + '" class="text ui-widget-content ui-corner-all">';

					}
				}
				htmlCode += '</form>';


				// add a progress bar:
				htmlCode += '<hr><div id="progressMsg" class="progress">' + self._progressMsg + '</div>';
				htmlCode += '<div id="progressbar"></div></div>';


				// replace root by the html code:
				const dialogElement = document.getElementById('root');
				dialogElement.innerHTML = htmlCode;


				// setup change event handlers for all required keys:
				for (const key of this._requiredKeys) {
					const keyId = key + '_id';
					const input = document.getElementById(keyId);
					if (input)
						input.onchange = (event) => GUI._onKeyChange(self, event);
				}

				// init and open the dialog box:
				self._dialogComponent.button = 'Cancel';
				self._estimateDialogScalingFactor();
				const dialogSize = self._getDialogSize();
				$("#expDialog").dialog({
					width: dialogSize[0],
					maxHeight: dialogSize[1],

					autoOpen: true,
					modal: true,
					closeOnEscape: false,
					resizable: false,

					buttons: [
						{
							id: "buttonOk",
							text: "Ok",
							click: function () {

								// update dictionary:
								for (const key in dictionary) {
									const input = document.getElementById(key + "_id");
									if (input)
										dictionary[key] = input.value;
								}

								self._dialogComponent.button = 'OK';
								$("#expDialog").dialog("close");

								// switch to full screen if requested:
								self._psychoJS.window.adjustScreenSize();
							}
						},
						{
							id: "buttonCancel",
							text: "Cancel",
							click: function () {
								self._dialogComponent.button = 'Cancel';
								$("#expDialog").dialog("close");
							}
						}
					],

					// open the dialog in the middle of the screen:
					open: self._dialogOpen('#expDialog'),

					// close is called by both buttons and when the user clicks on the cross:
					close: function () {
						//$.unblockUI();
						self._dialogComponent.status = PsychoJS.Status.FINISHED;
					}

				})
				// change colour of title bar
					.prev(".ui-dialog-titlebar").css("background", "green");


				// update the OK button status:
				self._updateOkButtonStatus();


				// when the browser window is resize, we redimension and reposition the dialog:
				self._dialogResize('#expDialog');


				// block UI until user has pressed dialog button:
				// note: block UI does not allow for text to be entered in the dialog form boxes, alas!
				//$.blockUI({ message: "", baseZ: 1});

				// show dialog box:
				$("#progressbar").progressbar({value: self._progressBarCurrentIncrement});
				$("#progressbar").progressbar("option", "max", self._progressBarMax);
			}

			if (self._dialogComponent.status === PsychoJS.Status.FINISHED)
				return Scheduler.Event.NEXT;
			else
				return Scheduler.Event.FLIP_REPEAT;
		};
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

		let htmlCode;
		let titleColour;

		// we are displaying an error:
		if (typeof error !== 'undefined') {
			this._psychoJS.logger.fatal(util.toString(error));

			htmlCode = '<div id="msgDialog" title="Error">';
			htmlCode += '<p class="validateTips">Unfortunately we encountered the following error:</p>';
			
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

			htmlCode += '<p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>';
			titleColour = 'red';
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

		htmlCode += '</div>';

		// replace root by the html code:
		const dialogElement = document.getElementById('root');
		dialogElement.innerHTML = htmlCode;
		
		// init and open the dialog box:
		this._estimateDialogScalingFactor();
		const dialogSize = this._getDialogSize();
		const self = this;
		$('#msgDialog').dialog({
			dialogClass: 'no-close',

			width: dialogSize[0],
			maxHeight: dialogSize[1],

			autoOpen: true,
			modal: true,
			closeOnEscape: false,

			buttons: (!showOK)?[]:[{
				id: "buttonOk",
				text: "Ok",
				click: function() {
					$(this).dialog("close");

					// execute callback function:
					if (typeof onOK !== 'undefined')
						onOK();
				}
			}],

			// open the dialog in the middle of the screen:
			open: self._dialogOpen('#msgDialog'),

		})
		// change colour of title bar
		.prev(".ui-dialog-titlebar").css("background", titleColour);


		// when the browser window is resize, we redimension and reposition the dialog:
		self._dialogResize('#msgDialog');
	}


	/**
	 * Get the jQuery UI callback for opening the given dialog in the middle of the screen.
	 *
	 * @name module:core.GUI#_dialogOpen
	 * @function
	 * @param {String} dialogId - the dialog ID
	 * @returns {Function} jquery ui open function
	 * @private
	 */
	_dialogOpen(dialogId) {
		const self = this;

		return () => {
			const windowSize = [$(window).width(), $(window).height()];

			// note: $(dialogId) is the dialog-content, $(dialogId).parent() is the actual widget
			const parent = $(dialogId).parent();
			parent.css({
				position: 'absolute',
				left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
				top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0)
			});

			// record width and height difference between dialog content and dialog:
			self._contentDelta = [
				parent.css('width').slice(0, -2) - $(dialogId).css('width').slice(0, -2),
				parent.css('height').slice(0, -2) - $(dialogId).css('height').slice(0, -2)];
		};
	}


	/**
	 * Ensure that the browser window's resize events redimension and reposition the dialog UI.
	 *
	 * @name module:core.GUI#_dialogResize
	 * @function
	 * @param {String} dialogId - the dialog ID
	 * @private
	 */
	_dialogResize(dialogId) {
		const self = this;

		$(window).resize( function() {
			const parent = $(dialogId).parent();
			const windowSize = [$(window).width(), $(window).height()];

			// size (we need to redimension both the dialog and the dialog content):
			const dialogSize = self._getDialogSize();
			parent.css({
				width: dialogSize[0],
				maxHeight: dialogSize[1]
			});

			const isDifferent = self._estimateDialogScalingFactor();
			if (!isDifferent) {
				$(dialogId).css({
					width: dialogSize[0] - self._contentDelta[0],
					maxHeight: dialogSize[1] - self._contentDelta[1]
				});
			}

			// position:
			parent.css({
				position: 'absolute',
				left: Math.max(0, (windowSize[0] - parent.outerWidth()) / 2.0),
				top: Math.max(0, (windowSize[1] - parent.outerHeight()) / 2.0),
			});
		} );
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


	/**
	 * Listener for resource event from the [Server Manager]{@link ServerManager}.
	 *
	 * @name module:core.GUI#_onResourceEvents
	 * @function
	 * @private
	 * @param {Object.<string, string|Symbol>} signal the signal
	 */
	_onResourceEvents(signal) {
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
			this._allResourcesDownloaded = true;
			$("#progressMsg").text('all resources downloaded.');
			this._updateOkButtonStatus();
		}

		// update progress bar:
		else if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCE || signal.message === ServerManager.Event.RESOURCE_DOWNLOADED)
		{
			if (typeof this._progressBarCurrentIncrement === 'undefined')
				this._progressBarCurrentIncrement = 0;
			++ this._progressBarCurrentIncrement;

			if (signal.message === ServerManager.Event.RESOURCE_DOWNLOADED)
				$("#progressMsg").text('downloaded ' + this._progressBarCurrentIncrement/2 + ' / ' + this._progressBarMax/2);
			// $("#progressMsg").text(signal.resource + ': downloaded.');
			// else
				// $("#progressMsg").text(signal.resource + ': downloading...');

			$("#progressbar").progressbar("option", "value", this._progressBarCurrentIncrement);
		}

		// unknown message: we just display it
		else
			$("#progressMsg").text(signal.message);
	}


	/**
	 * Update the status of the OK button.
	 *
	 * @name module:core.GUI#_updateOkButtonStatus
	 * @function
	 * @private
	 */
	_updateOkButtonStatus() {
		if (this._psychoJS.config.environment === PsychoJS.Environment.LOCAL || (this._allResourcesDownloaded && this._nbSetRequiredKeys >= this._requiredKeys.length) ) {
			$("#buttonOk").button("option", "disabled", false);
		} else
			$("#buttonOk").button("option", "disabled", true);

		// strangely, changing the disabled option sometimes fails to update the ui,
		// so we need to hide it and show it again:
		$("#buttonOk").hide(0, () => { $("#buttonOk").show(); });
	}


	/**
	 * Estimate the scaling factor for the dialog popup windows.
	 *
	 * @name module:core.GUI#_estimateDialogScalingFactor
	 * @function
	 * @private
	 * @returns {boolean} whether or not the scaling factor is different from the previously estimated one
	 */
	_estimateDialogScalingFactor() {
		const windowSize = [$(window).width(), $(window).height()];

		// desktop:
		let dialogScalingFactor = 1.0;

		// mobile or tablet:
		if (windowSize[0] < 1080) {
			// landscape:
			if (windowSize[0] > windowSize[1])
				dialogScalingFactor = 1.5;
			// portrait:
			else
				dialogScalingFactor = 2.0;
		}

		const isDifferent = (dialogScalingFactor !== this._dialogScalingFactor);
		this._dialogScalingFactor = dialogScalingFactor;

		return isDifferent;
	}


	/**
	 * Get the size of the dialog.
	 *
	 * @name module:core.GUI#_getDialogSize
	 * @private
	 * @returns {number[]} the size of the popup dialog window
	 */
	_getDialogSize() {
		const windowSize = [$(window).width(), $(window).height()];
		this._estimateDialogScalingFactor();

		return [
			Math.min(GUI.dialogMaxSize[0], (windowSize[0]-GUI.dialogMargin[0]) / this._dialogScalingFactor),
			Math.min(GUI.dialogMaxSize[1], (windowSize[1]-GUI.dialogMargin[1]) / this._dialogScalingFactor)];
	}


	/**
	 * Listener for change event for required keys.
	 *
	 * @name module:core.GUI#_onKeyChange
	 * @function
	 * @static
	 * @private
	 * @param {module:core.GUI} gui - this GUI
	 * @param {Event} event - event
	 */
	static _onKeyChange(gui, event) {
		const element = event.target;
		const value = element.value;

		if (typeof value !== 'undefined' && value.length > 0)
			gui._nbSetRequiredKeys++;
		else
			gui._nbSetRequiredKeys--;

		gui._updateOkButtonStatus();
	}

}


/**
 * Maximal dimensions of the dialog window.
 *
 * @name module:core.GUI#dialogMaxSize
 * @enum {Symbol}
 * @readonly
 * @public
 */
GUI.dialogMaxSize = [500, 600];


/**
 * Dialog window margins.
 *
 * @name module:core.GUI#dialogMargin
 * @enum {Symbol}
 * @readonly
 * @public
 */
GUI.dialogMargin = [50, 50];
