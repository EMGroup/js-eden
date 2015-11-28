/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.PluginManager = function (edenUI, success) {
	
	this.createDialog = function (name, mtitle) {
		var $pluginList = $('<div class="projectlist-results noselect"></div>');
		var pluginInfo;
		var pluginName;
		var wording;

		var loadedHtml = function (pluginName) {
			return edenUI.plugins[pluginName] ? "(loaded)" : "(not loaded)";
		};

		pluginNames = Object.keys(EdenUI.plugins).sort(function (a, b) {
			var aLoaded = edenUI.plugins[a];
			var bLoaded = edenUI.plugins[b];
			if (aLoaded && !bLoaded) {
				return 1;
			} else if (bLoaded && !aLoaded) {
				return -1;
			} else if (a < b) {
				return -1;
			} else if (a == b) {
				return 0;
			} else {
				return 1;
			}
		});
		
		for (var i = 0; i < pluginNames.length; i++) {
			pluginName = pluginNames[i];
			pluginInfo = EdenUI.plugins[pluginName];
			var loadedCSSClass = pluginName in edenUI.plugins? " pluginmanager-loaded" : "";
			var pluginHTML =
				'<div class="projectlist-result-element' + loadedCSSClass + '">' +
					'<div class="projectlist-result-name">' +
						pluginInfo.title +
					"</div>" +
					"<div class='projectlist-result-metadata'>" +
						pluginInfo.description +
					"</div>";
			if (pluginInfo.originalAuthor !== undefined) {
				pluginHTML = pluginHTML +
					"<div class='projectlist-result-metadata'>" +
						"Original version by " + pluginInfo.originalAuthor +
					"</div>";
			}
			if (pluginInfo.author !== undefined) {
				if (pluginInfo.originalAuthor === undefined) {
					wording = "By ";
				} else {
					wording = "Built on by ";
				}
				pluginHTML = pluginHTML +
					"<div class='projectlist-result-metadata'>" +
						wording + pluginInfo.author +
					"</div>";
			}
			pluginHTML = pluginHTML +
					'<div class="pluginlist-loaded projectlist-result-metadata">' +
						loadedHtml(pluginName) +
					"</div>" +
				"</div>"

			$(pluginHTML).click((function (pluginName) {
				return function () {
					var pluginJQ = $(this);
					edenUI.loadPlugin(pluginName, function () {
						if (edenUI.plugins[pluginName]) {
							pluginJQ.find('.pluginlist-loaded').html(loadedHtml(pluginName));
							pluginJQ.addClass("pluginmanager-loaded", 100);
						}
						edenUI.plugins.MenuBar.updateViewsMenu();
					});
				};
			}(pluginName))	
			).appendTo($pluginList);
		}

		var $dialogContents = $(
			'<div class="projectlist-listing">' +
			'</div>'
		);
		$dialogContents.append($pluginList);

		$dialog = $('<div id="'+name+'"></div>')
			.html($dialogContents)
			.dialog({
				title: mtitle,
				width: 310,
				height: 400,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "unpadded-dialog"
			});
	};

	edenUI.views["PluginManager"] = {dialog: this.createDialog, title: "Plug-in Manager", category: edenUI.viewCategories.environment, name: "plugins"};
	success();
};

/* Plugin meta information */
EdenUI.plugins.PluginManager.title = "Plug-in Manager";
EdenUI.plugins.PluginManager.description = "Provides the ability to load plug-ins.";
