/**
 * @desc: Extensions for default dropdown component of SurveyJS to make it more nice to interact with on mobile devices.
 * @type: SurveyJS component modification.
 */

function handleValueChange (survey, options, e)
{
	options.question.value = e.currentTarget.value;
}

function handleValueChangeForDOM (survey, options)
{
	options.htmlElement.querySelector("select").value = options.question.value;
}

function handleDropdownRendering (survey, options)
{
	// Default SurveyJS drop down is actually an <input> with customly built options list
	// It works well on desktop, but not that convenient on mobile.
	// Adding native <select> here that's hidden by default but visible on mobile.
	const surveyCSS = options.question.css;
	const choices = options.question.getChoices();
	let optionsHTML = `<option value=""></option>`;
	let i;
	for (i = 0; i < choices.length; i++)
	{
		optionsHTML += `<option value="${choices[i].value}">${choices[i].text}</option>`;
	}
	const selectHTML = `<select data-name="${options.question.name}" class="${surveyCSS.dropdown.control} dropdown-mobile">${optionsHTML}</select>`;
	options.htmlElement.querySelector('.sd-selectbase').insertAdjacentHTML("beforebegin", selectHTML);

	const selectDOM = options.htmlElement.querySelector("select");
	selectDOM.addEventListener("change", handleValueChange.bind(this, survey, options));

	options.question.valueChangedCallback = handleValueChangeForDOM.bind(this, survey, options);
}

export default {
	registerModelCallbacks (surveyModel)
	{
		surveyModel.onAfterRenderQuestion.add((survey, options) => {
			if (options.question.getType() === "dropdown")
			{
				handleDropdownRendering(survey, options);
			}
		});
	}
};
