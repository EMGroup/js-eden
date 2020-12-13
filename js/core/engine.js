Eden.AST.DummyContext = {
	subscribeDynamic: function(p,d) { return d; },
	scopes: []
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

		let statement = statements[i];

		if (Eden.AST.debug && statement.type !== "script") {
			if (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug())) {
				var debugobj = {
					type: "debug",
					base: base,
					script: this,
					index: i,
					statement: statement,
					context: ctx,
					agent: agent
				};
				yield debugobj;
			}
		}

		switch (statement.type) {
		case "wait"		:
							statement.executed = 1;
							statement.compile(ctx);
							if (statement.compiled_delay) {
								yield statement.compiled_delay(scope.context,scope);
							} else {
								yield 0;
							} break;
		case "import"	:
							if (statement.statements === undefined) {
								statement.selector = (statement.path) ? statement.path.execute(ctx, base, scope, agent) : undefined;
								yield statement;
								//statements.splice.apply(statements, [i, 1].concat(statements[i].statements));
								//i--;
							} break;
		case "query"	:
							if (statement.modexpr) {
								statement.executed = 1;
								statement._selector = statement.selector.execute(ctx, base, scope, agent);
								statement._modexpr = statement.modexpr.execute(ctx, base, scope, agent);
								yield statement;
							} else {}  // FIXME:
							break;
		case "do"		:
							statement.executed = 1;
							statement.selector = (statement.name) ? statement.name.execute(ctx, base, scope, agent) : undefined;
							statement.nscope = statement.getScope(ctx, scope)(scope.context,scope);
							if (statement.literal) {
								var state = {
									isconstant: false,
									locals: ctx.locals
								};
								var lit = Eden.AST.executeExpressionNode(statement.literal, statement.nscope, state);
								var scriptast = Eden.AST.parseScript(lit, statement);
								if (scriptast && scriptast.errors.length > 0) throw scriptast.errors[0];
								statement.statements = (scriptast) ? scriptast.statements : [];
								//console.log("EXEC",statements[i].statements);
							}
							yield statement;
							break;
		case "when"		:
							var when = statement;
							if (when.active == false) {
								when.active = true;
								var res = when.execute(undefined, base, scope, agent);
								//console.log(res);
								if (res) {
									base.executeStatements(res, -1, when, null, null, scope);
								} else {
									when.active = false;
								}
								//whens[i].active = false;
							} break;
		default			:
							//if (typeof statements[i].execute != "function") console.error("NO EXECUTE", statements[i]);
							var res = statement.execute(ctx, base, scope, agent);
							if (res && Array.isArray(res) && res.length > 0) {
								// Allow for a scope shift.
								var nscope = scope;
								if (statement.type == "scopedscript") nscope = statement.scope;
								i++;
								// Allow tail recursion...
								if (i < statements.length) stack.push({statements: statements, index: i, scope: scope});
								statements = res;
								scope = nscope;
								//console.log(statements);
								i = 0;
								continue;
							}
							if (res === -1) return;
		}

		if (statement.errors.length > 0) {
			this.script.errors.push.apply(this.script.errors, statement.errors);
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

function runEdenAction(source, scope, action, cb) {
	var me = this;

	if (action === undefined) {
		source.active = false;
	}
	var delay = action.next();

	if (delay.done == false) {
		if (typeof delay.value === "object") {
			// The debugger wants to interrupt the script
			if (Eden.AST.debug && delay.value.type === "debug") {
				// Save the next step to be called later by debugger.
				var debugnext = function() {runEdenAction.call(me, source, scope, action, cb)};
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
			} else if (delay.value.type === "import") {
				delay.value.executed = 1;

				//console.log("IMPORT",delay.value.selector);

				Eden.Selectors.query(delay.value.selector, undefined, {context: delay.value.parent, minimum: 1, options: {external: true, index: true}}, function(stats) {
					if (stats === undefined) {
						var err = new Eden.RuntimeError(me, Eden.RuntimeError.UNKNOWN, delay.value, "Selector '"+delay.value.selector+"' has no results");
						err.line = delay.value.line;
						delay.value.errors.push(err);
						//delay.value.statements = [];
					} else {
						delay.value.statements = stats;
					}
					// Continue execution.
					runEdenAction.call(me,source, scope, action, cb);
				});

			} else if (delay.value.type === "query") {
				function docb(stats) {
					runEdenAction.call(me,source, scope, action, cb);
				}

				switch(delay.value.kind) {
				case "="	:	Eden.Selectors.assign(delay.value._selector, delay.value.restypes, delay.value._modexpr, delay.value, docb);
								break;
				case "+="	:	Eden.Selectors.append(delay.value._selector, delay.value.restypes, delay.value._modexpr, delay.value, docb);
								break;
				case "//="	:	Eden.Selectors.concat(delay.value._selector, delay.value.restypes, delay.value._modexpr, delay.value, docb);
								break;
				}

			// Call another action and block until done
			} else if (delay.value.type === "do") {
				var stats;

				function docb(stats) {
					if (stats && stats.length > 0) {
						//var stats = script.statements;
						// Params are deprecated.
						var params = delay.value.params;
						// Allow for execution in a different scope.
						var nscope = delay.value.nscope;
						if (!nscope) nscope = scope;

						if (delay.value.attribs.atomic) scope.context.beginAutocalcOff();

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
								if (delay.value.attribs.atomic) scope.context.endAutocalcOff();
								runEdenAction.call(me,source, scope, action, cb);
							}, {locals: {}}, nscope);
						} else {
							me.executeStatements(stats, undefined, source, function() {
								if (delay.value.attribs.atomic) scope.context.endAutocalcOff();
								runEdenAction.call(me,source, scope, action, cb);
							}, {locals: {}}, nscope);
						}
					} else {
						var err = new Eden.RuntimeWarning(delay.value, Eden.RuntimeWarning.EMPTYDO, delay.value.selector);
						err.line = delay.value.line;
						//delay.value.errors.push(err);
						delay.value.warning = err;
						scope.context.instance.emit("warning", [source,err]);
						if (delay.value.attribs.atomic) scope.context.endAutocalcOff();
						runEdenAction.call(me,source, scope, action, cb);
					}
				}

				if (delay.value.statements) {
					docb(delay.value.statements);
				} else if (delay.value.name) {
					// Get contextual root...
					Eden.Selectors.query(delay.value.selector, undefined, {options: {self: delay.value}, context: delay.value.parent, minimum: 1}, docb);
				} else {
					stats = delay.value.script.statements;
					docb(stats);
				}

				//var script = (delay.value.name) ? me.getActionByName(delay.value.name) : delay.value.script;
				//console.log("STATS",stats, delay.value.selector);
			}
		} else if (delay.value === 0) {
			runEdenAction.call(this,source, scope, action, cb);
		} else if (delay.value > 0) {
			// A wait statement requested a delay.
			setTimeout(function() {runEdenAction.call(me, source, scope, action, cb)}, delay.value);
		}
	} else {
		source.active = false;
		if (cb) cb();
	}
}



/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatement = function(statement, scope, agent, cb) {

	// Debug callback to begin block
	if (Eden.AST.debug && (Eden.AST.debugstep || ( agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	// Reset the dummy context;
	Eden.AST.DummyContext.locals = undefined;
	let ctx = {cb: cb, result: undefined};

	try {
		var gen = this.executeGenerator([statement], ctx ,this, scope, agent);
		runEdenAction.call(this, agent, scope, gen, function() {
			// Debug callback to end block
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb(ctx.result);
		});
	} catch (e) {
		// Debug callback to end block
		if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
			if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
		}
		if (cb) cb(e);

		var err;

		if (/[0-9][0-9]*/.test(e.message)) {
			err = new Eden.RuntimeError(scope.context, parseInt(e.message), undefined, e.message);
		} else {
			err = new Eden.RuntimeError(scope.context, 0, undefined, e);
		}

		err.line = this.line;

		if (agent) scope.context.instance.emit("error", [agent,err]);
		else console.log(err.prettyPrint());
		//throw e;
	}
}

/**
 * Execute the given statement and catch any errors.
 */
Eden.AST.prototype.executeStatements = function(statements, line, agent, cb, ctx, scope) {
	if (!scope) throw "Missing scope"; 

	// Debug callback to begin block
	if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
		if (Eden.AST.debug_begin_cb) Eden.AST.debug_begin_cb({base: this, agent: agent});
	}

	try {
		var gen = this.executeGenerator(statements, ctx ,this, scope, agent);
		runEdenAction.call(this,agent, scope, gen, function() {
			// Debug callback to end block
			if (Eden.AST.debug && (Eden.AST.debugstep || (agent && agent.doDebug && agent.doDebug()))) {
				if (Eden.AST.debug_end_cb) Eden.AST.debug_end_cb({base: this, agent: agent});
			}
			if (cb) cb();
		});
	} catch (e) {
		console.error(e);
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

		if (agent) scope.context.instance.emit("error", [agent,err]);
		else console.log(err.prettyPrint());
		//throw e;
	}
}
