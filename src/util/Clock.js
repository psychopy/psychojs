/**
 * Clock component.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

/**
 * <p>MonotonicClock offers a convenient way to keep track of time during experiments. An experiment can have as many independent clocks as needed, e.g. one to time responses, another one to keep track of stimuli, etc.</p>
 */
export class MonotonicClock
{
	/**
	 * @memberof module:util
	 * @param {number} [startTime= <time elapsed since the reference point, i.e. the time when the module was loaded>] - the clock's start time (in ms)
	 */
	constructor(startTime = MonotonicClock.getReferenceTime())
	{
		this._timeAtLastReset = startTime;
	}

	/**
	 * Get the current time on this clock.
	 *
	 * @return {number} the current time (in seconds)
	 */
	getTime()
	{
		return MonotonicClock.getReferenceTime() - this._timeAtLastReset;
	}

	/**
	 * Get the current offset being applied to the high resolution timebase used by this Clock.
	 *
	 * @return {number} the offset (in seconds)
	 */
	getLastResetTime()
	{
		return this._timeAtLastReset;
	}

	/**
	 * Get the time elapsed since the reference point.
	 *
	 * @return {number} the time elapsed since the reference point (in seconds)
	 */
	static getReferenceTime()
	{
		return (performance.now() / 1000.0 - MonotonicClock._referenceTime);
		// return (new Date().getTime()) / 1000.0 - MonotonicClock._referenceTime;
	}

	/**
	 * Get the current timestamp with language-sensitive formatting rules applied.
	 *
	 * <p>Note: This is just a convenience wrapper around `Intl.DateTimeFormat()`.</p>
	 *
	 * @param {string|array.string} locales - A string with a BCP 47 language tag, or an array of such strings.
	 * @param {object} [options] - An object with detailed date and time styling information.
	 * @return {string} The current timestamp in the chosen format.
	 */
	static getDate(locales = "en-CA", options)
	{
		const dataTimeOptions = Object.assign({
			hour12: false,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			fractionalSecondDigits: 3,
		}, options);
		const dateTimeFormat = new Intl.DateTimeFormat(locales, dataTimeOptions);

		const date = new Date();
		return dateTimeFormat.format(date);
	}

	/**
	 * Get the clock's current time in the default format filtering out file name unsafe characters.
	 *
	 * <p>Note: This is mostly used as an appendix to the name of the keys save to the server.</p>
	 *
	 * @return {string} A string representing the current time formatted as YYYY-MM-DD_HH[h]mm.ss.sss
	 */
	static getDateStr()
	{
		// yyyy-mm-dd, hh:mm:ss.sss
		return MonotonicClock.getDate()
			.replaceAll("/","-")
			// yyyy-mm-dd_hh:mm:ss.sss
			.replace(", ", "_")
			// yyyy-mm-dd_hh[h]mm:ss.sss
			.replace(":", "h")
			// yyyy-mm-dd_hh[h]mm.ss.sss
			.replace(":", ".");
	}
}

/**
 * The clock's referenceTime is the time when the module was loaded (in seconds).
 *
 * @protected
 * @type {number}
 */
MonotonicClock._referenceTime = performance.now() / 1000.0;

// MonotonicClock._referenceTime = new Date().getTime() / 1000.0;

/**
 * <p>Clock is a MonotonicClock that also offers the possibility of being reset.</p>
 *
 * @extends MonotonicClock
 */
export class Clock extends MonotonicClock
{
	/**
	 * @memberof module:util
	 */
	constructor()
	{
		super();
	}

	/**
	 * Reset the time on the clock.
	 *
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
 * @extends Clock
 */
export class CountdownTimer extends Clock
{
	/**
	 * @memberof module:util
	 * @param {number} [startTime= 0] - the start time of the countdown
	 */
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
	 * @param {number} [deltaTime] the time to be added to the clock's start time (t0)
	 */
	add(deltaTime)
	{
		this._timeAtLastReset += deltaTime;
	}

	/**
	 * Reset the time on the countdown.
	 *
	 * @param {number} [newTime] - if newTime is undefined, the countdown time is reset to zero, otherwise we set it
	 * to newTime
	 */
	reset(newTime = undefined)
	{
		if (typeof newTime == "undefined")
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
	 * @return {number} the time left on the countdown (in seconds)
	 */
	getTime()
	{
		return this._timeAtLastReset - MonotonicClock.getReferenceTime();
	}
}
