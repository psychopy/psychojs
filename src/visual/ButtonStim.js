/**
 * Button Stimulus.
 *
 * @author Alain Pitiot
 * @version 2022.2.3
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020-2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import { VisualStim } from "./VisualStim.js";
import { Mouse } from "../core/Mouse.js";
import * as PIXI from "pixi.js-legacy";
import * as util from "../util/Util";
import { Color } from "../util/Color.js";

/**
 * <p>ButtonStim visual stimulus.</p>
 *
 * @extends VisualStim
 */
export class ButtonStim extends VisualStim
{
	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {module:core.Window} options.win - the associated Window
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {string} [options.text=""] - the text to be rendered
	 * @param {string} [options.font= "Arial"] - the font family
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the text
	 * @param {string} [options.anchor= "center"] - horizontal alignment
	 * @param {string} [options.units= "norm"] - the units of the text size and position
	 * @param {Color} [options.color= Color("white")] the background color
	 * @param {Color} [options.fillColor= Color("darkgrey")] the fill color
	 * @param {Color} [options.borderColor= Color("white")] the border color
	 * @param {Color} [options.borderWidth= 0] the border width
	 * @param {number} [options.opacity= 1.0] - the opacity
 	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {number} [options.letterHeight= undefined] - the height of the text
	 * @param {boolean} [options.bold= true] - whether or not the text is bold
	 * @param {boolean} [options.italic= false] - whether or not the text is italic
	 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether or not to log
	 * @param {boolean} [options.draggable= false] - whether or not to make stim draggable with mouse/touch/other pointer device
	 */
	constructor(
		{
			win,
			name,
			text,
			font,
			pos,
			size,
			padding,
			anchor = "center",
			units,
			color = "white",
			fillColor = "darkgrey",
			borderColor,
			borderWidth = 0,
			opacity,
			depth,
			letterHeight,
			bold = true,
			italic,
			autoDraw,
			autoLog,
			draggable,
			boxFn,
			multiline
		} = {},
	)
	{
		super({
			win,
			name,
			text,
			pos,
			size,
			anchor,
			units,
			opacity,
			depth,
			autoDraw,
			autoLog,
			draggable,
			boxFn
		});

		this.psychoJS.logger.debug("create a new Button with name: ", name);
		this.listener = new Mouse({ name, win, autoLog });

		this._addAttribute("text", text, "");
		this._addAttribute("font", font, "Arial");
		this._addAttribute("letterHeight", letterHeight, 20);
		this._addAttribute("color", color, "white");
		this._addAttribute("fillColor", fillColor, "darkgrey");
		this._addAttribute("borderWidth", borderWidth, 1);
		this._addAttribute("borderColor", borderColor, "black");
		this._addAttribute("wasClicked", false, false);

		// Arrays to store times of clicks on and off
		this._addAttribute("timesOn", []);
		this._addAttribute("timesOff", []);
		this._addAttribute("numClicks", 0);

		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${util.toString(this)}`);
		}
	}

	/**
	 * How many times has this button been clicked on?
	 *
	 * @returns {number} the number of times the button has been clicked on
	 */
	get numClicks()
	{
		return this.timesOn.length;
	}

	/**
	 * Is this button currently being clicked on?
	 *
	 * @returns {boolean} whether or not the button is being clicked on
	 */
	get isClicked()
	{
		return this.listener.isPressedIn(this, [1, 0, 0]);
	}

	reset()
	{

	}

	_composeTextConfig()
	{
		const fontSize = Math.round(this._getLengthPix(this._letterHeight));
		const size_px = util.to_px(this._size, this._units, this._win);

		return {
			fontFamily: this._font,
			fontSize,
			fill: new Color(this._color).int,
			align: "center",
			breakWords: true,
			wordWrap: true,
			wordWrapWidth: size_px[ 0 ]
		};
	}

	/**
	 * Estimate the bounding box. this._boundingBox is used by other components like mouse listeners.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// take the alignment into account:
		const anchor = this._anchorTextToNum(this._anchor);
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - anchor[0] * this._size[0],
			this._pos[1] - anchor[1] * this._size[1],
			this._size[0],
			this._size[1],
		);
	}

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
				this._pixiText.destroy(true);
				this._pixiGraphics.destroy(true);
				this._pixi.destroy();
			}

			this._pixi = new PIXI.Container();
			this._pixiGraphics = new PIXI.Graphics();

			const pixiTextConfig = this._composeTextConfig();
			this._pixiText = new PIXI.Text(this._text, pixiTextConfig);

			this._pixi.addChild(this._pixiGraphics, this._pixiText);

			const fillColor = new Color(this._fillColor);

			this._pixiGraphics.beginFill(fillColor.int, 1);

			if (this._borderWidth > 0)
			{
				this._pixiGraphics.lineStyle(this._borderWidth, this._borderColor, 1);
			}

			const size_px = util.to_px(this._size, this._units, this._win);

			this._pixiGraphics.drawRect(0, 0, size_px[0], size_px[1]);
			this._pixiGraphics.endFill();
			this._pixiGraphics.closePath();
			this._pixiText.x = Math.round((size_px[ 0 ] - this._pixiText.width) * 0.5);
			this._pixiText.y = Math.round((size_px[ 1 ] - this._pixiText.height) * 0.5);
			// this._pixiText.width = size_px[ 0 ];
		}

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
