var edenFunctions = {
"int": true,
"str": true,
"round": true,
"min": true,
"max": true,
"random": true,
"floor": true,
"ceil": true,
"abs": true,
"acos": true,
"asin": true,
"atan": true,
"cos": true,
"exp": true,
"ln": true,
"log": true,
"mod": true,
"randomInteger": true,
"randomFloat": true,
"sin": true,
"sqrt": true,
"sum": true,
"tan": true,
"length": true,
"error": true,
"substr": true,
"type": true,
"createView": true,
"createCanvas": true,
"zonesAt": true,
"execute": true,
"indexOf": true,
"forget": true,
"eager": true,
"time": true,
"writeln": true,
"apply": true,
"todo": true,
"char": true,
"isBoolean": true,
"isCallable": true,
"isChar": true,
"isDefined": true,
"isValue": true,
"isFunc": true,
"isInt": true,
"isNaN": true,
"isNumber": true,
"isObject": true,
"isPoint": true,
"isProc": true,
"showView": true,
"array": true,
"sublist": true,
"reverse": true,
"search": true,
"sort": true,
"tail": true,
"concat": true,
"decodeHTML": true
};

var edenTypes = {
"HTMLImage": true,
"Text": true,
"Rectangle": true,
"Button" : true,
"Div": true,
"Arc": true,
"Button": true,
"Checkbox": true,
"Circle": true,
"Combobox": true,
"Ellipse": true,
"Image": true,
"Line": true,
"Polygon": true,
"Slider": true,
"Point": true
};

var edenSpecials = {
"autocalc": true,
"mouseX": true,
"mouseY": true,
"mousePosition": true,
"screenHeight": true,
"screenWidth": true,
"PI": true
};


function EdenHighlight(code) {
	this.ast = new EdenAST(code);
	this.CODELIMIT = 1000;
}


/**
 * Generate a syntax highlighted version of the stream.
 */
EdenHighlight.prototype.highlight = function(start) {
	var result = "";
	var errstart = -1;
	var errend = -1;
	var errmsg = "";
	var inerror = false;
	var stream = this.ast.stream;

	if (this.ast.script.errors.length > 0 && this.ast.script.errors[0].token != "EOF") {
		errstart = this.ast.script.errors[0].prevposition;
		errend = this.ast.script.errors[0].position;
		errmsg = this.ast.script.errors[0].messageText();
		//console.log(this.ast.script.errors[0]);
	}

	start = start - this.CODELIMIT;
	if (start < 0) start = 0;

	stream.reset();
	stream.position = start;

	result = stream.code.slice(0, start);

	while (stream.valid()) {
		if (stream.position > start + (2*this.CODELIMIT)) {
			if (inerror) result += "</span>";
			result += stream.code.slice(stream.position);
			break;
		}
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
				result += "<span title=\"" + errmsg + "\" class='eden-error'>";
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
			} else if (edenSpecials[stream.data.value]) {
				result += "<span class='eden-special'>" + stream.data.value + "</span>";
			} else {
				if (!inerror) {
					var val = "@";
					if (eden.root.symbols[stream.data.value] !== undefined) {
						val = eden.root.lookup(stream.data.value).value();
					}
					result += "<span title=\"" + val + "\" class='eden-observable'>" + stream.data.value + "</span>";
				} else {
					result += "<span class='eden-observable'>" + stream.data.value + "</span>";
				}
			}
		} else {
			result += "<span class='eden-operator'>" + token + "</span>";
		}
	}
	return result;
};
