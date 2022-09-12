/**
 * Survey Stimulus.
 *
 * @author Alain Pitiot
 * @version 2022.3
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { VisualStim } from "./VisualStim.js";
import {PsychoJS} from "../core/PsychoJS.js";
import * as util from "../util/Util.js";
import {ExperimentHandler} from "../data/index.js";

/**
 * Survey Stimulus.
 *
 * @extends VisualStim
 */
export class Survey extends VisualStim
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {string} [options.surveyId] - the survey id
	 * @param {Object | string} [options.model] - the survey model
	 * @param {Object[] | string} [options.items] - the survey items
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered survey
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {boolean} [options.autoDraw= false] - whether  the stimulus should be automatically drawn
	 * 	on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether to log
	 */
	constructor({ name, win, items, model, surveyId, pos, units, ori, size, depth, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, depth, pos, size, autoDraw, autoLog });

		this._addAttribute(
			"items",
			items
		);
		this._addAttribute(
			"model",
			model
		);

		// the default surveyId is an uuid based on the experiment id (or name) and the survey name:
		// this way, it is always the same within a given experiment
		this._hasSelfGeneratedSurveyId = (typeof surveyId === "undefined");
		const defaultSurveyId = (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER) ?
			util.makeUuid(`${name}@${this._psychoJS.config.gitlab.projectId}`) :
			util.makeUuid(`${name}@${this._psychoJS.config.experiment.name}`);
		this._addAttribute(
			"surveyId",
			surveyId,
			defaultSurveyId
		);

		// whether the user is done with the survey (completed or not):
		this.isFinished = false;
		// whether the user completed the survey:
		this.isCompleted = false;

		// estimate the bounding box:
		this._estimateBoundingBox();

		// load the Survey.js libraries, if necessary:
		// TODO

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	/**
	 * Setter for the items attribute.
	 *
	 * @param {Object[] | string} items - the form items
	 * @param {boolean} [log= false] - whether of not to log
	 * @return {void}
	 *
	 * @todo this is the old approach, which need to be retrofitted for SurveyJS
	 */
	setItems(items, log = false)
	{
		const response = {
			origin: "Survey.setItems",
			context: `when setting the items of Survey: ${this._name}`,
		};

		try
		{
			// items is undefined: that's fine but we raise a warning in case this is a symptom of an actual problem
			if (typeof items === "undefined")
			{
				this.psychoJS.logger.warn(`setting the items of Survey: ${this._name} with argument: undefined.`);
				this.psychoJS.logger.debug(`set the items of Survey: ${this._name} as: undefined`);
			}
			else
			{
				// items is a string: it should be the name of a resource, which we load
				if (typeof items === "string")
				{
					items = this.psychoJS.serverManager.getResource(items);
				}

				// items should now be an array of objects:
				if (!Array.isArray(items))
				{
					throw "items is neither the name of a resource nor an array";
				}

				this._processItems();
				this._setAttribute("items", items, log);
				this._onChange(true, true)();
			}
		}
		catch (error)
		{
			throw { ...response, error };
		}
	}

	/**
	 * Setter for the model attribute.
	 *
	 * @param {Object | string} model - the survey model
	 * @param {boolean} [log= false] - whether to log
	 * @return {void}
	 */
	setModel(model, log = false)
	{
		const response = {
			origin: "Survey.setModel",
			context: `when setting the model of Survey: ${this._name}`,
		};

		try
		{
			// model is undefined: that's fine, but we raise a warning in case this is a symptom of an actual problem
			if (typeof model === "undefined")
			{
				this.psychoJS.logger.warn(`setting the model of Survey: ${this._name} with argument: undefined.`);
				this.psychoJS.logger.debug(`set the model of Survey: ${this._name} as: undefined`);
			}
			else
			{
				// model is a string: it should be the name of a resource, which we load
				if (typeof model === "string")
				{
					const encodedModel = this.psychoJS.serverManager.getResource(model);
					const decodedModel = new TextDecoder("utf-8").decode(encodedModel);
					model = JSON.parse(decodedModel);
				}

				// items should now be an object:
				if (typeof model !== "object")
				{
					throw "model is neither the name of a resource nor an object";
				}

				this._surveyModelJson = Object.assign({}, model);
				this._surveyModel = new window.Survey.Model(this._surveyModelJson);

				// when the participant is done with the survey:
				this._surveyModel.onComplete.add(() =>
				{
					// note: status is now set by the generated code
					// this.status = PsychoJS.Status.FINISHED;
					this.isFinished = true;

					// check whether the survey was completed:
					const surveyVisibleQuestions = this._surveyModel.getAllQuestions(true);
					const nbAnsweredQuestion = surveyVisibleQuestions.reduce(
						(count, question) => count + (!question.isEmpty() ? 1 : 0),
						0
					);
					this.isCompleted = (nbAnsweredQuestion === surveyVisibleQuestions.length);
				});

				this._setAttribute("model", model, log);
				this._onChange(true, true)();
			}
		}
		catch (error)
		{
			throw { ...response, error };
		}
	}

	/**
	 * Setter for the surveyId attribute.
	 *
	 * @param {string} surveyId - the survey Id
	 * @param {boolean} [log= false] - whether to log
	 * @return {void}
	 */
	setSurveyId(surveyId, log = false)
	{
		this._setAttribute("surveyId", surveyId, log);
		if (!this._hasSelfGeneratedSurveyId)
		{
			this.setModel(`${surveyId}.sid`, log);
		}
	}

	/**
	 * Get the survey response.
	 */
	getResponse()
	{
		if (typeof this._surveyModel === "undefined")
		{
			return {};
		}

		return this._surveyModel.data;
	}

	/**
	 * Upload the survey response to the pavlovia.org server.
	 *
	 * @returns {Promise<ServerManager.UploadDataPromise>} a promise resolved when the survey response has been saved
	 */
	save()
	{
		this._psychoJS.logger.info("[PsychoJS] Save survey response.");

		const response = this.getResponse();

		// if the response cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the response as a file for download:
		if (this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER ||
			this._psychoJS.config.experiment.status !== "RUNNING" ||
			this._psychoJS._serverMsg.has("__pilotToken"))
		{
			const filename = `survey_${this._surveyId}.json`;
			const blob = new Blob([JSON.stringify(response)], { type: "application/json" });

			const anchor = document.createElement("a");
			anchor.href = window.URL.createObjectURL(blob);
			anchor.download = filename;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);

			return Promise.resolve({});
		}

		// otherwise, we do upload the survey response
		// note: if the surveyId was self-generated instead of being a parameter of the constructor,
		// we need to also upload the survey model, as a new survey might need to be created on the fly
		// by the server for this experiment.
		if (!this._hasSelfGeneratedSurveyId)
		{
			return this._psychoJS.serverManager.uploadSurveyResponse(
				this._surveyId, response, this.isCompleted
			);
		}
		else
		{
			return this._psychoJS.serverManager.uploadSurveyResponse(
				this._surveyId, response, this.isCompleted, this._surveyModelJson
			);
		}
	}

	/**
	 * Hide this stimulus on the next frame draw.
	 *
	 * @override
	 * @note We over-ride MinimalStim.hide such that we can remove the survey DOM element
	 */
	hide()
	{
		// if a survey div already does not exist already, create it:
		const surveyId = `survey-${this._name}`;
		const surveyDiv = document.getElementById(surveyId);
		if (surveyDiv !== null)
		{
			document.body.removeChild(surveyDiv);
		}

		super.hide();
	}


	/**
	 * Process the items: check the syntax, turn them into a survey model.
	 *
	 * @protected
	 * @return {void}
	 */
	_processItems()
	{
		const response = {
			origin: "Survey._processItems",
			context: "when processing the form items",
		};

		try
		{
			if (this._autoLog)
			{
				// note: we use the same log message as PsychoPy even though we called this method differently
				this._psychoJS.experimentLogger.exp("Importing items...");
			}

			// TODO
			/*
			// import the items:
			this._importItems();

			// sanitize the items (check that keys are valid, fill in default values):
			this._sanitizeItems();

			// randomise the items if need be:
			if (this._randomize)
			{
				util.shuffle(this._items);
			}
*/

			this._surveyModelJson = {
				elements: [{
					name: "FirstName",
					title: "First name:",
					type: "text"
				}, {
					name: "LastName",
					title: "Last name:",
					type: "text"
				}],
				showCompletedPage: false
			};
			this._surveyModel = new Survey.Model(this._surveyModelJson);

			// when the participant has completed the survey, the Survey status changes to FINISHED:
			this._surveyModel.onComplete.add(() =>
			{
				this.status = PsychoJS.Status.FINISHED;
			});
		}
		catch (error)
		{
			throw { ...response, error };
		}
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - this._size[0] / 2,
			this._pos[1] - this._size[1] / 2,
			this._size[0],
			this._size[1],
		);

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		// update the PIXI representation, if need be:
		if (this._needPixiUpdate)
		{
			this._needPixiUpdate = false;

			// if a survey div already does not exist already, create it:
			const surveyId = `survey-${this._name}`;
			let surveyDiv = document.getElementById(surveyId);
			if (surveyDiv === null)
			{
				surveyDiv = document.createElement("div");
				surveyDiv.id = surveyId;
				document.body.appendChild(surveyDiv);
			}

			// start the survey:
			if (typeof this._surveyModel !== "undefined")
			{
				jQuery(`#${surveyId}`).Survey({model: this._surveyModel});
			}
		}

		// TODO change the position, scale, anchor, z-index, etc.
		// TODO update the size, taking into account the actual size of the survey
		/*
		this._pixi.zIndex = -this._depth;
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this.win);
		const scaleX = size_px[0] / this._texture.width;
		const scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;
*/
	}
}
