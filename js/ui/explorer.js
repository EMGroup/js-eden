EdenUI.Explorer = function() {
	var me = this;

	this.element = $('<div class="explore-main">\
<div class=\"explore-tabs\">\
	<div class=\"explore-tab-container\">\
		<div class=\"explore-tab explore-tab-current\" data-name="state">State</div>\
		<div class=\"explore-tab explore-tab-notcurrent\" data-name="scripts">Scripts</div>\
		<div class=\"explore-tab explore-tab-notcurrent\" data-name="palette">Palette</div>\
	</div>\
</div>\
<div class="explore-state">\
</div>\
<div class="explore-script" style="display: none">\
</div>\
<div class="explore-console">\
	<div class="explore-console-buttons">\
		<div style="margin-top: 4px; float: left;">Script Input</div>\
		<button class="control-button clear-button control-enabled" style="float: right;">&#xf05e;</button>\
	</div>\
	<div class="explore-console-code"></div>\
</div>\
</div>');
	$("#jseden-main").append(this.element);

	this.consoleele = this.element.find(".explore-console-code");
	this.expscripts = this.element.find(".explore-script");
	this.expstate = this.element.find(".explore-state");

	this.element.resizable({handles: "w"});

	// Make the console...
	this.console = new EdenUI.ScriptBox(this.consoleele.get(0), {nobuttons: true});
	this.state = new EdenUI.ExplorerState(this.expstate);
	this.scripts = new EdenUI.ExplorerScripts(this.expscripts);

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
		} else if (name == "scripts") {
			me.expstate.css("display","none");
			me.expscripts.css("display","flex");
		} else if (name == "palette") {

		}
	});	

	var expSym = eden.root.lookup("jseden_explorer_enabled");
	var expVal = expSym.value();
	if (!expVal) {
		this.enabled = false;
		this.element.hide();
	}
	expSym.addJSObserver("explorer", function(sym, val) {
		me.enabled = val;
		if (!val) {
			me.element.hide();
			me.capture = false;
			me.clear();
		} else if (eden.root.lookup("jseden_explorer_visible").value()) {
			me.element.show();
		}
	});

	var visSym = eden.root.lookup("jseden_explorer_visible");
	var visVal = visSym.value();
	if (!visVal) {
		this.element.hide();
	}
	visSym.addJSObserver("explorer", function(sym, val) {
		console.log("VISIBLE");
		if (val && me.enabled) me.element.show();
		else {
			me.element.hide();
			me.state.capture = false;
			me.state.clear();
		}
	});


	var zoomSym = eden.root.lookup("jseden_explorer_zoom");
	var zoomVal = zoomSym.value();
	zoomSym.addJSObserver("explorer", function(sym, val) {
		if (typeof val == "number" && val > 0) {
			var fs = 10 * val;
			me.state.results.css("font-size",""+fs+"pt");
		}
	});
	if (zoomVal === undefined) zoomSym.assign(1, eden.root.scope, Symbol.defaultAgent);

}


/** Strings longer than this don't get highlighted */
EdenUI.Explorer.MAXHIGHLIGHTLENGTH = 1000;


EdenUI.Explorer.prototype.showConsole = function() {

}

EdenUI.Explorer.prototype.hideConsole = function() {

}
