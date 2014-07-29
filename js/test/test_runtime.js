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
