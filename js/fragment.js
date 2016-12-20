Eden.Fragment = function(selector) {
	this.name = "*Fragment:"+selector;
	this.selector = selector;
	this.results = Eden.Query.querySelector(selector);
	this.originast = undefined;
	this.origin = undefined;
	this.source = undefined;
	this.ast = undefined;

	if (this.results && this.results.length > 0 && this.results[0].type == "script") {
		this.originast = this.results[0];
	}

	if (this.originast) {
		this.source = this.originast.getInnerSource();
		this.ast = new Eden.AST(this.source, undefined, this);
		var p = this.originast;
		while (p && p.parent) p = p.parent;
		this.origin = p.base.origin;
	}

	var me = this;
	Eden.Fragment.listenTo("patch", this, function(frag, ast) {
		if (ast === me.originast) {
			console.log("I AM OUT OF DATE",me.name);
			me.source = me.originast.getInnerSource();
			me.ast = new Eden.AST(me.source, undefined, me);
			Eden.Fragment.emit("changed", [me]);
		}
	});
}

Eden.Fragment.listenTo = listenTo;
Eden.Fragment.emit = emit;
Eden.Fragment.listeners = {};

Eden.Fragment.prototype.getSource = function() {
	if (this.source) return this.source;
	else return "";
}

Eden.Fragment.prototype.setSource = function(src) {
	//var oldast = this.ast;

	// Build a new AST
	this.ast = new Eden.AST(src, undefined, this);

	if (this.ast.script.errors.length == 0) {
		// Patch the origin...
		var parent = this.originast.parent;
		var ix = 0;
		for (; ix < parent.statements.length; ix++)
			if (parent.statements[ix] === this.originast) break;

		//var o = this.originast; //parent.statements[ix];
		//o.statements = this.ast.script.statements;
		// Do NOT set parent, allows correct source to be extracted later...
		//this.ast.parent = parent;
		console.log(this.originast);
		this.originast.patchScript(this.ast);

		// Notify all parent fragments of patch
		while (parent) {
			Eden.Fragment.emit("patch", [this, parent]);
			parent = parent.parent;
		}


		//this.originast = this.origin.patch(this.originast, this.ast);
		// TODO Need to notify any parent fragments of change!!
		console.log("origin:",this.originast.getInnerSource());
		console.log("new:",this.ast.script.getInnerSource());
	} else {
		// Oops, errors.
	}
}

Eden.Fragment.prototype.lock = function() {
	// Recursively lock parents...
	var p = this.originast;
	while (p) {
		p.lock++;
		p = p.parent;
	}
	// TODO Notify parent fragments of lock
}

Eden.Fragment.prototype.unlock = function() {

}

Eden.Fragment.prototype.getTitle = function() {
	if (this.originast && this.originast.name) return this.originast.name;
	if (this.selector == "") return "Project";
	return this.selector;
}

