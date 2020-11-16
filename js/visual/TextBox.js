/**
 * Editable TextBox Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import {TextInput} from './TextInput';
import * as util from '../util/Util';

// TODO finish documenting all options
/**
 * @name module:visual.TextBox
 * @class
 * @extends VisualStim
 * @mixes ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {module:core.Window} options.win - the associated Window
 * @param {string} [options.text=""] - the text to be rendered
 * @param {string} [options.font= "Arial"] - the font family
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
 *
 * @param {Color} [options.color= Color('white')] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {string} [options.units= "norm"] - the units of the text size and position
 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
 * @param {number} [options.height= 0.1] - the height of the text
 * @param {boolean} [options.bold= false] - whether or not the text is bold
 * @param {boolean} [options.italic= false] - whether or not the text is italic
 * @param {string} [options.anchor = 'left'] - horizontal alignment
 *
 * @param {boolean} [options.multiline= false] - whether or not a textarea is used
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip the text horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip the text vertically
 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class TextBox extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({name, win, pos, anchor, size, units, ori, opacity, depth, text, font, letterHeight, bold, italic, alignment, color, contrast, flipHoriz, flipVert, fillColor, borderColor, borderWidth, padding, editable, multiline, clipMask, autoDraw, autoLog} = {})
	{
		super({name, win, pos, size, units, ori, opacity, depth, clipMask, autoDraw, autoLog});

		this._addAttribute(
			'text',
			text,
			'',
			this._onChange(true, true)
		);
		this._addAttribute(
			'anchor',
			anchor,
			'center',
			this._onChange(false, true)
		);
		this._addAttribute(
			'flipHoriz',
			flipHoriz,
			false,
			this._onChange(false, false)
		);
		this._addAttribute(
			'flipVert',
			flipVert,
			false,
			this._onChange(false, false)
		);

		// font:
		this._addAttribute(
			'font',
			font,
			'Arial',
			this._onChange(true, true)
		);
		this._addAttribute(
			'letterHeight',
			letterHeight,
			this._getDefaultLetterHeight(),
			this._onChange(true, true)
		);
		this._addAttribute(
			'bold',
			bold,
			false,
			this._onChange(true, true)
		);
		this._addAttribute(
			'italic',
			italic,
			false,
			this._onChange(true, true)
		);
		this._addAttribute(
			'alignment',
			alignment,
			'left',
			this._onChange(true, true)
		);

		// colors:
		this._addAttribute(
			'color',
			color,
			'white',
			this._onChange(true, false)
		);
		this._addAttribute(
			'fillColor',
			fillColor,
			'lightgrey',
			this._onChange(true, false)
		);
		this._addAttribute(
			'borderColor',
			borderColor,
			'white',
			this._onChange(true, false)
		);
		this._addAttribute(
			'contrast',
			contrast,
			1.0,
			this._onChange(true, false)
		);

		// default border width: 1px
		this._addAttribute(
			'borderWidth',
			borderWidth,
			util.to_unit([1, 0], 'pix', win, this._units)[0],
			this._onChange(true, true)
		);
		// default padding: half of the letter height
		this._addAttribute(
			'padding',
			padding,
			this._letterHeight / 2.0,
			this._onChange(true, true)
		);

		this._addAttribute('multiline', multiline, false, this._onChange(true, true));
		this._addAttribute('editable', editable, false, this._onChange(true, true));
			// this._setAttribute({
			// 	name: 'vertices',
			// 	value: vertices,
			// 	assert: v => (v != null) && (typeof v !== 'undefined') && Array.isArray(v) )
			// 	log);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Clears the current text value.
	 *
	 * @name module:visual.TextBox#reset
	 * @public
	 */
	reset()
	{
		this.setText();
	}


	/**
	 * For tweaking the underlying input value.
	 *
	 * @name module:visual.TextBox#setText
	 * @public
	 * @param {string} text
	 */
	setText(text = '')
	{
		if (typeof this._pixi !== 'undefined')
		{
			this._pixi.text = text;
		}

		this._text = text;
	}


	/**
	 * For accessing the underlying input value.
	 *
	 * @name module:visual.TextBox#getText
	 * @public
	 * @return {string} - the current text value of the underlying input element.
	 */
	getText()
	{
		if (typeof this._pixi !== 'undefined')
		{
			return this._pixi.text;
		}

		return this._text;
	}


	/**
	 * Setter for the size attribute.
	 *
	 * @name module:visual.TextBox#setSize
	 * @public
	 * @param {boolean} size - whether or not to wrap the text at the given width
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setSize(size, log)
	{
		// test with the size is undefined, or [undefined, undefined]:
		let isSizeUndefined = (
			(typeof size === 'undefined') || (size === null) ||
			( Array.isArray(size) && size.every( v => typeof v === 'undefined' || v === null) )
		); 

		if (isSizeUndefined)
		{
			size = TextBox._defaultSizeMap.get(this._units);

			if (typeof size === 'undefined')
			{
				throw {
					origin: 'TextBox.setSize',
					context: 'when setting the size of TextBox: ' + this._name,
					error: 'no default size for unit: ' + this._units
				};
			}
		}

		const hasChanged = this._setAttribute('size', size, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Get the default letter height given the stimulus' units.
	 *
	 * @name module:visual.TextBox#_getDefaultLetterHeight
	 * @return {number} - the letter height corresponding to this stimulus' units.
	 * @protected
	 */
	_getDefaultLetterHeight()
	{
		const height = TextBox._defaultLetterHeightMap.get(this._units);

		if (typeof height === 'undefined')
		{
			throw {
				origin: 'TextBox._getDefaultLetterHeight',
				context: 'when getting the default height of TextBox: ' + this._name,
				error: 'no default letter height for unit: ' + this._units
			};
		}

		return height;
	}



	/**
	 * Get the TextInput options applied to the PIXI.TextInput.
	 *
	 * @name module:visual.TextBox#_getTextInputOptions
	 * @private
	 */
	_getTextInputOptions()
	{
		const letterHeight_px = Math.round(this._getLengthPix(this._letterHeight));
		const padding_px = Math.round(this._getLengthPix(this._padding));
		const width_px = Math.round(this._getLengthPix(this._size[0]));
		const borderWidth_px = Math.round(this._getLengthPix(this._borderWidth));
		const height_px = Math.round(this._getLengthPix(this._size[1]));
		const multiline = this._multiline;

		return {
			input: {
				fontFamily: this._font,
				fontSize: letterHeight_px + 'px',
				color: new Color(this._color).hex,
				fontWeight: (this._bold) ? 'bold' : 'normal',
				fontStyle: (this._italic) ? 'italic' : 'normal',

				padding: padding_px + 'px',
				multiline,
				height: multiline ? (height_px - 2 * padding_px) + 'px' : undefined,
				width: (width_px - 2 * padding_px) + 'px'
			},
			box: {
				fill: new Color(this._fillColor).int,
				rounded: 5,
				stroke: {
					color: new Color(this._borderColor).int,
					width: borderWidth_px
				}
				/*default: {
					fill: new Color(this._fillColor).int,
					rounded: 5,
					stroke: {
						color: new Color(this._borderColor).int,
						width: borderWidth_px
					}
				},
				focused: {
					fill: new Color(this._fillColor).int,
					rounded: 5,
					stroke: {
						color: new Color(this._borderColor).int,
						width: borderWidth_px
					}
				},
				disabled: {
					fill: new Color(this._fillColor).int,
					rounded: 5,
					stroke: {
						color: new Color(this._borderColor).int,
						width: borderWidth_px
					}
				}*/
			}
		};
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.TextBox#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// estimate the vertical size:
		const boxHeight = this._letterHeight + 2 * this._padding + 2 * this._borderWidth;

		// take the alignment into account:
		const anchor = this._getAnchor();
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * this._size[0],
			this._pos[1] - anchor[1] * boxHeight,
			this._size[0],
			boxHeight
		);

		// TODO take the orientation into account
	}



	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.TextBox#_updateIfNeeded
	 * @private
	 *
	 * @todo take size into account
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		// update the PIXI representation, if need be:
		if (this._needPixiUpdate)
		{
			this._needPixiUpdate = false;

			if (typeof this._pixi !== 'undefined')
			{
				this._pixi.destroy(true);
			}
			this._pixi = new TextInput(this._getTextInputOptions());
			if (this._multiline)
			{
				this._pixi._multiline = this._multiline;
			}
			if (this._editable)
			{
				this._pixi.placeholder = this._text;
			}
			else
			{
				this._pixi.text = this._text;
			}
		}

		this._pixi.disabled = !this._editable;

		const anchor = this._getAnchor();
		this._pixi.pivot.x = anchor[0] * this._pixi.width;
		this._pixi.pivot.y = anchor[1] * this._pixi.height;

		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;
		this._pixi.rotation = this._ori * Math.PI / 180;
		[this._pixi.x, this._pixi.y] = util.to_px(this._pos, this._units, this._win);

		this._pixi.alpha = this._opacity;
		this._pixi.zIndex = this._depth;

		// apply the clip mask:
		this._pixi.mask = this._clipMask;
	}



	/**
	 * Convert the anchor attribute into numerical values.
	 *
	 * @name module:visual.TextBox#_getAnchor
	 * @function
	 * @protected
	 * @return {number[]} - the anchor, as an array of numbers in [0,1]
	 */
	_getAnchor()
	{
		const anchor = [0.5, 0.5];

		if (this._anchor.indexOf('left') > -1)
		{
			anchor[0] = 0;
		}
		else if (this._anchor.indexOf('right') > -1)
		{
			anchor[0] = 1;
		}
		if (this._anchor.indexOf('top') > -1)
		{
			anchor[1] = 0;
		}
		else if (this._anchor.indexOf('bottom') > -1)
		{
			anchor[1] = 1;
		}

		return anchor;
	}


}


/**
 * <p>This map associates units to default letter height.</p>
 *
 * @name module:visual.TextBox#_defaultLetterHeightMap
 * @readonly
 * @private
 */
TextBox._defaultLetterHeightMap = new Map([
	['cm', 1.0],
	['deg', 1.0],
	['degs', 1.0],
	['degFlatPos', 1.0],
	['degFlat', 1.0],
	['norm', 0.1],
	['height', 0.2],
	['pix', 20],
	['pixels', 20]
]);


/**
 * <p>This map associates units to default sizes.</p>
 *
 * @name module:visual.TextBox#_defaultSizeMap
 * @readonly
 * @private
 */
TextBox._defaultSizeMap = new Map([
	['cm', [15.0, -1]],
	['deg', [15.0, -1]],
	['degs', [15.0, -1]],
	['degFlatPos', [15.0, -1]],
	['degFlat', [15.0, -1]],
	['norm', [1, -1]],
	['height', [1, -1]],
	['pix', [500, -1]],
	['pixels', [500, -1]]
]);
