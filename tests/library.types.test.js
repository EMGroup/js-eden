var Eden = require('../js/core/eden').Eden;

describe("Library Type Functions", () => {
	describe("isString", () => {

		test("returns true on string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isString"]).toBeTruthy();
			let result = eden.evalEden("isString('hello')");
			expect(result).toEqual(true);
		});

		test("returns false on non-string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isString"]).toBeTruthy();

			let result = eden.evalEden("isString(6)");
			expect(result).toEqual(false);
			result = eden.evalEden("isString([])");
			expect(result).toEqual(false);
			result = eden.evalEden("isString({})");
			expect(result).toEqual(false);
			result = eden.evalEden("isString(true)");
			expect(result).toEqual(false);
			result = eden.evalEden("isString(@)");
			expect(result).toEqual(false);
		});

	});

	describe("isList", () => {

		test("returns true on list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isList"]).toBeTruthy();
			let result = eden.evalEden("isList([])");
			expect(result).toEqual(true);
		});

		test("returns false on non-list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isList"]).toBeTruthy();

			let result = eden.evalEden("isList(6)");
			expect(result).toEqual(false);
			result = eden.evalEden("isList('hello')");
			expect(result).toEqual(false);
			result = eden.evalEden("isList({})");
			expect(result).toEqual(false);
			result = eden.evalEden("isList(true)");
			expect(result).toEqual(false);
			result = eden.evalEden("isList(@)");
			expect(result).toEqual(false);
		});

	});

	describe("isNumber", () => {

		test("returns true on number", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isNumber"]).toBeTruthy();
			let result = eden.evalEden("isNumber(99)");
			expect(result).toEqual(true);
		});

		test("returns false on non-number", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isNumber"]).toBeTruthy();

			let result = eden.evalEden("isNumber([])");
			expect(result).toEqual(false);
			result = eden.evalEden("isNumber('hello')");
			expect(result).toEqual(false);
			result = eden.evalEden("isNumber({})");
			expect(result).toEqual(false);
			result = eden.evalEden("isNumber(true)");
			expect(result).toEqual(false);
			result = eden.evalEden("isNumber(@)");
			expect(result).toEqual(false);
		});

	});

	describe("isObject", () => {

		test("returns true on object", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isObject"]).toBeTruthy();
			let result = eden.evalEden("isObject({})");
			expect(result).toEqual(true);
		});

		test("returns false on non-object", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isObject"]).toBeTruthy();

			let result = eden.evalEden("isObject([])");
			expect(result).toEqual(false);
			result = eden.evalEden("isObject('hello')");
			expect(result).toEqual(false);
			result = eden.evalEden("isObject(9)");
			expect(result).toEqual(false);
			result = eden.evalEden("isObject(true)");
			expect(result).toEqual(false);
			result = eden.evalEden("isObject(&x)");
			expect(result).toEqual(false);
		});

	});

	describe("isPointer", () => {

		test("returns true on symbol", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isPointer"]).toBeTruthy();
			let result = eden.evalEden("isPointer(&x)");
			expect(result).toEqual(true);
		});

		test("returns false on non-pointer", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["isPointer"]).toBeTruthy();

			let result = eden.evalEden("isPointer([])");
			expect(result).toEqual(false);
			result = eden.evalEden("isPointer('hello')");
			expect(result).toEqual(false);
			result = eden.evalEden("isPointer(9)");
			expect(result).toEqual(false);
			result = eden.evalEden("isPointer(true)");
			expect(result).toEqual(false);
			result = eden.evalEden("isPointer({})");
			expect(result).toEqual(false);
		});

	});

	describe("type", () => {

		test("string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type('hello') == 'string'");
			expect(result).toEqual(true);
		});

		test("number", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type(9) == 'int'");
			expect(result).toEqual(true);
		});

		test("float", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type(9.2) == 'float'");
			expect(result).toEqual(true);
		});

		test("list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type([]) == 'list'");
			expect(result).toEqual(true);
		});

		test("object", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type({}) == 'object'");
			expect(result).toEqual(true);
		});

		test("func", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["type"]).toBeTruthy();
			let result = eden.evalEden("type(func { return 5; }) == 'func'");
			expect(result).toEqual(true);
		});

	});
});