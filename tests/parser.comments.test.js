const { TestScheduler } = require('jest');

var Eden = require('../js/core/eden').Eden;

describe("Single # Comments", () => {

	test("valid comment, no new line at end", () => {
		var ast = Eden.AST.parseStatement("# hello world");

		expect(ast).toBeTruthy();
		expect(ast.type).toEqual("dummy");
		expect(ast.errors).toHaveLength(0);
	});

	test("valid comment within script", () => {
		var ast = Eden.AST.parseStatement("{# hello world}");

		expect(ast).toBeTruthy();
		expect(ast.type).toEqual("script");
		expect(ast.errors).toHaveLength(0);
	});

	test("valid comment within script with new lines", () => {
		var ast = Eden.AST.parseStatement("{# hello world\n}");

		expect(ast).toBeTruthy();
		expect(ast.type).toEqual("script");
		expect(ast.errors).toHaveLength(0);
	});

	test("multiple comment lines", () => {
		var ast = Eden.AST.parseStatement("{# hello world\n# another line\n# and another}");

		expect(ast).toBeTruthy();
		expect(ast.type).toEqual("script");
		expect(ast.errors).toHaveLength(0);
		expect(ast.statements).toHaveLength(1);
	});

	test("valid comment within script with internal braces", () => {
		var ast = Eden.AST.parseStatement("{# hello {} world\na = b;}");

		expect(ast).toBeTruthy();
		expect(ast.type).toEqual("script");
		expect(ast.errors).toHaveLength(0);
	});

})