/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.DB = {
	directory: {},
	meta: {},
	remoteMeta: {}
}

Eden.DB.loadLocalDirectory = function() {
	var localdir;
	try {
		if (window.localStorage) {
			localdir = JSON.parse(window.localStorage.getItem('agent_directory')) || {};
		}
	} catch (e) {
		localdir = {};
	}
	Eden.DB.directory = localdir;
}
Eden.DB.loadLocalDirectory();

Eden.DB.loadRemoteRoot = function(url) {
	// For now, download entire directory and meta data from file.

	var me = this;

	$.get(url, function(data) {
		//Eden.Agent.db = data;
		for (var a in data.meta) {
			Eden.DB.updateDirectory(a);
		}
		Eden.DB.remoteMeta = data.meta;
	}, "json");
}
Eden.DB.loadRemoteRoot("resources/agents.db.json");

Eden.DB.updateDirectory = function(name) {
	// Find location, create if needed
	var comp = name.split("/");
	var root = Eden.DB.directory;
	var changed = false;

	for (var i=0; i<comp.length; i++) {
		if (root[comp[i]] === undefined) {
			root[comp[i]] = {
				children: {}
			};
			changed = true;
		}
		root = root[comp[i]].children;
	}

	// Save locally if changed.
	if (changed) {
		try {
			if (window.localStorage) {
				window.localStorage.setItem('agent_directory', JSON.stringify(Eden.DB.directory));
			}
		} catch (e) {
		}
	}
}

Eden.DB.updateMeta = function(path, entry, value) {
	var meta = Eden.DB.meta[path];

	if (meta === undefined) {
		meta = Eden.DB.remoteMeta[path];

		if (meta === undefined) {
			meta = {};
		}

		Eden.DB.meta[path] = meta;
	}

	meta[entry] = value;
	// Save locally
	try {
		if (window.localStorage) {
			window.localStorage.setItem('agent_'+path+'_meta', JSON.stringify(meta));
		}
	} catch (e) {
	}
}

Eden.DB.getDirectory = function(path, callback) {
	// Check local directory...
	var comp = path.split("/");
	var root = Eden.DB.directory;
	var changed = false;

	if (path == "") {
		callback(root);
		return;
	}

	for (var i=0; i<comp.length; i++) {
		if (root[comp[i]] === undefined) {
			callback(undefined);
			return;
		}
		//if (i == comp.length-1) {
		//	root = root[comp[i]];
		//} else {
			root = root[comp[i]].children;
		//}
	}
	// If marked as missing, go to server.
	// Also update from server async.

	callback(root);
}

Eden.DB.getMeta = function(path, callback) {
	// Check local meta
	if (Eden.DB.meta[path]) {
		callback(path, Eden.DB.meta[path]);
	} else {
		try {
			if (window.localStorage) {
				var meta = JSON.parse(window.localStorage.getItem('agent_'+path+'_meta'));
				if (meta) {
					Eden.DB.meta[path] = meta;
					callback(path, meta);
					return;
				}
			}
		} catch (e) {
		}
		// Otherwise, go to server for it.
		callback(path, Eden.DB.remoteMeta[path]);
	}
}

Eden.DB.getSource = function(path, callback) {

}

Eden.DB.getHistory = function(path, callback) {

}


