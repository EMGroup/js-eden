var Eden = require('../js/core/eden').Eden;

describe("Scoped Expressions", () => {
	
	test("can scope a single observable expression", () => {
		var ast = Eden.AST.parseExpression("b with x=4");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("primary");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("can scope a complex expression", () => {
		var ast = Eden.AST.parseExpression("b+2 with x=4");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("alternate scoping syntax", () => {
		var ast = Eden.AST.parseExpression("b+2 :: x=4");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("range syntax", () => {
		var ast = Eden.AST.parseExpression("b+2 :: x=4..6");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("binaryop");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("nested scopes using brackets", () => {
		var ast = Eden.AST.parseExpression("(b+2 with x=4) with y=2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("scope");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.warning).toBeTruthy();
	});

	test("nested scopes without brackets", () => {
		var ast = Eden.AST.parseExpression("b+2 with (x=4) with y=2");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
		expect(ast.expression.type).toEqual("scope");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("reject scoping of constant expression", () => {
		var ast = Eden.AST.parseExpression("2 with (x=4)");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject scoping of empty expression", () => {
		var ast = Eden.AST.parseExpression("with (x=4)");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

});