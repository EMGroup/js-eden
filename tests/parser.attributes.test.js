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

});