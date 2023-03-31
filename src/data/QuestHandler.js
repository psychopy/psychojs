/**
 * Quest Trial Handler
 *
 * @author Alain Pitiot & Thomas Pronk
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {TrialHandler} from "./TrialHandler.js";

/**
 * <p>A Trial Handler that implements the Quest algorithm for quick measurement of
    psychophysical thresholds. QuestHandler relies on the [jsQuest]{@link https://github.com/kurokida/jsQUEST} library, a port of Prof Dennis Pelli's QUEST algorithm by [Daiichiro Kuroki]{@link https://github.com/kurokida}.</p>
 *
 * @extends TrialHandler
 */
export class QuestHandler extends TrialHandler
{
	/**
	 * @memberof module:data
	 * @param {Object} options - the handler options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {string} options.varName - the name of the variable / intensity / contrast / threshold manipulated by QUEST
	 * @param {number} options.startVal - initial guess for the threshold
	 * @param {number} options.startValSd - standard deviation of the initial guess
	 * @param {number} options.minVal - minimum value for the threshold
	 * @param {number} options.maxVal - maximum value for the threshold
	 * @param {number} [options.pThreshold=0.82] - threshold criterion expressed as probability of getting a correct response
	 * @param {number} options.nTrials - maximum number of trials
	 * @param {number} options.stopInterval - minimum [5%, 95%] confidence interval required for the loop to stop
	 * @param {QuestHandler.Method} options.method - the QUEST method
	 * @param {number} [options.beta=3.5] - steepness of the QUEST psychometric function
	 * @param {number} [options.delta=0.01] - fraction of trials with blind responses
	 * @param {number} [options.gamma=0.5] - fraction of trails that would generate a correct response when the threshold is infinitely small
	 * @param {number} [options.grain=0.01] - quantization of the internal table
	 * @param {string} options.name - name of the handler
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({
		psychoJS,
		varName,
		startVal,
		startValSd,
		minVal,
		maxVal,
		pThreshold,
		nTrials,
		stopInterval,
		method,
		beta,
		delta,
		gamma,
		grain,
		name,
		autoLog
	} = {})
	{
		super({
			psychoJS,
			name,
			autoLog,
			method: TrialHandler.Method.SEQUENTIAL,
			trialList: Array(nTrials),
			nReps: 1
		});

		this._addAttribute("varName", varName);
		this._addAttribute("startVal", startVal);
		this._addAttribute("minVal", minVal, Number.MIN_VALUE);
		this._addAttribute("maxVal", maxVal, Number.MAX_VALUE);
		this._addAttribute("startValSd", startValSd);
		this._addAttribute("pThreshold", pThreshold, 0.82);
		this._addAttribute("nTrials", nTrials);
		this._addAttribute("stopInterval", stopInterval, Number.MIN_VALUE);
		this._addAttribute("beta", beta, 3.5);
		this._addAttribute("delta", delta, 0.01);
		this._addAttribute("gamma", gamma, 0.5);
		this._addAttribute("grain", grain, 0.01);
		this._addAttribute("method", method, QuestHandler.Method.QUANTILE);

		// setup jsQuest:
		this._setupJsQuest();
		this._estimateQuestValue();
	}

	/**
	 * Setter for the method attribute.
	 *
	 * @param {mixed} method - the method value, PsychoPy-style values ("mean", "median", 
	 * "quantile") are converted to their respective QuestHandler.Method values
	 * @param {boolean} log - whether or not to log the change of seed
	 */
	 setMethod(method, log)
	 {
		let methodMapping = {
			"quantile": QuestHandler.Method.QUANTILE,
			"mean": QuestHandler.Method.MEAN,
			"mode": QuestHandler.Method.MODE
		};
		// If method is a key in methodMapping, convert method to corresponding value
		if (methodMapping.hasOwnProperty(method)) 
		{
			method = methodMapping[method];
		}
		this._setAttribute("method", method, log);
	}

	/**
	 * Add a response and update the PDF.
	 *
	 * @param{number} response	- the response to the trial, must be either 0 (incorrect or
	 * non-detected) or 1 (correct or detected)
	 * @param{number | undefined} value - optional intensity / contrast / threshold
	 * @param{boolean} [doAddData = true] - whether or not to add the response as data to the
	 * 	experiment
	 */
	addResponse(response, value, doAddData = true)
	{
		// check that response is either 0 or 1:
		if (response !== 0 && response !== 1)
		{
			throw {
				origin: "QuestHandler.addResponse",
				context: "when adding a trial response",
				error: `the response must be either 0 or 1, got: ${JSON.stringify(response)}`
			};
		}

		if (doAddData)
		{
			this._psychoJS.experiment.addData(this._name + '.response', response);
		}

		// update the QUEST pdf:
		if (typeof value !== "undefined")
		{
			this._jsQuest = jsQUEST.QuestUpdate(this._jsQuest, value, response);
		}
		else
		{
			this._jsQuest = jsQUEST.QuestUpdate(this._jsQuest, this._questValue, response);
		}

		if (!this._finished)
		{
			this.next();

			// estimate the next value of the QUEST variable
			// (and update the trial list and snapshots):
			this._estimateQuestValue();
		}
	}

	/**
	 * Simulate a response.
	 *
	 * @param{number} trueValue - the true, known value of the threshold / contrast / intensity
	 * @returns{number} the simulated response, 0 or 1
	 */
	simulate(trueValue)
	{
		const response = jsQUEST.QuestSimulate(this._jsQuest, this._questValue, trueValue);

		// restrict to limits:
		this._questValue = Math.max(this._minVal, Math.min(this._maxVal, this._questValue));

		this._psychoJS.logger.debug(`simulated response: ${response}`);

		return response;
	}

	/**
	 * Get the mean of the Quest posterior PDF.
	 *
	 * @returns {number} the mean
	 */
	mean()
	{
		return jsQUEST.QuestMean(this._jsQuest);
	}

	/**
	 * Get the standard deviation of the Quest posterior PDF.
	 *
	 * @returns {number} the standard deviation
	 */
	sd()
	{
		return jsQUEST.QuestSd(this._jsQuest);
	}

	/**
	 * Get the mode of the Quest posterior PDF.
	 *
	 * @returns {number} the mode
	 */
	mode()
	{
		const [mode, pdf] = jsQUEST.QuestMode(this._jsQuest);
		return mode;
	}

	/**
	 * Get the standard deviation of the Quest posterior PDF.
	 *
	 * @param{number} quantileOrder the quantile order
	 * @returns {number} the quantile
	 */
	quantile(quantileOrder)
	{
		return jsQUEST.QuestQuantile(this._jsQuest, quantileOrder);
	}

	/**
	 * Get the current value of the variable / contrast / threshold.
	 *
	 * @returns {number} the current QUEST value for the variable / contrast / threshold
	 */
	getQuestValue()
	{
		return this._questValue;
	}

	/**
	 * Get the current value of the variable / contrast / threshold.
	 *
	 * <p>This is the getter associated to getQuestValue.</p>
	 *
	 * @returns {number} the intensity of the current staircase, or undefined if the trial has ended
	 */
	get intensity()
	{
		return this.getQuestValue();
	}

	/**
	 * Get an estimate of the 5%-95% confidence interval (CI).
	 *
	 * @param{boolean} [getDifference=false] - if true, return the width of the CI instead of the CI
	 * @returns{number[] | number} the 5%-95% CI or the width of the CI
	 */
	confInterval(getDifference = false)
	{
		const CI = [
			jsQUEST.QuestQuantile(this._jsQuest, 0.05),
			jsQUEST.QuestQuantile(this._jsQuest, 0.95)
		];

		if (getDifference)
		{
			return Math.abs(CI[0] - CI[1]);
		}
		else
		{
			return CI;
		}
	}

	/**
	 * Setup the JS Quest object.
	 *
	 * @protected
	 */
	_setupJsQuest()
	{
		this._jsQuest = jsQUEST.QuestCreate(
			this._startVal,
			this._startValSd,
			this._pThreshold,
			this._beta,
			this._delta,
			this._gamma,
			this._grain);
	}

	/**
	 * Estimate the next value of the QUEST variable, based on the current value
	 * and on the selected QUEST method.
	 *
	 * @protected
	 */
	_estimateQuestValue()
	{
		// estimate the value based on the chosen QUEST method:
		if (this._method === QuestHandler.Method.QUANTILE)
		{
			this._questValue = jsQUEST.QuestQuantile(this._jsQuest);
		}
		else if (this._method === QuestHandler.Method.MEAN)
		{
			this._questValue = jsQUEST.QuestMean(this._jsQuest);
		}
		else if (this._method === QuestHandler.Method.MODE)
		{
			const [mode, pdf] = jsQUEST.QuestMode(this._jsQuest);
			this._questValue = mode;
		}
		else
		{
			throw {
				origin: "QuestHandler._estimateQuestValue",
				context: "when estimating the next value of the QUEST variable",
				error: `unknown method: ${this._method}, please use: mean, mode, or quantile`
			};
		}

		this._psychoJS.logger.debug(`estimated value for QUEST variable ${this._varName}: ${this._questValue}`);

		// check whether we should finish the trial:
		if (this.thisN > 0 && (this.nRemaining === 0 || this.confInterval(true) < this._stopInterval))
		{
			this._finished = true;

			// update the snapshots associated with the current trial in the trial list:
			for (let t = 0; t < this._snapshots.length - 1; ++t)
			{
				// the current trial is the last defined one:
				if (typeof this._trialList[t + 1] === "undefined")
				{
					this._snapshots[t].finished = true;
					break;
				}
			}

			return;
		}

		// update the next undefined trial in the trial list, and the associated snapshot:
		for (let t = 0; t < this._trialList.length; ++t)
		{
			if (typeof this._trialList[t] === "undefined")
			{
				this._trialList[t] = { [this._varName]: this._questValue };

				if (typeof this._snapshots[t] !== "undefined")
				{
					this._snapshots[t][this._varName] = this._questValue;
					this._snapshots[t].trialAttributes.push(this._varName);
				}
				break;
			}
		}
	}
}

/**
 * QuestHandler method
 *
 * @enum {Symbol}
 * @readonly
 */
QuestHandler.Method = {
	/**
	 * Quantile threshold estimate.
	 */
	QUANTILE: Symbol.for("QUANTILE"),

	/**
	 * Mean threshold estimate.
	 */
	MEAN: Symbol.for("MEAN"),

	/**
	 * Mode threshold estimate.
	 */
	MODE: Symbol.for("MODE")
};
