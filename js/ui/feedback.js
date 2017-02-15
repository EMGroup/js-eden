EdenUI.Feedback = function() {
	var icon = document.createElement("div");
	icon.className = "feedback-icon noselect";
	icon.innerHTML = "&#xf0e6;";
	document.getElementById("jseden-views").appendChild(icon);

	this.dialog = document.createElement("div");
	this.dialog.className = "feedback-dialog";
	this.dialog.style.display = "none";
	document.getElementById("jseden-views").appendChild(this.dialog);

	var title = document.createElement("div");
	title.className = "feedback-title";
	title.innerHTML = '<span class="feedback-icon2">&#xf0e6;</span><span class="feedback-title-text">Comments</span>';
	this.dialog.appendChild(title);

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

	var markdown = new EdenUI.Markdown("");
	var mkele = document.createElement("div");
	mkele.className = "feedback-input";
	mkele.appendChild(markdown.contents);
	this.dialog.appendChild(mkele);
	var buttons = document.createElement("div");
	buttons.className = "feedback-buttons";
	buttons.innerHTML = '<button class="script-button">Comment</button>';
	this.dialog.appendChild(buttons);
}


EdenUI.Feedback.prototype.updateComments = function(q) {
	var me = this;
	var sdown = new showdown.Converter();

	Eden.DB.searchComments(eden.project, q, 1, 10, function(data) {
		if (data) {
			for (var i=0; i<data.length; i++) {
				var ele = document.createElement("div");
				var heading = document.createElement("div");
				var t = data[i].date.split(/[- :]/);

				heading.className = "feedback-header";
				heading.innerHTML = '<span class="feedback-author">'+data[i].author+'</span><span class="feedback-date">'+get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000)+'</span>';
				ele.appendChild(heading);
				var mk = document.createElement("div");
				mk.style.padding = "0";
				mk.style.marginBottom = "3px";
				mk.className = "markdown";
				ele.appendChild(mk);
				ele.className = "feedback-result";
				//ele.textContent = data[i].comment;
				mk.innerHTML = sdown.makeHtml(data[i].comment);
				me.dialog.appendChild(ele);
			}
		}
	});
}
