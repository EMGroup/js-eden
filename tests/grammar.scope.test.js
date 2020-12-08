var Eden = require('../js/core/eden').Eden;

describe("Scope Grammar", () => {
	
	test("accepts single bracketed override", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a = 10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("reject empty scope brackets", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `()`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject empty string", () => {
		var ast = Eden.AST.parseRule("pSCOPE", ``);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject semicolon", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `;`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject missing close bracket", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("accepts multiple unbracketed override", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `a = 10, b = 15, c = 20`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts use of is", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a is 10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("reject use of 'in' with non-list constant", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in 5)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("accepts use 'in' with literal list", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in [1,2,3])`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts use 'in' with observable", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in x)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts use 'in' for range", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in 1..10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts use 'is' for range", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a is 1..10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts use '=' for range", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a = 1..10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("accepts range increment value", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in 1..2..10)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

	test("reject non-numeric increment", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in 1..true..10)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject non-numeric range start", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in []..10)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject non-numeric range end", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a in 1.."hello")`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject use of non-identifier for lhs", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `([] = 5)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject use of indexed identifier", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a[1] = 5)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject missing statement", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(a 5)`);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("accepts lvalue-less", () => {
		var ast = Eden.AST.parseRule("pSCOPE", `(5,"hello",[])`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("scope");
	});

});