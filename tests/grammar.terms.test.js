var Eden = require('../js/core/eden').Eden;

describe("Term Precedence", () => {
	
	test("boolean lt comparisons have equal precedence", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 < 6 < 7`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_BOOLEAN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.l.type).toEqual("binaryop");
	});

	test("boolean lteq comparisons have equal precedence", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 < 6 <= 7`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_BOOLEAN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.l.type).toEqual("binaryop");
	});

	test("boolean lt gt comparisons have equal precedence", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 < 6 > 7`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_BOOLEAN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.l.type).toEqual("binaryop");
	});

	test("boolean lt+eq comparisons have equal precedence", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 < 6 == 7`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_BOOLEAN);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.l.type).toEqual("binaryop");
	});

	test("multiplication has higher precedence than addition", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 + 6 * 8`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.r.type).toEqual("binaryop");
	});

	test("division has higher precedence than addition", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 + 6 / 8`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.r.type).toEqual("binaryop");
	});

	test("multiplication has higher precedence than subtraction", () => {
		var ast = Eden.AST.parseRule("pTERM", `5 - 6 * 8`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("binaryop");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.r.type).toEqual("binaryop");
	});
});