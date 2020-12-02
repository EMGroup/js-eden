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

	test("Valid string constant if expression", () => {
		var ast = Eden.AST.parseExpression('"hello" if true else "world"');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("ternaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("Valid mixed constant if expression", () => {
		var ast = Eden.AST.parseExpression('1 if true else "world"');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("ternaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("Invalid when missing else expression", () => {
		var ast = Eden.AST.parseExpression('1 if true else');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("Invalid when missing else component", () => {
		var ast = Eden.AST.parseExpression('1 if true');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("Invalid when having two else components", () => {
		var ast = Eden.AST.parseExpression('1 if true else 2 else 3');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});
});