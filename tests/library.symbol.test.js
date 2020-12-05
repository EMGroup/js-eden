var Eden = require('../js/core/eden').Eden;

describe("Library Symbol Inspect Functions", () => {
	describe("nameof", () => {

		test("returns symbol name from pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["nameof"]).toBeTruthy();
			let result = eden.evalEden("nameof(&xx)");
			expect(result).toEqual("xx");
		});

		test("returns symbol name from backtick pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["nameof"]).toBeTruthy();
			let result = eden.evalEden('nameof(&`x{"x"}`)');
			expect(result).toEqual("xx");
		});

	});

	describe("symboldetail", () => {

		test("returns symbol information from pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["symboldetail"]).toBeTruthy();
			let result = eden.evalEden("symboldetail(&xx)");
			expect(result).toEqual({name: "xx", source: "xx = @;", dependencies: [], dependants: []});
		});

		test("returns symbol information from string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib; xx = 5;");
			expect(eden.root.symbols["symboldetail"]).toBeTruthy();
			let result = eden.evalEden('symboldetail("xx")');
			expect(result).toEqual({name: "xx", source: "xx = 5;", dependencies: [], dependants: []});
		});

	});
});