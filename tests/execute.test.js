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

});
