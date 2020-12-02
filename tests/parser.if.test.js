const { TestScheduler } = require('jest');

var Eden = require('../js/core/eden').Eden;

describe("If Statement", () => {

	test("if with single statement and no else", () => {
		var ast = Eden.AST.parseStatement("if (true) x = 5;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("if");
	});

	test("if with single statement and else part", () => {
		var ast = Eden.AST.parseStatement("if (true) x = 5; else x = 6;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("if");
	});

});
