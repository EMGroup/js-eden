/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Project Listing Plugin.
 * A plugin to display a list of models hosted online.
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
					}
				}
			);
		});
		projresults.append(emptyProject);

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
				'<div class="projectlist-result-name">'
				+ me.projects.projects[i].name +
				'</div><div class="projectlist-result-metadata">'
				+ me.projects.projects[i].description +
				'</div><div class="projectlist-result-metadata">By '
				+ me.projects.projects[i].author
				+ ' ('
				+ me.projects.projects[i].year
				+ ')</div>'
			).appendTo(projresults);

			i = i + 1;
		}

		//Also add mouse click functionality to load the project.
		projresults.find(".projectlist-result-element").click(function () {
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
				minWidth: 230,
				dialogClass: "unpadded-dialog"
			});

		me.instances.push(code_entry[0]);
		updateCollection(code_entry[0], "");
		//The -1 is stop Chrome from displaying scrollbars on start up.
		return {position: ['right', 'bottom-1']};
	};

	//Get a list of projects from the server.
	$.ajax({
		//url: "models/projects.json",
		url: "models/construit-c14-teacher-cpd/projects.json",
		dataType: 'json',
		success: function(data) {
			me.projects = data;
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
