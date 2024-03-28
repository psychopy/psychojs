/**
* @desc "MaxDiff" matrix.
* */

class MaxDiffMatrix
{
	constructor (cfg = {})
	{
		// surveyCSS contains css class names provided by the applied theme
		// INCLUDING those added/modified by application's code.
		const surveyCSS = cfg.question.css;
		this._CSS_CLASSES = {
			WRAPPER: `${surveyCSS.matrix.tableWrapper} matrix-maxdiff`,
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
			CHECKBOX: surveyCSS.checkbox.item
		};

		// const CSS_CLASSES = {
		// 	WRAPPER: "sv-matrix matrix-maxdiff",
		// 	TABLE: "sv-table sv-matrix-root",
		// 	TABLE_ROW: "sv-table__row",
		// 	TABLE_HEADER_CELL: "sv-table__cell sv-table__cell--header",
		// 	TABLE_CELL: "sv-table__cell sv-matrix__cell",
		// 	INPUT_TEXT: "sv-text",
		// 	RADIO: "sv-radio",
		// 	SELECT: "sv-dropdown",
		// 	CHECKBOX: "sv-checkbox"
		// };
		this._question = cfg.question;
		this._DOM = cfg.el;
		this._DOM.classList.add(...this._CSS_CLASSES.WRAPPER.split(" "));

		this._bindedHandlers =
		{
			_handleInput: this._handleInput.bind(this)
		};

		this._init(this._question, this._DOM);
	}

	_handleInput (e)
	{
		const valueCoordinates = e.currentTarget.name.split("-");
		const row = valueCoordinates[0];
		const col = parseInt(e.currentTarget.dataset.column, 10);
		const colRadioDOMS = this._DOM.querySelectorAll(`input[data-column="${col}"]`);

		if (this._question.value === undefined)
		{
			this._question.value = {};
		}

		const oldVal = this._question.value;
		const newVal = {[row]: col};

		// Handle case when exclusiveAnswer option is false?
		let inputRow;
		let i;
		for (i = 0; i < colRadioDOMS.length; i++)
		{
			if (colRadioDOMS[i] !== e.currentTarget)
			{
				colRadioDOMS[i].checked = false;
				inputRow = colRadioDOMS[i].name;
				// Preserving previously ticked columns within other rows
				if (oldVal[inputRow] !== undefined && oldVal[inputRow] !== col)
				{
					newVal[inputRow] = oldVal[inputRow];
				}
			}
		}

		this._question.value = newVal;
		console.log(row, col, this._question.value);
	}

	_init (question, el)
	{
		let t = performance.now();
		const CSS_CLASSES = this._CSS_CLASSES;
		if (question.css.matrix.mainRoot)
		{
			// Replacing default mainRoot class with those used in matrix type questions, to achieve proper styling and overflow behavior
			const rootClass = `${question.css.matrix.mainRoot} ${question.cssClasses.withFrame || ""}`;
			question.setCssRoot(rootClass);
			question.cssClasses.mainRoot = rootClass;
		}

		// Relying on a fact that there's always 2 columns.
		// This is correct according current Qualtrics design for MaxDiff matrices.
		// Header generation
		let headerCells =
		`<th class="${CSS_CLASSES.TABLE_HEADER_CELL}">${question.columns[0].text}</th>
		<td></td>
		<td></td>
		<td></td>
		<th class="${CSS_CLASSES.TABLE_HEADER_CELL}">${question.columns[1].text}</th>`;

		// Body generation
		let bodyHTML = "";
		for (let i = 0; i < question.rows.length; i++)
		{
			const bodyCells =
			`<td class="${CSS_CLASSES.TABLE_CELL}">
			<label class="${CSS_CLASSES.LABEL}">
				<input type="radio" class="${CSS_CLASSES.ITEM_VALUE}" name="${question.rows[i].value}" data-column=${question.columns[0].value}>
				<span class="${CSS_CLASSES.ITEM_DECORATOR}"></span>
			</label>
			</td>
			<td></td>
			<td class="${CSS_CLASSES.TABLE_CELL}">${question.rows[i].text}</td>
			<td></td>
			<td class="${CSS_CLASSES.TABLE_CELL}">
			<label class="${CSS_CLASSES.LABEL}">
				<input type="radio" class="${CSS_CLASSES.ITEM_VALUE}" name="${question.rows[i].value}" data-column=${question.columns[1].value}>
				<span class="${CSS_CLASSES.ITEM_DECORATOR}"></span>
			</label>
			</td>`;
			bodyHTML += `<tr class="${CSS_CLASSES.TABLE_ROW}">${bodyCells}</tr>`;
		}

		let html = `<table class="${CSS_CLASSES.TABLE}">
		<thead>
		<tr>${headerCells}</tr>
		</thead>
		<tbody>${bodyHTML}</tbody>
		</table>`;

		console.log("maxdiff matrix generation took", performance.now() - t);
		el.insertAdjacentHTML("beforeend", html);

		let inputDOMS = el.querySelectorAll("input");

		for (let i = 0; i < inputDOMS.length; i++)
		{
			inputDOMS[i].addEventListener("input", this._bindedHandlers._handleInput);
		}
	}
}

export default function init (Survey)
{
	var widget = {
		//the widget name. It should be unique and written in lowcase.
		name: "maxdiffmatrix",

		//the widget title. It is how it will appear on the toolbox of the SurveyJS Editor/Builder
		title: "MaxDiff matrix",

		//the name of the icon on the toolbox. We will leave it empty to use the standard one
		iconName: "",

		//If the widgets depends on third-party library(s) then here you may check if this library(s) is loaded
		widgetIsLoaded: function () {
			//return typeof $ == "function" && !!$.fn.select2; //return true if jQuery and select2 widget are loaded on the page
			return true; //we do not require anything so we just return true.
		},

		//SurveyJS library calls this function for every question to check, if it should use this widget instead of default rendering/behavior
		isFit: function (question) {
			//we return true if the type of question is maxdiffmatrix
			return question.getType() === 'maxdiffmatrix';
			//the following code will activate the widget for a text question with inputType equals to date
			//return question.getType() === 'text' && question.inputType === "date";
		},

		//Use this function to create a new class or add new properties or remove unneeded properties from your widget
		//activatedBy tells how your widget has been activated by: property, type or customType
		//property - it means that it will activated if a property of the existing question type is set to particular value, for example inputType = "date"
		//type - you are changing the behaviour of entire question type. For example render radiogroup question differently, have a fancy radio buttons
		//customType - you are creating a new type, like in our example "maxdiffmatrix"
		activatedByChanged: function (activatedBy) {
			//we do not need to check acticatedBy parameter, since we will use our widget for customType only
			//We are creating a new class and derived it from text question type. It means that text model (properties and fuctions) will be available to us
			Survey.JsonObject.metaData.addClass("maxdiffmatrix", [], null, "text");
			//signaturepad is derived from "empty" class - basic question class
			//Survey.JsonObject.metaData.addClass("signaturepad", [], null, "empty");

			//Add new property(s)
			//For more information go to https://surveyjs.io/Examples/Builder/?id=addproperties#content-docs
			Survey.JsonObject.metaData.addProperties("maxdiffmatrix", [
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
			console.log("MaxDiff mat", question.rows, question.columns);
			new MaxDiffMatrix({ question, el });

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
