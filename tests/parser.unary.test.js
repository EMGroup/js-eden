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

	test("Can list index on sub expression", () => {
		var ast = Eden.AST.parseExpression("([1,2,3])[2]");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("indexed");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);  // TODO: Make it NUMBER
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("Can function call on subexpression", () => {
		var ast = Eden.AST.parseExpression("(a)(b)");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("indexed");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

// ==== Unary Negation =========================================================

describe("Unary negation operator", () => {

	test("can negate an observable", () => {
		var ast = Eden.AST.parseExpression("-b");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("unaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("cannot negate a string", () => {
		var ast = Eden.AST.parseExpression('-"hello"');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
		expect(ast.type).toEqual("unaryop");
	});

	test("cannot negate a list", () => {
		var ast = Eden.AST.parseExpression('-[a]');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
		expect(ast.type).toEqual("unaryop");
	});

	test("cannot negate an object", () => {
		var ast = Eden.AST.parseExpression('-{}');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
		expect(ast.type).toEqual("unaryop");
	});

	test("can negate a sub expression", () => {
		var ast = Eden.AST.parseExpression("-(b)");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("unaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});
