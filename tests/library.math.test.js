var Eden = require('../js/core/eden').Eden;

describe("Library Math Functions", () => {

	test("roundDown returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["roundDown"]).toBeTruthy();
		let val = eden.evalEden("roundDown(5.2)");
		expect(val).toEqual(5);
	});

	test("roundUp returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["roundUp"]).toBeTruthy();
		let val = eden.evalEden("roundUp(5.2)");
		expect(val).toEqual(6);
	});

	test("round returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["round"]).toBeTruthy();
		let val = eden.evalEden("round(5.2)");
		expect(val).toEqual(5);
	});

	test("floor returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["floor"]).toBeTruthy();
		let val = eden.evalEden("floor(5.2)");
		expect(val).toEqual(5);
	});

	test("ceil returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["ceil"]).toBeTruthy();
		let val = eden.evalEden("ceil(5.2)");
		expect(val).toEqual(6);
	});

	test("abs returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["abs"]).toBeTruthy();
		let val = eden.evalEden("abs(-2)");
		expect(val).toEqual(2);
	});

	test("acos returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["acos"]).toBeTruthy();
		let val = eden.evalEden("acos(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("asin returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["asin"]).toBeTruthy();
		let val = eden.evalEden("asin(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("atan returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["atan"]).toBeTruthy();
		let val = eden.evalEden("atan(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("exp returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["exp"]).toBeTruthy();
		let val = eden.evalEden("exp(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("ln returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["ln"]).toBeTruthy();
		let val = eden.evalEden("ln(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("log returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["log"]).toBeTruthy();
		let val = eden.evalEden("log(5.2)");
		expect(typeof val).toEqual("number");
	});

	test("max returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["max"]).toBeTruthy();
		let val = eden.evalEden("max([1,2,3])");
		expect(val).toEqual(3);
		val = eden.evalEden("max(1,2,3)");
		expect(val).toEqual(3);
	});

	test("min returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["min"]).toBeTruthy();
		let val = eden.evalEden("min([1,2,3])");
		expect(val).toEqual(1);
		val = eden.evalEden("min(1,2,3)");
		expect(val).toEqual(1);
	});

	test("pow returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["pow"]).toBeTruthy();
		let val = eden.evalEden("pow(5.2,2)");
		expect(typeof val).toEqual("number");
	});

	test("randomBoolean returns a boolean", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["randomBoolean"]).toBeTruthy();
		let val = eden.evalEden("randomBoolean()");
		expect(typeof val).toEqual("boolean");
	});

	test("randomInteger returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["randomInteger"]).toBeTruthy();
		let val = eden.evalEden("randomInteger(1,10)");
		expect(typeof val).toEqual("number");
	});

	test("randomFloat returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["randomFloat"]).toBeTruthy();
		let val = eden.evalEden("randomFloat(1,10)");
		expect(typeof val).toEqual("number");
	});

	test("random returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["random"]).toBeTruthy();
		let val = eden.evalEden("random()");
		expect(typeof val).toEqual("number");
	});

	test("sin returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["sin"]).toBeTruthy();
		let val = eden.evalEden("sin(5.0)");
		expect(typeof val).toEqual("number");
	});

	test("cos returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["cos"]).toBeTruthy();
		let val = eden.evalEden("cos(5.0)");
		expect(typeof val).toEqual("number");
	});

	test("tan returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["tan"]).toBeTruthy();
		let val = eden.evalEden("tan(5.0)");
		expect(typeof val).toEqual("number");
	});

	test("sqrt returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["sqrt"]).toBeTruthy();
		let val = eden.evalEden("sqrt(5.0)");
		expect(typeof val).toEqual("number");
	});

	test("sum returns a number", async () => {
		let eden = await Eden.create();
		await eden.exec("do lib;");
		expect(eden.root.symbols["sum"]).toBeTruthy();
		let val = eden.evalEden("sum([1,2,3])");
		expect(val).toEqual(6);
		val = eden.evalEden("sum(1,2,3)");
		expect(val).toEqual(6);
	});

});