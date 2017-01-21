EdenUI.prototype.presentationLayout = function() {
	var win = $(document.body).find("#jseden-views").get(0);
	win.style.display = "flex";
	win.style.flexDirection = "column";

	var can = edenUI.views.Canvas2D.embedded("slide","Slide","slide1");
	can.raw = can.code_entry.get(0);
	win.appendChild(can.raw);

	var script = edenUI.views.ScriptInput.embed("script","Presentation Source");
	script.raw = script.contents.get(0);
	script.raw.style.width = "100%";
	win.appendChild(script.raw);
}

