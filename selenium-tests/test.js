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
			.then(function () {
				return browser.waitForElementByCss('#inputwindow-dialog .submitButton').click();
			});
		});

		it("shows in the menu status", function () {
			return browser.waitForElementByCss('#menubar-status', wd.asserters.textInclude('Hello world!'));
		});

		describe("clicking 'new' menu", function () {
			before(function () {
				return browser
				.waitForElementByCss('.menubar-mainitem', wd.asserters.textInclude("New"))
				.click();
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
		});
	});
});
