function Polyglot() {
	this.defaultLanguage = null;
	this.languages = {};
	this.currentLanguage = null;
	this.languageModeRegex = '%([a-zA-Z]+)';
}

Polyglot.prototype.register = function (languageName, executor) {
	this.languages[languageName] = executor;
};

Polyglot.prototype.execute = function (polyglotCode, origin, prefix, name, success) {
	var firstChar = 0;

	// look for %<lang> on the first line of input
	var firstLineMatch = polyglotCode.match(new RegExp('^'+this.languageModeRegex));
	if (firstLineMatch) {
		// language specified, use it
		this.currentLanguage = firstLineMatch[1];
		firstChar = this.currentLanguage.length + 1;
	} else if (this.currentLanguage === null) {
		// no language specified, use default language
		this.currentLanguage = this.defaultLanguage;
	}
	var lastChar = polyglotCode.length;

	// look for %<lang> at the start of a line
	var lastLineMatch = polyglotCode.substr(firstChar).search(new RegExp('\n'+this.languageModeRegex));
	if (lastLineMatch !== -1) {
		lastChar = firstChar + lastLineMatch + 1;
	}

	var section = polyglotCode.slice(firstChar, lastChar);
	var me = this;
	this.languages[this.currentLanguage].execute(section, origin, prefix, name, function () {
		polyglotCode = polyglotCode.substr(lastChar);
		if (polyglotCode === '') {
			success && success();
			return;
		}
		me.execute(polyglotCode, origin, prefix, name, success);
	});
};

Polyglot.prototype.setDefault = function (languageName) {
	this.defaultLanguage = languageName;
};

this.Polyglot = Polyglot;

// expose as node.js module
if (this.module && this.module.exports) {
	this.module.exports.Polyglot = Polyglot;
}
