// contains all the test cases for jseden stuff
// as well as some test helpers
var Test = (function() {
	return {
		assertTriggered: function(action, code) {
			var fired = false;
			code(function(context) {
				fired = true;
				action(context);
			});

			if (!fired) {
				throw "Action failed to fire";
			}
		},

		assertEqual: function(x, y) { 
			// XXX: only works for number and string types for now
			if (x !== y) {
				throw x + ' === ' + y;
			}
		},
		
		assertNotEqual: function(x, y) { 
			// XXX: only works for number and string types for now
			if (x === y) {
				throw x + ' !== ' + y;
			}
		},

		assertThrows: function(f) {
			var threw = true;
			try {
				f.apply(undefined, Array.prototype.slice.call(arguments,1));
				threw = false;
			} catch (e) {
				threw = true;
			}
			if (!threw) {
				throw "Didn't throw an exception with args: " + Array.prototype.slice(arguments);
			}
		},

		assertHasProperty: function(o, p) {
			if (!o.hasOwnProperty(p)) {
				throw "Object didn't have property " + p;
			}
		}
	}
})();

function runTests(list_of_tests) {
	var tests_failed = 0;
	var tests_passed = 0;
	
	$.each(list_of_tests, function(i, test) {
		try {
			test.code(Test);
			tests_passed++;
		} catch (e) {
			tests_failed++;
			console.error("Failed test " + i + " (" + test.name + "):" + (e.message || e));
		}
	});
	
	console.log("Passed: " + tests_passed + ", Failed: " + tests_failed);
}

var all_the_tests = [
	{
		name: "Lookup results in a symbol",
		code: function(t) {
			var root = new Folder();
			t.assertNotEqual(root.lookup('a').value, undefined);
		}

	},

	{
		name: "Assignment sets the correct value",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = 2;"));
			t.assertEqual(root.lookup('x').value(), 2);
		}
	},

	{
		name: "Increment results in a value 1 greater",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = 2; x++;"));
			t.assertEqual(root.lookup('x').value(), 3);
		}
	},
	
	{
		name: "+= op works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = 2; x += 2;"));
			t.assertEqual(root.lookup('x').value(), 4);
		}
	},	
	

	{
		name: "The value after formula definition is correct",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = 3; a is x;"));
			t.assertEqual(root.lookup('a').value(), 3);
		}
	},

	{
		name: "Function definition stores a function in the symbol table",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("func f {}"));
			t.assertEqual(typeof root.lookup('f').value(), "function");
		}
	},

	{
		name: "Procedure definition stores a function in the symbol table",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("proc p {}"));
			t.assertEqual(typeof root.lookup('p').value(), "function");
		}
	},

	{
		name: "Triggered action definition stores a function in the symbol table",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("proc p : x {}"));
			t.assertEqual(typeof root.lookup('p').value(), "function");
		}
	},

	{
		name: "Triggered action definition observes a requested symbol",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("proc p : x {}"));
			t.assertNotEqual(root.lookup('p').observees['/x'], undefined);
		}
	},

	{
		name: "Function calls work",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("func f {} f();"));
		}
	},

	{
		name: "Return statement from a function works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("func power { return 9000; }"));
			t.assertEqual(root.lookup('power').value()(), 9000);
		}
	},
	
	{
		name: "Function parameters work",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("func id { return $1; }"));
			t.assertEqual(root.lookup('id').value()(9001), 9001);
		}
	},

	{
		name: "Parameter aliases work",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("func id { para x; return x; }"));
			t.assertEqual(root.lookup('id').value()(9001), 9001);
		}
	},

	{
		name: "Nested strings work",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('x = "\\\"";'));
			t.assertEqual(root.lookup('x').value(), '"');
		}
	},
	
	{
		name: "Multiline strings work",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('x = "\n\nfoo\n\n";'));
			t.assertEqual(root.lookup('x').value(), '\n\nfoo\n\n');
		}
	},
	
	{
		name: "Multiple function definitions with locals works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('func f { auto x; x; } func g { auto y; y; }'));
		}
	},
	
	{
		name: "Underscores in observable names works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('x_1;'));
		}
	},
	
	{
		name: "Autos work in a function definition",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('func f { auto x; x = 2; }'));
		}
	},
	
	{
		name: "Autos work in a procedure definition",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('proc p { auto x; x = 2; }'));
		}
	},
	
	{
		name: "Autos protect the outside scope",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript('x = 2; func f { auto x; x = 10; } f();'));
			t.assertEqual(root.lookup('x').value(), 2);
		}
	},
	
	{
		name: "Single quoting a character works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = 'a';"));
			t.assertEqual(root.lookup('x').value(), "a");
		}
	},

	{
		name: "Empty quotes won't parse",
		code: function(t) {
			var root = new Folder();
			t.assertThrows(translateEdenToJavaScript, "'';");
		}
	},

	{
		name: "Single quoting an escaped quote character works",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = '\\\'';"));
			t.assertEqual(root.lookup('x').value(), "'");
		}
	},
	
	{
		name: "Lists are 1 indexed",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = [20,30,40]; y = x[1];"));
			t.assertEqual(root.lookup('y').value(), 20);
		}
	},
	
	{
		name: "Lists are value types",
		code: function(t) {
			var root = new Folder();
			eval(translateEdenToJavaScript("x = [1,2,3]; func f { $1 = 9000; } f(x);"));
			t.assertEqual(root.lookup('x').value()[0], 1);
		}
	}
];

var list_tests = [
	{
		name: ".get(i) returns an accessor with index i",
		code: function(t) {
			var l = new Eden.List(9002,1,1);
			t.assertEqual(l.get(2).index, 2);
		}
	},
	{
		name: ".get() returns an lvalue",
		code: function(t) {
			var l = new Eden.List(9002,1,1);
			t.assertNotEqual(l.get(1).value, undefined);
		}
	},
	{
		name: "Lists are 1 indexed",
		code: function(t) {
			var l = new Eden.List(9002,1,1);
			t.assertEqual(l.get(1).value(), 9002);
		}
	},
	{
		name: "Assigning to an index accessor works",
		code: function(t) {
			var l = new Eden.List(9003,1,1);
			l.get(1).assign(1000);
			t.assertEqual(l.get(1).value(), 1000);
		}
	}
]

var accessor_tests = [
	{
		name: ".get(i) returns an accessor with index i",
		code: function(t) {
			var l = new Symbol().assign([1,2,3]);
			t.assertEqual(Utils.arrayEquals(l.get(2).keys, [2]), true);
		}
	},
	{
		name: ".get() returns an lvalue",
		code: function(t) {
			var l = new Symbol().assign([9002,1,1]);
			t.assertNotEqual(l.get(0).value, undefined);
		}
	},
	{
		name: "Lists are 1 indexed",
		code: function(t) {
			var l = new Symbol().assign([9002,1,1]);
			t.assertEqual(l.get(0).value(), 9002);
		}
	},
	{
		name: "Assigning to an index accessor works",
		code: function(t) {
			var l = new Symbol().assign([9003,1,1]);
			l.get(1).assign(1000);
			t.assertEqual(l.get(1).value(), 1000);
		}
	}
]

var maintainer_tests = [
	{
		name: "Lookup results in a symbol",
		code: function(t) {
			var root = new Folder();
			t.assertNotEqual(root.lookup('a').value, undefined);
		}
	},

	{
		name: "A symbol just assigned to is marked up to date",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');

			A.assign(10);
			t.assertEqual(A.up_to_date, true);
		}
	},


	{
		name: "Assigning to a symbol sets the value",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			A.assign(10);
			t.assertEqual(A.value(), 10);
		}
	},

	{
		name: "Defining a symbol marks it as not up to date",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			A.define(function() { return 2; });
			t.assertEqual(A.up_to_date, false);
		}
	},

	{
		name: "Querying the value of a symbol which relies on a definition should mark it up to date",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');

			A.assign(10);
			B.define(function() { return A.value(); }).subscribe('A');
			B.value();

			t.assertEqual(B.up_to_date, true);
		}
	},

	{
		name: "Defining an observable in terms of a constant causes it's value to be the constant",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');

			A.define(function() { return 9001; });
			t.assertEqual(A.value(), 9001);
		}
	},

	{
		name: "Subscribing to symbol B adds a subscription in B",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');
			A.subscribe(['B']);
			t.assertHasProperty(B.subscribers, A.name);
		}
	},

	{
		name: "Observing symbol B adds an observer in B",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');

			A.observe('B');
			t.assertHasProperty(B.observers, A.name);
		}
	},

	{
		name: "Assigning to a symbol removes subscriptions from symbols subscribed to",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');
			A.subscribe('B');
			A.assign(2);

			t.assertEqual(B.subscribers[A.name], undefined);
		}
	},

	{
		name: "Defining a symbol removes subscriptions from symbols previously subscribed to",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');
			A.subscribe('B');
			A.define(function() { return 2; });

			t.assertEqual(B.subscribers[A.name], undefined);
		}
	},

	{
		name: "Assigning to a symbol sets its subscribers as not up to date",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');

			B.assign(2);
			A.define(function() {});
			A.subscribe('B');
			A.value();
			B.assign(2);

			t.assertEqual(A.up_to_date, false);
		}
	},

	{
		name: "Assigning to an observed symbol causes the triggered action to fire",
		code: function(t) {
			var action = function() {};

			t.assertTriggered(action, function(action) {
				var root = new Folder();

				var watchB = root.lookup('watchB');
				var B = root.lookup('B');

				watchB.assign(action);
				watchB.observe('B');

				B.assign(10);
			});
		}
	},

	{
		name: "An observed symbol updated via dependency causes its observer to fire",
		code: function(t) {
			var action = function() {};

			t.assertTriggered(action, function(action) {
				var root = new Folder();

				var watchB = root.lookup('watchB');
				var A = root.lookup('A');
				var B = root.lookup('B');

				B.define(function() { A.value() + 1; }).subscribe('A');

				watchB.assign(action);
				watchB.observe('B');

				A.assign(10);
			});
		}
	},

	{
		name: "Defining an observable in terms of a constant causes it's value to be the constant",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');

			A.define(function() { return 9001; });
			t.assertEqual(A.value(), 9001);
		}
	},

	{
		name: "Assigning to an array element expires any symbols subscribed to the array",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');

			A.assign([1,2,3]);
			B.define(function() { return A.value(); }).subscribe('A');
			B.value();

			A.get(0).assign(10);
			t.assertEqual(B.up_to_date, false);
		}
	},

	{
		name: "Assigning to a nested array element expires any symbols subscribed to the array",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');

			A.assign([[1],2,3]);
			B.define(function() { return A.value(); }).subscribe('A');
			B.value();

			A.get(0).get(0).assign(10);
			t.assertEqual(B.up_to_date, false);
		}
	},

	{
		name: "Expiration via subscriptions propogates",
		code: function(t) {
			var root = new Folder();
			var A = root.lookup('A');
			var B = root.lookup('B');
			var C = root.lookup('C');

			A.assign(10);
			B.define(function() { return A.value(); }).subscribe('A');
			C.define(function() { return B.value(); }).subscribe('B');
			C.value();

			A.assign(10);

			t.assertEqual(C.up_to_date, false);
		}
	}
];
