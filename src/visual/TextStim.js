/**
 * Text Stimulus.
 *
 * @author Alain Pitiot
 * @version 2021.2.0
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2021 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import { to_pixiPoint } from "../util/Pixi.js";
import * as util from "../util/Util.js";
import { VisualStim } from "./VisualStim.js";

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
 * @param {string} [options.alignHoriz = 'center'] - horizontal alignment
 * @param {string} [options.alignVert = 'center'] - vertical alignment
 * @param {boolean} options.wrapWidth - whether or not to wrap the text horizontally
 * @param {boolean} [options.flipHoriz= false] - whether or not to flip the text horizontally
 * @param {boolean} [options.flipVert= false] - whether or not to flip the text vertically
 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 * @param {boolean} isInstruction
 * @param {number} padding [options.padding = 0] - Multiplier (ie multiplied by `height`) to get px padding of stim, used for expansive fonts
 * @param {string} characterSet
 * @param {number} letterSpacing - letter spacing aka letter tracking
 * 
 *
 * @todo vertical alignment, and orientation are currently NOT implemented
 */
export class TextStim extends util.mix(VisualStim).with(ColorMixin)
{
	constructor(
		{
			name,
			win,
			text,
			font,
			pos,
			color,
			opacity,
			depth,
			contrast,
			units,
			ori,
			height,
			bold,
			italic,
			alignHoriz,
			alignVert,
			wrapWidth,
			flipHoriz,
			flipVert,
			clipMask,
			autoDraw,
			autoLog,
			isInstruction = false,
			padding = 0,
			characterSet = "|ÉqÅ",
			letterSpacing,
			medialShape,
		} = {},
	)
	{
		super({ name, win, units, ori, opacity, depth, pos, clipMask, autoDraw, autoLog });
		
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

		// Instruction text
		this._isInstruction = isInstruction || false

		this._addAttribute(
			"characterSet",
			characterSet,
			"|ÉqÅ",
			onChange(true, true, true),
		);
		// text and font:
		this._addAttribute(
			"text",
			text,
			"Hello World",
			onChange(true, true, true),
		);
		this._addAttribute(
			"alignHoriz",
			alignHoriz,
			"center",
			onChange(true, true, true),
		);
		this._addAttribute(
			"alignVert",
			alignVert,
			"center",
			onChange(true, true, true),
		);
		this._addAttribute(
			"flipHoriz",
			flipHoriz,
			false,
			onChange(true, true, true),
		);
		this._addAttribute(
			"flipVert",
			flipVert,
			false,
			onChange(true, true, true),
		);
		this._addAttribute(
			"font",
			font,
			"Arial",
			this._onChange(true, true),
		);
		this._addAttribute(
			"letterSpacing",
			letterSpacing, 
			0, 
			onChange(true, true, true));	 
		this._addAttribute(
			"height",
			height,
			this._getDefaultLetterHeight(),
			onChange(true, true, true),
		);
		this._addAttribute(
			"padding",
			 padding, 
			 0, 
			 onChange(true, true, true));
		this._addAttribute(
			"wrapWidth",
			wrapWidth,
			this._getDefaultWrapWidth(),
			onChange(true, true, true),
		);
		this._addAttribute(
			"bold",
			bold,
			false,
			onChange(true, true, true),
		);
		this._addAttribute(
			"italic",
			italic,
			false,
			onChange(true, true, true),
		);
		this._addAttribute(
			"color",
			color,
			"white"
			// this._onChange(true, false)
		);
		this._addAttribute(
			"contrast",
			contrast,
			1.0,
			this._onChange(true, false, false),
		);
    this._addAttribute(
      "medialShape", 
      medialShape, 
      false, 
      this._onChange(true, true, true)
    ); 
    

		// estimate the bounding box (using TextMetrics):
		// this._estimateBoundingBox();

    // this.fontRenderMaxScalar = 1;
    
		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
		//const text_style = this._getTextStyle(true, false);
		//PIXI.BitmapFont.from(this._font, text_style);
	}

	/**
	 * Get the metrics estimated for the text and style.
	 *
	 * Note: getTextMetrics does not require the PIXI representation of the stimulus
	 * to be instantiated, unlike getSize().
	 *
	 * @name module:visual.TextStim#getTextMetrics
	 * @public
	 */
	getTextMetrics(baseline="alphabetic", textAlign="left")
	{
		if (typeof this._textMetrics === "undefined")
		{
			PIXI.TextMetrics.BASELINE_MULTIPLIER = 8;// 8 // 1.4
			PIXI.TextMetrics.HEIGHT_MULTIPLIER = 12; // 12 // 2 
			// PIXI.TextMetrics.BASELINE_SYMBOL = 'M';
			PIXI.TextMetrics.METRICS_STRING = this._characterSet;
      		this._textMetrics = PIXI.TextMetrics.measureText(this.getText(), this._getTextStyle());
			try {
				this._textMetrics = PIXI.TextMetrics.measureText(this.getText(), this._getTextStyle(false));
				this._textMetrics.frmpLimitedTextMetrics = false;
			} catch (e) {
				this._textMetrics = PIXI.TextMetrics.measureText(this.getText(), this._getTextStyle());
				// Using an approximated textMetrics, ie scaled down by this.fontRenderMaxScalar
				this._textMetrics.frmpLimitedTextMetrics = true;
			}
			
			// since PIXI.TextMetrics does not give us the actual bounding box of the text
			// (e.g. the height is really just the ascent + descent of the font), we use measureText:
			const textMetricsCanvas = document.createElement('canvas');
			document.body.appendChild(textMetricsCanvas);

			const ctx = textMetricsCanvas.getContext("2d");
			ctx.font = this._getTextStyle().toFontString();
			ctx.textBaseline = baseline;
			ctx.textAlign = textAlign;
			// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/letterSpacing
			ctx.letterSpacing = `${this._letterSpacing}px`;
			this._textMetrics.boundingBox = ctx.measureText(this.getText());
			try {
				ctx.font = this._getTextStyle(false).toFontString();
				this._textMetrics.boundingBox = ctx.measureText(this.getText());
				// frmp = fontRenderMaxPx
				this._textMetrics.frmpLimitedBoundingBox = false;
			} catch (e) {
				ctx.font = this._getTextStyle().toFontString();
				this._textMetrics.boundingBox = ctx.measureText(this.getText());
				this._textMetrics.frmpLimitedBoundingBox = true;
			}

			document.body.removeChild(textMetricsCanvas);
		}

		return this._textMetrics;
	}

	/**
	 * Get the default letter height given the stimulus' units.
	 *
	 * @name module:visual.TextStim#_getDefaultLetterHeight
	 * @protected
	 * @return {number} - the letter height corresponding to this stimulus' units.
	 */
	_getDefaultLetterHeight()
	{
		const height = TextStim._defaultLetterHeightMap.get(this._units);

		if (typeof height === "undefined")
		{
			throw {
				origin: "TextStim._getDefaultLetterHeight",
				context: "when getting the default height of TextStim: " + this._name,
				error: "no default letter height for unit: " + this._units,
			};
		}

		return height;
	}

	/**
	 * Get the default wrap width given the stimulus' units.
	 *
	 * @name module:visual.TextStim#_getDefaultWrapWidth
	 * @protected
	 * @return {number} - the wrap width corresponding to this stimulus' units.
	 */
	_getDefaultWrapWidth()
	{
		const wrapWidth = TextStim._defaultWrapWidthMap.get(this._units);

		if (typeof wrapWidth === "undefined")
		{
			throw {
				origin: "TextStim._getDefaultWrapWidth",
				context: "when getting the default wrap width of TextStim: " + this._name,
				error: "no default wrap width for unit: " + this._units,
			};
		}

		return wrapWidth;
	}

	/**
	 * Get the bounding box.
	 *
	 * @name module:visual.TextStim#getBoundingBox
	 * @public
	 * @param {boolean} [tight= false] - whether or not to fit as closely as possible to the text
	 * @return {number[]} - the bounding box, in the units of this TextStim
	 */
	getBoundingBox(tight = false)
	{
		if (tight)
		{
      this._updateIfNeeded();
			const textMetrics_px = this.getTextMetrics();
      // const boundingBoxLeft = textMetrics_px.frmpLimitedBoundingBox ? 
        // textMetrics_px.boundingBox.actualBoundingBoxLeft*this.fontRenderMaxScalar : 
		const boundingBoxLeft = textMetrics_px.boundingBox.actualBoundingBoxLeft;
      // const fontPropertiesDescent = textMetrics_px.frmpLimitedTextMetrics ? 
       // textMetrics_px.fontProperties.descent * this.fontRenderMaxScalar :
       const fontPropertiesDescent = textMetrics_px.fontProperties.descent;
      //const boundingBoxDescent = textMetrics_px.frmpLimitedBoundingBox ?
        // textMetrics_px.boundingBox.actualBoundingBoxDescent * this.fontRenderMaxScalar :
        const boundingBoxDescent = textMetrics_px.boundingBox.actualBoundingBoxDescent;
      //const boundingBoxRight = textMetrics_px.frmpLimitedBoundingBox ?
        //textMetrics_px.boundingBox.actualBoundingBoxRight * this.fontRenderMaxScalar :
		const boundingBoxRight = textMetrics_px.boundingBox.actualBoundingBoxRight;
      // const boundingBoxAscent = textMetrics_px.frmpLimitedBoundingBox ?
        // textMetrics_px.boundingBox.actualBoundingBoxAscent * this.fontRenderMaxScalar :
        const boundingBoxAscent = textMetrics_px.boundingBox.actualBoundingBoxAscent
			let left_px = this._pos[0] - boundingBoxLeft;
			let top_px = this._pos[1] + fontPropertiesDescent - boundingBoxDescent;
			const width_px = boundingBoxRight + boundingBoxLeft;
			const height_px = boundingBoxAscent + boundingBoxDescent;

			// adjust the bounding box position by taking into account the anchoring of the text:
			const boundingBox_px = this._getBoundingBox_px();
			switch (this._alignHoriz)
			{
				case "left":
					// nothing to do
					break;
				case "right":
					// TODO
					break;
				default:
				case "center":
					left_px -= (boundingBox_px.width - width_px) / 2;
			}
			switch (this._alignVert)
			{
				case "top":
					// TODO
					break;
				case "bottom":
					// nothing to do
					break;
				default:
				case "center":
					top_px -= (boundingBox_px.height - height_px) / 2;
			}

			// convert from pixel to this stimulus' units:
			const leftTop = util.to_unit(
				[left_px, top_px],
				"pix",
				this._win,
				this._units);
			const dimensions = util.to_unit(
				[width_px, height_px],
				"pix",
				this._win,
				this._units);

			return new PIXI.Rectangle(leftTop[0], leftTop[1], dimensions[0], dimensions[1]);
		}
		else
		{
			return this._boundingBox.clone();
		}
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.TextStim#_estimateBoundingBox
	 * @protected
	 * @override
	 */
	_estimateBoundingBox()
	{
		// size of the text, irrespective of the orientation:
		const textMetrics = this.getTextMetrics();
		const textSize = util.to_unit(
			[textMetrics.width, textMetrics.height],
			"pix",
			this._win,
			this._units,
		);

		// take the alignment into account:
		const anchor = this._getAnchor();
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * textSize[0],
			this._pos[1] - textSize[1] + anchor[1] * textSize[1],
			textSize[0],
			textSize[1],
		);

		// TODO take the orientation into account
	}

	/**
	 * Get the PIXI Text Style applied to the PIXI.Text
	 *
	 * @name module:visual.TextStim#_getTextStyle
	 * @protected
	 */
	_getTextStyle(downscale=false, useStringForFontSize=true) //adding new para since BitmapFont.from() requires fontSize to be a number instead of a string
	{
		let h = this._height;
		// if (this._psychoJS?.fontRenderMaxPx && h > this._psychoJS.fontRenderMaxPx) {
		//   this.fontRenderMaxScalar = Math.ceil(h / this._psychoJS.fontRenderMaxPx)
		// }
		// if (downscale) h = h/this.fontRenderMaxScalar;
		let fontSize = Math.round(this._getLengthPix(h)); 
		if (useStringForFontSize) { // BitmapFont.from() requires fontSize to be a number instead of a string
			if (this._isInstruction) {
				fontSize = fontSize + "pt";
			} else {
				fontSize = fontSize + "px";
			}
		}
		return new PIXI.TextStyle({
			fontFamily: this._font,
			fontSize: fontSize,
			fontWeight: (this._bold) ? "bold" : "normal",
			fontStyle: (this._italic) ? "italic" : "normal",
			fill: this.getContrastedColor(new Color(this._color), this._contrast).hex,
			align: this._alignHoriz,
			wordWrap: (typeof this._wrapWidth !== "undefined"),
			wordWrapWidth: (typeof this._wrapWidth !== "undefined") ? this._getHorLengthPix(this._wrapWidth) : 0,
			breakWords: this._isInstruction,
			padding: this._padding * h || 0,
			letterSpacing: this._letterSpacing,
		});
	}

	/**
	 * Setter for the color attribute.
	 *
	 * @name module:visual.TextStim#setColor
	 * @public
	 * @param {undefined | null | number} color - the color
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setColor(color, log = false)
	{
		const hasChanged = this._setAttribute("color", color, log);

		if (hasChanged)
		{
			if (typeof this._pixi !== "undefined")
			{
				this._pixi.style = this._getTextStyle();
				this._needUpdate = true;
			}
		}
	}

	/**
	 * Keeping with the convention defined in the EE glossary, `padding` is
	 * a scalar, that will be multiplied by height when applied (ie in this.getTextStyle).
	 * Previously it was necessary to write out this function, now it's redundant (ie it
	 * just does the default behavior)
	 * @param {Number} padding 
	 * @param {Boolean} log 
	 */
	// setPadding(padding, log = false)
	// {
	// 	const hasChanged = this._setAttribute("padding", padding, log);

	// 	if (hasChanged)
	// 	{
	// 		if (typeof this._pixi !== "undefined")
	// 		{
	// 			this._pixi.style = this._getTextStyle();
	// 			this._needUpdate = true;
	// 		}
	// 	}
	// }

	/**
	 * Setter for the letterSpacing attribute 
	 * Not currently in use, but maintaining this method for possible future use.
	 *
	 * @name module:visual.TextStim#setLetterSpacing
	 * @public
	 * @param {undefined | number} spacing - letter spacing in pixels
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setLetterSpacing(spacing = 0, log = false)
	{
		// Must use _setAttribute method when updating an attribute to trigger onChange() and update the stim
		const hasChanged = this._setAttribute("letterSpacing", spacing, log);

		if (hasChanged)
		{
			if (typeof this._pixi !== "undefined")
			{
				this._pixi.style = this._getTextStyle();
				this._needUpdate = true;
			}
		}
	}

	/**
	 * Setter for the letterSpacing attribute used for letterTracking
	 *
	 * @name module:visual.TextStim#setLetterSpacingByProportion
	 * @public
	 * @param {undefined | number} spacing - letter spacing where the value changes the spacing in
	 * proportion of the font size, that is, 0.5 will create letter spacing of about half of the 
	 * font size.
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setLetterSpacingByProportion(spacing = 0, log = false)
	{
		let prop_spacing = spacing * this.height;
		this.setLetterSpacing(prop_spacing, log);
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.TextStim#_updateIfNeeded
	 * @protected
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

			if (typeof this._pixi !== "undefined")
			{
		     this._pixi.destroy(true);
			}
      if (this.getHeight() > this._psychoJS.fontRenderMaxPx) {
		this._pixi = new PIXI.Text(this._text, this._getTextStyle());
		// changing pixi.text to pixi.bitmapText
		// this._pixi = new PIXI.BitmapText(this.getText(), {
		// 	fontName: this._font,
		// 	// fontSize: text_style.fontSize * this.fontRenderMaxScalar,
		//   });

		//  this.pixi.scale.x = this.pixi.scale.x * this.fontRenderMaxScalar;
		//  this.pixi.scale.y = this.pixi.scale.y * this.fontRenderMaxScalar;
      } else {
    		this._pixi = new PIXI.Text(this.getText(), this._getTextStyle());
      }
			// this._pixi.updateText();
		}

		const anchor = this._getAnchor();
		[this._pixi.anchor.x, this._pixi.anchor.y] = anchor;

		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;

		this._pixi.rotation = -this._ori * Math.PI / 180;
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;
		this._pixi.zIndex = this._depth;

		// apply the clip mask:
		this._pixi.mask = this._clipMask;

		// update the size attribute:
		this._size = util.to_unit(
			[Math.abs(this._pixi.width), Math.abs(this._pixi.height)],
			"pix",
			this._win,
			this._units
		);

		// refine the estimate of the bounding box:
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * this._size[0],
			this._pos[1] - this._size[1] + anchor[1] * this._size[1],
			this._size[0],
			this._size[1],
		);
	}

	/**
	 * Convert the alignment attributes into an anchor.
	 *
	 * @name module:visual.TextStim#_getAnchor
	 * @protected
	 * @return {number[]} - the anchor
	 */
	_getAnchor()
	{
		let anchor = [];

		switch (this._alignHoriz)
		{
			case "left":
				anchor.push(0);
				break;
			case "right":
				anchor.push(1);
				break;
			default:
			case "center":
				anchor.push(0.5);
		}
		switch (this._alignVert)
		{
			case "top":
				anchor.push(0);
				break;
			case "bottom":
				anchor.push(1);
				break;
			default:
			case "center":
				anchor.push(0.5);
		}

		return anchor;
	}

  scaleToHeightPx(h, characterSetHeight) {
    this.setHeight(h*characterSetHeight);
	}

	scaleToWidthPx(h, w)
	{
		this.setHeight(h);
		const measured = this.getBoundingBox(true).width;
		const s = h / measured;
		this.setHeight(s * w);

		/* Alg of same name, by Gus. I belive they both work.
			scaleToWidthPx(w)
			{
				const bb = this.getBoundingBox(true)
				const hToW = bb.height / bb.width
				const nominalHeight = hToW * w
				this.scaleToHeightPx(nominalHeight)
			}
		*/
	}
	getText(){
    if (!this._medialShape) return this._text;
    // NOTE joining this._text only between '\u200d' only shapes to connect form
    //      on a single side, if alignHoriz !== "left". Adding \u200F 
    //      (right-to-left mark) is required
    //      (in this context, but not in HTML text, afaik) to correctly get medial
    //      form. See https://bugzilla.mozilla.org/show_bug.cgi?id=1108179
    const medialText = this._alignHoriz !== "left" ? 
      `\u200F\u200d${this._text}\u200d\u200F`:
      `\u200d${this._text}\u200d`; 
    return medialText;
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
	["cm", 1.0],
	["deg", 1.0],
	["degs", 1.0],
	["degFlatPos", 1.0],
	["degFlat", 1.0],
	["norm", 0.1],
	["height", 0.2],
	["pix", 20],
	["pixels", 20],
]);

/**
 * <p>This map associates units to default wrap width.</p>
 *
 * @name module:visual.TextStim#_defaultLetterHeightMap
 * @readonly
 * @private
 */
TextStim._defaultWrapWidthMap = new Map([
	["cm", 15.0],
	["deg", 15.0],
	["degs", 15.0],
	["degFlatPos", 15.0],
	["degFlat", 15.0],
	["norm", 1],
	["height", 1],
	["pix", 500],
	["pixels", 500],
]);
