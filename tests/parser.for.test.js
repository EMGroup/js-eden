var Eden = require('../js/core/eden').Eden;

describe("For Statement", () => {

	test("regular c-style for construct", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10; i++) x = i;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("regular c-style for construct with script", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10; i++) { x = i; y = x; }");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("missing initial value allowed", () => {
		var ast = Eden.AST.parseStatement("for (; i<10; i++) { x = i; y = x; }");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("missing increment allowed", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10;) { x = i; y = x; }");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("missing condition allowed", () => {
		var ast = Eden.AST.parseStatement("for (i=0; ; i++) { x = i; y = x; }");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("bad script brackets rejected", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10; i++) } x = i; y = x; }");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("missing close bracket rejected", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10; i++ x = i;");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("missing open bracket rejected", () => {
		var ast = Eden.AST.parseStatement("for i=0; i<10; i++) x = i;");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("missing semi-colon after initialiser rejected", () => {
		var ast = Eden.AST.parseStatement("for (i=0 i<10; i++) x = i;");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("missing semi-colon after condition rejected", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10 i++) x = i;");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("missing statement allowed", () => {
		var ast = Eden.AST.parseStatement("for (i=0; i<10; i++);");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("for in range of list", () => {
		var ast = Eden.AST.parseStatement("for (x in [1,2,3]) y += x;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("for in range of observable", () => {
		var ast = Eden.AST.parseStatement("for (x in hh) y += x;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("for in integer range allowed", () => {
		var ast = Eden.AST.parseStatement("for (x in 1..10) y += x;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("for");
	});

	test("for in range of number rejected", () => {
		var ast = Eden.AST.parseStatement("for (x in 5) x = i;");
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

});