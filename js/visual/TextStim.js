/**
 * Text Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
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
 * @param {module:core.Window} options.win - the associated Window
 * @param {string} [options.text="Hello World"] - the text to be rendered
 * @param {string} [options.font= "Arial"] - the font family
 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
 * @param {Color} [options.color= 'white'] the background color
 * @param {number} [options.opacity= 1.0] - the opacity
 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
 * @param {number} [options.contrast= 1.0] - the contrast
 * @param {string} [options.units= "norm"] - the units of the text size and position
 * @param {number} options.ori - the orientation (in degrees)
 * @param {number} [options.height= 0.1] - the height of the text
 * @param {boolean} [options.bold= false] - whether or not the text is bold
 * @param {boolean} [options.italic= false] - whether or not the text is italic
 * @param {string} [options.alignHoriz = 'left'] - horizontal alignment
 * @param {string} [options.alignVert = 'center'] - vertical alignment
 * @param {boolean} options.wrapWidth - whether or not to wrap the text horizontally
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip the text horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip the text vertically
 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo vertical alignment, and orientation are currently NOT implemented
 */
export class TextStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({name, win, text, font, pos, color, opacity, depth, contrast, units, ori, height, bold, italic, alignHoriz, alignVert, wrapWidth, flipHoriz, flipVert, clipMask, autoDraw, autoLog} = {})
	{
		super({name, win, units, ori, opacity, depth, pos, clipMask, autoDraw, autoLog});

		// callback to deal with text metrics invalidation:
		const onChange = (withPixi = false, withBoundingBox = false, withMetrics = false) =>
		{
			const visualOnChange = this._onChange(withPixi, withBoundingBox);
			return () =>
			{
				visualOnChange();
				if (withMetrics)
				{
					this._textMetrics = undefined;
				}
			};
		};

		// text and font:
		this._addAttribute(
			'text',
			text,
			'Hello World',
			onChange(true, true, true)
		);
		this._addAttribute(
			'alignHoriz',
			alignHoriz,
			'center',
			onChange(true, true, true)
		);
		this._addAttribute(
			'alignVert',
			alignVert,
			'center',
			onChange(true, true, true)
		);
		this._addAttribute(
			'flipHoriz',
			flipHoriz,
			false,
			onChange(true, true, true)
		);
		this._addAttribute(
			'flipVert',
			flipVert,
			false,
			onChange(true, true, true)
		);
		this._addAttribute(
			'font',
			font,
			'Arial',
			this._onChange(true, true)
		);
		this._addAttribute(
			'height',
			height,
			this._getDefaultLetterHeight(),
			onChange(true, true, true)
		);
		this._addAttribute(
			'wrapWidth',
			wrapWidth,
			this._getDefaultWrapWidth(),
			onChange(true, true, true)
		);
		this._addAttribute(
			'bold',
			bold,
			false,
			onChange(true, true, true)
		);
		this._addAttribute(
			'italic',
			italic,
			false,
			onChange(true, true, true)
		);

		// color:
		this._addAttribute(
			'color',
			color,
			'white',
			this._onChange(true, false)
		);
		this._addAttribute(
			'contrast',
			contrast,
			1.0,
			this._onChange(true, false)
		);


		// estimate the bounding box (using TextMetrics):
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}



	/**
	 * Get the metrics estimated for the text and style.
	 *
	 * Note: getTextMetrics does not require the PIXI representation of the stimulus to be instantiated,
	 * unlike getSize().
	 *
	 * @name module:visual.TextStim#getTextMetrics
	 * @public
	 */
	getTextMetrics()
	{
		if (typeof this._textMetrics === 'undefined')
		{
			this._textMetrics = PIXI.TextMetrics.measureText(this._text, this._getTextStyle());
		}

		return this._textMetrics;
	}



	/**
	 * Get the default letter height given the stimulus' units.
	 *
	 * @name module:visual.TextStim#_getDefaultLetterHeight
	 * @return {number} - the letter height corresponding to this stimulus' units.
	 * @protected
	 */
	_getDefaultLetterHeight()
	{
		const height = TextStim._defaultLetterHeightMap.get(this._units);

		if (typeof height === 'undefined')
		{
			throw {
				origin: 'TextStim._getDefaultLetterHeight',
				context: 'when getting the default height of TextStim: ' + this._name,
				error: 'no default letter height for unit: ' + this._units
			};
		}

		return height;
	}



	/**
	 * Get the default wrap width given the stimulus' units.
	 *
	 * @name module:visual.TextStim#_getDefaultWrapWidth
	 * @return {number} - the wrap width corresponding to this stimulus' units.
	 * @protected
	 */
	_getDefaultWrapWidth()
	{
		const wrapWidth = TextStim._defaultWrapWidthMap.get(this._units);

		if (typeof wrapWidth === 'undefined')
		{
			throw {
				origin: 'TextStim._getDefaultWrapWidth',
				context: 'when getting the default wrap width of TextStim: ' + this._name,
				error: 'no default wrap width for unit: ' + this._units
			};
		}

		return wrapWidth;
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.TextStim#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// size of the text, irrespective of the orientation:
		const textMetrics = this.getTextMetrics();
		const textSize =  util.to_unit(
			[textMetrics.width, textMetrics.height],
			'pix',
			this._win,
			this._units
		);

		// take the alignment into account:
		const anchor = this._getAnchor();
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * textSize[0],
			this._pos[1] - anchor[1] * textSize[1],
			textSize[0],
			textSize[1]
		);

		// TODO take the orientation into account
	}



	/**
	 * Get the PIXI Text Style applied to the PIXI.Text
	 *
	 * @name module:visual.TextStim#_getTextStyle
	 * @private
	 */
	_getTextStyle()
	{
		return new PIXI.TextStyle({
			fontFamily: this._font,
			fontSize: Math.round(this._getLengthPix(this._height)),
			fontWeight: (this._bold) ? 'bold' : 'normal',
			fontStyle: (this._italic) ? 'italic' : 'normal',
			fill: this.getContrastedColor(new Color(this._color), this._contrast).hex,
			align: this._alignHoriz,
			wordWrap: (typeof this._wrapWidth !== 'undefined'),
			wordWrapWidth: (typeof this._wrapWidth !== 'undefined') ? this._getHorLengthPix(this._wrapWidth) : 0
		});
	}



	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.TextStim#_updateIfNeeded
	 * @function
	 * @private
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
			this._pixi = new PIXI.Text(this._text, this._getTextStyle());
		}

		const anchor = this._getAnchor();
		[this._pixi.anchor.x, this._pixi.anchor.y] = anchor;

		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;

		this._pixi.rotation = this._ori * Math.PI / 180;
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;
		this._pixi.zIndex = this._depth;

		// apply the clip mask:
		this._pixi.mask = this._clipMask;

		// update the size attributes:
		this._size = [
			this._getLengthUnits(Math.abs(this._pixi.width)),
			this._getLengthUnits(Math.abs(this._pixi.height))
		];

		// refine the estimate of the bounding box:
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * this._size[0],
			this._pos[1] - anchor[1] * this._size[1],
			this._size[0],
			this._size[1]
		);
	}


	
	/**
	 * Convert the alignment attributes into an anchor.
	 *
	 * @name module:visual.TextStim#_getAnchor
	 * @function
	 * @private
	 * @return {number[]} - the anchor
	 */
	_getAnchor()
	{
		let anchor = [];

		switch (this._alignHoriz)
		{
			case 'left':
				anchor.push(0);
				break;
			case 'right':
				anchor.push(1);
				break;
			default:
			case 'center':
				anchor.push(0.5);
		}
		switch (this._alignVert)
		{
			case 'top':
				anchor.push(0);
				break;
			case 'bottom':
				anchor.push(1);
				break;
			default:
			case 'center':
				anchor.push(0.5);
		}

		return anchor;
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
