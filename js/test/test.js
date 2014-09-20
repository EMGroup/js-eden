var root;
var eden;

QUnit.module("Eden#execute", {
	setup: function () {
		root = new Folder();
		eden = new Eden();
	}
});

test("Do while loop", function () {
	eden.execute("x = 0; do { x++; } while (x < 5);");
	equal(root.lookup('x').value(), 5);
});

test("Assignment sets the correct value", function () {
	eden.execute("x = 2;");
	equal(root.lookup('x').value(), 2);
});

test("Increment results in a value 1 greater", function () {
	eden.execute("x = 2; x++;");
	equal(root.lookup('x').value(), 3);
});

test("+= op works", function () {
	eden.execute("x = 2; x += 2;");
	equal(root.lookup('x').value(), 4);
});

test("The value after formula definition is correct", function () {
	eden.execute("x = 3; a is x;");
	equal(root.lookup('a').value(), 3);
});

test("Function definition stores a function in the symbol table", function () {
	eden.execute("func f {}");
	equal(typeof root.lookup('f').value(), "function");
});

test("Procedure definition stores a function in the symbol table", function () {
	eden.execute("proc p {}");
	equal(typeof root.lookup('p').value(), "function");
});

test("Triggered action definition stores a function in the symbol table", function () {
	eden.execute("proc p : x {}");
	equal(typeof root.lookup('p').value(), "function");
});

test("Triggered action definition observes a requested symbol", function () {
	eden.execute("proc p : x {}");
	notEqual(root.lookup('p').observees['/x'], undefined);
});

test("Function calls work", function () {
	eden.execute("func f { x = 2; } f();");
	equal(root.lookup('x').value(), 2);
});

test("Return statement from a function works", function () {
	eden.execute("func power { return 9000; }");
	equal(root.lookup('power').value()(), 9000);
});

test("Function parameters work", function () {
	eden.execute("func id { return $1; }");
	equal(root.lookup('id').value()(9001), 9001);
});

test("Parameter aliases work", function () {
	eden.execute("func id { para x; return x; }");
	equal(root.lookup('id').value()(9001), 9001);
});

test("Nested strings work", function () {
	eden.execute('x = "\\\"";');
	equal(root.lookup('x').value(), '"');
});

test("Multiline strings work", function () {
	eden.execute('x = "\n\nfoo\n\n";');
	equal(root.lookup('x').value(), '\n\nfoo\n\n');
});

test("Multiple function definitions with locals works", function () {
	eden.execute('func f { auto x; x; } func g { auto y; y; }');
	ok(true);
});

test("Underscores in observable names works", function () {
	eden.execute('x_1 = 20;');
	equal(root.lookup('x_1').value(), 20);
});

test("Autos work in a function definition", function () {
	eden.execute('func f { auto x; x = 3; return x; }');
	equal(root.lookup('f').value()(), 3);
});

test("Autos work in a procedure definition", function () {
	eden.execute('proc p { auto x; x = 4; return x; }');
	equal(root.lookup('p').value()(), 4);
});

test("Autos protect the outside scope", function () {
	eden.execute('x = 2; func f { auto x; x = 10; } f();');
	equal(root.lookup('x').value(), 2);
});

test("Single quoting a character works", function () {
	eden.execute("x = 'a';");
	equal(root.lookup('x').value(), "a");
});

test("Empty quotes won't parse", function () {
	try {
		eden.translateToJavaScript("'';");
	} catch (e) {
		ok(true);
	}
});

test("Single quoting an escaped quote character works", function () {
	eden.execute("x = '\\\'';");
	equal(root.lookup('x').value(), "'");
});

test("Lists are 1 indexed", function () {
	eden.execute("x = [20,30,40]; y = x[1];");
	equal(root.lookup('y').value(), 20);
});

test("Lists are value types", function () {
	eden.execute("x = [1,2,3]; func f { $1 = 9000; } f(x);");
	equal(root.lookup('x').value()[0], 1);
});

test("Scoping for triggered actions", function () {
	// the parser used to get confused about triggered actions, causing scoping problems
	eden.execute("x = 1; proc p : z {} func f { para x; } y is x;");
	equal(root.lookup('y').value(), 1);
});

test("include defers execution", function () {
	var include = eden.include;
	eden.include = function (url, success) {
		equal(url, "https://test.com/test.js");
		setTimeout(function () {
			equal(root.lookup('x').value(), undefined);
			// allow script which called "include" to continue
			success();
			equal(root.lookup('x').value(), 2);
			start();
		}, 0);
	};

	stop();
	try {
		eden.execute('include("https://test.com/test.js"); x = 2;');
	} catch (e) {
		eden.include = include;
		throw e;
	}
});

// the following tests only work in browser
if (typeof window !== "undefined") {
	test("@browser include jse same host", function () {
		eden.execute('include("test-models/test.jse");', function () {
			equal(root.lookup('x').value(), 9000);
			start();
		});
		stop();
	});

	test("@browser include jse different host", function () {
		rt.config = {
			"jseProxyBaseUrl": "http://stormy-peak-6294.herokuapp.com/"
		};
		eden.execute('include("https://gist.githubusercontent.com/itsmonktastic/29997e30182295a5dbc8/raw/d6cfa96eb2eae3f6dddc1b86f6ee04eb65b24b01/test.jse");', function () {
			equal(root.lookup('x').value(), 9001);
			start();
		});
		stop();
	});
}
