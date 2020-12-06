var Eden = require('../js/core/eden').Eden;

describe("Library Symbol Inspect Functions", () => {
	describe("nameof", () => {

		test("library has a nameof function", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["nameof"]).toBeTruthy();
		});

		test("returns symbol name from pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			let result = eden.evalEden("nameof(&xx)");
			expect(result).toEqual("xx");
		});

		test("returns symbol name from backtick pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			let result = eden.evalEden('nameof(&`x{"x"}`)');
			expect(result).toEqual("xx");
		});

	});

	describe("symboldetail", () => {

		test("library has a symboldetail function", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["symboldetail"]).toBeTruthy();
		});

		test("returns symbol information from pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			let result = eden.evalEden("symboldetail(&xx)");
			expect(result).toEqual({name: "xx", source: "xx = @;", dependencies: [], dependants: []});
		});

		test("returns symbol information from string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib; xx = 5;");
			let result = eden.evalEden('symboldetail("xx")');
			expect(result).toEqual({name: "xx", source: "xx = 5;", dependencies: [], dependants: []});
		});

	});

	describe("symbols", () => {

		test("library has a symbols function", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["symboldetail"]).toBeTruthy();
		});

		test("returns a list of symbol names by default", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			await eden.exec("x1 = 0; x2 = 1; x3 = 2;");
			let result = eden.evalEden('symbols("x*")');
			expect(result).toEqual(expect.arrayContaining(["x1","x2","x3"]));
		});

		test("returns a list of symbol sources", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			await eden.exec("x1 = 0; x2 = 1; x3 = 2;");
			let result = eden.evalEden('symbols("x*","source")');
			expect(result).toEqual(expect.arrayContaining(["x1 = 0;","x2 = 1;","x3 = 2;"]));
		});

	});
});