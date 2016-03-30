/*
 * Copyright (c) 2016, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden HTML IFrame Views Plugin.
 * A simple plugin allowing Eden code to display web pages within dialogs.
 * @class ExternalHTMLContent Plug-in
 */

EdenUI.plugins.ExternalHTMLContent = function(edenUI, success) {
	var me = this;

	window.history.pushState({}, "", "#noNavigateAway");
	window.addEventListener("popstate", function () {
		if (document.location.hash == "") {
			edenUI.modalDialog(
				"Leave Environment?",
				"<p>Leaving this page will discard the current script. Your work will not be saved.</p>" +
				"<p>Are you sure you want to close JS-EDEN?</p>",
				["Close JS-EDEN", "Return to Construal"],
				1,
				function (option) {
					if (option == 0) {
						doingNavigateAway = true; 
						window.history.back(1);
					} else {
						window.history.forward(1);
					}
				}
			);
		}
	});

	this.createDialog = function(name, mtitle) {
		//Remove -dialog name suffix.
		var viewName = name.slice(0, -7);

		var code_entry = $(
			'<iframe marginwidth="13" ' +
			//Only disable top navigation and screen orientation lock
			'sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" ' +
			'allowfullscreen="true" name="' + name + '"></iframe>');

		var urlSym = root.lookup("_view_" + viewName + "_url");
		var iframe = code_entry[0];
		function loadURL(sym, value) {
			if (value === undefined) {
				value = "about:blank";
			}
			iframe.src = "plugins/external-html-content/redirect.html?viewName=" +
			encodeURI(viewName) + "&url=" + encodeURI(value);
		}
		loadURL(urlSym, urlSym.value());
		urlSym.addJSObserver("refreshView", loadURL);

		var dialog = $('<div id="' + name + '"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "external-html-content"
			});

		var toolbar = $('<div class="external-html-content-toolbar">');
		dialog.append(toolbar);
		var backButton = $('<input type="image" src="images/back-button.svg" width="28" height="28" alt="Back"/>');
		backButton.on("click", function () {
			window.history.back(1);
			iframe.focus();
		});
		toolbar.append(backButton);

		var forwardButton = $('<input type="image" src="images/forward-button.svg" width="28" height="28" alt="Forward"/>');
		forwardButton.on("click", function () {
			window.history.forward(1);
			iframe.focus();
		});
		toolbar.append(forwardButton);

		var refreshButton = $('<input type="image" src="images/refresh-button.png" height="28" alt="Refresh"/>');
		refreshButton.on("click", function () {
			loadURL(urlSym, urlSym.value());			
			iframe.focus();
		});
		toolbar.append(refreshButton);

		return {confirmClose: true};
	}

	//Register the HTML view options
	edenUI.views["ExternalHTMLContent"] = {dialog: this.createDialog, title: "External HTML Content",
		category: edenUI.viewCategories.visualization, holdsContent: true};

	//Load the Eden wrapper functions
	edenUI.eden.include("plugins/external-html-content/external-html-content.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.ExternalHTMLContent.title = "External HTML Content";
EdenUI.plugins.ExternalHTMLContent.description = "Allows construals to display web pages created outside of JS-EDEN.";
