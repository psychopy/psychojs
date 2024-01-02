/**
 * Graphic User Interface
 *
 * @author Alain Pitiot
 * @author Sijia Zhao - fine-grained resource loading
 * @version 2021.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as Tone from "tone";
import { ExperimentHandler } from "../data/ExperimentHandler.js";
import { Clock } from "../util/Clock.js";
import { Scheduler } from "../util/Scheduler.js";
import * as util from "../util/Util.js";
import { PsychoJS } from "./PsychoJS.js";
import { ServerManager } from "./ServerManager.js";
import A11yDialog from "a11y-dialog";

/**
 * <p>GUI manages the various pop-up dialog boxes that guide the participant, throughout the
 * lifecycle of the experiment, e.g. at the start while the resources are downloading, or at the
 * end when the data is uploading to the server</p>
 */
export class GUI
{
	/**
	 * Default settings for GUI.
	 *
	 * @type {Object}
	 */
	static DEFAULT_SETTINGS = {
		DlgFromDict: {
			// The dialog box shows an OK button. The button becomes enable when all registered resources
			// have been downloaded. Participants must click on the OK button to move on with the experiment.
			requireParticipantClick: true
		}
	};

	get dialogComponent()
	{
		return this._dialogComponent;
	}

	/**
	 * @memberof module:core
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 */
	constructor(psychoJS)
	{
		this._psychoJS = psychoJS;

		// info fields excluded from the GUI:
		this._excludedInfo = {};

		// gui listens to RESOURCE events from the server manager:
		psychoJS.serverManager.on(ServerManager.Event.RESOURCE, (signal) =>
		{
			this._onResourceEvents(signal);
		});
	}

	/**
	 * <p>Create a dialog box that (a) enables the participant to set some
	 * experimental values (e.g. the session name), (b) shows progress of resource
	 * download, and (c) enables the participant to cancel the experiment.</p>
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
	 * @param {Object} options
	 * @param {String} [options.logoUrl] - Url of the experiment logo
	 * @param {String} [options.text] - information text
	 * @param {Object} options.dictionary - associative array of values for the participant to set
	 * @param {String} options.title - name of the project
	 * @param {boolean} [options.requireParticipantClick=true] - whether the participant must click on the OK
     * 	button, when it becomes enabled, to move on with the experiment
	 */
	DlgFromDict({
		logoUrl,
		text,
		dictionary,
		title,
		requireParticipantClick = GUI.DEFAULT_SETTINGS.DlgFromDict.requireParticipantClick
	})
	{
		this._progressBarMax = 0;
		this._allResourcesDownloaded = false;
		this._requiredKeys = [];
		this._setRequiredKeys = new Map();
		this._progressMessage = "&nbsp;";
		this._requireParticipantClick = requireParticipantClick;
		this._dictionary = dictionary;

		// prepare a PsychoJS component:
		this._dialogComponent = {};
		this._dialogComponent.status = PsychoJS.Status.NOT_STARTED;
		const dialogClock = new Clock();

		const self = this;
		return () =>
		{
			const t = dialogClock.getTime();

			if (t >= 0.0 && self._dialogComponent.status === PsychoJS.Status.NOT_STARTED)
			{
				self._dialogComponent.tStart = t;
				self._dialogComponent.status = PsychoJS.Status.STARTED;

				// prepare the info fields excluded from the GUI, including those from the URL:
				const excludedInfo = {};
				for (let key in self._excludedInfo)
				{
					excludedInfo[key.trim().toLowerCase()] = self._excludedInfo[key];
				}
				const infoFromUrl = util.getUrlParameters();
				infoFromUrl.forEach((value, key) =>
				{
					excludedInfo[key.trim().toLowerCase()] = value;
				});


				// if the experiment is licensed, and running on the license rather than on credit,
				// we use the license logo:
				if (self._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER
					&& typeof self._psychoJS.config.experiment.license !== "undefined"
					&& self._psychoJS.config.experiment.runMode === "LICENSE"
					&& typeof self._psychoJS.config.experiment.license.institutionLogo !== "undefined")
				{
					logoUrl = self._psychoJS.config.experiment.license.institutionLogo;
				}

				// prepare the markup for the a11y-dialog:
				let markup = "<div class='dialog-container' id='experiment-dialog' aria-hidden='true' role='alertdialog'>";
				markup += "<div class='dialog-overlay'></div>";
				// markup += "<div class='dialog-overlay' data-a11y-dialog-hide></div>";
				markup += "<div class='dialog-content'>";

				// alert title and close button:
				markup += "<div id='experiment-dialog-title' class='dialog-title'>";
				markup += `<p>${title}</p>`;
				markup += "<button id='dialogClose' class='dialog-close' data-a11y-dialog-hide aria-label='Cancel Experiment'>&times;</button>";
				markup += "</div>";

				// everything above the buttons is in a scrollable container:
				markup += "<div class='scrollable-container'>";

				// logo, if need be:
				if (typeof logoUrl === "string")
				{
					markup += '<img id="dialog-logo" class="logo" alt="logo" src="' + logoUrl + '">';
				}

				// add a combobox or text areas for each entry in the dictionary:
				let atLeastOneIncludedKey = false;
				Object.keys(dictionary).forEach((key, keyIdx) =>
				{
					const value = dictionary[key];
					const keyId = "form-input-" + keyIdx;

					// only create an input if the key is not in the URL:
					const cleanedDictKey = key.trim().toLowerCase();
					const isIncluded = !(cleanedDictKey in excludedInfo);
					/*let inUrl = false;
					infoFromUrl.forEach((urlValue, urlKey) =>
					{
						const cleanedUrlKey = urlKey.trim().toLowerCase();
						if (cleanedUrlKey === cleanedDictKey)
						{
							inUrl = true;
							// break;
						}
					});*/

					if (isIncluded)
					// if (!inUrl)
					{
						atLeastOneIncludedKey = true;

						markup += `<label for='${keyId}'> ${key} </label>`;

						// if the field is required:
						if (key.slice(-1) === "*")
						{
							self._requiredKeys.push(keyId);
						}

						// if value is an array, we create a select drop-down menu:
						if (Array.isArray(value))
						{
							markup += `<select name='${key}' id='${keyId}' class='text'>`;

							// if the field is required, we add an empty option and select it:
							if (key.slice(-1) === "*")
							{
								markup += "<option disabled selected>...</option>";
							}

							for (const option of value)
							{
								markup += `<option> ${option} </option>`;
							}

							markup += "</select>";
						}
						// otherwise we use a single string input:
						//if (typeof value === 'string')
						else
						{
							markup += `<input type='text' name='${key}' id='${keyId}' value='${value}' class='text'>`;
						}
					}
				});

				if (self._requiredKeys.length > 0)
				{
					markup += "<p class='validateTips'>Fields marked with an asterisk (*) are required.</p>";
				}

				markup += "</div>"; // scrollable-container

				// separator, if need be:
				if (atLeastOneIncludedKey)
				{
					markup += "<hr>";
				}

				// progress bar:
				markup += `<div id='progressMsg' class='progress-msg'>${self._progressMessage}</div>`;
				markup += "<div class='progress-container'><div id='progressBar' class='progress-bar'></div></div>";

				// buttons:
				markup += "<hr>";
				markup += "<div class='dialog-button-group'>";
				markup += "<button id='dialogCancel' class='dialog-button' aria-label='Cancel Experiment'>Cancel</button>";
				if (self._requireParticipantClick)
				{
					markup += "<button id='dialogOK' class='dialog-button disabled' aria-label='Start Experiment'>Ok</button>";
				}
				markup += "</div>"; // button-group

				markup += "</div></div>";

				// replace root by the markup code:
				const dialogElement = document.getElementById("root");
				dialogElement.innerHTML = markup;

				// init and open the dialog box:
				const dialogDiv = document.getElementById("experiment-dialog");
				self._dialog = new A11yDialog(dialogDiv);
				self._dialog.show();

				// button callbacks:
				self._dialogComponent.button = "Cancel";
				self._cancelButton = document.getElementById("dialogCancel");
				self._cancelButton.onclick = self._onCancelExperiment.bind(self);
				if (self._requireParticipantClick)
				{
					self._okButton = document.getElementById("dialogOK");
					self._okButton.onclick = self._onStartExperiment.bind(self);
				}
				self._closeButton = document.getElementById("dialogClose");
				self._closeButton.onclick = self._onCancelExperiment.bind(self);

				// update the OK button status:
				self._updateDialog();

				self._progressMsg = document.getElementById("progressMsg");
				self._progressBar = document.getElementById("progressBar");
				self._updateProgressBar();

				// setup change event handlers for all required keys:
				this._requiredKeys.forEach((keyId) =>
				{
					const input = document.getElementById(keyId);
					if (input)
					{
						input.oninput = (event) => GUI._onKeyChange(self, event);
					}
				});
			}

			if (self._dialogComponent.status === PsychoJS.Status.FINISHED)
			{
				return Scheduler.Event.NEXT;
			}
			else
			{
				return Scheduler.Event.FLIP_REPEAT;
			}
		};
	}

	/**
	 * @callback GUI.onOK
	 */
	/**
	 * @callback GUI.onCancel
	 */
	/**
	 * Show a message to the participant in a dialog box.
	 *
	 * <p>This function can be used to display ordinary, warning, and error messages.</p>
	 *
	 * @param {Object} options
	 * @param {string} options.message - the message to be displayed
	 * @param {Object.<string, *>} options.error - an exception
	 * @param {string} options.warning - a warning message
	 * @param {boolean} [options.showOK=true] - whether to show the OK button
	 * @param {GUI.onOK} [options.onOK] - function called when the participant presses the OK button
	 * @param {boolean} [options.showCancel=false] - whether to show the Cancel button
	 * @param {GUI.onCancel} [options.onCancel] - function called when the participant presses the Cancel button
	 */
	dialog({
		message,
		warning,
		error,
		showOK = true,
		onOK,
		showCancel = false,
		onCancel
	} = {})
	{
		// close the previously opened dialog box, if there is one:
		this.closeDialog();

		// prepare the markup for the a11y-dialog:
		let markup = "<div class='dialog-container' id='experiment-dialog' aria-hidden='true' role='alertdialog'>";
		markup += "<div class='dialog-overlay'></div>";
		markup += "<div class='dialog-content'>";

		// we are displaying an error:
		if (typeof error !== "undefined")
		{
			this._psychoJS.logger.fatal(util.toString(error));

			// deal with null error:
			if (!error)
			{
				error = "Unspecified JavaScript error";
			}

			// go through the error stack and look for errorCode if there is one:
			let errorCode = null;
			let stackCode = "<ul>";
			while (true)
			{
				if (typeof error === "object" && "errorCode" in error)
				{
					errorCode = error.errorCode;
				}

				if (typeof error === "object" && "context" in error)
				{
					stackCode += "<li>" + error.context + "</li>";
					error = error.error;
				}
				else
				{
					// limit the size of the error:
					if (error.length >= 1000)
					{
						error = error.substring(1, 1000);
					}

					stackCode += "<li><b>" + error + "</b></li>";
					break;
				}
			}
			stackCode += "</ul>";

			// if we found an errorCode, we replace the stack-based message by a more user-friendly one:
			if (errorCode)
			{
				const error = this._userFriendlyError(errorCode);
				markup += `<div id='experiment-dialog-title' class='dialog-title ${error.class}'><p>${error.title}</p></div>`;
				markup += "<div class='scrollable-container'>";
				markup += `<p>${error.text}</p>`;
				markup += "</div>";
			}
			else
			{
				markup += `<div id='experiment-dialog-title' class='dialog-title dialog-error'><p>Error</p></div>`;
				markup += "<div class='scrollable-container'>";
				markup += `<p>Unfortunately we encountered the following error:</p>`;
				markup += stackCode;
				markup += "<p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>";
				markup += "</div>";
			}
		}

		// we are displaying a warning:
		else if (typeof warning !== "undefined")
		{
			markup += `<div id='experiment-dialog-title' class='dialog-title dialog-warning'><p>Warning</p></div>`;
			markup += "<div class='scrollable-container'>";
			markup += `<p>${warning}</p>`;
			markup += "</div>";
		}

		// we are displaying a message:
		else if (typeof message !== "undefined")
		{
			markup += "<div id='experiment-dialog-title' class='dialog-title'><p>Message</p></div>";
			markup += "<div class='scrollable-container'>";
			markup += `<p>${message}</p>`;
			markup += "</div>";
		}

		if (showOK || showCancel)
		{
			markup += "<hr>";
		}
		if (showCancel || showOK)
		{
			markup += "<div class='button-group'>";
			if (showCancel)
			{
				markup += "<button id='dialogCancel' class='dialog-button' aria-label='Close dialog'>Cancel</button>";
			}
			if (showOK)
			{
				markup += "<button id='dialogOK' class='dialog-button' aria-label='Close dialog'>Ok</button>";
			}
			markup += "</div>"; // button-group
		}
		markup += "</div></div>";

		// replace root by the markup code:
		const dialogElement = document.getElementById("root");
		dialogElement.innerHTML = markup;

		// init and open the dialog box:
		const dialogDiv = document.getElementById("experiment-dialog");
		this._dialog = new A11yDialog(dialogDiv);
		this._dialog.show();

		// button callbacks:
		if (showOK)
		{
			this._okButton = document.getElementById("dialogOK");
			this._okButton.onclick = () =>
			{
				this.closeDialog();

				// execute callback function:
				if (typeof onOK !== "undefined")
				{
					onOK();
				}
			};
		}
		if (showCancel)
		{
			this._cancelButton = document.getElementById("dialogCancel");
			this._cancelButton.onclick = () =>
			{
				this.closeDialog();

				// execute callback function:
				if (typeof onCancel !== "undefined")
				{
					onCancel();
				}
			};
		}
	}

	/**
	 * <p>Create a dialog box with a progress bar, to inform the participant of
	 * the last stages of the experiment: upload of results, of log, and closing
	 * of session.</p>
	 *
	 * @param {Object} options
	 * @param {String} [options.text] - information text
	 */
	finishDialog({ text = "", nbSteps = 0 })
	{
		this.closeDialog();

		// prepare the markup for the a11y-dialog:
		let markup = "<div class='dialog-container' id='experiment-dialog' aria-hidden='true' role='alertdialog'>";
		markup += "<div class='dialog-overlay'></div>";
		markup += "<div class='dialog-content'>";
		markup += `<div id='experiment-dialog-title' class='dialog-title dialog-warning'><p>Warning</p></div>`;
		markup += `<p>${text}</p>`;

		// progress bar:
		markup += `<hr><div id='progressMsg' class='progress-msg'>&nbsp;</div>`;
		markup += "<div class='progress-container'><div id='progressBar' class='progress-bar'></div></div>";

		markup += "</div></div>";

		// replace root by the markup code:
		const dialogElement = document.getElementById("root");
		dialogElement.innerHTML = markup;

		// init and open the dialog box:
		const dialogDiv = document.getElementById("experiment-dialog");
		this._dialog = new A11yDialog(dialogDiv);
		this._dialog.show();

		this._progressMsg = document.getElementById("progressMsg");
		this._progressBar = document.getElementById("progressBar");

		this._progressMessage = "&nbsp;";
		this._progressBarCurrentValue = 0;
		this._progressBarMax = nbSteps;
		this._updateProgressBar();
	}

	finishDialogNextStep(text)
	{
		this._setProgressMessage(text);
		++ this._progressBarCurrentValue;
		this._updateProgressBar();
	}

	/**
	 * Close the previously opened dialog box, if there is one.
	 */
	closeDialog()
	{
		if (this._dialog)
		{
			this._dialog.hide();
		}
	}

	/**
	 * Set the progress message.
	 *
	 * @protected
	 * @param {string} message	the message
	 */
	_setProgressMessage(message)
	{
		this._progressMessage = message;
		if (typeof this._progressMsg !== "undefined")
		{
			this._progressMsg.innerText = message;
		}
	}

	/**
	 * Update the progress bar.
	 *
	 * @protected
	 */
	_updateProgressBar()
	{
		if (typeof this._progressBar !== "undefined")
		{
			this._progressBar.style.width = `${Math.round(this._progressBarCurrentValue * 100.0 / this._progressBarMax)}%`;
		}
	}

	/**
	 * Callback triggered when the participant presses the Cancel button
	 *
	 * @protected
	 */
	_onCancelExperiment()
	{
		this._dialogComponent.button = "Cancel";

		this._dialog.hide();
		this._dialog = null;
		this._dialogComponent.status = PsychoJS.Status.FINISHED;
	}

	/**
	 * Callback triggered when the participant presses the OK button
	 *
	 * @protected
	 */
	_onStartExperiment()
	{
		this._dialogComponent.button = "OK";

		// update the dictionary:
		Object.keys(this._dictionary).forEach((key, keyIdx) =>
		{
			const input = document.getElementById("form-input-" + keyIdx);
			if (input)
			{
				this._dictionary[key] = input.value;
			}
		});


		// Start Tone here, since a user action is required to initiate the audio context:
		Tone.start();

		// switch to full screen if requested:
		this._psychoJS.window.adjustScreenSize();

		// clear all events (and keypresses) accumulated until now:
		this._psychoJS.eventManager.clearEvents();

		this._dialog.hide();
		this._dialog = null;
		this._dialogComponent.status = PsychoJS.Status.FINISHED;
	}

	/**
	 * Callback triggered upon a resource event from the [Server Manager]{@link module:core.ServerManager}.
	 *
	 * @protected
	 * @param {Object.<string, string|Symbol>} signal - the ServerManager's signal
	 */
	_onResourceEvents(signal)
	{
		this._psychoJS.logger.debug("signal: " + util.toString(signal));

		// the download of the specified resources has started:
		if (signal.message === ServerManager.Event.DOWNLOADING_RESOURCES)
		{
			// for each resource, we have a 'downloading resource' and a 'resource downloaded' message:
			this._progressBarMax = signal.count * 2;
			this._progressBarCurrentValue = 0;
			this._updateProgressBar();
		}
		// all the resources have been downloaded: show the ok button
		else if (signal.message === ServerManager.Event.DOWNLOAD_COMPLETED)
		{
			this._allResourcesDownloaded = true;
			this._progressBarMax = 100;
			this._progressBarCurrentValue = 100;
			this._updateProgressBar();
			this._setProgressMessage("all resources downloaded.");

			this._updateDialog();
		}
		// update progress bar:
		else if (
			signal.message === ServerManager.Event.DOWNLOADING_RESOURCE
			|| signal.message === ServerManager.Event.RESOURCE_DOWNLOADED
		)
		{
			if (typeof this._progressBarCurrentValue === "undefined")
			{
				this._progressBarCurrentValue = 0;
			}
			++this._progressBarCurrentValue;

			if (signal.message === ServerManager.Event.RESOURCE_DOWNLOADED)
			{
				this._setProgressMessage(`downloaded ${this._progressBarCurrentValue / 2}  / ${this._progressBarMax / 2}`);
			}
			else
			{
				this._setProgressMessage(`downloading ${this._progressBarCurrentValue / 2}  / ${this._progressBarMax / 2}`);
			}

			this._updateProgressBar();
		}
		// unknown message: we just display it
		else
		{
			this._progressMsg.innerHTML = signal.message;
		}
	}

	/**
	 * Update the dialog box.
	 *
	 * @protected
	 * @param [changeOKButtonFocus = false] - whether to change the focus to the OK button
	 */
	_updateDialog(changeOKButtonFocus = true)
	{
		const allRequirementsFulfilled = this._allResourcesDownloaded
			&& (this._setRequiredKeys && this._setRequiredKeys.size >= this._requiredKeys.length);

		// if the participant is required to click on the OK button:
		if (this._requireParticipantClick)
		{
			if (typeof this._okButton !== "undefined")
			{
				// locally the OK button is always enabled, otherwise only if all requirements have been fulfilled:
				if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.LOCAL || allRequirementsFulfilled)
				{
					this._okButton.classList.add("dialog-button");
					this._okButton.classList.remove("disabled");
					if (changeOKButtonFocus)
					{
						this._okButton.focus();
					}
				}
				else
				{
					this._okButton.classList.add("dialog-button", "disabled");
				}
			}

			return;
		}


		// if all requirements are fulfilled and the participant is not required to click on the OK button,
		// then we close the dialog box and move on with the experiment:
		if (allRequirementsFulfilled)
		{
			this._onStartExperiment();
		}
	}

	/**
	 * Callback triggered upon change event (for required keys).
	 *
	 * @protected
	 * @param {module:core.GUI} gui - this GUI
	 * @param {Event} event - the key's event
	 */
	static _onKeyChange(gui, event)
	{
		const element = event.target;
		const value = element.value;

		if (typeof value !== "undefined" && value.length > 0)
		{
			gui._setRequiredKeys.set(event.target, true);
		}
		else
		{
			gui._setRequiredKeys.delete(event.target);
		}

		gui._updateDialog(false);
	}

	/**
	 * Get the user-friendly html message associated to a pavlovia.or server error code.
	 *
	 * @protected
	 * @param {number} errorCode - the pavlovia.org server error code
	 * @return {{class: string, title: string, text: string}} a user-friendly error message
	 */
	_userFriendlyError(errorCode)
	{
		switch (errorCode)
		{
			// INTERNAL_ERROR
			case 1:
				return {
					class: "dialog-error",
					title: "Error",
					text: "<p>Oops we encountered an <strong>internal server error</strong>.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>"
				};

			// MONGODB_ERROR
			case 2:
				return {
					class: "dialog-error",
					title: "Error",
					text: "<p>Oops we encountered a <strong>database error</strong>.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>"
				};

			// STATUS_NONE
			case 20:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> does not have any status and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p>`
				};

			// STATUS_INACTIVE
			case 21:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is currently inactive and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the status must be changed to RUNNING for participants to be able to run it.</p>`
				};

			// STATUS_DELETED
			case 22:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> has been deleted and cannot be run.</p><p>If you are the experiment designer, either go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING, or generate a new experiment.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been deleted and cannot be run any longer.</p>`
				};

			// STATUS_ARCHIVED
			case 23:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> has been archived and cannot be run.</p><p>If you are the experiment designer, go to your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a> and change the experiment status to either PILOTING or RUNNING.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment has been archived and cannot be run at the moment.</p>`
				};

			// PILOTING_NO_TOKEN
			case 30:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is currently in PILOTING mode but the pilot token is missing from the URL.</p><p>If you are the experiment designer, you can pilot it by pressing the pilot button on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p>`
				};

			// PILOTING_INVALID_TOKEN
			case 31:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> cannot be run because the pilot token in the URL is invalid, possibly because it has expired.</p><p>If you are the experiment designer, you can generate a new token by pressing the pilot button on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment status must be changed to RUNNING for participants to be able to run it.</p>`
				};

			// LICENSE_EXPIRED
			case 50:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is covered by a license that has expired. </p><p>If you are the experiment designer, you can either contact the license manager to inquire about the expiration, or you can run your experiments using credits. You will find all relevant details about the license on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>, where you will also be able to change its running mode to CREDIT.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license having expired.</p>`
				};

			// LICENSE_APPROVAL_NEEDED
			case 51:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> is covered by a license that requires one or more documents to be approved before the experiment can be run. </p><p>If you are the experiment designer, please contact the license manager and ask him or her which documents must be approved. You will find all relevant details about the license on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that there is an issue with the experiment's license requiring documents to be approved.</p>`
				};

			// CREDIT_NOT_ENOUGH
			case 60:
				return {
					class: "dialog-warning",
					title: "Warning",
					text: `<p><strong>${this._psychoJS.config.experiment.fullpath}</strong> does not have any assigned credit left and cannot be run.</p><p>If you are the experiment designer, you can assign more credits to it on your <a href="https://pavlovia.org/${this._psychoJS.config.experiment.fullpath}">experiment page</a>.</p><p>Otherwise please contact the experiment designer to let him or her know that the experiment requires more assigned credits to run.</p>`
				};

			default:
				return {
					class: "dialog-error",
					title: "Error",
					text:	`<p>Unfortunately we encountered an unspecified error (error code: ${errorCode}.</p><p>Try to run the experiment again. If the error persists, contact the experiment designer.</p>`
				};
		}
	}
}

