var edenFunctions = {
"int": true,
"str": true,
"round": true
};

var edenTypes = {
"HTMLImage": true,
"Text": true
};


function EdenHighlight(code) {
	this.ast = new EdenAST(code);
}


/**
 * Generate a syntax highlighted version of the stream.
 */
EdenHighlight.prototype.highlight = function() {
	var result = "";
	var errstart = -1;
	var errend = -1;
	var inerror = false;
	var stream = this.ast.stream;

	if (this.ast.script.errors.length > 0 && this.ast.script.errors[0].token != "EOF") {
		errstart = this.ast.script.errors[0].prevposition;
		errend = this.ast.script.errors[0].position;
		console.log(this.ast.script.errors[0]);
	}

	stream.reset();

	while (stream.valid()) {
		// Skip but preserve white space
		while (stream.valid()) {
			var ch= stream.peek();
			//if (ch == 10) this.line++;
			if (ch == 9 || ch == 10 || ch == 13 || ch == 32 || ch == 160) {
				stream.skip();
				//if (ch == 10) {
				//	result += "<br/>";
				if (ch == 32 || ch == 160) {
					result += "&nbsp;";
				} else {
					result += String.fromCharCode(ch);
				}
			} else {
				break;
			}
		}

		var token = stream.readToken();
		var type = stream.tokenType(token);
		if (token == "EOF") {
			break;
		}
		if (token == "INVALID") {
			console.log("INVALID: " + stream.peek());
			stream.skip();
			continue;
		}

		if (errstart != -1) {
			if (errstart <= stream.prevposition && !inerror) {
				result += "<span class='eden-error'>";
				inerror = true;
			}
			if (errend <= stream.prevposition && inerror) {
				result += "</span>";
				inerror = false;
			}
		}

		if (token == "##") {
			result += "<span class='eden-comment'>##";
			while (stream.valid() && stream.peek() != 10) {
				result += String.fromCharCode(stream.get());
			}
			result += "</span>";
		} else if (token == "local" || token == "auto" || token == "para") {
			result += "<span class='eden-storage'>" + token + "</span>";
		} else if (type == "keyword") {
			result += "<span class='eden-keyword'>" + token + "</span>";
		} else if (token == "NUMBER") {
			result += "<span class='eden-number'>" + stream.data.value + "</span>";
		} else if (token == "STRING") {
			result += "<span class='eden-string'>\"" + stream.data.value + "\"</span>";
		} else if (token == "OBSERVABLE") {
			if (edenFunctions[stream.data.value]) {
				result += "<span class='eden-function'>" + stream.data.value + "</span>";
			} else if (edenTypes[stream.data.value]) {
				result += "<span class='eden-type'>" + stream.data.value + "</span>";
			} else {
				result += "<span class='eden-observable'>" + stream.data.value + "</span>";
			}
		} else {
			result += "<span class='eden-operator'>" + token + "</span>";
		}
	}
	return result;
};
