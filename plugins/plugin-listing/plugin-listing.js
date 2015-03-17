/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.PluginListing = function (edenUI, success) {
	this.createDialog = function (name, mtitle) {
		var $pluginList = $('<div class="projectlist-result-element"></div>');
		var pluginInfo;
		var pluginName;

		var loadedHtml = function (pluginName) {
			return edenUI.plugins[pluginName] ? "(loaded)" : "(not loaded)";
		};

		for (pluginName in EdenUI.plugins) {
			pluginInfo = EdenUI.plugins[pluginName];
			$(
				'<li class="type-project">'+
					'<div class="projectlist-result_name">'+
						pluginInfo.title+
					"</div>"+
					"<div class='projectlist-result_value'>"+
						pluginInfo.description+
					"</div>"+
					"<div class='projectlist-result_value'>"+
						" by "+ pluginInfo.author+
					"</div>"+
					'<div class="pluginlist-loaded projectlist-result_value">'+
						loadedHtml(pluginName)+
					"</div>"+
				"</li>"
			).click((function (pluginName) {
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

	edenUI.views["PluginListing"] = {dialog: this.createDialog, title: "Plugin Listing", category: edenUI.viewCategories.environment};
	success();
};

/* Plugin meta information */
EdenUI.plugins.PluginListing.title = "Plugin Listing";
EdenUI.plugins.PluginListing.description = "Display list of available plugins";
EdenUI.plugins.PluginListing.year = "Tim Monks";
