import * as PIXI from "pixi.js-legacy";
import * as util from "../util/Util.js";
import { Color } from "../util/Color.js";
import { to_pixiPoint } from "../util/Pixi.js";
import { VisualStim } from "./VisualStim.js";

export class Progress extends VisualStim
{
	constructor (
	{
		name,
		win,
		units,
		ori,
		opacity,
		depth,
		pos,
		anchor = "left",
		size = [300, 30],
		clipMask,
		autoDraw,
		autoLog,
		progress = 1,
		type,
		fillColor,
		fillTexture
	})
	{
		super({
			name,
			win,
			units,
			ori,
			opacity,
			depth,
			pos,
			anchor,
			size,
			clipMask,
			autoDraw,
			autoLog
		});

		this._addAttribute("progress", progress, 0);
		this._addAttribute("type", type, PROGRESS_TYPES.BAR);
		this._addAttribute("fillColor", fillColor, "lightgreen");
		this._addAttribute("fillTexture", fillTexture, PIXI.Texture.WHITE);
	}

	setProgress (progress = 0, log = false)
	{
		this._setAttribute("progress", Math.min(1.0, Math.max(0.0, progress)), log);
		if (this._pixi !== undefined)
		{
			this._pixi.clear();
			const size_px = util.to_px(this.size, this.units, this.win);
			const pos_px = util.to_px(this.pos, this.units, this.win);
			const progressWidth = size_px[0] * this._progress;
			if (this._fillTexture)
			{
				let t = PIXI.Texture.WHITE;
				if (typeof this._fillTexture === "string")
				{
					t = PIXI.Texture.from(this._fillTexture);
					t.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
				}
				this._pixi.beginTextureFill({
					texture: t
				});
			}
			else
			{
				this._pixi.beginFill(new Color(this._fillColor).int, this._opacity);
			}
			if (this._type === PROGRESS_TYPES.BAR)
			{
				this._pixi.drawRect(pos_px[0], pos_px[1], progressWidth, size_px[1]);
			}
			// TODO: check out beginTextureFill(). Perhaps it will allow to use images as filling for progress.
			this._pixi.endFill();

			// TODO: is there a better way to ensure anchor works?
			this.anchor = this._anchor;
		}
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		// TODO: figure out what is the error with estimateBoundBox on resize?
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
			this._pixi = new PIXI.Graphics();
			// TODO: Should we do this?
			// this._pixi.lineStyle(this._lineWidth, this._lineColor.int, this._opacity, 0.5);

			// TODO: Should just .setProgress() be called?
			this.setProgress(this._progress);

			this._pixi.scale.y = -1;
			this._pixi.zIndex = -this._depth;
			this.anchor = this._anchor;
		}

		// set polygon position and rotation:
		// TODO: what's the difference bw to_px and to_pixiPoint?
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180.0;
	}
}

export const PROGRESS_TYPES =
{
	BAR: 0,
	CIRCLE: 1
}
