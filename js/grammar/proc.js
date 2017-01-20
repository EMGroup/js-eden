/**
 * ACTION Production
 * ACTION -> observable : OLIST FUNCBODY
 */
Eden.AST.prototype.pACTION = function() {
	var action = new Eden.AST.Action();
	var parent = this.parent;
	this.parent = action;

	action.warning = new Eden.SyntaxWarning(this, action, Eden.SyntaxWarning.DEPRECATED, "attempt to use 'when' instead of 'proc'");

	if (this.token == "OBSERVABLE") {
		action.name = this.data.value;
		this.next();
	} else {
		action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.PROCNAME));
		this.parent = parent;
		return action;
	}

	if (this.token == ":") {
		this.next();

		var olist = this.pOLIST();
		if (olist.length == 0) {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONNOWATCH));
			this.parent = parent;
			return action;
		} else if (olist[olist.length-1] == "NONAME") {
			action.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.ACTIONCOMMAS));
			this.parent = parent;
			return action;
		}
		action.triggers = olist;
	}

	action.setBody(this.pFUNCBODY());
	this.parent = parent;
	return action;
}

