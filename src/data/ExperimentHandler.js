/**
 * Experiment Handler
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {PsychObject} from '../util/PsychObject';
import {MonotonicClock} from '../util/Clock';
import * as util from '../util/Util';


/**
 * <p>An ExperimentHandler keeps track of multiple loops and handlers. It is particularly useful
 * for generating a single data file from an experiment with many different loops (e.g. interleaved
 * staircases or loops within loops.</p>
 *
 * @name module:data.ExperimentHandler
 * @class
 * @extends PsychObject
 * @param {Object} options
 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {string} options.name - name of the experiment
 * @param {Object} options.extraInfo - additional information, such as session name, participant name, etc.
 */
export class ExperimentHandler extends PsychObject
{

	/**
	 * Getter for experimentEnded.
	 *
	 * @name module:core.Window#experimentEnded
	 * @function
	 * @public
	 */
	get experimentEnded()
	{
		return this._experimentEnded;
	}

	/**
	 * Setter for experimentEnded.
	 *
	 * @name module:core.Window#experimentEnded
	 * @function
	 * @public
	 */
	set experimentEnded(ended)
	{
		this._experimentEnded = ended;
	}


	/**
	 * Legacy experiment getters.
	 */
	get _thisEntry()
	{
		return this._currentTrialData;
	}

	get _entries()
	{
		return this._trialsData;
	}


	constructor({
								psychoJS,
								name,
								extraInfo
							} = {})
	{
		super(psychoJS, name);

		this._addAttributes(ExperimentHandler, extraInfo);

		// loop handlers:
		this._loops = [];
		this._unfinishedLoops = [];

		// data dictionaries (one per trial) and current data dictionary:
		this._trialsKeys = [];
		this._trialsData = [];
		this._currentTrialData = {};

		this._experimentEnded = false;
	}


	/**
	 * Whether or not the current entry (i.e. trial data) is empty.
	 * <p>Note: this is mostly useful at the end of an experiment, in order to ensure that the last entry is saved.</p>
	 *
	 * @name module:data.ExperimentHandler#isEntryEmpty
	 * @function
	 * @public
	 * @returns {boolean} whether or not the current entry is empty
	 */
	isEntryEmpty()
	{
		return (Object.keys(this._currentTrialData).length > 0);
	}

	isEntryEmtpy()
	{
		return (Object.keys(this._currentTrialData).length > 0);
	}


	/**
	 * Add a loop.
	 *
	 * <p> The loop might be a {@link TrialHandler}, for instance.</p>
	 * <p> Data from this loop will be included in the resulting data files.</p>
	 *
	 * @name module:data.ExperimentHandler#addLoop
	 * @function
	 * @public
	 * @param {Object} loop - the loop, e.g. an instance of TrialHandler or StairHandler
	 */
	addLoop(loop)
	{
		this._loops.push(loop);
		this._unfinishedLoops.push(loop);
		loop.experimentHandler = this;
	}


	/**
	 * Remove the given loop from the list of unfinished loops, e.g. when it has completed.
	 *
	 * @name module:data.ExperimentHandler#removeLoop
	 * @function
	 * @public
	 * @param {Object} loop - the loop, e.g. an instance of TrialHandler or StairHandler
	 */
	removeLoop(loop)
	{
		const index = this._unfinishedLoops.indexOf(loop);
		if (index !== -1)
		{
			this._unfinishedLoops.splice(index, 1);
		}
	}


	/**
	 * Add the key/value pair.
	 *
	 * <p> Multiple key/value pairs can be added to any given entry of the data file. There are
	 * considered part of the same entry until a call to {@link nextEntry} is made. </p>
	 *
	 * @name module:data.ExperimentHandler#addData
	 * @function
	 * @public
	 * @param {Object} key - the key
	 * @param {Object} value - the value
	 */
	addData(key, value)
	{
		if (this._trialsKeys.indexOf(key) === -1)
		{
			this._trialsKeys.push(key);
		}

		// turn arrays into their json equivalent:
		if (Array.isArray(value))
		{
			value = JSON.stringify(value);
		}

		this._currentTrialData[key] = value;
	}


	/**
	 * Inform this ExperimentHandler that the current trial has ended.  Further calls to {@link addData}
	 * will be associated with the next trial.
	 *
	 * @name module:data.ExperimentHandler#nextEntry
	 * @function
	 * @public
	 * @param {Object[]} snapshots - array of loop snapshots
	 */
	nextEntry(snapshots)
	{
		if (typeof snapshots !== 'undefined')
		{
			// turn single snapshot into a one-element array:
			if (!Array.isArray(snapshots))
			{
				snapshots = [snapshots];
			}

			for (const snapshot of snapshots)
			{
				const attributes = ExperimentHandler._getLoopAttributes(snapshot);
				for (let a in attributes)
				{
					if (attributes.hasOwnProperty(a))
					{
						this._currentTrialData[a] = attributes[a];
					}
				}
			}

		}
		// this is to support legacy generated JavaScript code and does not properly handle
		// loops within loops:
		else
		{
			for (const loop of this._unfinishedLoops)
			{
				const attributes = ExperimentHandler._getLoopAttributes(loop);
				for (const a in attributes)
				{
					if (attributes.hasOwnProperty(a))
					{
						this._currentTrialData[a] = attributes[a];
					}
				}
			}
		}

		// add the extraInfo dict to the data:
		for (let a in this.extraInfo)
		{
			if (this.extraInfo.hasOwnProperty(a))
			{
				this._currentTrialData[a] = this.extraInfo[a];
			}
		}

		this._trialsData.push(this._currentTrialData);

		this._currentTrialData = {};
	}


	/**
	 * Save the results of the experiment.
	 *
	 * <ul>
	 *   <li>For an experiment running locally, the results are offered for immediate download.</li>
	 *   <li>For an experiment running on the server, the results are uploaded to the server.</li>
	 * </ul>
	 * <p>
	 *
	 * @name module:data.ExperimentHandler#save
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {Array.<Object>} [options.attributes] - the attributes to be saved
	 * @param {Array.<Object>} [options.sync] - whether or not to communicate with the server in a synchronous manner
	 */
	async save({
							 attributes = [],
							 sync = false
						 } = {})
	{
		this._psychoJS.logger.info('[PsychoJS] Save experiment results.');

		// (*) get attributes:
		if (attributes.length === 0)
		{
			attributes = this._trialsKeys.slice();
			for (let l = 0; l < this._loops.length; l++)
			{
				const loop = this._loops[l];

				const loopAttributes = ExperimentHandler._getLoopAttributes(loop);
				for (let a in loopAttributes)
				{
					if (loopAttributes.hasOwnProperty(a))
					{
						attributes.push(a);
					}
				}
			}
			for (let a in this.extraInfo)
			{
				if (this.extraInfo.hasOwnProperty(a))
				{
					attributes.push(a);
				}
			}
		}


		// (*) get various experiment info:
		const info = this.extraInfo;
		const __experimentName = (typeof info.expName !== 'undefined') ? info.expName : this.psychoJS.config.experiment.name;
		const __participant = ((typeof info.participant === 'string' && info.participant.length > 0) ? info.participant : 'PARTICIPANT');
		const __session = ((typeof info.session === 'string' && info.session.length > 0) ? info.session : 'SESSION');
		const __datetime = ((typeof info.date !== 'undefined') ? info.date : MonotonicClock.getDateStr());
		const gitlabConfig = this._psychoJS.config.gitlab;
		const __projectId = (typeof gitlabConfig !== 'undefined' && typeof gitlabConfig.projectId !== 'undefined') ? gitlabConfig.projectId : undefined;


		// (*) save to a .csv file:
		if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV)
		{
			// note: we use the XLSX library as it automatically deals with header, takes care of quotes,
			// newlines, etc.
			const worksheet = XLSX.utils.json_to_sheet(this._trialsData);
			const csv = XLSX.utils.sheet_to_csv(worksheet);

			// upload data to the pavlovia server or offer them for download:
			const key = __participant + '_' + __experimentName + '_' + __datetime + '.csv';
			if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER &&
				this._psychoJS.config.experiment.status === 'RUNNING' &&
				!this._psychoJS._serverMsg.has('__pilotToken'))
			{
				return /*await*/ this._psychoJS.serverManager.uploadData(key, csv, sync);
			}
			else
			{
				util.offerDataForDownload(key, csv, 'text/csv');
			}
		}


		// (*) save in the database on the remote server:
		else if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE)
		{
			let documents = [];

			for (let r = 0; r < this._trialsData.length; r++)
			{
				let doc = {__projectId, __experimentName, __participant, __session, __datetime};
				for (let h = 0; h < attributes.length; h++)
				{
					doc[attributes[h]] = this._trialsData[r][attributes[h]];
				}

				documents.push(doc);
			}

			// upload data to the pavlovia server or offer them for download:
			if (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER &&
				this._psychoJS.config.experiment.status === 'RUNNING' &&
				!this._psychoJS._serverMsg.has('__pilotToken'))
			{
				const key = 'results'; // name of the mongoDB collection
				return /*await*/ this._psychoJS.serverManager.uploadData(key, JSON.stringify(documents), sync);
			}
			else
			{
				util.offerDataForDownload('results.json', JSON.stringify(documents), 'application/json');
			}

		}
	}


	/**
	 * Get the attribute names and values for the current trial of a given loop.
	 * <p> Only info relating to the trial execution are returned.</p>
	 *
	 * @name module:data.ExperimentHandler#_getLoopAttributes
	 * @function
	 * @static
	 * @protected
	 * @param {Object} loop - the loop
	 */
	static _getLoopAttributes(loop)
	{
		// standard trial attributes:
		const properties = ['thisRepN', 'thisTrialN', 'thisN', 'thisIndex', 'stepSizeCurrent', 'ran', 'order'];
		let attributes = {};
		const loopName = loop.name;
		for (const loopProperty in loop)
		{
			if (properties.includes(loopProperty))
			{
				const key = (loopProperty === 'stepSizeCurrent') ? loopName + '.stepSize' : loopName + '.' + loopProperty;
				attributes[key] = loop[loopProperty];
			}
		}

		// specific trial attributes:
		if (typeof loop.getCurrentTrial === 'function')
		{
			const currentTrial = loop.getCurrentTrial();
			for (const trialProperty in currentTrial)
			{
				attributes[trialProperty] = currentTrial[trialProperty];
			}
		}

		/* TODO
		// method of constants
		if hasattr(loop, 'thisTrial'):
				trial = loop.thisTrial
				if hasattr(trial,'items'):#is a TrialList object or a simple dict
						for property,val in trial.items():
								if property not in self._paramNamesSoFar:
										self._paramNamesSoFar.append(property)
								names.append(property)
								vals.append(val)
				elif trial==[]:#we haven't had 1st trial yet? Not actually sure why this occasionally happens (JWP)
						pass
				else:
						names.append(loopName+'.thisTrial')
						vals.append(trial)
						
		// single StairHandler
		elif hasattr(loop, 'intensities'):
				names.append(loopName+'.intensity')
				if len(loop.intensities)>0:
						vals.append(loop.intensities[-1])
				else:
						vals.append(None)*/

		return attributes;
	}

}


/**
 * Experiment result format
 *
 * @name module:core.ServerManager#SaveFormat
 * @enum {Symbol}
 * @readonly
 * @public
 */
ExperimentHandler.SaveFormat = {
	/**
	 * Results are saved to a .csv file
	 */
	CSV: Symbol.for('CSV'),

	/**
	 * Results are saved to a database
	 */
	DATABASE: Symbol.for('DATABASE')
};


/**
 * Experiment environment.
 *
 * @enum {Symbol}
 * @readonly
 * @public
 */
ExperimentHandler.Environment = {
	SERVER: Symbol.for('SERVER'),
	LOCAL: Symbol.for('LOCAL')
};
