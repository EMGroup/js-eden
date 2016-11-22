Eden.AST.prototype.executeGenerator = function*(statements, ctx, base, scope, agent) {
	var stack = [];
	this.executed = 1;
	var allowscript = true;
	var i = 0;
	//console.log(statements);
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
		} else if (statements[i].type == "import" || statements[i].type == "do") {
			yield statements[i];
		} else if (statements[i].type == "when") {
			var when = statements[i];
			if (when.active == false) {
				when.active = true;
				var res = when.execute(undefined, base, eden.root.scope);
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
	//console.log("RunAction: " + delay.value);
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
				var script = me.getActionByName(delay.value.name);
				var stats = script.statements;
				if (stats) {
					var params = delay.value.getParameters(undefined, me, eden.root.scope);

					me.executeStatements(stats, undefined, script, function() {
						runEdenAction.call(me,source, action, cb);
					}, {parameters: params});
				} else {
					console.error("Missing script");
				}
			}
		} else if (delay.value == 0) {
			runEdenAction.call(this,source, action, cb);
		} else if (delay.value > 0) {
			// Clear any retriggering request
			//source.retrigger = false;
			// A wait statement requested a delay.
			setTimeout(function() {runEdenAction.call(me, source, action, cb)}, delay.value);
		}
	} else {
		source.active = false;
		//if (source.retrigger) setTimeout(source.trigger,0);
		//if (source.onfinish) source.onfinish();
		if (cb) cb();
	}
}



/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatement = function(statement, line, agent, cb) {

	if (Eden.AST.debug && (Eden.AST.debugstep || ( agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	//try {
		//statement.execute(undefined, this, eden.root.scope, agent);
		//if (this.active) return;
		//this.active = true;
		var gen = this.executeGenerator([statement], undefined ,this, eden.root.scope, agent);
		runEdenAction.call(this,statement, gen, function() {
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb();
		});
	//} catch (e) {
	//	eden.error(e);
	//	console.error("Details: " + e + "\nAgent: " + agent.name);
	//	console.log(statement);
		//throw e;
	//}
}

/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatements = function(statements, line, agent, cb, ctx) {

	if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	try {
		var gen = this.executeGenerator(statements, ctx ,this, eden.root.scope, agent);
		runEdenAction.call(this,agent, gen, function() {
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb();
		});
	} catch (e) {
		eden.error(e);
		console.error("Details: " + e + "\nAgent: " + agent.name);
		console.log(statement);
		//throw e;
	}
}
