var Eden = require('../js/core/eden').Eden;

// ==== Numbers ================================================================

test("Valid integer literal expression", () => {
	var ast = Eden.AST.parseExpression("5");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("literal");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
	expect(ast.isconstant).toEqual(true);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(false);
});

test("Valid float literal expression", () => {
	var ast = Eden.AST.parseExpression("5.2");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("literal");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
	expect(ast.isconstant).toEqual(true);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(false);
});

test("Valid negative float literal expression", () => {
	var ast = Eden.AST.parseExpression("-5.7");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("literal");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
	expect(ast.isconstant).toEqual(true);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(false);
});

// ==== Strings ================================================================

describe("Plain string literals", () => {

	test("Valid string literal expression", () => {
		var ast = Eden.AST.parseExpression(`"hello world"`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

describe("Template string literals", () => {
	
	test("template with substitution at end", () => {
		var ast = Eden.AST.parseExpression(`'hello {name}'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with substitution at beginning", () => {
		var ast = Eden.AST.parseExpression(`'{name} is great'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with substitution in middle", () => {
		var ast = Eden.AST.parseExpression(`'hello {name} world'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with multiple substitutions", () => {
		var ast = Eden.AST.parseExpression(`'hello {firstname} {lastname} world'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template escaped braces", () => {
		var ast = Eden.AST.parseExpression(`'hello \\{name\\}'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with no substitutions", () => {
		var ast = Eden.AST.parseExpression(`'hello world'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with quotes", () => {
		var ast = Eden.AST.parseExpression(`'hello "world"'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("template with escaped close char", () => {
		var ast = Eden.AST.parseExpression(`'hello\\' world'`);

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

// ==== Lists ==================================================================

describe("List Literals", () => {

	test("Valid empty list literal expression", () => {
		var ast = Eden.AST.parseExpression("[]");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("Valid numeric list literal expression", () => {
		var ast = Eden.AST.parseExpression("[1,2,3]");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("Valid nested list literal expression", () => {
		var ast = Eden.AST.parseExpression("[[],[]]");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("list literal with missing item at end", () => {
		var ast = Eden.AST.parseExpression("[5,]");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("list literal with missing item at front", () => {
		var ast = Eden.AST.parseExpression("[,5]");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("list literal with missing item in middle", () => {
		var ast = Eden.AST.parseExpression("[5,,2]");

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("Valid list literal expression with observable", () => {
		var ast = Eden.AST.parseExpression("[1,2,a,3]");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

});

// ==== Objects ================================================================

test("Valid empty object literal expression", () => {
	var ast = Eden.AST.parseExpression("{}");

	expect(ast).toBeTruthy();
	expect(ast.errors).toHaveLength(0);
	expect(ast.type).toEqual("literal");
	expect(ast.typevalue).toBe(Eden.AST.TYPE_OBJECT);
	expect(ast.isconstant).toEqual(true);
	expect(ast.isdependant).toEqual(false);
	expect(ast.isdynamic).toEqual(false);
});
