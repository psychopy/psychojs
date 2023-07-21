/**
* @desc Side By Side matrix.
* */

const CELL_TYPES = {
	DROP_DOWN: "dropdown",
	RADIO: "radio",
	CHECKBOX: "checkbox",
	TEXT: "text"
};

class SideBySideMatrix
{
	constructor (cfg = {})
	{
		// surveyCSS contains css class names provided by the applied theme
		// INCLUDING those added/modified by application's code.
		const surveyCSS = cfg.question.css;
		this._CSS_CLASSES = {
			WRAPPER: `${surveyCSS.matrix.tableWrapper} sbs-matrix`,
			TABLE: surveyCSS.matrix.root,
			TABLE_ROW: surveyCSS.matrixdropdown.row,
			TABLE_HEADER_CELL: surveyCSS.matrix.headerCell,
			TABLE_CELL: surveyCSS.matrix.cell,
			INPUT_TEXT: surveyCSS.text.root,
			LABEL: surveyCSS.matrix.label,
			ITEM_CHECKED: surveyCSS.matrix.itemChecked,
			ITEM_VALUE: surveyCSS.matrix.itemValue,
			ITEM_DECORATOR: surveyCSS.matrix.materialDecorator,
			RADIO: surveyCSS.radiogroup.item,
			SELECT: surveyCSS.dropdown.control,
			CHECKBOX: surveyCSS.checkbox.item,
			CHECKBOX_CONTROL: surveyCSS.checkbox.itemControl,
			CHECKBOX_DECORATOR: surveyCSS.checkbox.materialDecorator,
			CHECKBOX_DECORATOR_SVG: surveyCSS.checkbox.itemDecorator
		};
		this._question = cfg.question;
		this._DOM = cfg.el;
		this._DOM.classList.add(...this._CSS_CLASSES.WRAPPER.split(" "));

		this._bindedHandlers = {
			_handleInput: this._handleInput.bind(this),
			_handleSelectChange: this._handleSelectChange.bind(this)
		};

		this._init(this._question, this._DOM);
	}

	static CELL_GENERATORS =
	{
		[CELL_TYPES.DROP_DOWN]: "_generateDropdownCells",
		[CELL_TYPES.RADIO]: "_generateRadioCells",
		[CELL_TYPES.CHECKBOX]: "_generateCheckboxCells",
		[CELL_TYPES.TEXT]: "_generateTextInputCells",
	};

	_generateDropdownCells (row, col, subColumns, CSS_CLASSES)
	{
		let bodyCells = "";
		let selectOptions = "<option value=\"\"></option>";
		let i;
		for (i = 0; i < subColumns.length; i++)
		{
			selectOptions += `<option value="${subColumns[i].value}">${subColumns[i].text}</option>`;
		}
		bodyCells =
		`<td class="${CSS_CLASSES.TABLE_CELL}">
		<select class="${CSS_CLASSES.SELECT}" name="${row.value}-${col.value}">${selectOptions}</select>
		</td>`;
		return bodyCells;
	}

	_generateRadioCells (row, col, subColumns, CSS_CLASSES)
	{
		let bodyCells = "";
		let i;
		for (i = 0; i < subColumns.length; i++)
		{
			bodyCells +=
			`<td class="${CSS_CLASSES.TABLE_CELL}">
			<label class="${CSS_CLASSES.LABEL}">
				<input class="${CSS_CLASSES.ITEM_VALUE}" type="${col.cellType}" name="${row.value}-${col.value}" value="${subColumns[i].value}">
				<span class="${CSS_CLASSES.ITEM_DECORATOR}"></span>
			</label>
			</td>`;
		}
		return bodyCells;
	}

	_generateCheckboxCells (row, col, subColumns, CSS_CLASSES)
	{
		let bodyCells = "";
		let i;
		for (i = 0; i < subColumns.length; i++)
		{
			bodyCells +=
			`<td class="${CSS_CLASSES.TABLE_CELL}">
			<label class="${CSS_CLASSES.LABEL}">
				<input class="${CSS_CLASSES.CHECKBOX_CONTROL}" type="${col.cellType}" name="${row.value}-${col.value}-${subColumns[i].value}">
				<span class="${CSS_CLASSES.CHECKBOX_DECORATOR}">
					<svg class="${CSS_CLASSES.CHECKBOX_DECORATOR_SVG}">
						<use data-bind="attr:{'xlink:href':question.itemSvgIcon}" xlink:href="#icon-v2check"></use>
					</svg>
				</span>
			</label>
			</td>`;
		}
		return bodyCells;
	}

	_generateTextInputCells (row, col, subColumns, CSS_CLASSES)
	{
		let bodyCells = "";
		let i;
		for (i = 0; i < subColumns.length; i++)
		{
			bodyCells +=
			`<td class="${CSS_CLASSES.TABLE_CELL}">
			<input class="${CSS_CLASSES.INPUT_TEXT}" type="${col.cellType}" name="${row.value}-${col.value}-${subColumns[i].value}">
			</td>`;
		}
		return bodyCells;
	}

	_ensureQuestionValueFields (row, col)
	{
		if (this._question.value === undefined)
		{
			this._question.value = {};
		}

		if (this._question.value[row] === undefined)
		{
			this._question.value[row] = {
				[col]: {}
			}
		}

		if (this._question.value[row][col] === undefined)
		{
			this._question.value[row][col] = {};
		}
	}

	_handleInput (e)
	{
		const valueCoordinates = e.currentTarget.name.split("-");
		const row = valueCoordinates[0];
		const col = valueCoordinates[1];
		const subCol = valueCoordinates[2] !== undefined ? valueCoordinates[2] : e.currentTarget.value;
		this._ensureQuestionValueFields(row, col);

		if (e.currentTarget.type === "text")
		{
			this._question.value[row][col][subCol] = e.currentTarget.value;
		}
		else if (e.currentTarget.type === "radio")
		{
			this._question.value[row][col] = e.currentTarget.value;
		}
		else if (e.currentTarget.type === "checkbox")
		{
			this._question.value[row][col][subCol] = e.currentTarget.checked;
		}

		// Triggering internal SurveyJS mechanism for value update.
		this._question.value = this._question.value;
	}

	_handleSelectChange (e)
	{
		const valueCoordinates = e.currentTarget.name.split("-");
		const row = valueCoordinates[0];
		const col = valueCoordinates[1];
		this._ensureQuestionValueFields(row, col);
		this._question.value[row][col]= e.currentTarget.value;
		// Triggering internal SurveyJS mechanism for value update.
		this._question.value = this._question.value;
	}

	_init (question, el)
	{
		let t = performance.now();
		const CSS_CLASSES = this._CSS_CLASSES;
		// TODO: Find out how it actually composed inside SurveyJS.
		if (question.css.matrix.mainRoot)
		{
			// Replacing default mainRoot class with those used in matrix type questions, to achieve proper styling and overflow behavior
			const rootClass = `${question.css.matrix.mainRoot} ${question.cssClasses.withFrame || ""}`;
			question.setCssRoot(rootClass);
			question.cssClasses.mainRoot = rootClass;
		}
		let html;
		let headerCells = "";
		let subHeaderCells = "";
		let bodyCells = "";
		let bodyHTML = "";
		let cellGenerator;
		let i, j;

		// Header generation
		for (i = 0; i < question.columns.length; i++)
		{
			if (question.columns[i].cellType !== CELL_TYPES.DROP_DOWN)
			{
				headerCells +=
				`<th class="${CSS_CLASSES.TABLE_HEADER_CELL}" colspan="${question.columns[i].subColumns.length}">
				${question.columns[i].title}
				</th>`;
				for (j = 0; j < question.columns[i].subColumns.length; j++)
				{
					subHeaderCells += `<th
					class="${CSS_CLASSES.TABLE_HEADER_CELL} sbs-matrix-header-cell--${question.columns[i].cellType}">
					${question.columns[i].subColumns[j].text}
					</th>`;
				}
			}
			else
			{
				headerCells +=
				`<th class="${CSS_CLASSES.TABLE_HEADER_CELL}">
				${question.columns[i].title}
				</th>`;
				subHeaderCells += `<td class="${CSS_CLASSES.TABLE_HEADER_CELL} sbs-matrix-header-cell--${question.columns[i].cellType}"></td>`;
			}
			headerCells += "<td></td>";
			subHeaderCells += "<td></td>";
		}

		// Body generation
		for (i = 0; i < question.rows.length; i++)
		{
			bodyCells = "";
			for (j = 0; j < question.columns.length; j++)
			{
				cellGenerator = this[SideBySideMatrix.CELL_GENERATORS[question.columns[j].cellType]];
				if (typeof cellGenerator === "function")
				{
					// Passing rows, columns, subColumns as separate arguments
					// to make generatorrs independent from table data-structure.
					bodyCells += `${cellGenerator.call(this, question.rows[i], question.columns[j], question.columns[j].subColumns, CSS_CLASSES)}<td></td>`;
				}
				else
				{
					console.log("No cell generator found for cellType", question.columns[j].cellType);
				}
			}
			bodyHTML += `<tr class="${CSS_CLASSES.TABLE_ROW}"><td class="${CSS_CLASSES.TABLE_CELL}">${question.rows[i].text}</td><td></td>${bodyCells}</tr>`;
		}

		html = `<table class="${CSS_CLASSES.TABLE}">
		<thead>
		<tr><td></td><td></td>${headerCells}</tr>
		<tr><td></td><td></td>${subHeaderCells}</tr>
		</thead>
		<tbody>${bodyHTML}</tbody>
		</table>`;

		// console.log("sbs matrix generation took", performance.now() - t);
		el.insertAdjacentHTML("beforeend", html);

		let inputDOMS = el.querySelectorAll("input");
		let selectDOMS = el.querySelectorAll("select");

		for (i = 0; i < inputDOMS.length; i++)
		{
			inputDOMS[i].addEventListener("input", this._bindedHandlers._handleInput);
		}

		for (i = 0; i < selectDOMS.length; i++)
		{
			selectDOMS[i].addEventListener("change", this._bindedHandlers._handleSelectChange)
		}
	}
}

export default function init (Survey) {
	var widget = {
		//the widget name. It should be unique and written in lowcase.
		name: "sidebysidematrix",

		//the widget title. It is how it will appear on the toolbox of the SurveyJS Editor/Builder
		title: "Side by side matrix",

		//the name of the icon on the toolbox. We will leave it empty to use the standard one
		iconName: "",

		//If the widgets depends on third-party library(s) then here you may check if this library(s) is loaded
		widgetIsLoaded: function () {
			//return typeof $ == "function" && !!$.fn.select2; //return true if jQuery and select2 widget are loaded on the page
			return true; //we do not require anything so we just return true.
		},

		//SurveyJS library calls this function for every question to check, if it should use this widget instead of default rendering/behavior
		isFit: function (question) {
			//we return true if the type of question is sidebysidematrix
			return question.getType() === 'sidebysidematrix';
			//the following code will activate the widget for a text question with inputType equals to date
			//return question.getType() === 'text' && question.inputType === "date";
		},

		//Use this function to create a new class or add new properties or remove unneeded properties from your widget
		//activatedBy tells how your widget has been activated by: property, type or customType
		//property - it means that it will activated if a property of the existing question type is set to particular value, for example inputType = "date"
		//type - you are changing the behaviour of entire question type. For example render radiogroup question differently, have a fancy radio buttons
		//customType - you are creating a new type, like in our example "sidebysidematrix"
		activatedByChanged: function (activatedBy) {
			//we do not need to check acticatedBy parameter, since we will use our widget for customType only
			//We are creating a new class and derived it from text question type. It means that text model (properties and fuctions) will be available to us
			Survey.JsonObject.metaData.addClass("sidebysidematrix", [], null, "text");
			//signaturepad is derived from "empty" class - basic question class
			//Survey.JsonObject.metaData.addClass("signaturepad", [], null, "empty");

			//Add new property(s)
			//For more information go to https://surveyjs.io/Examples/Builder/?id=addproperties#content-docs
			Survey.JsonObject.metaData.addProperties("sidebysidematrix", [
				{
					name: "rows",
					isArray: true,
					default: []
				},
				{
					name: "columns",
					isArray: true,
					default: []
				}
			]);
		},

		//If you want to use the default question rendering then set this property to true. We do not need any default rendering, we will use our our htmlTemplate
		isDefaultRender: false,

		//You should use it if your set the isDefaultRender to false
		htmlTemplate: "<div></div>",

		//The main function, rendering and two-way binding
		afterRender: function (question, el) {
			new SideBySideMatrix({ question, el });
			// TODO: add readonly and enabled/disabled handlers.

			// let containers = el.querySelectorAll(".srv-slider-container");
			// let inputDOMS = el.querySelectorAll(".srv-slider");
			// let sliderDisplayDOMS = el.querySelectorAll(".srv-slider-display");
			// if (!(question.value instanceof Array))
			// {
			// 	question.value = new Array(inputDOMS.length);
			// 	question.value.fill(0);
			// }

			// for (i = 0; i < inputDOMS.length; i++)
			// {
			// 	inputDOMS[i].min = question.minVal;
			// 	inputDOMS[i].max = question.maxVal;
			// 	inputDOMS[i].addEventListener("input", (e) => {
			// 		let idx = parseInt(e.currentTarget.dataset.idx, 10);
			// 		question.value[idx] = parseFloat(e.currentTarget.value);
			// 		// using .value setter to trigger update properly.
			// 		// otherwise on survey competion it returns array of nulls.
			// 		question.value = question.value;
			// 		onValueChangedCallback();
			// 	});

			// 	// Handle grid lines?
			// }


			// function positionSliderDisplay (v, min, max, displayDOM)
			// {
			// 	v = parseFloat(v);
			// 	min = parseFloat(min);
			// 	max = parseFloat(max);
			// 	// Formula is (halfThumbWidth - v * (fullThumbWidth / 100)), taking into account that display has translate(-50%, 0).
			// 	// Size of thumb is set in CSS.
			// 	displayDOM.style.left = `calc(${(v - min) / (max - min) * 100}% + ${10 - v * 0.2}px)`
			// }


			// var onValueChangedCallback = function () {
			// 	let i;
			// 	let v;
			// 	for (i = 0; i < question.choices.length; i++)
			// 	{
			// 		v = question.value[i] || 0;
			// 		inputDOMS[i].value = v;
			// 		sliderDisplayDOMS[i].innerText = v;
			// 		positionSliderDisplay(v, question.minVal, question.maxVal, sliderDisplayDOMS[i]);
			// 	}
			// }

			// var onReadOnlyChangedCallback = function() {
			// 	let i;
			// 	if (question.isReadOnly) {
			// 		for (i = 0; i < question.choices.length; i++)
			// 		{
			// 			inputDOMS[i].setAttribute('disabled', 'disabled');
			// 		}
			// 	} else {
			// 		for (i = 0; i < question.choices.length; i++)
			// 		{
			// 			inputDOMS[i].removeAttribute("disabled");
			// 		}
			// 	}
			// };

			// if question becomes readonly/enabled add/remove disabled attribute
			// question.readOnlyChangedCallback = onReadOnlyChangedCallback;

			// if the question value changed in the code, for example you have changed it in JavaScript
			// question.valueChangedCallback = onValueChangedCallback;

			// set initial value
			// onValueChangedCallback();

			// make elements disabled if needed
			// onReadOnlyChangedCallback();
		},

		//Use it to destroy the widget. It is typically needed by jQuery widgets
		willUnmount: function (question, el) {
			//We do not need to clear anything in our simple example
			//Here is the example to destroy the image picker
			//var $el = $(el).find("select");
			//$el.data('picker').destroy();
		}
	}

	//Register our widget in singleton custom widget collection
	Survey.CustomWidgetCollection.Instance.addCustomWidget(widget, "customtype");
}
