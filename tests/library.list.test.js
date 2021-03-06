var Eden = require('../js/core/eden').Eden;

describe("Library List Functions", () => {

	describe("positionInList", () => {

		test("unsorted with all items", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["positionInList"]).toBeTruthy();
			let val = eden.evalEden("positionInList(5, [1,2,3,4,5,6,7,8])");
			expect(val).toEqual(5);
		});

		test("sorted with all items", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["positionInList"]).toBeTruthy();
			let val = eden.evalEden("positionInList(5, [1,2,3,4,5,6,7,8], @, true)");
			expect(val).toEqual(5);
		});

	});

	describe("reverse", () => {

		test("reverse list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["reverse"]).toBeTruthy();
			let val = eden.evalEden("reverse([1,2,3,4])");
			expect(val).toEqual([4,3,2,1]);
		});

	});

	describe("search", () => {

		test("search list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib; func gt { para a,b; return a - b; }");
			expect(eden.root.symbols["search"]).toBeTruthy();
			let val = eden.evalEden("search(3, [1,2,3,4], gt)");
			expect(val).toEqual(3);
		});

		test("search string", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib; func gt { para a,b; return charCode(a) - charCode(b); }");
			expect(eden.root.symbols["search"]).toBeTruthy();
			let val = eden.evalEden("search('o', 'hello world', gt)");
			expect(val).toEqual(5);
		});

	});

	describe("sort", () => {

		test("sort list ascending", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["sort"]).toBeTruthy();
			let val = eden.evalEden("sort([5,2,7,5,3], 'ascending')");
			expect(val).toEqual([2,3,5,5,7]);
		});

		test("sort list descending", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["sort"]).toBeTruthy();
			let val = eden.evalEden("sort([5,2,7,5,3], 'descending')");
			expect(val).toEqual([7,5,5,3,2]);
		});

	});

	describe("sublist", () => {

		test("sublist normal middle", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["sublist"]).toBeTruthy();
			let val = eden.evalEden("sublist([5,2,7,5,3], 2,4)");
			expect(val).toEqual([2,7,5]);
		});

		test("sublist reversed", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["sublist"]).toBeTruthy();
			let val = eden.evalEden("sublist([5,2,7,5,3], 4,2)");
			expect(val).toEqual([]);
		});

	});

	describe("tail", () => {

		test("tail of list", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["tail"]).toBeTruthy();
			let val = eden.evalEden("tail([1,2,3,4,5])");
			expect(val).toEqual([2,3,4,5]);
		});

	});

	describe("unique", () => {

		test("removes duplicate list elements", async () => {
			let eden = await Eden.create();
			await eden.exec("do lib;");
			expect(eden.root.symbols["unique"]).toBeTruthy();
			let val = eden.evalEden("unique([5,6,3,3,4,2,2])");
			expect(val).toEqual([5,6,3,4,2]);
		});

	});

});