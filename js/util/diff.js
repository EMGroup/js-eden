DiffUtil = {};

DiffUtil.diff = function(oldsrc, newsrc) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(oldsrc, newsrc);
	dmp.diff_cleanupSemantic(d);
	//var diffhtml = dmp.diff_prettyHtml(d);
	console.log(d);

	var edits = {
		remove: {},
		insert: {}
	};

	var res = "";
	var oline = 0;
	var nline = 0;
	var nchars = 0;
	var ochars = 0;

	for (var i=0; i<d.length; i++) {
		var linechars = d[i][1].match(/\n/g);

		if (d[i][0] == 0) {
			if (linechars !== null) {
				oline += linechars.length;
				nline += linechars.length;
			}
			ochars += d[i][1].length;
			nchars += d[i][1].length;
			continue;
		} else if (d[i][0] == 1) {
			lines = d[i][1].split("\n");
			for (var j=0; j<lines.length; j++) {
				if (j == lines.length-1 && lines[j].length == 0) break;
				if (edits.insert[nline+j] === undefined) edits.insert[nline+j] = {oline: oline, chars: []};
				edits.insert[nline+j].chars.push({start: nchars, length: lines[j].length});
				if (j > 0) edits.insert[nline+j].consecutive = true;
				edits.insert[nline+j].partial = linechars === null;
				nchars += lines[j].length;
				if (j < lines.length-1) nchars++;
			}
			//nchars += d[i][1].length;
			if (linechars !== null) nline += linechars.length;
		} else if (d[i][0] == -1) {
			lines = d[i][1].split("\n");
			for (var j=0; j<lines.length; j++) {
				if (j == lines.length-1 && lines[j].length == 0) break;
				if (edits.remove[oline+j] === undefined) edits.remove[oline+j] = {nline: nline, chars: []};
				edits.remove[oline+j].chars.push({start: ochars, length: lines[j].length});
				edits.remove[oline+j].partial = linechars === null;
				if (j > 0) edits.remove[oline+j].consecutive = true;
				ochars += lines[j].length;
				if (j < lines.length-1) ochars++;
			}
			//nchars += d[i][1].length;
			if (linechars !== null) oline += linechars.length;
		}
	}

	var olines = oldsrc.split("\n");
	var nlines = newsrc.split("\n");
	var olineoff = [0];
	for (var i=0; i<olines.length-1; i++) {
		olineoff.push(olines[i].length+olineoff[i]+1);
	}
	var nlineoff = [0];
	for (var i=0; i<nlines.length-1; i++) {
		nlineoff.push(nlines[i].length+nlineoff[i]+1);
	}

	for (var x in edits.insert) {
		if (edits.insert[x].chars.length > 0) {
			for (var i=0; i<edits.insert[x].chars.length; i++) {
				edits.insert[x].chars[i].start -= nlineoff[x];
			}
			edits.insert[x].iline = nlines[x];
		}
	}
	for (var x in edits.remove) {
		if (edits.remove[x].chars.length > 0) {
			for (var i=0; i<edits.remove[x].chars.length; i++) {
				edits.remove[x].chars[i].start -= olineoff[x];
			}
			edits.remove[x].rline = olines[x];
		}
	}

	console.log(edits);
	return edits;
}
