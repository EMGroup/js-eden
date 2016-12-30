DiffUtil = {};

DiffUtil.diff = function(oldsrc, newsrc) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(oldsrc, newsrc);
	dmp.diff_cleanupSemantic(d);
	//var diffhtml = dmp.diff_prettyHtml(d);
	console.log(d);

	var edits = {};

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
				if (edits[nline+j] === undefined) edits[nline+j] = {insert: [], remove: []};
				edits[nline+j].insert.push({start: nchars, length: lines[j].length});
				if (j > 0) edits[nline+j].consecutive = true;
				nchars += lines[j].length;
				if (j < lines.length-1) nchars++;
			}
			//nchars += d[i][1].length;
			if (linechars !== null) nline += linechars.length;
		} else if (d[i][0] == -1) {
			lines = d[i][1].split("\n");
			for (var j=0; j<lines.length; j++) {
				if (j == lines.length-1 && lines[j].length == 0) break;
				if (edits[oline+j] === undefined) edits[oline+j] = {insert: [], remove: []};
				edits[oline+j].remove.push({start: ochars, length: lines[j].length});
				if (j > 0) edits[oline+j].consecutive = true;
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

	for (var x in edits) {
		if (edits[x].insert.length > 0) {
			for (var i=0; i<edits[x].insert.length; i++) {
				edits[x].insert[i].start -= nlineoff[x];
			}
			edits[x].iline = nlines[x];
		}
		if (edits[x].remove.length > 0) {
			for (var i=0; i<edits[x].remove.length; i++) {
				edits[x].remove[i].start -= olineoff[x];
			}
			edits[x].rline = olines[x];
		}
	}

	console.log(edits);
	return edits;
}
