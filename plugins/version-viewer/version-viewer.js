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
EdenUI.plugins.VersionViewer = function (edenUI, success) {
	var me = this;

	/**
	 * Array of VersionViewer instances
	 * @see VersionViewer
	 */
	this.instances = [];
	var numInstances = 0;

	var generateHTML = function (viewName, viewType) {
		var html = "<table class=\"version-viewer-list\"></table>";
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
		var content = $('<div class="versionviewer-outer"></div>');
		content.html(generateHTML(name, type));

		$dialog = $('<div id="' + name + '"></div>')
			.append(content)
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
				classes: {"ui-dialog": "versionviewer-dialog ui-front"}
			});

//		me.instances.push(symbollist);

		var searchStrSym = root.lookup("view_" + edenName + "_search_string");
		
		var updateVersionList = function(){
			var loadNum = URLUtil.getParameterByName("load");
			$.get(Eden.DB.remoteURL + "/project/versions",{projectID: loadNum},function(data){
				console.log(data);
				debugger;
				var listTable = content.find(".version-viewer-list").html("");
				var row = $("<tr><th>Vid</th><th>Date</th><th>ParentDiff</th></tr>");
				listTable.append(row);
				
				$(data).each(function(i,v){
					var row = $("<tr><td><a href=\"?load="+ loadNum + "&vid=" +v.saveID + "\">" + v.saveID + "</td><td>" + v.date + "</td><td>"+ v.parentDiff+"</td></tr>");
					listTable.append(row);
				});
				
			});
		};
		
		updateVersionList();
		
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
		return viewData;
	};

	/**
	 * Construct a dialog showing all symbols.
	 *
	 * @param {string} name Unique dialog name.
	 * @param {string} mtitle Title for the dialog.
	 */
	this.createVersionListDialog = function (name, mtitle) {
		return me.createDialog(name,mtitle,"all");
	};


	this.isCreationPending = function (name) {
		return name in symbol_create_queue;
	}

	// Add views supported by this plugin.
	edenUI.views["VersionList"] = {dialog: this.createVersionListDialog, title: "Version List", category: edenUI.viewCategories.comprehension, menuPriority: 1};

	//$(document).tooltip();
	eden.root.lookup("plugins_VersionViewer_loaded").assign(true, eden.root.scope);
	success();
};

/* Plugin meta information */
EdenUI.plugins.VersionViewer.title = "Version Viewer";
EdenUI.plugins.VersionViewer.description = "Show version details for a specified project.";

EdenUI.plugins.VersionViewer.inlineEditorSymbol = undefined;
