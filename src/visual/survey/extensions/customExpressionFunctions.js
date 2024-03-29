// Wrapping everything in Class and defining as static methods to prevent esbuild from renaming when bundling.
// NOTE! Survey stim uses property .name of these methods on registering stage.
// Methods are available inside SurveyJS expressions using their actual names.
class ExpressionFunctions {
	static rnd ()
	{
		return Math.random();
	}

	static arrayContains (params)
	{
		if (params[0] instanceof Array)
		{
			let searchValue = params[1];
			let searchResult = params[0].indexOf(searchValue) !== -1;

			// If no results at first, trying conversion combinations, since array of values sometimes might
			// contain both string and number data types.
			if (searchResult === false)
			{
				if (typeof searchValue === "string")
				{
					searchValue = parseFloat(searchValue);
					searchResult = params[0].indexOf(searchValue) !== -1;
				}
				else if (typeof searchValue === "number")
				{
					searchValue = searchValue.toString();
					searchResult = params[0].indexOf(searchValue) !== -1;
				}
			}

			return searchResult
		}
		return false;
	}

	static stringContains (params)
	{
		if (typeof params[0] === "string")
		{
			return params[0].indexOf(params[1]) !== -1;
		}
		return false;
	}

	static isEmpty (params)
	{
		let questionIsEmpty = false;
		if (params[0] instanceof Array || typeof params[0] === "string")
		{
			questionIsEmpty = params[0].length === 0;
		}
		else
		{
			questionIsEmpty = params[0] === undefined || params[0] === null;
		}
		return questionIsEmpty;
	}

	static isNotEmpty (params)
	{
		return !ExpressionFunctions.isEmpty(params);
	}
}


export default [
	{
		func: ExpressionFunctions.rnd,
		isAsync: false
	},
	{
		func: ExpressionFunctions.arrayContains,
		isAsync: false
	},
	{
		func: ExpressionFunctions.stringContains,
		isAsync: false
	},
	{
		func: ExpressionFunctions.isEmpty,
		isAsync: false
	},
	{
		func: ExpressionFunctions.isNotEmpty,
		isAsync: false
	}
];
