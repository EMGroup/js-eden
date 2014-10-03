QUnit.module("rt.length");

test("returns undefined for undefined", function () {
	equal(rt.length(undefined), undefined);
});

test("returns length of array", function () {
	equal(rt.length([]), 0);
	equal(rt.length([1]), 1);
});

test("returns length of string", function () {
	equal(rt.length(""), 0);
	equal(rt.length("a"), 1);
});

QUnit.module("rt.equal");

test("compares lists contents", function () {
	equal(rt.equal([1,2,3], [1,2,3]), true);
	equal(rt.equal([1,2,3], [1,2,4]), false);
	equal(rt.equal([], []), true);
	equal(rt.equal([[]], [[]]), true);
	equal(rt.equal([[1]], [[]]), false);
	equal(rt.equal([[1]], [[1]]), true);
});
