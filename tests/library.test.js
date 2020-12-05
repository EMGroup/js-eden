var Eden = require('../js/core/eden').Eden;

describe("Library Type Functions", () => {
	describe("isString", () => {

		test("returns true on string", async () => {
			let eden = new Eden();
			await eden.ready;
			await eden.exec("do lib;");
			expect(eden.root.symbols["isString"]).toBeTruthy();
			let result = eden.evalEden("isString('hello')");
			expect(result).toEqual(true);
		});

	});
});