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

	beforeEach(function() {
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
});
