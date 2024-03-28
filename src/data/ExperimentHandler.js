/**
 * Experiment Handler
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as XLSX from "xlsx";
import { MonotonicClock } from "../util/Clock.js";
import { PsychObject } from "../util/PsychObject.js";
import * as util from "../util/Util.js";

/**
 * <p>An ExperimentHandler keeps track of multiple loops and handlers. It is particularly useful
 * for generating a single data file from an experiment with many different loops (e.g. interleaved
 * staircases or loops within loops.</p>
 *
 * @extends PsychObject
 */
export class ExperimentHandler extends PsychObject
{
	/**
	 * Getter for experimentEnded.
	 */
	get experimentEnded()
	{
		return this._experimentEnded;
	}

	/**
	 * Setter for experimentEnded.
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

	/**
	 * @memberof module:data
	 * @param {Object} options
	 * @param {module:core.PsychoJS} options.psychoJS - the PsychoJS instance
	 * @param {string} options.name - name of the experiment
	 * @param {Object} options.extraInfo - additional information, such as session name, participant name, etc.
	 */
	constructor({
		psychoJS,
		name,
		extraInfo,
		dataFileName
	} = {})
	{
		super(psychoJS, name);

		this._addAttribute("extraInfo", extraInfo);

		// process the extra info:
		this._experimentName = (typeof extraInfo.expName === "string" && extraInfo.expName.length > 0)
			? extraInfo.expName
			: this.psychoJS.config.experiment.name;
		this._participant = (typeof extraInfo.participant === "string" && extraInfo.participant.length > 0)
			? extraInfo.participant
			: "PARTICIPANT";
		this._session = (typeof extraInfo.session === "string" && extraInfo.session.length > 0)
			? extraInfo.session
			: "SESSION";
		this._datetime = (typeof extraInfo.date !== "undefined")
			? extraInfo.date
			: MonotonicClock.getDateStr();

		this._addAttribute(
			"dataFileName",
			dataFileName,
			`${this._participant}_${this._experimentName}_${this._datetime}`
		);

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
	 * @returns {boolean} whether or not the current entry is empty
	 * @todo This really should be renamed: IsCurrentEntryNotEmpty
	 */
	isEntryEmpty()
	{
		return (Object.keys(this._currentTrialData).length > 0);
	}

	/**
	 * Add a loop.
	 *
	 * <p> The loop might be a {@link TrialHandler}, for instance.</p>
	 * <p> Data from this loop will be included in the resulting data files.</p>
	 *
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
	 * @param {Object | Object[] | undefined} snapshots - array of loop snapshots
	 */
	nextEntry(snapshots)
	{
		if (typeof snapshots !== "undefined")
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
	 * @param {Object} options
	 * @param {Array.<Object>} [options.attributes] - the attributes to be saved
	 * @param {boolean} [options.sync=false] - whether or not to communicate with the server in a synchronous manner
	 * @param {string} [options.tag=''] - an optional tag to add to the filename to which the data is saved (for CSV and XLSX saving options)
	 * @param {boolean} [options.clear=false] - whether or not to clear all experiment results immediately after they are saved (this is useful when saving data in separate chunks, throughout an experiment)
	 */
	async save({
		attributes = [],
		sync = false,
		tag = "",
		clear = false
	} = {})
	{
		this._psychoJS.logger.info("[PsychoJS] Save experiment results.");

		// get attributes:
		if (attributes.length === 0)
		{
			attributes = this._trialsKeys.slice();
			for (let l = 0; l < this._loops.length; l++)
			{
				const loop = this._loops[l];

				const loopAttributes = ExperimentHandler._getLoopAttributes(loop);
				for (const a in loopAttributes)
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

		let data = this._trialsData;

		// if the experiment data have to be cleared, we first make a copy of them:
		if (clear)
		{
			data = this._trialsData.slice();
			this._trialsData = [];
		}

		// save to a .csv file:
		if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV)
		{
			// note: we use the XLSX library as it automatically deals with header, takes care of quotes,
			// newlines, etc.
			// TODO only save the given attributes
			const worksheet = XLSX.utils.json_to_sheet(data);
			// prepend BOM
			const csv = "\ufeff" + XLSX.utils.sheet_to_csv(worksheet);

			// upload data to the pavlovia server or offer them for download:
			const filenameWithoutPath = this._dataFileName.split(/[\\/]/).pop();
			const key = `${filenameWithoutPath}${tag}.csv`;
			if (
				this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER
				&& this._psychoJS.config.experiment.status === "RUNNING"
				&& !this._psychoJS._serverMsg.has("__pilotToken")
			)
			{
				return /*await*/ this._psychoJS.serverManager.uploadData(key, csv, sync);
			}
			else
			{
				util.offerDataForDownload(key, csv, "text/csv");
			}
		}
		// save to the database on the pavlovia server:
		else if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE)
		{
			const gitlabConfig = this._psychoJS.config.gitlab;
			const __projectId = (typeof gitlabConfig !== "undefined" && typeof gitlabConfig.projectId !== "undefined") ? gitlabConfig.projectId : undefined;

			let documents = [];

			for (let r = 0; r < data.length; r++)
			{
				let doc = {
					__projectId,
					__experimentName: this._experimentName,
					__participant: this._participant,
					__session: this._session,
					__datetime: this._datetime
				};
				for (let h = 0; h < attributes.length; h++)
				{
					doc[attributes[h]] = data[r][attributes[h]];
				}

				documents.push(doc);
			}

			// upload data to the pavlovia server or offer them for download:
			if (
				this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER
				&& this._psychoJS.config.experiment.status === "RUNNING"
				&& !this._psychoJS._serverMsg.has("__pilotToken")
			)
			{
				const key = "results"; // name of the mongoDB collection
				return /*await*/ this._psychoJS.serverManager.uploadData(key, JSON.stringify(documents), sync);
			}
			else
			{
				util.offerDataForDownload("results.json", JSON.stringify(documents), "application/json");
			}
		}
	}

	/**
	 * Get the results of the experiment as a .csv string, ready to be uploaded or stored.
	 *
	 * @return {string} a .csv representation of the experiment results.
	 */
	getResultAsCsv()
	{
		// note: we use the XLSX library as it automatically deals with header, takes care of quotes,
		// newlines, etc.
		const worksheet = XLSX.utils.json_to_sheet(this._trialsData);
		return "\ufeff" + XLSX.utils.sheet_to_csv(worksheet);
	}

	/**
	 * Get the attribute names and values for the current trial of a given loop.
	 * <p> Only info relating to the trial execution are returned.</p>
	 *
	 * @protected
	 * @param {Object} loop - the loop
	 */
	static _getLoopAttributes(loop)
	{
		// standard trial attributes:
		const properties = ["thisRepN", "thisTrialN", "thisN", "thisIndex", "stepSizeCurrent", "ran", "order"];
		let attributes = {};
		const loopName = loop.name;
		for (const loopProperty in loop)
		{
			if (properties.includes(loopProperty))
			{
				const key = (loopProperty === "stepSizeCurrent") ? loopName + ".stepSize" : loopName + "." + loopProperty;
				attributes[key] = loop[loopProperty];
			}
		}

		// specific trial attributes:
		if (typeof loop.getCurrentTrial === "function")
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
 * @enum {Symbol}
 * @readonly
 */
ExperimentHandler.SaveFormat = {
	/**
	 * Results are saved to a .csv file
	 */
	CSV: Symbol.for("CSV"),

	/**
	 * Results are saved to a database
	 */
	DATABASE: Symbol.for("DATABASE"),
};

/**
 * Experiment environment.
 *
 * @enum {Symbol}
 * @readonly
 */
ExperimentHandler.Environment = {
	SERVER: Symbol.for("SERVER"),
	LOCAL: Symbol.for("LOCAL"),
};
