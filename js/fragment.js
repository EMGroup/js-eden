Eden.Fragment = function(selector, cb) {
	this.name = selector;
	this.selector = selector;
	this.originast = undefined;
	this.origin = undefined;
	this.source = undefined;
	this.ast = undefined;
	this.lastast = undefined;
	this.locked = true;
	this.remote = false;
	this.results = [];
	this.title = selector;
	this.scratch = false;
	this.edited = false;
	this.autosavetimer = undefined;
	this.history = [];
	this.snapshot = "";
	this.index = -1;

	//console.error("FRAGMENT");

	var me = this;

	this.reset(() => {
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
			if (frag === me) return;
			if (ast === me.originast) {
				//console.log("FRAG PATCH",me.name);
				me.source = me.originast.getInnerSource();
				//me.ast = new Eden.AST(me.source, undefined, me);
				me.ast = Eden.AST.fromNode(me.originast,me);
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
	
		Eden.Fragment.listenTo("goto", this, function(ast, child) {
			//console.log("GOTO",ast,me.originast);
			if (me.originast === ast || (ast && me.originast.id === ast.id)) {
				//console.log("Found goto",me);
				//console.log("Goto line", child.getStartLine(ast));
				var line = child.getStartLine(ast);
				Eden.Fragment.emit("gotoline", [me, line]);
				return true;
			} else if (ast === undefined) {
				this.setSourceInitial(child.source);
			}
			return false;
		});

		if (cb) cb();
	});
}

Eden.Fragment.listenTo = listenTo;
Eden.Fragment.emit = emit;
Eden.Fragment.unListen = unListen;
Eden.Fragment.listeners = {};
//Eden.Fragment.cache = {};

/*Eden.Fragment.fromSelector = function(selector) {
	if (Eden.Fragment.cache[selector]) {
		var frag = Eden.Fragment.cache[selector];
		frag.reset();
		if (frag.scratch) Eden.Fragment.cache[selector] = undefined;
		return frag;
	} else {
		var frag = new Eden.Fragment(selector);
		if (!frag.scratch) {
			Eden.Fragment.cache[selector] = frag;
		}
		return frag;
	}
}*/

Eden.Fragment.prototype.destroy = function() {
	Eden.Fragment.unListen(this);
	this.unlock();
}

Eden.Fragment.prototype.reset = function(cb) {
	var me = this;

	if (this.scratch) {
			me.lock();
			me.snapshot = me.source;
			Eden.Fragment.emit("changed", [me]);
			if (cb) cb();
			return;
	}

	Eden.Selectors.query(this.selector, undefined, {minimum: 1}, function(res) {
		me.results = res;

		if (me.results && me.results.length == 1 && me.results[0].type == "script") {
			//console.log(res);
			me.originast = me.results[0];
		} else if (me.results && me.results.length == 1 && me.results[0].type == "assignment") {
			me.originast = undefined;
			//me.source = 
		} else if (me.results && me.results.length > 1) {
			var src = "";
			for (var i=0; i<me.results.length; i++) {
				src += me.results[i].getSource() + "\n";
			}
			me.source = src;
			me.originast = undefined;
		} else {
			me.source = "";
			me.originast = undefined;
		}

		if (me.originast) {
			me.name = (me.originast.name) ? me.originast.name : me.selector;
			//me.source = me.originast.getInnerSource();
			//me.ast = new Eden.AST(me.source, undefined, me);
			Eden.AST.fromNode(me.originast,me).then(s => {
				me.ast = s;
				me.source = me.ast.stream.code;
				var p = me.originast;
				while (p && p.parent) p = p.parent;
				me.origin = (p.base) ? p.base.origin : {remote: true};
				me.remote = me.origin.remote;
				me.locked = me.originast.lock > 0 || me.remote;

				var dcom = me.originast.doxyComment;
				if (dcom) {
					me.doxy = dcom;
					var ctrls = dcom.getControls();
					if (ctrls["@title"]) {
						me.title = ctrls["@title"][0];
					}
				} else {
					me.doxy = undefined;
				}

				Eden.Fragment.emit("changed", [me]);
				//Eden.Fragment.emit("status", [me]);

				if (me.locked) {
					Eden.Fragment.emit("locked", [me]);
				}

				me.lock();
				me.snapshot = me.source;
				if (cb) cb();
			});
		} else {
			console.log("Make scratch fragment");
			// Scratch
			me.locked = false;
			me.remote = false;
			me.ast = new Eden.AST(me.source, undefined, me, {noindex: true, strict: true});
			me.originast = me.ast.script;
			me.name = "*Scratch*";
			me.title = me.name;
			me.scratch = true;

			Eden.Fragment.emit("changed", [me]);

			me.lock();
			me.snapshot = me.source;
			if (cb) cb();
		}
	});
}

Eden.Fragment.prototype.getSource = function() {
	if (this.source) return this.source;
	else return "";
}

Eden.Fragment.prototype.makeReal = function(name) {
	if (!this.scratch) return;
	this.name = name;
	this.title = name;
	this.originast = eden.project.addAction(name);
	this.selector = Eden.Selectors.getID(this.originast); //this.originast.id;
	this.scratch = false;
	this.remote = false;
	this.setSource(this.source);
	var p = this.originast;
	while (p && p.parent) p = p.parent;
	this.origin = p.base.origin;
	this.lock();
}

Eden.Fragment.prototype.setSourceInitial = function(src) {
	this.source = src;
	this.snapshot = src;
	this.ast = new Eden.AST(src, undefined, this, {strict: true, noindex: this.scratch});
}

Eden.Fragment.AUTOSAVE_INTERVAL = 2000;

Eden.Fragment.prototype.undo = function() {
	if (this.index < 0) return;
	if (this.history.length == 0) return;

	var hist = this.history[this.index];
	this.index--;

	var snap;

	if (this.index >= 0 && this.history[this.index].snapshot) {
		snap = this.history[this.index].snapshot;
	} else {
		var undodmp = new diff_match_patch();
		var p = undodmp.patch_fromText(hist.undo);
		var r = undodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.snapshot = snap;
	this.setSource(snap);
}



Eden.Fragment.prototype.canUndo = function() {
	return this.history.length > 0 && this.index >= 0;
}

Eden.Fragment.prototype.canRedo = function() {
	return this.index < this.history.length-1;
}



Eden.Fragment.prototype.redo = function() {
	if (this.index >= this.history.length-1) return;

	this.index++;
	var hist = this.history[this.index];
	var snap;

	if (hist.snapshot) {
		snap = hist.snapshot;
	} else {
		var redodmp = new diff_match_patch();
		var p = redodmp.patch_fromText(hist.redo);
		var r = redodmp.patch_apply(p, this.snapshot);
		snap = r[0];
	}

	this.snapshot = snap;
	this.setSource(snap);
}

Eden.Fragment.prototype.addHistory = function(redo,undo) {
	this.history.push({time: Date.now() / 1000 | 0, redo: redo, undo: undo});
	this.index = this.history.length - 1;
}

Eden.Fragment.prototype.autoSave = function() {
	if (this.ast === undefined || this.ast.script.errors.length > 0) {
		return;
	}

	if (!this.originast || this.scratch) return;

	var p = this.originast;
	while (p.parent) p = p.parent;
	if (!p.base || !p.base.origin) return;  // Not a valid project script
	if (!p.base.origin.authorid != Eden.DB.userid) return;  // Not authorised to save

	/*if (this.originast) {
		// Patch the origin...
		var parent = this.originast.parent;
		this.originast.patchScript(this.ast);

		// Notify all parent fragments of patch
		while (parent) {
			Eden.Fragment.emit("patch", [this, parent]);
			parent = parent.parent;
		}
	}

	Eden.Fragment.emit("changed", [this]);*/

	if (eden.root.lookup("jseden_script_livepatch").value()) {
		console.log("AUTOSAVE", this.selector);
		Eden.DB.patch(Eden.Selectors.getID(this.originast), this.ast.script.getInnerSource());
	}
	this.autosavetimer = undefined;

	/*var savedmp = new diff_match_patch();

	// Calculate redo diff
	var d = savedmp.diff_main(this.snapshot, this.ast.stream.code, false);
	var p = savedmp.patch_make(this.snapshot, this.ast.stream.code, d);
	var redo = savedmp.patch_toText(p);
	//console.log(redo);

	// Calculate undo diff
	d = savedmp.diff_main(this.ast.stream.code, this.snapshot, false);
	p = savedmp.patch_make(this.ast.stream.code, this.snapshot, d);
	var undo = savedmp.patch_toText(p);
	//console.log(undo);

	if (undo == "") return;

	// Save history and set last snapshot
	this.addHistory(redo,undo);
	this.snapshot = this.ast.stream.code;

	

	//eden.root.lookup(this.obsname+"_autosave").assign(true, eden.root.scope, Symbol.localJSAgent);*/
	//Eden.Fragment.emit("autosave", [this]);
}

Eden.Fragment.prototype.diff = function() {
	if (this.origin && this.origin.ast && this.originast.end > 0) {
		var oldsrc = this.origin.ast.stream.code.substring(this.originast.start, this.originast.end);
		var prefixlen = this.originast.prefix.length;
		var postfixlen = this.originast.postfix.length;
		oldsrc = oldsrc.substring(prefixlen, oldsrc.length - postfixlen);

		return DiffUtil.diff(oldsrc, this.source);
	} else {
		//console.log("FRAGMENT",this);
	}
}

Eden.Fragment.prototype.setSource = function(src) {
	if (this.locked) return;

	//if (this.ast.script.errors.length == 0) this.lastast = this.ast;
	var me = this;
	this.source = src;
	this.edited = true;

	// Build a new AST
	this.ast = new Eden.AST(src, undefined, this, {noindex: true, strict: true});

	// TODO Transfer execution/when status...
	//oldast.destroy();

	if (this.ast.errors.length == 0) {
		clearTimeout(this.autosavetimer);
		this.autosavetimer = setTimeout(function() { me.autoSave(); }, Eden.Fragment.AUTOSAVE_INTERVAL);

		if (this.originast) {
			// Patch the origin...
			var parent = this.originast.parent;
			var changes = this.originast.patchInner(this.ast.script);
			Eden.Fragment.emit("patch", [this, this.originast, changes]);

			// Notify all parent fragments of patch
			while (parent) {
				Eden.Fragment.emit("patch", [this, parent]);
				parent = parent.parent;
			}
		}

		Eden.Fragment.emit("status", [this]);
		eden.root.lookup("jseden_fragment_changed").assign(me.selector, eden.root.scope, Symbol.localJSAgent);

		//this.lastast.destroy();
		//this.lastast = undefined;
	} else {
		// Oops, errors.
		Eden.Fragment.emit("errored", [this]);
	}
}

Eden.Fragment.prototype.lock = function() {
	//this.locked = true;
	// Recursively lock parents...
	if (this.originast) {
		var p = this.originast.parent;
		//this.originast.lock++;
		while (p) {
			p.lock++;
			Eden.Fragment.emit("lock", [this, p]);
			p = p.parent;
		}
	}
	// TODO Notify parent fragments of lock
}

Eden.Fragment.prototype.unlock = function() {
	//if (!this.locked) return;
	// Recursively lock parents...
	if (this.originast) {
		var p = this.originast.parent;
		//this.originast.lock--;
		while (p) {
			p.lock--;
			if (p.lock == 0) Eden.Fragment.emit("unlock", [this, p]);
			p = p.parent;
		}
	}
}

Eden.Fragment.prototype.getTitle = function() {
	if (this.originast && this.originast.name) return this.originast.name;
	return this.name;
}

