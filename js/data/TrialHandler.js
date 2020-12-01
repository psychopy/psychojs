/** @module data */
/**
 * Trial Handler
 *
 * @author Alain Pitiot
 * @author Hiroyuki Sogo & Sotiri Bakagiannis  - better support for BOM and accented characters
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {PsychObject} from '../util/PsychObject';
import * as util from '../util/Util';


/**
 * <p>A Trial Handler handles the importing and sequencing of conditions.</p>
 *
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {Array.<Object> | String} [options.trialList= [undefined] ] - if it is a string, we treat it as the name of a condition resource
 * @param {number} options.nReps - number of repetitions
 * @param {module:data.TrialHandler.Method} options.method - the trial method
 * @param {Object} options.extraInfo - additional information to be stored alongside the trial data, e.g. session ID, participant ID, etc.
 * @param {number} options.seed - seed for the random number generator
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class TrialHandler extends PsychObject
{

	/**
	 * Getter for experimentHandler.
	 *
	 * @name module:core.Window#experimentHandler
	 * @function
	 * @public
	 */
	get experimentHandler()
	{
		return this._experimentHandler;
	}

	/**
	 * Setter for experimentHandler.
	 *
	 * @name module:core.Window#experimentHandler
	 * @function
	 * @public
	 */
	set experimentHandler(exp)
	{
		this._experimentHandler = exp;
	}


	/**
	 * @constructor
	 * @public
	 *
	 * @todo extraInfo is not taken into account, we use the expInfo of the ExperimentHandler instead
	 */
	constructor({
								psychoJS,
								trialList = [undefined],
								nReps,
								method = TrialHandler.Method.RANDOM,
								extraInfo = [],
								seed,
								name,
								autoLog = true
							} = {})
	{
		super(psychoJS);

		this._addAttributes(TrialHandler, trialList, nReps, method, extraInfo, seed, name, autoLog);

		this._prepareTrialList(trialList);

		// number of stimuli
		this.nStim = this.trialList.length;

		// the total number of trials that will be run:
		this.nTotal = this.nReps * this.nStim;

		// the total number of trial remaining
		this.nRemaining = this.nTotal;

		// the current repeat:
		this.thisRepN = 0;

		// the current trial number within the current repeat:
		this.thisTrialN = -1;

		// total number of trials completed so far:
		this.thisN = -1;

		// the index of the current trial in the conditions list
		this.thisIndex = 0;

		this.ran = 0;
		this.order = -1;

		// array of current snapshots:
		this._snapshots = [];


		// setup the trial sequence:
		this._prepareSequence();

		this._experimentHandler = null;
		this.thisTrial = null;
		this._finished = false;
	}


	/**
	 * Iterator over the trial sequence.
	 *
	 * <p>This makes it possible to iterate over all trials.</p>
	 * @example
	 * let handler = new TrialHandler({nReps: 5});
	 * for (const thisTrial of handler) { console.log(thisTrial); }
	 */
	[Symbol.iterator]()
	{
		return {
			next: () =>
			{
				this.thisTrialN++;
				this.thisN++;
				this.nRemaining--;

				// check for the last trial:
				if (this.nRemaining === 0)
				{
					// this only indicated that the scheduling is done, not that the loop is finished
					// this.finished = true;
				}

				// start a new repetition:
				if (this.thisTrialN === this.nStim)
				{
					this.thisTrialN = 0;
					this.thisRepN++;
				}

				// check if we have completed the sequence:
				if (this.thisRepN >= this.nReps)
				{
					this.thisTrial = null;
					return {done: true};
				}

				this.thisIndex = this._trialSequence[this.thisRepN][this.thisTrialN];
				this.thisTrial = this.trialList[this.thisIndex];
				this.ran = 1;
				this.order = this.thisN;
				/*
				if self.autoLog:
					msg = 'New trial (rep=%i, index=%i): %s'
					vals = (self.thisRepN, self.thisTrialN, self.thisTrial)
					logging.exp(msg % vals, obj=self.thisTrial)*/

				return {value: this.thisTrial, done: false};
			}
		};
	}


	/**
	 * Execute the callback for each trial in the sequence.
	 *
	 * @param callback
	 */
	forEach(callback)
	{
		const trialIterator = this[Symbol.iterator]();

		while (true)
		{
			const result = trialIterator.next();
			if (result.done)
			{
				break;
			}

			callback(result.value);
		}
	}


	/**
	 * @typedef {Object} Snapshot
	 * @property {string} name - the trialHandler name
	 * @property {number} nStim - the number of stimuli
	 * @property {number} nTotal - the total number of trials that will be run
	 * @property {number} nRemaining - the total number of trial remaining
	 * @property {number} thisRepN - the current repeat
	 * @property {number} thisTrialN - the current trial number within the current repeat
	 * @property {number} thisN - the total number of trials completed so far
	 * @property {number} thisIndex - the index of the current trial in the conditions list
	 * @property {number} ran - whether or not the trial ran
	 * @property {number} finished - whether or not the trials finished
	 */

	/**
	 * Get a snapshot of the current internal state of the trial handler (e.g. current trial number,
	 * number of trial remaining).
	 *
	 * <p>This is typically used in the LoopBegin function, in order to capture the current state of a TrialHandler</p>
	 *
	 * @public
	 * @return {Snapshot} - a snapshot of the current internal state.
	 */
	getSnapshot()
	{
		const currentIndex = this.thisIndex;

		const snapshot = {
			name: this.name,
			nStim: this.nStim,
			nTotal: this.nTotal,
			nRemaining: this.nRemaining,
			thisRepN: this.thisRepN,
			thisTrialN: this.thisTrialN,
			thisN: this.thisN,
			thisIndex: this.thisIndex,
			ran: this.ran,
			finished: this._finished,

			getCurrentTrial: () => this.getTrial(currentIndex),
			getTrial: (index = 0) => this.getTrial(index),
		};

		this._snapshots.push(snapshot);

		return snapshot;
	}


	/**
	 * Setter for the finished attribute.
	 *
	 * @param {boolean} isFinished - whether or not the loop is finished.
	 */
	set finished(isFinished)
	{
		this._finished = isFinished;
		
		this._snapshots.forEach( snapshot =>
		{
			snapshot.finished = isFinished;
		});
	}


	/**
	 * Get the trial index.
	 *
	 * @public
	 * @return {number} the current trial index
	 */
	getTrialIndex()
	{
		return this.thisIndex;
	}


	/**
	 * Set the trial index.
	 *
	 * @param {number} index - the new trial index
	 */
	setTrialIndex(index)
	{
		this.thisIndex = index;
	}


	/**
	 * Get the attributes of the trials.
	 *
	 * <p>Note: we assume that all trials in the trialList share the same attributes
	 * and consequently consider only the attributes of the first trial.</p>
	 *
	 * @public
	 * @return {Array.string} the attributes
	 */
	getAttributes()
	{
		if (!Array.isArray(this.trialList) || this.nStim === 0)
		{
			return [];
		}

		const firstTrial = this.trialList[0];
		if (!firstTrial)
		{
			return [];
		}

		return Object.keys(this.trialList[0]);
	}


	/**
	 * Get the current trial.
	 *
	 * @public
	 * @return {Object} the current trial
	 */
	getCurrentTrial()
	{
		return this.trialList[this.thisIndex];
	}


	/**
	 * Get the nth trial.
	 *
	 * @param {number} index - the trial index
	 * @return {Object|undefined} the requested trial or undefined if attempting to go beyond the last trial.
	 */
	getTrial(index = 0)
	{
		if (index < 0 || index > this.nTotal)
		{
			return undefined;
		}

		return this.trialList[index];
	}


	/**
	 * Get the nth future or past trial, without advancing through the trial list.
	 *
	 * @public
	 * @param {number} [n = 1] - increment
	 * @return {Object|undefined} the future trial (if n is positive) or past trial (if n is negative)
	 * or undefined if attempting to go beyond the last trial.
	 */
	getFutureTrial(n = 1)
	{
		if (this.thisIndex + n < 0 || n > this.nRemaining)
		{
			return undefined;
		}

		return this.trialList[this.thisIndex + n];
	}


	/**
	 * Get the nth previous trial.
	 * <p> Note: this is useful for comparisons in n-back tasks.</p>
	 *
	 * @public
	 * @param {number} [n = -1] - increment
	 * @return {Object|undefined} the past trial or undefined if attempting to go prior to the first trial.
	 */
	getEarlierTrial(n = -1)
	{
		return getFutureTrial(-abs(n));
	}


	/**
	 * Add a key/value pair to data about the current trial held by the experiment handler
	 *
	 * @public
	 * @param {Object} key - the key
	 * @param {Object} value - the value
	 */
	addData(key, value)
	{
		if (this._experimentHandler)
		{
			this._experimentHandler.addData(key, value);
		}
	}


	/**
	 * Import a list of conditions from a .xls, .xlsx, .odp, or .csv resource.
	 *
	 * <p>The output is suitable as an input to 'TrialHandler', 'trialTypes' or
	 * 'MultiStairHandler' as a 'conditions' list.</p>
	 *
	 * <p>The resource should contain one row per type of trial needed and one column
	 * for each parameter that defines the trial type. The first row should give
	 * parameter names, which should:
	 * <ul>
	 * <li>be unique</li>
	 * <li>begin with a letter (upper or lower case)</li>
	 * <li>contain no spaces or other punctuation (underscores are permitted)</li>
	 * </ul></p>
	 *
	 * <p>Note that we only consider the first worksheet for .xls, .xlsx and .odp resource.</p>
	 *
	 *
	 * <p> 'selection' is used to select a subset of condition indices to be used
	 * It can be a single integer, an array of indices, or a string to be parsed, e.g.:
	 *	5
	 *	[1,2,3,10]
	 *	'1,5,10'
	 *	'1:2:5'
	 *	'5:'
	 *	'-5:-2, 9, 11:5:22'
	 *
	 * @public
	 * @static
	 * @param {module:core.ServerManager} serverManager - the server manager
	 * @param {String} resourceName - the name of the resource containing the list of conditions, which must have been registered with the server manager.
	 * @param {Object} [selection = null] - the selection
	 * @return {Object} the parsed conditions as an array of 'object as map'
	 * @throws {Object} Throws an exception if importing the conditions failed.
	 */
	static importConditions(serverManager, resourceName, selection = null)
	{
		try
		{
			let resourceExtension = resourceName.split('.').pop();
			if (['csv', 'odp', 'xls', 'xlsx'].indexOf(resourceExtension) > -1)
			{
				// (*) read conditions from resource:
				const resourceValue = serverManager.getResource(resourceName);

				// Conditionally use a `TextDecoder` to reprocess .csv type input,
				// which is then read in as a string
				const decodedResourceMaybe = new Uint8Array(resourceValue);
				// Could be set to 'buffer' for ASCII .csv
				const type = resourceExtension === 'csv' ? 'string' : 'array';
				const decodedResource = type === 'string' ? (new TextDecoder()).decode(decodedResourceMaybe) : decodedResourceMaybe;
				const workbook = XLSX.read(decodedResource, { type });

				// we consider only the first worksheet:
				if (workbook.SheetNames.length === 0)
				{
					throw 'workbook should contain at least one worksheet';
				}
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// worksheet to array of arrays (the first array contains the fields):
				const sheet = XLSX.utils.sheet_to_json(worksheet, {header: 1, blankrows: false});
				const fields = sheet.shift();

				// (*) select conditions:
				const selectedRows = (selection === null) ? sheet : util.selectFromArray(sheet, selection);

				// (*) return the selected conditions as an array of 'object as map':
				// [
				// 		{field0: value0-0, field1: value0-1, ...}
				//		{field0: value1-0, field1: value1-1, ...}
				//		...
				// ]
				let trialList = new Array(selectedRows.length - 1);
				for (let r = 0; r < selectedRows.length; ++r)
				{
					let row = selectedRows[r];
					let trial = {};
					for (let l = 0; l < fields.length; ++l)
					{
						let value = row[l];

						// Look for string encoded arrays in the form of '[1, 2]'
						const arrayMaybe = util.turnSquareBracketsIntoArrays(value);

						if (Array.isArray(arrayMaybe))
						{
							// Keep the first match if more than one are found. If the
							// input string looked like '[1, 2][3, 4]' for example,
							// the resulting `value` would be [1, 2]. When `arrayMaybe` is
							// empty, `value` turns `undefined`. At this point that might
							// only happen if `value` is an empty array to begin with.
							value = arrayMaybe[0];
						}

						// if value is a numerical string, convert it to a number:
						if (typeof value === 'string' && !isNaN(value))
						{
							value = Number.parseFloat(value);
						}

						trial[fields[l]] = value;
					}
					trialList[r] = trial;
				}

				return trialList;
			}

			else
			{
				throw 'extension: ' + resourceExtension + ' currently not supported.';
			}
		}
		catch (error)
		{
			throw {
				origin: 'TrialHandler.importConditions',
				context: `when importing condition: ${resourceName}`,
				error
			};
		}
	}


	/**
	 * Prepare the trial list.
	 *
	 * @protected
	 * @param {Array.<Object> | String} trialList - a list of trials, or the name of a condition resource
	 */
	_prepareTrialList(trialList)
	{
		const response = {
			origin: 'TrialHandler._prepareTrialList',
			context: 'when preparing the trial list'
		};

		// we treat undefined trialList as a list with a single empty entry:
		if (typeof trialList === 'undefined')
		{
			this.trialList = [undefined];
		}

		// if trialList is an array, we make sure it is not empty:
		else if (Array.isArray(trialList))
		{
			if (trialList.length === 0)
			{
				this.trialList = [undefined];
			}
		}

		// if trialList is a string, we treat it as the name of the condition resource:
		else if (typeof trialList === 'string')
		{
			this.trialList = TrialHandler.importConditions(this.psychoJS.serverManager, trialList);
		}

		// unknown type:
		else
		{
			throw Object.assign(response, {
				error: 'unable to prepare trial list: unknown type: ' + (typeof trialList)
			});
		}
	}


	/*
	 * Prepare the sequence of trials.
	 *
	 * <p>The returned sequence is a matrix (an array of arrays) of trial indices
	 * with nStim columns and nReps rows. Note that this is the transpose of the
	 * matrix return by PsychoPY.
	 * 
	 * Example: with 3 trial and 5 repetitions, we get:
	 *   - sequential:
	 *      [[0 1 2]
	 *       [0 1 2]
	 *       [0 1 2]
	 *       [0 1 2]
	 *       [0 1 2]]
	 *
	 * These 3*5 = 15 trials will be returned by the TrialHandler generator
	 * - with method = 'sequential' in the order:
	 *    0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2
	 * - with method = 'random' in the order (amongst others):
	 *    2, 1, 0, 0, 2, 1, 0, 1, 2, 0, 1, 2, 1, 2, 0
	 * - with method = 'fullRandom' in the order (amongst others):
	 *    2, 0, 0, 1, 0, 2, 1, 2, 0, 1, 1, 1, 2, 0, 2
	 * </p>
	 *
	 * @protected
	 */
	_prepareSequence()
	{
		const response = {
			origin: 'TrialHandler._prepareSequence',
			context: 'when preparing a sequence of trials'
		};

		// get an array of the indices of the elements of trialList :
		const indices = Array.from(this.trialList.keys());

		// seed the random number generator:
		if (typeof (this.seed) !== 'undefined')
		{
			Math.seedrandom(this.seed);
		}
		else
		{
			Math.seedrandom();
		}

		if (this.method === TrialHandler.Method.SEQUENTIAL)
		{
			this._trialSequence = Array(this.nReps).fill(indices);
			// transposed version:
			//this._trialSequence = indices.reduce( (seq, e) => { seq.push( Array(this.nReps).fill(e) ); return seq; }, [] );
		}

		else if (this.method === TrialHandler.Method.RANDOM)
		{
			this._trialSequence = [];
			for (let i = 0; i < this.nReps; ++i)
			{
				this._trialSequence.push(util.shuffle(indices.slice()));
			}
		}

		else if (this.method === TrialHandler.Method.FULL_RANDOM)
		{
			// create a flat sequence with nReps repeats of indices:
			let flatSequence = [];
			for (let i = 0; i < this.nReps; ++i)
			{
				flatSequence.push.apply(flatSequence, indices);
			}

			// shuffle the sequence:
			util.shuffle(flatSequence);

			// reshape it into the trialSequence:
			this._trialSequence = [];
			for (let i = 0; i < this.nReps; i++)
			{
				this._trialSequence.push(flatSequence.slice(i * this.nStim, (i + 1) * this.nStim));
			}
		}
		else
		{
			throw Object.assign(response, {error: 'unknown method'});
		}

		return this._trialSequence;
	}

}


/**
 * TrialHandler method
 *
 * @enum {Symbol}
 * @readonly
 * @public
 */
TrialHandler.Method = {
	/**
	 * Conditions are presented in the order they are given.
	 */
	SEQUENTIAL: Symbol.for('SEQUENTIAL'),

	/**
	 * Conditions are shuffled within each repeat.
	 */
	RANDOM: Symbol.for('RANDOM'),

	/**
	 * Conditions are fully randomised across all repeats.
	 */
	FULL_RANDOM: Symbol.for('FULL_RANDOM')
};
