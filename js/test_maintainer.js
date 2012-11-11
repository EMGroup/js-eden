QUnit.module("Folder.prototype.lookup");

test("results in a Symbol", 1, function (assert) {
	var root = new Folder();
	notEqual(root.lookup('a').value, undefined);
});

QUnit.module("Folder.prototype.subscribe");

test("should fail if a circular dependency introduced", 1, function (assert) {
	var root = new Folder();
	var A = root.lookup('A'),
		B = root.lookup('B');

	raises(function () {
		A.subscribe('B');
		B.subscribe('A');
	});
});
