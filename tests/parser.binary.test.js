var Eden = require('../js/core/eden').Eden;

// ==== Basic ==================================================================

describe("Addition operator", () => {

	test("Arithmetic addition operator", () => {
		var ast = Eden.AST.parseExpression("5+2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("addition of strings", () => {
		var ast = Eden.AST.parseExpression('"hello"+"world"');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("invalid addition of lists", () => {
		var ast = Eden.AST.parseExpression('[]+[]');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("invalid addition of string and list", () => {
		var ast = Eden.AST.parseExpression('""+[]');
		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
		ast = Eden.AST.parseExpression('[]+""');
		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

});

describe("Subtraction operator", () => {

	test("Arithmetic subtraction operator", () => {
		var ast = Eden.AST.parseExpression("5-2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

describe("Division operator", () => {

	test("Arithmetic division operator", () => {
		var ast = Eden.AST.parseExpression("5/2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

describe("Multiplication operator", () => {

	test("Arithmetic multiplication operator", () => {
		var ast = Eden.AST.parseExpression("5*2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

describe("Modulus operator", () => {

	test("Arithmetic modulus operator", () => {
		var ast = Eden.AST.parseExpression("5%2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

test("Invalid binary operator", () => {
	var ast = Eden.AST.parseExpression("5 ? 2");

	expect(ast).toBeTruthy();
	expect(ast.errors.length).toBeGreaterThan(0);
});

// ==== Concat // ==============================================================

describe("Concatenation operator", () => {

	test("Invalid concat operator on numbers", () => {
		var ast = Eden.AST.parseExpression("5 // 2");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("Invalid concat operator on list and number", () => {
		var ast = Eden.AST.parseExpression("[] // 2");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);

		ast = Eden.AST.parseExpression("2 // []");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("Invalid concat operator on list and string", () => {
		var ast = Eden.AST.parseExpression('[] // ""');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);

		ast = Eden.AST.parseExpression('"" // []');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("List concat operator", () => {
		var ast = Eden.AST.parseExpression("[] // []");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("String concat operator", () => {
		var ast = Eden.AST.parseExpression('"n" // "h"');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

// ==== Precedence =============================================================
