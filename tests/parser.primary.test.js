const { TestScheduler } = require('jest');

var Eden = require('../js/core/eden').Eden;

test("Valid observable name expression", () => {
	var ast = Eden.AST.parseExpression("a");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(false);
});

test("Valid backticks with observable expression", () => {
	var ast = Eden.AST.parseExpression("`a`");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(true);
});

test("Backticks after initial observable part", () => {
	var ast = Eden.AST.parseExpression("b`a`");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(true);
});

test("Backticks after initial observable part", () => {
	var ast = Eden.AST.parseExpression("`a`b");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(true);
});

test("Backticks in middle of observables", () => {
	var ast = Eden.AST.parseExpression("b`a`c");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(true);
});

test("Valid backticks with string expression", () => {
	var ast = Eden.AST.parseExpression('`"a"`');

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("primary");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
	expect(ast.isconstant).toEqual(false);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(true);
});

test("Excessive input produces an error", () => {
	var ast = Eden.AST.parseExpression("a a");

	expect(ast).toBeTruthy();
	expect(ast.errors.length).toBeGreaterThan(0);
});

test("Invalid backticks with wrong expression type", () => {
	var ast = Eden.AST.parseExpression("`5`");

	expect(ast).toBeTruthy();
	expect(ast.errors.length).toBeGreaterThan(0);
});

test("Invalid backticks with missing tick", () => {
	var ast = Eden.AST.parseExpression("`5");

	expect(ast).toBeTruthy();
	expect(ast.errors.length).toBeGreaterThan(0);
});
