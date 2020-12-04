var Eden = require('../js/core/eden').Eden;

describe("Factor Sub-Expression", () => {
	
	test("requires a closing bracket", () => {
		var ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(1);
	});

	test("allows nested sub expressions", () => {
		var ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `((a+b))`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `((a+b)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(1);
	});

	test("allows [ indices", () => {
		var ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b)[1][2]`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("indexed");
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b)[1`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).toHaveLength(1);
	});

	test("allows . indices", () => {
		var ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b).x.y`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("indexed");
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b).2`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).toBeGreaterThan(0);
	});

	test("allows function calls", () => {
		var ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b)(c)`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("indexed");
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_SUBEXP", `(a+b)(`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

});

// ==== Objects ================================================================

describe("Factor Object Literals", () => {

	test("allows empty literals", () => {
		var ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_OBJECT);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("reject label-less components", () => {
		var ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{5}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{5,6,7}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{{}}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("allows single label literals", () => {
		var ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a: 9}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_OBJECT);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(Object.keys(ast.value)).toHaveLength(1);
		expect(ast.errors).toHaveLength(0);
	});


	test("reject duplicate labels", () => {
		var ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a: 9, a: 10}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

	test("disallow bad label forms", () => {
		var ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a 9}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a:}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a; 9}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a[1]:}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{a():}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{5: 9}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		// TODO: Might allow this if string is constant
		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", `{"hello": 9}`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);

		// TODO: Might allow this
		ast = Eden.AST.parseRule("pFACTOR_OBJECTLITERAL", "{`hello`: 9}");
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

});

// ==== Lists ==================================================================

describe("Factor List Literals", () => {

	test("allows empty literals", () => {
		var ast = Eden.AST.parseRule("pFACTOR_LISTLITERAL", `[]`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_LISTLITERAL", `[`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors).not.toHaveLength(0);
	});

	test("allows literal items", () => {
		var ast = Eden.AST.parseRule("pFACTOR_LISTLITERAL", `[9]`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.value).toHaveLength(1);
		expect(ast.errors).toHaveLength(0);

		ast = Eden.AST.parseRule("pFACTOR_LISTLITERAL", `[9,10,11]`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_LIST);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.value).toHaveLength(3);
		expect(ast.errors).toHaveLength(0);
	});


	test("reject object labels", () => {
		var ast = Eden.AST.parseRule("pFACTOR_LISTLITERAL", `[a: 9]`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

});

// ==== Strings ================================================================

describe("Factor Basic String", () => {

	test("combine multiple string constants", () => {
		var ast = Eden.AST.parseRule("pFACTOR_STRING", `"hello""world"`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.value).toEqual("hello\nworld");
		expect(ast.errors).toHaveLength(0);
	});

	test("reject strings with newlines", () => {
		var ast = Eden.AST.parseRule("pFACTOR_STRING", `"hello
		world"`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

});

describe("Factor Heredoc", () => {

	test("matches correct end token on new line", () => {
		var ast = Eden.AST.parseRule("pFACTOR_HEREDOC", `<<ENDLINE
some text here
more text
ENDLINE`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.type).toEqual("literal");
		expect(ast.typevalue).toEqual(Eden.AST.TYPE_STRING);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdynamic).toEqual(false);
		expect(ast.isdependant).toEqual(false);
		expect(ast.value).toEqual("some text here\nmore text");
		expect(ast.errors).toHaveLength(0);
	});

	test("reject heredoc with incorrect end", () => {
		var ast = Eden.AST.parseRule("pFACTOR_HEREDOC", `<<ENDLINE
some text here
more text
ENDline`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

	test("reject heredoc with end not on new line", () => {
		var ast = Eden.AST.parseRule("pFACTOR_HEREDOC", `<<ENDLINE
		some text here
		more text ENDLINE`);
		expect(ast._is_eden_expression).toBe(true);
		expect(ast.errors.length).not.toBe(0);
	});

});
