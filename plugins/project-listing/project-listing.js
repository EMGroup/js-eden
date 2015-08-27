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
	var prologue = "";

	if ("projectList" in edenUI.branding) {
		if ("prologue" in edenUI.branding.projectList) {
			prologue = '<div class="projectlist-prologue">' + edenUI.branding.projectList.prologue.html + '</div>';
			if ("href" in edenUI.branding.projectList.prologue) {
				prologue = '<a href="' + edenUI.branding.projectList + '" target="project-listing-link" style="text-decoration: none">' + prologue + '</a>';
			}
		}
		if (defaultURL == "" && "data" in edenUI.branding.projectList) {
			defaultURL = edenUI.branding.projectList.data;
		}
	}
	if (defaultURL == "") {
		defaultURL = "models/projects.json";
	}

	var instances = new Array();

	function ProjectListProjects() {
		this.json = {projects: []};
		this.rootURL = undefined;
		this.atRoot = true;
	}

	ProjectListProjects.prototype.loadProjectData = function (url, asRoot) {
		//Get a list of projects from the server.
		var me = this;
		$.ajax({
			url: url,
			dataType: 'json',
			success: function (data) {
				me.json = data;
				if (asRoot) {
					me.rootURL = url;
					me.atRoot = true;
				} else {
					me.atRoot = url == me.rootURL;
					if (!me.atRoot) {
						var rootProject = {
							name: "Return to main list",
							projects: me.rootURL
						};
						me.json.projects.push(rootProject);
					}
				}
				me.updateCollection("");
			},
			cache: false
		});
	};
	
	/**
	 * Update a particular project list with the specified search expression.
	 * This gets called whenever the search input gets changed. It clears the
	 * existing project list and generates new results matching the pattern.
	 * @private
	 */
	ProjectListProjects.prototype.updateCollection = function (pattern) {
		var me = this;

		//Clear any existing project search results.
		this.element.parentElement.scrollTop = 0;
		var searchResults = $(this.element).find(".projectlist-results");
		searchResults.html('');

		//Search through projects to find those matching the query.
		var re = new RegExp("(^|\\s)"+ pattern, "im");
		var hasMatches = false;
		for (var i = 0; i < this.json.projects.length; i++) {
			//If not a match then skip to next project
			if (
				!re.test(this.json.projects[i].name) &&
				!re.test(this.json.projects[i].description) &&
				!re.test(this.json.projects[i].author) &&
				!re.test(this.json.projects[i].year)
			) {
				continue;
			}
			hasMatches = true;

			//Generate the html element for the project
			var proj = $('<div class="projectlist-result-element"></div>');
			//Optimise by putting project details into html element.
			proj[0].project = this.json.projects[i];

			var projectData = this.json.projects[i];
			var projectHTML = '<div class="projectlist-result-name">' + projectData.name + '</div>';
			if (projectData.description !== undefined) {
				projectHTML = projectHTML + '<div class="projectlist-result-metadata">' + projectData.description + '</div>';
			}
			if (projectData.author !== undefined || projectData.year !== undefined) {
				projectHTML = projectHTML + '<div class="projectlist-result-metadata">';
				if (projectData.author !== undefined) {
					projectHTML = projectHTML + "By " + projectData.author;
				}
				if (projectData.year !== undefined) {
					projectHTML = projectHTML + " (" + projectData.year + ")";
				}
				projectHTML = projectHTML + '</div>'
			}
			proj.html(projectHTML).appendTo(searchResults);

		}

		//Also add mouse click functionality to load the project.
		searchResults.find(".projectlist-result-element").click(function () {
			if (this.project !== undefined) {
				// Actually load the project by executing js-e file.
				var projectURL = this.project.runfile;
				if (projectURL !== undefined) {
					var loadSelectedProject = function () {
						EdenUI.plugins.ScriptGenerator.loadBaseConstrual(projectURL);
						if (edenUI.plugins.ScriptInput) {
							edenUI.plugins.ScriptInput.addHistory('include("' + projectURL + '");');
						}
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
									edenUI.newProject();
								}
								loadSelectedProject();
							}
						);
					} else {
						edenUI.newProject();
						loadSelectedProject();
					}
				}
				var projectListURL = this.project.projects;
				if (projectListURL !== undefined) {
					me.loadProjectData(projectListURL, false);
				}
			}
		});

		//Add new project option
		if (!hasMatches || re.test("New Project")) {
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
							edenUI.newProject();
						}
					}
				);
			});
			searchResults.prepend(emptyProject);
		}

	}

	this.createDialog = function(name, mtitle, url) {
		if (url === undefined) {
			url = defaultURL;
		}

		var instance = new ProjectListProjects();

		var content = $('<div class="projectlist-listing"></div>');
		content.append(prologue);

		var searchDiv = $('<div class="projectlist-search-box-outer"></div>');
		var searchBox = $('<input type="text" class="projectlist-search" placeholder="search" />')
		.on("keyup", function (event) {
			instance.updateCollection(event.target.value);
		});
		searchDiv.append(searchBox);
		content.append(searchDiv);

		content.append('<div class="projectlist-results noselect"></div>');

		$('<div id="'+name+'"></div>')
		.html(content)
		.dialog({
			title: mtitle,
			width: 310,
			height: 400,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "unpadded-dialog"
		});

		instance.element = content.get(0);
		instance.loadProjectData(url, true);
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
