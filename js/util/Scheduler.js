/**
 * Scheduler.
 * 
 * @author Alain Pitiot
 * @version 3.0.0b11
 * @copyright (c) 2018 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * <p>A scheduler helps run the main loop by managing scheduled functions,
 * called tasks, after each frame is displayed.</p>
 * 
 * <p>
 * Tasks are either another [Scheduler]{@link module:util.Scheduler}, or a
 * javascript functions returning one of the following codes:
 * <ul>
 * <li>Scheduler.Event.NEXT: </li>
 * <li>Scheduler.Event.FLIP_REPEAT: </li>
 * <li>Scheduler.Event.FLIP_NEXT: </li>
 * <li>Scheduler.Event.QUIT: </li>
 * </ul>
 * </p>
 * 
 * <p> It is possible to create sub-schedulers, e.g. to handle loops.
 * Sub-schedulers are added to a parent scheduler as a normal
 * task would be by calling [scheduler.add(subScheduler)]{@link module:util.Scheduler#add}.</p>
 * 
 * <p> Conditional branching is also available:
 * [scheduler.addConditionalBranches]{@link module:util.Scheduler#addConditionalBranches}</p>
 * 
 * 
 * @name module:util.Scheduler
 * @class
 * @param {PsychoJS} psychoJS - the PsychoJS instance
 * 
 */
export class Scheduler {


	constructor(psychoJS) {
		this._psychoJS = psychoJS;

		this._taskList = [];
		this._currentTask = undefined;
		this._argsList = [];
		this._currentArgs = undefined;

		this._stopAtNextUpdate = false;
	}


	/**
	 * Schedule a task.
	 * 
	 * @name module:util.Scheduler#add
	 * @public
	 * @param task - the task to be scheduled
	 * @param args - arguments for that task
	 */
	add(task, args) {
		this._taskList.push(task);
		this._argsList.push(args);
	}


	/**
	 * Condition evaluated when the task is run.
	 *  
	 * @callback module:util.Scheduler~Condition
	 * @return {boolean} 
	 */
	/**
	 * Schedule a series of task or another, based on a condition.
	 * 
	 * <p>Note: the tasks are [sub-schedulers]{@link module:util.Scheduler}.</p>
	 * 
	 * @name module:util.Scheduler#addConditional
	 * @public
	 * @param {module:util.Scheduler~Condition} condition - the condition
	 * @param {module:util.Scheduler} thenScheduler - the [Scheduler]{@link module:util.Scheduler} to be run if the condition is satisfied
	 * @param {module:util.Scheduler} elseScheduler - the [Scheduler]{@link module:util.Scheduler} to be run if the condition is not satisfied
	 */
	addConditional(condition, thenScheduler, elseScheduler) {
		let self = this;
		let task = function () {
			if (condition())
				self.add(thenScheduler);
			else
				self.add(elseScheduler)

			return Scheduler.Event.NEXT;
		};

		this.add(task);
	}



	/**
	 * Run the next scheduled tasks in sequence until one of them returns something other than Scheduler.Event.NEXT.
	 * 
	 * @name module:util.Scheduler#run
	 * @public
	 * @return {module:util.Schedule#Event} the state of the scheduler after the task ran
	 */
	run() {
		let state = Scheduler.Event.NEXT;

		while (state === Scheduler.Event.NEXT) {
			if (typeof this._currentTask == 'undefined') {
				if (this._taskList.length > 0) {
					this._currentTask = this._taskList.shift();
					this._currentArgs = this._argsList.shift();
				}
				else {
					this._currentTask = undefined;
					return Scheduler.Event.QUIT;
				}
			}
			if (this._currentTask instanceof Function) {
				state = this._currentTask(this._currentArgs);
			}
			// if currentTask is not a function, it can only be another scheduler:
			else {
				state = this._currentTask.run();
				if (state === Scheduler.Event.QUIT) state = Scheduler.Event.NEXT;
			}

			if (state != Scheduler.Event.FLIP_REPEAT) {
				this._currentTask = undefined;
				this._currentArgs = undefined;
			}
		}

		return state;
	}


	/**
	 * Start this scheduler.
	 *
	 * <p>Note: tasks are run after each animation frame.</p>
	 *
	 * @name module:util.Scheduler#start
	 * @public
	 */
	start() {
		let self = this;
		let update = () => {
			// stop the animation is need be:
			if (self._stopAtNextUpdate) return;

			// self._psychoJS.window._writeLogOnFlip();

			// run the next task:
			let state = self.run();
			if (state === Scheduler.Event.QUIT)
				return;

			// render the scene in the window:
			self._psychoJS.window.render();

			// request a new frame:
			requestAnimationFrame(update);
		}

		// start the animation:
		requestAnimationFrame(update);
	}


	/**
	 * Stop this scheduler at the next update.
	 * 
	 * @name module:util.Scheduler#stop
	 * @public
	 */
	stop() {
		this._stopAtNextUpdate = true;
	}
}


/**
 * Events.
 * 
 * @name module:util.Scheduler#Event
 * @enum {Symbol}
 * @readonly
 * @public
 */
Scheduler.Event = {
	NEXT: Symbol.for('NEXT'),
	FLIP_REPEAT: Symbol.for('FLIP_REPEAT'),
	FLIP_NEXT: Symbol.for('FLIP_NEXT'),
	QUIT: Symbol.for('QUIT')
};