QUnit.module("translateEdenToJavaScript");

test("Assignment sets the correct value", function (assert) {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 2;"));
	equal(root.lookup('x').value(), 2);
});
