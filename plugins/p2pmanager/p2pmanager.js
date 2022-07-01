/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
var edenfunctions = {};

/**
 * JS-Eden Version Viewer Plugin.
 * Displays the previous version IDs of the selected project
 *
 * @author Jonny Foss
 * @constructor
 * @param context The eden context this plugin is being loaded in to.
 */
EdenUI.plugins.P2PManager = function (edenUI, success) {
	var me = this;

	/**
	 * Array of P2PManager instances
	 * @see P2PManager
	 */
	//TODO: There should probably only be one instance!
	this.instances = [];
	var numInstances = 0;

	var generateHTML = function (viewName, viewType) {
		var html = "<table border=\"1\" style=\"width: 100%\" class=\"p2pmanager-list\"></table>";
		return html;
	};

	/**
	 * Construct a jQuery dialog wrapper for a symbol list instance. Also
	 * constructs the symbol list instance and embeds it into the dialog.
	 *
	 * @param {string} name Identifier for the dialog. Must be globally unique.
	 * @param {string} mtitle Title string for the dialog.
	 * @param {string} Type of symbols to show: obs,agent,func,all.
	 */
	this.createDialog = function (name, mtitle, type) {
		var edenName = name.slice(0, -7);
		var agent = root.lookup("createView");
		var content = $('<div class="P2PManager-outer"></div>');
		content.html(generateHTML(name, type));

		$dialog = $('<div id="' + name + '"></div>')
			.append($('<a class="p2p-gen-url" href="#">Generate P2P URL</a>'))
			.append($('<br><a target="_blank" class="p2p-url">P2P URL</a><br>'))
			.append($('<label for="autoaccept">Automatically Broadcast</label><input type="checkbox" id="autoaccept" name="autoaccept">'))
			// .append($('Password:<input type="text" class="password"><br>'))
			.append(content)
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
				classes: {"ui-dialog": "P2PManager-dialog ui-front"}
			});

			$dialog.on("click",".p2p-gen-url", function(e) {
				if (typeof eden.peer === 'undefined'){
					let newid = "jseden" + Eden.DB.userid + "d" + new Date().getTime().toString(36) + "r"+(Math.random()+1).toString(36).substr(2,5);
					eden.peer = new Eden.Peer(undefined, newid);
					eden.peer.init((Eden.DB.username) ? Eden.DB.username : "Anonymous");
				}
				let url = window.location.href.split("?")[0] + "?master="+eden.peer.id;
				Eden.Peer.emit("quickp2p",[url]);
				
			});

			$dialog.on("click","#autoaccept", function(e) {
				if(e.target.checked){
					eden.root.lookup("jseden_p2p_automode").assign('broadcast',eden.root.scope,EdenSymbol.defaultAgent);
				}else{
					eden.root.lookup("jseden_p2p_automode").assign('none',eden.root.scope,EdenSymbol.defaultAgent);
				}
			});

			$dialog.on("click",".broadcast", function(e) {
				let k = $(e.target).closest("tr").attr("data-key");
				if(eden.peer.connections[k].observe && eden.peer.connections[k].share){
					eden.peer.requestUnShare(k);
				}
				
				if(!eden.peer.connections[k].share){
					eden.peer.requestObserve(k);
				}
			});
			$dialog.on("click",".collaborate", function(e) {
				let k = $(e.target).closest("tr").attr("data-key");
				eden.peer.requestCollaborate(k);
			});
			$dialog.on("click",".remove", function(e) {
				let k = $(e.target).closest("tr").attr("data-key");
				eden.peer.requestUnObserve(k);
			});

			$dialog.on("click",".p2prow button", function(e) {
				$(e.target).closest("tr .active").removeClass("active");
				// $(e.target).addClass("active");
			});

//		me.instances.push(symbollist);

		var searchStrSym = root.lookup("view_" + edenName + "_search_string");
		
		var updateP2PList = function(){
			var loadNum = URLUtil.getParameterByName("load");


			var listTable = content.find(".p2pmanager-list").html("");
			var row = $("<tr><th width=\"25%\">Name</th><th>Status</th><th>Actions</th></tr>");
			listTable.append(row);				
			if(typeof eden.peer === 'undefined') return;
			
			let connections = Object.entries(eden.peer.connections);
			for (const [key, value] of Object.entries(eden.peer.connections)) {
				let name = root.lookup(("jseden_p2p_"+key+"_name").replace(/\-/g, "_")).value();
				let thisObject = eden.peer.connections[key];
				let status = "";

				let broadcastActive = "";
				let collabActive = "";
				let removeActive = "";
				if(thisObject.share && thisObject.observe){
					status = "Collaborating";
					collabActive = " active";
				}else{
					if(thisObject.share){
						status = "Broadcasting";
						broadcastActive = " active";
					}else if(thisObject.observe)
						status = "Watching";
					else
						removeActive = " active";
				}

				let rowstr = "<tr class=\"p2prow\" data-key=\""+key+"\"><td>"+name+'</td><td>'+status+'</td><td style="white-space: nowrap"><button class="broadcast' + broadcastActive + '" type="button">Broadcast</button><button class="collaborate'+collabActive+'" type="button">Collaborate</button><button class="remove'+removeActive+'" type="button">Remove</button></td></tr>';

				row = $(rowstr);
				listTable.append(row);
			}
		};
		
		Eden.Peer.listenTo("peer", undefined, function(){setTimeout(updateP2PList,500)});
		Eden.Peer.listenTo("peerupdate", undefined, function(){setTimeout(updateP2PList,500)});

		updateP2PList();
		
		var viewData = {
			destroy: function () {
				var index = me.instances.indexOf(symbollist);
				me.instances.splice(index, 1);
				numInstances--;
				if (numInstances == 0) {
					// Register event handler for symbol changes.
					edenUI.eden.root.removeGlobal(symbolChanged);
				}
			}
		};

		Eden.Peer.listenTo("quickp2p",undefined,function(url){

			$dialog.find(".p2p-gen-url").hide();
			$dialog.find(".p2p-url").show();
			$dialog.find(".p2p-url").text("P2P URL");
			$dialog.find(".p2p-url").attr("href",url);

			var copyText = document.createElement("input");
			copyText.value = url;
			document.body.appendChild(copyText);
			copyText.select();
			copyText.setSelectionRange(0, 99999);
			navigator.clipboard.writeText(copyText.value);
			document.body.removeChild(copyText);

		});

		return viewData;
	};



	/**
	 * Construct a dialog showing all symbols.
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createP2PManagerDialog = function (name, mtitle) {
		return me.createDialog(name,mtitle,"all");
	};

	// Add views supported by this plugin.
	edenUI.views["P2PManager"] = {dialog: this.createP2PManagerDialog, title: "P2P Manager", category: edenUI.viewCategories.history, menuPriority: 1};

	//$(document).tooltip();
	eden.root.lookup("plugins_P2PManager_loaded").assign(true, eden.root.scope);
	success();
};

/* Plugin meta information */
EdenUI.plugins.P2PManager.title = "Version Viewer";
EdenUI.plugins.P2PManager.description = "Show version details for a specified project.";

EdenUI.plugins.P2PManager.inlineEditorSymbol = undefined;
