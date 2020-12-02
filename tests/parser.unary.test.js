var Eden = require('../js/core/eden').Eden;

// ==== Basic ==================================================================

describe("Nested expressions", () => {

	test("Can surround expression with brackets", () => {
		var ast = Eden.AST.parseExpression("(5+2)");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});