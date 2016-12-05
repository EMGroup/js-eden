Eden.AST.DummyContext = {
	subscribeDynamic: function(p,d) { return eden.root.lookup(d); }
};

Eden.AST.prototype.executeGenerator = function*(statements, ctx, base, scope, agent) {
	var stack = [];
	this.executed = 1;
	var allowscript = true;
	var i = 0;

	if (statements === undefined) return;

	while (i < statements.length || stack.length > 0) {
		if (i >= statements.length && stack.length > 0) {
			statements = stack[stack.length-1].statements;
			i = stack[stack.length-1].index;
			scope = stack[stack.length-1].scope;
			stack.pop();
			allowscript = true;
			continue;
		}

		if (Eden.AST.debug && statements[i].type != "script") {
			if (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug())) {
				var debugobj = {
					type: "debug",
					base: base,
					script: this,
					index: i,
					statement: statements[i],
					context: ctx,
					agent: agent
				};
				yield debugobj;
			}
		}

		if (statements[i].type == "wait") {
			statements[i].executed = 1;
			statements[i].compile(ctx);
			if (statements[i].compiled_delay) {
				yield statements[i].compiled_delay(eden.root,scope);
			} else {
				yield 0;
			}
		} else if (statements[i].type == "import") {
			yield statements[i];
		} else if (statements[i].type == "do") {
			statements[i].params = statements[i].getParameters(undefined, base, scope);
			statements[i].nscope = (statements[i].scope) ? statements[i].getScope(ctx)(eden.root,scope) : scope;
			yield statements[i];
		} else if (statements[i].type == "when") {
			var when = statements[i];
			if (when.active == false) {
				when.active = true;
				var res = when.execute(undefined, base, eden.root.scope, agent);
				//console.log(res);
				if (res) {
					base.executeStatements(res, -1, when);
				} else {
					when.active = false;
				}
				//whens[i].active = false;
			}
		} else {
			var res = statements[i].execute(ctx, base, scope, agent);
			if (res && Array.isArray(res) && res.length > 0) {
				// Allow for a scope shift.
				var nscope = scope;
				if (statements[i].type == "scopedscript") nscope = statements[i].scope;
				i++;
				// Allow tail recursion...
				if (i < statements.length) stack.push({statements: statements, index: i, scope: scope});
				statements = res;
				scope = nscope;
				//console.log(statements);
				i = 0;
				continue;
			}
		}

		if (statements[i].errors.length > 0) {
			this.script.errors.push.apply(this.script.errors, statements[i].errors);
		}

		i++;
	}

	// Debug break on finish
	/*if (Eden.AST.debug) {
		if (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug())) {
			var debugobj = {
				type: "debug",
				base: base,
				script: this,
				index: -1,
				statement: undefined,
				context: ctx,
				agent: agent
			};
			yield debugobj;
		}
	}*/
}

function runEdenAction(source, action, cb) {
	var me = this;

	if (action === undefined) {
		source.active = false;
	}
	var delay = action.next();

	if (delay.done == false) {
		if (typeof delay.value == "object") {
			// The debugger wants to interrupt the script
			if (Eden.AST.debug && delay.value.type == "debug") {
				// Save the next step to be called later by debugger.
				var debugnext = function() {runEdenAction.call(me, source, action, cb)};
				delay.value.next = debugnext;

				// Check which callback to use
				if (delay.value.statement && Eden.AST.debugbreakpoint === delay.value.statement) {
					if (Eden.AST.debugbreakpoint_cb) Eden.AST.debugbreakpoint_cb(delay.value);
				} else {
					if (Eden.AST.debugstep_cb) setTimeout(function() {Eden.AST.debugstep_cb(delay.value)},0);
					// Auto step if debugspeed is set...
					//if (Eden.AST.debugspeed) setTimeout(debugnext, Eden.AST.debugspeed);
				}
			// Need to do an import and block until done.
			} else if (delay.value.type == "import") {
				delay.value.executed = 1;
				if (eden.peer) eden.peer.imports(source, delay.value.path, delay.value.tag, delay.value.options);

				Eden.Agent.importAgent(delay.value.path, delay.value.tag, delay.value.options, function(ag) {
					if (ag) {
						var already = false;
						// Check to see if already imported to local scope...
						for (var i=0; i<me.imports.length; i++) {
							if (me.imports[i] === ag) {
								already = true;
								break;
							}
						}
						// If not, import it.
						if (!already) me.imports.push(ag);
					}

					// Continue execution.
					runEdenAction.call(me,source, action, cb);
				});
			// Call another action and block until done
			} else if (delay.value.type == "do") {
				// Note that getActionByName can return entire agents!
				var script = (delay.value.name) ? me.getActionByName(delay.value.name) : delay.value.script;

				if (script) {
					var stats = script.statements;
					// Params are deprecated.
					var params = delay.value.params;
					// Allow for execution in a different scope.
					var nscope = delay.value.nscope;

					if (nscope.range) {
						nscope.range = false;
						var sscripts = [];

						while (true) {
							var cscope = nscope.clone();
							sscripts.push(new Eden.AST.ScopedScript(stats, cscope));
							if (nscope.next() == false) break;
						}

						nscope.range = true;
						me.executeStatements(sscripts, undefined, source, function() {
							runEdenAction.call(me,source, action, cb);
						}, {parameters: params}, nscope);
					} else {
						me.executeStatements(stats, undefined, source, function() {
							runEdenAction.call(me,source, action, cb);
						}, {parameters: params}, nscope);
					}
				} else {
					var err = new Eden.RuntimeError(me, Eden.RuntimeError.ACTIONNAME, delay.value, "Action '"+delay.value.name+"' does not exist");
					err.line = delay.value.line;
					delay.value.errors.push(err);
					Eden.Agent.emit("error", [source,err]);
				}
			}
		} else if (delay.value == 0) {
			runEdenAction.call(this,source, action, cb);
		} else if (delay.value > 0) {
			// A wait statement requested a delay.
			setTimeout(function() {runEdenAction.call(me, source, action, cb)}, delay.value);
		}
	} else {
		source.active = false;
		if (cb) cb();
	}
}



/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatement = function(statement, line, agent, cb) {

	// Debug callback to begin block
	if (Eden.AST.debug && (Eden.AST.debugstep || ( agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	try {
		var gen = this.executeGenerator([statement], Eden.AST.DummyContext ,this, eden.root.scope, agent);
		runEdenAction.call(this,agent, gen, function() {
			// Debug callback to end block
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb();
		});
	} catch (e) {
		// Debug callback to end block
		if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
			if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
		}
		if (cb) cb();

		var err;

		if (/[0-9][0-9]*/.test(e.message)) {
			err = new Eden.RuntimeError(this, parseInt(e.message), undefined, e.message);
		} else {
			err = new Eden.RuntimeError(this, 0, undefined, e);
		}

		err.line = this.line;

		if (agent) Eden.Agent.emit("error", [agent,err]);
		else console.log(err.prettyPrint());
		//throw e;
	}
}

/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatements = function(statements, line, agent, cb, ctx, scope) {
	if (scope === undefined) scope = eden.root.scope;

	// Debug callback to begin block
	if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	try {
		var gen = this.executeGenerator(statements, ctx ,this, scope, agent);
		runEdenAction.call(this,agent, gen, function() {
			// Debug callback to end block
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb();
		});
	} catch (e) {
		// Debug callback to end block
		if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
			if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
		}
		if (cb) cb();

		// Now process error
		var err;

		if (/[0-9][0-9]*/.test(e.message)) {
			err = new Eden.RuntimeError(this, parseInt(e.message), undefined, e.message);
		} else {
			err = new Eden.RuntimeError(this, 0, undefined, e);
		}

		err.line = this.line;

		if (agent) Eden.Agent.emit("error", [agent,err]);
		else console.log(err.prettyPrint());
		//throw e;
	}
}
