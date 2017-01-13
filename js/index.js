Eden.Index = {};

Eden.Index.id_index = {};	// Master index with actual statements.
Eden.Index.name_index = {};
Eden.Index.tag_index = {};
Eden.Index.type_index = {};

Eden.Index.getByID = function(id) {
	var stat = Eden.Index.id_index[id];
	return (stat) ? [stat]:[];
}

Eden.Index.getAll = function() {
	if (Object.values) return Object.values(Eden.Index.id_index);
	else return Object.keys(Eden.Index.id_index).map(function(e) { return Eden.Index.id_index[e]; });
}

Eden.Index.getAllWithName = function() {
	var res = [];
	for (var name in Eden.Index.name_index) {
		res.push.apply(res, Eden.Index.name_index[name].map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.getByName = function(name) {
	if (Eden.Index.name_index[name]) return Eden.Index.name_index[name].map(function(e) { return Eden.Index.id_index[e]; });
	else return [];
}

Eden.Index.getByNameRegex = function(regex) {
	var res = [];
	for (var n in Eden.Index.name_index) {
		if (regex.test(n)) res.push.apply(res, Eden.Index.name_index[n].map(function(e) { return Eden.Index.id_index[e]; }));
	}
	return res;
}

Eden.Index.getByType = function(type) {
	if (Eden.Index.type_index[type]) {
		return Object.keys(Eden.Index.type_index[type]).map(function(e) { return Eden.Index.id_index[e]; });
	}
	return [];
}

Eden.Index.remove = function(node) {
	delete Eden.Index.id_index[node.id];
	delete Eden.Index.type_index[node.type][node.id];

	if ((node.name && node.type != "do") || node.lvalue) {
		var name = (node.name) ? node.name : node.lvalue.name;
		var ix = Eden.Index.name_index[name].indexOf(node.id);
		if (ix >= 0) {
			Eden.Index.name_index[name].splice(ix,1);
		}
	}
}

Eden.Index.update = function(node) {
	Eden.Index.id_index[node.id] = node;
	if (Eden.Index.type_index[node.type] === undefined) Eden.Index.type_index[node.type] = {};
	Eden.Index.type_index[node.type][node.id] = true;

	// Update name index...
	if ((node.name && node.type != "do") || node.lvalue) {
		var name = (node.name) ? node.name : node.lvalue.name;
		if (Eden.Index.name_index[name] === undefined) Eden.Index.name_index[name] = [];
		if (Eden.Index.name_index[name].indexOf(node.id) == -1) Eden.Index.name_index[name].push(node.id);
	}
}

