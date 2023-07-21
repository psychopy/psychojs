/**
 * @desc: Bipolar Matrix custom component.
 * @type: SurveyJS component modification.
 * This component works differently from widgets because it modifies the behavior of native SurveyJS component.
 * It's doing so by registering new properties in SurveyJS ecosystem and introducing custom afterRender callback.
 * While such approach is not most efficient since it modifies existing DOM element it's quite fast to make
 * when amount of changes to original component is minimal.
 */

function handleBipolarMatrixRendering (survey, options)
{
	// Operation below takes on average abt .5ms for 4x3 matrix.
	// If it would turn out taking unreasonably long for larger matrices
	// this has to be implemented using widgets (see SideBySideMatrix).

	// REWORK TO WIDGET

	const surveyCSS = options.question.css;
	// let tableDOM = options.htmlElement.querySelector("table.sv-table");
	let tableDOM = options.htmlElement.querySelector("table");
	tableDOM.classList.add("matrix-bipolar");
	let rowsDOM = options.htmlElement.querySelectorAll("tbody tr");
	// let rowCaptionsDOM = options.htmlElement.querySelectorAll("tbody tr td:nth-child(1) .sv-string-viewer");
	let rowCaptionsDOM = options.htmlElement.querySelectorAll("tbody tr td:nth-child(1) span");
	let captionsClassList = rowCaptionsDOM[0].classList;
	let cellClassList = rowsDOM[0].children[0].classList;
	let rowCaptions = new Array(options.question.rows.length);
	let rowCaptionOppositeHTML = "";
	let i;
	for (i = 0; i < rowCaptions.length; i++)
	{
		rowCaptions[i] = options.question.rows[i].text.split(":");
		rowCaptionsDOM[i].innerText = rowCaptions[i][0];
		rowCaptionOppositeHTML = `<td class="${cellClassList.value}"><span class="${captionsClassList.value}">${rowCaptions[i][1]}</span></td>`;
		rowsDOM[i].insertAdjacentHTML("beforeend", rowCaptionOppositeHTML);
	}
}

export default {
	registerSurveyProperties (Survey)
	{
		Survey.Serializer.addProperty("matrix",
		{
			name: "subType:text",
			default: "",
			category: "general"
		});
	},


	registerModelCallbacks (surveyModel)
	{
		surveyModel.onAfterRenderQuestion.add((survey, options) => {
			if (options.question.getType() === "matrix" && options.question.getPropertyValue("subType") === "bipolar")
			{
				handleBipolarMatrixRendering(survey, options);
			}
		});
	}
};
