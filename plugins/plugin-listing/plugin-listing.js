/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.PluginManager = function (edenUI, success) {
	
	this.createDialog = function (name, mtitle) {
		var $pluginList = $('<div class="projectlist-result-element"></div>');
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
			var pluginHTML =
				'<li class="type-project">' +
					'<div class="projectlist-result_name">' +
						pluginInfo.title +
					"</div>" +
					"<div class='projectlist-result_value'>" +
						pluginInfo.description +
					"</div>";
			if (pluginInfo.originalAuthor !== undefined) {
				pluginHTML = pluginHTML +
					"<div class='projectlist-result_value'>" +
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
					"<div class='projectlist-result_value'>" +
						wording + pluginInfo.author +
					"</div>";
			}
			pluginHTML = pluginHTML +
					'<div class="pluginlist-loaded projectlist-result_value">' +
						loadedHtml(pluginName) +
					"</div>" +
				"</li>"

			$(pluginHTML).click((function (pluginName) {
				return function () {
					var el = this;
					$(this).animate({backgroundColor: "#dbe5f1"}, 100);
					edenUI.loadPlugin(pluginName, function () {
						$(el).find('.pluginlist-loaded').html(loadedHtml(pluginName));
						edenUI.plugins.MenuBar.updateViewsMenu();
					});
				};
			}(pluginName))).hover(
				function() {
					$(this).stop().animate({backgroundColor: "#f2f2f2"}, 100);
				}, function() {
					$(this).stop().animate({backgroundColor: "#eaeaea"}, 100);
				}	
			).appendTo($pluginList);
		}

		var $dialogContents = $(
			'<div class="projectlist-listing">'+
				'<div class="projectlist-results">'+
				'</div>'+
			'</div>'
		);

		$dialogContents
			.find('.projectlist-results')
			.append($pluginList);

		$dialog = $('<div id="'+name+'"></div>')
			.html($dialogContents)
			.dialog({
				title: mtitle,
				width: 310,
				height: 400,
				minHeight: 120,
				minWidth: 230,
				position: ['right','top'],
			});
	};

	edenUI.views["PluginManager"] = {dialog: this.createDialog, title: "Plug-in Manager", category: edenUI.viewCategories.environment};
	success();
};

/* Plugin meta information */
EdenUI.plugins.PluginManager.title = "Plug-in Manager";
EdenUI.plugins.PluginManager.description = "Provides the ability to load plug-ins.";
