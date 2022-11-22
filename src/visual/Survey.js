/**
 * Survey Stimulus.
 *
 * @author Alain Pitiot and Nikita Agafonov
 * @version 2022.3
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { VisualStim } from "./VisualStim.js";
import {PsychoJS} from "../core/PsychoJS.js";
import * as util from "../util/Util.js";
import {Clock} from "../util/Clock.js";
import {ExperimentHandler} from "../data/ExperimentHandler.js";

// PsychoJS SurveyJS extensions:
import registerSelectBoxWidget from "./survey/widgets/SelectBox.js";
import registerSliderWidget from "./survey/widgets/SliderWidget.js";
import registerSideBySideMatrix from "./survey/widgets/SideBySideMatrix.js";
import registerMaxDiffMatrix from "./survey/widgets/MaxDiffMatrix.js";
import registerSliderStar from "./survey/widgets/SliderStar.js";
import MatrixBipolar from "./survey/components/MatrixBipolar.js";


/**
 * Survey Stimulus.
 *
 * @extends VisualStim
 */
export class Survey extends VisualStim
{
	static SURVEY_EXPERIMENT_PARAMETERS = ["surveyId", "showStartDialog", "showEndDialog", "completionUrl", "cancellationUrl", "quitOnEsc"];

	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {string} [options.surveyId] - the survey id
	 * @param {Object | string} [options.model] - the survey model
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered survey
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {boolean} [options.autoDraw= false] - whether  the stimulus should be automatically drawn
	 * 	on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether to log
	 */
	constructor({ name, win, model, surveyId, pos, units, ori, size, depth, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, depth, pos, size, autoDraw, autoLog });

		// init SurveyJS
		this._initSurveyJS();

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

		// whether the user is done with the survey, independently of whether the survey is completed:
		this.isFinished = false;
		// whether the user completed the survey, i.e. answered all the questions:
		this.isCompleted = false;
		// timestamps associated to each question:
		this._questionAnswerTimestamps = {};
		// timestamps clock:
		this._questionAnswerTimestampClock = new Clock();
		// callback triggered when the user is done with the survey: nothing to do by default
		this._onFinishedCallback = () => {};

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
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
				this._surveyModel.isInitialized = false;

				// custom css:
				// see https://surveyjs.io/form-library/examples/survey-cssclasses/jquery#content-js

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
	 * Set survey variables.
	 *
	 * @param {Object} variables - an object with a number of variable name/variable value pairs
	 * @param {string[]} [excludedNames={}] - excluded variable names
	 * @return {void}
	 */
	setVariables(variables, excludedNames)
	{
		// filter the variables and set them:
		const filteredVariables = {};
		for (const name in variables)
		{
			if (excludedNames.indexOf(name) === -1)
			{
				filteredVariables[name] = variables[name];
				this._surveyModel.setVariable(name, variables[name]);
			}
		}

		// set the values:
		this._surveyModel.mergeData(filteredVariables);
	}

	/**
	 * Evaluate an expression, taking into account the survey responses.
	 *
	 * @param {string} expression - the expression to evaluate
	 * @returns {any} the evaluated expression
	 */
	evaluateExpression(expression)
	{
		if (typeof expression === "undefined" || typeof this._surveyModel === "undefined")
		{
			return undefined;
		}

		// modify the expression when it is a simple URL, without variables
		// i.e. when there is no quote and no brackets
		if (expression.indexOf("'") === -1 && expression.indexOf("{") === -1)
		{
			expression = `'${expression}'`;
		}

		return this._surveyModel.runExpression(expression);
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
	 * Add a callback that will be triggered when the participant finishes the survey.
	 *
	 * @param callback - callback triggered when the participant finishes the survey
	 * @return {void}
	 */
	onFinished(callback)
	{
		if (typeof this._surveyModel === "undefined")
		{
			throw {
				origin: "Survey.onFinished",
				context: "when setting a callback triggered when the participant finishes the survey",
				error: "the survey does not have a model"
			};
		}

		// note: we cannot simply add the callback to surveyModel.onComplete since we first need
		// to run _onSurveyComplete in order to collect data, estimate whether the survey is complete, etc.
		if (typeof callback === "function")
		{
			this._onFinishedCallback = callback;
		}
		// this._surveyModel.onComplete.add(callback);
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
	 * @returns {Promise<ServerManager.UploadDataPromise>} a promise resolved when the survey response
	 * 	has been saved
	 */
	save()
	{
		this._psychoJS.logger.info("[PsychoJS] Save survey response.");

		// get the survey response and complement it with experimentInfo fields:
		const response = this.getResponse();
		for (const field in this.psychoJS.experiment.extraInfo)
		{
			if (Survey.SURVEY_EXPERIMENT_PARAMETERS.indexOf(field) === -1)
			{
				response[field] = this.psychoJS.experiment.extraInfo[field];
			}
		}

		// add timing information:
		for (const question in this._questionAnswerTimestamps)
		{
			response[`${question}_rt`] = this._questionAnswerTimestamps[question].timestamp;
		}

		// sort the questions and question response times alphabetically:
		const sortedResponses = Object.keys(response).sort().reduce( (sorted, key) =>
			{
				sorted[key] = response[key];
				return sorted;
			},
			{}
		);


		// if the response cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the response as a file for download:
		if (this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER ||
			this._psychoJS.config.experiment.status !== "RUNNING" ||
			this._psychoJS._serverMsg.has("__pilotToken"))
		{
			const filename = `survey_${this._surveyId}.json`;
			const blob = new Blob([JSON.stringify(sortedResponses)], { type: "application/json" });

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
				this._surveyId, sortedResponses, this.isCompleted
			);
		}
		else
		{
			return this._psychoJS.serverManager.uploadSurveyResponse(
				this._surveyId, sortedResponses, this.isCompleted, this._surveyModelJson
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
			const surveyId = "_survey";
			let surveyDiv = document.getElementById(surveyId);
			if (surveyDiv === null)
			{
				surveyDiv = document.createElement("div");
				surveyDiv.id = surveyId;
				surveyDiv.className = "survey";
				document.body.appendChild(surveyDiv);
			}

			// start the survey:
			if (typeof this._surveyModel !== "undefined")
			{
				this._startSurvey(surveyId, this._surveyModel);
				// jQuery(`#${surveyId}`).Survey({model: this._surveyModel});
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

	/**
	 * Init the SurveyJS.io library.
	 *
	 * @protected
	 */
	_initSurveyJS()
	{
		// load the Survey.js libraries, if necessary:
		// TODO

		// setup the survey theme:
		window.Survey.StylesManager.applyTheme("defaultV2");

		// load the PsychoJS SurveyJS extensions:
		this._expressionsRunner = new window.Survey.ExpressionRunner();
		this._registerWidgets();
		this._registerCustomSurveyProperties();

		// load the desired style:
		// TODO
		// util.loadCss("./survey/css/grey_style.css");
	}

	/**
	 * Register SurveyJS widgets.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerWidgets()
	{
		registerSelectBoxWidget(window.Survey);
		registerSliderWidget(window.Survey);
		registerSideBySideMatrix(window.Survey);
		registerMaxDiffMatrix(window.Survey);
		registerSliderStar(window.Survey);

		// load the widget style:
		// TODO
		// util.loadCss("./survey/css/widgets.css");
	}

	_registerCustomSurveyProperties()
	{
		MatrixBipolar.registerSurveyProperties(window.Survey);
	}

	_registerCustomComponentCallbacks(surveyModel)
	{
		MatrixBipolar.registerModelCallbacks(surveyModel);
	}

	/**
	 * Run the survey using flow data provided. This method runs recursively.
	 *
	 * @protected
	 * @param {string} surveyId - the id of the DOM div
	 * @param {Object} surveyData - surveyData / model.
	 * @param {Object} prevBlockResults - survey results gathered from running previous block of questions.
	 * @return {void}
	 */
	_startSurvey(surveyId, surveyData, prevBlockResults = {})
	{
		// initialise the survey model is need be:
		if (!this._surveyModel.isInitialized)
		{
			this._registerCustomComponentCallbacks(this._surveyModel);
			this._surveyModel.onValueChanged.add(this._onQuestionValueChanged.bind(this));
			this._surveyModel.onCurrentPageChanging.add(this._onCurrentPageChanging.bind(this));
			this._surveyModel.onTextMarkdown.add(this._onTextMarkdown.bind(this));
			this._surveyModel.onComplete.add(this._onSurveyComplete.bind(this));
			this._surveyModel.isInitialized = true;
		}

		jQuery(`#${surveyId}`).Survey({
			model: this._surveyModel,
			showItemsInOrder: "column"
		});

		this._questionAnswerTimestampClock.reset();
	}

	/**
	 * Callback triggered whenever the participant answer a question.
	 *
	 * @param survey
	 * @param questionData
	 * @protected
	 */
	_onQuestionValueChanged(survey, questionData)
	{
		if (typeof this._questionAnswerTimestamps[questionData.name] === "undefined")
		{
			this._questionAnswerTimestamps[questionData.name] = {
				timestamp: 0
			};
		}
		this._questionAnswerTimestamps[questionData.name].timestamp = this._questionAnswerTimestampClock.getTime();
	}

	/**
	 * Callback triggered when the participant changed the page.
	 *
	 * @protected
	 */
	_onCurrentPageChanging()
	{
		// console.log(arguments);
	}

	_onTextMarkdown(survey, options)
	{
		// TODO add sanitization / checks if required.
		options.html = options.text;
	}

	/**
	 * Callback triggered when the participant is done with the survey, i.e. when the
	 * [Complete] button as been pressed.
	 *
	 * @param surveyModel
	 * @param options
	 * @private
	 */
	_onSurveyComplete(surveyModel, options)
	{
		this.isFinished = true;

		// check whether the survey was completed:
		const surveyVisibleQuestions = this._surveyModel.getAllQuestions(true);
		const nbAnsweredQuestions = surveyVisibleQuestions.reduce(
			(count, question) =>
			{
				// note: the response of a html, ranking, checkbox, or comment question is empty if the user
				// did not interact with it
				const type = question.getType();
				if (type === "html" ||
					type === "ranking" ||
					type === "checkbox" ||
					type === "comment" ||
					!question.isEmpty())
				{
					return count + 1;
				}
				else
				{
					return count;
				}
			},
			0
		);
		this.isCompleted = (nbAnsweredQuestions === surveyVisibleQuestions.length);

		this._onFinishedCallback();
	}

}
