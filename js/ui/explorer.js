EdenUI.Explorer = function() {
	var me = this;

	this.element = $(`<div class="explore-main">
<div class=\"explore-tabs\">
	<div class=\"explore-tab-container\">
		<div class=\"explore-tab explore-tab-current\" data-name="state">${Language.ui.explorer.state}</div>
		<div class="explore-tab explore-tab-notcurrent" data-name="scripts">Agents</div>
		<div class="explore-tab explore-tab-notcurrent" data-name="settings">Settings</div>
`+
		 //<div class=\"explore-tab explore-tab-notcurrent\" data-name="palette">Palette</div>
`	</div>
</div>
<div class="explore-state">
</div>
<div class="explore-script" style="display: none">
</div>
<div class="explore-settings" style="display: none">
	<div style="font-size: 8pt">Note: Many of these do not work yet.</div>
	<h1>Environment</h1>
	<div id="explorerenvsettings" class="explorer-settings-list"></div>
	<h1>Project</h1>
	<div id="explorerprojectsettings" class="explorer-settings-list"></div>
	<h1>Menu Bar</h1>
	<div id="explorermenusettings" class="explorer-settings-list"></div>
	<h1>Peer-2-Peer</h1>
	<div id="explorerp2psettings" class="explorer-settings-list"></div>
	<h1>Search</h1>
	<div id="explorersearchsettings" class="explorer-settings-list"></div>
	<h1>Parser</h1>
	<div id="explorerparsersettings" class="explorer-settings-list"></div>
	<h1>Script Views</h1>
	<div id="explorerscriptviewsettings" class="explorer-settings-list"></div>
</div>
<div class="explore-console">
	<div class="explore-console-buttons">
		<div style="margin-top: 4px; float: left;">${Language.ui.explorer.input}</div>
		<button class="control-button clear-button control-enabled" title="${Language.ui.tooltips.clear}" style="float: right;">&#xf05e;</button>
	</div>
	<div class="explore-console-code"></div>
</div>
</div>`);
	$("#jseden-main").append(this.element);

	this.consoleele = this.element.find(".explore-console-code");
	this.expscripts = this.element.find(".explore-script");
	this.expstate = this.element.find(".explore-state");
	this.expsettings = this.element.find(".explore-settings");

	// Make the settings
	var curset = this.expsettings.find('#explorerenvsettings').get(0);
	this.addSetting(curset, "jseden_autosave", "Enable autosave to local storage", "", "boolean");
	this.addSetting(curset, "jseden_leaveprompt", "Enable a leave page prompt", "", "boolean");

	var curset = this.expsettings.find('#explorerprojectsettings').get(0);
	this.addSetting(curset, "jseden_project_nocomments", "Disable comments", "", "boolean");
	this.addSetting(curset, "jseden_project_noforking", "Disable forking", "", "boolean");

	var curset = this.expsettings.find('#explorermenusettings').get(0);
	this.addSetting(curset, "jseden_menu_visible", "Menu visible", "", "boolean");
	this.addSetting(curset, "jseden_menu_showhelp", "Show Help", "", "boolean");
	this.addSetting(curset, "jseden_menu_showsearch", "Show Search", "", "boolean");
	this.addSetting(curset, "jseden_menu_showcreate", "Show Create Views", "", "boolean");
	this.addSetting(curset, "jseden_menu_showexisting", "Show Existing", "", "boolean");
	this.addSetting(curset, "jseden_menu_showshare", "Show Share", "", "boolean");
	this.addSetting(curset, "jseden_explorer_enabled", "Allow Spanner Panel", "", "boolean");

	var curset = this.expsettings.find('#explorerp2psettings').get(0);
	this.addSetting(curset, "jseden_p2p_captureedits", "Send script edits", "", "boolean");
	this.addSetting(curset, "jseden_p2p_captureinput", "Send UI Events (Mouse...)", "", "boolean");
	this.addSetting(curset, "jseden_p2p_doactive", "Copy all state on connect", "", "boolean");

	curset = this.expsettings.find('#explorersearchsettings').get(0);
	this.addSetting(curset, "jseden_search_history", "Include Historic", "", "boolean");
	this.addSetting(curset, "jseden_search_external", "Always include external", "", "boolean");
	this.addSetting(curset, "jseden_search_all", "Don't make unique", "", "boolean");
	this.addSetting(curset, "jseden_search_nosort", "Don't sort by time", "", "boolean");

	curset = this.expsettings.find('#explorerparsersettings').get(0);
	this.addSetting(curset, "jseden_parser_strict", "Strict mode", "", "boolean");
	this.addSetting(curset, "jseden_parser_noliterals", "No literals in expressions", "", "boolean");
	this.addSetting(curset, "jseden_parser_noexprover", "No override expressions", "", "boolean");
	this.addSetting(curset, "jseden_parser_warndeprecate", "Show deprecation warnings", "", "boolean");
	this.addSetting(curset, "jseden_parser_errordeprecate", "Make deprecated an error", "", "boolean");
	this.addSetting(curset, "jseden_parser_cs3", "ConstruitScript3 Support", "", "boolean");

	curset = this.expsettings.find('#explorerscriptviewsettings').get(0);
	this.addSetting(curset, "jseden_script_query", "Default browse query", "", "text");
	this.addSetting(curset, "jseden_script_buttons", "Show buttons", "", "boolean");
	this.addSetting(curset, "jseden_script_highlighting", "Disable highlighting", "", "boolean");
	this.addSetting(curset, "jseden_script_styling", "Disable comment styling", "", "boolean");
	this.addSetting(curset, "jseden_script_hidecomments", "Hide all comments", "", "boolean");
	this.addSetting(curset, "jseden_script_readonly", "All readonly", "", "boolean");

	this.element.resizable({
		handles: "w",
		stop: function(event, ui) {
			//console.log("RESIZESTOP",ui);
			eden.root.lookup("jseden_explorer_width").assign(ui.element[0].clientWidth+2, eden.root.scope, EdenSymbol.localJSAgent);
		}
	});
	eden.root.lookup("jseden_explorer_width").assign(this.element.get(0).clientWidth+2, eden.root.scope, EdenSymbol.localJSAgent);

	// Make the console...
	this.console = new EdenUI.ScriptBox(this.consoleele.get(0), {nobuttons: true});
	this.state = new EdenUI.ExplorerState(this.expstate);
	//this.scripts = new EdenUI.ExplorerScripts(this.expscripts);

	this.element.on("click", ".clear-button", function(e) {
		me.console.clear();
	});

	this.element.on("click", ".explore-tab", function(e) {
		var name = e.currentTarget.getAttribute("data-name");
		var curtab = me.element.find(".explore-tab-current");
		curtab.removeClass("explore-tab-current");
		curtab.addClass("explore-tab-notcurrent");
		changeClass(e.currentTarget, "explore-tab-current", true);
		changeClass(e.currentTarget, "explore-tab-notcurrent", false);

		if (name == "state") {
			me.expstate.css("display","flex");
			me.expscripts.css("display", "none");
			me.expsettings.css("display","none");
		} else if (name == "scripts") {
			me.expstate.css("display","none");
			me.expscripts.css("display","flex");
			me.expsettings.css("display","none");
		} else if (name == "palette") {

		} else if (name == "settings") {
			me.expstate.css("display","none");
			me.expsettings.css("display","block");
			me.expscripts.css("display", "none");
		}
	});	

	var expSym = eden.root.lookup("jseden_explorer_enabled");
	var expVal = expSym.value();
	if (!expVal) {
		this.enabled = false;
		this.element.hide();
		me.state.hide();
	} else {
		me.state.show();
	}
	expSym.addJSObserver("explorer", function(sym, val) {
		me.enabled = val;
		if (!val) {
			me.element.hide();
			me.state.hide();
			me.capture = false;
			//me.clear();
		} else if (eden.root.lookup("jseden_explorer_visible").value()) {
			me.element.show();
			me.state.show();
		}
	});

	var visSym = eden.root.lookup("jseden_explorer_visible");
	var visVal = visSym.value();
	if (!visVal) {
		this.element.hide();
		me.state.hide();
	} else {
		me.state.show();
	}
	visSym.addJSObserver("explorer", function(sym, val) {
		//console.log("VISIBLE");
		if (val && me.enabled) {
			me.element.show();
			me.state.show();
			eden.root.lookup("jseden_explorer_width").assign(me.element.get(0).clientWidth+2, eden.root.scope, EdenSymbol.localJSAgent);
		} else {
			me.element.hide();
			me.state.capture = false;
			me.state.clear();
			me.state.hide();
			eden.root.lookup("jseden_explorer_width").assign(0, eden.root.scope, EdenSymbol.localJSAgent);
		}
	});

	function saveSetting(sym, value) {
		window.localStorage.setItem(sym.name, value);
	}

	var setlist = [
		"jseden_autosave",
		"jseden_leaveprompt",
		/*"jseden_menu_visible",
		"jseden_menu_showhelp",
		"jseden_menu_showsearch",
		"jseden_menu_showcreate",
		"jseden_menu_showexisting",
		"jseden_menu_showshare",*/
		"jseden_explorer_enabled"
	];

	for (var i=0; i<setlist.length; i++) {
		var sym = eden.root.lookup(setlist[i]);
		sym.assign(window.localStorage[setlist[i]] == "true", eden.root.scope, EdenSymbol.localJSAgent);
		sym.addJSObserver("settings", saveSetting);
	}


	var zoomSym = eden.root.lookup("jseden_explorer_zoom");
	var zoomVal = zoomSym.value();
	zoomSym.addJSObserver("explorer", function(sym, val) {
		if (typeof val == "number" && val > 0) {
			var fs = 10 * val;
			me.state.results.css("font-size",""+fs+"pt");
		}
	});
	if (zoomVal === undefined) zoomSym.assign(1, eden.root.scope, EdenSymbol.defaultAgent);

}

EdenUI.Explorer.prototype.addSetting = function(root, obs, plabel, tip, type) {
	var outer = document.createElement("div");
	outer.className = "explorer-setting";
	outer.title = tip;
	var label = document.createElement("span");
	label.textContent = plabel;
	label.className = "explorer-setting-label";
	outer.appendChild(label);

	var input = document.createElement("input");
	var sym = eden.root.lookup(obs);
	var val = sym.value();

	switch(type) {
	case "boolean":		input.setAttribute("type","checkbox"); break;
	case "string":		input.setAttribute("type","text"); break;
	}

	input.onchange = function(e) {
		if (type == "boolean") {
			sym.assign(input.checked, eden.root.scope, EdenSymbol.jsAgent);
		} else {
			sym.assign(input.value, eden.root.scope, EdenSymbol.jsAgent);
		}
	}

	function update(sym, value) {
		if (sym.orign instanceof InternalAgent) return;
		if (type == "boolean") {
			input.checked = value;
		} else {
			input.value = value;
		}
	}
	update(sym,val);
	sym.addJSObserver("settings", update);

	outer.appendChild(input);
	root.appendChild(outer);
}


/** Strings longer than this don't get highlighted */
EdenUI.Explorer.MAXHIGHLIGHTLENGTH = 1000;


EdenUI.Explorer.prototype.showConsole = function() {

}

EdenUI.Explorer.prototype.hideConsole = function() {

}
