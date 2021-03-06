var Eden = require('../js/core/eden').Eden;

describe("Generate Dependent Definitions", () => {

	test("embed a numeric observable", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression("5 + ${a}");
		expect(ast.toEdenString(eden.root.scope, {})).toEqual("(5 + 5)");
	});

	test("embed a calculated value", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression("5 + ${a*2}");
		expect(ast.toEdenString(eden.root.scope, {})).toEqual("(5 + 10)");
	});

	test("double embedding is allowed", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression("5 + ${a + ${a}}");
		expect(ast.toEdenString(eden.root.scope, {})).toEqual("(5 + 10)");
	});

	test("embed an AST expression node", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression("5 + ${parse('a*b')}");
		expect(ast.toEdenString(eden.root.scope, {})).toEqual("(5 + (a * b))");
	});

	test("embed an AST expression node with dependent", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression('5 + ${parse("${a}*b")}');
		expect(ast.toEdenString(eden.root.scope, {})).toEqual("(5 + (5 * b))");
	});

	test("error if parse error", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		var ast = Eden.AST.parseExpression("5 + ${parse('a*(')}");
		const errcb = jest.fn();
		eden.listenTo('error', null, errcb);
		expect(ast.toEdenString(eden.root.scope,  {})).toEqual("(5 + @)")
		expect(errcb).toHaveBeenCalled();
	});

});