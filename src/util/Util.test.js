import assert from "assert";
import { isNumeric, randint, round, sum, toNumerical, turnSquareBracketsIntoArrays } from "./Util.js";

assert(isNumeric("1.2"));
assert(isNumeric(0));
assert(!isNumeric("NaN"));
assert(!isNumeric("hey"));

// number -> number, e.g. 2 -> 2
assert.equal(2, toNumerical(2));

// [number] -> [number], e.g. [1,2,3] -> [1,2,3]
assert.deepEqual([1, 2, 3], toNumerical([1, 2, 3]));
assert(Array.isArray(toNumerical([0])));

// numeral string -> number, e.g. "8" -> 8
assert.deepEqual(8, toNumerical("8"));

// [number | numeral string] -> [number], e.g. [1, 2, "3"] -> [1,2,3]
assert.deepEqual([1, 2, 3], toNumerical([1, 2, "3"]));

// Establish what happens when fed an array-like string
assert.deepEqual([1, 2, 3], toNumerical(...turnSquareBracketsIntoArrays("[1, 2, 3][]]", 2)));

// Throws
(async () =>
{
	await assert.rejects(
		async () =>
		{
			toNumerical(turnSquareBracketsIntoArrays([1, 2]));
		},
		{
			origin: "util.toNumerical",
			context: "when converting an object to its numerical form",
			error: "unable to convert undefined to a number",
		},
	);
})();

// Towards a NumPy inspired bound random integer producer
for (let i = 0; i < 100; i += 1)
{
	// Calling sans arguments gives back zero no matter what
	assert.equal(randint(), 0);
}

for (let i = 0; i < 100; i += 1)
{
	// Same when calling with a min of one sans max
	assert.equal(randint(1), 0);
}

// Expect min to be zero, max to be one, result to be zero
assert(randint(1) >= 0 === randint(1) < 1);

// Same when calling with a min of one sans max
assert.equal(randint(1), 0);

for (let i = 0; i < 100; i += 1)
{
	// Same with null
	assert.equal(randint(null), 0);
}

for (let i = 100; i > 0; i -= 1)
{
	// Try out a few ranges in the positive
	assert(randint(i) < i);
}

for (let i = -99; i < 0; i += 1)
{
	// What happens when using negative parameters?
	assert(randint(2 * i, i) <= i);
}

try
{
	randint(0, -10);
}
catch ({ error })
{
	assert.equal(error, "min should be <= max");
}

// Implement Crib Sheet math extras
// These are taken from the SO question above
// https://stackoverflow.com/questions/11832914
const actual = [
	10,
	1.7777777,
	9.1,
];

const expected = [
	10,
	1.78,
	9.1,
];

const got = actual.map((input) => round(input, 2));

assert.deepEqual(expected, got);

assert.equal(sum(null), 0);
assert.equal(sum(), 0);
assert(!sum([0]));
assert.equal(sum([1, NaN, null, undefined]), 1);
assert.equal(sum([1, 2, -3]), 0);

// Careful Thomas!
assert.equal(sum(["a1", 2]), 2);
