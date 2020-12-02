var Eden = require('../js/core/eden').Eden;

// ==== Basic ==================================================================

describe("Ternary If Operator", () => {

	test("Valid numeric constant if expression", () => {
		var ast = Eden.AST.parseExpression("1 if true else 2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("ternaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});