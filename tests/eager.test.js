const Eden = require('../js/core/eden').Eden;

describe("Eager execution correctness", () => {

	it("should execute without observation", async () => {
		let eden = new Eden();
		await eden.exec("a is:eager (func { x = y; })(); y = 6;");
		expect(eden.get("x")).toBe(6);
	});

	it("should execute once despite a dependency chain", async () => {
		let eden = new Eden();
		await eden.exec(`
			x = 3;
			y is x*2;
			a = 0;

			z is:eager (func {
				if (x) {
					a = a:static + y:static;
				}
			})();
	
			x = 4;
			x = 5;
		`);
		expect(eden.get("a")).toBe(24);
	});

});
