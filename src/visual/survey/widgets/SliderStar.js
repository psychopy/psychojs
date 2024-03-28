/**
* @desc Slider Star.
* */

class SliderStar
{
	constructor (cfg = {})
	{
		const surveyCSS = cfg.question.css;
		this._CSS_CLASSES = {
			// INPUT_TEXT: `${surveyCSS.text.root} slider-star-text-input`
			INPUT_TEXT: `slider-star-text-input`
		};
		this._question = cfg.question;
		this._DOM = cfg.el;
		this._engagedInputIdx = undefined;
		this._pdowns = {};

		this._bindedHandlers =
		{
			_handleInput: this._handleInput.bind(this),
			_handlePointerDown: this._handlePointerDown.bind(this),
			_handlePointerUp: this._handlePointerUp.bind(this),
			_handlePointerMove: this._handlePointerMove.bind(this)
		};

		this._init(this._question, this._DOM);
	}

	_markStarsActive (n, qIdx)
	{
		let stars = this._DOM.querySelectorAll(`.stars-container[data-idx="${qIdx}"] .star-slider-star-input`);
		let i;
		for (i = 0; i < stars.length; i++)
		{
			stars[i].classList.remove("active");
			if (i <= n - 1)
			{
				stars[i].classList.add("active");
			}
		}
	}

	_handleIndividualValueUpdate (v, qIdx)
	{
		if (this._question.value === undefined)
		{
			this._question.value = {};
		}
		if (this._question.value[qIdx] !== v)
		{
			this._question.value[qIdx] = v;
			this._DOM.querySelector(`.slider-star-text-input[name="${qIdx}"]`).value = v;
			this._markStarsActive(v, qIdx);
			// Triggering internal SurveyJS mechanism for value update.
			this._question.value = this._question.value;
		}
	}

	_handleInput (e)
	{
		let v = parseInt(e.currentTarget.value, 10) || 0;
		v = Math.max(0, Math.min(this._question.starCount, v));
		const qIdx = e.currentTarget.name;
		this._handleIndividualValueUpdate(v, qIdx);
	}

	_handlePointerDown (e)
	{
		e.preventDefault();
		this._engagedInputIdx = e.currentTarget.dataset.idx;
		this._pdowns[this._engagedInputIdx] = true;
		const starIdx = [].indexOf.call(e.target.parentElement.children, e.target);
		this._handleIndividualValueUpdate(starIdx + 1, this._engagedInputIdx);
	}

	_handlePointerUp (e)
	{
		if (this._engagedInputIdx !== undefined)
		{
			this._pdowns[this._engagedInputIdx] = false;
		}
		this._engagedInputIdx = undefined;
	}

	_handlePointerMove (e)
	{
		if (this._pdowns[this._engagedInputIdx])
		{
			e.preventDefault();
			const starIdx = [].indexOf.call(e.target.parentElement.children, e.target);
			this._handleIndividualValueUpdate(starIdx + 1, this._engagedInputIdx);
		}
	}

	_init (question, el)
	{
		let t = performance.now();
		let starsHTML = new Array(question.starCount).fill(`<div class="star-slider-star-input">★</div>`).join("");
		let html = "";
		let i;
		for (i = 0; i < question.choices.length; i++)
		{
			html +=
			`<div class="star-slider-container">
			<div class="star-slider-title">${question.choices[i].text}</div>
			<div class="star-slider-inputs">
			<div class="stars-container" data-idx="${question.choices[i].value}">${starsHTML}</div>
			${question.showValue ?
				`<input type="number" class="${this._CSS_CLASSES.INPUT_TEXT}" max="${question.starCount}" min="0" name="${question.choices[i].value}">` :
				 ""}
			</div>
			</div>`;
		}

		el.insertAdjacentHTML("beforeend", html);
		const inputDOMS = el.querySelectorAll(".slider-star-text-input");
		const starsContainers = el.querySelectorAll(".stars-container");

		// Amount of inputDOMS and starsCointainer is the same.
		// Also iterating over starContainers since text inputs might be absent.
		for (i = 0; i < starsContainers.length; i++)
		{
			inputDOMS[i].addEventListener("input", this._bindedHandlers._handleInput);
			starsContainers[i].addEventListener("pointerdown", this._bindedHandlers._handlePointerDown);
			starsContainers[i].addEventListener("pointermove", this._bindedHandlers._handlePointerMove);
		}
		window.addEventListener("pointerup", this._bindedHandlers._handlePointerUp);
	}
}

export default function init (Survey) {
	var widget = {
		//the widget name. It should be unique and written in lowcase.
		name: "sliderstar",

		//the widget title. It is how it will appear on the toolbox of the SurveyJS Editor/Builder
		title: "Slider Star",

		//the name of the icon on the toolbox. We will leave it empty to use the standard one
		iconName: "",

		//If the widgets depends on third-party library(s) then here you may check if this library(s) is loaded
		widgetIsLoaded: function () {
			//return typeof $ == "function" && !!$.fn.select2; //return true if jQuery and select2 widget are loaded on the page
			return true; //we do not require anything so we just return true.
		},

		//SurveyJS library calls this function for every question to check, if it should use this widget instead of default rendering/behavior
		isFit: function (question) {
			//we return true if the type of question is sliderstar
			return question.getType() === 'sliderstar';
			//the following code will activate the widget for a text question with inputType equals to date
			//return question.getType() === 'text' && question.inputType === "date";
		},

		//Use this function to create a new class or add new properties or remove unneeded properties from your widget
		//activatedBy tells how your widget has been activated by: property, type or customType
		//property - it means that it will activated if a property of the existing question type is set to particular value, for example inputType = "date"
		//type - you are changing the behaviour of entire question type. For example render radiogroup question differently, have a fancy radio buttons
		//customType - you are creating a new type, like in our example "sliderstar"
		activatedByChanged: function (activatedBy) {
			//we do not need to check acticatedBy parameter, since we will use our widget for customType only
			//We are creating a new class and derived it from text question type. It means that text model (properties and fuctions) will be available to us
			Survey.JsonObject.metaData.addClass("sliderstar", [], null, "text");
			//signaturepad is derived from "empty" class - basic question class
			//Survey.JsonObject.metaData.addClass("signaturepad", [], null, "empty");

			//Add new property(s)
			//For more information go to https://surveyjs.io/Examples/Builder/?id=addproperties#content-docs
			Survey.JsonObject.metaData.addProperties("sliderstar", [
				{
					name: "choices",
					isArray: true,
					default: []
				},
				{
					name: "starCount",
					default: 5
				},
				{
					name: "showValue",
					default: true
				},
				{
					name: "starType",
					default: "descrete"
				}
			]);
		},

		//If you want to use the default question rendering then set this property to true. We do not need any default rendering, we will use our our htmlTemplate
		isDefaultRender: false,

		//You should use it if your set the isDefaultRender to false
		htmlTemplate: "<div></div>",

		//The main function, rendering and two-way binding
		afterRender: function (question, el) {
			new SliderStar({ question, el });

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
