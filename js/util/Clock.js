/**
 * Clock component.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * <p>MonotonicClock offers a convenient way to keep track of time during experiments. An experiment can have as many independent clocks as needed, e.g. one to time responses, another one to keep track of stimuli, etc.</p>
 *
 * @name module:util.MonotonicClock
 * @class
 * @param {number} [startTime= <time elapsed since the reference point, i.e. the time when the module was loaded>] - the clock's start time (in ms)
 */
export class MonotonicClock
{
	constructor(startTime = MonotonicClock.getReferenceTime())
	{
		this._timeAtLastReset = startTime;
	}


	/**
	 * Get the current time on this clock.
	 *
	 * @name module:util.MonotonicClock#getTime
	 * @function
	 * @public
	 * @return {number} the current time (in seconds)
	 */
	getTime()
	{
		return MonotonicClock.getReferenceTime() - this._timeAtLastReset;
	}


	/**
	 * Get the current offset being applied to the high resolution timebase used by this Clock.
	 *
	 * @name module:util.MonotonicClock#getLastResetTime
	 * @function
	 * @public
	 * @return {number} the offset (in seconds)
	 */
	getLastResetTime()
	{
		return this._timeAtLastReset;
	}


	/**
	 * Get the time elapsed since the reference point.
	 *
	 * @name module:util.MonotonicClock#getReferenceTime
	 * @function
	 * @public
	 * @return {number} the time elapsed since the reference point (in seconds)
	 */
	static getReferenceTime()
	{
		return (performance.now() / 1000.0 - MonotonicClock._referenceTime);
		// return (new Date().getTime()) / 1000.0 - MonotonicClock._referenceTime;
	}


	/**
	 * Get the clock's current time as a formatted string.
	 *
	 * <p>Note: this is mostly used as an appendix to the name of the keys save to the server.</p>
	 *
	 * @name module:util.MonotonicClock.getDateStr
	 * @function
	 * @public
	 * @static
	 * @param {string} [format= 'YYYY-MM-DD_HH[h]mm.ss.SSS'] - the format for the string (see [momentjs.com]{@link https://momentjs.com/docs/#/parsing/string-format/} for details)
	 * @return {string} a string representing the current time in the given format
	 */
	static getDateStr(format = 'YYYY-MM-DD_HH[h]mm.ss.SSS')
	{
		return moment().format(format);
	}
}


/**
 * The clock's referenceTime is the time when the module was loaded (in seconds).
 *
 * @name module:util.MonotonicClock._referenceTime
 * @readonly
 * @private
 * @type {number}
 */
MonotonicClock._referenceTime = performance.now() / 1000.0;

// MonotonicClock._referenceTime = new Date().getTime() / 1000.0;


/**
 * <p>Clock is a MonotonicClock that also offers the possibility of being reset.</p>
 *
 * @name module:util.Clock
 * @class
 * @extends MonotonicClock
 */
export class Clock extends MonotonicClock
{
	constructor()
	{
		super();
	}

	/**
	 * Reset the time on the clock.
	 *
	 *
	 * @name module:util.Clock#reset
	 * @function
	 * @public
	 * @param {number} [newTime= 0] the new time on the clock.
	 */
	reset(newTime = 0)
	{
		this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
	}


	/**
	 * Add more time to the clock's 'start' time (t0).
	 *
	 * <p>Note: by adding time to t0, the current time is pushed forward (it becomes
	 * smaller). As a consequence, getTime() may return a negative number.</p>
	 *
	 * @name module:util.Clock#add
	 * @function
	 * @public
	 * @param {number} [deltaTime] the time to be added to the clock's start time (t0)
	 */
	add(deltaTime)
	{
		this._timeAtLastReset += deltaTime;
	}
}


/**
 * <p>CountdownTimer is a clock counts down from the time of last reset.</p.
 *
 * @name module:util.CountdownTimer
 * @class
 * @extends Clock
 * @param {number} [startTime= 0] - the start time of the countdown
 */
export class CountdownTimer extends Clock
{
	constructor(startTime = 0)
	{
		super();

		this._timeAtLastReset = MonotonicClock.getReferenceTime();
		this._countdown_duration = startTime;
		if (startTime)
		{
			this.add(startTime);
		}
	}


	/**
	 * Add more time to the clock's 'start' time (t0).
	 *
	 * <p>Note: by adding time to t0, you push the current time forward (make it
	 * smaller). As a consequence, getTime() may return a negative number.</p>
	 *
	 * @name module:util.CountdownTimer#add
	 * @function
	 * @public
	 * @param {number} [deltaTime] the time to be added to the clock's start time (t0)
	 */
	add(deltaTime)
	{
		this._timeAtLastReset += deltaTime;
	}


	/**
	 * Reset the time on the countdown.
	 *
	 * @name module:util.CountdownTimer#reset
	 * @function
	 * @public
	 * @param {number} [newTime] - if newTime is undefined, the countdown time is reset to zero, otherwise we set it
	 * to newTime
	 */
	reset(newTime = undefined)
	{
		if (typeof newTime == 'undefined')
		{
			this._timeAtLastReset = MonotonicClock.getReferenceTime() + this._countdown_duration;
		}
		else
		{
			this._countdown_duration = newTime;
			this._timeAtLastReset = MonotonicClock.getReferenceTime() + newTime;
		}
	}


	/**
	 * Get the time currently left on the countdown.
	 *
	 * @name module:util.CountdownTimer#getTime
	 * @function
	 * @public
	 * @return {number} the time left on the countdown (in seconds)
	 */
	getTime()
	{
		return this._timeAtLastReset - MonotonicClock.getReferenceTime();
	}
}

