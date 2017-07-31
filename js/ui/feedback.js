EdenUI.Feedback = function() {
	var icon = document.createElement("div");
	icon.className = "feedback-icon noselect";
	icon.innerHTML = "&#xf0e6;";
	icon.title = Language.ui.tooltips.comments;
	document.getElementById("jseden-views").appendChild(icon);

	this.odialog = document.createElement("div");
	this.odialog.className = "feedback-dialog";
	this.odialog.style.display = "none";
	if (mobilecheck()) {
		this.odialog.style.width = "90%";
	}
	document.getElementById("jseden-views").appendChild(this.odialog);

	this.dialog = document.createElement("div");
	this.dialog.className = "feedback-scroller";
	this.odialog.appendChild(this.dialog);

	var title = document.createElement("div");
	title.className = "feedback-title";
	title.innerHTML = `<span class="feedback-icon2">&#xf0e6;</span><span class="feedback-title-text">${Language.ui.comments.comments}</span><span class="feedback-close">&#xf00d;</span>`;
	this.dialog.appendChild(title);

	var visSym = eden.root.lookup("jseden_feedback_visible");
	var widthSym = eden.root.lookup("jseden_feedback_width");
	
	var me = this;
	icon.addEventListener("click", function(e) {
		if (visSym.definition === undefined) {
			visSym.assign(true, eden.root.scope, Symbol.hciAgent);
		}
	});

	var close = title.childNodes[2];
	close.addEventListener("click", function(e) {
		if (visSym.definition === undefined) {
			visSym.assign(false, eden.root.scope, Symbol.hciAgent);
		}
	});

	widthSym.assign(420, eden.root.scope, Symbol.defaultAgent);

	function changeVis(sym, val) {
		if (val) {
			me.odialog.style.display = "initial";
			me.clear();
			me.updateComments("");
			clearInterval(me.interval);
			me.interval = setInterval(function() {
				me.updateComments("");
			},5000);
		} else {
			me.odialog.style.display = "none";
			clearInterval(me.interval);
			var last;
			me.interval = setInterval(function() {
				//me.updateComments("");
				Eden.DB.searchComments(eden.project, "", 1, 10, last, function(data) {
					if (data) {
						if (last === undefined && data.length > 0) {
							last = data[0].commentID;
							return;
						}
						for (var i=0; i<data.length; i++) {
							edenUI.menu.notifications.notification("comment", "New comment by " + data[i].name);
						}
						if (data.length > 0) {
							last = data[0].commentID;
							me.cache = data.concat(me.cache);
						}
					}
				});
			},10000);
			//me.interval = undefined;
		}
	}
	visSym.addJSObserver("feedback", changeVis);
	changeVis(visSym, visSym.value());

	var markdown = new EdenUI.Markdown("");
	var mkele = document.createElement("div");
	mkele.className = "feedback-input";
	mkele.appendChild(markdown.contents);
	var buttons = document.createElement("div");
	buttons.className = "feedback-buttons";
	//buttons.innerHTML = '<button class="script-button">Comment</button>';

	var signinmsg = document.createElement("div");
	signinmsg.textContent = Language.ui.comments.signin;
	signinmsg.style.display = "none";
	signinmsg.className = "feedback-signinmsg";
	this.dialog.appendChild(signinmsg);

	if (!Eden.DB.isLoggedIn()) {
		mkele.style.display = "none";
		buttons.style.display = "none";
		signinmsg.style.display = "block";
	} else {
	}

	this.dialog.appendChild(mkele);
	this.dialog.appendChild(buttons);

	this.results = document.createElement("div");
	this.dialog.appendChild(this.results);

	this.results.addEventListener("click", function(e) {
		if (e.srcElement.className == "feedback-delete") {
			console.log("delete", e.srcElement.getAttribute("data-id"));
			Eden.DB.removeComment(e.srcElement.getAttribute("data-id"));
			me.results.removeChild(e.srcElement.parentNode.parentNode);
		} else if (e.srcElement.className == "eden-hl-play") {
			console.log("PLAY COMMENT", e.srcElement.getAttribute("data-src"));
			eden.execute2(e.srcElement.getAttribute("data-src"));
		}
	});

	var postbut = document.createElement("button");
	postbut.className = "script-button";
	postbut.textContent = "Comment";
	buttons.appendChild(postbut);
	postbut.addEventListener("click", function() {
		//console.log("COMMENT", markdown.intextarea.value);
		Eden.DB.log("postcomment", {pid: (eden.project) ? eden.project.id : -1, content: markdown.intextarea.value});
		Eden.DB.postComment(eden.project, markdown.intextarea.value);
		markdown.setValue("");
		me.updateComments("");
	});

	this.cache = [];

	setInterval(function() { me.updateTimes(); }, 20000);

	Eden.DB.listenTo("login", this, function(name) {
		if (name) {
			mkele.style.display = "block";
			buttons.style.display = "block";
			signinmsg.style.display = "none";
		}
	});
}


EdenUI.Feedback.prototype.clear = function() {
	this.cache = [];
	while (this.results.lastChild) this.results.removeChild(this.results.lastChild);
}

EdenUI.Feedback.prototype.updateTimes = function() {
	for (var i=0; i<this.results.childNodes.length; i++) {
		var node = this.results.childNodes[i].childNodes[0].childNodes[1];
		var date = node.getAttribute("data-date");
		var t = date.split(/[- :]/);
		node.textContent = get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000);
	}
}


EdenUI.Feedback.prototype.updateComments = function(q) {
	var me = this;
	var sdown = new showdown.Converter();

	var last = (this.cache.length>0) ? this.cache[0].commentID : undefined;
	var firstnode = this.results.firstChild;

	Eden.DB.searchComments(eden.project, q, 1, 100, last, function(data) {
		if (data) {
			for (var i=0; i<data.length; i++) {
				var ele = document.createElement("div");
				var heading = document.createElement("div");
				var t = data[i].date.split(/[- :]/);

				heading.className = "feedback-header";
				heading.innerHTML = '<span class="feedback-author">'+data[i].name+'</span><span class="feedback-date" data-date="'+data[i].date+'">'+get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000)+((data[i].author == Eden.DB.userid) ? '</span><span class="feedback-delete" data-id="'+data[i].commentID+'">&#xf00d;</span>' : '');
				ele.appendChild(heading);
				var mk = document.createElement("div");
				mk.style.padding = "0";
				mk.style.marginBottom = "3px";
				mk.className = "markdown";
				ele.appendChild(mk);
				ele.className = "feedback-result" + ((last) ? " newitem" : "");
				//ele.textContent = data[i].comment;
				mk.innerHTML = sdown.makeHtml(data[i].comment);
				if (firstnode) me.results.insertBefore(ele, firstnode);
				else me.results.appendChild(ele);

				$(mk).find("code").each(function(i, block) {
					if (block.parentNode.nodeName == "PRE") {
						block.innerHTML = EdenUI.Highlight.html(block.textContent, false, true);
					}
				});
			}

			me.cache = data.concat(me.cache);
		}
	});
}
