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
	remoteURL: undefined,
	username: undefined,
	// Note: reverse order, last is popped off to try first
	repositories: [
		"http://jseden.dcs.warwick.ac.uk/projectmanager",
		"http://localhost:18880"
	],
	repoindex: 0,
	retrycount: 0
}

Eden.DB.listeners = {};
Eden.DB.emit = emit;
Eden.DB.listenTo = listenTo;



Eden.DB.Meta = function() {
	this.remote = false;
	this.title = "Agent";
	this.author = undefined;
	this.saveID = "origin";
	this.tag = "origin";
	this.defaultID = -1;
	this.latestID = -1;
	this.file = undefined;
}

Eden.DB.Meta.prototype.updateDefault = function(id, title, author) {
	if (id > this.defaultID) this.defaultID = id;
	if (this.latestID == -1) this.latestID = id;
	if (this.saveID == -1) {
		this.title = title;
		this.author = author;
	}
}

Eden.DB.Meta.prototype.updateLatest = function(id, title, author) {
	if (id > this.latestID) this.latestID = id;
	if (this.saveID == -1 && this.defaultID == -1) {
		this.title = title;
		this.author = author;
	}
	if (this.defaultID == -1) this.defaultID = id;
}

Eden.DB.Meta.prototype.updateVersion = function(saveID, tag, title, author) {
	this.saveID = saveID;
	this.title = title;
	this.author = author;

	if (tag) {
		this.tag = tag;
	} else {
		this.tag = saveID;
	}
}



Eden.DB.isConnected = function() {
	return Eden.DB.remoteURL !== undefined;
}

Eden.DB.connect = function(url) {
	Eden.DB.remoteURL = url;

	function markMissing(node) {
		for (var a in node) {
			node[a].missing = true;
			if (node[a].children) {
				markMissing(node[a].children);
			}
		}
	}
	markMissing(Eden.DB.directory);

	function loginLoop() {
		if (Eden.DB.isConnected() && Eden.DB.username === undefined) {
			setTimeout(function() {
				Eden.DB.getLoginName(function(name) {
					if (name) {
						Eden.DB.emit("login", [name]);
					} else {
						loginLoop();
					}
				})
			}, 5000);
		}
	}

	Eden.DB.getLoginName(function(name) {
		// Reset retrys on success
		Eden.DB.retrycount = 0;
		Eden.DB.loadDatabaseRoot();
		Eden.DB.emit("connected", [url]);

		if (name) {
			Eden.DB.emit("login", [name]);
		} else {
			loginLoop();
		}
	});
}

Eden.DB.disconnect = function(retry) {
	Eden.DB.remoteURL = undefined;
	Eden.DB.emit("disconnected", []);

	if (retry) {
		Eden.DB.retrycount++;
		// Use exponential backoff retries
		setTimeout(function() {
			// Allow for repositories to be removed
			if (Eden.DB.repoindex >= Eden.DB.repositories.length) {
				Eden.DB.repoindex = Eden.DB.repositories.length-1;
			}
			Eden.DB.connect(Eden.DB.repositories[Eden.DB.repoindex]);
			Eden.DB.repoindex = (Eden.DB.repoindex + 1) % Eden.DB.repositories.length;
		}, Math.pow(2, Math.ceil(Eden.DB.retrycount / Eden.DB.repositories.length)) * 200);
	}
}



Eden.DB.getLoginName = function(callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/user/details",
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				if (data == null || data.error) {
					Eden.DB.username = undefined;
					callback();
				} else {
					Eden.DB.username = data.name;
					callback(data.name);
				}
			},
			error: function(a){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
			}
		});
	} else {
		callback();
	}
}



Eden.DB.loadLocalMeta = function() {
	try {
		if (window.localStorage) {
			Eden.DB.localMeta = JSON.parse(window.localStorage.getItem('agent_localmeta')) || {};
		}
	} catch (e) {
		Eden.DB.localMeta = {};
	}

	Eden.DB.processManifestObject(Eden.DB.localMeta);
}

/*Eden.DB.loadLocalDirectory = function() {
	var localdir;
	try {
		if (window.localStorage) {
			localdir = JSON.parse(window.localStorage.getItem('agent_directory')) || {};
		}
	} catch (e) {
		localdir = {};
	}
	Eden.DB.directory = localdir;
}*/
//Eden.DB.loadLocalDirectory();




Eden.DB.loadDatabaseRoot = function() {
	var me = this;
	// Go to database to get root path
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: me.remoteURL+"/agent/search",
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				if (data == null || data.error) {
					console.error(data);
					eden.error((data) ? data.description : "No response from server");
				} else {
					Eden.DB.processManifestList(data, true);
				}
			},
			error: function(a){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
			}
		});
	}
}



/**
 * Load agent meta-data from a JSON file instead of a database.
 */
Eden.DB.loadManifestFile = function(url) {
	var me = this;
	$.get(url, function(data) {
		me.processManifestObject(data.meta);
	}, "json");
}
// Default manifest file
Eden.DB.loadManifestFile("resources/agents.db.json");



Eden.DB.processManifestObject = function(data) {
	if (!data) return;
	for (var a in data) {
		this.processManifestEntry(a, data[a]);
	}
}

Eden.DB.processManifestList = function(data, remote) {
	if (!data) return;
	for (var i=0; i<data.length; i++) {
		var meta = this.processManifestEntry(data[i].path, data[i]);
		meta.remote = remote;
	}
}



Eden.DB.processManifestEntry = function(path, entry) {
	var meta = Eden.DB.meta[path];
	if (meta === undefined) meta = new Eden.DB.Meta();

	// Update version data if available
	if (entry.versions) {
		if (entry.versions.Official.length > 0) {
			var version = entry.versions.Official[0];
			meta.updateDefault(version.saveID, version.title, version.name);
		}
		if (entry.versions.UserLatest.length > 0) {
			var version = entry.versions.UserLatest[0];
			meta.updateLatest(version.saveID, version.title, version.name);
		} else if (entry.versions.PublicLatest.length > 0) {
			var version = entry.versions.PublicLatest[0];
			meta.updateLatest(version.saveID, version.title, version.name);
		}
	}

	if (entry.title) meta.title = entry.title;
	if (entry.remote) meta.remote = true;
	if (entry.file) meta.file = entry.file;
	Eden.DB.updateDirectory(path);
	Eden.DB.meta[path] = meta;
	return meta;
}



Eden.DB.addLocalMeta = function(path, meta) {
	Eden.DB.localMeta[path] = meta;
	edenUI.setOptionValue('agent_localmeta', JSON.stringify(Eden.DB.localMeta));
}




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
}

Eden.DB.updateMeta = function(path, entry, value) {
	var meta = Eden.DB.meta[path];

	console.error("DEPRECATED UPDATEMETA");
	console.trace("Meta");

	if (meta === undefined) {
		meta = Eden.DB.remoteMeta[path];

		if (meta === undefined) {
			console.error("NO META");
			meta = {};
		}

		Eden.DB.meta[path] = meta;
	}

	meta[entry] = value;
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

		// This path has not yet been loaded from the database
		if (root[comp[i]].missing) {
			root[comp[i]].missing = false;
			if (Eden.DB.isConnected()) {
				var curpath = comp.slice(0,i+1).join("/");
				// Go to database to get path
				$.ajax({
					url: this.remoteURL+"/agent/search?path="+curpath,
					type: "get",
					crossDomain: true,
					xhrFields:{
						withCredentials: true
					},
					success: function(data){
						if (data && data.error) {
							console.error(data);
							eden.error((data) ? data.description : "No response from server");
							callback(undefined);
							return;
						} else if (data) {
							Eden.DB.processManifestList(data, true);

							if (data.length == 0) {
								callback(undefined);
								return;
							}

							// Recursive call because we may need to go deeper...
							Eden.DB.getDirectory(path, callback);
						} else {
							callback(root);
						}
					},
					error: function(a){
						//console.error(a);
						Eden.DB.disconnect(true);
					}
				});
				return;
			}
			//callback(undefined);
			//return;
		}

		root = root[comp[i]].children;
	}

	callback(root);
}

Eden.DB.upload = function(path, meta, source, tagname, ispublic, callback) {
	if (meta === undefined) {
		console.error("Attempting to upload agent without meta data: " + path);
		eden.error("Attempting to upload agent without meta data: " + path);
		if (callback) callback(false);
		return

	}

	if (Eden.DB.isConnected()) {
		$.ajax({
			url: this.remoteURL+"/agent/add",
			type: "post",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			data:{	path: path,
					parentSaveID: (meta.saveID == "origin") ? undefined : meta.saveID,
					title: meta.title,
					source: source,
					tag: tagname,
					permission: (ispublic) ? "public" : undefined
			},
			success: function(data){
				if (data == null || data.error) {
					console.error(data);
					eden.error((data) ? data.description : "No response from server");
					if (callback) callback(false);
				} else {
					meta.updateVersion(data.saveID, data.tag, meta.title, meta.name);
					if (callback) callback(true);
				}
			},
			error: function(a){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
				if (callback) callback(false);
			}
		});
	} else {
		console.error("Cannot upload, not connected to server");
		if (callback) callback(false);
		eden.error("Cannot upload "+path+", not connected to server");
	}
}

Eden.DB.createMeta = function(path) {
	Eden.DB.meta[path] = new Eden.DB.Meta();
	return Eden.DB.meta[path];
}

Eden.DB.getVersions = function(path, callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/agent/versions?path="+path,
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				//console.log(data);
				// TODO Process this version data to update defaults?
				callback(data);
			},
			error: function(a){
				//console.error(a);
				Eden.DB.disconnect(true);
			}
		});
	} else {
		callback(undefined);
	}
}



/**
 * Find agent meta data which is a combination of information from all sources.
 */
Eden.DB.getMeta = function(path, callback) {	
	Eden.DB.getDirectory(path, function(p) {
		callback(path, Eden.DB.meta[path]);
	});
}

Eden.DB.getSource = function(path, tag, callback) {
	// Need to find out where to look
	Eden.DB.getMeta(path, function(path, meta) {
		if (meta === undefined) {
			callback(undefined, "No such agent");
			return;
		}

		if (tag == "origin") {
			meta.saveID = "origin";
			callback("");
			return;
		}

		// Go to remote first if connected, overrides any local versions
		if (meta.remote && Eden.DB.isConnected()) {
			var tagvalue;

			// Select correct version if virtual tags are used.
			if (tag === undefined || tag == "default" || tag == "") {
				if (meta.defaultID >= 0) {
					tagvalue = "&version="+meta.defaultID;
				} else if (meta.latestID >= 0) {
					tagvalue = "&version="+meta.latestID;
				} else if (meta.saveID == "origin") {
					callback("");
					return;
				} else if (meta.saveID >= 0) {
					tagvalue = "&version="+meta.saveID;
				} else {
					callback("");
					return;
				}
			} else if (tag == "latest") {
				if (meta.latestID >= 0) {
					tagvalue = "&version="+meta.latestID;
				} else {
					callback("");
					return;
				}
			} else if (typeof tag == "string") {
				tagvalue = "&tag="+tag;
			} else {
				tagvalue = "&version="+tag;
			}

			$.ajax({
				url: Eden.DB.remoteURL+"/agent/get?path="+path+tagvalue,
				type: "get",
				crossDomain: true,
				xhrFields:{
					withCredentials: true
				},
				success: function(data){
					if (data == null || data.error) {
						callback(undefined, "No such version");
						console.error("No such version");
						//console.log(data);
					} else {			
						meta.updateVersion(data.saveID, data.tag, data.title, data.name);	
						callback(data.source);
					}
				},
				error: function(a){
					//console.error(a);
					Eden.DB.disconnect(true);
				}
			});
		// There is a version stored in a file somewhere
		} else if (meta.file) {
			$.get(meta.file, function(data) {
				meta.updateVersion("origin", "default", meta.title, meta.name);
				callback(data);
			}, "text");
		} else {
			// Assume it must be local only.
			meta.saveID = "origin";
			callback("");
		}
	});
}

Eden.DB.loadLocalMeta();

// Start connection attempts.
Eden.DB.connect(Eden.DB.repositories[Eden.DB.repoindex]);
Eden.DB.repoindex = (Eden.DB.repoindex + 1) % Eden.DB.repositories.length;


