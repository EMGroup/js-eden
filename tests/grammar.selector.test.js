var Eden = require('../js/core/eden').Eden;

describe("Selector Grammar", () => {
	
	test("accepts names", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts names with asterisk", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test*`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts names with empty child", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test >`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts names with non-empty child", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test > other`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts names with empty double child", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test >>`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts names with non-empty double child", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test >> other`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("accepts valid pseudo tag", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `:active`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("rejects invalid pseudo tag", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `:act`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("accepts valid property tag", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `.name`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
	});

	test("rejects invalid property tag", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `.test`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects missing close brace", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `.name(x`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects extra brace", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `test)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects numbers", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `5`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects strings", () => {
		var ast = Eden.AST.parseRule("pCODESELECTOR", `"hello"`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

});