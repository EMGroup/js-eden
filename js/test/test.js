QUnit.module("Eden.translateToJavaScript");

test("Do while loop", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 0; do { x++; } while (x < 5);"));
	equal(root.lookup('x').value(), 5);
});

test("Assignment sets the correct value", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 2;"));
	equal(root.lookup('x').value(), 2);
});

test("Increment results in a value 1 greater", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 2; x++;"));
	equal(root.lookup('x').value(), 3);
});

test("+= op works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 2; x += 2;"));
	equal(root.lookup('x').value(), 4);
});

test("The value after formula definition is correct", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 3; a is x;"));
	equal(root.lookup('a').value(), 3);
});

test("Function definition stores a function in the symbol table", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("func f {}"));
	equal(typeof root.lookup('f').value(), "function");
});

test("Procedure definition stores a function in the symbol table", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("proc p {}"));
	equal(typeof root.lookup('p').value(), "function");
});

test("Triggered action definition stores a function in the symbol table", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("proc p : x {}"));
	equal(typeof root.lookup('p').value(), "function");
});

test("Triggered action definition observes a requested symbol", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("proc p : x {}"));
	notEqual(root.lookup('p').observees['/x'], undefined);
});

test("Function calls work", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("func f { x = 2; } f();"));
	equal(root.lookup('x').value(), 2);
});

test("Return statement from a function works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("func power { return 9000; }"));
	equal(root.lookup('power').value()(), 9000);
});

test("Function parameters work", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("func id { return $1; }"));
	equal(root.lookup('id').value()(9001), 9001);
});

test("Parameter aliases work", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("func id { para x; return x; }"));
	equal(root.lookup('id').value()(9001), 9001);
});

test("Nested strings work", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('x = "\\\"";'));
	equal(root.lookup('x').value(), '"');
});

test("Multiline strings work", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('x = "\n\nfoo\n\n";'));
	equal(root.lookup('x').value(), '\n\nfoo\n\n');
});

test("Multiple function definitions with locals works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('func f { auto x; x; } func g { auto y; y; }'));
	ok(true);
});

test("Underscores in observable names works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('x_1 = 20;'));
	equal(root.lookup('x_1').value(), 20);
});

test("Autos work in a function definition", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('func f { auto x; x = 3; return x; }'));
	equal(root.lookup('f').value()(), 3);
});

test("Autos work in a procedure definition", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('proc p { auto x; x = 4; return x; }'));
	equal(root.lookup('p').value()(), 4);
});

test("Autos protect the outside scope", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript('x = 2; func f { auto x; x = 10; } f();'));
	equal(root.lookup('x').value(), 2);
});

test("Single quoting a character works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 'a';"));
	equal(root.lookup('x').value(), "a");
});

test("Empty quotes won't parse", function () {
	var root = new Folder();
	try {
		Eden.translateToJavaScript("'';");
	} catch (e) {
		ok(true);
	}
});

test("Single quoting an escaped quote character works", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = '\\\'';"));
	equal(root.lookup('x').value(), "'");
});

test("Lists are 1 indexed", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = [20,30,40]; y = x[1];"));
	equal(root.lookup('y').value(), 20);
});

test("Lists are value types", function () {
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = [1,2,3]; func f { $1 = 9000; } f(x);"));
	equal(root.lookup('x').value()[0], 1);
});

test("Scoping for triggered actions", function () {
	// the parser used to get confused about triggered actions, causing scoping problems
	var root = new Folder();
	eval(Eden.translateToJavaScript("x = 1; proc p : z {} func f { para x; } y is x;"));
	equal(root.lookup('y').value(), 1);
});

test("includeJS defers execution", function () {
	var root = new Folder();
	var includeJS = rt.includeJS;
	rt.includeJS = function (url, success) {
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
		eval(Eden.translateToJavaScript('includeJS "https://test.com/test.js"; x = 2;'));
	} catch (e) {
		rt.includeJS = includeJS;
		throw e;
	}
});
