/**
 * A doxygen style comment node. The content is not parsed, the entire comment
 * is stored raw.
 * @param {String} content The string content of the comment.
 * @param {number} start Start character location in original source.
 * @param {number} end End character location in original source.
 * @see doxycomments.js
 */
Eden.AST.DoxyComment = function(content, start, end) {
	this.type = "doxycomment";
	this.content = content;
	this.startline = start;
	this.endline = end;
	this.tags = undefined;
	this.controls = undefined;
	this.parent = undefined;
}

/**
 * Get an array of all the hashtags in this comment. This function caches the
 * parsed result and also extracts "@" control tokens but does not return them.
 * @return {Array} List of hashtags.
 */
Eden.AST.DoxyComment.prototype.getHashTags = function() {
	if (this.tags) return Object.keys(this.tags);
	this.stripped();
	if (this.tags) {
		return Object.keys(this.tags);
	} else {
		return [];
	}
}


/**
 * Check if this comment contains a specific hashtag.
 * @param {String} tag A hashtag to look for.
 * @return {boolean} True if the hashtag is found.
 */
Eden.AST.DoxyComment.prototype.hasTag = function(tag) {
	if (this.tags === undefined) this.getHashTags();
	return (this.tags[tag]) ? true : false;
}

Eden.AST.DoxyComment.prototype.getControls = function() {
	if (this.controls) return this.controls;
	//this.getHashTags();
	this.stripped();
	return this.controls;
}

Eden.AST.DoxyComment.prototype.getProperty = function(name) {
	return this.getControls()["@"+name];
}

Eden.AST.DoxyComment.prototype.stripped = function() {
	var controls = {};
	var tags = {};
	var lines = this.content.split("\n");
	//console.log(lines);
	var res = "";

	for (var i=0; i<lines.length; i++) {
		if (lines[i].charAt(0) == "#") lines[i] = lines[i].slice(1).trim();
		lines[i] = lines[i].trim();
		if (lines[i] == "") {
			res += "\n";
			continue;
		}
		if (lines[i].charAt(0) == "*") lines[i] = lines[i].slice(1).trim();
		if (lines[i].charAt(0) == "@") {
			var spaceix = lines[i].indexOf(" ");
			var cont = lines[i].substring(0,spaceix);
			var details = lines[i].substring(spaceix+1,lines[i].length);
			//console.log("Parsed control:",cont,details);

			if (controls[cont] === undefined) controls[cont] = [];
			controls[cont].push(details);

			lines[i] = "";
		}

		var words = lines[i].split(/[ \t]+/);
		for (var j=0; j<words.length; j++) {
			if (words[j] != "" && words[j].charAt(0) != "@") {
				res += words[j] + " ";
				if (words[j].charAt(0) == "#") {
					tags[words[j]] = true;
				}
			}
		}
		//res = res.trim();
		res += "\n";
	}

	this.controls = controls;
	this.tags = tags;
	//console.log(res);
	return res.trim();
}

Eden.AST.DoxyComment.prototype.brief = function() {
	// TODO Check for @brief control
	var s = this.stripped();
	if (s) {
		return s.split(".")[0];
	}
}

Eden.AST.DoxyComment.prototype.pretty = function() {
	var s = this.stripped();
	var paras = this.controls["@param"];
	/*var res = "<p>";
	for (var i=0; i<s.length; i++) {
		if (s[i] == "") res += "</p><p>";
		else res += s[i];
	}
	res += "</p>";*/
	var sdown = new showdown.Converter();
	var res = sdown.makeHtml(s);

	if (paras && paras.length > 0) {
		res += '<div class="doxy-parameters">Parameters:';
		for (var i=0; i<paras.length; i++) {
			var s = paras[i].split(/[ \t]+/);
			res += '<div class="doxy-parameter"><div class="doxy-parameter-name">'+s[0]+'</div><div class="doxy-parameter-details">'+s.slice(1).join(" ")+'</div></div>';
		}
		res += '</div>';
	}
	return res;
}

Eden.AST.DoxyComment.prototype.getParamString = function() {
	var params = this.getControls()["@param"];
	if (params && params.length > 0) {
		var res = "(";
		for (var i=0; i<params.length; i++) {
			res += params[i].split(/[ \t]+/)[0];
			if (i < params.length-1) res += ", ";
		}
		res += ")";
		return res;
	} else {
		return "()";
	}
}

