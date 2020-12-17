var Eden = require('../js/core/eden').Eden;

describe("Script Parsing", () => {

	test("don't get stuck on errors", () => {
		var ast = Eden.AST.parseScript("x = union:(x,y);");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
		expect(ast.type).toEqual("script");
	});

	test("allow empty scripts", () => {
		var ast = Eden.AST.parseScript("");

		expect(ast).toBeFalsy();
	});

	test("allow empty statements", () => {
		var ast = Eden.AST.parseScript(";");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("script");
	});

});