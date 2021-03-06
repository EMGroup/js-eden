var Eden = require('../js/core/eden').Eden;

describe("Modifier += Statement", () => {

	test("accepts list on rhs", () => {
		var ast = Eden.AST.parseStatement("x += [4];");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

	test("accepts number on rhs", () => {
		var ast = Eden.AST.parseStatement("x += 4;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

	test("accepts string on rhs", () => {
		var ast = Eden.AST.parseStatement("x += 'hello';");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

	test("accepts list index on lhs", () => {
		var ast = Eden.AST.parseStatement("x[1] += [4];");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

});

describe("Modifier //= Statement", () => {

	test("accepts list on rhs", () => {
		var ast = Eden.AST.parseStatement("x //= [4];");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

	test("rejects number on rhs", () => {
		var ast = Eden.AST.parseStatement("x //= 4;");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects boolean on rhs", () => {
		var ast = Eden.AST.parseStatement("x //= true;");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	// TODO: Might accept this?
	test("rejects object on rhs", () => {
		var ast = Eden.AST.parseStatement("x //= {};");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("accepts string on rhs", () => {
		var ast = Eden.AST.parseStatement("x //= 'hello';");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

});

describe("Modifier *= Statement", () => {

	test("accepts numbers on rhs", () => {
		var ast = Eden.AST.parseStatement("x *= 4;");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("modify");
	});

	test("rejects lists on rhs", () => {
		var ast = Eden.AST.parseStatement("x *= [];");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects objects on rhs", () => {
		var ast = Eden.AST.parseStatement("x *= {};");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("rejects strings on rhs", () => {
		var ast = Eden.AST.parseStatement("x *= 'hello';");

		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

});