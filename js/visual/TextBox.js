/**
 * Editable TextBox Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import * as util from '../util/Util';

// TODO finish documenting all options
/**
 * @name module:visual.TextBox
 * @class
 * @extends VisualStim
 * @mixes ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {string} [options.text=""] - the text to be rendered
 * @param {string} [options.font= "Arial"] - the font family
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
 *
 * @param {Color} [options.color= Color('white')] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {string} [options.units= "norm"] - the units of the text size and position
 * @param {number} options.ori - the orientation (in degrees)
 * @param {number} [options.height= 0.1] - the height of the text
 * @param {boolean} [options.bold= false] - whether or not the text is bold
 * @param {boolean} [options.italic= false] - whether or not the text is italic
 * @param {string} [options.anchor = 'left'] - horizontal alignment
 *
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip the text horizontally
 * @param {boolean} [foptions.lipVert= false] - whether or not to flip the text vertically
 * @param {PIXI.Graphics} options.clipMask - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class TextBox extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
								name,
								win,
								pos,
								anchor = 'center',
								size,
								units,
								ori,
								opacity,
								depth = 0,

								text = '',
								font = 'Arial',
								letterHeight = 0.1,
								bold = false,
								italic = false,
								alignment = 'left',
								color = new Color('white'),
								contrast = 1.0,
								flipHoriz = false,
								flipVert = false,

								borderColor,
								borderWidth = 1,
								padding,

								editable = false,

								clipMask,
								autoDraw,
								autoLog
							} = {})
	{
		super({name, win, pos, size, units, ori, opacity, depth, clipMask, autoDraw, autoLog});

		this._addAttributes(TextBox, text, anchor, font, letterHeight, bold, italic, alignment, color, contrast, flipHoriz, flipVert, borderColor, borderWidth, padding, editable);

		// estimate the bounding box (using TextMetrics):
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}



	/**
	 * Setter for the text attribute.
	 *
	 * @name module:visual.TextBox#setText
	 * @public
	 * @param {string} text - the text
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setText(text, log)
	{
		const hasChanged = this._setAttribute('text', text, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the alignHoriz attribute.
	 *
	 * @name module:visual.TextBox#setAlignHoriz
	 * @public
	 * @param {string} alignHoriz - the text horizontal alignment, e.g. 'center'
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setAlignHoriz(alignHoriz, log)
	{
		const hasChanged = this._setAttribute('alignHoriz', alignHoriz, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
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
		if (typeof size === 'undefined')
		{
			if (!TextBox._defaultWrapWidthMap.has(this._units))
			{
				throw {
					origin: 'TextBox.setSize',
					context: 'when setting the size of TextBox: ' + this._name,
					error: 'no default size for unit: ' + this._units
				};
			}

			size = TextBox._defaultSizeMap.get(this._units);
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
	 * Setter for the letterHeight attribute.
	 *
	 * @name module:visual.TextBox#setLetterHeight
	 * @public
	 * @param {number} letterHeight - text height
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setLetterHeight(letterHeight, log)
	{
		if (typeof letterHeight === 'undefined')
		{
			if (!TextBox._defaultLetterHeightMap.has(this._units))
			{
				throw {
					origin: 'TextBox.setLetterHeight',
					context: 'when setting the letter height of TextBox: ' + this._name,
					error: 'no default letter height for unit: ' + this._units
				};
			}

			letterHeight = TextStim._defaultLetterHeightMap.get(this._units);
		}

		const hasChanged = this._setAttribute('letterHeight', letterHeight, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the italic attribute.
	 *
	 * @name module:visual.TextBox#setItalic
	 * @public
	 * @param {boolean} italic - whether or not the text is italic
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setItalic(italic, log)
	{
		const hasChanged = this._setAttribute('italic', italic, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the bold attribute.
	 *
	 * @name module:visual.TextBox#setBold
	 * @public
	 * @param {boolean} bold - whether or not the text is bold
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setBold(bold, log)
	{
		const hasChanged = this._setAttribute('bold', bold, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the flipVert attribute.
	 *
	 * @name module:visual.TextBox#setFlipVert
	 * @public
	 * @param {boolean} flipVert - whether or not to flip vertically
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipVert(flipVert, log)
	{
		const hasChanged = this._setAttribute('flipVert', flipVert, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}



	/**
	 * Setter for the flipHoriz attribute.
	 *
	 * @name module:visual.TextBox#setFlipHoriz
	 * @public
	 * @param {boolean} flipHoriz - whether or not to flip horizontally
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipHoriz(flipHoriz, log)
	{
		const hasChanged = this._setAttribute('flipHoriz', flipHoriz, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
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

		return {
			input: {
				fontSize: letterHeight_px + 'px',
				padding: padding_px + 'px',
				width: (width_px - 2 * padding_px) + 'px',
				color: this._color.hex
			},
			box: {
				default: {
					fill: this.getContrastedColor(this._color, 0.2).int,
					rounded: 5,
					stroke: {
						color: this._borderColor.int,
						width: borderWidth_px
					}
				},
				focused: {
					fill: this.getContrastedColor(this._color, 0.2).int,
					rounded: 5,
					stroke: {
						color: this._borderColor.int,
						width: borderWidth_px
					}
				},
				disabled: {
					fill: this.getContrastedColor(this._color, 0.2).int,
					rounded: 5
				}
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
			this._pixi = new PIXI.TextInput(this._getTextInputOptions());
			this._pixi.placeholder = this._text;
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
	 * Convert the anchor attributes into a numerical value
	 *
	 * @name module:visual.TextBox#_getAnchor
	 * @function
	 * @private
	 * @return {number[]} - the anchoring
	 */
	_getAnchor()
	{
		const anchor = [0.5, 0.5];

		if (this._anchor.indexOf('left'))
		{
			anchor[0] = 0;
		}
		else if (this._anchor.indexOf('right'))
		{
			anchor[0] = 1;
		}
		if (this._anchor.indexOf('top'))
		{
			anchor[1] = 0;
		}
		else if (this._anchor.indexOf('bottom'))
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
