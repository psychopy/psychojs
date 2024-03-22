/**************
 * Gabor Test *
 **************/

// import { core, data, sound, util, visual } from '../../psychojs_experimental/psychojsPR519.js';
// import { core, data, sound, util, visual } from "../out/psychojs-2024.1.0.js";
import { core, data, sound, util, visual } from "./index.js";

import {StimInspector} from 'https://run.pavlovia.org/lgtst/stiminspector/StimInspector.js';
// import {StimInspector} from '../stiminspector/StimInspector.js';
// import {PsyexpReader} from '../psyexpreader/PsyexpReader.js';
const { PsychoJS } = core;
const { TrialHandler } = data;
const { Scheduler } = util;
//some handy aliases as in the psychopy scripts;
const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;

// store info about the experiment session:
let expName = 'gabor';  // from the Builder filename that created this script
let expInfo = {};

const TESTING = false;

// Start code blocks for 'Before Experiment'
// init psychoJS:
const psychoJS = new PsychoJS({
	debug: true
});
window.psychoJS = psychoJS;
window.util = util;

// open window:
psychoJS.openWindow({
	fullscr: false,
	color: new util.Color("gray"),
	units: 'height',
	waitBlanking: true
});

new StimInspector(psychoJS.window, { core, data, sound, util, visual });

// schedule the experiment:
// psychoJS.schedule(psychoJS.gui.DlgFromDict({
// 	dictionary: expInfo,
// 	title: expName
// }));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
// psychoJS.scheduleCondition(function() { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);
// flowScheduler.add(instructRoutineBegin());
// flowScheduler.add(instructRoutineEachFrame());
// flowScheduler.add(instructRoutineEnd());
flowScheduler.add(gaborRoutineBegin());
flowScheduler.add(gaborRoutineEachFrame());
flowScheduler.add(gaborRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

flowScheduler.start();

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);

psychoJS.start({
	expName: expName,
	expInfo: expInfo,
	configURL: "../config.json",
	resources: [
		// {
		//   name: "007",
		//   path: "007.jpg"
		// },
	]
});

psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.WARNING);

var frameDur;
async function updateInfo() {
	expInfo['date'] = util.MonotonicClock.getDateStr();  // add a simple timestamp
	expInfo['expName'] = expName;
	expInfo['psychopyVersion'] = '2021.3.0';
	expInfo['OS'] = window.navigator.platform;

	// store frame rate of monitor if we can measure it successfully
	expInfo['frameRate'] = psychoJS.window.getActualFrameRate();
	if (typeof expInfo['frameRate'] !== 'undefined')
		frameDur = 1.0 / Math.round(expInfo['frameRate']);
	else
		frameDur = 1.0 / 60.0; // couldn't get a reliable measure so guess

	// add info from the URL:
	util.addInfoFromUrl(expInfo);

	return Scheduler.Event.NEXT;
}

var instructClock;
var ready;
var gaborClock;
var gabor;
var stims = [];
window.grating2BlendMode = 'add';
var globalClock;
var routineTimer;

function addWheelListener () {
	let v = 1.;
	window.addEventListener('wheel', (e) => {
		if (!psychoJS) {
			return;
		}
		psychoJS._window._stimsContainer.position.y += e.deltaY * v;
	})
}

// var video;
async function experimentInit() {
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	ready = new core.Keyboard({psychoJS: psychoJS, clock: new util.Clock(), waitForStart: true});
	psychoJS.window.backgroundImage = "toxen";

	// Initialize components for Routine "gabor"
	gaborClock = new util.Clock();

	stims.push(
		// new visual.GratingStim({
		// 	win : psychoJS.window,
		// 	name: 'morph',
		// 	tex: 'sin',
		// 	mask: undefined,
		// 	ori: 0,
		// 	size: [512, 512],
		// 	pos: [0, 0],
		// 	units: "pix",
		// 	depth: 0
		// }),
		new visual.DotStim({
			win : psychoJS.window,
			name: 'dots',
			nDots: 100,
			ori: 0,
			size: [512, 512],
			pos: [0, 0],
			units: "pix",
			depth: 0,
			dotSize: 10,
			dotLife: 0,
			speed: 0.5,
			fieldShape: "circle"
		})
	);

	window.stims = stims;
	// Create some handy timers
	globalClock = new util.Clock();  // to track the time since experiment started
	routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine
	addWheelListener();

	return Scheduler.Event.NEXT;
}


var t;
var frameN;
var continueRoutine;
var gotValidClick;
var _ready_allKeys;
var instructComponents;
function instructRoutineBegin(snapshot) {
	return async function () {
		TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date

		//------Prepare to start Routine 'instruct'-------
		t = 0;
		instructClock.reset(); // clock
		frameN = -1;
		continueRoutine = true; // until we're told otherwise
		// update component parameters for each repeat
		ready.keys = undefined;
		ready.rt = undefined;
		_ready_allKeys = [];
		// keep track of which components have finished
		instructComponents = [];
		instructComponents.push(ready);

		for (const thisComponent of instructComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;
		return Scheduler.Event.NEXT;
	}
}


function instructRoutineEachFrame() {
	return async function () {
		//------Loop for each frame of Routine 'instruct'-------
		// get current time
		t = instructClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame

		// *ready* updates
		if (t >= 0 && ready.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			ready.tStart = t;  // (not accounting for frame time here)
			ready.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function() { ready.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function() { ready.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function() { ready.clearEvents(); });
		}

		if (ready.status === PsychoJS.Status.STARTED) {
			let theseKeys = ready.getKeys({keyList: [], waitRelease: false});
			_ready_allKeys = _ready_allKeys.concat(theseKeys);
			if (_ready_allKeys.length > 0) {
				ready.keys = _ready_allKeys[_ready_allKeys.length - 1].name;  // just the last key pressed
				ready.rt = _ready_allKeys[_ready_allKeys.length - 1].rt;
				// a response ends the routine
				continueRoutine = false;
			}
		}

		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		continueRoutine = false;  // reverts to True if at least one component still running
		for (const thisComponent of instructComponents)
			if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
				continueRoutine = true;
				break;
			}

		// refresh the screen if continuing
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			return Scheduler.Event.NEXT;
		}
	};
}


function instructRoutineEnd() {
	return async function () {
		//------Ending Routine 'instruct'-------
		for (const thisComponent of instructComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}
		ready.stop();
		// the Routine "instruct" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		return Scheduler.Event.NEXT;
	};
}


var gaborComponents;
function gaborRoutineBegin(snapshot) {
	return async function () {
		TrialHandler.fromSnapshot(snapshot); // ensure that .thisN vals are up to date

		//------Prepare to start Routine 'instruct'-------
		t = 0;
		gaborClock.reset(); // clock
		frameN = -1;
		continueRoutine = true; // until we're told otherwise
		// update component parameters for each repeat
		ready.keys = undefined;
		ready.rt = undefined;
		_ready_allKeys = [];
		// keep track of which components have finished
		gaborComponents = [];
		gaborComponents.push(ready);
		gaborComponents = [...gaborComponents, ...stims];


		for (const thisComponent of gaborComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

			return Scheduler.Event.NEXT;
	}
}

var secTimer = 0;
var prevTime = performance.now();
var dynamicDimension = 0;
var newSize = [512, 512];
var newPos = [0, 0];
var sizeTests = [-512, -256.1, -128, 128, 256.6, 512];
var positionTests = [-256, -256.1, 256, 256.1, 0];
var anchorTests = ["left", "topleft", "top", "topright", "right", "bottomright", "bottom", "bottomleft", "center"];
var sizeTestsProgress = 0;
var positionTestsProgress = 0;
var anchorTestsProgress = 0;
var continueAutoTest = true;
window.stopTest = function () {
	continueAutoTest = false;
};
window.startTest = function () {
	continueAutoTest = true;
};
function gaborRoutineEachFrame() {
	return async function () {
		//------Loop for each frame of Routine 'gabor'-------
		// get current time
		t = gaborClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)

		let i;
		for (i = 0; i < stims.length; i++) {
			if (t >= 0. && stims[i].status === PsychoJS.Status.NOT_STARTED) {
				stims[i].tStart = t;
				stims[i].frameNStart = frameN;
				stims[i].setAutoDraw(true);
			}
		}


		if (TESTING)
		{
			secTimer += performance.now() - prevTime;
			prevTime = performance.now();
			if (secTimer >= 1000 && continueAutoTest)
			{
				secTimer = 0;

				if (sizeTestsProgress < sizeTests.length * 2)
				{
					i = sizeTestsProgress % sizeTests.length;
					newSize[dynamicDimension] = sizeTests[i];
					stims[0].setSize(newSize);
					sizeTestsProgress++;
					console.log("stim size set to", stims[0].getSize());
					if (sizeTestsProgress % sizeTests.length === 0)
					{
						dynamicDimension = (dynamicDimension + 1) % 2;
					}
				}
				else if (sizeTestsProgress < sizeTests.length * 3)
				{
					i = sizeTestsProgress % sizeTests.length;
					newSize[0] = sizeTests[i];
					newSize[1] = sizeTests[i];
					stims[0].setSize(newSize);
					sizeTestsProgress++;
					console.log("stim size set to", stims[0].getSize());
				}
				else if (
					sizeTestsProgress >= sizeTests.length * 3 &&
					positionTestsProgress < positionTests.length * 2)
				{
					i = positionTestsProgress % positionTests.length;
					newPos[dynamicDimension] = positionTests[i];
					stims[0].setPos(newPos);
					positionTestsProgress++;
					console.log("stim pos set to", stims[0].getPos());
					if (positionTestsProgress % positionTests.length === 0)
					{
						newPos[dynamicDimension] = 0;
						dynamicDimension = (dynamicDimension + 1) % 2;
					}
				}
				else if(
					sizeTestsProgress >= sizeTests.length * 3 &&
					positionTestsProgress >= positionTests.length * 2 &&
					anchorTestsProgress < anchorTests.length)
				{
					i = anchorTestsProgress % anchorTests.length;
					stims[0].setAnchor(anchorTests[i]);
					anchorTestsProgress++;
					console.log("anchor set to", anchorTests[i]);
				}

				if (
					sizeTestsProgress >= sizeTests.length * 3 &&
					positionTestsProgress >= positionTests.length * 2 &&
					anchorTestsProgress >= anchorTests.length)
				{
					sizeTestsProgress = 0;
					positionTestsProgress = 0;
					anchorTestsProgress = 0;
					dynamicDimension = 0;
					newPos[0] = 0;
					newPos[1] = 0;
					newSize[0] = 512;
					newSize[1] = 512;
					console.log("============== full reset ==============");
					stims[0].setPos(newPos);
					stims[0].setSize(newSize);
					stims[0].setAnchor("center");
				}
			}
		}


		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0)
		{
			continueRoutine = false;
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		continueRoutine = false;  // reverts to True if at least one component still running
		for (const thisComponent of gaborComponents)
			if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
				continueRoutine = true;
				break;
			}

		// refresh the screen if continuing
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			return Scheduler.Event.NEXT;
		}
	};
}


function gaborRoutineEnd() {
	return async function () {
		//------Ending Routine 'gabor'-------
		for (const thisComponent of gaborComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}



		// the Routine "gabor" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		return Scheduler.Event.NEXT;
	};
}


function endLoopIteration(scheduler, snapshot) {
	// ------Prepare for next entry------
	return async function () {
		if (typeof snapshot !== 'undefined') {
			// ------Check if user ended loop early------
			if (snapshot.finished) {
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty()) {
					psychoJS.experiment.nextEntry(snapshot);
				}
				scheduler.stop();
			} else {
				const thisTrial = snapshot.getCurrentTrial();
				if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials) {
					psychoJS.experiment.nextEntry(snapshot);
				}
			}
		return Scheduler.Event.NEXT;
		}
	};
}


function importConditions(currentLoop) {
	return async function () {
		psychoJS.importAttributes(currentLoop.getCurrentTrial());
		return Scheduler.Event.NEXT;
		};
}


async function quitPsychoJS(message, isCompleted) {
	// Check for and save orphaned data
	if (psychoJS.experiment.isEntryEmpty()) {
		psychoJS.experiment.nextEntry();
	}
	psychoJS.window.close();
	psychoJS.quit({message: message, isCompleted: isCompleted});

	return Scheduler.Event.QUIT;
}
