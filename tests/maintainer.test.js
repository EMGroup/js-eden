const { TestScheduler } = require('jest');

var Eden = require('../js/core/eden').Eden;

test('lookup creates a symbol', ()=>{
	root = new Eden.Folder();
	var sym = root.lookup("sym");
	expect(sym).toBeTruthy();
});

test('assigning changes the value', ()=>{
	root = new Eden.Folder();
	var sym = root.lookup("sym");

	sym.assign(5,root.scope);
	expect(sym.value()).toBe(5);
});

test('assigning marks symbol up-to-date', ()=>{
	root = new Eden.Folder();
	var sym = root.lookup("sym");

	sym.assign(5,root.scope);
	expect(sym.isUpToDate()).toEqual(true);
});

test("Defining an observable marks it out-of-date", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');

	A.assign(10, root.scope);
	B.define(function() { return A.value(); }).subscribe('A');
	expect(B.isUpToDate()).toEqual(false);
});

test("Querying the value of a symbol which relies on a definition should mark it up to date", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');

	A.assign(10, root.scope);
	B.define(function() { return A.value(); }).subscribe('A');
	B.value();

	expect(B.isUpToDate()).toEqual(true);
});

test("Defining an observable in terms of a constant causes it's value to be the constant", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');

	A.define(function() { return 9001; });
	expect(A.value()).toBe(9001);
});

/*test("should raise if a circular dependency introduced", 1, function (assert) {
	var root = new Folder();
	var A = root.lookup('A'),
		B = root.lookup('B');

	A.subscribe('B');
	raises(function () {
		B.subscribe('A');
	});
});*/

/*test("should raise if indirect circular dependency introduced", 1, function (assert) {
	var root = new Folder();
	var A = root.lookup('A'),
		B = root.lookup('B'),
		C = root.lookup('C');
		
		B.subscribe('C');
		C.subscribe('A');

	raises(function () {
		A.subscribe('B');
	});
});*/

test("Subscribing to symbol B adds a subscription in B", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');
	A.subscribe(['B']);
	expect(B.subscribers).toHaveProperty(A.name);
});

test("Observing symbol B adds an observer in B", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');

	A.observe('B');
	expect(B.observers).toHaveProperty(A.name);
});

test("Assigning to a symbol removes subscriptions from symbols subscribed to", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');
	A.subscribe('B');
	A.assign(2, root.scope);

	expect(B.subscribers[A.name]).toBeUndefined();
});

test("Defining a symbol removes subscriptions from symbols previously subscribed to", () => {
	var root = new Eden.Folder();
	var A = root.lookup('A');
	var B = root.lookup('B');
	A.subscribe('B');
	A.define(function() { return 2; });

	expect(B.subscribers[A.name]).toBeUndefined();
});

/*test("Assigning to an observed symbol causes the triggered action to fire", () => {
	var action = function() {};

	assertTriggered(action, function(action) {
		var root = new Folder();

		var watchB = root.lookup('watchB');
		var B = root.lookup('B');

		watchB.assign(action, root.scope);
		watchB.observe('B');

		B.assign(10, root.scope);
	});
});

test("An observed symbol updated via dependency causes its observer to fire", function (assert) {
	var action = function() {};

	assertTriggered(action, function(action) {
		var root = new Folder();

		var watchB = root.lookup('watchB');
		var A = root.lookup('A');
		var B = root.lookup('B');

		B.define(function() { A.value() + 1; }).subscribe('A');

		watchB.assign(action, root.scope);
		watchB.observe('B');

		A.assign(10, root.scope);
	});
});

test("Defining an observable in terms of a constant causes it's value to be the constant", function (assert) {
	var root = new Folder();
	var A = root.lookup('A');

	A.define(function() { return 9001; });
	equal(A.value(), 9001);
});*/