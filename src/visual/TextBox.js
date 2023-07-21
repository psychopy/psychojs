/**
 * Editable TextBox Stimulus.
 *
 * @author Alain Pitiot, Nikita Agafonov
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { Color } from "../util/Color.js";
import { ColorMixin } from "../util/ColorMixin.js";
import * as util from "../util/Util.js";
import { ButtonStim } from "./ButtonStim.js";
import { TextInput } from "./TextInput.js";
import { VisualStim } from "./VisualStim.js";

/**
 * @extends VisualStim
 * @mixes ColorMixin
 */
export class TextBox extends util.mix(VisualStim).with(ColorMixin)
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {string} [options.text=""] - the text to be rendered
	 * @param {string} [options.font= "Arial"] - the font family
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
	 *
	 * @param {Color} [options.color= Color('white')] color of the text
	 * @param {number} [options.opacity= 1.0] - the opacity
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {number} [options.contrast= 1.0] - the contrast
	 * @param {string} [options.units= "norm"] - the units of the text size and position
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.letterHeight= <default value>] - the height of the text
	 * @param {boolean} [options.bold= false] - whether or not the text is bold
	 * @param {boolean} [options.italic= false] - whether or not the text is italic
	 * @param {string} [options.anchor = "center"] - sets the origin point of the stim
	 *
	 * @param {boolean} [options.multiline= false] - whether or not a multiline element is used
	 * @param {boolean} [options.autofocus= true] - whether or not the first input should receive focus by default
	 * @param {boolean} [options.flipHoriz= false] - whether or not to flip the text horizontally
	 * @param {boolean} [options.flipVert= false] - whether or not to flip the text vertically
	 * @param {Color} [options.fillColor= undefined] - fill color of the text-box
	 * @param {String} [options.languageStyle= "LTR"] - sets the direction property of the text inputs. Possible values ["LTR", "RTL", "Arabic"]. "Arabic" is added for consistency with PsychoPy
	 * @param {Color} [options.borderColor= undefined] - border color of the text-box
	 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 * @param {boolean} [options.fitToContent = false] - whether or not to resize itself automaitcally to fit to the text content
	 */
	constructor(
		{
			name,
			win,
			pos,
			anchor,
			size,
			units,
			ori,
			opacity,
			depth,
			text,
			placeholder,
			font,
			letterHeight,
			bold,
			italic,
			alignment,
			color,
			contrast,
			flipHoriz,
			flipVert,
			fillColor,
			languageStyle,
			borderColor,
			borderWidth,
			padding,
			editable,
			multiline,
			autofocus,
			clipMask,
			autoDraw,
			autoLog,
			fitToContent,
			boxFn
		} = {},
	)
	{
		super({ name, win, pos, anchor, size, units, ori, opacity, depth, clipMask, autoDraw, autoLog });

		this._addAttribute(
			"text",
			text,
			""
		);
		this._addAttribute(
			"placeholder",
			placeholder,
			"",
			this._onChange(true, true),
		);
		this._addAttribute(
			"flipHoriz",
			flipHoriz,
			false,
			this._onChange(false, false),
		);
		this._addAttribute(
			"flipVert",
			flipVert,
			false,
			this._onChange(false, false),
		);

		// font:
		this._addAttribute(
			"font",
			font,
			"Arial"
		);
		this._addAttribute(
			"letterHeight",
			letterHeight,
			this._getDefaultLetterHeight()
		);
		this._addAttribute(
			"bold",
			bold,
			false,
			this._onChange(true, true),
		);
		this._addAttribute(
			"italic",
			italic,
			false,
			this._onChange(true, true),
		);
		this._addAttribute(
			"alignment",
			alignment,
			"center"
		);
		this._addAttribute(
			"languageStyle",
			languageStyle,
			"LTR"
		);

		// colors:
		this._addAttribute(
			"color",
			color,
			undefined
		);
		this._addAttribute(
			"fillColor",
			fillColor,
			undefined
		);
		this._addAttribute(
			"borderColor",
			borderColor,
			undefined
		);
		this._addAttribute(
			"contrast",
			contrast,
			1.0,
			this._onChange(true, false),
		);

		// default border width: 1px
		this._addAttribute(
			"borderWidth",
			borderWidth,
			util.to_unit([1, 0], "pix", win, this._units)[0],
			this._onChange(true, true),
		);
		// default padding: half of the letter height
		this._addAttribute(
			"padding",
			padding,
			this._letterHeight / 2.0,
			this._onChange(true, true),
		);

		this._addAttribute("multiline", multiline, false, this._onChange(true, true));
		this._addAttribute("editable", editable, false, this._onChange(true, true));
		this._addAttribute("autofocus", autofocus, true, this._onChange(true, false));
		// this._setAttribute({
		// 	name: 'vertices',
		// 	value: vertices,
		// 	assert: v => (v != null) && (typeof v !== 'undefined') && Array.isArray(v) )
		// 	log);

		this._addAttribute("fitToContent", fitToContent, false);
		// setting size again since fitToContent field becomes available only at this point
		// and setSize called from super class would not have a proper effect
		this.setSize(size);

		this._addAttribute("boxFn", boxFn, null);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${util.toString(this)}`);
		}
	}

	/**
	 * Clears the current text value or sets it back to match the placeholder.
	 */
	reset()
	{
		this.setText(this.placeholder);
	}

	/**
	 * Clears the current text value.
	 */
	clear()
	{
		this.setText();
	}

	/**
	 * Setter for the alignment attribute.
	 *
	 * @param {boolean} alignment - alignment of the text
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setAlignment(alignment = "center", log = false)
	{
		this._setAttribute("alignment", alignment, log);
		if (this._pixi !== undefined) {
			let alignmentStyles = TextBox._alignmentToFlexboxMap.get(alignment);
			if (!alignmentStyles) {
				alignmentStyles = ["center", "center"];
			}
			this._pixi.setInputStyle("justifyContent", alignmentStyles[0]);
			this._pixi.setInputStyle("textAlign", alignmentStyles[1]);
		}
	}

	/**
	 * Setter for the languageStyle attribute.
	 *
	 * @param {String} languageStyle - text direction in textbox, accepts values ["LTR", "RTL", "Arabic"]
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setLanguageStyle (languageStyle = "LTR", log = false) {
		this._setAttribute("languageStyle", languageStyle, log);
		let langDir = util.TEXT_DIRECTION[languageStyle];
		if (langDir === undefined)
		{
			langDir = util.TEXT_DIRECTION["LTR"];
		}
		if (this._pixi !== undefined)
		{
			this._pixi.setInputStyle("direction", langDir);
		}
	}

	/**
	 * For tweaking the underlying input value.
	 *
	 * @param {string} text
	 */
	setText(text = "")
	{
		if (typeof this._pixi !== "undefined")
		{
			this._pixi.text = text;
		}

		this._text = text;
	}

	/**
	 * Set the font for textbox.
	 *
	 * @param {string} font - the font family
	 * @param {boolean} [log = false] - whether to log
	 */
	setFont(font = "Arial", log = false)
	{
		this._setAttribute("font", font, log);
		if (this._pixi !== undefined)
		{
			this._pixi.setInputStyle("fontFamily", font);
		}
	}

	/**
	 * Set letterHeight (font size) for textbox.
	 *
	 * @param {string} [fontSize = <default value>] - the size of the font
	 * @param {boolean} [log = false] - whether to log
	 */
	setLetterHeight(fontSize = this._getDefaultLetterHeight(), log = false)
	{
		this._setAttribute("letterHeight", fontSize, log);
		const fontSize_px = this._getLengthPix(fontSize);
		if (this._pixi !== undefined)
		{
			this._pixi.setInputStyle("fontSize", `${fontSize_px}px`);
		}
	}

	/**
	 * For accessing the underlying input value.
	 *
	 * @return {string} - the current text value of the underlying input element.
	 */
	getText()
	{
		if (typeof this._pixi !== "undefined")
		{
			return this._pixi.text;
		}

		return this._text;
	}

	/**
	 * Setter for the color attribute.
	 *
	 * @param {boolean} color - color of the text
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setColor (color, log = false)
	{
		this._setAttribute('color', color, log);
		this._needUpdate = true;
		this._needPixiUpdate = true;
	}

	/**
	 * Setter for the fillColor attribute.
	 *
	 * @param {boolean} fillColor - fill color of the text box
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setFillColor (fillColor, log = false)
	{
		this._setAttribute('fillColor', fillColor, log);
		this._needUpdate = true;
		this._needPixiUpdate = true;
	}

	/**
	 * Setter for the borderColor attribute.
	 *
	 * @param {Color} borderColor - border color of the text box
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setBorderColor (borderColor, log = false)
	{
		this._setAttribute('borderColor', borderColor, log);
		this._needUpdate = true;
		this._needPixiUpdate = true;
	}

	/**
	 * Setter for the fitToContent attribute.
	 *
	 * @param {boolean} fitToContent - whether or not to autoresize textbox to fit to text content
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setFitToContent (fitToContent, log = false)
	{
		this._setAttribute("fitToContent", fitToContent, log);
		const width_px = Math.abs(Math.round(this._getLengthPix(this._size[0])));
		const height_px = Math.abs(Math.round(this._getLengthPix(this._size[1])));
		if (this._pixi !== undefined) {
			this._pixi.setInputStyle("width", fitToContent ? "auto" : `${width_px}px`);
			this._pixi.setInputStyle("height", fitToContent ? "auto" : `${height_px}px`);
		}
	}

	/**
	 * Setter for the size attribute.
	 *
	 * @param {boolean} size - whether or not to wrap the text at the given width
	 * @param {boolean} [log= false] - whether or not to log
	 */
	setSize(size, log)
	{
		// test with the size is undefined, or [undefined, undefined]:
		let isSizeUndefined = (
			(typeof size === "undefined") || (size === null)
			|| (Array.isArray(size) && size.every((v) => typeof v === "undefined" || v === null))
		);

		this.fitToContent = isSizeUndefined;

		if (isSizeUndefined)
		{
			size = TextBox._defaultSizeMap.get(this._units);

			if (typeof size === "undefined")
			{
				throw {
					origin: "TextBox.setSize",
					context: "when setting the size of TextBox: " + this._name,
					error: "no default size for unit: " + this._units,
				};
			}
		}

		const hasChanged = this._setAttribute("size", size, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needPixiUpdate = true;

			// immediately estimate the bounding box:
			this._estimateBoundingBox();
		}
	}

	/**
	 * Add event listeners to text-box object. Method is called internally upon object construction.
	 *
	 * @protected
	 */
	_addEventListeners ()
	{
		this._pixi.on("input", (textContent) => {
			this._text = textContent;
			if (this._fitToContent)
			{
				// make sure that size attribute is updated when fitToContent = true
				const size = util.to_unit([this._pixi.width, this._pixi.height], "pix", this._win, this._units);
				this._setAttribute("size", size, false);
			}
		});
	}

	/**
	 * Get the default letter height given the stimulus' units.
	 *
	 * @return {number} - the letter height corresponding to this stimulus' units.
	 * @protected
	 */
	_getDefaultLetterHeight()
	{
		const height = TextBox._defaultLetterHeightMap.get(this._units);

		if (typeof height === "undefined")
		{
			throw {
				origin: "TextBox._getDefaultLetterHeight",
				context: "when getting the default height of TextBox: " + this._name,
				error: "no default letter height for unit: " + this._units,
			};
		}

		return height;
	}

	/**
	 * Get the TextInput options applied to the PIXI.TextInput.
	 *
	 * @protected
	 */
	_getTextInputOptions()
	{
		const letterHeight_px = Math.round(this._getLengthPix(this._letterHeight));
		const padding_px = Math.round(this._getLengthPix(this._padding));
		const borderWidth_px = Math.round(this._getLengthPix(this._borderWidth));
		const width_px = Math.abs(Math.round(this._getLengthPix(this._size[0])));
		const height_px = Math.abs(Math.round(this._getLengthPix(this._size[1])));
		let alignmentStyles = TextBox._alignmentToFlexboxMap.get(this._alignment);
		if (!alignmentStyles) {
			alignmentStyles = ["center", "center"];
		}

		let box;
		if (this._boxFn !== null)
		{
			box = this._boxFn;
		}
		else
		{
			// note: box style properties eventually become PIXI.Graphics settings, so same syntax applies
			box = {
				fill: new Color(this._fillColor).int,
				alpha: this._fillColor === undefined || this._fillColor === null ? 0 : 1,
				rounded: 5,
				stroke: {
					color: new Color(this._borderColor).int,
					width: borderWidth_px,
					alpha: this._borderColor === undefined || this._borderColor === null ? 0 : 1
				}
			};
		}

		return {
			// input style properties eventually become CSS, so same syntax applies
			input: {
				display: "flex",
				flexDirection: "column",
				fontFamily: this._font,
				fontSize: `${letterHeight_px}px`,
				color: this._color === undefined || this._color === null ? 'transparent' : new Color(this._color).hex,
				fontWeight: (this._bold) ? "bold" : "normal",
				fontStyle: (this._italic) ? "italic" : "normal",
				direction: util.TEXT_DIRECTION[this._languageStyle],
				justifyContent: alignmentStyles[0],
				textAlign: alignmentStyles[1],
				padding: `${padding_px}px`,
				multiline: this._multiline,
				text: this._text,
				height: this._fitToContent ? "auto" : (this._multiline ? `${height_px}px` : undefined),
				width: this._fitToContent ? "auto" : `${width_px}px`,
				maxWidth: `${this.win.size[0]}px`,
				maxHeight: `${this.win.size[1]}px`,
				overflow: "hidden",
				pointerEvents: "none"
			},
			box
		};
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// estimate the vertical size:
		const boxHeight = this._letterHeight + 2 * this._padding + 2 * this._borderWidth;

		// take the alignment into account:
		const anchor = this._anchorTextToNum(this._anchor);
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * this._size[0],
			this._pos[1] - anchor[1] * boxHeight,
			this._size[0],
			boxHeight,
		);

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
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

			let enteredText = "";
			// at this point this._pixi might exist but is removed from the scene, in such cases this._pixi.text
			// does not retain the information about new lines etc. so we go with a local copy of entered text
			if (this._pixi !== undefined && this._pixi.parent !== null) {
				enteredText = this._pixi.text;
			} else {
				enteredText = this._text;
			}

			if (typeof this._pixi !== "undefined")
			{
				this._pixi.destroy(true);
			}

			// Create new TextInput
			this._pixi = new TextInput(this._getTextInputOptions());

			// listeners required for regular textboxes, but may cause problems with button stimuli
			if (!(this instanceof ButtonStim))
			{
				this._pixi._addListeners();
				this._addEventListeners();
			}

			// check if other TextBox instances are already in focus
			const { _drawList = [] } = this.psychoJS.window;
			const otherTextBoxWithFocus = _drawList.some((item) => item instanceof TextBox && item._pixi && item._pixi._hasFocus());
			if (this._autofocus && !otherTextBoxWithFocus)
			{
				this._pixi._onSurrogateFocus();
			}
			if (this._multiline)
			{
				this._pixi._multiline = this._multiline;
			}
			if (this._editable)
			{
				this.text = enteredText;
				this._pixi.placeholder = this._placeholder;
			}
			else
			{
				this._pixi.text = this._text;
			}
		}

		this._pixi.disabled = !this._editable;

		// now when this._pixi is available, setting anchor again to trigger internal to this._pixi mechanisms
		this.anchor = this._anchor;
		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;
		this._pixi.rotation = -this._ori * Math.PI / 180;
		[this._pixi.x, this._pixi.y] = util.to_px(this._pos, this._units, this._win);

		this._pixi.alpha = this._opacity;
		this._pixi.zIndex = -this._depth;

		// apply the clip mask:
		this._pixi.mask = this._clipMask;
	}
}

TextBox._alignmentToFlexboxMap = new Map([
	["center", ["center", "center"]],
	["top-center", ["flex-start", "center"]],
	["bottom-center", ["flex-end", "center"]],
	["center-left", ["center", "left"]],
	["center-right", ["center", "right"]],
	["top-left", ["flex-start", "left"]],
	["top-right", ["flex-start", "right"]],
	["bottom-left", ["flex-end", "left"]],
	["bottom-right", ["flex-end", "right"]]
]);

/**
 * <p>This map associates units to default letter height.</p>
 *
 * @readonly
 * @protected
 */
TextBox._defaultLetterHeightMap = new Map([
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
 * <p>This map associates units to default sizes.</p>
 *
 * @readonly
 * @protected
 */
TextBox._defaultSizeMap = new Map([
	["cm", [15.0, -1]],
	["deg", [15.0, -1]],
	["degs", [15.0, -1]],
	["degFlatPos", [15.0, -1]],
	["degFlat", [15.0, -1]],
	["norm", [1, -1]],
	["height", [1, -1]],
	["pix", [500, -1]],
	["pixels", [500, -1]],
]);
