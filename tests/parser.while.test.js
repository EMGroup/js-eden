var Eden = require('../js/core/eden').Eden;

describe("While Statement", () => {

	test("while with single statement", () => {
		var ast = Eden.AST.parseStatement("while (true) x = 5;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("while");
	});

	test("while without condition brackets", () => {
		var ast = Eden.AST.parseStatement("while true x = 5;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("while");
	});

	test("while with script body", () => {
		var ast = Eden.AST.parseStatement("while true { x = 5; }");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("while");
	});

	test("while with bad script bracket", () => {
		var ast = Eden.AST.parseStatement("while true }");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

});