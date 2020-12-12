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

	test("define as an if statement", async () => {
		let eden = new Eden();
		await eden.exec("a = 4; b = 5; c = true; d is a if c else b;");
		expect(eden.get("d")).toBe(4);
		await eden.exec("c = false;");
		expect(eden.get("d")).toBe(5);
	});

	test("define an arithmetic expression", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; b is a + a*a - 2;");
		expect(eden.get("b")).toBe(28);
	});

	test("define with static on rhs and eager", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; b is:eager a:static; a = 6;");
		expect(eden.get("b")).toBe(5);
	});

	test("define changed attribute", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; b is a:changed;");
		expect(eden.get("b")).toBe(true);
		await eden.exec("a = 5;");
		expect(eden.get("b")).toBe(false);
		await eden.exec("a = 6;");
		expect(eden.get("b")).toBe(true);
	});

});

describe("Execution of scoped definitions", () => {
	
	test("simple direct replacement", async () => {
		let eden = new Eden();
		await eden.exec("b is a*a with a = 5;");
		expect(eden.get("b")).toBe(25);
	});

	test("simple direct replacement of existing", async () => {
		let eden = new Eden();
		await eden.exec("a = 2; b is a*a with a = 5;");
		expect(eden.get("b")).toBe(25);
	});

	test("simple indirect replacement of existing", async () => {
		let eden = new Eden();
		await eden.exec("a = 2; b is a*a; c is b+2 with a = 5;");
		expect(eden.get("c")).toBe(27);
	});

	test("dereferenced indirect replacement", async () => {
		let eden = new Eden();
		await eden.exec("d = 5; b is *a * 2; c is b+2 with a = &d;");
		expect(eden.get("c")).toBe(12);
		await eden.exec("d = 6;");
		expect(eden.get("c")).toBe(14);
		await eden.exec("d = 7;");
		expect(eden.get("c")).toBe(16);
	});

	test("range direct replacement", async () => {
		let eden = new Eden();
		await eden.exec("b is a*a with a = 1..5;");
		expect(eden.get("b")).toEqual([1,4,9,16,25]);
	});

	test("dual range direct replacement", async () => {
		let eden = new Eden();
		await eden.exec("e is a+b with a = 1..3, b = 1..2;");
		expect(eden.get("e")).toEqual([2,3,4,3,4,5]);
	});

	test("nested expression scopes", async () => {
		let eden = new Eden();
		expect.assertions(1);
		eden.exec("d is ((a+b) with b = c*2) with a=2,c = 1..2;").catch(e => {
			expect(e).toBeTruthy();
		});
	});

	test("unnested expression scopes", async () => {
		let eden = new Eden();
		await eden.exec("d is ((a+b) with b = c*2); e is d with a=2,c = 1..2;");
		expect(eden.get("e")).toEqual([4,6]);
	});

});

describe("Execution of Do Statements", () => {

	test("execute local action", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("action test1 { a = 78; } do test1;");
		expect(eden.get("a")).toBe(78);
	});

	test("direct 'do' of script", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			
		});
		await eden.exec("do { a = 79; }");
		expect(eden.get("a")).toBe(79);
	});

	test("script without 'do' does nothing", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			
		});
		await eden.exec("{ a = 79; }");
		expect(eden.get("a")).toBeUndefined();
	});

});

describe("Execution of If Statements", () => {

	test("no else if with single statement, true case", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("a = 5; b = 4; if (a == 5) b = 7;");
		expect(eden.get("b")).toBe(7);
	});

	test("no else if with single statement, false case", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("a = 5; b = 4; if (a == 2) b = 7;");
		expect(eden.get("b")).toBe(4);
	});

	test("else if with single statement, false case", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("a = 5; b = 4; if (a == 2) b = 7; else b = 44;");
		expect(eden.get("b")).toBe(44);
	});

});

describe("Execution of While Statements", () => {

	test("count to 10", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("a = 0; while (a < 10) a = a + 1;");
		expect(eden.get("a")).toBe(10);
	});

	test("false from start", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		await eden.exec("a = 10; while (a < 10) a = a + 1;");
		expect(eden.get("a")).toBe(10);
	});

});

describe("Execution of Return Statement", () => {

	test("return before end", async () => {
		let eden = new Eden();
		eden.listenTo("error", null, (agent, err) => {
			throw err;
		});
		var val = await eden.exec("a = 5; return 6; a = 7;");
		expect(eden.get("a")).toBe(5);
		expect(val).toBe(6);
	});

});


describe("Execution of Concat Modifier", () => {

	test("concat of list", async () => {
		let eden = new Eden();
		await eden.exec("a = [1,2,3]; a //= [4];");
		expect(eden.get("a")).toEqual([1,2,3,4]);
	});

	test("concat fails on non-list lhs", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; a //= [4];");
		expect(eden.get("a")).toEqual(5);
	});

});

describe("Execution of *= Modifier", () => {

	test("multiply assign on numbers", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; a *= 5;");
		expect(eden.get("a")).toEqual(25);
	});

	// Javascript seems to allow this!!
	/*test("multiple assign fails with lhs list", async () => {
		let eden = new Eden();
		await eden.exec("a = [5]; a *= 4;");
		expect(eden.get("a")).toEqual([5]);
	});*/

});

describe("Execution of ++ -- Modifier", () => {

	test("increment a number", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; a++;");
		expect(eden.get("a")).toEqual(6);
	});

	test("decrement a number", async () => {
		let eden = new Eden();
		await eden.exec("a = 5; a--;");
		expect(eden.get("a")).toEqual(4);
	});

});

describe("Execution of For Loop", () => {

	test("regular c-style loop", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i=0; i<10; i++) b += i; ");
		expect(eden.get("b")).toEqual(45);
	});

	test("regular c-style loop without init", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; i=0; for (; i<10; i++) b += i; ");
		expect(eden.get("b")).toEqual(45);
	});

	test("regular c-style loop without increment", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i=0; i<10;) { b += i; i++; }");
		expect(eden.get("b")).toEqual(45);
	});

	test("regular c-style loop without condition", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i=0; ; i++) { if (i >= 10) break; b += i; }");
		expect(eden.get("b")).toEqual(45);
	});

	test("regular c-style loop with deep break", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i=0; ; i++) { if (true) { if (true) { if (i >= 10) break; }} b += i; }");
		expect(eden.get("b")).toEqual(45);
	});

	test("for in list loop", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i in [1,2,3]) b += i;");
		expect(eden.get("b")).toEqual(6);
	});

	test("for in observable loop", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; a = [1,2,3]; for (i in a) b += i;");
		expect(eden.get("b")).toEqual(6);
	});

	test("for in range loop", async () => {
		let eden = new Eden();
		await eden.exec("b = 0; for (i in 1..3) b += i;");
		expect(eden.get("b")).toEqual(6);
	});

});
