var root;
var eden;

QUnit.module("Polyglot#execute", {
	setup: function () {
		root = new Folder();
		eden = new Eden();
		polyglot = new Polyglot();
		polyglot.register('eden', eden);
		polyglot.setDefault('eden');
		polyglot.register('js', {execute: function (code) { eval(code); }});
	}
});

test("No language token", function () {
	polyglot.execute("x = 2;");
	equal(root.lookup('x').value(), 2);
});

test("%eden", function () {
	polyglot.execute("%eden\nx = 2;");
	equal(root.lookup('x').value(), 2);
	polyglot.execute("%eden\nx = 3;%eden");
	equal(root.lookup('x').value(), 3);
	polyglot.execute("x = 4;%eden");
	equal(root.lookup('x').value(), 4);
	polyglot.execute("%eden\nx = 1;%js\nroot.lookup('x').assign(root.lookup('x').value() + 1);");
	equal(root.lookup('x').value(), 2);
});

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

test("For loop", function () {
	eden.execute("x = 0; for (i = 0; i < 10; ++i) { x++; }");
	equal(root.lookup('i').value(), 10);
	equal(root.lookup('x').value(), 10);
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

test("Triggered actions immediately fire if all their observees have been defined", function () {
	eden.execute("x = @; proc p : x { y = 1; }");
	equal(root.lookup('y').value(), 1);
});

test("Triggered actions don't fire until all their observees have been defined", function () {
	eden.execute("proc p : x, y { z = 1; }");
	equal(root.lookup('z').value(), undefined);
	eden.execute("x = @;");
	equal(root.lookup('z').value(), undefined);
	eden.execute("y = @;");
	equal(root.lookup('z').value(), 1);
});

test("Function calls work", function () {
	eden.execute("func f { x = 2; } f();");
	equal(root.lookup('x').value(), 2);
});

test("A formula var is undefined until the terms it depends on have been defined", function () {
	eden.execute("x is y + z;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("y = 1;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("z = 1;");
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

test("Multiple sets of autos work", function () {
	eden.execute('func f { auto x; auto y; x = 1; y = 2; return y; }');
	equal(root.lookup('f').value()(), 2);
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

test("autocalc off defers dependency", function () {
	eden.execute("x is y; y = 1; autocalc = 0; y = 2;");
	equal(root.lookup('x').value(), 1);
	eden.execute("autocalc = 1;");
	equal(root.lookup('x').value(), 2);
});

test("autocalc off defers agents", function () {
	eden.execute('x = 0; proc p : y { x++; } autocalc = 0; y = 0; y = 1;');
	equal(root.lookup('x').value(), 0);
	eden.execute('autocalc = 1;');
	equal(root.lookup('x').value(), 1);
});

test("last modified is undefined by default", function () {
	equal(root.lookup('x').last_modified_by, undefined);
});

test("readonly doesn't set last modified by", function () {
	eden.execute('x = y;');
	equal(root.lookup('y').last_modified_by, undefined);
});

test("assignment sets last modified by", function () {
	eden.execute('x = 1;');
	equal(root.lookup('x').last_modified_by, 'input');
});

test("assignment from proc invoked directly sets last modified by", function () {
	eden.execute('proc p { x = 2; } p();');
	equal(root.lookup('x').last_modified_by, 'input');
});

test("assignment from triggered proc sets last modified by", function () {
	eden.execute('proc p : y { x = 2; } y = 2;');
	equal(root.lookup('x').last_modified_by, 'p');
});

test("definition sets last modified by", function () {
	eden.execute('x is 1;');
	equal(root.lookup('x').last_modified_by, 'input');
});

test("definition from proc invoked directly sets last modified by", function () {
	eden.execute('proc p { x is 2; } p();');
	equal(root.lookup('x').last_modified_by, 'input');
});

test("definition from triggered proc sets last modified by", function () {
	eden.execute('proc p : y { x is 2; } y = 2;');
	equal(root.lookup('x').last_modified_by, 'p');
});

test("function definition sets last modified by", function () {
	eden.execute('func f {}');
	equal(root.lookup('f').last_modified_by, 'input');
});

test("proc definition sets last modified by", function () {
	eden.execute('proc p {}');
	equal(root.lookup('p').last_modified_by, 'input');
});

test("number comparison", function () {
	eden.execute("b = 1 == 1;");
	equal(root.lookup('b').value(), true);
	eden.execute("b = 1 == 2;");
	equal(root.lookup('b').value(), false);
});

test("list comparison", function () {
	eden.execute("b = [1,2,3] == [1,2,3];");
	equal(root.lookup('b').value(), true);
	eden.execute("b = [1,2,3] == [1,2,4];");
	equal(root.lookup('b').value(), false);
	eden.execute("b = [] == [];");
	equal(root.lookup('b').value(), true);
	eden.execute("b = [[1]] == [[1]];");
	equal(root.lookup('b').value(), true);
	eden.execute("b = [[1]] == [[2]];");
	equal(root.lookup('b').value(), false);
});

test("assigning a list and modifying", function () {
	eden.execute("x = y = [1,2,3]; b = x == y;");
	equal(root.lookup('b').value(), true);
	eden.execute("x[1]++; b = x == y;");
	equal(root.lookup('b').value(), false);
});

test("defining a list and modifying", function () {
	eden.execute("x is y; y = [1,2,3]; b = x == y;");
	equal(root.lookup('b').value(), true);
	eden.execute("x[1] = [2]; b = x == y;");
	equal(root.lookup('b').value(), false);
});

test("passing a list and modifying", function () {
	eden.execute("x = [1,2,3]; proc p { b = $1 == x; } p(x);");
	equal(root.lookup('b').value(), true);
	eden.execute("proc p { $1[1] = 2; b = $1 == x; } p(x);");
	equal(root.lookup('b').value(), false);
});

test("arithmetic with @ should return @", function () {
	eden.execute("x = @ + 1;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ + @;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ * 1;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ * @;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ / 1;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ / @;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ % 1;");
	equal(root.lookup('x').value(), undefined);
	eden.execute("x = @ % @;");
	equal(root.lookup('x').value(), undefined);
});

test("include defers execution", function () {
	var include = eden.include;
	eden.include = function (url, prefix, success) {
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

