/**
 * Color management.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * <p>This class handles multiple color spaces, and offers various
 * static methods for converting colors from one space to another.</p>
 *
 * <p>The constructor accepts the following color representations:
 * <ul>
 * <li>a named color, e.g. 'aliceblue' (the colorspace must be RGB)</li>
 * <li>an hexadecimal string representation, e.g. '#FF0000' (the colorspace must be RGB)</li>
 * <li>an hexadecimal number representation, e.g. 0xFF0000 (the colorspace must be RGB)</li>
 * <li>a triplet of numbers, e.g. [-1, 0, 1], [0, 128, 255] (the numbers must be within the range determined by the colorspace)</li>
 * </ul>
 * </p>
 *
 * <p>Note: internally, colors are represented as a [r,g,b] triplet with r,g,b in [0,1].</p>
 *
 * @name module:util.Color
 * @class
 * @param {string|number|Array.<number>|undefined} [obj= 'black'] - an object representing a color
 * @param {module:util.Color#COLOR_SPACE|undefined} [colorspace=Color.COLOR_SPACE.RGB] - the colorspace of that color
 *
 * @todo implement HSV, DKL, and LMS colorspaces
 */
export class Color
{

	constructor(obj = 'black', colorspace = Color.COLOR_SPACE.RGB)
	{
		const response = {origin: 'Color', context: 'when defining a color'};

		// named color (e.g. 'seagreen') or string hexadecimal representation (e.g. '#FF0000'):
		// note: we expect the color space to be RGB
		if (typeof obj == 'string')
		{
			if (colorspace !== Color.COLOR_SPACE.RGB)
			{
				throw Object.assign(response, {
					error: 'the colorspace must be RGB for' +
						' a' +
						' named color'
				});
			}

			// hexademical representation:
			if (obj[0] === '#')
			{
				this._hex = obj;
			}
			// named color:
			else
			{
				if (!(obj.toLowerCase() in Color.NAMED_COLORS))
				{
					throw Object.assign(response, {error: 'unknown named color: ' + obj});
				}

				this._hex = Color.NAMED_COLORS[obj.toLowerCase()];
			}

			this._rgb = Color.hexToRgb(this._hex);
		}

		// hexadecimal number representation (e.g. 0xFF0000)
		// note: we expect the color space to be RGB
		else if (typeof obj == 'number')
		{
			if (colorspace !== Color.COLOR_SPACE.RGB)
			{
				throw Object.assign(response, {
					error: 'the colorspace must be RGB for' +
						' a' +
						' named color'
				});
			}

			this._rgb = Color._intToRgb(obj);
		}

		// array of numbers:
		else if (Array.isArray(obj))
		{
			Color._checkTypeAndRange(obj);
			let [a, b, c] = obj;

			// check range and convert to [0,1]:
			if (colorspace !== Color.COLOR_SPACE.RGB255)
			{
				Color._checkTypeAndRange(obj, [-1, 1]);

				a = (a + 1.0) / 2.0;
				b = (b + 1.0) / 2.0;
				c = (c + 1.0) / 2.0;
			}

			// get RGB components:
			switch (colorspace)
			{
				case Color.COLOR_SPACE.RGB255:
					Color._checkTypeAndRange(obj, [0, 255]);
					this._rgb = [a / 255.0, b / 255.0, c / 255.0];
					break;

				case Color.COLOR_SPACE.RGB:
					this._rgb = [a, b, c];
					break;

				case Color.COLOR_SPACE.HSV:
					break;

				case Color.COLOR_SPACE.DKL:
					break;

				case Color.COLOR_SPACE.LMS:
					break;

				default:
					throw Object.assign(response, {error: 'unknown colorspace: ' + colorspace});
			}

		}
	}


	/**
	 * Get the [0,1] RGB triplet equivalent of this Color.
	 *
	 * @name module:util.Color.rgb
	 * @function
	 * @public
	 * @return {Array.<number>} the [0,1] RGB triplet equivalent
	 */
	get rgb()
	{
		return this._rgb;
	}


	/**
	 * Get the [0,255] RGB triplet equivalent of this Color.
	 *
	 * @name module:util.Color.rgb255
	 * @function
	 * @public
	 * @return {Array.<number>} the [0,255] RGB triplet equivalent
	 */
	get rgb255()
	{
		return [Math.round(this._rgb[0] * 255.0), Math.round(this._rgb[1] * 255.0), Math.round(this._rgb[2] * 255.0)];
	}


	/**
	 * Get the hexadecimal color code equivalent of this Color.
	 *
	 * @name module:util.Color.hex
	 * @function
	 * @public
	 * @return {string} the hexadecimal color code equivalent
	 */
	get hex()
	{
		if (typeof this._hex === 'undefined')
		{
			this._hex = Color._rgbToHex(this._rgb);
		}
		return this._hex;
	}

	/**
	 * Get the integer code equivalent of this Color.
	 *
	 * @name module:util.Color.int
	 * @function
	 * @public
	 * @return {number} the integer code equivalent
	 */
	get int()
	{
		if (typeof this._int === 'undefined')
		{
			this._int = Color._rgbToInt(this._rgb);
		}
		return this._int;
	}


	/*
	get hsv() {
		if (typeof this._hsv === 'undefined')
			this._hsv = Color._rgbToHsv(this._rgb);
		return this._hsv;
	}
	get dkl() {
		if (typeof this._dkl === 'undefined')
			this._dkl = Color._rgbToDkl(this._rgb);
		return this._dkl;
	}
	get lms() {
		if (typeof this._lms === 'undefined')
			this._lms = Color._rgbToLms(this._rgb);
		return this._lms;
	}
	*/


	/**
	 * String representation of the color, i.e. the hexadecimal representation.
	 *
	 * @name module:util.Color.toString
	 * @function
	 * @return {string} the representation.
	 *
	 */
	toString()
	{
		return this.hex;
	}


	/**
	 * Get the [0,255] RGB triplet equivalent of the hexadecimal color code.
	 *
	 * @name module:util.Color.hexToRgb255
	 * @function
	 * @static
	 * @public
	 * @param {string} hex - the hexadecimal color code
	 * @return {Array.<number>} the [0,255] RGB triplet equivalent
	 */
	static hexToRgb255(hex)
	{
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (result == null)
		{
			throw {
				origin: 'Color.hexToRgb255',
				context: 'when converting an hexadecimal color code to its 255- or [0,1]-based RGB color representation',
				error: 'unable to parse the argument: wrong type or wrong code'
			};
		}

		return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
	}


	/**
	 * Get the [0,1] RGB triplet equivalent of the hexadecimal color code.
	 *
	 * @name module:util.Color.hexToRgb
	 * @function
	 * @static
	 * @public
	 * @param {string} hex - the hexadecimal color code
	 * @return {Array.<number>} the [0,1] RGB triplet equivalent
	 */
	static hexToRgb(hex)
	{
		const [r255, g255, b255] = Color.hexToRgb255(hex);
		return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
	}


	/**
	 * Get the hexadecimal color code equivalent of the [0, 255] RGB triplet.
	 *
	 * @name module:util.Color.rgb255ToHex
	 * @function
	 * @static
	 * @public
	 * @param {Array.<number>} rgb255 - the [0, 255] RGB triplet
	 * @return {string} the hexadecimal color code equivalent
	 */
	static rgb255ToHex(rgb255)
	{
		const response = {
			origin: 'Color.rgb255ToHex',
			context: 'when converting an rgb triplet to its hexadecimal color representation'
		};

		try
		{
			Color._checkTypeAndRange(rgb255, [0, 255]);
			return Color._rgb255ToHex(rgb255);
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Get the hexadecimal color code equivalent of the [0, 1] RGB triplet.
	 *
	 * @name module:util.Color.rgbToHex
	 * @function
	 * @static
	 * @public
	 * @param {Array.<number>} rgb - the [0, 1] RGB triplet
	 * @return {string} the hexadecimal color code equivalent
	 */
	static rgbToHex(rgb)
	{
		const response = {
			origin: 'Color.rgbToHex',
			context: 'when converting an rgb triplet to its hexadecimal color representation'
		};

		try
		{
			Color._checkTypeAndRange(rgb, [0, 1]);
			return Color._rgbToHex(rgb);
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Get the integer equivalent of the [0, 1] RGB triplet.
	 *
	 * @name module:util.Color.rgbToInt
	 * @function
	 * @static
	 * @public
	 * @param {Array.<number>} rgb - the [0, 1] RGB triplet
	 * @return {number} the integer equivalent
	 */
	static rgbToInt(rgb)
	{
		const response = {
			origin: 'Color.rgbToInt',
			context: 'when converting an rgb triplet to its integer representation'
		};

		try
		{
			Color._checkTypeAndRange(rgb, [0, 1]);
			return Color._rgbToInt(rgb);
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Get the integer equivalent of the [0, 255] RGB triplet.
	 *
	 * @name module:util.Color.rgb255ToInt
	 * @function
	 * @static
	 * @public
	 * @param {Array.<number>} rgb255 - the [0, 255] RGB triplet
	 * @return {number} the integer equivalent
	 */
	static rgb255ToInt(rgb255)
	{
		const response = {
			origin: 'Color.rgb255ToInt',
			context: 'when converting an rgb triplet to its integer representation'
		};
		try
		{
			Color._checkTypeAndRange(rgb255, [0, 255]);
			return Color._rgb255ToInt(rgb255);
		}
		catch (error)
		{
			throw Object.assign(response, {error});
		}
	}


	/**
	 * Get the hexadecimal color code equivalent of the [0, 255] RGB triplet.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._rgb255ToHex
	 * @function
	 * @static
	 * @private
	 * @param {Array.<number>} rgb255 - the [0, 255] RGB triplet
	 * @return {string} the hexadecimal color code equivalent
	 */
	static _rgb255ToHex(rgb255)
	{
		return "#" + ((1 << 24) + (rgb255[0] << 16) + (rgb255[1] << 8) + rgb255[2]).toString(16).slice(1);
	}


	/**
	 * Get the hexadecimal color code equivalent of the [0, 1] RGB triplet.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._rgbToHex
	 * @function
	 * @static
	 * @private
	 * @param {Array.<number>} rgb - the [0, 1] RGB triplet
	 * @return {string} the hexadecimal color code equivalent
	 */
	static _rgbToHex(rgb)
	{
		let rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
		return Color._rgb255ToHex(rgb255);
	}


	/**
	 * Get the integer equivalent of the [0, 1] RGB triplet.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._rgbToInt
	 * @function
	 * @static
	 * @private
	 * @param {Array.<number>} rgb - the [0, 1] RGB triplet
	 * @return {number} the integer equivalent
	 */
	static _rgbToInt(rgb)
	{
		let rgb255 = [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
		return Color._rgb255ToInt(rgb255);
	}


	/**
	 * Get the integer equivalent of the [0, 255] RGB triplet.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._rgb255ToInt
	 * @function
	 * @static
	 * @private
	 * @param {Array.<number>} rgb255 - the [0, 255] RGB triplet
	 * @return {number} the integer equivalent
	 */
	static _rgb255ToInt(rgb255)
	{
		return rgb255[0] * 0x10000 + rgb255[1] * 0x100 + rgb255[2];
	}


	/**
	 * Get the [0, 255] based RGB triplet equivalent of the integer color code.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._intToRgb255
	 * @function
	 * @static
	 * @private
	 * @param {number} hex - the integer color code
	 * @return {Array.<number>} the [0, 255] RGB equivalent
	 */
	static _intToRgb255(hex)
	{
		const r255 = hex >>> 0x10;
		const g255 = (hex & 0xFF00) / 0x100;
		const b255 = hex & 0xFF;

		return [r255, g255, b255];
	}


	/**
	 * Get the [0, 1] based RGB triplet equivalent of the integer color code.
	 *
	 * <p>Note: this is the fast, unsafe version which does not check for argument sanity</p>
	 *
	 * @name module:util.Color._intToRgb
	 * @function
	 * @static
	 * @private
	 * @param {number} hex - the integer color code
	 * @return {Array.<number>} the [0, 1] RGB equivalent
	 */
	static _intToRgb(hex)
	{
		const [r255, g255, b255] = Color._intToRgb255(hex);

		return [r255 / 255.0, g255 / 255.0, b255 / 255.0];
	}

	/**
	 * Check that the argument is an array of numbers of size 3, and, potentially, that its elements fall within the range.
	 *
	 * @name module:util.Color._checkTypeAndRange
	 * @function
	 * @static
	 * @private
	 * @param {any} arg - the argument
	 * @param {Array.<number>} [range] - the lower and higher bounds of the range
	 * @return {boolean} whether the argument is an array of numbers of size 3, and, potentially, whether its elements fall within the range (if range is not undefined)
	 */
	static _checkTypeAndRange(arg, range = undefined)
	{
		if (!Array.isArray(arg) || arg.length !== 3 ||
			typeof arg[0] !== 'number' || typeof arg[1] !== 'number' || typeof arg[2] !== 'number')
		{
			throw 'the argument should be an array of numbers of length 3';
		}

		if (typeof range !== 'undefined' && (arg[0] < range[0] || arg[0] > range[1] || arg[1] < range[0] || arg[1] > range[1] || arg[2] < range[0] || arg[2] > range[1]))
		{
			throw 'the color components should all belong to [' + range[0] + ', ' + range[1] + ']';
		}
	}
}


/**
 * Color spaces.
 *
 * @name module:util.Color#COLOR_SPACE
 * @enum {Symbol}
 * @readonly
 * @public
 */
Color.COLOR_SPACE = {
	/**
	 * RGB colorspace: [r,g,b] with r,g,b in [-1, 1]
	 */
	RGB: Symbol.for('RGB'),

	/**
	 * RGB255 colorspace: [r,g,b] with r,g,b in [0, 255]
	 */
	RGB255: Symbol.for('RGB255'),

	/*
	HSV: Symbol.for('HSV'),
	DKL: Symbol.for('DKL'),
	LMS: Symbol.for('LMS')
	*/
};


/**
 * Named colors.
 *
 * @name module:util.Color#NAMED_COLORS
 * @enum {Symbol}
 * @readonly
 * @public
 */
Color.NAMED_COLORS = {
	'aliceblue': '#F0F8FF',
	'antiquewhite': '#FAEBD7',
	'aqua': '#00FFFF',
	'aquamarine': '#7FFFD4',
	'azure': '#F0FFFF',
	'beige': '#F5F5DC',
	'bisque': '#FFE4C4',
	'black': '#000000',
	'blanchedalmond': '#FFEBCD',
	'blue': '#0000FF',
	'blueviolet': '#8A2BE2',
	'brown': '#A52A2A',
	'burlywood': '#DEB887',
	'cadetblue': '#5F9EA0',
	'chartreuse': '#7FFF00',
	'chocolate': '#D2691E',
	'coral': '#FF7F50',
	'cornflowerblue': '#6495ED',
	'cornsilk': '#FFF8DC',
	'crimson': '#DC143C',
	'cyan': '#00FFFF',
	'darkblue': '#00008B',
	'darkcyan': '#008B8B',
	'darkgoldenrod': '#B8860B',
	'darkgray': '#A9A9A9',
	'darkgreen': '#006400',
	'darkkhaki': '#BDB76B',
	'darkmagenta': '#8B008B',
	'darkolivegreen': '#556B2F',
	'darkorange': '#FF8C00',
	'darkorchid': '#9932CC',
	'darkred': '#8B0000',
	'darksalmon': '#E9967A',
	'darkseagreen': '#8FBC8B',
	'darkslateblue': '#483D8B',
	'darkslategray': '#2F4F4F',
	'darkturquoise': '#00CED1',
	'darkviolet': '#9400D3',
	'deeppink': '#FF1493',
	'deepskyblue': '#00BFFF',
	'dimgray': '#696969',
	'dodgerblue': '#1E90FF',
	'firebrick': '#B22222',
	'floralwhite': '#FFFAF0',
	'forestgreen': '#228B22',
	'fuchsia': '#FF00FF',
	'gainsboro': '#DCDCDC',
	'ghostwhite': '#F8F8FF',
	'gold': '#FFD700',
	'goldenrod': '#DAA520',
	'gray': '#808080',
	'green': '#008000',
	'greenyellow': '#ADFF2F',
	'honeydew': '#F0FFF0',
	'hotpink': '#FF69B4',
	'indianred': '#CD5C5C',
	'indigo': '#4B0082',
	'ivory': '#FFFFF0',
	'khaki': '#F0E68C',
	'lavender': '#E6E6FA',
	'lavenderblush': '#FFF0F5',
	'lawngreen': '#7CFC00',
	'lemonchiffon': '#FFFACD',
	'lightblue': '#ADD8E6',
	'lightcoral': '#F08080',
	'lightcyan': '#E0FFFF',
	'lightgoldenrodyellow': '#FAFAD2',
	'lightgray': '#D3D3D3',
	'lightgreen': '#90EE90',
	'lightpink': '#FFB6C1',
	'lightsalmon': '#FFA07A',
	'lightseagreen': '#20B2AA',
	'lightskyblue': '#87CEFA',
	'lightslategray': '#778899',
	'lightsteelblue': '#B0C4DE',
	'lightyellow': '#FFFFE0',
	'lime': '#00FF00',
	'limegreen': '#32CD32',
	'linen': '#FAF0E6',
	'magenta': '#FF00FF',
	'maroon': '#800000',
	'mediumaquamarine': '#66CDAA',
	'mediumblue': '#0000CD',
	'mediumorchid': '#BA55D3',
	'mediumpurple': '#9370DB',
	'mediumseagreen': '#3CB371',
	'mediumslateblue': '#7B68EE',
	'mediumspringgreen': '#00FA9A',
	'mediumturquoise': '#48D1CC',
	'mediumvioletred': '#C71585',
	'midnightblue': '#191970',
	'mintcream': '#F5FFFA',
	'mistyrose': '#FFE4E1',
	'moccasin': '#FFE4B5',
	'navajowhite': '#FFDEAD',
	'navy': '#000080',
	'oldlace': '#FDF5E6',
	'olive': '#808000',
	'olivedrab': '#6B8E23',
	'orange': '#FFA500',
	'orangered': '#FF4500',
	'orchid': '#DA70D6',
	'palegoldenrod': '#EEE8AA',
	'palegreen': '#98FB98',
	'paleturquoise': '#AFEEEE',
	'palevioletred': '#DB7093',
	'papayawhip': '#FFEFD5',
	'peachpuff': '#FFDAB9',
	'peru': '#CD853F',
	'pink': '#FFC0CB',
	'plum': '#DDA0DD',
	'powderblue': '#B0E0E6',
	'purple': '#800080',
	'red': '#FF0000',
	'rosybrown': '#BC8F8F',
	'royalblue': '#4169E1',
	'saddlebrown': '#8B4513',
	'salmon': '#FA8072',
	'sandybrown': '#F4A460',
	'seagreen': '#2E8B57',
	'seashell': '#FFF5EE',
	'sienna': '#A0522D',
	'silver': '#C0C0C0',
	'skyblue': '#87CEEB',
	'slateblue': '#6A5ACD',
	'slategray': '#708090',
	'snow': '#FFFAFA',
	'springgreen': '#00FF7F',
	'steelblue': '#4682B4',
	'tan': '#D2B48C',
	'teal': '#008080',
	'thistle': '#D8BFD8',
	'tomato': '#FF6347',
	'turquoise': '#40E0D0',
	'violet': '#EE82EE',
	'wheat': '#F5DEB3',
	'white': '#FFFFFF',
	'whitesmoke': '#F5F5F5',
	'yellow': '#FFFF00',
	'yellowgreen': '#9ACD32'
};
