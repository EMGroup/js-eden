var wd = require('wd');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

describe("UI tests", function() {
	this.timeout(60000);
	var browser;

	before(function() {
		browser = wd.promiseChainRemote({
			hostname: '127.0.0.1',
			port: '4444'
		});
		return browser.init({browserName: 'firefox'});
	});

	before(function() {
		return browser.get("http://localhost:8000");
	});

	after(function() {
		return browser.quit();
	});

	it("has JS-Eden as page title", function() {
		return browser.title().should.become("JS-Eden");
	});

	it("has a menu", function () {
		return browser.waitForElementByCss('#menubar-main');
	});

	it("has an input window", function () {
		return browser.waitForElementByCss('#inputwindow-dialog');
	});

	it("describe it has a canvas window", function () {
		return browser.waitForElementByCss('#default-dialog');
	});

	it("describe it has a projects window", function () {
		return browser.waitForElementByCss('#projects-dialog');
	});

	describe("writeln", function () {
		before(function () {
			browser
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

	describe("clicking 'new' menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New"))
			.click();
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
			.click()
			.then(function () {
				// click menu again to make it disappear
				return browser
				.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New"))
				.click();
			});
		});

		it('shows a symbol list dialog', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude("Symbol List"));
		});
	});

	describe("click item in symbol list", function () {
		before(function () {
			return browser
			.waitForElementByCss('.symbollist-result-element', wd.asserters.textInclude("autocalc"))
			.click();
		});

		it('creates an edit window', function () {
			return browser
			.waitForElementByCss('.ui-dialog', wd.asserters.textInclude("Edit_autocalc"));
		});
	});

	describe("clicking 'window' menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("Windows"))
			.click();
		});

		it('shows a symbol list entry', function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("view_0 [SymbolList]"));
		});
	});

	describe("close window through menu", function () {
		before(function () {
			return browser
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("view_0 [SymbolList]"))
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
			.waitForElementByCss('.menubar-item', wd.asserters.textInclude("view_0 [SymbolList]"))
			.should.be.rejectedWith("Element condition wasn't satisfied");
		});
	});

	describe("close the 4 default windows", function () {
		before(function () {
			return browser
			.elementByCss('.menubar-item-close')
			.click()
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
			.waitForElementByCss('.menubar-item-fullwidth', wd.asserters.textInclude('Use "New" menu to create windows.'));
		});
	});
});
