/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Project Listing Plugin.
 * A plugin to display a list of models hosted online.
 * TODO Add a search box.
 * @class ProjectList Plugin
 */
EdenUI.plugins.ProjectList = function(edenUI, success) {

	var defaultURL = getParameterByName("projects");

	if (defaultURL == "") {
		//Previously models/projects.json
		defaultURL = "models/construit-c14-teacher-cpd/projects.json";
	}
	
	var instances = new Array();
	
	function ProjectListProjects(element) {
		this.element = element;
		this.json = {projects: []};
	}

	ProjectListProjects.prototype.loadProjectData = function (url) {
		//Get a list of projects from the server.
		var me = this;
		$.ajax({
			url: url,
			dataType: 'json',
			success: function(data) {
				me.json = data;
				me.updateCollection("");
			},
			cache: false,
			async: true
		});
	};
	
	/**
	 * Update a particular project list with the specified search expression.
	 * This gets called whenever the search input gets changed. It clears the
	 * existing project list and generates new results matching the pattern.
	 * @private
	 */
	ProjectListProjects.prototype.updateCollection = function (pattern) {

		//Clear any existing project search results.
		var searchResults = $(this.element).find(".projectlist-results");
		searchResults.html('');
		var emptyProject = $(
			'<div class="projectlist-result-element">' +
				'<div class="projectlist-result-name">New Project</div>' + 
				'<div class="projectlist-result-metadata">An empty work space.</div>' +
				'<div class="projectlist-result-metadata">By JS-EDEN Project Team</div>' +
			'</div>'
		).click(function () {
			edenUI.modalDialog(
				"Reset Work Space",
				"<p>This action will discard the current script. Your work will not be saved.</p>\
				<p>Are you sure you wish to continue?</p>",
				["Reset Work Space"],
				1,
				function (optionNo) {
					if (optionNo == 0) {
						var root = edenUI.eden.root;
						root.lookup("forgetAll").definition(root)("", true, false);
						root.collectGarbage();
					}
				}
			);
		});
		searchResults.append(emptyProject);

		//Search through projects to find those matching the query.
		var re = new RegExp("\\b"+ pattern + "\\b", "i");
		for (var i = 0; i < this.json.projects.length; i++) {
			//If not a match then skip to next project
			if (pattern != "" && !re.test(this.json.projects[i].name) &&
				!re.test(this.json.projects[i].description)
			) {
				continue;
			}

			//Generate the html element for the project
			var proj = $('<div class="projectlist-result-element"></div>');
			//Optimise by putting project details into html element.
			proj[0].project = this.json.projects[i];

			proj.html(
				'<div class="projectlist-result-name">'
				+ this.json.projects[i].name +
				'</div><div class="projectlist-result-metadata">'
				+ this.json.projects[i].description +
				'</div><div class="projectlist-result-metadata">By '
				+ this.json.projects[i].author
				+ ' ('
				+ this.json.projects[i].year
				+ ')</div>'
			).appendTo(searchResults);

		}

		//Also add mouse click functionality to load the project.
		searchResults.find(".projectlist-result-element").click(function () {
			if (this.project !== undefined) {
				// Actually load the project by executing js-e file.
				var url = this.project.runfile;
				var loadSelectedProject = function () {
					$.ajax({
						url: url,
						dataType: "text",
						success: function (data) {
							EdenUI.plugins.ScriptGenerator.loadBaseConstrual(url, data);
							if (edenUI.plugins.ScriptInput) {
								edenUI.plugins.ScriptInput.addHistory('include("' + url + '");');
							}
						}
					});
				};
				if (!edenUI.eden.isInInitialState()) {
					edenUI.modalDialog(
						"Open Project Action",
						"<p>The work space contains an existing construal.</p>\
						<p>You can either abandon the existing construal or choose to merge the project with the existing definitions.</p>\
						<p>Which would you like to do?</p>",
						["Open Project", "Merge"],
						0,
						function (optionNo) {
							if (optionNo == 2) {
								return;
							}
							if (optionNo == 0) {
								var root = edenUI.eden.root;
								root.lookup("forgetAll").definition(root)("", true, false);
								root.collectGarbage();
							}
							loadSelectedProject();
						}
					);
				} else {
					if ("Canvas2D" in edenUI.plugins) {
						eden.execute('createCanvas("picture");', "ProjectList", "", Symbol.hciAgent, noop);
					}
					loadSelectedProject();
				}
			}
		});
	}

	/**
	 * Generate the base HTML structure of a project list dialog.
	 * @private
	 */
	var generateHTML = function() {
		return '\
			<div class="projectlist-listing">\
				<a href="http://www.construit.org/index.php/dissemination/newsletters" target="newsletter" style="text-decoration: none">\
					<div class="projectlist-prologue">\
						<img src="images/email.png" width="16" height="16" style="vertical-align: -20%"/>\
						Newsletter Sign-Up\
					</div>\
				</a>\
				<div class="projectlist-results noselect"></div>\
			</div>';
	}

	/** @public */
	this.createDialog = function(name, mtitle, url) {
		if (url === undefined) {
			url = defaultURL;
		}

		var content = $(generateHTML());
		var dialog = $('<div id="'+name+'"></div>')
		.html(content)
		.dialog({
			title: mtitle,
			width: 310,
			height: 400,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "unpadded-dialog"
		});

		var instance = new ProjectListProjects(content.get(0));
		instance.loadProjectData(url);
		instances.push(instance);
		return {data: instance};
	};

	//Add views supported by this plugin.
	edenUI.views["ProjectList"] = {dialog: this.createDialog, title: "Project List", category: edenUI.viewCategories.interpretation};
	edenUI.eden.include("plugins/project-listing/project-listing.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.ProjectList.title = "Project List";
EdenUI.plugins.ProjectList.description = "Displays a list of construals.";
