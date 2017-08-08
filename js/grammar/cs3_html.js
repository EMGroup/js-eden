
Eden.AST.prototype.pHTML = function() {
	this.next();
	var h = new Eden.AST.HTML();

	if (this.token != "OBSERVABLE") {
		h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		return h;
	}

	h.setName(this.data.value);
	this.next();

	// Parse Attributes
	while (this.token == "OBSERVABLE") {
		var startpos = this.stream.prevposition;
		var aname = this.data.value;
		this.next();

		while (this.token == "-") {
			aname += "-";
			this.next();
			if (this.token != "OBSERVABLE") {
				h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
				return h;
			}
			aname += this.data.value;
			this.next();
		}

		if (this.stream.prevposition - startpos != aname.length) {
			h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
			return h;
		}

		if (this.token == "OBSERVABLE" || this.token == ">" || this.token == "/") {
			h.addAttribute(aname, new Eden.AST.Literal("BOOLEAN",true));
			continue;
		}

		if (this.token != "=") {
			h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
			return h;
		}

		this.next();

		if (this.token == "STRING") {
			h.addAttribute(aname, new Eden.AST.Literal("STRING",this.data.value));
			this.next();
			continue;
		}

		if (this.token == "{") {
			this.next();
			h.addAttribute(aname, this.pEXPRESSION());
			if (h.hasErrors()) return h;
			if (this.token != "}") {
				h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
				return h;
			}
			this.next();
		} else {
			h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
			return h;
		}
	}

	// Close of start tag
	if (this.token == "/") {
		this.next();
		if (this.token != ">") {
			h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		}
		this.next();
		return h;
	}
	if (this.token != ">") {
		h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		return h;
	}

	var start = this.stream.position;
	var end = this.stream.position;
	this.next();

	// Parse content!
	while (this.stream.valid() && this.token != "</") {
		if (this.token == "<") {
			if (end-1 > start) h.addContent(new Eden.AST.Literal("STRING", this.stream.code.substring(start,end).replace(/\n/g,"\\n")));
			h.addContent(this.pHTML());
			start = end = this.stream.prevposition;
		} else if (this.token == "{") {
			this.next();
			if (end-1 > start) h.addContent(new Eden.AST.Literal("STRING", this.stream.code.substring(start,end).replace(/\n/g,"\\n")));
			h.addContent(this.pEXPRESSION());
			if (this.token != "}") {
				h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
				return h;
			}
			start = end = this.stream.position;
			this.next();
		} else {
			end = this.stream.position;
			this.next();
		}
	}

	if (end > start) h.addContent(new Eden.AST.Literal("STRING", this.stream.code.substring(start,end).replace(/\n/g,"\\n")));

	// Must have a matching close tag
	if (this.token != "</") {
		h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		return h;
	}
	this.next();
	if (this.token != "OBSERVABLE" || this.data.value != h.name) {
		h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		return h;
	}
	this.next();
	if (this.token != ">") {
		h.errors.push(new Eden.SyntaxError(this, Eden.SyntaxError.UNKNOWN));
		return h;
	}
	this.next();
	return h;
}
