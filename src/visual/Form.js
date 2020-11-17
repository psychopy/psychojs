/**
 * Form Stimulus.
 *
 * @author Alain Pitiot
 * @version 2020.2
 * @copyright (c) 2017-2020 Ilixa Ltd. (http://ilixa.com) (c) 2020 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */


import {Color} from '../util/Color';
import {ColorMixin} from '../util/ColorMixin';
import * as util from '../util/Util';
import {TrialHandler} from '../data/TrialHandler';
import {TextStim} from './TextStim';
import {TextBox} from './TextBox';
import {VisualStim} from './VisualStim';
import {Slider} from './Slider';



/**
 * Form stimulus.
 *
 * @name module:visual.Form
 * @class
 * @extends module:visual.VisualStim
 * @mixes module:util.ColorMixin
 *
 * @param {Object} options
 * @param {String} options.name - the name used when logging messages from this stimulus
 * @param {module:core.Window} options.win - the associated Window
 * @param {number[]} [options.pos= [0, 0]] - the position of the center of the slider
 * @param {number[]} options.size - the size of the slider, e.g. [1, 0.1] for an horizontal slider
 * @param {string} [options.units= 'height'] - the units of the Slider position, and font size
 *
 * @param {Color} [options.color= Color('LightGray')] the color of the slider
 * @param {number} [options.contrast= 1.0] - the contrast of the slider
 * @param {number} [options.opacity= 1.0] - the opacity of the slider
 * @param {number} [options.depth= 0] - the depth (i.e. the z order), note that the text, radio buttons and slider elements are at depth + 1
 *
 * @param {number[]} [options.items= []] - the array of labels
 * @param {number} [options.itemPadding= 0.05] - the granularity
 *
 * @param {string} [options.fontFamily= 'Helvetica'] - the text font
 * @param {boolean} [options.bold= true] - whether or not the font of the labels is bold
 * @param {boolean} [options.italic= false] - whether or not the font of the labels is italic
 * @param {number} [options.fontSize] - the font size of the labels (in form units), the default fontSize
 * depends on the Form units: 14 for 'pix', 0.03 otherwise
 *
 * @param {PIXI.Graphics} [options.clipMask= null] - the clip mask
 * @param {boolean} [options.autoDraw= false] - whether or not the stimulus should be automatically drawn on every
 *   frame flip
 * @param {boolean} [options.autoLog= false] - whether or not to log
 */
export class Form extends util.mix(VisualStim).with(ColorMixin)
{
	constructor({name, win, pos, size, units, color, contrast, opacity, depth, items, randomize, itemPadding, fontFamily, bold, italic, fontSize, clipMask, autoDraw, autoLog} = {})
	{
		super({name, win, units, opacity, depth, pos, size, clipMask, autoDraw, autoLog});

		this._addAttribute(
			'itemPadding',
			itemPadding,
			util.to_unit([20, 0], 'pix', win, this._units)[0],
			this._onChange(true, false)
		);

		// colors:
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

		// fonts:
		this._addAttribute(
			'fontFamily',
			fontFamily,
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
			false,
			this._onChange(true, true)
		);
		this._addAttribute(
			'italic',
			italic,
			false,
			this._onChange(true, true)
		);

		// callback to deal with changes to items:
		const onItemChange = () =>
		{
			// reprocess the items:
			this._processItems();

			// setup the stimuli:
			this._setupStimuli();

			this._onChange(true, true)();
		};

		this._addAttribute(
			'items',
			items,
			[],
			onItemChange);
		this._addAttribute(
			'randomize',
			randomize,
			false,
			onItemChange);


		this._scrollbarWidth = 0.02;
		this._responseTextHeightRatio = 0.8;

		// process the items:
		this._processItems();

		// setup the stimuli:
		this._setupStimuli();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}



	/**
	 * Force a refresh of the stimulus.
	 *
	 * @name module:visual.Form#refresh
	 * @function
	 * @public
	 */
	refresh()
	{
		super.refresh();

		for (let i = 0; i < this._items.length; ++i)
		{
			const textStim = this._visual.textStims[i];
			textStim.refresh();

			const responseStim = this._visual.responseStims[i];
			if (responseStim)
			{
				responseStim.refresh();
			}
		}
	}



	/**
	 * Overridden draw that also calls the draw method of all form elements.
	 *
	 * @name module:visual.Form#draw
	 * @function
	 * @public
	 * @override
	 */
	draw()
	{
		// if the scrollbar's marker position has changed then the layout must be updated:
		if (this._scrollbar.markerPos !== this._prevScrollbarMarkerPos)
		{
			this._prevScrollbarMarkerPos = this._scrollbar.markerPos;
			this._needUpdate = true;
		}

		// draw the decorations:
		super.draw();

		// draw the stimuli:
		for (let i = 0; i < this._items.length; ++i)
		{
			if (this._visual.visibles[i])
			{
				const textStim = this._visual.textStims[i];
				textStim.draw();

				const responseStim = this._visual.responseStims[i];
				if (responseStim)
				{
					responseStim.draw();
				}
			}
		}

		// draw the scrollbar:
		this._scrollbar.draw();
	}



	/**
	 * Overridden hide that also calls the hide method of all form elements.
	 *
	 * @name module:visual.Form#hide
	 * @function
	 * @public
	 * @override
	 */
	hide()
	{
		// hide the decorations:
		super.hide();

		// hide the stimuli:
		if (typeof this._items !== 'undefined')
		{
			for (let i = 0; i < this._items.length; ++i)
			{
				if (this._visual.visibles[i])
				{
					const textStim = this._visual.textStims[i];
					textStim.hide();

					const responseStim = this._visual.responseStims[i];
					if (responseStim)
					{
						responseStim.hide();
					}
				}
			}

			// hide the scrollbar:
			this._scrollbar.hide();
		}
	}



	/**
	 * Reset the form.
	 *
	 * @name module:visual.Form#reset
	 * @function
	 * @public
	 */
	reset()
	{
		this.psychoJS.logger.debug('reset Form: ', this._name);

		// reset the stimuli:
		for (let i = 0; i < this._items.length; ++i)
		{
			const textStim = this._visual.textStims[i];
			textStim.reset();

			const responseStim = this._visual.responseStims[i];
			if (responseStim)
			{
				responseStim.reset();
			}
		}

		this._needUpdate = true;
	}



	/**
	 * Collate the questions and responses into a single dataset.
	 *
	 * @name module:visual.Form#getData
	 * @function
	 * @public
	 * @return {object} - the dataset with all questions and responses.
	 */
	getData()
	{
		let nbIncompleteResponse = 0;

		for (let i = 0; i < this._items.length; ++i)
		{
			const item = this._items[i];
			const responseStim = this._visual.responseStims[i];
			if (responseStim)
			{
				if (item.type === Form.Types.CHOICE || item.type === Form.Types.RATING)
				{
					item.response = responseStim.getRating();
					item.rt = responseStim.getRT();

					if (typeof item.response === 'undefined')
					{
						++ nbIncompleteResponse;
					}
				}
				else if (item.type === Form.Types.FREE_TEXT)
				{
					item.response = responseStim.text;
					item.rt = undefined;

					if (item.response.length === 0)
					{
						++ nbIncompleteResponse;
					}
				}
			}
		}

		this._items._complete = (nbIncompleteResponse === 0);


		// return a copy of this._items:
		return this._items.map(item => Object.assign({}, item));
	}



	/**
	 * Add the form data to the given experiment.
	 *
	 * @name module:visual.Form#addDataToExp
	 * @function
	 * @public
	 * @param {module:data.ExperimentHandler} experiment - the experiment into which to insert the form data
	 * @param {string} [format= 'rows'] - whether to insert the data as rows or as columns
	 */
	addDataToExp(experiment, format = 'rows')
	{
		const addAsColumns = ['cols', 'columns'].includes(format.toLowerCase());
		const data = this.getData();

		const _doNotSave = [
			'itemCtrl', 'responseCtrl',
			'itemColor', 'options', 'ticks', 'tickLabels',
				'responseWidth', 'responseColor', 'layout'
		];

		for (const item of this.getData())
		{
			let index = 0;
			for (const field in item)
			{
				if (!_doNotSave.includes(field))
				{
					const columnName = (addAsColumns) ? `${this._name}[${index}]${field}` : `${this._name}${field}`;
					experiment.addData(columnName, item[field]);
				}
				++ index;
			}

			if (!addAsColumns)
			{
				experiment.nextEntry();
			}
		}

		if (addAsColumns)
		{
			experiment.nextEntry();
		}
	}



	/**
	 * Import and process the form items from either a spreadsheet resource files (.csv, .xlsx, etc.) or from an array.
	 *
	 * @name module:visual.Form#_processItems
	 * @function
	 * @private
	 */
	_processItems()
	{
		const response = {
			origin: 'Form._processItems',
			context: 'when processing the form items'
		};

		try
		{
			if (this._autoLog)
			{
				// note: we use the same log message as PsychoPy even though we called this method differently
				this._psychoJS.experimentLogger.exp('Importing items...');
			}

			// import the items:
			this._importItems();

			// sanitize the items (check that keys are valid, fill in default values):
			this._sanitizeItems();

			// randomise the items if need be:
			if (this._randomize)
			{
				util.shuffle(this._items);
			}
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, {error});
		}
	}



	/**
	 * Import the form items from either a spreadsheet resource files (.csv, .xlsx, etc.) or from an array.
	 *
	 * @name module:visual.Form#_importItems
	 * @function
	 * @private
	 */
	_importItems()
	{
		const response = {
			origin: 'Form._importItems',
			context: 'when importing the form items'
		};

		try
		{
			const itemsType = typeof this._items;

			// we treat undefined items as a list with a single default entry:
			if (itemsType === 'undefined')
			{
				this._items = [Form._defaultItems];
			}

			// if items is a string, we treat it as the name of a resource file and import it:
			else if (itemsType === 'string')
			{
				this._items = TrialHandler.importConditions(this._psychoJS.serverManager, this._items);
			}

			// unknown items type:
			else
			{
				throw `unable to import items of unknown type: ${itemsType}`;
			}

			// if items is an empty array, we replace with a single default entry:
			if (Array.isArray(this._items) && this._items.length === 0)
			{
				this._items = [Form._defaultItems];
			}

		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, {error});
		}
	}



	/**
	 * Sanitize the form items: check that the keys are valid, and fill in default values.
	 *
	 * @name module:visual.Form#_sanitizeItems
	 * @function
	 * @private
	 */
	_sanitizeItems()
	{
		const response = {
			origin: 'Form._sanitizeItems',
			context: 'when sanitizing the form items'
		};

		try
		{
			// convert old style questionnaire to new style:
			for (const item of this._items)
			{
				// old style forms have questionText instead of itemText:
				if (typeof item.questionText !== 'undefined')
				{
					item.itemText = item.questionText;
					delete item.questionText;

					item.itemWidth = item.questionWidth;
					delete item.questionWidth;

					// for items of type 'rating, the ticks are in 'options' instead of in 'ticks':
					if (item.type === 'rating')
					{
						item.ticks = item.options;
						item.options = undefined;
					}

				}
			}

			// fill in missing keys and undefined values:
			const defaultKeys = Object.keys(Form._defaultItems);
			const missingKeys = new Set();
			for (const item of this._items)
			{
				const itemKeys = Object.keys(item);
				for (const key of defaultKeys)
				{
					// missing key:
					if (!itemKeys.includes(key))
					{
						missingKeys.add(key);
						item[key] = Form._defaultItems[key];
					}

					// undefined value:
					else if (typeof item[key] === 'undefined')
					{
						// TODO: options = '' for FREE_TEXT
						item[key] = Form._defaultItems[key];
					}
				}
			}

			if (missingKeys.size > 0)
			{
				this._psychoJS.logger.warn(`Missing headers: ${Array.from(missingKeys).join(', ')}\nNote, headers are case sensitive and must match: ${Array.from(defaultKeys).join(', ')}`);
			}


			// check the types and options:
			const formTypes = Object.getOwnPropertyNames(Form.Types);
			for (const item of this._items)
			{
				// convert type to upper case, replace spaces by underscores
				item.type = item.type.toUpperCase().replace(' ', '_');

				// check that the type is valid:
				if (!formTypes.includes(item.type))
				{
					throw `${item.type} is not a valid type for item: ${item.itemText}`;
				}

				// convert item type to symbol:
				item.type = Symbol.for(item.type);

				// turn the option into an array and check length, where applicable:
				if (item.type === Form.Types.CHOICE)
				{
					item.options = item.options.split(',');
					if (item.options.length < 2)
					{
						throw `at least two choices should be provided for choice item: ${item.itemText}`;
					}
				}

				// turn the ticks and tickLabels into arrays, where applicable:
				else if (item.type === Form.Types.RATING)
				{
					item.ticks = item.ticks.split(',').map( (_,t) => parseInt(t) );
					item.tickLabels = (item.tickLabels.length > 0) ? item.tickLabels.split(',') : [];
				}

				// TODO
				// estimate potentially missing itemWidth or responseWidth
				// solve conflicts when itemWidth + responseWidth != 1
			}

			// check the layout:
			const formLayouts = ['HORIZ', 'VERT'];
			for (const item of this._items)
			{
				// convert layout to upper case:
				item.layout = item.layout.toUpperCase();

				// check that the layout is valid:
				if (!formLayouts.includes(item.layout))
				{
					throw `${item.layout} is not a valid layout for item: ${item.itemText}`;
				}

				// convert item layout to symbol:
				item.layout = (item.layout === 'HORIZ') ? Form.Layout.HORIZONTAL : Form.Layout.VERTICAL;
			}
		}
		catch (error)
		{
			// throw { ...response, error };
			throw Object.assign(response, {error});
		}
	}



	/**
	 * Estimate the bounding box.
	 *
	 * @name module:visual.Form#_estimateBoundingBox
	 * @function
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		// take the alignment into account:
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - this._size[0] / 2.0,
			this._pos[1] - this._size[1] / 2.0,
			this._size[0],
			this._size[1]
		);
	}



	/**
	 * Setup the stimuli, and the scrollbar.
	 *
	 * @name module:visual.Form#_setupStimuli
	 * @function
	 * @private
	 */
	_setupStimuli()
	{
		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Setting layout of Form: ${this.name}`);
		}

		// clean up the previously setup stimuli:
		if (typeof this._visual !== 'undefined')
		{
			for (const textStim of this._visual.textStims)
			{
				textStim.release();
			}
			for (const responseStim of this._visual.responseStims)
			{
				responseStim.release();
			}
		}

		// visual representations of the items:
		this._visual = {
			rowHeights: [],
			textStims: [],
			responseStims: [],
			visibles: [],
			stimuliTotalHeight: 0
		};

		// instantiate the clip mask that will be used by all stimuli:
		this._stimuliClipMask = new PIXI.Graphics();


		// default stimulus options:
		const textStimOption = {
			win: this._win,
			name: 'item text',
			font: 'Arial',
			units: this._units,
			alignHoriz: 'left',
			alignVert: 'top',
			height: this._fontSize,
			color: 'white',
			ori: 0,
			opacity: 1,
			depth: this._depth + 1,
			clipMask: this._stimuliClipMask
		};
		const sliderOption = {
			win: this._win,
			name: 'choice response',
			units: this._units,
			flip: false,
			fontFamily: 'Arial',
			bold: false,
			italic: false,
			fontSize: this._fontSize * this._responseTextHeightRatio,
			color: this._color,
			opacity: 1,
			depth: this._depth + 1,
			clipMask: this._stimuliClipMask,
			granularity: 1
		};
		const textBoxOption = {
			win: this._win,
			name: 'free text response',
			units: this._units,
			anchor: 'left-top',
			flip: false,
			opacity: 1,
			depth: this._depth + 1,
			font: 'Arial',
			letterHeight: this._fontSize * this._responseTextHeightRatio,
			bold: false,
			italic: false,
			alignment: 'left',
			color: this._color,
			contrast: 1.0,
			borderColor: this._color,
			borderWidth: 0.002,
			padding: 0.01,
			editable: true,
			clipMask: this._stimuliClipMask
		};

		// we use for the slider's tick size the height of a word:
		const textStim = new TextStim(Object.assign(textStimOption, { text: 'Ag', pos: [0, 0]}));
		const textMetrics_px = textStim.getTextMetrics();
		const sliderTickSize = this._getLengthUnits(textMetrics_px.height) / 2;
		textStim.release(false);


		let stimulusOffset = - this._itemPadding;
		for (const item of this._items)
		{
			// initially, all items are invisible:
			this._visual.visibles.push(false);

			// estimate row width:
			// - heading: <padding> + <item> + <padding> + <scrollbar> = this._size[0]
			// - description: <padding> + <item> + <padding> + <scrollbar> = this._size[0]
			// - choice with vert layout: <padding> + <item> + <padding> + <scrollbar> = this._size[0]
			let rowWidth;
			if (item.type === Form.Types.HEADING || item.type === Form.Types.DESCRIPTION ||
				(item.type === Form.Types.CHOICE && item.layout === Form.Layout.VERTICAL))
			{
				rowWidth = (this._size[0] - this._itemPadding * 2 - this._scrollbarWidth);
			}
			// - anything else: <padding> + <item> + <padding> + <response> + <padding> + <scrollbar> = this._size[0]
			else
			{
				rowWidth = (this._size[0] - this._itemPadding * 3 - this._scrollbarWidth);
			}

			// item text
			const itemWidth = rowWidth *  item.itemWidth;
			const textStim = new TextStim(
				Object.assign(textStimOption, {
					text: item.itemText,
					wrapWidth: itemWidth
				}));
			textStim._relativePos = [this._itemPadding, stimulusOffset];
			const textHeight = textStim.boundingBox.height;
			this._visual.textStims.push(textStim);

			// item response:
			let responseStim = null;
			let responseHeight = 0;
			let compact;
			let flip;
			const responseWidth = rowWidth * item.responseWidth;

			// CHOICE and RATING
			if (item.type === Form.Types.CHOICE || item.type === Form.Types.RATING)
			{
				let sliderSize;
				if (item.layout === Form.Layout.HORIZONTAL)
				{
					sliderSize = [responseWidth, sliderTickSize];
					compact = true;
					flip = false;
				}
				else
				{
					sliderSize = [sliderTickSize, (sliderTickSize*1.5) * item.options.length];
					compact = false;
					flip = true;
				}

				let style, labels, ticks;
				if (item.type === Form.Types.CHOICE)
				{
					style = [Slider.Style.RATING, Slider.Style.RADIO];
					labels = item.options;
					ticks = []; // categorical
				}
				else
				{
					style = [Slider.Style.RATING];
					labels = item.tickLabels;
					ticks = item.ticks;
				}

				responseStim = new Slider(
					Object.assign(sliderOption, {
						size: sliderSize,
						style,
						labels,
						ticks,
						compact,
						flip
					})
				);
				responseHeight = responseStim.boundingBox.height;
				if (item.layout === Form.Layout.HORIZONTAL)
				{
					responseStim._relativePos = [
						this._itemPadding * 2 + itemWidth + responseWidth / 2,
						stimulusOffset
						//- Math.max(0, (textHeight - responseHeight) / 2) // (vertical centering)
					];
				}
				else
				{
					responseStim._relativePos = [
						this._itemPadding * 2 + itemWidth, //this._itemPadding + sliderTickSize,
						stimulusOffset - responseHeight / 2 - textHeight - this._itemPadding
					];

					// since rowHeight will be the max of itemHeight and responseHeight, we need to alter responseHeight
					// to account for the fact that the response is below the item text:
					responseHeight += textHeight + this._itemPadding;
				}
			}

			// FREE TEXT
			else if (item.type === Form.Types.FREE_TEXT)
			{
				responseStim = new TextBox(
					Object.assign(textBoxOption, {
						text: item.options,
						size: [responseWidth, -1]
					})
				);
				responseHeight = responseStim.boundingBox.height;
				responseStim._relativePos = [
					this._itemPadding * 2 + itemWidth,
					stimulusOffset
				];
			}

			this._visual.responseStims.push(responseStim);

			const rowHeight = Math.max(textHeight, responseHeight);
			this._visual.rowHeights.push(rowHeight);

			stimulusOffset -= rowHeight + this._itemPadding;
		}
		this._visual.stimuliTotalHeight = stimulusOffset;


		// scrollbar:
		this._scrollbar = new Slider({
			win: this._win,
			name: 'scrollbar',
			units: this._units,
			color: this._color,
			depth: this._depth + 1,
			pos: [0, 0],
			size: [this._scrollbarWidth, this._size[1]],
			style: [Slider.Style.SLIDER],
			ticks: [0, -this._visual.stimuliTotalHeight / this._size[1]],
		});
		this._prevScrollbarMarkerPos = 0;
		this._scrollbar.setMarkerPos(this._prevScrollbarMarkerPos);


		// estimate the bounding box:
		this._estimateBoundingBox();


		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Layout set for: ${this.name}`);
		}
	}



	/**
	 * Update the form visual representation, if necessary.
	 *
	 * This estimate which stimuli are visible, and updates the decorations.
	 *
	 * @name module:visual.Slider#_updateIfNeeded
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


		// calculate the edges of the form and various other sizes, in various units:
		this._leftEdge = this._pos[0] - this._size[0] / 2.0;
		this._rightEdge = this._pos[0] + this._size[0] / 2.0;
		this._topEdge = this._pos[1] + this._size[1] / 2.0;
		this._bottomEdge = this._pos[1] - this._size[1] / 2.0;

		[this._leftEdge_px, this._topEdge_px] = util.to_px(
			[this._leftEdge, this._topEdge],
			this.units,
			this.win,
			true);
		[this._rightEdge_px, this._bottomEdge_px] = util.to_px(
			[this._rightEdge, this._bottomEdge],
			this.units,
			this.win,
			true);
		this._itemPadding_px = this._getLengthPix(this._itemPadding);
		this._scrollbarWidth_px = this._getLengthPix(this._scrollbarWidth, true);
		this._size_px = util.to_px(this._size, this.units, this.win, true);


		// update the stimuli clip mask
		// note: the clip mask is in screen coordinates
		this._stimuliClipMask.clear();
		this._stimuliClipMask.beginFill(0xFFFFFF);
		this._stimuliClipMask.drawRect(
			this._win._rootContainer.position.x + this._leftEdge_px + 2,
			this._win._rootContainer.position.y + this._bottomEdge_px + 2,
			this._size_px[0] - 4,
			this._size_px[1] - 6
		);
		this._stimuliClipMask.endFill();


		// position the scrollbar and get the scrollbar offset, in form units:
		this._scrollbar.setPos([this._rightEdge - this._scrollbarWidth / 2, this._pos[1]], false);
		this._scrollbar.setOpacity(0.5);
		this._scrollbarOffset = this._prevScrollbarMarkerPos * (this._visual.stimuliTotalHeight + this._size[1]) / (-this._visual.stimuliTotalHeight / this._size[1]);

		// update decorations and stimuli:
		this._updateVisibleStimuli();
		this._updateDecorations();
	}



	/**
	 * Update the visible stimuli.
	 *
	 * @name module:visual.Form#_updateVisibleStimuli
	 * @function
	 * @private
	 */
	_updateVisibleStimuli()
	{
		for (let i = 0; i < this._items.length; ++i)
		{
			// a. item text
			const textStim = this._visual.textStims[i];
			const textStimPos = [
				this._leftEdge + textStim._relativePos[0],
				this._topEdge + textStim._relativePos[1] - this._scrollbarOffset
			];
			textStim.setPos(textStimPos);

			// b. response:
			const responseStim = this._visual.responseStims[i];
			if (responseStim)
			{
				const responseStimPos = [
					this._leftEdge + responseStim._relativePos[0],
					this._topEdge + responseStim._relativePos[1] - this._scrollbarOffset
				];
				responseStim.setPos(responseStimPos);
			}

			// if the stimuli fall within the form area, we make them visible:
			if (textStimPos[1] > this._bottomEdge && textStimPos[1] - this._visual.rowHeights[i] <= this._topEdge)
			{
				this._visual.visibles[i] = true;
			}
			// otherwise, we make them invisible:
			else
			{
				// if the stimulus was previously visible, we need to hide it:
				if (this._visual.visibles[i])
				{
					textStim.hide();
					if (responseStim)
					{
						responseStim.hide();
					}
				}

				this._visual.visibles[i] = false;
			}
		}

	}



	/**
	 * Update the form decorations (bounding box, lines between items, etc.)
	 *
	 * @name module:visual.Form#_updateDecorations
	 * @function
	 * @private
	 */
	_updateDecorations()
	{
		if (typeof this._pixi !== 'undefined')
		{
			this._pixi.destroy(true);
		}

		this._pixi = new PIXI.Graphics();
		this._pixi.scale.x = 1;
		this._pixi.scale.y = 1;
		this._pixi.rotation = 0;
		this._pixi.position = util.to_pixiPoint(this.pos, this.units, this.win);

		this._pixi.alpha = this._opacity;
		this._pixi.zIndex = this._depth;

		// apply the form clip mask (n.b., that is not the stimuli clip mask):
		this._pixi.mask = this._clipMask;


		// form background:
		this._pixi.lineStyle(1, new Color('lightgray').int, this._opacity, 0.5);
		// this._decorations.beginFill(this._barFillColor.int, this._opacity);
		this._pixi.drawRect(this._leftEdge_px, this._bottomEdge_px, this._size_px[0], this._size_px[1]);
		// this._decorations.endFill();


		// item decorators:
		this._decorations = new PIXI.Graphics();
		this._pixi.addChild(this._decorations);
		this._decorations.mask = this._stimuliClipMask;
		this._decorations.lineStyle(1, new Color('gray').int, this._opacity, 0.5);
		this._decorations.alpha = 0.5;

		for (let i = 0; i < this._items.length; ++i)
		{
			if (this._visual.visibles[i])
			{
				const item = this._items[i];
				// background for headings and descriptions:
				if (item.type === Form.Types.HEADING || item.type === Form.Types.DESCRIPTION)
				{
					const textStim = this._visual.textStims[i];
					const textStimPos = [
						this._leftEdge + textStim._relativePos[0],
						this._topEdge + textStim._relativePos[1] - this._scrollbarOffset
					];
					const textStimPos_px = util.to_px(textStimPos, this._units, this._win);
					this._decorations.beginFill(new Color('darkgray').int);
					this._decorations.drawRect(
						textStimPos_px[0] - this._itemPadding_px / 2,
						textStimPos_px[1] + this._itemPadding_px / 2,
						this._size_px[0] - this._itemPadding_px - this._scrollbarWidth_px,
						-this._getLengthPix(this._visual.rowHeights[i]) - this._itemPadding_px
					);
					this._decorations.endFill();
				}
			}
		}


	}
}



/**
 * Form item types.
 *
 * @enum {Symbol}
 * @readonly
 * @public
 */
Form.Types = {
	HEADING: Symbol.for('HEADING'),
	DESCRIPTION: Symbol.for('DESCRIPTION'),
	RATING: Symbol.for('RATING'),
	SLIDER: Symbol.for('SLIDER'),
	FREE_TEXT: Symbol.for('FREE_TEXT'),
	CHOICE: Symbol.for('CHOICE')
};



/**
 * Form item layout.
 *
 * @enum {Symbol}
 * @readonly
 * @public
 */
Form.Layout = {
	HORIZONTAL: Symbol.for('HORIZONTAL'),
	VERTICAL: Symbol.for('VERTICAL')
};



/**
 * Default form item.
 *
 * @readonly
 * @private
 *
 */
Form._defaultItems = {
	'itemText': 'Default question',
	'type': 'rating',
	'options': 'Yes, No',
	'tickLabels': '',
	'itemWidth': 0.7,
	'itemColor': 'white',

	'responseWidth': 0.3,
	'responseColor': 'white',

	'index': 0,
	'layout': 'horiz'
};


