EdenUI.Feedback = function() {
	var icon = document.createElement("div");
	icon.className = "feedback-icon noselect";
	icon.innerHTML = "&#xf0e6;";
	document.body.appendChild(icon);

	this.dialog = document.createElement("div");
	this.dialog.className = "feedback-dialog";
	this.dialog.style.display = "none";
	document.body.appendChild(this.dialog);

	var visSym = eden.root.lookup("jseden_feedback_visible");
	var widthSym = eden.root.lookup("jseden_feedback_width");
	
	var me = this;
	icon.addEventListener("click", function(e) {
		if (visSym.definition === undefined) {
			visSym.assign(true, eden.root.scope, Symbol.hciAgent);
		}
	});

	widthSym.assign(420, eden.root.scope, Symbol.defaultAgent);

	function changeVis(sym, val) {
		if (val) {
			me.dialog.style.display = "initial";
			me.updateComments("");
		} else {
			me.dialog.style.display = "none";
		}
	}
	visSym.addJSObserver("feedback", changeVis);
	changeVis(visSym, visSym.value());
}


EdenUI.Feedback.prototype.updateComments = function(q) {
	var me = this;

	Eden.DB.searchComments(eden.project, q, 1, 10, function(data) {
		if (data) {
			for (var i=0; i<data.length; i++) {
				var ele = document.createElement("div");
				ele.className = "feedback-result";
				ele.textContent = data[i].comment;
				me.dialog.appendChild(ele);
			}
		}
	});
}
