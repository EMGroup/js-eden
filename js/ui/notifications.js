EdenUI.Notifications = function(element, jewel) {
	var me = this;
	this.notificationCount = 0;
	this.notificationCountElement = jewel;
	this.notificationCountElement.hide();
	this.notificationPanel = element;
	this.notificationPanel.html(
			'<button class="control-button close-button control-enabled">&#xf00d;</button><button class="control-button clear-button control-enabled">&#xf05e;</button><div id="errors-dialog"></div>'
		);
	this.notificationPanel.on('click','.close-button',function() {
		me.notificationPanel.hide();
	})
	.on('click','.clear-button',function() {
		me.notificationPanel.find("#errors-dialog").html("");
	});
	this.notificationPanel.hide();
	this.notificationContent = this.notificationPanel.find("#errors-dialog");

	////////////////////////////////////////////////////////////////////////////

	Eden.Peer.listenTo("user", undefined, function(id,username) {
		me.notification("net", $('<div class="notification-content">User \'<a href="javascript:eden.peer.showConnection(\''+id+'\');">'+username+'</a>\' connected to you.<br/><a href="javascript: eden.peer.requestShare(\''+id+'\');">Watch</a> <a href="javascript: eden.peer.requestObserve(\''+id+'\');">Broadcast</a> <a href="javascript: eden.peer.requestCollaborate(\''+id+'\');">Collaborate</a></div>'));
	});

	Eden.Peer.listenTo("share", undefined, function(id,username) {
		me.notification("net", $('<div class="notification-content">Your model is being shared...</div>'));
	});

	Eden.Peer.listenTo("disconnect", undefined, function(id,username) {
		if (username) {
			me.notification("net", $('<div class="notification-content">User \''+username+'\' disconnected.</div>'));
		} else {
			me.notification("net", $('<div class="notification-content">P2P User disconnected.</div>'));
		}
	});

	Eden.Peer.listenTo("quickp2p",undefined,function(url){
		let fullmsg = '<div class="notification-content">P2P Connection created - connect to this session with this link: <a target="_blank" href="'+url+'">'+url+'</a></div>';
		me.notification("net", $(fullmsg));
	});

	Eden.Peer.listenTo("error", undefined, function(err) {
		me.notification("error", $('<div class="notification-content">P2P: '+err+'</div>'));
	});


	function errhandler(agent,err) {
		if (err) {
			var msg = ((err.type == "runtime")?"Runtime error" : "Syntax error") + " in " + agent.name + ":" + ((err.line && err.line != -1)?err.line:"") + " -> " + err.messageText();
			var htmlmsg = "<a href=\"javascript:Eden.Selectors.goto('.id(" + agent.id + ")');\">" + agent.name + ":" + ((err.line && err.line != -1)?(err.line+1):"") + "</a> " + err.messageText();

			if (!(agent.owned && err.type == "syntax")) {
				console.error(msg);

				//edenUI.showMessage("error", htmlmsg);
				var formattedError = $("<pre class=\"error-item\">"+
					htmlmsg +
					"</pre>\n\n");
				formattedError.on('click', function() {
					var details = "";
					if (err.statement && (err.statement.type == "definition" || err.statement.type == "assignment")) {
						details += "    <b>Symbol:</b> " + err.statement.lvalue.name + "\n";
					}
					if (err.lastsymbol) {
						details += "    <b>Related Symbol:</b> " + err.lastsymbol + "\n";
					}
					if (String(err.extra).search("SyntaxError") >= 0) {
						details += "    <b>JavaScript:</b> " + err.javascriptSource() + "\n";
						formattedError.html(htmlmsg + "\n" + details);
					} else {
						details += "    <b>Source:</b> <div class='error-source'</div>\n";
						formattedError.html(htmlmsg + "\n" + details);
						if (err.statement) {
							var ast = new Eden.AST(err.edenSource(), undefined, agent);
							var hl = new EdenUI.Highlight(formattedError.find(".error-source").get(0));
							hl.highlight(ast, -1, -1);
						}
					}
					//formattedError.html(htmlmsg + "\n\t" + details);
				});

				me.notification("error", formattedError);
			}
		}
	}

	eden.listenTo("error", undefined, errhandler);

	if (Eden.Fragment) {
		Eden.Fragment.listenTo("error", undefined, errhandler);

		Eden.Fragment.listenTo("warning", undefined, function(agent,err) {
			if (err) {
				var msg = ((err.type == "runtime")?"Runtime warning" : "Syntax warning") + " in " + agent.name + ":" + ((err.line != -1)?err.line:"") + " -> " + err.messageText();
				var htmlmsg = "<a href=\"javascript:edenUI.gotoCode('" + agent.name + "',"+err.line+");\">" + agent.name + ":" + ((err.line != -1)?(err.line+1):"") + "</a> " + err.messageText();

				if (!(agent.owned && err.type == "syntax")) {
					//console.error(msg);

					//edenUI.showMessage("error", htmlmsg);
					var formattedError = $("<pre class=\"error-item\">"+
						htmlmsg +
						"</pre>\n\n");
					formattedError.on('click', function() {
						var details = "";
						if (err.statement && (err.statement.type == "definition" || err.statement.type == "assignment")) {
							details += "    <b>Symbol:</b> " + err.statement.lvalue.name + "\n";
						}
						if (err.lastsymbol) {
							details += "    <b>Related Symbol:</b> " + err.lastsymbol + "\n";
						}
						if (String(err.extra).search("SyntaxError") >= 0) {
							details += "    <b>JavaScript:</b> " + err.javascriptSource() + "\n";
							formattedError.html(htmlmsg + "\n" + details);
						} else {
							details += "    <b>Source:</b> <div class='error-source'</div>\n";
							formattedError.html(htmlmsg + "\n" + details);
							if (err.statement) {
								var ast = new Eden.AST(err.edenSource(), undefined, Symbol.jsAgent);
								var hl = new EdenUI.Highlight(formattedError.find(".error-source").get(0));
								hl.highlight(ast, -1, -1);
							}
						}
						//formattedError.html(htmlmsg + "\n\t" + details);
					});

					me.notification("warning", formattedError);
				}
			}
		});
	}

	Eden.DB.listenTo("disconnected", this, function() {
		me.notification("info", $('<div class="notification-content">Disconnected from project server</div>'));
	});

	Eden.DB.listenTo("error", this, function(msg) {
		me.notification("error", $('<div class="notification-content">'+msg+'</div>'));
	});
}

EdenUI.Notifications.prototype.notification = function(type, content) {
	this.notificationCount++;
	this.notificationCountElement.html(this.notificationCount);
	this.notificationCountElement.show();
	var nc;
	if (type == "error") {
		nc = $('<div class="notification-item error"></div>');
		nc.append($('<div class="notification-icon"><span style="color: red;">&#xf06a;</span></div>'));
	} else {
		var icon;
		var colour = "#777";

		switch(type) {
		case "net"		: icon = "&#xf0c1;"; break;
		case "comment"	: icon = "&#xf075;"; break;
		case "log"		: icon = "&#xf120;"; break;
		case "warning"	: icon = "&#xf071;"; colour = "#f57900"; break;
		case "info"		:
		default			: icon = "&#xf129;"; colour = "#29454B";
		}

		nc = $('<div class="notification-item"></div>');
		nc.append($('<div class="notification-icon"><span style="color: '+colour+'">'+icon+'</span></div>'));
	}

	if (typeof content == "string") {
		nc.append($('<div class="notification-content">'+content+'</div>'));
	} else {
		nc.append(content);
	}
	this.notificationContent.prepend(nc)
	this.notificationContent.prop('scrollTop', 0);
}

EdenUI.Notifications.prototype.clearCount = function() {
	this.notificationCountElement.hide();
	this.notificationCount = 0;
}
