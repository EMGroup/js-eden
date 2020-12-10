var Eden = require('../js/core/eden').Eden;

describe("Library String Functions", () => {

	describe("edenCode", () => {

		test("can generate a list string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["edenCode"]).toBeTruthy();
			let val = eden.evalEden("edenCode([1,2,3])");
			expect(val).toEqual("[1, 2, 3]");
		});

		test("can generate an object string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["edenCode"]).toBeTruthy();
			let val = eden.evalEden("edenCode({a: 5})");
			expect(val).toEqual("{a: 5}");
		});

	});

	describe("concat", () => {

		test("can concat string arguments", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["concat"]).toBeTruthy();
			let val = eden.evalEden('concat(" ", "hello", "world")');
			expect(val).toEqual("hello world");
		});

		test("can concat list of strings", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["concat"]).toBeTruthy();
			let val = eden.evalEden('concat(" ", ["hello", "world"])');
			expect(val).toEqual("hello world");
		});

	});

	describe("lowercase", () => {

		test("can change case", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["lowercase"]).toBeTruthy();
			let val = eden.evalEden('lowercase("HELLO WORLD")');
			expect(val).toEqual("hello world");
		});

	});

	describe("positionOfRE", () => {

		test("can find a pattern string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["positionOfRE"]).toBeTruthy();
			let val = eden.evalEden('positionOfRE("[A-Z][a-z]*", "something Big is  brewing")');
			expect(val).toEqual(11);
		});

	});

	describe("replaceFirst", () => {

		test("can replace middle", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["replaceFirst"]).toBeTruthy();
			let val = eden.evalEden('replaceFirst("hello world again", "world", "Alan")');
			expect(val).toEqual("hello Alan again");
		});

	});

	describe("substitute", () => {

		test("can substitute a single value", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["substitute"]).toBeTruthy();
			let val = eden.evalEden('substitute("Welcome {1}.", "Alan")');
			expect(val).toEqual("Welcome Alan.");
		});

	});

	describe("substr", () => {

		test("can get first part to end", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["substr"]).toBeTruthy();
			let val = eden.evalEden('substr("hello world", 7)');
			expect(val).toEqual("world");
		});

		test("can get middle", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["substr"]).toBeTruthy();
			let val = eden.evalEden('substr("hello world", 7,9)');
			expect(val).toEqual("wor");
		});

	});

	describe("substringPosition", () => {

		test("can find valid substring", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["substringPosition"]).toBeTruthy();
			let val = eden.evalEden('substringPosition("test", "another test string")');
			expect(val).toEqual(9);
		});

		test("zero on no substring", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["substringPosition"]).toBeTruthy();
			let val = eden.evalEden('substringPosition("hello", "another test string")');
			expect(val).toEqual(0);
		});

	});

	describe("trim", () => {

		test("remove from both ends", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["trim"]).toBeTruthy();
			let val = eden.evalEden('trim("    hello world  ")');
			expect(val).toEqual("hello world");
		});

	});

	describe("uppercase", () => {

		test("can change case", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["uppercase"]).toBeTruthy();
			let val = eden.evalEden('uppercase("hello world")');
			expect(val).toEqual("HELLO WORLD");
		});

	});

	describe("startsWith", () => {

		test("valid case", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["startsWith"]).toBeTruthy();
			let val = eden.evalEden('startsWith("hello world", "hello")');
			expect(val).toEqual(true);
		});

		test("invalid case", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["startsWith"]).toBeTruthy();
			let val = eden.evalEden('startsWith("hello world", "world")');
			expect(val).toEqual(false);
		});

	});

	describe("splitString", () => {

		test("can split into list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["splitString"]).toBeTruthy();
			let val = eden.evalEden('splitString("hello world again", " ")');
			expect(val).toEqual(["hello","world","again"]);
		});

	});

});