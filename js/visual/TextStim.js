/**
 * Text Stimulus.
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


/**
 * @name module:visual.TextStim
 * @class
 * @extends VisualStim
 * @mixes ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {Window} options.win - the associated Window
 * @param {string} [options.text="Hello World"] - the text to be rendered
 * @param {string} [options.font= "Arial"] - the text font
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
 * @param {Color} [options.color= Color('white')] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {string} [options.units= "norm"] - the units of the text size and position
 * @param {number} options.ori - the orientation (in degrees)
 * @param {number} [options.height= 0.1] - the height of the text
 * @param {boolean} [options.bold= false] - whether or not the text is bold
 * @param {boolean} [options.italic= false] - whether or not the text is italic
 * @param {string} [alignHoriz = 'left'] - horizontal alignment
 * @param {string} [alignVert = 'center'] - vertical alignment
 * @param {boolean} wrapWidth - whether or not to wrap the text horizontally
 * @param {boolean} [flipHoriz= false] - whether or not to flip the text horizontally
 * @param {boolean} [flipVert= false] - whether or not to flip the text vertically
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo vertical alignment, and orientation are currently NOT implemented
 */
export class TextStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
								name,
								win,
								text = 'Hello World',
								font = 'Arial',
								pos,
								color = new Color('white'),
								opacity,
								contrast = 1.0,
								units,
								ori,
								height = 0.1,
								bold = false,
								italic = false,
								alignHoriz = 'left',
								alignVert = 'center',
								wrapWidth,
								flipHoriz = false,
								flipVert = false,
								autoDraw,
								autoLog
							} = {})
	{
		super({name, win, units, ori, opacity, pos, autoDraw, autoLog});

		this._addAttributes(TextStim, text, font, color, contrast, height, bold, italic, alignHoriz, alignVert, wrapWidth, flipHoriz, flipVert);

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}


	/**
	 * Setter for the text attribute.
	 *
	 * @name module:visual.TextStim#setText
	 * @public
	 * @param {string} text - the text
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setText(text, log)
	{
		this._setAttribute('text', text, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the alignHoriz attribute.
	 *
	 * @name module:visual.TextStim#setAlignHoriz
	 * @public
	 * @param {string} alignHoriz - the text horizontal alignment, e.g. 'center'
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setAlignHoriz(alignHoriz, log)
	{
		this._setAttribute('alignHoriz', alignHoriz, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the wrapWidth attribute.
	 *
	 * @name module:visual.TextStim#setWrapWidth
	 * @public
	 * @param {boolean} wrapWidth - whether or not to wrap the text at the given width
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setWrapWidth(wrapWidth, log)
	{
		if (typeof wrapWidth === 'undefined')
		{
			if (!TextStim._defaultWrapWidthMap.has(this._units))
			{
				throw {
					origin: 'TextStim.setWrapWidth',
					context: 'when setting the wrap width of TextStim: ' + this._name,
					error: 'no default wrap width for unit: ' + this._units
				};
			}

			wrapWidth = TextStim._defaultWrapWidthMap.get(this._units);
		}

		this._setAttribute('wrapWidth', wrapWidth, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the height attribute.
	 *
	 * @name module:visual.TextStim#setHeight
	 * @public
	 * @param {number} height - text height
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setHeight(height, log)
	{
		if (typeof height === 'undefined')
		{
			if (!TextStim._defaultLetterHeightMap.has(this._units))
			{
				throw {
					origin: 'TextStim.setHeight',
					context: 'when setting the height of TextStim: ' + this._name,
					error: 'no default letter height for unit: ' + this._units
				};
			}

			height = TextStim._defaultLetterHeightMap.get(this._units);
		}

		this._setAttribute('height', height, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the italic attribute.
	 *
	 * @name module:visual.TextStim#setItalic
	 * @public
	 * @param {boolean} italic - whether or not the text is italic
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setItalic(italic, log)
	{
		this._setAttribute('italic', italic, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the bold attribute.
	 *
	 * @name module:visual.TextStim#setBold
	 * @public
	 * @param {boolean} bold - whether or not the text is bold
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setBold(bold, log)
	{
		this._setAttribute('bold', bold, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the flipVert attribute.
	 *
	 * @name module:visual.TextStim#setFlipVert
	 * @public
	 * @param {boolean} flipVert - whether or not to flip vertically
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipVert(flipVert, log)
	{
		this._setAttribute('flipVert', flipVert, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Setter for the flipHoriz attribute.
	 *
	 * @name module:visual.TextStim#setFlipHoriz
	 * @public
	 * @param {boolean} flipHoriz - whether or not to flip horizontally
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFlipHoriz(flipHoriz, log)
	{
		this._setAttribute('flipHoriz', flipHoriz, log);

		this._needUpdate = true;
		//this._needVertexUpdate = true;
	}


	/**
	 * Determine whether an object is inside the bounding box of the text.
	 *
	 * @name module:visual.TextStim#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the object is inside the bounding box of the text
	 *
	 * @todo this is currently NOT implemented
	 */
	contains(object, units)
	{
		// get position of object:
		let objectPos_px = util.getPositionFromObject(object, units);
		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'TextStim.contains',
				context: 'when determining whether TextStim: ' + this._name + ' contains object: ' + util.toString(object),
				error: 'unable to determine the position of the object'
			};
		}

		// test for inclusion:
		// TODO
		return false;
	}


	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.TextStim#_updateIfNeeded
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

		this._heightPix = this._getLengthPix(this._height);

		const fontSize = Math.round(this._heightPix);
		let color = this.getContrastedColor(this._color, this._contrast);
		const font =
			(this._bold ? 'bold ' : '') +
			(this._italic ? 'italic ' : '') +
			fontSize + 'px ' + this._font;
		this._pixi = new PIXI.Text(this._text, {
			font: font,
			fill: color.hex,
			align: this._alignHoriz,
			wordWrap: (typeof this._wrapWidth !== 'undefined'),
			wordWrapWidth: this._wrapWidth ? this._getHorLengthPix(this._wrapWidth) : 0
		});

		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;

		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;

		this._pixi.rotation = this._ori * Math.PI / 180;
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;

		this._size = [
			this._getLengthUnits(Math.abs(this._pixi.width)),
			this._getLengthUnits(Math.abs(this._pixi.height))
		];
	}


}


/**
 * <p>This map associates units to default letter height.</p>
 *
 * @name module:visual.TextStim#_defaultLetterHeightMap
 * @readonly
 * @private
 */
TextStim._defaultLetterHeightMap = new Map([
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
 * <p>This map associates units to default wrap width.</p>
 *
 * @name module:visual.TextStim#_defaultLetterHeightMap
 * @readonly
 * @private
 */
TextStim._defaultWrapWidthMap = new Map([
	['cm', 15.0],
	['deg', 15.0],
	['degs', 15.0],
	['degFlatPos', 15.0],
	['degFlat', 15.0],
	['norm', 1],
	['height', 1],
	['pix', 500],
	['pixels', 500]
]);
