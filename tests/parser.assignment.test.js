var Eden = require('../js/core/eden').Eden;

describe("Assignment to observable", () => {

	test("assign a numeric literal", () => {
		var ast = Eden.AST.parseStatement("x = 5;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("assignment");
		expect(ast.lvalue.name).toEqual("x");
		expect(ast.expression.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.expression.isconstant).toEqual(true);
	});

	test("assign a string literal", () => {
		var ast = Eden.AST.parseStatement('x = "hello world";');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("assignment");
		expect(ast.lvalue.name).toEqual("x");
		expect(ast.expression.typevalue).toBe(Eden.AST.TYPE_STRING);
		expect(ast.expression.isconstant).toEqual(true);
	});

	test("assign a scoped expression", () => {
		var ast = Eden.AST.parseStatement('x = a*b with a = 10;');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("assignment");
		expect(ast.lvalue.name).toEqual("x");
		expect(ast.expression.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.expression.isconstant).toEqual(false);
	});

	test("assign a function", () => {
		var ast = Eden.AST.parseStatement('x = func { return 5; };');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("assignment");
		expect(ast.lvalue.name).toEqual("x");
		expect(ast.expression.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.expression.isconstant).toEqual(true);
	});

	test("assign a function as static", () => {
		var ast = Eden.AST.parseStatement('x =:[static] func { return 5; };');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("assignment");
		expect(ast.lvalue.name).toEqual("x");
		expect(ast.expression.typevalue).toBe(Eden.AST.TYPE_UNKNOWN);
		expect(ast.expression.isconstant).toEqual(true);
	});

	test("missing an expression is an error", () => {
		var ast = Eden.AST.parseStatement('x = ;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("bad expression is an error", () => {
		var ast = Eden.AST.parseStatement('x = a a;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	/*test("missing lvalue is an error", () => {
		var ast = Eden.AST.parseStatement(' = a a;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("numeric lvalue is an error", () => {
		var ast = Eden.AST.parseStatement('5 = a a;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("string lvalue is an error", () => {
		var ast = Eden.AST.parseStatement('"a" = a a;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});*/

	test("chained assignment is an error", () => {
		var ast = Eden.AST.parseStatement('x = y = 5;');

		expect(ast).toBeTruthy();
		expect(ast.errors.length).toBeGreaterThan(0);
	});

});
