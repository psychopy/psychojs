/**
 * Various utilities.
 *
 * @authors Alain Pitiot, Sotiri Bakagiannis, Thomas Pronk
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from 'pixi.js-legacy';


/**
 * Syntactic sugar for Mixins
 *
 * <p>This is heavily adapted from: http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/</p>
 *
 * @name module:util.MixinBuilder
 * @class
 * @param {Object} superclass
 *
 * @example
 * class BaseClass { ... }
 * let Mixin1 = (superclass) => class extends superclass { ... }
 * let Mixin2 = (superclass) => class extends superclass { ... }
 * class NewClass extends mix(BaseClass).with(Mixin1, Mixin2) { ... }
 */
export let mix = (superclass) => new MixinBuilder(superclass);

class MixinBuilder
{
	constructor(superclass)
	{
		this.superclass = superclass;
	}

	/**
	 *
	 * @param mixins
	 * @returns {*}
	 */
	with(...mixins)
	{
		return mixins.reduce((c, mixin) => mixin(c), this.superclass);
	}
}


/**
 * Convert the resulting value of a promise into a tupple.
 *
 * @name module:util.promiseToTupple
 * @function
 * @public
 * @param {Promise} promise - the promise
 * @return {Object[]} the resulting value in the format [error, return data]
 * where error is null if there was no error
 */
export function promiseToTupple(promise)
{
	return promise
		.then(data => [null, data])
		.catch(error => [error, null]);
}


/**
 * Get a Universally Unique Identifier (RFC4122 version 4)
 * <p> See details here: https://www.ietf.org/rfc/rfc4122.txt</p>
 *
 * @name module:util.makeUuid
 * @function
 * @public
 * @return {string} the uuid
 */
export function makeUuid()
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
	{
		const r = Math.random() * 16 | 0, v = (c === 'x') ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}


/**
 * Get the error stack of the calling, exception-throwing function.
 *
 * @name module:util.getErrorStack
 * @function
 * @public
 * @return {string} the error stack as a string
 */
export function getErrorStack()
{
	try
	{
		throw Error('');
	}
	catch (error)
	{
		// we need to remove the second line since it references getErrorStack:
		let stack = error.stack.split("\n");
		stack.splice(1, 1);

		return JSON.stringify(stack.join('\n'));
	}
}


/**
 * Test if x is an 'empty' value.
 *
 * @name module:util.isEmpty
 * @function
 * @public
 * @param {Object} x the value to test
 * @return {boolean} true if x is one of the following: undefined, [], [undefined]
 */
export function isEmpty(x)
{
	if (typeof x === 'undefined')
	{
		return true;
	}
	if (!Array.isArray(x))
	{
		return false;
	}
	if (x.length === 0)
	{
		return true;
	}
	if (x.length === 1 && typeof x[0] === 'undefined')
	{
		return true;
	}

	return false;
}


/**
 * Detect the user's browser.
 *
 * <p> Note: since user agent is easily spoofed, we use a more sophisticated approach, as described here:
 * https://stackoverflow.com/a/9851769</p>
 *
 * @name module:util.detectBrowser
 * @function
 * @public
 * @return {string} the detected browser, one of 'Opera', 'Firefox', 'Safari',
 * 'IE', 'Edge', 'EdgeChromium', 'Chrome', 'unknown'
 */
export function detectBrowser()
{
	// Opera 8.0+
	const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
	if (isOpera)
	{
		return 'Opera';
	}

	// Firefox 1.0+
	const isFirefox = (typeof InstallTrigger !== 'undefined');
	if (isFirefox)
	{
		return 'Firefox';
	}

	// Safari 3.0+ "[object HTMLElementConstructor]" 
	const isSafari = /constructor/i.test(window.HTMLElement) || (function (p)
	{
		return p.toString() === "[object SafariRemoteNotification]";
	})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
	if (isSafari)
	{
		return 'Safari';
	}

	// Internet Explorer 6-11
	// const isIE6 = !window.XMLHttpRequest;
	// const isIE7 = document.all && window.XMLHttpRequest && !XDomainRequest && !window.opera;
	// const isIE8 = document.documentMode==8;
	const isIE = /*@cc_on!@*/false || !!document.documentMode;
	if (isIE)
	{
		return 'IE';
	}

	// Edge 20+
	const isEdge = !isIE && !!window.StyleMedia;
	if (isEdge)
	{
		return 'Edge';
	}

	// Chrome 1+
	const isChrome = window.chrome;
	if (isChrome)
	{
		return 'Chrome';
	}

	// Chromium-based Edge:
	const isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") !== -1);
	if (isEdgeChromium)
	{
		return 'EdgeChromium';
	}

	// Blink engine detection
	const isBlink = (isChrome || isOpera) && !!window.CSS;
	if (isBlink)
	{
		return 'Blink';
	}

	return 'unknown';
}


/**
 * Convert obj to its numerical form.
 *
 * <ul>
 *   <li>number -> number, e.g. 2 -> 2</li>
 *   <li>[number] -> [number], e.g. [1,2,3] -> [1,2,3]</li>
 *   <li>numeral string -> number, e.g. "8" -> 8</li>
 *   <li>[number | numeral string] -> [number], e.g. [1, 2, "3"] -> [1,2,3]</li>
 * </ul>
 *
 * @name module:util.toNumerical
 * @function
 * @public
 * @param {Object} obj - the input object
 * @return {number | number[]} the numerical form of the input object
 */
export function toNumerical(obj)
{
	const response = {
		origin: 'util.toNumerical',
		context: 'when converting an object to its numerical form'
	};

	try
	{

		if (obj === null)
		{
			throw 'unable to convert null to a number';
		}

		if (typeof obj === 'undefined')
		{
			throw 'unable to convert undefined to a number';
		}

		if (typeof obj === 'number')
		{
			return obj;
		}

		const convertToNumber = (input) =>
		{
			const n = Number.parseFloat(input);

			if (Number.isNaN(n))
			{
				throw `unable to convert ${input} to a number`;
			}

			return n;
		};

		if (Array.isArray(obj))
		{
			return obj.map(convertToNumber);
		}

		const arrayMaybe = turnSquareBracketsIntoArrays(obj);

		if (Array.isArray(arrayMaybe))
		{
			return arrayMaybe.map(convertToNumber);
		}

		if (typeof obj === 'string')
		{
			return convertToNumber(obj);
		}

		throw 'unable to convert the object to a number';
	}
	catch (error)
	{
		throw Object.assign(response, { error });
	}

}


/**
 * Check whether a point lies within a polygon
 * <p>We are using the algorithm described here: https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html</p>
 *
 * @name module:util.IsPointInsidePolygon
 * @function
 * @public
 * @param {number[]} point - the point
 * @param {Object} vertices - the vertices defining the polygon
 * @return {boolean} whether or not the point lies within the polygon
 */
export function IsPointInsidePolygon(point, vertices)
{
	const x = point[0];
	const y = point[1];

	let isInside = false;
	for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++)
	{
		const xi = vertices[i][0], yi = vertices[i][1];
		const xj = vertices[j][0], yj = vertices[j][1];
		const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect)
		{
			isInside = !isInside;
		}
	}

	return isInside;
}


/**
 * Shuffle an array in place using the Fisher-Yastes's modern algorithm
 * <p>See details here: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm</p>
 *
 * @name module:util.shuffle
 * @function
 * @public
 * @param {Object[]} array - the input 1-D array
 * @param {Function} [randomNumberGenerator = undefined] - A function used to generated random numbers in the interal [0, 1). Defaults to Math.random
 * @return {Object[]} the shuffled array
 */
export function shuffle(array, randomNumberGenerator = undefined)
{
	if (randomNumberGenerator === undefined) {
		randomNumberGenerator = Math.random;
	}
	for (let i = array.length - 1; i > 0; i--)
	{
		const j = Math.floor(randomNumberGenerator() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}



/**
 * Get the position of the object, in pixel units
 *
 * @name module:util.getPositionFromObject
 * @function
 * @public
 * @param {Object} object - the input object
 * @param {string} units - the units
 * @returns {number[]} the position of the object, in pixel units
 */
export function getPositionFromObject(object, units)
{
	const response = {
		origin: 'util.getPositionFromObject',
		context: 'when getting the position of an object'
	};

	try
	{
		if (typeof object === 'undefined')
		{
			throw 'cannot get the position of an undefined object';
		}

		let objectWin = undefined;

		// the object has a getPos function:
		if (typeof object.getPos === 'function')
		{
			units = object.units;
			objectWin = object.win;
			object = object.getPos();
		}

		// convert object to pixel units:
		return to_px(object, units, objectWin);
	}
	catch (error)
	{
		throw Object.assign(response, {error});
	}
}



/**
 * Convert the position to pixel units.
 *
 * @name module:util.to_px
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @param {boolean} [integerCoordinates = false] - whether or not to round the position coordinates.
 * @returns {number[]} the position in pixel units
 */
export function to_px(pos, posUnit, win, integerCoordinates = false)
{
	const response = {
		origin: 'util.to_px',
		context: 'when converting a position to pixel units'
	};

	let pos_px;

	if (posUnit === 'pix')
	{
		pos_px = pos;
	}
	else if (posUnit === 'norm')
	{
		pos_px = [pos[0] * win.size[0] / 2.0, pos[1] * win.size[1] / 2.0];
	}
	else if (posUnit === 'height')
	{
		const minSize = Math.min(win.size[0], win.size[1]);
		pos_px = [pos[0] * minSize, pos[1] * minSize];
	}
	else
	{
		throw Object.assign(response, {error: `unknown position units: ${posUnit}`});
	}

	if (integerCoordinates)
	{
		return [Math.round(pos_px[0]), Math.round(pos_px[1])];
	}
	else
	{
		return pos_px;
	}
}


/**
 * Convert the position to norm units.
 *
 * @name module:util.to_norm
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @returns {number[]} the position in norm units
 */
export function to_norm(pos, posUnit, win)
{
	const response = {origin: 'util.to_norm', context: 'when converting a position to norm units'};

	if (posUnit === 'norm')
	{
		return pos;
	}
	if (posUnit === 'pix')
	{
		return [pos[0] / (win.size[0] / 2.0), pos[1] / (win.size[1] / 2.0)];
	}
	if (posUnit === 'height')
	{
		const minSize = Math.min(win.size[0], win.size[1]);
		return [pos[0] * minSize / (win.size[0] / 2.0), pos[1] * minSize / (win.size[1] / 2.0)];
	}

	throw Object.assign(response, {error: `unknown position units: ${posUnit}`});
}


/**
 * Convert the position to height units.
 *
 * @name module:util.to_height
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @returns {number[]} the position in height units
 */
export function to_height(pos, posUnit, win)
{
	const response = {
		origin: 'util.to_height',
		context: 'when converting a position to height units'
	};

	if (posUnit === 'height')
	{
		return pos;
	}
	if (posUnit === 'pix')
	{
		const minSize = Math.min(win.size[0], win.size[1]);
		return [pos[0] / minSize, pos[1] / minSize];
	}
	if (posUnit === 'norm')
	{
		const minSize = Math.min(win.size[0], win.size[1]);
		return [pos[0] * win.size[0] / 2.0 / minSize, pos[1] * win.size[1] / 2.0 / minSize];
	}

	throw Object.assign(response, {error: `unknown position units: ${posUnit}`});
}


/**
 * Convert the position to window units.
 *
 * @name module:util.to_win
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @returns {number[]} the position in window units
 */
export function to_win(pos, posUnit, win)
{
	const response = {origin: 'util.to_win', context: 'when converting a position to window units'};

	try
	{
		if (win._units === 'pix')
		{
			return to_px(pos, posUnit, win);
		}
		if (win._units === 'norm')
		{
			return to_norm(pos, posUnit, win);
		}
		if (win._units === 'height')
		{
			return to_height(pos, posUnit, win);
		}

		throw `unknown window units: ${win._units}`;
	}
	catch (error)
	{
		throw Object.assign(response, {response, error});
	}
}


/**
 * Convert the position to given units.
 *
 * @name module:util.to_unit
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @param {string} targetUnit - the target units
 * @returns {number[]} the position in target units
 */
export function to_unit(pos, posUnit, win, targetUnit)
{
	const response = {origin: 'util.to_unit', context: 'when converting a position to different units'};

	try
	{
		if (targetUnit === 'pix')
		{
			return to_px(pos, posUnit, win);
		}
		if (targetUnit === 'norm')
		{
			return to_norm(pos, posUnit, win);
		}
		if (targetUnit === 'height')
		{
			return to_height(pos, posUnit, win);
		}

		throw `unknown target units: ${targetUnit}`;
	}
	catch (error)
	{
		throw Object.assign(response, {error});
	}
}


/**
 * Convert a position to a PIXI Point.
 *
 * @name module:util.to_pixiPoint
 * @function
 * @public
 * @param {number[]} pos - the input position
 * @param {string} posUnit - the position units
 * @param {Window} win - the associated Window
 * @param {boolean} [integerCoordinates = false] - whether or not to round the PIXI Point coordinates.
 * @returns {number[]} the position as a PIXI Point
 */
export function to_pixiPoint(pos, posUnit, win, integerCoordinates = false)
{
	const pos_px = to_px(pos, posUnit, win);
	if (integerCoordinates)
	{
		return new PIXI.Point(Math.round(pos_px[0]), Math.round(pos_px[1]));
	}
	else
	{
		return new PIXI.Point(pos_px[0], pos_px[1]);
	}
}


/**
 * Convert an object to its string representation, taking care of symbols.
 *
 * <p>Note: if the object is not already a string, we JSON stringify it and detect circularity.</p>
 *
 * @name module:util.toString
 * @function
 * @public
 * @param {Object} object - the input object
 * @return {string} a string representation of the object or 'Object (circular)'
 */
export function toString(object)
{
	if (typeof object === 'undefined')
	{
		return 'undefined';
	}

	if (!object)
	{
		return 'null';
	}

	if (typeof object === 'string')
	{
		return object;
	}

	// if the object is a class and has a toString method:
	if (object.constructor.toString().substring(0, 5) === 'class' && typeof object.toString === 'function')
	{
		return object.toString();
	}

	try
	{
		const symbolReplacer = (key, value) =>
		{
			if (typeof value === 'symbol')
			{
				value = Symbol.keyFor(value);
			}
			return value;
		};
		return JSON.stringify(object, symbolReplacer);
	}
	catch (e)
	{
		return 'Object (circular)';
	}
}


if (!String.prototype.format)
{
	String.prototype.format = function ()
	{
		var args = arguments;
		return this
			.replace(/{(\d+)}/g, function (match, number)
			{
				return typeof args[number] != 'undefined' ? args[number] : match;
			})
			.replace(/{([$_a-zA-Z][$_a-zA-Z0-9]*)}/g, function (match, name)
			{
				//console.log("n=" + name + " args[0][name]=" + args[0][name]);
				return args.length > 0 && args[0][name] !== undefined ? args[0][name] : match;
			});
	};
}


/**
 * Get the most informative error from the server response from a jquery server request.
 *
 * @name module:util.getRequestError
 * @function
 * @public
 * @param jqXHR
 * @param textStatus
 * @param errorThrown
 */
export function getRequestError(jqXHR, textStatus, errorThrown)
{
	let errorMsg = 'unknown error';

	if (typeof jqXHR.responseJSON !== 'undefined')
	{
		errorMsg = jqXHR.responseJSON;
	}
	else if (typeof jqXHR.responseText !== 'undefined')
	{
		errorMsg = jqXHR.responseText;
	}
	else if (typeof errorThrown !== 'undefined')
	{
		errorMsg = errorThrown;
	}

	return errorMsg;
}


/**
 * Test whether an object is either an integer or the string representation of an integer.
 * <p>This is adapted from: https://stackoverflow.com/a/14794066</p>
 *
 * @name module:util.isInt
 * @function
 * @public
 * @param {Object} obj - the input object
 * @returns {boolean} whether or not the object is an integer or the string representation of an integer
 */
export function isInt(obj)
{
	if (isNaN(obj))
	{
		return false;
	}

	const x = parseFloat(obj);
	return (x | 0) === x;
}


/**
 * Get the URL parameters.
 *
 * @name module:util.getUrlParameters
 * @function
 * @public
 * @returns {URLSearchParams} the iterable URLSearchParams
 *
 * @example
 * const urlParameters = util.getUrlParameters();
 * for (const [key, value] of urlParameters)
 *   console.log(key + ' = ' + value);
 *
 */
export function getUrlParameters()
{
	const urlQuery = window.location.search.slice(1);
	return new URLSearchParams(urlQuery);

	/*let urlMap = new Map();
	for (const entry of urlParameters)
		urlMap.set(entry[0], entry[1])

	return urlMap;*/
}


/**
 * Add info extracted from the URL to the given dictionary.
 *
 * <p>We exclude all URL parameters starting with a double underscore
 * since those are reserved for client/server communication</p>
 *
 * @name module:util.addInfoFromUrl
 * @function
 * @public
 * @param {Object} info - the dictionary
 */
export function addInfoFromUrl(info)
{
	const infoFromUrl = getUrlParameters();

	// note: parameters starting with a double underscore are reserved for client/server communication,
	// we do not add them to info
	// for (const [key, value] of infoFromUrl)
	infoFromUrl.forEach((value, key) =>
	{
		if (key.indexOf('__') !== 0)
		{
			info[key] = value;
		}
	});

	return info;
}


/**
 * Select values from an array.
 *
 * <p> 'selection' can be a single integer, an array of indices, or a string to be parsed, e.g.:
 * <ul>
 *   <li>5</li>
 *   <li>[1,2,3,10]</li>
 *   <li>'1,5,10'</li>
 *   <li>'1:2:5'</li>
 *   <li>'5:'</li>
 *   <li>'-5:-2, 9, 11:5:22'</li>
 * </ul></p>
 *
 * @name module:util.selectFromArray
 * @function
 * @public
 * @param {Array.<Object>} array - the input array
 * @param {number | Array.<number> | string} selection -  the selection
 * @returns {Object | Array.<Object>} the array of selected items
 */
export function selectFromArray(array, selection)
{

	// if selection is an integer, or a string representing an integer, we treat it as an index in the array
	// and return that entry:
	if (isInt(selection))
	{
		return [array[parseInt(selection)]];
	}// if selection is an array, we treat it as a list of indices
	// and return an array with the entries corresponding to those indices:
	else if (Array.isArray(selection))
	{
		// Pick out `array` items matching indices contained in `selection` in order
		return selection.map(i => array[i]);
	}// if selection is a string, we decode it:
	else if (typeof selection === 'string')
	{
		if (selection.indexOf(',') > -1)
		{
			return selection.split(',').map(a => selectFromArray(array, a));
		}// return flattenArray( selection.split(',').map(a => selectFromArray(array, a)) );
		else if (selection.indexOf(':') > -1)
		{
			let sliceParams = selection.split(':').map(a => parseInt(a));
			if (sliceParams.length === 3)
			{
				return sliceArray(array, sliceParams[0], sliceParams[2], sliceParams[1]);
			}
			else
			{
				return sliceArray(array, ...sliceParams);
			}
		}
	}

	else
	{
		throw {
			origin: 'selectFromArray',
			context: 'when selecting entries from an array',
			error: 'unknown selection type: ' + (typeof selection)
		};
	}
}


/**
 * Recursively flatten an array of arrays.
 *
 * @name module:util.flattenArray
 * @function
 * @public
 * @param {Array.<Object>} array - the input array of arrays
 * @returns {Array.<Object>} the flatten array
 */
export function flattenArray(array)
{
	return array.reduce(
		(flat, next) =>
		{
			flat.push((Array.isArray(next) && Array.isArray(next[0])) ? flattenArray(next) : next);
			return flat;
		},
		[]
	);
}


/**
 * Slice an array.
 *
 * @name module:util.sliceArray
 * @function
 * @public
 * @param {Array.<Object>} array - the input array
 * @param {number} [from= NaN] - the start of the slice
 * @param {number} [to= NaN] - the end of the slice
 * @param {number} [step= NaN] - the step of the slice
 * @returns {Array.<Object>} the array slice
 */
export function sliceArray(array, from = NaN, to = NaN, step = NaN)
{
	if (isNaN(from))
	{
		from = 0;
	}
	if (isNaN(to))
	{
		to = array.length;
	}

	let arraySlice = array.slice(from, to);

	if (isNaN(step))
	{
		return arraySlice;
	}

	if (step < 0)
	{
		arraySlice.reverse();
	}

	step = Math.abs(step);
	if (step === 1)
	{
		return arraySlice;
	}
	else
	{
		return arraySlice.filter((e, i) => (i % step === 0));
	}
}


/**
 * Offer data as download in the browser.
 *
 * @name module:util.offerDataForDownload
 * @function
 * @public
 * @param {string} filename - the name of the file to be downloaded
 * @param {*} data - the data
 * @param {string} type - the MIME type of the data, e.g. 'text/csv' or 'application/json'
 */
export function offerDataForDownload(filename, data, type)
{
	const blob = new Blob([data], {type});
	if (window.navigator.msSaveOrOpenBlob)
	{
		window.navigator.msSaveBlob(blob, filename);
	}
	else
	{
		const anchor = document.createElement('a');
		anchor.href = window.URL.createObjectURL(blob);
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}
}


/**
 * Convert a string representing a JSON array, e.g. "[1, 2]" into an array, e.g. ["1","2"].
 * This approach overcomes the built-in JSON parsing limitations when it comes to eg. floats
 * missing the naught prefix, and is able to process several arrays, e.g. "[1,2][3,4]".
 *
 * @name module:util.turnSquareBracketsIntoArrays
 * @function
 * @public
 * @param {string} input - string potentially containing JSON arrays
 * @param {string} max - how many matches to return, unwrap resulting array if less than two
 * @returns {array} an array if arrays were found, undefined otherwise
 */
export function turnSquareBracketsIntoArrays(input, max = 1)
{
	// Only interested in strings
	// https://stackoverflow.com/questions/4059147
	if (String(input) !== input)
	{
		return;
	}

	// Matches content within square brackets (using literal
	// form is MDN's advice for patterns unlikely to change)
	const matchesMaybe = input.match(/\[(.*?)\]/g);

	// Exit if no array-like matches found
	if (matchesMaybe === null)
	{
		return;
	}

	// Reformat content for each match
	const matches = matchesMaybe.map((data) =>
		{
			return data
				// Remove the square brackets
				.replace(/[\[\]]+/g, '')
				// Eat up space after comma
				.split(/[, ]+/);
		}
	);

	if (max < 2)
	{
		return matches[0];
	}

	return matches;
}


/**
 * Generates random integers a-la NumPy's in the "half-open" interval [min, max). In other words, from min inclusive to max exclusive. When max is undefined, as is the case by default, results are chosen from [0, min). An error is thrown if max is less than min.
 *
 * @name module:util.randint
 * @function
 * @public
 * @param {number} [min = 0] - lowest integer to be drawn, or highest plus one if max is undefined (default)
 * @param {number} max - one above the largest integer to be drawn
 * @returns {number} a random integer in the requested range (signed)
 */
export function randint(min = 0, max)
{
	let lo = min;
	let hi = max;

	if (typeof max === 'undefined')
	{
		hi = lo;
		lo = 0;
	}

	if (hi < lo)
	{
		throw {
			origin: 'util.randint',
			context: 'when generating a random integer',
			error: 'min should be <= max'
		};
	}

	return Math.floor(Math.random() * (hi - lo)) + lo;
}


/**
 * Round to a certain number of decimal places.
 *
 * This is the Crib Sheet provided solution, but please note that as of 2020 the most popular SO answer is different.
 *
 * @name module:util.round
 * @function
 * @public
 * @see {@link https://stackoverflow.com/questions/11832914|Stack Overflow}
 * @param {number} input - the number to be rounded
 * @param {number} places - the max number of decimals desired
 * @returns {number} input rounded to the specified number of decimal places at most
 */
export function round(input, places = 0)
{
	return +(Math.round(`${input}e+${places}`) + `e-${places}`);
}


/**
 * Calculate the sum of the elements in the input array.
 *
 * If 'input' is not an array, then we return start.
 *
 * @name module:util.sum
 * @function
 * @public
 * @param {array} input - an array of numbers, or of objects that can be cast into a number, e.g. ['1', 2.5, 3e1]
 * @param {number} start - value added to the sum of numbers (a la Python)
 * @returns {number} the sum of the elements in the array + start
 */
export function sum(input = [], start = 0)
{
	if (!Array.isArray(input))
	{
		return start;
	}

	const add = (a, b) => a + b;

	return input
		// type cast everything as a number
		.map(value => Number(value))
		// drop non numeric looking entries (note: needs transpiling for IE11)
		.filter(value => Number.isNaN(value) === false)
		// add up each successive entry, starting with start
		.reduce(add, start);
}


/**
 * Calculate the average of the elements in the input array.
 *
 * If 'input' is not an array, or if it is an empty array, then we return 0.
 *
 * @name module:util.average
 * @function
 * @public
 * @param {array} input - an array of numbers, or of objects that can be cast into a number, e.g. ['1', 2.5, 3e1]
 * @returns {number} the average of the elements in the array
 */
export function average(input = [])
{
	if (!Array.isArray(input))
	{
		return 0;
	}

	if (input.length === 0)
	{
		return 0;
	}

	return sum(input, 0) / input.length;
}


/**
 * Sort the elements of the input array, in increasing alphabetical or numerical order.
 * 
 * @name module:util.sort
 * @function
 * @public
 * @param {array} input - an array of numbers or of strings
 * @return {array} the sorted array
 * @throws if 'input' is not an array, or if its elements are not consistent in types, or if they are not all either numbers or
 * 	strings
 */
export function sort(input)
{
	const response = {
		origin: 'util.sort',
		context: 'when sorting the elements of an array'
	};

	try
	{
		if (!Array.isArray(input))
		{
			throw 'the input argument should be an array';
		}

		// check the type and consistency of the array, and sort it accordingly:
		const isNumberArray = input.every(element => typeof element === "number");
		if (isNumberArray)
		{
			return input.sort((a, b) => (a - b));
		}

		const isStringArray = input.every(element => typeof element === "string");
		if (isStringArray)
		{
			return input.sort();
		}
		
		throw 'the input array should either consist entirely of strings or of numbers';
	}
	catch (error)
	{
		throw {...response, error};
	}	
 }
 
 
/**
 * Create a sequence of integers.
 * 
 * The sequence is such that the integer at index i is: start + step * i, with i >= 0 and start + step * i < stop
 * 
 * <p> Note: this is a JavaScript implement of the Python range function, which explains the unusual management of arguments.</p>
 *
 * @name module:util.range
 * @function
 * @public
 * @param {Number} [start=0] - the value of start
 * @param {Number} stop - the value of stop
 * @param {Number} [step=1] - the value of step
 * @returns {Number[]} the range as an array of numbers
 */
export function range(...args)
{
	const response = {
		origin: 'util.range',
		context: 'when building a range of numbers'
	};

	try
	{
		let start, stop, step;

		switch (args.length)
		{
			case 0:
				throw 'at least one argument is required';

			// 1 arg: start = 0, stop = arg, step = 1
			case 1:
				start = 0;
				stop = args[0];
				step = 1;
				break;

			// 2 args: start = arg1, stop = arg2
			case 2:
				start = args[0];
				stop = args[1];
				step = 1;
				break;

			// 3 args:
			case 3:
				start = args[0];
				stop = args[1];
				step = args[2];
				break;

			default:
				throw 'range requires at least one and at most 3 arguments'
		}

		if (!Number.isInteger(start)) {
			throw 'start should be an integer';
		}
		if (!Number.isInteger(stop)) {
			throw 'stop should be an integer';
		}
		if (!Number.isInteger(step)) {
			throw 'step should be an integer';
		}

		// if start >= stop, the range is empty:
		if (start >= stop)
		{
			return [];
		}

		let result = [];
		for (let i = start; i < stop; i += step)
		{
			result.push(i);
		}
		return result;
	}
	catch (error)
	{
		throw {...response, error};
	}
}


/**
 * Create a boolean function that compares an input element to the given value.
 * 
 * @name module:util._match
 * @function
 * @private
 * @param {Number|string|object|null} value the matching value
 * @return {} a function that compares an input element to the given value
 */
function _match(value)
{
	const response = {
		origin: 'util._match',
		context: 'when creating a function that compares an input element to the given value'
	};

	try
	{
		// function:
		if (typeof value === 'function')
		{
			throw 'the value cannot be a function';
		}

		// NaN:
		if (Number.isNaN(value))
		{
			return (element) => Number.isNaN(element);
		}

		// null:
		if (value === null)
		{
			return (element) => element === null;
		}

		// object: we compare using JSON.stringify
		if (typeof value === 'object')
		{
			const jsonValue = JSON.stringify(value);
			if (typeof jsonValue === 'undefined')
			{
				throw 'value could not be converted to a JSON string';
			}

			return (element) =>
			{
				const jsonElement = JSON.stringify(element);
				return (jsonElement === jsonValue);
			}
		}

		// everything else:
		return (element) => element === value;
	}
	catch (error)
	{
		throw {...response, error};
	}	
 }
 

 /**
  * Count the number of elements in the input array that match the given value.
  * 
  * <p> Note: count is able to handle NaN, null, as well as any value convertible to a JSON string.</p>
  * 
  * @name module:util.count
  * @function
  * @public
  * @param {array} input the input array
  * @param {Number|string|object|null} value the matching value
  * @returns the number of matching elements
  */
 export function count(input, value)
 {
	const response = {
		origin: 'util.count',
		context: 'when counting how many elements in the input array match the given value'
	};

	try
	{
		if (!Array.isArray(input))
		{
			throw 'the input argument should be an array';
		}

		const match = _match(value);

		let nbMatches = 0;
		input.forEach(element =>
			{
				if (match(element))
				{
					++ nbMatches;
				}
			});
		return nbMatches;
	}
	catch (error)
	{
		throw {...response, error};
	}
 }
 

  /**
  * Get the index in the input array of the first element that matches the given value.
  * 
  * <p> Note: index is able to handle NaN, null, as well as any value convertible to a JSON string.</p>
  * 
  * @name module:util.index
  * @function
  * @public
  * @param {array} input the input array
  * @param {Number|string|object|null} value the matching value
  * @returns the index of the first element that matches the value
  * @throws if the input array does not contain any matching element
  */
 export function index(input, value)
 {
	const response = {
		origin: 'util.index',
		context: 'when getting the index in the input array of the first element that matches the given value'
	};

	try
	{
		if (!Array.isArray(input))
		{
			throw 'the input argument should be an array';
		}

		const match = _match(value);
		const index = input.findIndex(match);

		if (index === -1)
		{
			throw 'no element in the input array matches the value';
		}

		return index;

	}
	catch (error)
	{
		throw {...response, error};
	}
 }


/**
 * Return the file extension corresponding to an audio mime type.
 * If the provided mimeType is not a string (e.g. null, undefined, an array)
 * or unknown, then '.dat' is returned, instead of throwing an exception.
 *
 * @name module:util.extensionFromMimeType
 * @function
 * @public
 * @param {string} mimeType the MIME type, e.g. 'audio/webm;codecs=opus'
 * @return {string} the corresponding file extension, e.g. '.webm'
 */
export function extensionFromMimeType(mimeType)
{
	if (typeof mimeType !== 'string')
	{
		return '.dat';
	}

	if (mimeType.indexOf('audio/webm') === 0)
	{
		return '.webm';
	}

	if (mimeType.indexOf('audio/ogg') === 0)
	{
		return '.ogg';
	}

	if (mimeType.indexOf('audio/wav') === 0)
	{
		return '.wav';
	}

	return '.dat';
}
