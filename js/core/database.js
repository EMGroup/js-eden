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
	searchServer: "http://jseden.dcs.warwick.ac.uk",
	querycache: null,
	qcacheloaded: false,
	qcachetimeout: undefined
}

Eden.DB.storageSpace = function() {
	var _lsTotal=0,_xLen,_x;
	for(_x in localStorage){
		_xLen= ((localStorage[_x].length + _x.length)* 2);
		_lsTotal+=_xLen;
	}
	return _lsTotal;
}

console.log("Local Usage:",""+(Eden.DB.storageSpace()/1024/1024) + "Mb");

if (Eden.DB.storageSpace() > 4*1024*1024) {
	console.log("WARNING - CLEARING LOCAL STORAGE");
	for (var x in window.localStorage) {
		delete window.localStorage[x];
	}
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
				Eden.DB.emit("logout", []);
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
		if (Eden.DB.retrycount < 12) Eden.DB.retrycount++;
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
					//Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
					callback();
				} else {
					Eden.DB.username = data.name;
					Eden.DB.userid = data.id;
					if (data.id && (data.name == "" || !data.name)) Eden.DB.username = "NoName";
					callback(Eden.DB.username);
				}
			},
			error: function(a, status, err){
				//console.error(a);
				//eden.error(a);
				Eden.DB.disconnect(true);
				//Eden.DB.handleError(a,status,err);
				callback(undefined);
			}
		});
	} else {
		callback();
	}
}

Eden.DB.localSave = function(project) {
	//return;
	if (window.localStorage) {
		var prefix = "project_"+project.id;
		window.localStorage.setItem(prefix+"_project", project.generate());
		window.localStorage.setItem(prefix+"_id", project.id);
		window.localStorage.setItem(prefix+"_vid", project.vid);
		window.localStorage.setItem(prefix+"_author", project.author);
		window.localStorage.setItem(prefix+"_authorid", project.authorid);
		window.localStorage.setItem(prefix+"_name", project.name);
		window.localStorage.setItem(prefix+"_title", project.title);
		window.localStorage.setItem(prefix+"_thumb", project.thumb);
		window.localStorage.setItem(prefix+"_desc", project.desc);
		window.localStorage.setItem(prefix+"_tags", project.tags.join(" "));

		var plist = JSON.parse(window.localStorage.getItem("project_list"));
		if (plist === null) plist = {};
		plist[project.id] = true;
		window.localStorage.setItem("project_list", JSON.stringify(plist));
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
					metadata: JSON.stringify({
						description: project.desc,
						env: project.environment()
					}),
					parentProject: project.parentid
			},
			success: function(data){
				if (data === null || data.error) {
					Eden.DB.localSave(project);
					console.error(data);
					Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
					if (callback) callback(false);
				} else {
					console.log("Saved", data);
					//meta.updateVersion(data.saveID, data.tag, meta.title, meta.name, meta.date);
					project.id = data.projectID;
					project.vid = data.saveID;
					project.readPassword = data.readPassword;
					project.author = Eden.DB.username;
					project.authorid = Eden.DB.userid;
					Eden.DB.localSave(project);
					if (callback) callback(true);
				}
			},
			error: function(a,status,err){
				Eden.DB.localSave(project);
				//console.error(a);
				//eden.error(a);
				Eden.DB.handleError(a,status,err);
				if (callback) callback(false);
			}
		});
	} else {
		Eden.DB.localSave(project);
		console.error("Cannot upload, not connected to server. Local save only.");
		if (callback) callback(false);
		eden.error("Cannot upload "+path+", not connected to server. Local save only");
	}
}

Eden.DB.getVersions = function(pid, callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/project/versions?projectID="+pid,
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


Eden.DB.loadLocal = function(id) {
	if (window.localStorage) {
		var prefix = "project_"+id;
		var src = window.localStorage.getItem(prefix+"_project");
		var id = window.localStorage.getItem(prefix+"_id");
		if (id == "undefined") id = undefined;
		var vid = window.localStorage.getItem(prefix+"_vid");
		if (vid == "undefined") vid = undefined;
		var author = window.localStorage.getItem(prefix+"_author");
		if (author == "undefined") author = undefined;
		var authorid = window.localStorage.getItem(prefix+"_authorid");
		var name = window.localStorage.getItem(prefix+"_name");
		var tags = window.localStorage.getItem(prefix+"_tags");
		var thumb = window.localStorage.getItem(prefix+"_thumb");
		if (thumb == "undefined") thumb = undefined;
		var desc = window.localStorage.getItem(prefix+"_desc");
		var title = window.localStorage.getItem(prefix+"_title");
		if (src && src != "") {
			return {
				source: src,
				saveID: vid,
				title: title,
				ownername: author,
				owner: authorid,
				image: thumb,
				tags: tags,
				parentProject: null,
				minimisedTitle: name,
				projectMetaData: JSON.stringify({"description": desc})
			};
		}
	}
}


Eden.DB.hasLocal = function(pid, vid) {
	var plist = JSON.parse(window.localStorage.getItem("project_list"));
	if (plist !== null && plist[pid]) {
		if (!vid) return true;
		var prefix = "project_"+pid;
		var lvid = window.localStorage.getItem(prefix+"_vid");
		console.log("Load local",lvid, vid);
		lvid = parseInt(lvid);
		return (lvid >= vid);
	}
	return false;
}


function removeActive(src) {
	var ix = src.indexOf("action ACTIVE {");
	var count = 1;

	var i = ix+16;
	for (; i<src.length; i++) {
		var ch = src.charAt(i);
		if (ch == "{") count++;
		else if (ch == "}") count--;
		if (count == 0) break;
	}

	return src.substring(0,ix) + src.substring(i);
}


Eden.DB.load = function(pid, vid, readPassword, callback) {
	if(arguments.length == 3){
		callback = readPassword;
		readPassword = undefined;
	}

	if (Eden.DB.isConnected()) {
		$.ajax({
			url: Eden.DB.remoteURL+"/project/get?projectID="+pid+ ((vid) ? "&to="+vid : "") + ((readPassword) ? "&readPassword="+readPassword : ""),
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
					Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				} else {
					if (eden.root.lookup("jseden_autosave").value() && Eden.DB.hasLocal(pid,data.saveID)) {
						console.log("Yes, load local");
						var ldata = Eden.DB.loadLocal(pid);

						if (removeActive(ldata.source) != removeActive(data.source)) {
							var r = window.confirm("You have local changes, restore these?");
							if (r) callback(ldata);
							else callback(data);
						} else {
							callback(data);
						}
					} else {
						callback(data);
					}
				}
			},
			error: function(a,status,err){
				//console.error(a);
				Eden.DB.handleError(a,status,err);
				callback(undefined, "Disconnected");
			}
		});
	} else if (callback) {
		if (eden.root.lookup("jseden_autosave").value() && Eden.DB.hasLocal(pid,vid)) {
			var r = window.confirm("You have local changes, restore these?");
			if (r) callback(Eden.DB.loadLocal(pid));
			else callback(undefined, "Disconnected");
		} else {
			callback(undefined, "Disconnected");
		}
	}
}

Eden.DB.search = function(q, pagenum, pagecount, sortby, callback) {
	var path = this.remoteURL+"/project/";
	if (q == "") path += "search?limit="+pagecount+"&offset="+((pagenum-1)*pagecount);
	else path += "search?limit="+pagecount+"&offset="+((pagenum-1)*pagecount)+"&query="+encodeURIComponent(q);

	if (sortby) path += "&by="+sortby;

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
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				callback(undefined);
				return;
			} else if (data) {
				callback(data);
				return;
			} else {
				callback(undefined);
			}
		},
		error: function(a,status,err){
			//console.error(a);
			Eden.DB.handleError(a,status,err);
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
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				callback(undefined);
				return;
			} else if (data) {
				callback(data);
				return;
			} else {
				callback(undefined);
			}
		},
		error: function(a,status,err){
			//console.error(a);
			Eden.DB.handleError(a,status,err);
		}
	});
}

Eden.DB.remove = function(projectid, callback) {
	$.ajax({
		url: this.remoteURL+"/project/remove",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{	projectID: projectid
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				if (callback) callback(false);
			} else {
				console.log("Removed", data);
				//meta.updateVersion(data.saveID, data.tag, meta.title, meta.name, meta.date);
				//project.id = data.projectID;
				//project.vid = data.saveID;
				if (callback) callback(true);
			}
		},
		error: function(a,status,err){
			//console.error(a);
			//eden.error(a);
			Eden.DB.handleError(a,status,err);
			if (callback) callback(false);
		}
	});
}

Eden.DB.rate = function(projectid, stars) {
	$.ajax({
		url: this.remoteURL+"/project/rate",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{	projectID: projectid,
				stars: stars
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				//if (callback) callback(false);
			} else {
				
			}
		},
		error: function(a,status,err){
			//console.error(a);
			//eden.error(a);
			Eden.DB.handleError(a,status,err);
			//if (callback) callback(false);
		}
	});
}

Eden.DB.searchSelector = function(q, kind, callback) {
	if (Eden.DB.isConnected()) {
		$.ajax({
			url: this.remoteURL+"/code/search?selector="+q.replace("#","%23")+"&outtype="+kind,
			type: "get",
			crossDomain: true,
			xhrFields:{
				withCredentials: true
			},
			success: function(data){
				if (data === null || data.error) {
					Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
					callback([]);			
				} if (data) {
					if (!Eden.DB.qcacheloaded) {
						Eden.DB.querycache = JSON.parse(window.localStorage.getItem("query_cache"));
						Eden.DB.qcacheloaded = true;
						if (Eden.DB.querycache === null) Eden.DB.querycache = {};
					}
					Eden.DB.querycache[q] = data;
					Eden.DB.requestQCacheSave();
					callback(data);
					return;
				} else {
					callback([]);
				}
			},
			error: function(a,status,err){
				//console.error(a);
				callback([]);
				Eden.DB.handleError(a,status,err);
				//Eden.DB.disconnect(true);
			}
		});
	} else {
		console.log("ATTEMPT CACHE",q);
		if (!Eden.DB.qcacheloaded) {
			Eden.DB.querycache = JSON.parse(window.localStorage.getItem("query_cache"));
			Eden.DB.qcacheloaded = true;
			if (Eden.DB.querycache === null) Eden.DB.querycache = {};
		}
		var cent = Eden.DB.querycache[q];
		callback((cent) ? cent : []);
	}
}

Eden.DB.requestQCacheSave = function() {
	if (Eden.DB.qcachetimeout) {
		return;
	}
	Eden.DB.qcachetimeout = setTimeout(function() {
		window.localStorage.setItem("query_cache", JSON.stringify(Eden.DB.querycache));
		Eden.DB.qcachetimeout = undefined;
	}, 2000);
}

Eden.DB.postComment = function(project, text, priv) {
	//if (!project) return;
	var pid = (project) ? project.id : -1;
	var vid = (project) ? project.vid : -1;
	if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/comment/post",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{	projectID: pid,
				versionID: vid,
				publiclyVisible: (priv) ? 0 : 1,
				comment: text
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				//if (callback) callback(false);
			} else {
				
			}
		},
		error: function(a,status,err){
			//console.error(a);
			//eden.error(a);
			Eden.DB.handleError(a,status,err);
			//if (callback) callback(false);
		}
	});
}

var waitingforcomment = false;

Eden.DB.searchComments = function(project, q, page, count, last, cb) {
	//if (!project) return;
	if (waitingforcomment) {
		cb();
		return;
	}

	var pid = (project) ? project.id : -1;
	//if (cb) cb(dummycomments);
	if (Eden.DB.isConnected()) {
	waitingforcomment = true;
	$.ajax({
		url: this.remoteURL+"/comment/search?projectID="+pid+((last) ? "&newerThan="+last : "")+"&offset="+((page-1) * count)+"&limit="+count,
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			waitingforcomment = false;
			if (data) {
				cb(data);
				return;
			} else {
				cb([]);
			}
		},
		error: function(a,status,err){
			waitingforcomment = false;
			//console.error(a);
			cb();
			Eden.DB.handleError(a,status,err);
			//Eden.DB.disconnect(true);
		}
	});
	}
}

Eden.DB.removeComment = function(commentid) {
	if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/comment/delete",
		type: "post",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		data:{	commentID: commentid },
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				//if (callback) callback(false);
			} else {
				
			}
		},
		error: function(a,status,err){
			//console.error(a);
			//eden.error(a);
			Eden.DB.handleError(a,status,err);
			//if (callback) callback(false);
		}
	});
}

Eden.DB.follow = function(pid, cb) {
	if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/social/followproject?projectID="+pid,
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				if (cb) cb(false);
			} else {
				if (cb) cb(true);
			}
		},
		error: function(a,status,err){
			Eden.DB.handleError(a,status,err);
			if (cb) cb(false);
		}
	});
}

//----- ADMIN ------

Eden.DB.adminCommentActivity = function(newerthan, offset, cb) {
	if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/comment/activity?limit=10&offset="+offset+((newerthan) ? "&newerThan="+newerthan : ""),
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				if (cb) cb(false);
			} else {
				if (cb) cb(data);
			}
		},
		error: function(a, status, err){
			Eden.DB.handleError(a,status,err);
			if (cb) cb(false);
		}
	});
}

Eden.DB.handleError = function(a, status, err) {
	console.log("DB ERROR",status,err);
	if (status == "error" && !err) {
		Eden.DB.disconnect(true);
		Eden.DB.emit("error", ["Not connected to construal cloud"]);
	} else if (status == "error") {
		Eden.DB.emit("error", [err]);
	} else if (status == "timeout") {
		Eden.DB.emit("error", ["Network timeout"]);
		Eden.disconnect(true);
	} else {
		Eden.DB.emit("error", "Unknown network error");
		Eden.disconnect(true);
	}
}

Eden.DB.adminProjectActivity = function(newerthan, offset, cb) {
	if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/project/activity?limit=30&offset="+offset+((newerthan) ? "&newerThan="+newerthan : ""),
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				if (cb) cb(false);
			} else {
				if (cb) cb(data);
			}
		},
		error: function(a,status,err){
			//console.log("DB Error",a,status,err);
			//Eden.DB.disconnect(true);
			Eden.DB.handleError(a,status,err);
			if (cb) cb(false);
		}
	});
}


Eden.DB.getPopularTags = function(tag, cb) {
	//if (!Eden.DB.isLoggedIn()) return;
	$.ajax({
		url: this.remoteURL+"/project/tags?tag="+tag,
		type: "get",
		crossDomain: true,
		xhrFields:{
			withCredentials: true
		},
		success: function(data){
			if (data === null || data.error) {
				console.error(data);
				Eden.DB.emit("error", [(data) ? data.description : "No response from server"]);
				if (cb) cb(false);
			} else {
				if (cb) cb(data);
			}
		},
		error: function(a,status,err){
			//console.log("DB Error",a,status,err);
			//Eden.DB.disconnect(true);
			Eden.DB.handleError(a,status,err);
			if (cb) cb(false);
		}
	});
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var browserID = window.localStorage["construit_uid"];
if (browserID === null || browserID === undefined || browserID == "") {
	browserID = guid();
	window.localStorage.setItem("construit_uid", browserID);
}
var sessionID = guid();

Eden.DB.log = function(action, details) {
	console.log("LOG", browserID, (Eden.DB.userid) ? Eden.DB.userid : -1, action, details);

	$.ajax({
		url: this.searchServer+"/jsedenlog/jsedenlog",
		type: "post",
		data:{	browserID: browserID,
				sessionID: sessionID,
				userID: Eden.DB.userid,
				action: action,
				details: details
		}
	});
}


