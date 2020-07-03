/**
 * Scheduler.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * <p>A scheduler helps run the main loop by managing scheduled functions,
 * called tasks, after each frame is displayed.</p>
 *
 * <p>
 * Tasks are either another [Scheduler]{@link module:util.Scheduler}, or a
 * JavaScript functions returning one of the following codes:
 * <ul>
 * <li>Scheduler.Event.NEXT: Move onto the next task *without* rendering the scene first.</li>
 * <li>Scheduler.Event.FLIP_REPEAT: Render the scene and repeat the task.</li>
 * <li>Scheduler.Event.FLIP_NEXT: Render the scene and move onto the next task.</li>
 * <li>Scheduler.Event.QUIT: Quit the scheduler.</li>
 * </ul>
 * </p>
 *
 * <p> It is possible to create sub-schedulers, e.g. to handle loops.
 * Sub-schedulers are added to a parent scheduler as a normal
 * task would be by calling [scheduler.add(subScheduler)]{@link module:util.Scheduler#add}.</p>
 *
 * <p> Conditional branching is also available:
 * [scheduler.addConditionalBranches]{@link module:util.Scheduler#addConditional}</p>
 *
 *
 * @name module:util.Scheduler
 * @class
 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
 *
 */
export class Scheduler
{
	constructor(psychoJS)
	{
		this._psychoJS = psychoJS;

		this._taskList = [];
		this._currentTask = undefined;
		this._argsList = [];
		this._currentArgs = undefined;

		this._stopAtNextUpdate = false;
		this._stopAtNextTask = false;

		this._status = Scheduler.Status.STOPPED;
	}


	/**
	 * Get the status of the scheduler.
	 *
	 * @name module:util.Scheduler#status
	 * @public
	 * @returns {module:util.Scheduler#Status} the status of the scheduler
	 */
	get status()
	{
		return this._status;
	}


	/**
	 * Task to be run by the scheduler.
	 *
	 * @callback module:util.Scheduler~Task
	 * @param {*} [args] optional arguments
	 */
	/**
	 * Schedule a new task.
	 *
	 * @name module:util.Scheduler#add
	 * @public
	 * @param {module:util.Scheduler~Task | module:util.Scheduler} task - the task to be scheduled
	 * @param {...*} args - arguments for that task
	 */
	add(task, ...args)
	{
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
	addConditional(condition, thenScheduler, elseScheduler)
	{
		const self = this;
		let task = function ()
		{
			if (condition())
			{
				self.add(thenScheduler);
			}
			else
			{
				self.add(elseScheduler);
			}

			return Scheduler.Event.NEXT;
		};

		this.add(task);
	}


	/**
	 * Start this scheduler.
	 *
	 * <p>Note: tasks are run after each animation frame.</p>
	 *
	 * @name module:util.Scheduler#start
	 * @public
	 */
	start()
	{
		const self = this;
		let update = () =>
		{
			// stop the animation if need be:
			if (self._stopAtNextUpdate)
			{
				self._status = Scheduler.Status.STOPPED;
				return;
			}

			// self._psychoJS.window._writeLogOnFlip();

			// run the next scheduled tasks until a scene render is requested:
			const state = self._runNextTasks();
			if (state === Scheduler.Event.QUIT)
			{
				self._status = Scheduler.Status.STOPPED;
				return;
			}

			// render the scene in the window:
			self._psychoJS.window.render();

			// request a new frame:
			requestAnimationFrame(update);
		};

		// start the animation:
		requestAnimationFrame(update);
	}


	/**
	 * Stop this scheduler.
	 *
	 * @name module:util.Scheduler#stop
	 * @public
	 */
	stop()
	{
		this._status = Scheduler.Status.STOPPED;
		this._stopAtNextTask = true;
		this._stopAtNextUpdate = true;
	}


	/**
	 * Run the next scheduled tasks, in sequence, until a rendering of the scene is requested.
	 *
	 * @name module:util.Scheduler#_runNextTasks
	 * @private
	 * @return {module:util.Scheduler#Event} the state of the scheduler after the last task ran
	 */
	_runNextTasks()
	{
		this._status = Scheduler.Status.RUNNING;

		let state = Scheduler.Event.NEXT;
		while (state === Scheduler.Event.NEXT)
		{
			// check if we need to quit:
			if (this._stopAtNextTask)
			{
				return Scheduler.Event.QUIT;
			}

			// if there is no current task, we look for the next one in the list or quit if there is none:
			if (typeof this._currentTask == 'undefined')
			{

				// a task is available in the taskList:
				if (this._taskList.length > 0)
				{
					this._currentTask = this._taskList.shift();
					this._currentArgs = this._argsList.shift();
				}
				// the taskList is empty: we quit
				else
				{
					this._currentTask = undefined;
					this._currentArgs = undefined;
					return Scheduler.Event.QUIT;
				}
			}
			else
			{
				// we are repeating a task
			}

			// if the current task is a function, we run it:
			if (this._currentTask instanceof Function)
			{
				state = this._currentTask(...this._currentArgs);
			}
			// otherwise, we assume that the current task is a scheduler and we run its tasks until a rendering
			// of the scene is required.
			// note: "if (this._currentTask instanceof Scheduler)" does not work because of CORS...
			else
			{
				state = this._currentTask._runNextTasks();
				if (state === Scheduler.Event.QUIT)
				{
					// if the experiment has not ended, we move onto the next task:
					if (!this._psychoJS.experiment.experimentEnded)
					{
						state = Scheduler.Event.NEXT;
					}
				}
			}

			// if the current task's return status is FLIP_REPEAT, we will re-run it, otherwise
			// we move onto the next task:
			if (state !== Scheduler.Event.FLIP_REPEAT)
			{
				this._currentTask = undefined;
				this._currentArgs = undefined;
			}

		}

		return state;
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
	/**
	 * Move onto the next task *without* rendering the scene first.
	 */
	NEXT: Symbol.for('NEXT'),

	/**
	 * Render the scene and repeat the task.
	 */
	FLIP_REPEAT: Symbol.for('FLIP_REPEAT'),

	/**
	 * Render the scene and move onto the next task.
	 */
	FLIP_NEXT: Symbol.for('FLIP_NEXT'),

	/**
	 * Quit the scheduler.
	 */
	QUIT: Symbol.for('QUIT')
};


/**
 * Status.
 *
 * @name module:util.Scheduler#Status
 * @enum {Symbol}
 * @readonly
 * @public
 */
Scheduler.Status = {
	/**
	 * The Scheduler is running.
	 */
	RUNNING: Symbol.for('RUNNING'),

	/**
	 * The Scheduler is stopped.
	 */
	STOPPED: Symbol.for('STOPPED')
};
