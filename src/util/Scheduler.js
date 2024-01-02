/**
 * Scheduler.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

/**
 * <p>A scheduler helps run the main loop by managing scheduled functions,
 * called tasks, after each frame is displayed.</p>
 *
 * <p>
 * Tasks are either another [Scheduler]{@link Scheduler}, or a
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
 * task would be by calling [scheduler.add(subScheduler)]{@link Scheduler#add}.</p>
 *
 * <p> Conditional branching is also available:
 * [scheduler.addConditionalBranches]{@link Scheduler#addConditional}</p>
 */
export class Scheduler
{
	/**
	 * @memberof module:util
	 * @param {module:core.PsychoJS} psychoJS - the PsychoJS instance
	 */
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
	 * @returns {Scheduler#Status} the status of the scheduler
	 */
	get status()
	{
		return this._status;
	}

	/**
	 * Task to be run by the scheduler.
	 *
	 * @callback Scheduler~Task
	 * @param {*} [args] optional arguments
	 */
	/**
	 * Schedule a new task.
	 *
	 * @param {Scheduler~Task | Scheduler} task - the task to be scheduled
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
	 * @callback Scheduler~Condition
	 * @return {boolean}
	 */
	/**
	 * Schedule a series of task or another, based on a condition.
	 *
	 * <p>Note: the tasks are [sub-schedulers]{@link Scheduler}.</p>
	 *
	 * @param {Scheduler~Condition} condition - the condition
	 * @param {Scheduler} thenScheduler - the [Scheduler]{@link Scheduler} to be run if the condition is satisfied
	 * @param {Scheduler} elseScheduler - the [Scheduler]{@link Scheduler} to be run if the condition is not satisfied
	 */
	addConditional(condition, thenScheduler, elseScheduler)
	{
		const self = this;
		let task = function()
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
	 * @return {Promise<void>} a promise resolved when the scheduler stops, e.g. when the experiments finishes
	 */
	start()
	{
		let shedulerResolve;
		const self = this;
		const update = async (timestamp) =>
		{
			// stop the animation if need be:
			if (self._stopAtNextUpdate)
			{
				self._status = Scheduler.Status.STOPPED;
				shedulerResolve();
				return;
			}

			// self._psychoJS.window._writeLogOnFlip();

			// run the next scheduled tasks until a scene render is requested:
			const state = await self._runNextTasks();
			if (state === Scheduler.Event.QUIT)
			{
				self._status = Scheduler.Status.STOPPED;
				shedulerResolve();
				return;
			}

			// store frame delta for `Window.getActualFrameRate()`
			const lastTimestamp = self._lastTimestamp === undefined ? timestamp : self._lastTimestamp;

			self._lastDelta = timestamp - lastTimestamp;
			self._lastTimestamp = timestamp;

			// render the scene in the window:
			self._psychoJS.window.render();

			// request a new frame:
			requestAnimationFrame(update);
		};

		// start the animation:
		requestAnimationFrame(update);

		// return a promise resolved when the scheduler is stopped:
		return new Promise((resolve, _) =>
		{
			shedulerResolve = resolve;
		});
	}

	/**
	 * Stop this scheduler.
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
	 * @name Scheduler#_runNextTasks
	 * @private
	 * @return {Scheduler#Event} the state of the scheduler after the last task ran
	 */
	async _runNextTasks()
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
			if (typeof this._currentTask == "undefined")
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
				state = await this._currentTask(...this._currentArgs);
			}
			// otherwise, we assume that the current task is a scheduler and we run its tasks until a rendering
			// of the scene is required.
			// note: "if (this._currentTask instanceof Scheduler)" does not work because of CORS...
			else
			{
				state = await this._currentTask._runNextTasks();
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
 * @enum {Symbol}
 * @readonly
 */
Scheduler.Event = {
	/**
	 * Move onto the next task *without* rendering the scene first.
	 */
	NEXT: Symbol.for("NEXT"),

	/**
	 * Render the scene and repeat the task.
	 */
	FLIP_REPEAT: Symbol.for("FLIP_REPEAT"),

	/**
	 * Render the scene and move onto the next task.
	 */
	FLIP_NEXT: Symbol.for("FLIP_NEXT"),

	/**
	 * Quit the scheduler.
	 */
	QUIT: Symbol.for("QUIT"),
};

/**
 * Status.
 *
 * @enum {Symbol}
 * @readonly
 */
Scheduler.Status = {
	/**
	 * The Scheduler is running.
	 */
	RUNNING: Symbol.for("RUNNING"),

	/**
	 * The Scheduler is stopped.
	 */
	STOPPED: Symbol.for("STOPPED"),
};
