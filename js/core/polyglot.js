function Polyglot() {
	this.defaultLanguage = null;
	this.languages = {};
	this.currentLanguage = null;
	this.languageModeRegex = '%([a-zA-Z]+)';
}

Polyglot.prototype.register = function (languageName, executor) {
	this.languages[languageName] = executor;
};

Polyglot.prototype.execute = function (polyglotCode, origin, prefix, success) {
	var firstChar = 0;
	var firstLineMatch = polyglotCode.match(new RegExp('^'+this.languageModeRegex));
	if (firstLineMatch) {
		this.currentLanguage = firstLineMatch[1];
		firstChar = this.currentLanguage.length + 1;
	} else if (this.currentLanguage === null) {
		this.currentLanguage = this.defaultLanguage;
	}
	var lastChar = polyglotCode.length;
	var lastLineMatch = polyglotCode.substr(firstChar).search(new RegExp(this.languageModeRegex));
	if (lastLineMatch !== -1) {
		lastChar = firstChar + lastLineMatch;
	}
	var section = polyglotCode.slice(firstChar, lastChar);
	this.languages[this.currentLanguage].execute(section, origin, prefix, function () {
		polyglotCode = polyglotCode.substr(lastChar);
		if (polyglotCode === '') {
			success && success();
			return;
		}
		me.execute(polyglotCode, origin, prefix, success);
	});
};

Polyglot.prototype.setDefault = function (languageName) {
	this.defaultLanguage = languageName;
};
