/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.DB = {
	directory: {},
	meta: {},
	remoteMeta: {},
	remoteURL: "http://localhost:18880"
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
//Eden.DB.loadLocalDirectory();

Eden.DB.loadRemoteRoot = function(url) {
	// For now, download entire directory and meta data from file.

	var me = this;

	$.get(url, function(data) {
		//Eden.Agent.db = data;
		for (var a in data.meta) {
			Eden.DB.updateDirectory(a);
		}
		Eden.DB.remoteMeta = data.meta;
		//data.meta.saveID = "origin";
	}, "json");

	// Go to database to get root path
	$.ajax({
		url: this.remoteURL+"/agent/search",
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			for (var i=0; i<data.length; i++) {
				Eden.DB.updateDirectory(data[i].path);
				Eden.DB.meta[data[i].path] = {remote: true};
			}
		},
		error: function(a){
			console.error(a);
		}
	});

	/*$.get(this.remoteURL+"/agent/search", function(data) {
		for (var i=0; i<data.length; i++) {
			Eden.DB.updateDirectory(data[i].path);
			Eden.DB.meta[data[i].path] = {remote: true};
		}
	}, "json");*/
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
				missing: true,
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
			console.error("NO META");
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

		if (root[comp[i]].missing) {
			root[comp[i]].missing = false;
			var curpath = comp.slice(0,i+1).join("/");
			// Go to database to get root path
			$.ajax({
				url: this.remoteURL+"/agent/search?path="+curpath,
				type: "get",
				crossDomain: true,
				xhrFields:{
					withCredentials: true
				},
				success: function(data){
					for (var i=0; i<data.length; i++) {
						Eden.DB.updateDirectory(data[i].path);
						Eden.DB.meta[data[i].path] = {remote: true};
					}
					if (data.length == 0) {
						callback(undefined);
						return;
					}
					Eden.DB.getDirectory(path, callback);
				},
				error: function(a){
					console.error(a);
				}
			});

			/*$.get(this.remoteURL+"/agent/search?path="+curpath, function(data) {
				for (var i=0; i<data.length; i++) {
					Eden.DB.updateDirectory(data[i].path);
					Eden.DB.meta[data[i].path] = {remote: true};
				}
				if (data.length == 0) {
					callback(undefined);
					return;
				}
				Eden.DB.getDirectory(path, callback);
			}, "json");*/
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

Eden.DB.upload = function(path, meta, source, tagname, callback) {
	if (meta === undefined) {
		console.error("Attempting to upload agent without meta data: " + path);
		return

	}
	$.ajax({
		url: this.remoteURL+"/agent/add",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{path: path, title: meta.title, source: source, tag: tagname},
		success: function(data){
			console.log(data);
			Eden.DB.updateMeta(path, "saveID", data.saveID);
			Eden.DB.updateMeta(path, "tag", tagname);
			if (callback) callback();
		},
		error: function(a){
			console.error(a);
		}
	});
}

Eden.DB.createMeta = function(path) {
	Eden.DB.meta[path] = {saveID: "origin"};
	return Eden.DB.meta[path];
}

Eden.DB.getVersions = function(path, callback) {
	$.ajax({
		url: this.remoteURL+"/agent/versions?path="+path,
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			console.log(data);
			callback(data);
		},
		error: function(a){
			console.error(a);
		}
	});
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

Eden.DB.getSource = function(path, tag, callback) {
	console.log("LOADING: "+path+"@"+tag);

	Eden.DB.getMeta(path, function(path, meta) {
		if (meta === undefined) {
			callback(undefined, "No such agent");
			return;
		}

		if (meta.remote) {
			var tagvalue;
			if (tag === undefined || tag == "default") {
				tagvalue = "";
			} else if (typeof tag == "string") {
				tagvalue = "&tag="+tag;
			} else {
				tagvalue = "&version="+tag;
			}

			$.get(Eden.DB.remoteURL+"/agent/get?path="+path+tagvalue, function (data) {
				if (data == null) {
					callback(undefined, "No such version");
				} else {		
					Eden.DB.updateMeta(path, "saveID", data.saveID);		
					callback(data.source);
				}
			});
		} else if (meta.file) {
			$.get(meta.file, function(data) {
				callback(data);
			}, "text");
		} else {
			// Assume it must be local only.
			callback("");
		}
	});
}

Eden.DB.getHistory = function(path, callback) {

}


