/**
 * Slider Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import {WindowMixin} from '../core/WindowMixin';
import {Clock} from '../util/Clock';
import * as util from '../util/Util';
import {PsychoJS} from "../core/PsychoJS";


/**
 * Slider stimulus.
 *
 * @name module:visual.Slider
 * @class
 * @extends module:visual.VisualStim
 * @mixes module:util.ColorMixin
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {module:core.Window} options.win - the associated Window
 * @param {number[]} [options.pos= [0, 0]] - the position of the center of the slider
 * @param {number[]} options.size - the size of the slider, e.g. [1, 0.1] for an horizontal slider
 * @param {number} [options.ori = 0.0] - the orientation (in degrees)
 * @param {string} [options.units= 'height'] - the units of the Slider position, and font size
 *
 * @param {Color} [options.color= Color('LightGray')] the color of the slider
 * @param {number} [options.contrast= 1.0] - the contrast of the slider
 * @param {number} [options.opacity= 1.0] - the opacity of the slider
 *
 * @param {string} [options.style= [Slider.Style.RATING]] - the slider style
 * @param {number[]} [options.ticks= [1,2,3,4,5]] - the array of ticks
 * @param {number[]} [options.labels= []] - the array of labels
 * @param {number} [options.granularity= 0] - the granularity
 * @param {boolean} [options.flip= false] - whether or not to flip the position of the marker, ticks,
 * and labels with respect to the central bar
 * @param {boolean} [options.readOnly= false] - whether or not the slider is read only
 *
 * @param {string} [options.fontFamily= 'Helvetica'] - the text font
 * @param {boolean} [options.bold= true] - whether or not the font of the labels is bold
 * @param {boolean} [options.italic= false] - whether or not the font of the labels is italic
 * @param {number} [options.fontSize] - the font size of the labels (in pixels), the default fontSize depends on the
 * Slider's units: 14 for 'pix', 0.03 otherwise
 *
 * @param {boolean} [options.compact= false] - whether or not the slider is compact, i.e. whether all graphical
 * elements (e.g. labels) fit within its size
 *
 * @param {PIXI.Graphics} options.clipMask - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every
 *   frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo check that parameters are valid, e.g. ticks are an array of numbers, etc.
 * @todo readOnly
 * @todo complete setters, for instance setTicks should change this._isCategorical
 * @todo flesh out the skin approach
 */
export class Slider extends util.mix(VisualStim).with(ColorMixin, WindowMixin)
{
	constructor({name, win, pos, size, ori, units, color, contrast, opacity, style, ticks, labels, labelHeight, granularity, flip, readOnly, font, bold, italic, fontSize, compact, clipMask, autoDraw, autoLog} = {})
	{
		super({name, win, units, ori, opacity, pos, size, clipMask, autoDraw, autoLog});

		this._needMarkerUpdate = false;

		// slider skin:
		this._skin = {};
		Object.assign(this._skin, Slider.Skin);

		// callback to deal with input sanitising:
		const onChange = (withPixi = false, withBoundingBox = false, withSanitize = false) =>
		{
			const visualOnChange = this._onChange(withPixi, withBoundingBox);
			return () =>
			{
				if (withSanitize)
				{
					this._sanitizeAttributes();
				}

				visualOnChange();
			};
		};

		this._addAttribute(
			'style',
			style,
			[Slider.Style.RATING],
			onChange(true, true, true)
		);
		this._addAttribute(
			'ticks',
			ticks,
			[1, 2, 3, 4, 5],
			onChange(true, true, true)
		);
		this._addAttribute(
			'labels',
			labels,
			[],
			onChange(true, true, true)
		);
		this._addAttribute(
			'granularity',
			granularity,
			0,
			this._onChange(false, false)
		);
		this._addAttribute(
			'readOnly',
			readOnly,
			false
		);
		this._addAttribute(
			'compact',
			compact,
			false,
			this._onChange(true, true)
		);

		// font:
		this._addAttribute(
			'font',
			font,
			'Helvetica',
			this._onChange(true, true)
		);
		this._addAttribute(
			'fontSize',
			fontSize,
			(this._units === 'pix') ? 14 : 0.03,
			this._onChange(true, true)
		);
		this._addAttribute(
			'bold',
			bold,
			true,
			this._onChange(true, true)
		);
		this._addAttribute(
			'italic',
			italic,
			false,
			this._onChange(true, true)
		);
		this._addAttribute(
			'labelHeight',
			labelHeight,
			undefined,
			this._onChange(true, true)
		);
		this._addAttribute(
			'flip',
			flip,
			false,
			this._onChange(true, true)
		);

		// color:
		this._addAttribute(
			'color',
			color,
			'lightgray',
			this._onChange(true, false)
		);
		this._addAttribute(
			'contrast',
			contrast,
			1.0,
			this._onChange(true, false)
		);


		// slider rating (which might be different from the visible marker rating):
		this._addAttribute('rating', undefined);

		// visible marker rating (which might be different from the actual rating):
		this._addAttribute('markerPos', undefined);

		// full history of ratings and response times:
		this._addAttribute('history', []);

		// various graphical components:
		this._addAttribute('lineAspectRatio', 0.01);

		// check for attribute conflicts, missing values, etc.:
		this._sanitizeAttributes();

		// estimate the bounding box:
		this._estimateBoundingBox();

		// the internal response clock, used to time the marker change events:
		this._responseClock = new Clock();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}



	/**
	 * Force a refresh of the stimulus.
	 *
	 * @name module:visual.Slider#refresh
	 * @public
	 */
	refresh()
	{
		super.refresh();

		this._needMarkerUpdate = true;
	}



	/**
	 * Reset the slider.
	 *
	 * @name module:visual.Slider#reset
	 * @public
	 */
	reset()
	{
		this.psychoJS.logger.debug('reset Slider: ', this._name);

		this._markerPos = undefined;
		this._history = [];
		this._rating = undefined;
		this._responseClock.reset();
		this.status = PsychoJS.Status.NOT_STARTED;

		this._needPixiUpdate = true;
		this._needUpdate = true;

		// the marker should be invisible when markerPos is undefined:
		if (typeof this._marker !== 'undefined')
		{
			this._marker.alpha = 0;
		}
	}



	/**
	 * Get the current value of the rating.
	 *
	 * @name module:visual.Slider#getRating
	 * @public
	 * @returns {number | undefined} the rating or undefined if there is none
	 */
	getRating()
	{
		const historyLength = this._history.length;
		if (historyLength > 0)
		{
			return this._history[historyLength - 1].rating;
		}
		else
		{
			return undefined;
		}
	}



	/**
	 * Get the response time of the most recent change to the rating.
	 *
	 * @name module:visual.Slider#getRT
	 * @public
	 * @returns {number | undefined} the response time (in second) or undefined if there is none
	 */
	getRT()
	{
		const historyLength = this._history.length;
		if (historyLength > 0)
		{
			return this._history[historyLength - 1].responseTime;
		}
		else
		{
			return undefined;
		}
	}



	/**
	 * Setter for the readOnly attribute.
	 *
	 * <p>Read-only sliders are half-opaque and do not provide responses.</p>
	 *
	 *
	 * @name module:visual.Slider#setReadOnly
	 * @public
	 * @param {boolean} [readOnly= true] - whether or not the slider is read-only
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setReadOnly(readOnly = true, log = false)
	{
		const hasChanged = this._setAttribute('readOnly', readOnly, log);

		if (hasChanged)
		{
			// halve the opacity:
			if (readOnly)
			{
				this._opacity /= 2.0;
			}
			else
			{
				this._opacity *= 2.0;
			}

			this._needUpdate = true;
		}
	}



	/**
	 * Setter for the markerPos attribute.
	 *
	 * <p>Setting markerPos changes the visible position of the marker to the specified rating
	 * but does not change the actual rating returned by the slider.</p>
	 *
	 *
	 * @name module:visual.Slider#setMarkerPos
	 * @public
	 * @param {number} displayedRating - the displayed rating
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setMarkerPos(displayedRating, log = false)
	{
		const previousMarkerPos = this._markerPos;
		this._markerPos = this._granularise(displayedRating);

		// if the displayed rating has changed, we need to update the pixi representation:
		if (previousMarkerPos !== this._markerPos)
		{
			this._needMarkerUpdate = true;
			this._needUpdate = true;
		}
	}



	/**
	 * Setter for the rating attribute.
	 *
	 * <p>Setting the rating does not change the visible position of the marker.</p>
	 *
	 * @name module:visual.Slider#setRating
	 * @public
	 * @param {number} rating - the rating
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setRating(rating, log = false)
	{
		rating = this._granularise(rating);
		this._markerPos = rating;
		if (this._isCategorical)
		{
			rating = this._labels[Math.round(rating)];
		}

		this._setAttribute('rating', rating, log);
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @note this method calculates the position of the labels, since that is necessary to the estimation of
	 * the bounding box.
	 *
	 * @name module:visual.Slider#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// setup the slider's style (taking into account the Window dimension, etc.):
		this._setupStyle();
		
		// calculate various values in pixel units:
		this._tickSize_px = util.to_px(this._tickSize, this._units, this._win);
		this._fontSize_px = this._getLengthPix(this._fontSize);
		this._barSize_px = util.to_px(this._barSize, this._units, this._win, true).map(v => Math.max(1, v));
		this._markerSize_px = util.to_px(this._markerSize, this._units, this._win, true);
		const pos_px = util.to_px(this._pos, this._units, this._win);
		const size_px = util.to_px(this._size, this._units, this._win);

		// calculate the position of the ticks:
		const tickPositions = this._ratingToPos(this._ticks);
		this._tickPositions_px = tickPositions.map(p => util.to_px(p, this._units, this._win));

		// left, top, right, bottom limits:
		const limits_px = [0, 0, size_px[0], size_px[1]];
		// Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY

		// estimate the position of the labels:
		this._labelPositions_px = new Array(this._labels.length);
		const labelTextStyle = this._getTextStyle();
		let prevLabelBounds = null;
		let prevNonOverlapOffset = 0;

		const tolerance = 10;

		for (let l = 0; l < this._labels.length; ++l)
		{
			const tickPositionIndex = Math.round( l / (this._labels.length - 1) * (this._ticks.length - 1) );
			this._labelPositions_px[l] = this._tickPositions_px[tickPositionIndex];
			const labelBounds = PIXI.TextMetrics.measureText(this._labels[l], labelTextStyle);

			// horizontal slider:
			if (this._isHorizontal())
			{
				if (this._flip)
				{
					this._labelPositions_px[l][1] -= labelBounds.height + this._tickSize_px[1];
				}
				else
				{
					this._labelPositions_px[l][1] += this._tickSize_px[1];
				}

				if (this._style.indexOf(Slider.Style.LABELS45) === -1)
				{
					this._labelPositions_px[l][0] -= labelBounds.width / 2;
					if (this._compact)
					{
						this._labelPositions_px[l][0] = Math.min(size_px[0] / 2 - labelBounds.width, Math.max(-size_px[0] / 2, this._labelPositions_px[l][0]));
					}

					// ensure that that labels are not overlapping:
					if (prevLabelBounds &&
						(this._labelPositions_px[l - 1][0] + prevLabelBounds.width + tolerance >= this._labelPositions_px[l][0]))
					{
						if (prevNonOverlapOffset === 0)
						{
							prevNonOverlapOffset = prevLabelBounds.height;
							this._labelPositions_px[l][1] += prevNonOverlapOffset;
						}
						else
						{
							prevNonOverlapOffset = 0;
						}
					}
					prevLabelBounds = labelBounds;
				}
			}
			// vertical slider:
			else
			{
				this._labelPositions_px[l][1] -= labelBounds.height / 2;
				if (this._compact)
				{
					this._labelPositions_px[l][1] = Math.min(size_px[1] / 2 - labelBounds.width, Math.max(-size_px[1] / 2, this._labelPositions_px[l][1]));
				}
				if (this._flip)
				{
					this._labelPositions_px[l][0] += this._tickSize_px[0] * 2;
				}
				else if (this._labelOri === 0)
				{
					this._labelPositions_px[l][0] -= labelBounds.width + this._tickSize_px[0] * 2;
				}
				else
				{
					this._labelPositions_px[l][0] -= this._tickSize_px[0];
				}
			}

			// update limits:
			limits_px[0] = Math.min(limits_px[0], this._labelPositions_px[l][0]);
			limits_px[1] = Math.min(limits_px[1], this._labelPositions_px[l][1]);
			limits_px[2] = Math.max(limits_px[2], this._labelPositions_px[l][0] + labelBounds.width);
			limits_px[3] = Math.max(limits_px[3], this._labelPositions_px[l][1] + labelBounds.height);
		}

		// adjust the limits by taking into account the ticks:
		if (this._isHorizontal())
		{
			limits_px[1] -= this._tickSize_px[1] * 2;
		}
		else
		{
			// TODO vertical
		}

		// calculate the bounding box, in the Slider's coordinates:
		const position_px = this._getPosition_px();
		this._boundingBox = new PIXI.Rectangle(
			this._getLengthUnits(position_px.x + limits_px[0]),
			this._getLengthUnits(position_px.y + limits_px[1]),
			this._getLengthUnits(limits_px[2] - limits_px[0]),
			this._getLengthUnits(limits_px[3] - limits_px[1])
		);
	}



	/**
	 * Sanitize the slider attributes: check for attribute conflicts, missing values, etc.
	 *
	 * @name module:visual.Slider#_sanitizeAttributes
	 * @function
	 * @protected
	 */
	_sanitizeAttributes()
	{
		// convert potential string styles into Symbols:
		this._style.forEach( (style, index) =>
		{
			if (typeof style === 'string')
			{
				this._style[index] = Symbol.for(style.toUpperCase());
			}
		});

		// TODO: only two ticks for SLIDER type, non-empty ticks, that RADIO is also categorical, etc.

		// deal with categorical sliders:
		this._isCategorical = (this._ticks.length === 0);
		if (this._isCategorical)
		{
			this._ticks = [...Array(this._labels.length)].map( (_, i) => i );
			this._granularity = 1.0;
		}

	}



	/**
	 * Set the current rating.
	 *
	 * <p>Setting the rating does also change the visible position of the marker.</p>
	 *
	 * @name module:visual.Slider#recordRating
	 * @function
	 * @public
	 * @param {number} rating - the rating
	 * @param {number} [responseTime] - the reaction time
	 * @param {boolean} [log= false] - whether of not to log
	 */
	recordRating(rating, responseTime = undefined, log = false)
	{
		// get response time:
		if (typeof responseTime === 'undefined')
		{
			responseTime = this._responseClock.getTime();
		}

		// set rating:
		// rating = this._granularise(rating);
		// this._setAttribute('rating', rating, log);
		this.setRating(rating, log);

		// add rating and response time to history:
		this._history.push({rating: this._rating, responseTime});
		this.psychoJS.logger.debug('record a new rating: ', this._rating, 'with response time: ', responseTime, 'for Slider: ', this._name);

		// update slider:
		this._needMarkerUpdate = true;
		this._needUpdate = true;
	}


	/**
	 * Update the stimulus, if necessary.
	 *
	 * @name module:visual.Slider#_updateIfNeeded
	 * @private
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		this._setupSlider();
		this._updateMarker();

		this._pixi.scale.x = 1;
		this._pixi.scale.y = -1;

		this._pixi.rotation = this._ori * Math.PI / 180;
		this._pixi.position = this._getPosition_px();

		this._pixi.alpha = this._opacity;
	}


	/**
	 * Estimate the position of the slider, taking the compactness into account.
	 *
	 * @name module:visual.Slider#_getPosition_px
	 * @return {number[]} - the position of the slider, in pixels
	 * @private
	 */
	_getPosition_px()
	{
		const position = util.to_pixiPoint(this.pos, this.units, this.win, true);
		if (this._compact &&
			(this._style.indexOf(Slider.Style.RADIO) > -1 || this._style.indexOf(Slider.Style.RATING) > -1))
		{
			if (this._isHorizontal())
			{
				position.y -= this._getLengthPix(this._tickSize[1]) * (this._flip ? -1 : 1);
			}
			else
			{
				position.x += this._getLengthPix(this._tickSize[0]) * (this._flip ? -1 : 1);
			}
		}

		return position;
	}



	/**
	 * Update the position of the marker if necessary.
	 *
	 * @name module:visual.Slider#_updateMarker
	 * @private
	 */
	_updateMarker()
	{
		if (!this._needMarkerUpdate)
		{
			return;
		}
		this._needMarkerUpdate = false;

		if (typeof this._marker !== 'undefined')
		{
			if (typeof this._markerPos !== 'undefined')
			{
				const visibleMarkerPos = this._ratingToPos([this._markerPos]);
				this._marker.position = util.to_pixiPoint(visibleMarkerPos[0], this.units, this.win, true);
				this._marker.alpha = 1;
			}
			else
			{
				this._marker.alpha = 0;
			}
		}
	}



	/**
	 * Setup the PIXI components of the slider (bar, ticks, labels, marker, etc.).
	 *
	 * @name module:visual.Slider#_setupSlider
	 * @function
	 * @private
	 */
	_setupSlider()
	{
		if (!this._needPixiUpdate)
		{
			return;
		}
		this._needPixiUpdate = false;

		this._setupStyle();


		// calculate various values in pixel units:
		this._tickSize_px = util.to_px(this._tickSize, this._units, this._win);
		this._fontSize_px = this._getLengthPix(this._fontSize);
		this._barSize_px = util.to_px(this._barSize, this._units, this._win, true).map(v => Math.max(1, v));
		this._markerSize_px = util.to_px(this._markerSize, this._units, this._win, true);
		const tickPositions = this._ratingToPos(this._ticks);
		this._tickPositions_px = tickPositions.map(p => util.to_px(p, this._units, this._win));


		if (typeof this._pixi !== 'undefined')
		{
			this._pixi.destroy(true);
		}
		this._pixi = new PIXI.Container();
		this._pixi.interactive = true;
		// apply the clip mask:
		this._pixi.mask = this._clipMask;

		this._body = new PIXI.Graphics();
		this._body.interactive = true;
		this._pixi.addChild(this._body);


		// ensure that pointer events will be captured along the slider body, even outside of
		// marker and labels:
		if (this._tickType === Slider.Shape.DISC)
		{
			const maxTickSize_px = Math.max(this._tickSize_px[0], this._tickSize_px[1]);
			this._body.hitArea = new PIXI.Rectangle(
				-this._barSize_px[0] / 2 - maxTickSize_px,
				-this._barSize_px[1] / 2 - maxTickSize_px,
				this._barSize_px[0] + maxTickSize_px * 2,
				this._barSize_px[1] + maxTickSize_px * 2);
		}
		else
		{
			this._body.hitArea = new PIXI.Rectangle(
				-this._barSize_px[0] / 2 - this._tickSize_px[0] / 2,
				-this._barSize_px[1] / 2 - this._tickSize_px[1] / 2,
				this._barSize_px[0] + this._tickSize_px[0],
				this._barSize_px[1] + this._tickSize_px[1]);
		}

		// central bar:
		this._setupBar();

		// ticks:
		this._setupTicks();

		// labels:
		this._setupLabels();

		// markers:
		this._setupMarker();
	}



	/**
	 * Setup the central bar.
	 *
	 * @name module:visual.Slider#_setupBar
	 * @function
	 * @private
	 */
	_setupBar()
	{
		if (this._barLineWidth_px > 0)
		{
			this._body.lineStyle(this._barLineWidth_px, this._barLineColor.int, 1, 0.5);
			if (typeof this._barFillColor !== 'undefined')
			{
				this._body.beginFill(this._barFillColor.int, 1);
			}
			this._body.drawRect(
				Math.round(-this._barSize_px[0] / 2),
				Math.round(-this._barSize_px[1] / 2),
				Math.round(this._barSize_px[0]),
				Math.round(this._barSize_px[1])
			);
			if (typeof this._barFillColor !== 'undefined')
			{
				this._body.endFill();
			}
		}
	}



	/**
	 * Setup the marker, and the associated mouse events.
	 *
	 * @name module:visual.Slider#_setupMarker
	 * @function
	 * @private
	 */
	_setupMarker()
	{
/*	this is now deprecated and replaced by _body.hitArea
		// transparent rectangle necessary to capture pointer events outside of marker and labels:
		const eventCaptureRectangle = new PIXI.Graphics();
		eventCaptureRectangle.beginFill(0, 0);
		eventCaptureRectangle.drawRect(
			-this._barSize_px[0] / 2 - this._tickSize_px[0] / 2,
			-this._barSize_px[1] / 2 - this._tickSize_px[1] / 2,
			this._barSize_px[0] + this._tickSize_px[0],
			this._barSize_px[1] + this._tickSize_px[1]
		);
		eventCaptureRectangle.endFill();
		this._pixi.addChild(eventCaptureRectangle);
*/

		// marker:
		this._marker = new PIXI.Graphics();
		this._marker.alpha = 0; // invisible until markerPos is defined
		this._marker.interactive = true;
		this._pixi.addChild(this._marker);

		const halfMarkerSize_px = Math.round(Math.max(...this._markerSize_px) / 2);
		if (this._markerType === Slider.Shape.DISC)
		{
			this._marker.lineStyle(1, this._markerColor.int, 1, 0.5);
			this._marker.beginFill(this._markerColor.int, 1);
			this._marker.drawCircle(0, 0, halfMarkerSize_px);
			this._marker.endFill();
		}
		else if (this._markerType === Slider.Shape.TRIANGLE)
		{
			this._marker.lineStyle(1, this._markerColor.int, 1, 0.5);
			this._marker.beginFill(this._markerColor.int, 1);
			this._marker.moveTo(0, 0);
			if (this._isHorizontal())
			{
				if (this._flip)
				{
					this._marker.lineTo(halfMarkerSize_px, halfMarkerSize_px);
					this._marker.lineTo(-halfMarkerSize_px, halfMarkerSize_px);
				}
				else
				{
					this._marker.lineTo(halfMarkerSize_px, -halfMarkerSize_px);
					this._marker.lineTo(-halfMarkerSize_px, -halfMarkerSize_px);
				}
			}
			else
			{
				if (this._flip)
				{
					this._marker.lineTo(-halfMarkerSize_px, halfMarkerSize_px);
					this._marker.lineTo(-halfMarkerSize_px, -halfMarkerSize_px);
				}
				else
				{
					this._marker.lineTo(halfMarkerSize_px, halfMarkerSize_px);
					this._marker.lineTo(halfMarkerSize_px, -halfMarkerSize_px);
				}
			}
			this._marker.endFill();
		}
		else if (this._markerType === Slider.Shape.BOX)
		{
			this._marker.lineStyle(1, this.getContrastedColor(this._markerColor, 0.5).int, 1, 0.5);
			this._marker.beginFill(this._markerColor.int, 1);
			this._marker.drawRect(
				Math.round(-this._markerSize_px[0] / 2),
				Math.round(-this._markerSize_px[1] / 2),
				this._markerSize_px[0],
				this._markerSize_px[1]
			);
			this._marker.endFill();

			// this._marker.lineStyle(1, new Color('white').int, 1, 0.5);
			// this._marker.drawCircle(0, 0, this._markerSize_px[0] / 3);
		}


		// marker mouse events:
		const self = this;
		self._markerDragging = false;

		this._marker.pointerdown = this._marker.mousedown = this._marker.touchstart = (event) =>
		{
			if (event.data.button === 0)
			{
				self._markerDragging = true;
				/* not quite right, just yet (as of May 2020)
								// set markerPos, but not rating:
								const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
								const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
								self._markerPos = self._granularise(rating);

								self._needMarkerUpdate = true;
				 */
			}

			event.stopPropagation();
		};

		// pointer was released inside the marker: if we were dragging, we record the rating
		this._marker.pointerup = this._marker.mouseup = this._marker.touchend = (event) =>
		{
			if (self._markerDragging)
			{
				self._markerDragging = false;

				const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
				const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
				self.recordRating(rating);

				event.stopPropagation();
			}
		};

		// pointer was released outside of the marker: cancel the dragging
		this._marker.pointerupoutside = this._marker.mouseupoutside = this._marker.touchendoutside = (event) =>
		{
			if (self._markerDragging)
			{
				const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
				const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
				self.recordRating(rating);

				self._markerDragging = false;

				event.stopPropagation();
			}
		};

		// pointer is moving: if we are dragging, we move the marker position
		this._marker.pointermove = (event) =>
		{
			if (self._markerDragging)
			{
				const mouseLocalPos_px = event.data.getLocalPosition(self._pixi);
				const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
				self.setMarkerPos(rating);

				event.stopPropagation();
			}
		};


		// (*) slider mouse events outside of marker
		// note: this only works thanks to eventCaptureRectangle
		/* not quite right just yet (as of May 2020)
		this._pixi.pointerdown = this._pixi.mousedown = this._pixi.touchstart = (event) =>
		{
			if (event.data.button === 0)
			{
				self._markerDragging = true;

				// set markerPos, but not rating:
				const mouseLocalPos_px = event.data.getLocalPosition(self._body);
				const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
				self._markerPos = self._granularise(rating);

				// update the marker:
				self._needMarkerUpdate = true;
				self._updateMarker();
			}

			event.stopPropagation();
		};
		*/

		this._pixi.pointerup = this._pixi.mouseup = this._pixi.touchend = (event) =>
		{
			const mouseLocalPos_px = event.data.getLocalPosition(self._body);
			const rating = self._posToRating([mouseLocalPos_px.x, mouseLocalPos_px.y]);
			self.recordRating(rating);

			event.stopPropagation();
		};
	}



	/**
	 * Setup the ticks.
	 *
	 * @name module:visual.Slider#_setupTicks
	 * @function
	 * @private
	 */
	_setupTicks()
	{
		// Note: no ticks for SLIDER style
		if (this._style.indexOf(Slider.Style.SLIDER) > -1)
		{
			return;
		}

		const maxTickSize = Math.max(this._tickSize_px[0], this._tickSize_px[1]);

		this._body.lineStyle(this._barLineWidth_px * 2, this._tickColor.int, 1, 0.5);

		for (let tickPosition_px of this._tickPositions_px)
		{
			if (this._tickType === Slider.Shape.LINE)
			{
				this._body.moveTo(tickPosition_px[0] - this._tickSize_px[0] / 2, tickPosition_px[1] - this._tickSize_px[1] / 2);
				this._body.lineTo(tickPosition_px[0] + this._tickSize_px[0] / 2, tickPosition_px[1] + this._tickSize_px[1] / 2);
			}
			else if (this._tickType === Slider.Shape.DISC)
			{
				this._body.beginFill(this._tickColor.int, 1);
				this._body.drawCircle(tickPosition_px[0], tickPosition_px[1], maxTickSize);
				this._body.endFill();
			}
		}
	}



	/**
	 * Get the PIXI Text Style applied to the PIXI.Text labels.
	 *
	 * @name module:visual.Slider#_getTextStyle
	 * @function
	 * @private
	 */
	_getTextStyle()
	{
		this._fontSize_px = this._getLengthPix(this._fontSize);
		
		return new PIXI.TextStyle({
			fontFamily: this._font,
			fontSize: Math.round(this._fontSize_px),
			fontWeight: (this._bold) ? 'bold' : 'normal',
			fontStyle: (this._italic) ? 'italic' : 'normal',
			fill: this.getContrastedColor(this._labelColor, this._contrast).hex,
			align: 'center',
		});
	}



	/**
	 * Setup the labels.
	 *
	 * @name module:visual.Slider#_setupTicks
	 * @function
	 * @private
	 */
	_setupLabels()
	{
		const labelTextStyle = this._getTextStyle();

		for (let l = 0; l < this._labels.length; ++l)
		{
			const labelText = new PIXI.Text(this._labels[l], labelTextStyle);
			labelText.position.x = this._labelPositions_px[l][0];
			labelText.position.y = this._labelPositions_px[l][1];
			labelText.rotation = (this._ori + this._labelOri) * Math.PI / 180;
			labelText.anchor = this._labelAnchor;
			labelText.alpha = 1;

			this._pixi.addChild(labelText);
		}
	}



	/**
	 * Apply a particular style to the slider.
	 *
	 * @note: We are mirroring PsychoPy here, rather than using a skin approach.
	 *
	 * @name module:visual.Slider#_setupStyle
	 * @function
	 * @private
	 */
	_setupStyle()
	{
		const isWhiteOnBlack = (this._style.indexOf(Slider.Style.WHITE_ON_BLACK) > -1);
		const skin = (isWhiteOnBlack) ? this._skin.WHITE_ON_BLACK : this._skin.STANDARD;

		// default style:
		if (this._isHorizontal())
		{
			this._barSize = [this._size[0], 0];
			this._tickSize = [0, this._size[1]];
			this._labelAnchor = new PIXI.Point(0, 0);
		}
		else
		{
			this._barSize = [0, this._size[1]];
			this._tickSize = [this._size[0], 0];
			this._labelAnchor = new PIXI.Point(0, 0);
		}

		this._barLineWidth_px = 1;
		this._barLineColor = (!skin.BAR_LINE_COLOR) ? new Color(this._color) : skin.BAR_LINE_COLOR;
		this._barFillColor = undefined;

		this._tickType = Slider.Shape.LINE;
		this._tickColor = (!skin.TICK_COLOR) ? new Color(this._color) : skin.TICK_COLOR;

		// this._markerColor = this.getContrastedColor(this._color, 0.3);
		this._markerColor = skin.MARKER_COLOR;
		this._markerType = Slider.Shape.DISC;
		this._markerSize = (!this._skin.MARKER_SIZE) ? this._tickSize : this._skin.MARKER_SIZE;

		this._labelColor = (!skin.LABEL_COLOR) ? new Color(this._color) : skin.LABEL_COLOR;

		this._labelOri = 0;


		// rating:
		if (this._style.indexOf(Slider.Style.RATING) > -1)
		{
			// nothing to do
		}

		// triangleMarker:
		if (this._style.indexOf(Slider.Style.TRIANGLE_MARKER) > -1)
		{
			this._markerType = Slider.Shape.TRIANGLE;
			if (!this._skin.MARKER_SIZE)
			{
			this._markerSize = this._markerSize.map(s => s * 2);
		}
		}

		// slider:
		if (this._style.indexOf(Slider.Style.SLIDER) > -1)
		{
			this._markerType = Slider.Shape.BOX;
			if (!this._skin.MARKER_SIZE)
			{
			this._markerSize = (this._isHorizontal()) ?
					[this._size[0] / (this._ticks[this._ticks.length - 1] - this._ticks[0]), this._size[1]] :
					[this._size[0], this._size[1] / (this._ticks[this._ticks.length - 1] - this._ticks[0])];
			}
			this._barSize = [this._size[0], this._size[1]];
			this._barFillColor = this.getContrastedColor(new Color(this.color), 0.5);
		}

		/*
		// whiteOnBlack:
		if (isWhiteOnBlack)
		{
			this._barLineColor = skin.BAR_LINE_COLOR;
			this._tickColor = skin.TICK_COLOR;
			this._markerColor = skin.MARKER_COLOR;
			this._labelColor = skin.LABEL_COLOR;
		}
		*/

		// labels45:
		if (this._style.indexOf(Slider.Style.LABELS45) > -1)
		{
			this._labelOri = -45;
			if (this._flip)
			{
				this._labelAnchor = new PIXI.Point(0, 0.5);
			}
			else
			{
				this._labelAnchor = new PIXI.Point(1, 0);
			}
		}

		// radio:
		if (this._style.indexOf(Slider.Style.RADIO) > -1)
		{
			this._barLineWidth_px = 0;
			this._tickType = Slider.Shape.DISC;

			if (!this._skin.MARKER_SIZE)
			{
			this._markerSize = this._markerSize.map(s => s * 0.7);
		}
	}
	}



	/**
	 * Convert an array of ratings into an array of [x,y] positions (in Slider units, with 0 at the center of the Slider)
	 *
	 * @name module:visual.Slider#_ratingToPos
	 * @function
	 * @private
	 * @param {number[]} ratings - the array of ratings
	 * @returns {Array.<Array.<number>>} the positions corresponding to the ratings (in Slider units,
	 * with 0 at the center of the Slider)
	 */
	_ratingToPos(ratings)
	{
		const range = this._ticks[this._ticks.length - 1] - this._ticks[0];
		if (this._isHorizontal())
		{
			// in compact mode the circular markers of RADIO sliders must fit within the width:
			if (this._compact && this._style.indexOf(Slider.Style.RADIO) > -1)
			{
				return ratings.map(v => [
					((v - this._ticks[0]) / range) * (this._size[0] - this._tickSize[1]*2) -
					(this._size[0] / 2) + this._tickSize[1],
						0]);
			}
			else if (this._style.indexOf(Slider.Style.SLIDER) > -1)
			{
				return ratings.map(v => [
					((v - this._ticks[0]) / range - 0.5) * (this._size[0] - this._markerSize[0]),
					0]);
			}
			else
			{
				return ratings.map(v => [((v - this._ticks[0]) / range - 0.5) * this._size[0], 0]);
			}
		}
		else
		{
			// in compact mode the circular markers of RADIO sliders must fit within the height:
			if (this._compact && this._style.indexOf(Slider.Style.RADIO) > -1)
			{
				return ratings.map(v => [0,
					((v - this._ticks[0]) / range) * (this._size[1] - this._tickSize[0]*2) -
					(this._size[1] / 2) + this._tickSize[0]]);
			}
			else if (this._style.indexOf(Slider.Style.SLIDER) > -1)
			{
				return ratings.map(v => [
					0,
					((v - this._ticks[0]) / range - 0.5) * (this._size[1] - this._markerSize[1])]);
			}
			else
			{
				return ratings.map(v => [0, (1.0 - (v - this._ticks[0]) / range - 0.5) * this._size[1]]);
			}
		}
	}



	/**
	 * Convert a [x,y] position, in pixel units, relative to the slider, into a rating.
	 *
	 * @name module:visual.Slider#_posToRating
	 * @function
	 * @private
	 * @param {number[]} pos_px - the [x,y] position, in pixel units, relative to the slider.
	 * @returns {number} the corresponding rating.
	 */
	_posToRating(pos_px)
	{
		const range = this._ticks[this._ticks.length - 1] - this._ticks[0];
		const size_px = util.to_px(this._size, this._units, this._win);
		const markerSize_px = util.to_px(this._markerSize, this._units, this._win);

		if (this._isHorizontal())
		{
			if (this._style.indexOf(Slider.Style.SLIDER) > -1)
			{
				return (pos_px[0] / (size_px[0] - markerSize_px[0]) + 0.5) * range + this._ticks[0];
			}
			else
			{
				return (pos_px[0] / size_px[0] + 0.5) * range + this._ticks[0];
			}
		}
		else
		{
			if (this._style.indexOf(Slider.Style.SLIDER) > -1)
			{
				return (pos_px[1] / (size_px[1] - markerSize_px[1]) + 0.5) * range + this._ticks[0];
			}
			else
			{
				return (1.0 - (pos_px[1] / size_px[1] + 0.5)) * range + this._ticks[0];
			}
		}
	}



	/**
	 * Determine whether the slider is horizontal.
	 *
	 * <p>The slider is horizontal is its x-axis size is larger than its y-axis size.</p>
	 *
	 * @name module:visual.Slider#_isHorizontal
	 * @function
	 * @private
	 * @returns {boolean} whether or not the slider is horizontal
	 */
	_isHorizontal()
	{
		return (this._size[0] > this._size[1]);
	}



	/**
	 * Calculate the rating once granularity has been taken into account.
	 *
	 * @name module:visual.Slider#_granularise
	 * @function
	 * @private
	 * @param {number} rating - the input rating
	 * @returns {number} the new rating with granularity applied
	 */
	_granularise(rating)
	{
		if (typeof rating === 'undefined')
		{
			return undefined;
		}

		if (this._granularity > 0)
		{
			rating = Math.round(rating / this._granularity) * this._granularity;
		}
		rating = Math.min(Math.max(this._ticks[0], rating), this._ticks[this._ticks.length - 1]);

		return rating;
	}

}


/**
 * Shape of the marker and of the ticks.
 *
 * @name module:visual.Slider#Shape
 * @enum {Symbol}
 * @readonly
 * @public
 */
Slider.Shape = {
	DISC: Symbol.for('DISC'),
	TRIANGLE: Symbol.for('TRIANGLE'),
	LINE: Symbol.for('LINE'),
	BOX: Symbol.for('BOX')
};


/**
 * Styles.
 *
 * @name module:visual.Slider#Style
 * @enum {Symbol}
 * @readonly
 * @public
 */
Slider.Style = {
	RATING: Symbol.for('RATING'),
	TRIANGLE_MARKER: Symbol.for('TRIANGLEMARKER'),
	SLIDER: Symbol.for('SLIDER'),
	WHITE_ON_BLACK: Symbol.for('WHITEONBLACK'),
	LABELS45: Symbol.for('LABELS45'),
	RADIO: Symbol.for('RADIO')
};


/**
 * Skin.
 *
 * @name module:visual.Slider#Skin
 * @enum {any}
 * @readonly
 * @public
 *
 * @note a null value indicates that the value is calculated when the style is setup, rather than simply assigned.
 */
Slider.Skin = {
	MARKER_SIZE: null,
	STANDARD: {
		MARKER_COLOR: new Color('red'),
		BAR_LINE_COLOR: null,
		TICK_COLOR: null,
		LABEL_COLOR: null
	},
	WHITE_ON_BLACK: {
		MARKER_COLOR: new Color('white'),
		BAR_LINE_COLOR: new Color('black'),
		TICK_COLOR: new Color('black'),
		LABEL_COLOR: new Color('black')
	}
};
