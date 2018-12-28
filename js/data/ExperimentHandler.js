/**
 * Experiment Handler
 * 
 * @author Alain Pitiot
 * @version 3.0.0b13
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
	 */
	nextEntry() {
		// fetch data from each (potentially-nested) loop:
		for (let loop of this._unfinishedLoops) {
			const attributes = ExperimentHandler._getLoopAttributes(loop);
			for (let a in attributes)
				if (attributes.hasOwnProperty(a))
					this._currentTrialData[a] = attributes[a];
		}

		// add the extraInfo dict to the data:
		for (let a in this.extraInfo)
			if (this.extraInfo.hasOwnProperty(a))
				this._currentTrialData[a] = this.extraInfo[a];

		this._trialsData.push(this._currentTrialData);

		this._currentTrialData = {};
	}


	/**
	 * Save the results of the experiment.
	 *
	 * <p> Results are uploaded to the remote https://pavlovia.org server</p>
	 *
	 * @name module:data.ExperimentHandler#save
	 * @function
	 * @public
	 * @param {Object} options
	 * @param {Array.<Object>} [options.attributes] - the attributes to be saved
	 */
	async save({
		attributes = []
	} = {}) {
		this._psychoJS.logger.info('[PsychoJS] Save experiment results.');

		// (*) get attributes:
		if (attributes.length === 0) {
			attributes = this._trialsKeys.slice();
			for (let l = 0; l < this._loops.length; l++) {
				const loop = this._loops[l];

				const loopAttributes = ExperimentHandler._getLoopAttributes(loop);
				for (let a in loopAttributes)
					if (loopAttributes.hasOwnProperty(a))
					attributes.push(a);
			}
			for (let a in this.extraInfo) {
				if (this.extraInfo.hasOwnProperty(a))
				attributes.push(a);
			}
		}


		// (*) get various experiment info:
		const info = this.extraInfo;
		const __experimentName = (typeof info.expName !== 'undefined') ? info.expName : this.psychoJS.config.experiment.name;
		const __participant = ((typeof info.participant === 'string' && info.participant.length > 0) ? info.participant : 'PARTICIPANT');
		const __session = ((typeof info.session === 'string' && info.session.length > 0) ? info.session : 'SESSION');
		const __datetime = ((typeof info.date !== 'undefined') ? info.date : MonotonicClock.getDateStr());
		const gitlabConfig = this._psychoJS.config.gitlab;
		const __projectId = (typeof gitlabConfig !== 'undefined' && typeof gitlabConfig.projectId !== 'undefined')?gitlabConfig.projectId:undefined;


		// (*) save to a .csv file on the remote server:
		if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV) {
			/*
			// a. manual approach
			let csv = "";

			// build the csv header:
			for (let h = 0; h < attributes.length; h++) {
				if (h > 0)
					csv = csv + ', ';
				csv = csv + attributes[h];
			}
			csv = csv + '\n';

			// build the records:
			for (let r = 0; r < this._trialsData.length; r++) {
				for (let h = 0; h < attributes.length; h++) {
					if (h > 0)
						csv = csv + ', ';
					csv = csv + this._trialsData[r][attributes[h]];
				}
				csv = csv + '\n';
			}
			*/

			// b. XLSX approach (automatically deal with header, takes care of quotes, newlines, etc.)
			const worksheet = XLSX.utils.json_to_sheet(this._trialsData);
			const csv = XLSX.utils.sheet_to_csv(worksheet);

			// upload data to the remote PsychoJS manager:
			const key = __participant + '_' + __experimentName + '_' + __datetime + '.csv';
			return await this._psychoJS.serverManager.uploadData(key, csv);
		}


		// (*) save in the database on the remote server:
		else if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE) {
			let documents = [];

			for (let r = 0; r < this._trialsData.length; r++) {
				let doc = { __projectId, __experimentName, __participant, __session, __datetime };
				for (let h = 0; h < attributes.length; h++)
					doc[attributes[h]] = this._trialsData[r][attributes[h]];

				documents.push(doc);
			}

			// upload data to the remote PsychoJS manager:
			const key = 'results'; // name of the mongoDB collection
			return await this._psychoJS.serverManager.uploadData(key, JSON.stringify(documents));
		}
	}


	/**
	 * Get the attribute names and values for the current trial of a given loop.
	 * <p> Only only info relating to the trial execution are returned.</p>
	 * 
	 * @name module:data.ExperimentHandler#_getLoopAttributes
	 * @function
	 * @static
	 * @protected
	 * @param {Object} loop - the loop
	 */
	static _getLoopAttributes(loop) {
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
