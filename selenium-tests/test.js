var wd = require('wd');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

describe("UI tests", function () {
	this.timeout(60000);
	var browser;

	before(function () {
		var jobNumber = process.env.TRAVIS_JOB_NUMBER;
		if (jobNumber) {
			browser = wd.promiseChainRemote(
				"ondemand.saucelabs.com",
				80,
				process.env.SAUCE_USERNAME,
				process.env.SAUCE_ACCESS_KEY
			);
			return browser.init({browserName: 'firefox', 'tunnel-identifier': jobNumber});
		} else {
			browser = wd.promiseChainRemote({
				hostname: '127.0.0.1',
				port: '4444'
			});
			return browser.init({browserName: 'firefox'});
		}
	});

	before(function () {
		return browser.get("http://localhost:8000");
	});

	after(function () {
		return browser.quit();
	});

	it("has JS-Eden as page title", function () {
		return browser.title().should.become("JS-Eden");
	});

	it("has a menu", function () {
		return browser.waitForElementByCss('#menubar-main', wd.asserters.textInclude('New'), 60000);
	});

	it("has an input window", function () {
		return browser.waitForElementByCss('#inputwindow-dialog', wd.asserters.isDisplayed, 60000);
	});

	it("describe it has a canvas window", function () {
		return browser.waitForElementByCss('#picture-dialog');
	});

	it("describe it has a projects window", function () {
		return browser.waitForElementByCss('#projects-dialog');
	});

	describe("writeln", function () {
		before(function () {
			return browser
			.waitForElementByCss('#inputwindow-dialog textarea')
			.type('writeln("Hello world!");')
			.waitForElementByCss('#inputwindow-dialog .submitButton')
			.click();
		});

		it("shows in the menu status", function () {
			return browser
			.waitForElementByCss('#menubar-status', wd.asserters.textInclude('Hello world!'));
		});
	});

	describe("close window through titlebar", function () {
		before(function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Script Input Window'))
			.elementByCss('>', '.ui-dialog-titlebar-close')
			.click();
		});

		it('closes the window', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Script Input Window'))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});

		it('removes the menu item', function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Windows"))
			.click()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Script Input Window"))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});
	});

	describe("clicking 'new' menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New"))
			.moveTo();
		});

		it("shows a symbol list entry", function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List"));
		});
	});

	describe("click symbol list", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List"))
			.click();
		});

		it('shows a symbol list dialog', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude("Symbol List"));
		});
	});

	describe("click item in symbol list", function () {
		before(function () {
			return browser
			.waitForElementByCss('.symbollist-result-element', wd.asserters.textInclude("picture"))
			.click();
		});

		it('creates an edit window', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude("Script Input Window"));
		});
	});

	describe("clicking 'window' menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Windows"))
			.click();
		});

		it('shows a symbol list and edit window entry', function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List [view_0]"))
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Script Input Window [edit_picture]"));
		});
	});

	describe("close symbol list window through menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Windows"))
			.moveTo()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List [view_0]"))
			.elementByCss('>', '.menubar-item-close')
			.click();
		});

		it('closes the window', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Symbol List'))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});

		it('removes the menu item', function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List [view_0]"))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});
	});

	describe("highlight window", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Canvas 2D [picture]"))
			.moveTo();
		});

		it("highlights window", function () {
			return browser
			.waitForElementByCss(
				'.ui-dialog.menubar-window-raise',
				wd.asserters.textInclude('Canvas 2D')
			);
		});
	});

	describe("close the remaining two default windows and the edit_picture window", function () {
		before(function () {
			return browser
			.elementByCss('.menubar-item-close')
			.click()
			.elementByCss('.menubar-item-close')
			.click()
			.elementByCss('.menubar-item-close')
			.click();
		});

		it('shows instructions', function () {
			return browser
			.elementByCss('.menubar-mainitem')
			.waitForElementByCss('.menubar-item-fullwidth', wd.asserters.textInclude('Use the "New Window" menu to create windows.'));
		});
	});

	describe("create new input window", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New Window"))
			.moveTo()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Script Input Window"))
			.click();
		});

		it("shows an input window entry", function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Script Input Window'))
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Existing Windows"))
			.click()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Script Input Window [view_1]"));
		});
	});

	describe("use eden createView", function () {
		before(function () {
			return browser
			.waitForElementByCss('#view_1-dialog textarea')
			.type('createView("testlist", "SymbolList");')
			.waitForElementByCss('#view_1-dialog .submitButton')
			.click();
		});

		it("creates a window", function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Symbol List'));
		});

		it("shows an input window entry", function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Windows"))
			.click()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Symbol List [testlist]"));
		});
	});

	describe("open error window", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New"))
			.moveTo()
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("Error Window"))
			.click();
		});

		it("creates a window", function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('EDEN Errors'));
		});
	});

	describe("close window through titlebar", function () {
		before(function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('EDEN Errors'))
			.elementByCss('>', '.ui-dialog-titlebar-close')
			.click();
		});

		it('closes the window', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('EDEN Errors'))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});
	});


	describe("cause error", function () {
		before(function () {
			return browser
			.waitForElementByCss('#view_1-dialog textarea')
			.type('x')
			.waitForElementByCss('#view_1-dialog .submitButton')
			.click();
		});

		it("shows a parse error in the error window", function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude('Parse error on line 1:\nx'));
		});
	});
});
