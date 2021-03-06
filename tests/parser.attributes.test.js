var Eden = require('../js/core/eden').Eden;

describe("Attribute Accessor", () => {

	describe("name", () => {

		test("name of assigned observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa = 55;");
			expect(ast.attribute("name", eden.root.scope)).toEqual("aa");
		});

		test("name of defined observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa is 55;");
			expect(ast.attribute("name", eden.root.scope)).toEqual("aa");
		});

		test("name of script", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("action xx {}");
			expect(ast.attribute("name", eden.root.scope)).toEqual("xx");
		});

		test("no name for un-named statement", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("if (a) {}");
			expect(ast.attribute("name", eden.root.scope)).toBeUndefined();
		});

	});

	describe("source", () => {

		test("source of defined observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa is a + b;");
			expect(ast.attribute("source", eden.root.scope)).toEqual("aa is a + b;");
		});

	});

	describe("expression", () => {

		test("expression of defined observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa is a + b;");
			expect(ast.attribute("expression", eden.root.scope)).toEqual("a + b");
		});

	});

	describe("symbol", () => {

		test("symbol of defined observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa is a + b;");
			expect(ast.attribute("symbol", eden.root.scope).name).toEqual("aa");
		});

	});

	describe("value", () => {

		test("value of defined observable", () => {
			let eden = new Eden();
			var ast = Eden.AST.parseStatement("aa is 5 + 6;");
			expect(ast.attribute("value", eden.root.scope)).toEqual(11);
		});

	});

});