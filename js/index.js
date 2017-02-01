Eden.Index = {};

Eden.Index.id_index = {};	// Master index with actual statements.
Eden.Index.name_index = {};
Eden.Index.tag_index = {};
Eden.Index.type_index = {};

Eden.Index.idExists = function(id) {
	return Eden.Index.id_index.hasOwnProperty(id);
}

Eden.Index.getByID = function(id) {
	var stat = Eden.Index.id_index[id];
	return (stat) ? stat:[];
}

Eden.Index.getAll = function() {
	var res = [];
	if (Object.values) return res.concat.apply(res, Object.values(Eden.Index.id_index));
	else return res.concat.apply(res, Object.keys(Eden.Index.id_index).map(function(e) { return Eden.Index.id_index[e]; }));
}

Eden.Index.getAllWithName = function() {
	var res = [];
	for (var name in Eden.Index.name_index) {
		res.push.apply(res, Eden.Index.name_index[name].map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.getByName = function(name) {
	var res = [];
	if (Eden.Index.name_index[name]) return res.concat.apply(res, Eden.Index.name_index[name].map(function(e) { return Eden.Index.id_index[e]; }));
	else return res;
}

Eden.Index.getByNameRegex = function(regex) {
	var res = [];
	for (var n in Eden.Index.name_index) {
		if (regex.test(n)) res = res.concat.apply(res, Eden.Index.name_index[n].map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.getByType = function(type) {
	var res = [];
	if (Eden.Index.type_index[type]) {
		return res.concat.apply(res,Object.keys(Eden.Index.type_index[type]).map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.getByTag = function(tag) {
	var res = [];
	if (Eden.Index.tag_index[tag]) return res.concat.apply(res, Eden.Index.tag_index[tag].map(function(e) { return Eden.Index.id_index[e]; }));
	else return res;
}

Eden.Index.getByTagRegex = function(regex) {
	var res = [];
	for (var n in Eden.Index.tag_index) {
		if (regex.test(n)) res = res.concat.apply(res, Eden.Index.tag_index[n].map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.remove = function(node) {
	var ids = Eden.Index.id_index[node.id];
	if (!ids) return;
	for (var i=0; i<ids.length; i++) {
		if (ids[i] === node) {
			ids.splice(i,1);
		}
	}
	if (ids.length == 0) {
		delete Eden.Index.id_index[node.id];
		delete Eden.Index.type_index[node.type][node.id];

		if ((node.name && node.type != "do") || node.lvalue) {
			var name = (node.name) ? node.name : node.lvalue.name;
			if (Eden.Index.name_index[name] === undefined) return;
			var ix = Eden.Index.name_index[name].indexOf(node.id);
			if (ix >= 0) {
				Eden.Index.name_index[name].splice(ix,1);
			}
		}

		if (node.tags) {
			var tags = node.tags;
			for (var i=0; i<tags.length; i++) {
				if (Eden.Index.tag_index[tags[i]] === undefined) continue;
				var ix = Eden.Index.tag_index[tags[i]].indexOf(node.id);
				if (ix >= 0) {
					Eden.Index.tag_index[tags[i]].splice(ix,1);
				}
			}
		}
	}
}

Eden.Index.update = function(node) {
	if (Eden.Index.id_index[node.id] === undefined) Eden.Index.id_index[node.id] = [];
	Eden.Index.id_index[node.id].push(node);
	
	if (Eden.Index.id_index[node.id].length == 1) {
		if (Eden.Index.type_index[node.type] === undefined) Eden.Index.type_index[node.type] = {};
		Eden.Index.type_index[node.type][node.id] = true;

		// Update name index...
		if ((node.name && node.type != "do") || node.lvalue) {
			var name = (node.name) ? node.name : node.lvalue.name;
			if (Eden.Index.name_index[name] === undefined) Eden.Index.name_index[name] = [];
			if (Eden.Index.name_index[name].indexOf(node.id) == -1) Eden.Index.name_index[name].push(node.id);
		}

		// Update tag index...
		if (node.tags) {
			var tags = node.tags;
			for (var i=0; i<tags.length; i++) {
				if (Eden.Index.tag_index[tags[i]] === undefined) Eden.Index.tag_index[tags[i]] = [];
				if (Eden.Index.tag_index[tags[i]].indexOf(node.id) == -1) Eden.Index.tag_index[tags[i]].push(node.id);
			}
		}
	}
}

