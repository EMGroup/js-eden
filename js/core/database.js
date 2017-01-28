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
	userid: undefined,
	// Note: reverse order, last is popped off to try first
	repositories: [
		"http://jseden.dcs.warwick.ac.uk/construalmanager",
		"http://localhost:18882"
	],
	repoindex: 0,
	retrycount: 0,
	connected: false,
	searchServer: "http://jseden.dcs.warwick.ac.uk"
}

Eden.DB.listeners = {};
Eden.DB.emit = emit;
Eden.DB.listenTo = listenTo;

Eden.DB.isConnecting = function() {
	return Eden.DB.remoteURL !== undefined;
}

Eden.DB.isConnected = function() {
	return Eden.DB.connected;
}

Eden.DB.isLoggedIn = function() {
	return Eden.DB.username !== undefined;
}

Eden.DB.logOut = function(cb) {
	if (Eden.DB.isLoggedIn()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/logout",
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				Eden.DB.username = undefined;
				if (cb) cb();

				function loginLoop() {
					if (Eden.DB.isConnected() && Eden.DB.username === undefined) {
						setTimeout(function() {
							Eden.DB.getLoginName(function(name) {
								if (name) {
									Eden.DB.emit("login", [name]);
									eden.root.lookup("jseden_pm_user").assign(name, eden.root.scope, Symbol.localJSAgent);
								} else {
									loginLoop();
								}
							})
						}, 5000);
					}
				}
				loginLoop();
			},
			error: function(a){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
			}
		});
	}
}

Eden.DB.connect = function(url, callback) {
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

	// Make sure whole directory is reloaded every 20 seconds (if needed).
	Eden.DB.refreshint = setInterval(function() {
		for (var a in Eden.DB.directory) {
			Eden.DB.directory[a].missing = true;
		}
	}, 20000);

	function loginSlowPoll() {
		if (Eden.DB.isConnected()) {
			setTimeout(function() {
				Eden.DB.getLoginName(function(name) {
					if (name) {
						loginSlowPoll();
					} else {
						Eden.DB.disconnect();
					}
				})
			}, 60000*5);
		}
	}

	function loginLoop() {
		if (Eden.DB.isConnected() && Eden.DB.username === undefined) {
			setTimeout(function() {
				Eden.DB.getLoginName(function(name) {
					if (name) {
						Eden.DB.emit("login", [name]);
						eden.root.lookup("jseden_pm_user").assign(name, eden.root.scope, Symbol.localJSAgent);
						loginSlowPoll();
					} else {
						loginLoop();
					}
				})
			}, 5000);
		}
	}

	Eden.DB.getLoginName(function(name) {
		// Reset retrys on success
		if (Eden.DB.isConnected()) {
			Eden.DB.retrycount = 0;
			//Eden.DB.loadDatabaseRoot(function() {
				// Only callback once the root directory is loaded
				// used in init to then load imports...
				if (callback) callback(Eden.DB.isConnected());
			//});
			Eden.DB.emit("connected", [url]);
			eden.root.lookup("jseden_pm_connected").assign(true, eden.root.scope, Symbol.localJSAgent);

			if (name) {
				Eden.DB.emit("login", [name]);
				eden.root.lookup("jseden_pm_user").assign(name, eden.root.scope, Symbol.localJSAgent);
			} else {
				loginLoop();
			}
		} else if (callback) callback(Eden.DB.isConnected());
	});
}

Eden.DB.disconnect = function(retry) {
	Eden.DB.remoteURL = undefined;
	if (Eden.DB.connected) {
		Eden.DB.emit("disconnected", []);
		eden.root.lookup("jseden_pm_connected").assign(false, eden.root.scope, Symbol.localJSAgent);
	}
	Eden.DB.connected = false;

	if (Eden.DB.refreshint) {
		clearInterval(Eden.DB.refreshint);
		Eden.DB.refreshint = undefined;
	}

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
	if (Eden.DB.isConnecting()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/user/details",
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				Eden.DB.connected = true;
				if (data == null || data.error) {
					Eden.DB.username = undefined;
					callback();
				} else {
					Eden.DB.username = data.name;
					Eden.DB.userid = data.id;
					if (data.id && (data.name == "" || !data.name)) Eden.DB.username = "NoName";
					callback(Eden.DB.username);
				}
			},
			error: function(a){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
				callback(undefined);
			}
		});
	} else {
		callback();
	}
}

Eden.DB.save = function(project, ispublic, callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: this.remoteURL+"/project/add",
			type: "post",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			data:{	projectID: project.id,
					title: project.title,
					source: project.generate(),
					tags: project.tags.join(" "),
					minimisedTitle: project.name,
					from: project.vid,
					image: project.thumb,
					listed: ispublic,
					metadata: JSON.stringify({description: project.desc}),
					parentProject: project.parentid
			},
			success: function(data){
				if (data === null || data.error) {
					console.error(data);
					eden.error((data) ? data.description : "No response from server");
					if (callback) callback(false);
				} else {
					console.log("Saved", data);
					//meta.updateVersion(data.saveID, data.tag, meta.title, meta.name, meta.date);
					project.id = data.projectID;
					project.vid = data.saveID;
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


Eden.DB.load = function(pid, vid, callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/project/get?projectID="+pid+ ((vid) ? "&to="+vid : ""),
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				if (data == null || data.error) {
					callback(undefined, "No such version");
					console.error("No such version " + vid + " for " + pid);
					console.log(data);
				} else {
					callback(data);
				}
			},
			error: function(a){
				//console.error(a);
				Eden.DB.disconnect(true);
				callback(undefined, "Disconnected");
			}
		});
	} else if (callback) callback(undefined, "Disconnected");
}

Eden.DB.search = function(q, callback) {
	var path = this.remoteURL+"/project/";
	if (q == "") path += "search?limit=20";
	else path += "search?limit=20&query="+encodeURIComponent(q);

	//console.log("PATH",path)

	$.ajax({
		url: path,
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
				callback(data);
				return;
			} else {
				callback(undefined);
			}
		},
		error: function(a){
			//console.error(a);
			Eden.DB.disconnect(true);
			callback(undefined);
		}
	});
}

Eden.DB.getMeta = function(id, callback) {
	var path = this.remoteURL+"/project/";
	path += "search?limit=20&query=.id("+id+")";

	$.ajax({
		url: path,
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
				callback(data);
				return;
			} else {
				callback(undefined);
			}
		},
		error: function(a){
			//console.error(a);
			Eden.DB.disconnect(true);
		}
	});
}

Eden.DB.searchSelector = function(q, kind, callback) {
	$.ajax({
		url: this.remoteURL+"/code/search?selector="+q.replace("#","%23")+"&outtype="+kind,
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			if (data) {
				callback(data);
				return;
			} else {
				callback([]);
			}
		},
		error: function(a){
			//console.error(a);
			callback([]);
			//Eden.DB.disconnect(true);
		}
	});
}


