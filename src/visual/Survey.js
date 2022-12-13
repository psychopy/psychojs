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
import DropdownExtensions from "./survey/components/DropdownExtensions.js";
import customExpressionFunctionsArray from "./survey/extensions/customExpressionFunctions.js";

const CAPTIONS = {
	NEXT: "Next"
};

const SURVEY_SETTINGS = {
	minWidth: "100px"
};

const SURVEY_COMPLETION_CODES =
{
	NORMAL: 0,
	SKIP_TO_END_OF_BLOCK: 1,
	SKIP_TO_END_OF_SURVEY: 2
};

/**
 * Survey Stimulus.
 *
 * @extends VisualStim
 */
export class Survey extends VisualStim
{
	static SURVEY_EXPERIMENT_PARAMETERS = ["surveyId", "showStartDialog", "showEndDialog", "completionUrl", "cancellationUrl", "quitOnEsc"];

	static SURVEY_FLOW_PLAYBACK_TYPES =
	{
		DIRECT: "QUESTION_BLOCK",
		CONDITIONAL: "IF_THEN_ELSE_GROUP",
		EMBEDDED_DATA: "VARIABLES",
		RANDOMIZER: "RANDOM_GROUP",
		SEQUENTIAL: "SEQUENTIAL_GROUP",
		ENDSURVEY: "END"
	};

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

		// the default surveyId is an uuid based on the experiment id (or name) and the survey name:
		// this way, it is always the same within a given experiment
		this._hasSelfGeneratedSurveyId = (typeof surveyId === "undefined");
		const defaultSurveyId = (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER) ?
			util.makeUuid(`${name}@${this._psychoJS.config.gitlab.projectId}`) :
			util.makeUuid(`${name}@${this._psychoJS.config.experiment.name}`);

		// whether the user is done with the survey, independently of whether the survey is completed:
		this.isFinished = false;

		// Accumulated completion flag that is being set after completion of one survey node.
		// This flag allows to track completion progress while moving through the survey flow.
		// Initially set to true and will be flipped if at least one of the survey nodes were not fully completed.
		this._isCompletedAll = true;

		// timestamps associated to each question:
		this._questionAnswerTimestamps = {};
		// timestamps clock:
		this._questionAnswerTimestampClock = new Clock();

		this._totalSurveyResults = {};
		this._surveyData = undefined;
		this._surveyModel = undefined;
		this._signaturePadRO = undefined;
		this._expressionsRunner = undefined;
		this._lastPageSwitchHandledIdx = -1;
		this._variables = {};

		this._surveyRunningPromise = undefined;
		this._surveyRunningPromiseResolve = undefined;
		this._surveyRunningPromiseReject = undefined;

		// callback triggered when the user is done with the survey: nothing to do by default
		this._onFinishedCallback = () => {};

		// init SurveyJS
		this._initSurveyJS();

		this._addAttribute(
			"model",
			model
		);
		this._addAttribute(
			"surveyId",
			surveyId,
			defaultSurveyId
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	get isCompleted ()
	{
		return this.isFinished && this._isCompletedAll;
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

				this._surveyData = model;
				// this._surveyData = SD;
				// this._surveyModel = new window.Survey.Model(this._surveyModelJson);
				// this._surveyModel.isInitialized = false;

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
		// const filteredVariables = {};
		// for (const name in variables)
		// {
		// 	if (excludedNames.indexOf(name) === -1)
		// 	{
		// 		filteredVariables[name] = variables[name];
		// 		this._surveyModel.setVariable(name, variables[name]);
		// 	}
		// }

		// // set the values:
		// this._surveyModel.mergeData(filteredVariables);

		for (const name in variables)
		{
			if (excludedNames.indexOf(name) === -1)
			{
				this._surveyData.variables[name] = variables[name];
			}
		}
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
		if (typeof this._surveyData === "undefined")
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
		// if (typeof this._surveyModel === "undefined")
		// {
		// 	return {};
		// }

		// return this._surveyModel.data;

		return this._totalSurveyResults;
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
				this._surveyId, sortedResponses, this.isCompleted, this._surveyData
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

			// if a survey div does not exist, create it:
			if (document.getElementById("_survey") === null)
			{
				document.body.insertAdjacentHTML("beforeend", "<div id='_survey' class='survey'></div>")
			}

			// start the survey flow:
			if (typeof this._surveyData !== "undefined")
			{
				// this._startSurvey(surveyId, this._surveyModel);
				// jQuery(`#${surveyId}`).Survey({model: this._surveyModel});

				this._runSurveyFlow(this._surveyData.surveyFlow, this._surveyData);
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
	 * Register custom SurveyJS expression functions.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerCustomExpressionFunctions (Survey, customFuncs = [])
	{
		let i;
		for (i = 0; i < customFuncs.length; i++)
		{
			Survey.FunctionFactory.Instance.register(customFuncs[i].func.name, customFuncs[i].func, customFuncs[i].isAsync);
		}
	}

	/**
	 * Register SurveyJS widgets.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerWidgets(Survey)
	{
		registerSelectBoxWidget(Survey);
		registerSliderWidget(Survey);
		registerSideBySideMatrix(Survey);
		registerMaxDiffMatrix(Survey);
		registerSliderStar(Survey);

		// load the widget style:
		// TODO
		// util.loadCss("./survey/css/widgets.css");
	}

	/**
	 * Register custom Survey properties. Usially these are relevant for different question types.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerCustomSurveyProperties(Survey)
	{
		MatrixBipolar.registerSurveyProperties(Survey);
		Survey.Serializer.addProperty("signaturepad", {
			name: "maxSignatureWidth",
			type: "number",
			default: 500
		});
	}

	_registerCustomComponentCallbacks(surveyModel)
	{
		MatrixBipolar.registerModelCallbacks(surveyModel);
		DropdownExtensions.registerModelCallbacks(surveyModel);
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

	// This probably needs to be moved to some kind of utils.js.
	// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	_FisherYatesShuffle (targetArray = [])
	{
		// Copying array to preserve initial data.
		const out = Array.from(targetArray);
		const len = targetArray.length;
		let i, j, k;
		for (i = len - 1; i >= 1; i--)
		{
			j = Math.floor(Math.random() * (i + 1));
			k = out[j];
			out[j] = out[i];
			out[i] = k;
		}

		return out;
	}

	// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	_InPlaceFisherYatesShuffle (inOutArray = [], startIdx, endIdx)
	{
		// Shuffling right in the input array.
		let i, j, k;
		for (i = endIdx; i >= startIdx; i--)
		{
			j = Math.floor(Math.random() * (i + 1));
			k = inOutArray[j];
			inOutArray[j] = inOutArray[i];
			inOutArray[i] = k;
		}

		return inOutArray;
	}

	_composeModelWithRandomizedQuestions (surveyModel, inBlockRandomizationSettings)
	{
		let t = performance.now();
		// Qualtrics's in-block randomization ignores presense of page breaks within the block.
		// Hence creating a fresh survey data object with shuffled question order.
		let questions = [];
		let questionsMap = {};
		let shuffledQuestions;
		let newSurveyModel =
		{
			pages:[{ elements: new Array(inBlockRandomizationSettings.questionsPerPage) }]
		};
		let i, j, k;
		for (i = 0; i < surveyModel.pages.length; i++)
		{
			for (j = 0; j < surveyModel.pages[i].elements.length; j++)
			{
				questions.push(surveyModel.pages[i].elements[j]);
				k = questions.length - 1;
				questionsMap[questions[k].name] = questions[k];
			}
		}

		if (inBlockRandomizationSettings.layout.length > 0)
		{
			j = 0;
			k = 0;
			let curPage = 0;
			let curElement = 0;
			const shuffledSet0 = this._FisherYatesShuffle(inBlockRandomizationSettings.set0);
			const shuffledSet1 = this._FisherYatesShuffle(inBlockRandomizationSettings.set1);
			for (i = 0; i < inBlockRandomizationSettings.layout.length; i++)
			{
				// Create new page if questionsPerPage reached.
				if (curElement === inBlockRandomizationSettings.questionsPerPage)
				{
					newSurveyModel.pages.push({ elements: new Array(inBlockRandomizationSettings.questionsPerPage) });
					curPage++;
					curElement = 0;
				}

				if (inBlockRandomizationSettings.layout[i] === "set0")
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[shuffledSet0[j]];
					j++;
				}
				else if (inBlockRandomizationSettings.layout[i] === "set1")
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[shuffledSet1[k]];
					k++;
				}
				else
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[inBlockRandomizationSettings.layout[i]];
				}
				curElement++;
			}
		}
		else if (inBlockRandomizationSettings.showOnly > 0)
		{
			// TODO: Check if there can be questionsPerPage applicable in this case.
			shuffledQuestions = this._FisherYatesShuffle(questions);
			newSurveyModel.pages[0].elements = shuffledQuestions.splice(0, inBlockRandomizationSettings.showOnly);
		}
		else {
			// TODO: Check if there can be questionsPerPage applicable in this case.
			newSurveyModel.pages[0].elements = this._FisherYatesShuffle(questions);
		}
		console.log("model recomposition took", performance.now() - t);
		console.log("recomposed model:", newSurveyModel);
		return newSurveyModel;
	}

	_applyInQuestionRandomization (questionData, inQuestionRandomizationSettings, surveyData)
	{
		let t = performance.now();
		let choicesFieldName;
		let valueFieldName;
		if (questionData.rows !== undefined)
		{
			choicesFieldName = "rows";
			valueFieldName = "value";
		}
		else if (questionData.choices !== undefined)
		{
			choicesFieldName = "choices";
			valueFieldName = "value";
		}
		else if (questionData.items !== undefined)
		{
			choicesFieldName = "items";
			valueFieldName = "name";
		}
		else
		{
			console.log("[Survey runner]: Uknown choicesFieldName for", questionData);
		}

		if (inQuestionRandomizationSettings.randomizeAll)
		{
			questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]);
			// Handle dynamic choices.
		}
		else if (inQuestionRandomizationSettings.showOnly > 0)
		{
			questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]).splice(0, inQuestionRandomizationSettings.showOnly);
		}
		else if (inQuestionRandomizationSettings.reverse)
		{
			questionData[choicesFieldName] = Math.round(Math.random()) === 1 ? questionData[choicesFieldName].reverse() : questionData[choicesFieldName];
		}
		else if (inQuestionRandomizationSettings.layout.length > 0)
		{
			const initialChoices = questionData[choicesFieldName];
			let choicesMap = {};
			// TODO: generalize further i.e. figure out how to calculate the length of array based on availability of sets.
			const setIndices = [0, 0, 0];
			let i;
			for (i = 0; i < questionData[choicesFieldName].length; i++)
			{
				choicesMap[questionData[choicesFieldName][i][valueFieldName]] = questionData[choicesFieldName][i];
			}

			// Creating new array of choices to which we're going to write from randomized/reversed sets.
			questionData[choicesFieldName] = new Array(inQuestionRandomizationSettings.layout.length);
			const shuffledSet0 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set0);
			const shuffledSet1 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set1);
			const reversedSet = Math.round(Math.random()) === 1 ? inQuestionRandomizationSettings.reverseOrder.reverse() : inQuestionRandomizationSettings.reverseOrder;
			for (i = 0; i < inQuestionRandomizationSettings.layout.length; i++)
			{
				if (inQuestionRandomizationSettings.layout[i] === "set0")
				{
					questionData[choicesFieldName][i] = choicesMap[shuffledSet0[ setIndices[0] ]];
					setIndices[0]++;
				}
				else if (inQuestionRandomizationSettings.layout[i] === "set1")
				{
					questionData[choicesFieldName][i] = choicesMap[shuffledSet1[ setIndices[1] ]];
					setIndices[1]++;
				}
				else if (inQuestionRandomizationSettings.layout[i] === "reverseOrder")
				{
					questionData[choicesFieldName][i] = choicesMap[reversedSet[ setIndices[2] ]];
					setIndices[2]++;
				}
				else
				{
					questionData[choicesFieldName][i] = choicesMap[inQuestionRandomizationSettings.layout[i]];
				}
			}

			if (inQuestionRandomizationSettings.layout.length < initialChoices.length)
			{
				// Compose unused choices set.
				// TODO: This is potentially how data loss can be avoided and thus no need to deepcopy model.
				if (surveyData.unusedChoices === undefined)
				{
					surveyData.unusedChoices = {};
				}
				surveyData.unusedChoices[questionData.name] = {
					// All other sets are always used entirely.
					set1: shuffledSet1.splice(setIndices[1], shuffledSet1.length)
				};
				console.log("unused choices", questionData.name, surveyData.unusedChoices[questionData.name]);
			}
		}

		console.log("applying question randomization took", performance.now() - t);
		// console.log(questionData);
	}

	/**
	 * @desc: Go over required surveyModelData and apply randomization settings.
	 */
	_processSurveyData (surveyData, surveyIdx)
	{
		let t = performance.now();
		let i, j;
		let newSurveyModel = undefined;
		if (surveyData.questionsOrderRandomization[surveyIdx] !== undefined)
		{
			// Qualtrics's in-block randomization ignores presense of page breaks within the block.
			// Hence creating a fresh survey data object with shuffled question order.
			newSurveyModel = this._composeModelWithRandomizedQuestions(surveyData.surveys[surveyIdx], surveyData.questionsOrderRandomization[surveyIdx]);
		}

		// Checking if there's in-question randomization that needs to be applied.
		for (i = 0; i < surveyData.surveys[surveyIdx].pages.length; i++)
		{
			for (j = 0; j < surveyData.surveys[surveyIdx].pages[i].elements.length; j++)
			{
				if (surveyData.inQuestionRandomization[surveyData.surveys[surveyIdx].pages[i].elements[j].name] !== undefined)
				{
					if (newSurveyModel === undefined)
					{
						// Marking a deep copy of survey model input data, to avoid data loss if randomization returns a subset of choices.
						// TODO: think of somehting more optimal.
						newSurveyModel = JSON.parse(JSON.stringify(surveyData.surveys[surveyIdx]));
					}
					this._applyInQuestionRandomization(
						newSurveyModel.pages[i].elements[j],
						surveyData.inQuestionRandomization[newSurveyModel.pages[i].elements[j].name],
						surveyData
					);
				}
			}
		}

		if (newSurveyModel === undefined)
		{
			// No changes were made, just return original data.
			newSurveyModel = surveyData.surveys[surveyIdx];
		}
		console.log("survey model preprocessing took", performance.now() - t);
		return newSurveyModel;
	}

	/**
	 * Callback triggered when the participant changed the page.
	 *
	 * @protected
	 */
	_onCurrentPageChanging (surveyModel, options)
	{
		if (this._lastPageSwitchHandledIdx === options.oldCurrentPage.visibleIndex)
		{
			// When surveyModel.currentPage is called from this handler, pagechange event gets triggered again.
			// Hence returning if we already handled this pagechange to avoid max callstack exceeded errors.
			return;
		}
		this._lastPageSwitchHandledIdx = options.oldCurrentPage.visibleIndex;
		const questions = surveyModel.getCurrentPageQuestions();

		// It is guaranteed that the question with skip logic is always last on the page.
		const lastQuestion = questions[questions.length - 1];
		const skipLogic = this._surveyData.questionSkipLogic[lastQuestion.name];
		if (skipLogic !== undefined)
		{
			this._expressionsRunner.expressionExecutor.setExpression(skipLogic.expression);
			const result = this._expressionsRunner.run(surveyModel.data);
			if (result)
			{
				options.allowChanging = false;

				if (skipLogic.destination === "ENDOFSURVEY")
				{
					surveyModel.setCompleted();
					this._surveyRunningPromiseResolve(SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY);
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					surveyModel.setCompleted();
					this._surveyRunningPromiseResolve(SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK);
				}
				else
				{
					// skipLogic.destination is a question within the current survey (qualtrics block).
					const targetQuestion = surveyModel.getQuestionByName(skipLogic.destination);
					const page = surveyModel.getPageByQuestion(targetQuestion);
					const pageQuestions = page.questions;
					let i;
					for (i = 0; i < pageQuestions.length; i++)
					{
						if (pageQuestions[i] === targetQuestion)
						{
							break;
						}
						pageQuestions[i].visible = false;
					}
					targetQuestion.focus();
					surveyModel.currentPage = page;
				}
			}
		}
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
		console.log(this._questionAsnwerTimestamps);
		Object.assign(this._totalSurveyResults, surveyModel.data);
		console.log("survey complete", this._totalSurveyResults);
		this._detachResizeObservers();
		let completionCode = SURVEY_COMPLETION_CODES.NORMAL;
		const questions = surveyModel.getAllQuestions();

		// It is guaranteed that the question with skip logic is always last on the page.
		const lastQuestion = questions[questions.length - 1];
		const skipLogic = this._surveyData.questionSkipLogic[lastQuestion.name];
		if (skipLogic !== undefined)
		{
			this._expressionsRunner.expressionExecutor.setExpression(skipLogic.expression);
			const result = this._expressionsRunner.run(surveyModel.data);
			if (result)
			{
				if (skipLogic.destination === "ENDOFSURVEY")
				{
					completionCode = SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY;
					surveyModel.setCompleted();
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					completionCode = SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK;
				}
			}
		}

		surveyModel.stopTimer();

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
		this._isCompletedAll = this._isCompletedAll && (nbAnsweredQuestions === surveyVisibleQuestions.length);
		if (this._isCompletedAll === false)
		{
			this.psychoJS.logger.warn(`Flag _isCompletedAll is false!`);
		}

		this._surveyRunningPromiseResolve(completionCode);
	}

	_onFlowComplete ()
	{
		this.isFinished = true;
		this._onFinishedCallback();
	}

	_onTextMarkdown(survey, options)
	{
		// TODO add sanitization / checks if required.
		options.html = options.text;
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
	_beginSurvey (surveyData, surveyFlowBlock)
	{
		let j;
		let surveyIdx;
		this._lastPageSwitchHandledIdx = -1;
		surveyIdx = surveyFlowBlock.surveyIdx;
		console.log("playing survey with idx", surveyIdx);
		let surveyModelInput = this._processSurveyData(surveyData, surveyIdx);

		this._surveyModel = new window.Survey.Model(surveyModelInput);
		for (j in this._variables)
		{
			// Adding variables directly to hash to get higher performance (this is instantaneous compared to .setVariable()).
			// At this stage we don't care to trigger all the callbacks like .setVariable() does, since this is very beginning of survey presentation.
			this._surveyModel.variablesHash[j] = this._variables[j];
			// this._surveyModel.setVariable(j, this._variables[j]);
		}

		if (!this._surveyModel.isInitialized)
		{
			this._registerCustomComponentCallbacks(this._surveyModel);
			this._surveyModel.onValueChanged.add(this._onQuestionValueChanged.bind(this));
			this._surveyModel.onCurrentPageChanging.add(this._onCurrentPageChanging.bind(this));
			this._surveyModel.onComplete.add(this._onSurveyComplete.bind(this));
			this._surveyModel.onTextMarkdown.add(this._onTextMarkdown.bind(this));
			this._surveyModel.isInitialized = true;
			this._surveyModel.onAfterRenderQuestion.add(this._handleAfterQuestionRender.bind(this));
		}

		const completeText = surveyIdx < this._surveyData.surveys.length - 1 ? (this._surveyModel.pageNextText || CAPTIONS.NEXT) : undefined;
		jQuery(".survey").Survey({
			model: this._surveyModel,
			showItemsInOrder: "column",
			completeText,
			...surveyData.surveySettings,
		});

		this._questionAnswerTimestampClock.reset();

		// TODO: should this be conditional?
		this._surveyModel.startTimer();

		this._surveyRunningPromise = new Promise((res, rej) => {
			this._surveyRunningPromiseResolve = res;
			this._surveyRunningPromiseReject = rej;
		});

		return this._surveyRunningPromise;
	}

	async _runSurveyFlow (surveyBlock, surveyData, prevBlockResults = {})
	{
		// let surveyBlock;
		let surveyIdx;
		let surveyCompletionCode;
		let i, j;

		if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL)
		{
			const dataset = Object.assign({}, this._totalSurveyResults, this._variables);
			this._expressionsRunner.expressionExecutor.setExpression(surveyBlock.condition);
			if (this._expressionsRunner.run(dataset))
			{
				await this._runSurveyFlow(surveyBlock.nodes[0], surveyData, prevBlockResults);
			}
			else if (surveyBlock.nodes[1] !== undefined)
			{
				await this._runSurveyFlow(surveyBlock.nodes[1], surveyData, prevBlockResults);
			}
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.RANDOMIZER)
		{
			this._InPlaceFisherYatesShuffle(surveyBlock.nodes, 0, surveyBlock.nodes.length - 1);
			// await this._runSurveyFlow(surveyBlock, surveyData, prevBlockResults);
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.EMBEDDED_DATA)
		{
			let t = performance.now();
			const surveyBlockData = surveyData.embeddedData[surveyBlock.dataIdx];
			for (j = 0; j < surveyBlockData.length; j++)
			{
				// TODO: handle the rest data types.
				if (surveyBlockData[j].type === "Custom")
				{
					// Variable value can be an expression. Check if so and if valid - run it.
					// surveyBlockData is an array so all the variables in it are in order they were declared in Qualtrics.
					// This means this._variables is saturated gradually with the data necessary to perform a computation.
					// It's guaranteed to be there, unless there are declaration order mistakes.
					this._expressionsRunner.expressionExecutor.setExpression(surveyBlockData[j].value);
					if (this._expressionsRunner.expressionExecutor.canRun())
					{
						this._variables[surveyBlockData[j].key] = this._expressionsRunner.run(this._variables);
					}
					else
					{
						this._variables[surveyBlockData[j].key] = surveyBlockData[j].value;
					}
				}
			}
			console.log("embedded data variables accumulation took", performance.now() - t);
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.ENDSURVEY)
		{
			if (this._surveyModel)
			{
				this._surveyModel.setCompleted();
			}
			console.log("EndSurvey block encountered, exiting.");
			return;
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.DIRECT)
		{
			surveyCompletionCode = await this._beginSurvey(surveyData, surveyBlock);
			Object.assign({}, prevBlockResults, this._surveyModel.data);

			// SkipLogic had destination set to ENDOFSURVEY.
			if (surveyCompletionCode === SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY)
			{
				return;
			}
		}

		if (surveyBlock.nodes instanceof Array && surveyBlock.type !== Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL)
		{
			for (i = 0; i < surveyBlock.nodes.length; i++)
			{
				await this._runSurveyFlow(surveyBlock.nodes[i], surveyData, prevBlockResults);
			}
		}
	}

	_resetState ()
	{
		this._lastPageSwitchHandledIdx = -1;
	}

	_handleSignaturePadResize (entries)
	{
		let signatureCanvas;
		let q;
		let i;
		for (i = 0; i < entries.length; i++)
		{
			signatureCanvas = entries[i].target.querySelector("canvas");
			q = this._surveyModel.getQuestionByName(entries[i].target.dataset.name);
			q.signatureWidth = Math.min(q.maxSignatureWidth, entries[i].contentBoxSize[0].inlineSize);
		}
	}

	_addEventListeners ()
	{
		this._signaturePadRO = new ResizeObserver(this._handleSignaturePadResize.bind(this));
	}

	_handleAfterQuestionRender (sender, options)
	{
		if (options.question.getType() === "signaturepad")
		{
			this._signaturePadRO.observe(options.htmlElement);
		}
	}

	_detachResizeObservers ()
	{
		this._signaturePadRO.disconnect();
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

		this._addEventListeners();
		// load the PsychoJS SurveyJS extensions:
		this._expressionsRunner = new window.Survey.ExpressionRunner();
		this._registerCustomExpressionFunctions(window.Survey, customExpressionFunctionsArray);
		this._registerWidgets(window.Survey);
		this._registerCustomSurveyProperties(window.Survey);

		// setup the survey theme:
		window.Survey.Serializer.getProperty("expression", "minWidth").defaultValue = "100px";
		window.Survey.settings.minWidth = "100px";
		window.Survey.StylesManager.applyTheme("defaultV2");

		// load the desired style:
		// TODO
		// util.loadCss("./survey/css/grey_style.css");
	}
}
