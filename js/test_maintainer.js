QUnit.module("Folder.prototype.lookup");

test("lookup results in a Symbol", function (assert) {
	var root = new Folder();
	notEqual(root.lookup('a').value, undefined);
});
