/**
 * Experiment Handler
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as XLSX from "xlsx";
import { MonotonicClock } from "../util/Clock.js";
import { PsychObject } from "../util/PsychObject.js";
import * as util from "../util/Util.js";
import { calibrationTime } from "../../../components/global.js";

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
	 * @name module:data.ExperimentHandler#experimentEnded
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
	 * @name module:data.ExperimentHandler#experimentEnded
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
		extraInfo,
		dataFileName
	} = {})
	{
		super(psychoJS, name);

		this._addAttribute("extraInfo", extraInfo);

		// process the extra info:
		// this._experimentName = (typeof extraInfo.expName === "string" && extraInfo.expName.length > 0)
		// 	? extraInfo.expName
		// 	: this.psychoJS.config.experiment.name;
		this._experimentName = this.psychoJS.config.experiment.name;

		this._participant = (typeof extraInfo.participant === "string" && extraInfo.participant.length > 0)
			? extraInfo.participant
			: "PARTICIPANT";
		const prolificParticipant = extraInfo.ProlificParticipantID
			? extraInfo.ProlificParticipantID
			: undefined;

			this._session = (typeof extraInfo.session === "string" && extraInfo.session.length > 0)
			? extraInfo.session
			: "SESSION";

			this._datetime = (typeof extraInfo.date !== "undefined")
			? extraInfo.date
			: MonotonicClock.getDateStr();

		// ! controls final data file name
		this._addAttribute(
			"dataFileName",
			dataFileName,
			`${this._participant}_${
				prolificParticipant ? `${prolificParticipant}_` : ""
			}${this._experimentName}_${this._datetime}`
		);

		// loop handlers:
		this._loops = [];
		this._unfinishedLoops = [];

		// data dictionaries (one per trial) and current data dictionary:
		this._trialsKeys = [];
		this._trialsData = [];
		this._currentTrialData = {};
		this.experimentClock = new MonotonicClock();

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
		this._currentTrialData["secs"] = this.experimentClock.getTime();
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

		this.extraInfo["dataSaved"] = true;

		// get attributes:
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


		let data;
		({data, attributes} = this._orderOutput(this._trialsData, attributes));

		if (clear)
		{
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
			// const filenameWithoutPath = this._dataFileName.split(/[\\/]/).pop();
			const info = this._psychoJS.experiment.getExtraInfo();
			const participant = info.participant || "PARTICIPANT";
			const prolificParticipant = info.ProlificParticipantID || undefined;
			const experimentName = this._psychoJS.config.experiment.name;
			const session = info.session || "SESSION";
			const datetime = info.date || MonotonicClock.getDateStr();

			const filenameWithoutPath = `${participant}_${
				prolificParticipant ? `${prolificParticipant}_` : ""
			}${experimentName}_${session}_${datetime}`;
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
				console.log('documents', documents);
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
	 * Save curstom data to a csv file that is downloaded in addition to the usual output csv
	 *
	 * <ul>
	 *   <li>The results are offered for immediate download.</li>
	 * </ul>
	 * <p>
	 *
	 * @name module:data.ExperimentHandler#save
	 * @function
	 * @public
	 * @param {Array.<Object>} [data] - array of objects to be saved to the csv
	 * @param {string} [csvLabel="stimulus"] - suffix to be added to the output csv filename
	 */
	saveCSV(data, csvLabel="stimulus", online=false, isForMovieExperiment=false){
		// note: we use the XLSX library as it automatically deals with header, takes care of quotes,
		// newlines, etc.
		console.log(data);
		const worksheet = XLSX.utils.json_to_sheet(data);
		// prepend BOM
		const csv = "\ufeff" + XLSX.utils.sheet_to_csv(worksheet);

		const info = this._psychoJS.experiment.getExtraInfo();
		const participant = info.participant || "PARTICIPANT";
		const prolificParticipant = info.ProlificParticipantID || undefined;
		const experimentName = this._psychoJS.config.experiment.name;
		const session = info.session || "SESSION";
		const datetime = info.date || MonotonicClock.getDateStr();
		const filenameWithoutPath = isForMovieExperiment? csvLabel: `${participant}_${
			prolificParticipant ? `${prolificParticipant}_` : ""
		}${experimentName}_${session}_${datetime}_${csvLabel}`;
		const key = `${filenameWithoutPath}.csv`;
		let documents = [];
		const gitlabConfig = this._psychoJS.config.gitlab;
			const __projectId = (typeof gitlabConfig !== "undefined" && typeof gitlabConfig.projectId !== "undefined") ? gitlabConfig.projectId : undefined;
		for (let r = 0; r < data.length; r++) {
			data[r]['__projectId'] = __projectId;
			data[r]['__experimentName'] = this.psychoJS.config.experiment.name;
			data[r]['__participant'] = this._participant;
			data[r]['__session'] = this._session;
			data[r]['__datetime'] = this._datetime;
		}

		if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.CSV) { 
			if (online){
				try {
					this._psychoJS.serverManager.uploadData(key, csv, false);
				} catch (e) {
					console.error("Error saving csv data to online.", e);
				}
			} else {
				util.offerDataForDownload(key, csv, "text/csv");
			}
			} else if (this._psychoJS.config.experiment.saveFormat === ExperimentHandler.SaveFormat.DATABASE) {
			
				if (online){
					try {
						this._psychoJS.serverManager.uploadData('results', JSON.stringify(data), false);
					} catch (e) {
						console.error("Error saving to results.", e);
					}
				} else {
					util.offerDataForDownload(key, csv, "text/csv");
				}
			}
	}

	downloadJSON(data, i) {
		const info = this._psychoJS.experiment.getExtraInfo();
		const participant = info.participant || "PARTICIPANT";
		const session = info.session || "SESSION";
		const datetime = calibrationTime.current
		const experimentName = this._psychoJS.config.experiment.name;
		const suffix = i == 0 ? "sound" : `M${i}`;
		const filename = `${participant}_${experimentName}_${session}_${datetime}_${suffix}.json`;
		const contentType = "application/json;charset=utf-8;";

		const anchor = document.createElement("a");
		anchor.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(data));
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		if (
			this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER
			&& this._psychoJS.config.experiment.status === "RUNNING"
			&& !this._psychoJS._serverMsg.has("__pilotToken")
		)
		{
			this._psychoJS.serverManager.uploadData(filename, JSON.stringify(data), false);
		}
		return filename;
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

	_orderOutput(data, attributes) {
		if (data.length === 0 || attributes.length === 0 || !this._psychoJS || this._psychoJS.inputParameters.length === 0) return {data: data, attributes: attributes};
		const inputParameters = [...this._psychoJS.inputParameters];
		const excludeAttributes = ["expName", "name", "blockNumber", "_s", "setSession", "targetMeasuredDurationFrames"];
		attributes = attributes.filter(a => !excludeAttributes.includes(a));
		const prependAttributes = ["experiment", "date", "WebGL_Report", "longTask"];
		const inputAttributes = inputParameters.filter(a => attributes.includes(a));
		const outputAttributes = attributes.filter(a => !inputParameters.includes(a) && !prependAttributes.includes(a));
		const orderedAttributes = [...prependAttributes, ...inputAttributes, ...outputAttributes];
		const orderingObj = {}; 
		for (const a of orderedAttributes) {
			orderingObj[a] = null;
		}
		for (let i=0; i<data.length; i++) {
			for (const a of excludeAttributes) {
				if(data[i].hasOwnProperty(a)) delete data[i][a];
			}
			data[i] = Object.assign(orderingObj, data[i]);
		}
		return {data: data, attributes: orderedAttributes};
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
 * @public
 */
ExperimentHandler.Environment = {
	SERVER: Symbol.for("SERVER"),
	LOCAL: Symbol.for("LOCAL"),
};
