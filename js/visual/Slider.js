/**
 * Slider Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


import {VisualStim} from './VisualStim';
import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
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
 * @param {Window} options.win - the associated Window
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
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every
 *   frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 *
 * @todo check that parameters are valid, e.g. ticks are an array of numbers, etc.
 * @todo readOnly
 * @todo style "slider"
 * @todo complete setters, for instance setTicks should change this._isCategorical
 * @todo consider using a proper UI delegate architecture (a la Java Swing, for instance).
 */
export class Slider extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({
								name,
								win,
								pos,
								size,
								ori,
								units = 'height',

								color = new Color('LightGray'),
								contrast = 1.0,
								opacity,

								style = [Slider.Style.RATING],
								ticks = [1, 2, 3, 4, 5],
								labels = [],
								labelHeight,
								granularity = 0,
								flip = false,
								readOnly = false,

								fontFamily = 'Helvetica',
								bold = true,
								italic = false,
								fontSize,

								autoDraw,
								autoLog
							} = {})
	{
		super({name, win, units, ori, opacity, pos, size, autoDraw, autoLog});

		this._needMarkerUpdate = false;

		this._addAttributes(Slider, ticks, labels, labelHeight, granularity, flip, color, contrast, fontFamily, bold, italic, fontSize, style, readOnly);

		// slider rating (which might be different from the visible marker rating):
		this._addAttribute('rating', undefined);

		// visible marker rating (which might be different from the actual rating):
		this._addAttribute('markerPos', undefined);

		// full history of ratings and response times:
		this._addAttribute('history', []);

		// various graphical components:
		this._addAttribute('lineAspectRatio', 0.01);

		this._responseClock = new Clock();

		// determine whether the slider is categorical:
		this._isCategorical = (this._ticks.length === 0);

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

		this._needVertexUpdate = true;
	}


	/**
	 * Determine whether an object is inside the bounding box of the slider.
	 *
	 * @name module:visual.Slider#contains
	 * @public
	 * @param {Object} object - the object
	 * @param {string} units - the units
	 * @return {boolean} whether or not the object is inside the bounding box of the slider
	 *
	 * @todo this is currently not implemented and always returns false
	 */
	contains(object, units)
	{
		// get position of object:
		let objectPos_px = util.getPositionFromObject(object, units);
		if (typeof objectPos_px === 'undefined')
		{
			throw {
				origin: 'Slider.contains', context: `when determining whether Slider: ${this._name} contains
			object: ${util.toString(object)}`, error: 'unable to determine the position of the object'
			};
		}

		return false;
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

		this._needMarkerUpdate = true;
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
			return this._history[historyLength - 1]['rating'];
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
			return this._history[historyLength - 1]['responseTime'];
		}
		else
		{
			return undefined;
		}
	}


	/**
	 * Setter for the font size.
	 *
	 * <p>The font size depends on the Slider's units: 14 for 'pix' and 0.03 otherwise.</p>
	 *
	 * @name module:visual.Slider#setFontSize
	 * @public
	 * @param {number} [fontSize] - the font size
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setFontSize(fontSize, log = false)
	{
		if (typeof fontSize === 'undefined')
		{
			fontSize = (this._units === 'pix') ? 14 : 0.03;
		}

		const hasChanged = this._setAttribute('fontSize', fontSize, log);

		if (hasChanged)
		{
			this._needUpdate = true;
			this._needVertexUpdate = true;
		}
	}

	/**
	 * Setter for the bold attribute.
	 *
	 * @name module:visual.Slider#setBold
	 * @public
	 * @param {boolean} [bold= true] - whether or not the font of the labels is bold
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setBold(bold = true, log = false)
	{
		const hasChanged = this._setAttribute('bold', bold, log);

		if (hasChanged)
		{
			this._fontWeight = (bold) ? 'bold' : 'normal';
			this._needUpdate = true;
			this._needVertexUpdate = true;
		}
	}


	/**
	 * Setter for the italic attribute.
	 *
	 * @name module:visual.Slider#setItalic
	 * @public
	 * @param {boolean} [italic= false] - whether or not the font of the labels is italic
	 * @param {boolean} [log= false] - whether of not to log
	 */
	setItalic(italic = false, log = false)
	{
		const hasChanged = this._setAttribute('italic', italic, log);

		if (hasChanged)
		{
			this._fontStyle = (italic) ? 'italic' : 'normal';
			this._needUpdate = true;
			this._needVertexUpdate = true;
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
	 * Set the current rating.
	 *
	 * <p>Setting the rating does also change the visible position of the marker.</p>
	 *
	 * @name module:visual.Slider#_recordRating
	 * @private
	 * @param {number} rating - the rating
	 * @param {number} [responseTime] - the reaction time
	 * @param {boolean} [log= false] - whether of not to log
	 */
	_recordRating(rating, responseTime = undefined, log = false)
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

		this._buildSlider();
		this._updateMarker();

		this._pixi.scale.x = this._flipHoriz ? -1 : 1;
		this._pixi.scale.y = this._flipVert ? 1 : -1;

		this._pixi.rotation = this._ori * Math.PI / 180;
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;
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
				this._marker.position = util.to_pixiPoint(visibleMarkerPos[0], this.units, this.win);
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
	 * @note: we use _needVertexUpdate as an indicator tha elements must be re-created.
	 *
	 * @name module:visual.Slider#_buildSlider
	 * @private
	 */
	_buildSlider()
	{
		if (!this._needVertexUpdate)
		{
			return;
		}
		this._needVertexUpdate = false;

		this._applyStyle();


		this._pixi = new PIXI.Container();
		this._pixi.interactive = true;

		this._body = new PIXI.Graphics();
		this._body.interactive = true;
		this._pixi.addChild(this._body);


		// (*) central bar:
		const barSize_px = util.to_px(this._barSize, this._units, this._win).map(v => Math.max(1, v));
		if (this._barLineWidth_px > 0)
		{
			this._body.lineStyle(this._barLineWidth_px, this._barLineColor.int, this._opacity, 0.5);
			if (typeof this._barFillColor !== 'undefined')
			{
				this._body.beginFill(this._barFillColor.int, this._opacity);
			}
			this._body.drawRect(-barSize_px[0] / 2, -barSize_px[1] / 2, barSize_px[0], barSize_px[1]);
			if (typeof this._barFillColor !== 'undefined')
			{
				this._body.endFill();
			}
		}

		// (*) ticks:
		if (this._isCategorical)
		{
			this._ticks = [...Array(this._labels.length)].map((_, i) => i);
			this._granularity = 1.0;
		}
		const tickPositions = this._ratingToPos(this._ticks);
		const tickPositions_px = tickPositions.map(p => util.to_px(p, this._units, this._win));
		this._body.lineStyle(this._barLineWidth_px * 2, this._tickColor.int, this._opacity, 0.5);
		const tickSize_px = util.to_px(this._tickSize, this._units, this._win);
		for (let tickPosition_px of tickPositions_px)
		{
			if (this._tickType === Slider.Shape.LINE)
			{
				this._body.moveTo(tickPosition_px[0] - tickSize_px[0] / 2, tickPosition_px[1] - tickSize_px[1] / 2);
				this._body.lineTo(tickPosition_px[0] + tickSize_px[0] / 2, tickPosition_px[1] + tickSize_px[1] / 2);
			}
			else if (this._tickType === Slider.Shape.DISC)
			{
				this._body.beginFill(this._tickColor.int, this._opacity);
				this._body.drawCircle(tickPosition_px[0], tickPosition_px[1], Math.max(tickSize_px[0], tickSize_px[1]));
				this._body.endFill();
			}
		}


		// (*) transparent rectangle necessary to capture pointer events
		// outside of marker and labels:
		const eventCaptureRectangle = new PIXI.Graphics();
		eventCaptureRectangle.beginFill(0, 0);
		eventCaptureRectangle.drawRect(-barSize_px[0] / 2 - tickSize_px[0] / 2, -barSize_px[1] / 2 - tickSize_px[1] / 2,
			barSize_px[0] + tickSize_px[0], barSize_px[1] + tickSize_px[1]);
		eventCaptureRectangle.endFill();
		this._pixi.addChild(eventCaptureRectangle);


		// (*) labels:
		const labelPositions_px = [...Array(this._labels.length)].map(
			(_, i) => tickPositions_px[Math.round(i / (this._labels.length - 1) * (this._ticks.length - 1))]);

		const fontSize_px = util.to_px([this._fontSize, this._fontSize], this._units, this._win);
		for (let l = 0; l < labelPositions_px.length; ++l)
		{
			const labelText = new PIXI.Text(this._labels[l], {
				fontFamily: this._fontFamily,
				fontWeight: this._fontWeight,
				fontStyle: this._fontStyle,
				fontSize: Math.round(fontSize_px[0]),
				fill: this._labelColor.hex,
				align: this._labelAlign
			});

			const labelBounds = labelText.getBounds(true);
			labelText.position.x = labelPositions_px[l][0];
			labelText.position.y = labelPositions_px[l][1];
			labelText.anchor.x = this._labelAnchor.x;
			labelText.anchor.y = this._labelAnchor.y;

			if (this._isHorizontal())
			{
				if (this._flip)
				{
					labelText.position.y -= labelBounds.height + tickSize_px[1];
				}
				else
				{
					labelText.position.y += tickSize_px[1];
				}
			}
			else
			{
				if (this._flip)
				{
					labelText.position.x += tickSize_px[0];
				}
				else if (this._labelOri === 0)
				{
					labelText.position.x -= labelBounds.width + tickSize_px[0];
				}
				else
				{
					labelText.position.x -= tickSize_px[0];
				}
			}

			labelText.rotation = (this._ori + this._labelOri) * Math.PI / 180;
			labelText.alpha = this._opacity;
			this._pixi.addChild(labelText);
		}


		// (*) marker:
		const markerSize_px = Math.max(...util.to_px(this._markerSize, this._units, this._win));
		this._marker = new PIXI.Graphics();
		this._marker.alpha = 0; // invisible until markerPos is defined
		this._marker.interactive = true;
		this._pixi.addChild(this._marker);

		if (this._markerType === Slider.Shape.DISC)
		{
			this._marker.lineStyle(1, this._markerColor.int, this._opacity, 0.5);
			this._marker.beginFill(this._markerColor.int, this._opacity);
			this._marker.drawCircle(0, 0, markerSize_px / 2);
			this._marker.endFill();
		}
		else if (this._markerType === Slider.Shape.TRIANGLE)
		{
			this._marker.lineStyle(1, this._markerColor.int, this._opacity, 0.5);
			this._marker.beginFill(this._markerColor.int, this._opacity);
			this._marker.moveTo(0, 0);
			if (this._isHorizontal())
			{
				if (this._flip)
				{
					this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
					this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
				}
				else
				{
					this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
					this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
				}
			}
			else
			{
				if (this._flip)
				{
					this._marker.lineTo(-markerSize_px / 2, markerSize_px / 2);
					this._marker.lineTo(-markerSize_px / 2, -markerSize_px / 2);
				}
				else
				{
					this._marker.lineTo(markerSize_px / 2, markerSize_px / 2);
					this._marker.lineTo(markerSize_px / 2, -markerSize_px / 2);
				}
			}
			this._marker.endFill();
		}


		// (*) marker mouse events:
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
				self._recordRating(rating);

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
				self._recordRating(rating);

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
			self._recordRating(rating);

			event.stopPropagation();
		};

	}


	/**
	 * Apply a particular style to the slider.
	 *
	 * @note: We are mirroring PsychoPy here, rather than using a skin approach.
	 *
	 * @name module:visual.Slider#_applyStyle
	 * @private
	 */
	_applyStyle()
	{

		// default style:
		if (this._isHorizontal())
		{
			this._barSize = [this._size[0], 0];
			this._tickSize = [0, this._size[1]];
			this._labelAnchor = new PIXI.Point(0.5, 0);
		}
		else
		{
			this._barSize = [0, this._size[1]];
			this._tickSize = [this._size[0], 0];
			this._labelAnchor = new PIXI.Point(0, 0.5);
		}

		this._barLineWidth_px = 1;
		this._barLineColor = this._color; //new Color('lightgray');
		this._barFillColor = undefined; //new Color('darkgray');

		this._tickType = Slider.Shape.LINE;
		this._tickColor = this._color;

		this._markerColor = new Color('red');
		this._markerType = Slider.Shape.DISC;
		this._markerSize = this._tickSize;

		this._labelColor = this._color;

		this._labelAlign = 'center';
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
			this._markerSize = this._markerSize.map(s => s * 2);
		}

		// slider:
		if (this._style.indexOf(Slider.Style.SLIDER) > -1)
		{
			this.psychoJS.logger.warn('"slider" style not implemented!');
			//TODO
		}

		// whiteOnBlack:
		if (this._style.indexOf(Slider.Style.WHITE_ON_BLACK) > -1)
		{
			this._barLineColor = new Color('black');
			// this._barFillColor = new Color('black');
			this._tickColor = new Color('black');
			this._markerColor = new Color('white');
			this._labelColor = new Color('black');
		}

		// labels45:
		if (this._style.indexOf(Slider.Style.LABELS45) > -1)
		{
			if (this._flip)
			{
				this._labelAnchor = new PIXI.Point(0, 0.5);
				this._labelAlign = 'left';
			}
			else
			{
				this._labelAnchor = new PIXI.Point(1, 0.5);
				this._labelAlign = 'right';
			}
			this._labelOri = -45;
		}

		// radio:
		if (this._style.indexOf(Slider.Style.RADIO) > -1)
		{
			this._barLineWidth_px = 0;
			this._tickType = Slider.Shape.DISC;

			this._markerColor = this.getContrastedColor(this._tickColor, 0.5);
			this._markerSize.x *= 0.7;
			this._markerSize.y *= 0.7;
		}
	}


	/**
	 * Convert an array of ratings into an array of [x,y] positions (in Slider units, with 0 at the center of the Slider)
	 *
	 * @name module:visual.Slider#_ratingToPos
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
			return ratings.map(v => [((v - this._ticks[0]) / range - 0.5) * this._size[0], 0]);
		}
		else
		{
			return ratings.map(v => [0, (1.0 - (v - this._ticks[0]) / range - 0.5) * this._size[1]]);
		}
		// return ratings.map( v => [0, ((v-this._ticks[0])/range-0.5) * this._size[1]]);
	}


	/**
	 * Convert a [x,y] position, in pixel units, relative to the slider, into a rating.
	 *
	 * @name module:visual.Slider#_posToRating
	 * @private
	 * @param {number[]} pos_px - the [x,y] position, in pixel units, relative to the slider.
	 * @returns {number} the corresponding rating.
	 */
	_posToRating(pos_px)
	{
		const range = this._ticks[this._ticks.length - 1] - this._ticks[0];
		const size_px = util.to_px(this._size, this._units, this._win);
		if (this._isHorizontal())
		{
			return (pos_px[0] / size_px[0] + 0.5) * range + this._ticks[0];
		}// return ((pos_px[0]-this._pixi.position.x) / size_px[0] + 0.5) * range + this._ticks[0];
		else
		{
			return (1.0 - (pos_px[1] / size_px[1] + 0.5)) * range + this._ticks[0];
		}
		// return (pos_px[1] / size_px[1] + 0.5) * range + this._ticks[0];
		// return ((pos_px[1]-this._pixi.position.y) / size_px[1] + 0.5) * range + this._ticks[0];
	}


	/**
	 * Determine whether the slider is horizontal.
	 *
	 * <p>The slider is horizontal is its x-axis size is larger than its y-axis size.</p>
	 *
	 * @name module:visual.Slider#_isHorizontal
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
	TRIANGLE_MARKER: Symbol.for('TRIANGLE_MARKER'),
	SLIDER: Symbol.for('SLIDER'),
	WHITE_ON_BLACK: Symbol.for('WHITE_ON_BLACK'),
	LABELS45: Symbol.for('LABELS45'),
	RADIO: Symbol.for('RADIO')
};
