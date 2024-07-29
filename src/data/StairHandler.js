/**
 * Stair Handler
 *
 * @author Alain Pitiot
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2024 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {TrialHandler} from "./TrialHandler.js";

/**
 * <p>A Trial Handler that implements the Quest algorithm for quick measurement of
    psychophysical thresholds. QuestHandler relies on the [jsQuest]{@link https://github.com/kurokida/jsQUEST} library, a port of Prof Dennis Pelli's QUEST algorithm by [Daiichiro Kuroki]{@link https://github.com/kurokida}.</p>
 *
 * @extends TrialHandler
 */
export class StairHandler extends TrialHandler
{
	/**
	 * @memberof module:data
	 * @param {Object} options - the handler options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {string} options.varName - the name of the variable / intensity / contrast / threshold manipulated by QUEST
	 * @param {number} options.startVal - initial guess for the threshold
	 * @param {number} options.minVal - minimum value for the threshold
	 * @param {number} options.maxVal - maximum value for the threshold
	 * @param {number} options.nTrials - maximum number of trials
	 * @param {string} options.name - name of the handler
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 */
	constructor({
		psychoJS,
		varName,
		startVal,
		minVal,
		maxVal,
		nTrials,
		nReversals,
		nUp,
		nDown,
		applyInitialRule,
		stepSizes,
		stepType,
		name,
		autoLog,
		fromMultiStair,
		extraArgs
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

		this._addAttribute("nTrials", nTrials);

		this._addAttribute("nReversals", nReversals, null);
		this._addAttribute("nUp", nUp, 1);
		this._addAttribute("nDown", nDown, 3);
		this._addAttribute("applyInitialRule", applyInitialRule, true);

		this._addAttribute("stepType", Symbol.for(stepType), 0.5);
		this._addAttribute("stepSizes", stepSizes, [4]);

		this._addAttribute("fromMultiStair", fromMultiStair, false);

		this._addAttribute("extraArgs", extraArgs);

		// turn stepSizes into an array if it is not one already:
		if (!Array.isArray(this._stepSizes))
		{
			this._stepSizes = [this._stepSizes];
		}

		this._variableStep = (this._stepSizes.length > 1);
		this._currentStepSize = this._stepSizes[0];
		
		// TODO update the variables, a la staircase.py :nReversals, stepSizes, etc.

		// setup the stair's starting point:
		this._stairValue = this._startVal;
		this._data = [];
		this._values = [];
		this._correctCounter = 0;
		this._reversalPoints = [];
		this.reversalIntensities = [];
		this._initialRule = false;
		this._currentDirection = StairHandler.Direction.START;

		// update the next undefined trial in the trial list, and the associated snapshot:
		this._updateTrialList();
	}

	/**
	 * Add a response and advance the staircase.
	 *
	 * @param{number} response	- the response to the trial, must be either 0 (incorrect or
	 * non-detected) or 1 (correct or detected)
	 * @param{number | undefined} value - optional intensity / contrast / threshold
	 * @param{boolean} [doAddData = true] - whether to add the response as data to the
	 * 	experiment
	 */
	addResponse(response, value, doAddData = true)
	{
		this._psychoJS.logger.debug(`response= ${response}`);

		// check that response is either 0 or 1:
		if (response !== 0 && response !== 1)
		{
			throw {
				origin: "StairHandler.addResponse",
				context: "when adding a trial response",
				error: `the response must be either 0 or 1, got: ${JSON.stringify(response)}`
			};
		}

		if (doAddData)
		{
			this._psychoJS.experiment.addData(this._name + '.response', response);
		}

		this._data.push(response);

		// replace the last value with this one, if need be:
		if (typeof value !== "undefined")
		{
			this._values.pop();
			this._values.push(value);
		}

		// update correctCounter:
		if (response === 1)
		{
			if ( (this._data.length > 1) && (this._data.at(-2) === response))
			{
				++ this._correctCounter;
			}
			else
			{
				// reset the counter:
				this._correctCounter = 1;
			}
		}

		// incorrect response:
		else
		{
			if ( (this._data.length > 1) && (this._data.at(-2) === response))
			{
				-- this._correctCounter;
			}
			else
			{
				// reset the counter:
				this._correctCounter = -1;
			}
		}

		if (!this._finished)
		{
			this.next();

			// estimate the next value
			// (and update the trial list and snapshots):
			this._estimateStairValue();
		}
	}

	/**
	 * Get the current value of the variable / contrast / threshold.
	 *
	 * @returns {number} the current value
	 */
	getStairValue()
	{
		return this._stairValue;
	}

	/**
	 * Get the current value of the variable / contrast / threshold.
	 *
	 * <p>This is the getter associated to getStairValue.</p>
	 *
	 * @returns {number} the intensity of the current staircase, or undefined if the trial has ended
	 */
	get intensity()
	{
		return this.getStairValue();
	}

	/**
	 * Estimate the next value, based on the current value, the counter of correct responses,
	 * and the current staircase direction.
	 *
	 * @protected
	 */
	_estimateStairValue()
	{
		this._psychoJS.logger.debug(`stairValue before update= ${this._stairValue}, currentDirection= ${this._currentDirection.toString()}, correctCounter= ${this._correctCounter}`);

		// default: no reversal, same direction as previous trial
		let reverseDirection = false;

		// if we are at the very start and the initial rule applies, apply the 1-down, 1-up rule:
		if (this.reversalIntensities.length === 0 && this._applyInitialRule)
		{
			// if the last response was correct:
			if (this._data.at(-1) === 1)
			{
				reverseDirection = (this._currentDirection === StairHandler.Direction.UP);
				this._currentDirection = StairHandler.Direction.DOWN;
			}
			else
			{
				reverseDirection = (this._currentDirection === StairHandler.Direction.DOWN);
				this._currentDirection = StairHandler.Direction.UP;
			}
		}
		// n correct response: time to go down:
		else if (this._correctCounter >= this._nDown)
		{
			reverseDirection = (this._currentDirection === StairHandler.Direction.UP);
			this._currentDirection = StairHandler.Direction.DOWN;
		}
		// n wrong responses, time to go up:
		else if (this._correctCounter <= -this._nUp)
		{
			reverseDirection = (this._currentDirection === StairHandler.Direction.DOWN);
			this._currentDirection = StairHandler.Direction.UP;
		}

		if (reverseDirection)
		{
			this._reversalPoints.push(this.thisTrialN);
			this._initialRule = (this.reversalIntensities.length === 0 && this._applyInitialRule);
			this.reversalIntensities.push(this._values.at(-1));
		}

		// check whether we should finish the trial:
		if (this.reversalIntensities.length >= this._nReversals && this._values.length >= this._nTrials)
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
		
		// update the step size, if need be:
		if (reverseDirection && this._variableStep)
		{
			// if we have gone past the end of the step size array, we use the last one:
			if (this.reversalIntensities.length >= this._stepSizes.length)
			{
				this._currentStepSize = this._stepSizes.at(-1);
			}
			else 
			{
				this._currentStepSize = this._stepSizes.at(this.reversalIntensities.length);
			}
		}

		// apply the new step size:
		if ( (this.reversalIntensities.length === 0 || this._initialRule) && this._applyInitialRule )
		{
			this._initialRule = false;

			if (this._data.at(-1) === 1)
			{
				this._decreaseValue();
			}
			else
			{
				this._increaseValue();
			}
		}
		// n correct: decrease the value
		else if (this._correctCounter >= this._nDown)
		{
			this._decreaseValue();
		}
		// n wrong: increase the value
		else if (this._correctCounter <= -this._nUp)
		{
			this._increaseValue();
		}

		this._psychoJS.logger.debug(`estimated value for variable ${this._varName}: ${this._stairValue}`);

		// update the next undefined trial in the trial list, and the associated snapshot:
		this._updateTrialList();
	}

	/**
	 * Update the next undefined trial in the trial list, and the associated snapshot.
	 *
	 * @protected
	 */
	_updateTrialList()
	{
		// if this StairHandler was instantiated from a MultiStairHandler, we do not update the trial list here,
		// since it is updated by the MultiStairHandler instead
		if (this._fromMultiStair)
		{
			return;
		}

		for (let t = 0; t < this._trialList.length; ++t)
		{
			if (typeof this._trialList[t] === "undefined")
			{
				this._trialList[t] = { [this._varName]: this._stairValue };

				this._psychoJS.logger.debug(`updated the trialList at: ${t}: ${JSON.stringify(this._trialList[t])}`);

				if (typeof this._snapshots[t] !== "undefined")
				{
					this._snapshots[t][this._varName] = this._stairValue;
					this._snapshots[t].trialAttributes.push(this._varName);
				}
				break;
			}
		}
	}

	/**
	 * Increase the current value of the variable / contrast / threshold.
	 *
	 * @protected
	 */
	_increaseValue()
	{
		this._psychoJS.logger.debug(`stepType= ${this._stepType.toString()}, currentStepSize= ${this._currentStepSize}, stairValue (before update)= ${this._stairValue}`);

		this._correctCounter = 0;

		switch (this._stepType)
		{
			case StairHandler.StepType.DB:
				this._stairValue *= Math.pow(10.0, this._currentStepSize / 20.0);
				break;
			case StairHandler.StepType.LOG:
				this._stairValue *= Math.pow(10.0, this._currentStepSize);
				break;
			case StairHandler.StepType.LINEAR:
			default:
				this._stairValue += this._currentStepSize;
				break;
		}

		// make sure we do not go beyond the maximum value:
		if (this._stairValue > this._maxVal)
		{
			this._stairValue = this._maxVal;
		}
	}

	/**
	 * Decrease the current value of the variable / contrast / threshold.
	 *
	 * @protected
	 */
	_decreaseValue()
	{
		this._psychoJS.logger.debug(`stepType= ${this._stepType.toString()}, currentStepSize= ${this._currentStepSize}, stairValue (before update)= ${this._stairValue}`);

		this._correctCounter = 0;

		switch (this._stepType)
		{
			case StairHandler.StepType.DB:
				this._stairValue /= Math.pow(10.0, this._currentStepSize / 20.0);
				break;
			case StairHandler.StepType.LOG:
				this._stairValue /= Math.pow(10.0, this._currentStepSize);
				break;
			case StairHandler.StepType.LINEAR:
			default:
				this._stairValue -= this._currentStepSize;
				break;
		}

		// make sure we do not go beyond the minimum value:
		if (this._stairValue < this._minVal)
		{
			this._stairValue = this._minVal;
		}
	}

}

/**
 * StairHandler step type
 *
 * @enum {Symbol}
 * @readonly
 */
StairHandler.StepType = {
	DB: Symbol.for("db"),
	LINEAR: Symbol.for("lin"),
	LOG: Symbol.for("log")
};

/**
 * StairHandler step direction.
 *
 * @enum {Symbol}
 * @readonly
 */
StairHandler.Direction = {
	START: Symbol.for("START"),
	UP: Symbol.for("UP"),
	DOWN: Symbol.for("DOWN")
};
