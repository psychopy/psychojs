/**
 * @file Experiment Handler
 * 
 * @author Alain Pitiot
 * @version 3.0.0b11
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import { PsychObject } from '../util/PsychObject'
import { MonotonicClock } from '../util/Clock'


/**
 * <p>An ExperimentHandler keeps track of multiple loops and handlers. It is particularly useful
 * for generating a single data file from an experiment with many different loops (e.g. interleaved
 * staircases or loops within loops.</p>
 * 
 * @name module:data.ExperimentHandler
 * @class 
 * @extends PsychObject
 * @param {Object} options
 * @param {PsychoJS} options.psychoJS - the PsychoJS instance
 * @param {string} options.name - name of the experiment
 * @param {Object} options.extraInfo - additional information, such as session name, participant name, etc.
 */
export class ExperimentHandler extends PsychObject {

	/**
	 * Getter for experimentEnded.
	 * 
	 * @name module:core.Window#experimentEnded
	 * @function
	 * @public
	 */
	get experimentEnded() { return this._experimentEnded; }

	/**
	 * Setter for experimentEnded.
	 * 
	 * @name module:core.Window#experimentEnded
	 * @function
	 * @public
	 */
	set experimentEnded(ended) { this._experimentEnded = ended; }


	constructor({
		psychoJS,
		name,
		extraInfo
	} = {}) {
		super(psychoJS, name);

		this._addAttributes(ExperimentHandler, name, extraInfo);

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
	 * Add a loop.
	 * <p> The loop might be a {@link TrialHandler} or a {@link StairHandler}, for instance.</p>
	 * <p> Data from this loop will be included in the resulting data files.</p>
	 *
	 * @name module:data.ExperimentHandler#addLoop
	 * @function
	 * @public
	 * @param {Object} loop - the loop, e.g. an instance of TrialHandler or StairHandler
	 */
	addLoop(loop) {
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
	removeLoop(loop) {
		const index = this._unfinishedLoops.indexOf(loop);
		if (index !== -1) {
			this._unfinishedLoops.splice(index, 1);
		}
	}


	/**
	 * Add the key/value pair.
	 *
	 * <p> This method is typically called by a {@link TrialHandler}. </p>
	 * <p> Multiple key/value pairs can be added to any given entry of the data file. There are
	 * considered part of the same entry until a call to {@link nextEntry} is made. </p>
	 *
	 * @name module:data.ExperimentHandler#addData
	 * @function
	 * @public
	 * @param {Object} key - the key
	 * @param {Object} value - the value
	 */
	addData(key, value) {
		if (this._trialsKeys.indexOf(key) === -1) {
			this._trialsKeys.push(key);
		};

		this._currentTrialData[key] = value;
	}


	/**
	 * Inform this ExperimentHandler that the current trial has ended.  Further calls to {@link addData}
	 * will be associated with the next trial.
	 *
	 * @name module:data.ExperimentHandler#nextEntry
	 * @function
	 * @public
	 */
	nextEntry() {
		// fetch data from each (potentially-nested) loop:
		for (const loop of this._unfinishedLoops) {
			var attributes = this.getLoopAttributes(loop);
			for (const a in attributes)
				if (attributes.hasOwnProperty(a))
					this._currentTrialData[a] = attributes[a];
		}

		// add the extraInfo dict to the data:
		for (const a in this.extraInfo)
			if (this.extraInfo.hasOwnProperty(a))
				this._currentTrialData[a] = this.extraInfo[a];

		this._trialsData.push(this._currentTrialData);

		this._currentTrialData = {};
	}


	/**
	 * Save the results of the experiment.
	 * <p> Results are uploaded to the remote PsychoJS manager running on the remote https://pavlovia.org server</p>
	 *
	 * @name module:data.ExperimentHandler#save
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {PsychoJS} options.attributes - the attributes to be saved
	 *
	 * @todo deal with attributes
	 */
	async save({
		attributes = []
	} = {}) {
		this._psychoJS.logger.info('[PsychoJS] Save experiment results.');

		// key is based on extraInfo:
		const info = this.extraInfo;
		let key = (typeof info.expName !== 'undefined') ? info.expName : this.psychoJS.config.experiment.name;
		key += "_" + ((typeof info.participant === 'string' && info.participant.length > 0) ? info.participant : 'PARTICIPANT');
		key += "_" + ((typeof info.session === 'string' && info.session.length > 0) ? info.session : 'SESSION');
		key += "_" + ((typeof info.date !== 'undefined') ? info.date : MonotonicClock.getDateStr());

		// data is in the csv format:
		// build the csv header:
		var csv = "";
		var header = this._trialsKeys;
		for (var l = 0; l < this._loops.length; l++) {
			var loop = this._loops[l];

			var loopAttributes = this.getLoopAttributes(loop);
			for (var a in loopAttributes)
				if (loopAttributes.hasOwnProperty(a))
					header.push(a);
		}
		for (var a in this.extraInfo) {
			if (this.extraInfo.hasOwnProperty(a))
				header.push(a);
		}

		for (var h = 0; h < header.length; h++) {
			if (h > 0)
				csv = csv + ', ';
			csv = csv + header[h];
		}
		csv = csv + '\n';

		// build the records:
		for (var r = 0; r < this._trialsData.length; r++) {
			for (var h = 0; h < header.length; h++) {
				if (h > 0)
					csv = csv + ', ';
				csv = csv + this._trialsData[r][header[h]];
			}
			csv = csv + '\n';
		}

		// upload data to the remote PsychoJS manager:
		return await this._psychoJS.serverManager.uploadData(key + '.csv', csv);
	}


	/**
	 * Get the attribute names and values for the current trial of a given loop.
	 * <p> Only only info relating to the trial execution are returned.</p>
	 * 
	 * @name module:data.ExperimentHandler#getLoopAttributes
	 * @function
	 * @public
	 * @param {Object} loop - the loop
	 */
	getLoopAttributes(loop) {
		const loopName = loop['name'];

		// standard attributes:
		const properties = ['thisRepN', 'thisTrialN', 'thisN', 'thisIndex', 'stepSizeCurrent', 'ran', 'order'];
		let attributes = {};
		for (const property of properties)
			for (const loopProperty in loop)
				if (loopProperty === property) {
					if (property === 'stepSizeCurrent')
						var key = loopName + '.stepSize';
					else
						key = loopName + '.' + property;

					attributes[key] = loop[property];
				}

		// trial's attributes:
		if (typeof loop.getCurrentTrial === 'function') {
			const currentTrial = loop.getCurrentTrial();
			for (const trialProperty in currentTrial)
				attributes[trialProperty] = currentTrial[trialProperty];
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
