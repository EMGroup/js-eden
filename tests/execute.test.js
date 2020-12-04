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

});
