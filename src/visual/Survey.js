/**
 * Survey Stimulus.
 *
 * @author Alain Pitiot and Nikita Agafonov
 * @version 2022.3
 * @copyright (c) 2023 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { VisualStim } from "./VisualStim.js";
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

	static CAPTIONS =
	{
		NEXT: "Next"
	};

	static SURVEY_COMPLETION_CODES =
	{
		NORMAL: 0,
		SKIP_TO_END_OF_BLOCK: 1,
		SKIP_TO_END_OF_SURVEY: 2
	};

	static NODE_EXIT_CODES =
	{
		NORMAL: 0,
		BREAK_FLOW: 1
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

		// Storing all existing signaturePad questions to properly handle their resize.
		// Unfortunately signaturepad question type can't handle resizing properly by itself.
		this._signaturePads = [];

		// whether the user is done with the survey, independently of whether the survey is completed:
		this.isFinished = false;

		// accumulated completion flag updated after each survey node is completed
		// note: 	this make it possible to track completion as we move through the survey flow.
		// 				_isCompletedAll will be flipped to false whenever a survey node is not completed
		this._isCompletedAll = true;

		// timestamps associated to each question:
		this._questionAnswerTimestamps = {};
		// timestamps clock:
		this._questionAnswerTimestampClock = new Clock();

		this._overallSurveyResults = {};
		this._surveyData = undefined;
		this._surveyModel = undefined;
		this._expressionsRunner = undefined;
		this._lastPageSwitchHandledIdx = -1;
		this._variables = {};

		this._surveyRunningPromise = undefined;
		this._surveyRunningPromiseResolve = undefined;
		this._surveyRunningPromiseReject = undefined;
		// callback triggered when the user is done with the survey: nothing to do by default
		this._onFinishedCallback = () => {};

		// init SurveyJS:
		this._initSurveyJS();

		// default size:
		if (typeof size === "undefined")
		{
			this.size = (this.unit === "norm") ? [2.0, 2.0] : [1.0, 1.0];
		}

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

				// model should now be an object:
				if (typeof model !== "object")
				{
					throw "model is neither the name of a resource nor an object";
				}

				// if model is a straight-forward SurveyJS model, instead of a Pavlovia Survey super-flow model,
				// convert it:
				if (!('surveyFlow' in model))
				{
					model = {
						surveys: [model],
						embeddedData: [],
						surveysMap: {},
						questionMapsBySurvey: {},
						surveyFlow: {
							name: "root",
							type: "SEQUENTIAL_GROUP",
							nodes: [{
								type: "QUESTION_BLOCK",
								surveyIdx: 0
							}]
						},

						surveySettings: { showPrevButton: false },

						surveyRunLogic: {},
						inQuestionRandomization: {},
						questionsOrderRandomization: [],
						questionSkipLogic: {},

						questionsConverted: -1,
						questionsTotal: -1,
						logs: []
					};

					this.psychoJS.logger.debug(`converted the legacy model to the new super-flow model: ${JSON.stringify(model)}`);
				}

				this._surveyData = model;
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

		// only update the model if a genuine surveyId was given as parameter to the Survey:
		if (!this._hasSelfGeneratedSurveyId)
		{
			this.setModel(`${surveyId}.sid`, log);
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
				this._variables[name] = variables[name];
				// this._surveyData.variables[name] = variables[name];
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

		return this._overallSurveyResults;
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
		const surveyDiv = document.getElementById(this._surveyDivId);
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
			if (document.getElementById(this._surveyDivId) === null)
			{
				document.body.insertAdjacentHTML("beforeend", `<div id=${this._surveyDivId} class='survey'></div>`)
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
		for (let i = 0; i < customFuncs.length; i++)
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

/*
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
*/

	_composeModelWithRandomizedQuestions (surveyModel, inBlockRandomizationSettings)
	{
		let t = performance.now();
		// Qualtrics's in-block randomization ignores presense of page breaks within the block.
		// Hence creating a fresh survey data object with shuffled question order.
		let questions = [];
		let questionsMap = {};
		let newSurveyModel =
		{
			pages:[{ elements: new Array(inBlockRandomizationSettings.questionsPerPage) }]
		};
		for (let i = 0; i < surveyModel.pages.length; i++)
		{
			for (let j = 0; j < surveyModel.pages[i].elements.length; j++)
			{
				questions.push(surveyModel.pages[i].elements[j]);
				const k = questions.length - 1;
				questionsMap[questions[k].name] = questions[k];
			}
		}

		if (inBlockRandomizationSettings.layout.length > 0)
		{
			let j = 0;
			let k = 0;
			let curPage = 0;
			let curElement = 0;

			const shuffledSet0 = util.shuffle(Array.from(inBlockRandomizationSettings.set0));
			const shuffledSet1 = util.shuffle(Array.from(inBlockRandomizationSettings.set1));
			// const shuffledSet0 = this._FisherYatesShuffle(inBlockRandomizationSettings.set0);
			// const shuffledSet1 = this._FisherYatesShuffle(inBlockRandomizationSettings.set1);
			for (let i = 0; i < inBlockRandomizationSettings.layout.length; i++)
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
			const shuffledQuestions = util.shuffle(Array.from(questions));
			// shuffledQuestions = this._FisherYatesShuffle(questions);
			newSurveyModel.pages[0].elements = shuffledQuestions.splice(0, inBlockRandomizationSettings.showOnly);
		}
		else {
			// TODO: Check if there can be questionsPerPage applicable in this case.
			newSurveyModel.pages[0].elements = util.shuffle(Array.from(questions));
			// newSurveyModel.pages[0].elements = this._FisherYatesShuffle(questions);
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
			questionData[choicesFieldName] = util.shuffle(Array.from(questionData[choicesFieldName]));
			// questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]);
			// Handle dynamic choices.
		}
		else if (inQuestionRandomizationSettings.showOnly > 0)
		{
			questionData[choicesFieldName] = util.shuffle(Array.from(questionData[choicesFieldName]).splice(0, inQuestionRandomizationSettings.showOnly));
			// questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]).splice(0, inQuestionRandomizationSettings.showOnly);
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
			const shuffledSet0 = util.shuffle(Array.from(inQuestionRandomizationSettings.set0));
			const shuffledSet1 = util.shuffle(Array.from(inQuestionRandomizationSettings.set1));
			// const shuffledSet0 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set0);
			// const shuffledSet1 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set1);
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
					this._surveyRunningPromiseResolve(Survey.SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY);
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					surveyModel.setCompleted();
					this._surveyRunningPromiseResolve(Survey.SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK);
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
	 * @protected
	 */
	_onSurveyComplete(surveyModel, options)
	{
		Object.assign(this._overallSurveyResults, surveyModel.data);
		let completionCode = Survey.SURVEY_COMPLETION_CODES.NORMAL;
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
					completionCode = Survey.SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY;
					surveyModel.setCompleted();
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					completionCode = Survey.SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK;
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
	 * @param {Object} surveyData - surveyData / model.
	 * @param {Object} surveyFlowBlock - XXX
	 * @return {void}
	 */
	_beginSurvey(surveyData, surveyFlowBlock)
	{
		this._lastPageSwitchHandledIdx = -1;
		const surveyIdx = surveyFlowBlock.surveyIdx;
		let surveyModelInput = this._processSurveyData(surveyData, surveyIdx);

		this._surveyModel = new window.Survey.Model(surveyModelInput);
		for (let j in this._variables)
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

		const completeText = surveyIdx < this._surveyData.surveys.length - 1 ? (this._surveyModel.pageNextText || Survey.CAPTIONS.NEXT) : undefined;
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

	async _runSurveyFlow(surveyBlock, surveyData, prevBlockResults = {})
	{
		let nodeExitCode = Survey.NODE_EXIT_CODES.NORMAL;

		if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL)
		{
			const dataset = Object.assign({}, this._overallSurveyResults, this._variables);
			this._expressionsRunner.expressionExecutor.setExpression(surveyBlock.condition);
			if (this._expressionsRunner.run(dataset) && surveyBlock.nodes[0] !== undefined)
			{
				nodeExitCode = await this._runSurveyFlow(surveyBlock.nodes[0], surveyData, prevBlockResults);
			}
			else if (surveyBlock.nodes[1] !== undefined)
			{
				nodeExitCode = await this._runSurveyFlow(surveyBlock.nodes[1], surveyData, prevBlockResults);
			}
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.RANDOMIZER)
		{
			util.shuffle(surveyBlock.nodes, Math.random, 0, surveyBlock.nodes.length - 1);
			// this._InPlaceFisherYatesShuffle(surveyBlock.nodes, 0, surveyBlock.nodes.length - 1);
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.EMBEDDED_DATA)
		{
			let t = performance.now();
			const surveyBlockData = surveyData.embeddedData[surveyBlock.dataIdx];
			for (let j = 0; j < surveyBlockData.length; j++)
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
			nodeExitCode = Survey.NODE_EXIT_CODES.BREAK_FLOW;
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.DIRECT)
		{
			const surveyCompletionCode = await this._beginSurvey(surveyData, surveyBlock);
			Object.assign({}, prevBlockResults, this._surveyModel.data);

			// SkipLogic had destination set to ENDOFSURVEY.
			if (surveyCompletionCode === Survey.SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY)
			{
				nodeExitCode = Survey.NODE_EXIT_CODES.BREAK_FLOW;
			}
		}

		if (nodeExitCode === Survey.NODE_EXIT_CODES.NORMAL &&
			surveyBlock.type !== Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL &&
			surveyBlock.nodes instanceof Array)
		{
			for (let i = 0; i < surveyBlock.nodes.length; i++)
			{
				nodeExitCode = await this._runSurveyFlow(surveyBlock.nodes[i], surveyData, prevBlockResults);
				if (nodeExitCode === Survey.NODE_EXIT_CODES.BREAK_FLOW)
				{
					break;
				}
			}
		}

		if (surveyBlock.name === "root")
		{
			// At this point we went through the entire survey flow tree.
			this._onFlowComplete();
		}

		return nodeExitCode;
	}

	_resetState ()
	{
		this._lastPageSwitchHandledIdx = -1;
	}

	_handleWindowResize(e)
	{
		if (this._surveyModel)
		{
			for (let i = this._signaturePads.length - 1; i >= 0; i--)
			{
				// As of writing this (24.03.2023). SurveyJS doesn't have a proper event
				// for question being removed from nested locations, such as dynamic panel.
				// However, surveyJS will set .signaturePad property to null once the question is removed.
				// Utilising this knowledge to sync our lists.
				if (this._signaturePads[ i ].question.signaturePad)
				{
					this._signaturePads[ i ].question.signatureWidth = Math.min(
						this._signaturePads[i].question.maxSignatureWidth,
						this._signaturePads[ i ].htmlElement.getBoundingClientRect().width
					);
				}
				else
				{
					// Signature pad was removed. Syncing list.
					this._signaturePads.splice(i, 1);
				}
			}
		}
	}

	_addEventListeners()
	{
		window.addEventListener("resize", (e) => this._handleWindowResize(e));
	}

	_handleAfterQuestionRender (sender, options)
	{
		if (options.question.getType() === "signaturepad")
		{
			this._signaturePads.push(options);
			options.question.signatureWidth = Math.min(options.question.maxSignatureWidth, options.htmlElement.getBoundingClientRect().width);
		}
	}

	/**
	 * Init the SurveyJS.io library and various extensions, setup the theme.
	 *
	 * @protected
	 */
	_initSurveyJS()
	{
		// note: the Survey.js libraries must be added to the list of resources in PsychoJS.start:
		// psychoJS.start({ resources: [ {'surveyLibrary': true}, ... ], ...});

		// id of the SurveyJS html div:
		this._surveyDivId = `survey-${this._name}`;

		this._registerCustomExpressionFunctions(window.Survey, customExpressionFunctionsArray);
		this._registerWidgets(window.Survey);
		this._registerCustomSurveyProperties(window.Survey);
		this._addEventListeners();
		this._expressionsRunner = new window.Survey.ExpressionRunner();

		// setup the survey theme:
		window.Survey.Serializer.getProperty("expression", "minWidth").defaultValue = "100px";
		window.Survey.settings.minWidth = "100px";
		window.Survey.StylesManager.applyTheme("defaultV2");

		// load the desired style:
		// TODO
		// util.loadCss("./survey/css/grey_style.css");
	}
}
