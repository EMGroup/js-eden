/**
 * Scope LHS Override Pattern.
 */

Eden.AST.ScopePattern = function() {
	this.type = "scopepattern";
	this.observable = "NONAME";
	this.components = [];
	this.errors = [];
}

Eden.AST.ScopePattern.prototype.error = Eden.AST.fnEdenASTerror;

Eden.AST.ScopePattern.prototype.setObservable = function(obs) {
	this.observable = obs;
}

Eden.AST.ScopePattern.prototype.addListIndex = function(express) {
	this.components.push(express);
	if (express) {
		this.errors.push.apply(this.errors, express.errors);
	}
}

