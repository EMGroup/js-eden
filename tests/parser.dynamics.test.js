var Eden = require('../js/core/eden').Eden;

describe("Dependent Substitutions", () => {

	test("can embed observable as literal constant", () => {
		var ast = Eden.AST.parseExpression("5 + ${a}");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
	});

	test("can embed expression as literal constant", () => {
		var ast = Eden.AST.parseExpression("5 + ${a*5}");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
	});

	test("can embed AST objects", () => {
		var ast = Eden.AST.parseExpression("5 + ${parse('a*5')}");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
	});

});