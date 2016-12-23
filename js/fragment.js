Eden.Fragment = function(selector) {
	this.name = selector;
	this.selector = selector;
	this.originast = undefined;
	this.origin = undefined;
	this.source = undefined;
	this.ast = undefined;
	this.locked = true;
	this.remote = false;
	this.results = [];
	this.title = selector;

	//console.error("FRAGMENT");

	this.reset();
	var me = this;

	Eden.Fragment.listenTo("aststatus", this, function(ast) {
		if (ast === me.originast) {
			var dcom = me.originast.doxyComment;
			if (dcom) {
				var ctrls = dcom.getControls();
				if (ctrls["@title"]) {
					me.title = ctrls["@title"][0];
				}
			}
			Eden.Fragment.emit("status", [me]);
		}
	});

	Eden.Fragment.listenTo("patch", this, function(frag, ast) {
		if (ast === me.originast) {
			me.source = me.originast.getInnerSource();
			me.ast = new Eden.AST(me.source, undefined, me);
			Eden.Fragment.emit("changed", [me]);
		}
	});

	Eden.Fragment.listenTo("lock", this, function(frag, ast) {
		if (ast === me.originast) {
			me.locked = true;
			Eden.Fragment.emit("locked", [me]);
		}
	});

	Eden.Fragment.listenTo("unlock", this, function(frag, ast) {
		if (ast === me.originast) {
			//console.log("IVE BECOME LOCKED", me.name);
			me.locked = false;
			Eden.Fragment.emit("unlocked", [me]);
		}
	});
}

Eden.Fragment.listenTo = listenTo;
Eden.Fragment.emit = emit;
Eden.Fragment.listeners = {};
Eden.Fragment.cache = {};

Eden.Fragment.fromSelector = function(selector) {
	if (Eden.Fragment.cache[selector]) {
		var frag = Eden.Fragment.cache[selector];
		frag.reset();
		return frag;
	} else {
		var frag = new Eden.Fragment(selector);
		Eden.Fragment.cache[selector] = frag;
		return frag;
	}
}

Eden.Fragment.prototype.destroy = function() {
	
}

Eden.Fragment.prototype.reset = function() {
	var me = this;

	Eden.Selectors.query(this.selector, undefined, undefined, true, function(res) {
		me.results = res;

		if (me.results && me.results.length > 0 && me.results[0].type == "script") {
			me.originast = me.results[0];
		}

		if (me.originast) {
			me.name = (me.originast.name) ? me.originast.name : me.selector;
			me.source = me.originast.getInnerSource();
			me.ast = new Eden.AST(me.source, undefined, me);
			var p = me.originast;
			while (p && p.parent) p = p.parent;
			me.origin = p.base.origin;
			me.remote = me.origin.remote;
			me.locked = me.originast.lock > 0 || me.remote;

			var dcom = me.originast.doxyComment;
			if (dcom) {
				var ctrls = dcom.getControls();
				if (ctrls["@title"]) {
					me.title = ctrls["@title"][0];
				}
			}

			Eden.Fragment.emit("changed", [me]);
			//Eden.Fragment.emit("status", [me]);

			if (me.locked) {
				Eden.Fragment.emit("locked", [me]);
			}
		}
		me.lock();
	});
}

Eden.Fragment.prototype.getSource = function() {
	if (this.source) return this.source;
	else return "";
}

Eden.Fragment.prototype.setSource = function(src) {
	//var oldast = this.ast;
	this.source = src;

	// Build a new AST
	this.ast = new Eden.AST(src, undefined, this);

	if (this.ast.script.errors.length == 0) {
		// Patch the origin...
		var parent = this.originast.parent;
		//var ix = 0;

		//for (; ix < parent.statements.length; ix++)
		//	if (parent.statements[ix] === this.originast) break;

		//var o = this.originast; //parent.statements[ix];
		//o.statements = this.ast.script.statements;
		// Do NOT set parent, allows correct source to be extracted later...
		//this.ast.parent = parent;
		//console.log(this.originast);
		this.originast.patchScript(this.ast);

		// Notify all parent fragments of patch
		while (parent) {
			Eden.Fragment.emit("patch", [this, parent]);
			parent = parent.parent;
		}


		//this.originast = this.origin.patch(this.originast, this.ast);
		// TODO Need to notify any parent fragments of change!!
		//console.log("origin:",this.originast.getInnerSource());
		//console.log("new:",this.ast.script.getInnerSource());
	} else {
		// Oops, errors.
		Eden.Fragment.emit("errored", [this]);
	}
}

Eden.Fragment.prototype.lock = function() {
	//this.locked = true;
	// Recursively lock parents...
	var p = this.originast.parent;
	//this.originast.lock++;
	while (p) {
		p.lock++;
		Eden.Fragment.emit("lock", [this, p]);
		p = p.parent;
	}
	// TODO Notify parent fragments of lock
}

Eden.Fragment.prototype.unlock = function() {
	//if (!this.locked) return;
	// Recursively lock parents...
	var p = this.originast.parent;
	//this.originast.lock--;
	while (p) {
		p.lock--;
		if (p.lock == 0) Eden.Fragment.emit("unlock", [this, p]);
		p = p.parent;
	}
}

Eden.Fragment.prototype.getTitle = function() {
	if (this.originast && this.originast.name) return this.originast.name;
	if (this.selector == "") return "Project";
	return this.selector;
}

