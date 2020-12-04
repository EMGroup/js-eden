var Eden = require('../js/core/eden').Eden;

describe("Execution of Observable Assignments", () => {

	test("assign a number to a symbol", async () => {
		let eden = new Eden();
		await eden.exec("a = 5;");
		expect(eden.get("a")).toBe(5);
	});

	test("assign a list to a symbol", async () => {
		let eden = new Eden();
		await eden.exec("a = [5];");
		expect(eden.get("a")).toHaveLength(1);
	});

	test("assign one observable to another", async () => {
		let eden = new Eden();
		await eden.exec("a = 9; b = a;");
		expect(eden.get("b")).toBe(9);
	});

	test("assign a simple binary expression", async () => {
		let eden = new Eden();
		await eden.exec("a = 9 + 2;");
		expect(eden.get("a")).toBe(11);
	});

	test("assign using an inline if", async () => {
		let eden = new Eden();
		await eden.exec("a = 9; b = 2 if a == 9 else 0;");
		expect(eden.get("b")).toBe(2);
		await eden.exec("a = 9; b = 2 if a != 9 else 0;");
		expect(eden.get("b")).toBe(0);
	});

	test("assign from a template identifier", async () => {
		let eden = new Eden();
		await eden.exec('a = "c"; testc = 44; b = `test{a}`;');
		expect(eden.get("b")).toBe(44);
	});

	test("assign from a list indexed item", async () => {
		let eden = new Eden();
		await eden.exec("a = [1,2,3,4]; b = a[3];");
		expect(eden.get("b")).toBe(3);
	});

	test("assign with a static attribute", async () => {
		let eden = new Eden();
		await eden.exec("a:[static] = 5;");
		expect(eden.get("a")).toBe(5);
		expect(eden.getAttribute("a","static")).toEqual(true);

		await eden.exec("a:static = 6;");
		expect(eden.get("a")).toBe(6);
		expect(eden.getAttribute("a","static")).toEqual(true);
		// TODO: Check a warning was produced.
	});

	test("assign with a type attribute", async () => {
		let eden = new Eden();
		await eden.exec("a:number = 5;");
		expect(eden.get("a")).toBe(5);
		
		await eden.exec("a:number = 'hello';");
		expect(eden.get("a")).toBe(5);
		// TODO: Check an error or warning was produced.

		await eden.exec("a:number = 20;");
		expect(eden.get("a")).toBe(20);

		await eden.exec("a = 'hello';");
		expect(eden.get("a")).toBe(20);
		// TODO: Check an error or warning was produced

		await eden.exec("a:string = 'hello';");
		expect(eden.get("a")).toEqual("hello");
	});

});

describe("Execution of Observable Definitions", () => {

	test("define as a numeric constant", async () => {
		let eden = new Eden();
		await eden.exec("a is 5;");
		expect(eden.get("a")).toBe(5);
	});

	test("define as a dependency on another", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; b is a;");
		expect(eden.get("b")).toBe(5);
		expect(eden.getAttribute("b","depends")).toEqual(["a"]);
		await eden.exec("a = 6;");
		expect(eden.get("b")).toBe(6);
	});

	test("define as a function call", async () => {
		let eden = new Eden();
		await eden.exec("func tfunc { para a; return a*a; } b is tfunc(5);");
		expect(eden.get("b")).toBe(25);
	});

});
