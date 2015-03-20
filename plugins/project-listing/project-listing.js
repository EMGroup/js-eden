/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Project Listing Plugin.
 * A plugin to display a list of models hosted on the server. The list can
 * either be displayed in a dialog using createProjectList or be displayed
 * in an existing div element using embedProjectList. It includes a search box
 * to allow searching of the projects available.
 * @class ProjectList Plugin
 */

 
EdenUI.plugins.ProjectList = function(edenUI, success) {

	var me = this;

	/** @public */
	this.instances = new Array();

	/**
	 * Update all project list views. Used when the projects.json file gets
	 * loaded to make sure projects are being listed correctly.
	 * TODO: The search input of each view gets ignored.
	 * @private
	 */
	var updateAllCollections = function(pattern) {
		for (x in me.instances) {
			updateCollection(me.instances[x],pattern);
		}
	}

	/**
	 * Update a particular project list with the specified search expression.
	 * This gets called whenever the search input gets changed. It clears the
	 * existing project list and generates new results matching the pattern.
	 * @private
	 */
	var updateCollection = function(element,pattern) {
		procspos = 0;

		//Clear any existing project search results.
		var projresults = $(element).find(".projectlist-results");
		projresults.html('');

		//Search through projects to find those matching the query.
		var reg = new RegExp("^"+pattern+".*");
		var i = 0;

		if (me.projects === undefined) {
			return;
		}

		while (me.projects.projects[i] !== undefined) {
			//If not a match then skip to next project
			if (me.projects.projects[i].name.search(reg) == -1) { i = i + 1; continue; }

			//Generate the html element for the project
			var proj = $('<div class="projectlist-result-element"></div>');
			//Optimise by putting project details into html element.
			proj[0].project = me.projects.projects[i];

			proj.html(
				"<li class=\"type-project\"><div class=\"projectlist-result_name\">"
				+ me.projects.projects[i].name
				+ "</div><div class='projectlist-result_value'>"
				+ me.projects.projects[i].description
				+ "</div><div class='projectlist-result_value'> by "
				+ me.projects.projects[i].author
				+ " ("
				+ me.projects.projects[i].year
				+ ")</div></li>"
			).appendTo(projresults);

			i = i + 1;
		}

		//Now add animations to each project result
		projresults.find(".projectlist-result-element").hover(
			function() {
				if (this != me.selected_project) {
					$(this).animate({backgroundColor: "#f2f2f2"}, 100);
				}
			}, function() {
				if (this != me.selected_project) {
					$(this).animate({backgroundColor: "#eaeaea"}, 100);
				}
			}	

		//Also add mouse click functionality (load the project).
		).click(function () {
			if (me.selected_project != null) {
				$(me.selected_project).animate({backgroundColor: "white"}, 100);
			}
			me.selected_project = this;
			$(this).animate({backgroundColor: "#dbe5f1"}, 100);

			if (this.project !== undefined) {
				// Actually load the project by executing js-e file.
				edenUI.eden.include(this.project.runfile);
			}
		});
	}

	/**
	 * Generate the base HTML structure of a project list dialog.
	 * @private
	 */
	var generateHTML = function() {
		return "\
<div class=\"projectlist-listing\">\
	<div class=\"projectlist-results\"></div>\
</div>";
	}

	/** @public */
	this.createDialog = function(name,mtitle) {
		code_entry = $('<div></div>');
		code_entry.html(generateHTML());

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 310,
				height: 400,
				minHeight: 120,
				minWidth: 230
			});

		me.instances.push(code_entry[0]);
		updateCollection(code_entry[0], "");
		//The -1 is stop Chrome from displaying scrollbars on start up.
		return {position: ['right', 'bottom-1']};
	};

	//Get a list of projects from the server.
	$.ajax({
		url: "models/projects.json",
		dataType: 'json',
		success: function(data) {
			me.projects = data;
			edenUI.projects = me.projects;
			updateAllCollections("");
		},
		cache: false,
		async: true
	});

	//Add views supported by this plugin.
	edenUI.views["ProjectList"] = {dialog: this.createDialog, title: "Project List", category: edenUI.viewCategories.interpretation};
	success();
};

/* Plugin meta information */
EdenUI.plugins.ProjectList.title = "Project List";
EdenUI.plugins.ProjectList.description = "Displays a list of construals.";
