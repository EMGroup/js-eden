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

var edenValues = {
"true": true,
"false": true,
"green": true
};


function EdenHighlight(output) {
	this.ast = undefined;
	this.outelement = output;
	this.line = 1;
	this.currentline = -1;
}


/**
 * Generate a syntax highlighted version of the stream.
 */
EdenHighlight.prototype.highlight = function(ast, hline, position) {
	this.ast = ast;

	var result = "";
	var errstart = -1;
	var errend = -1;
	var errmsg = "";
	var inerror = false;
	var stream = ast.stream;
	var title = "";

	if (ast.stream.code.length == 0) {
		this.outelement.innerHTML = "<div class='eden-currentline'><span><span class='fake-caret'></span>&nbsp;</span></div>";
		return;
	}

	if (ast.script.errors.length > 0) {
		errstart = ast.script.errors[0].prevposition;
		errend = ast.script.errors[0].position;
		errmsg = ast.script.errors[0].messageText();
		//console.log(this.ast.script.errors[0]);
	}

	stream.reset();

	var line = "";
	var lineerror = false;
	var linestart = 0;
	var token = "INVALID";
	var prevtoken = "INVALID";

	while (true) {
		if (stream.position == position) {
			line += "<span class='fake-caret'></span>";
		}

		// Skip but preserve white space
		//while (stream.valid()) {
		var ch= stream.peek();
		if (ch == 10) {
			//console.log("LINE: " + this.line);
			this.line++;
			if (lineerror) {
				if (position >= linestart && position <= stream.position) {
					result += "<div class='eden-currentline eden-errorline'><span>";
				} else {
					result += "<div class='eden-errorline'><span>";
				}
				lineerror = false;
			} else if (position >= linestart && position <= stream.position) {
				this.currentline = this.line - 1;
				//this.currenttoken = token;
				//this.currentprevtoken = prevtoken;
				result += "<div class='eden-currentline'><span>";
			} else {
				result += "<div class='eden-line'><span>";
			}

			/*if (this.ast.lines[this.line - 2]) {
				if (this.ast.lines[this.line - 2].lvalue) {
					result += "<span class='eden-info'>" + this.ast.lines[this.line - 2].lvalue.observable + "</span>";
				}
			}*/

			//if (line == "") line = " ";

			linestart = stream.position+1;
			result += line + "</span>\n</div>";
			line = "";
			stream.skip();
			continue;
		} else if (ch == 9 || ch == 13 || ch == 32 || ch == 160) {
			stream.skip();
			if (ch == 32 || ch == 160) {
				line += "&nbsp;";
			} else if (ch != 10 && ch != 13) {
				line += String.fromCharCode(ch);
			}
			continue;
		} 
		//}

		prevtoken = token;
		token = stream.readToken();
		var type = stream.tokenType(token);
		var classes = "";
		var tokentext = stream.tokenText();

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
				//line += "<span class='eden-error' title=\"" + errmsg + "\">";
				inerror = true;
			}
			if (errend <= stream.prevposition && inerror) {
				//line += "</span>";
				inerror = false;
			}
			if( inerror) lineerror = true;
		}

		if (inerror && ast.script.errors[0].token != "EOF") {
			title = errmsg.replace(">","&gt;").replace("<","&lt;");
			classes += "eden-error ";
		} else {
			title = "";
		}

		if (token == "##") {
			classes += "eden-comment";
			var comment = "";
			while (stream.valid() && stream.peek() != 10) {
				comment += String.fromCharCode(stream.get());
			}
			tokentext = "##" + comment.replace(">","&gt;").replace("<","&lt;");
		} else if (token == "local" || token == "auto" || token == "para") {
			classes += "eden-storage";
		} else if (type == "keyword") {
			classes += "eden-keyword";
		} else if (token == "NUMBER") {
			classes += "eden-number";
		} else if (token == "STRING") {
			classes += "eden-string";
			tokentext = tokentext.replace("<","&lt;");
			tokentext = tokentext.replace(">","&gt;");
		} else if (token == "CHARACTER") {
			classes += "eden-string";
			tokentext = tokentext.replace("<","&lt;");
			tokentext = tokentext.replace(">","&gt;");
		} else if (token == "BOOLEAN") {
			classes += "eden-constant";	
		} else if (token == "OBSERVABLE") {
			if (edenFunctions[stream.data.value]) {
				classes += "eden-function";
			} else if (edenTypes[stream.data.value]) {
				classes += "eden-type";
			} else if (edenValues[stream.data.value]) {
				classes += "eden-constant";
			} else if (edenSpecials[stream.data.value]) {
				classes += "eden-special";
			} else {
				classes += "eden-observable";
			}
		} else if (token == "JAVASCRIPT") {
			classes += "eden-javascript";
			tokentext = tokentext.replace("<","&lt;");
			tokentext = tokentext.replace(">","&gt;");
		} else {
			classes += "eden-operator";
			tokentext = tokentext.replace("<","&lt;");
			tokentext = tokentext.replace(">","&gt;");
		}

		// Insert caret if needed
		if (stream.prevposition < position && stream.position > position) {
			console.log("CARET");
			var caret = position - stream.prevposition;
			tokentext = tokentext.slice(0,caret) + "<span class='fake-caret'></span>" + tokentext.slice(caret);
		}

		line += "<span class='"+classes+"' title=\""+title+"\">" + tokentext + "</span>";
	}

	if (line != "") {
		if (lineerror) {
			if (position >= linestart && position <= stream.position) {
				result += "<div class='eden-currentline eden-errorline'>" + line + "</span></div>";
			} else {
				result += "<div class='eden-errorline'>" + line + "</span></div>";
			}
		} else if (position >= linestart && position <= stream.position) {
			this.currentline = this.line;
			result += "<div class='eden-currentline'>" + line + "</span></div>";
		} else {
			result += "<div class='eden-line'>" + line + "</span></div>";
		}
	}

	/*if (stream.position == oldstart) {
		result += "<span class='fake-caret'></span>";
	}*/

	if (this.currentline == -1) {
		//this.currenttoken = token;
		//this.currentprevtoken = prevtoken;
		this.currentline = this.line - 1;
	}

	this.outelement.innerHTML = result;
	//return result;
};
