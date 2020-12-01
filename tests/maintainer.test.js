const { TestScheduler } = require('jest');

var Eden = require('../js/core/eden').Eden;

test('simple assign value', ()=>{
	root = new Eden.Folder();
	var sym = root.lookup("sym");

	sym.assign(5,root.scope);
	expect(sym.value()).toBe(5);
});
