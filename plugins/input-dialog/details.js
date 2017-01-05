EdenUI.ScriptArea.Details = function(sa) {
	this.scriptarea = sa;

	this.contents = document.createElement("div");
	this.contents.className = "script-details";

	this.contents.addEventListener("keyup", function(e) {
		var prop = e.target.parentNode.getAttribute("data-name");
		var value = e.target.value;
		console.log("CHANGE PROP", prop, value);
	});

	this.visible = false;
}

EdenUI.ScriptArea.Details.prototype.addProperty = function(name, l, v, opt) {
	var prop = document.createElement("div");
	prop.className = "script-details-prop";
	prop.setAttribute("data-name",name);
	var label = document.createElement("div");
	label.className = "script-details-label";
	label.textContent = l;
	prop.appendChild(label);
	var value = document.createElement("input");
	value.className = "script-details-value";
	value.value = (v) ? v : "";
	value.setAttribute("type","text");
	if (opt && opt.readonly) {
		value.className += " script-details-readonly";
		value.setAttribute("readonly","true");
	}
	prop.appendChild(value);
	var status = document.createElement("div");
	status.className = "script-details-status";

	if (opt && opt.readonly) {
		status.innerHTML = "&#xf023;";
	} else {
		status.innerHTML = "&#xf00c;";
	}

	prop.appendChild(status);
	this.contents.appendChild(prop);
	return prop;
}

EdenUI.ScriptArea.Details.prototype.clear = function() {
	while (this.contents.lastChild) this.contents.removeChild(this.contents.lastChild);
}

EdenUI.ScriptArea.Details.prototype.addButtons = function() {
	var butarea = document.createElement("div");
	butarea.className = "script-details-buttons";
	var close = document.createElement("button");
	close.className = "script-button";
	close.innerHTML = '<span class="explorer-control-icon">&#xf00d;</span>Close';
	butarea.appendChild(close);
	this.contents.appendChild(butarea);
}

EdenUI.ScriptArea.Details.prototype.show = function() {
	this.clear();
	this.addProperty("name", "Name", this.scriptarea.fragment.name);
	this.addProperty("selector", "Path", this.scriptarea.fragment.selector, {readonly: true});
	if (this.scriptarea.fragment.originast) {
		this.addProperty("id", "Full Name", Eden.Selectors.getID(this.scriptarea.fragment.originast), {readonly: true});
	}

	var doxy = this.scriptarea.fragment.doxy;
	if (doxy) {
		this.addProperty("desc", "Description", doxy.stripped());
		this.addProperty("tags", "Tags", doxy.getHashTags().join(" "));
		var ctrls = doxy.getControls();
		for (var x in ctrls) {
			this.addProperty(x, x.substring(1), ctrls[x]);
		}
	}

	this.addButtons();

	this.scriptarea.codearea.appendChild(this.contents);
	changeClass(this.scriptarea.outdiv,"blur", true);
	this.visible = true;
}

EdenUI.ScriptArea.Details.prototype.hide = function() {
	if (!this.visible) return;
	this.scriptarea.codearea.removeChild(this.contents);
	this.visible = false;
	changeClass(this.scriptarea.outdiv,"blur", false);
}

EdenUI.ScriptArea.Details.prototype.toggle = function() {
	if (this.visible) this.hide();
	else this.show();
}


