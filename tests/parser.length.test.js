var Eden = require('../js/core/eden').Eden;

describe("Length operator", () => {

	test("can get the length of a list", () => {
		var ast = Eden.AST.parseExpression("[1,2,3]#");

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("length");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("can get the length of a string", () => {
		var ast = Eden.AST.parseExpression('"hello world"#');

		expect(ast).toBeTruthy();
		expect(ast.errors).toHaveLength(0);
		expect(ast.type).toEqual("length");
		expect(ast.typevalue).toBe(Eden.AST.TYPE_NUMBER);
		expect(ast.isconstant).toEqual(true);
		expect(ast.isdependant).toEqual(false);
		expect(ast.isdynamic).toEqual(false);
	});

	test("cannot get length of a number", () => {
		var ast = Eden.AST.parseExpression('5#');
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

	test("cannot get length of an object", () => {
		var ast = Eden.AST.parseExpression('{}#');
		expect(ast).toBeTruthy();
		expect(ast.errors).not.toHaveLength(0);
	});

});