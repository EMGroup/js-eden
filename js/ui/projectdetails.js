EdenUI.ProjectDetails = function(projectid) {
	var me = this;

	this.projectid = projectid;
	this.meta = undefined;

	// Create a modal obscurer.
	this.obscurer = $('<div class=\"modal\" style=\"display: block;\"></div>');

	this.obscurer.on('click', function(e) {
		if (e.target === e.currentTarget) me.remove();
	});

	// Create a centered dialog.
	this.dialog = $('<div class="modal-content" style="width: 500px"><div class="menubar-sharebox-title">Project Details:</div></div>');
	this.obscurer.append(this.dialog);

	document.body.appendChild(this.obscurer.get(0));

	Eden.DB.getMeta(projectid, function(meta) {
		console.log("DETAILS META", meta);

		var img = $('<img style="float: right;" src="'+meta[0].image+'"></img>');
		me.dialog.append(img);

		var details = $('<div class="projectdetails">\
			<span><span class="projectdetails-label">Author:</span><span class="projectdetails-value">'+meta[0].ownername+'</span></span>\
			<span><span class="projectdetails-label">Date:</span><span class="projectdetails-value">'+meta[0].date+'</span></span>\
		</div>');
		me.dialog.append(details);

		console.log(meta[0].projectMetaData);
		var meta2 = (meta[0].projectMetaData !== null) ? JSON.parse(meta[0].projectMetaData) : {};
		var descbox = document.createElement("div");
		descbox.className = "markdown";
		var sdown = new showdown.Converter();
		var res = sdown.makeHtml(meta2.description);
		descbox.innerHTML = res;
		me.dialog.get(0).appendChild(descbox);

		var buttons;
		if (meta[0].owner == Eden.DB.userid) {
			buttons = $('<div><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button><button class="deleteproject script-button"><span class="explorer-control-icon">&#xf00d;</span>Delete</button></div>');
		} else {
			 buttons = $('<div><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button></div>');
		}

		buttons.on("click",".openproject", function() {
			me.remove();
			Eden.Project.load(projectid);
		});

		buttons.on("click",".restoreproject", function() {
			me.remove();
			eden.root.lookup("jseden_project_mode").assign("restore", eden.root.scope, Symbol.defaultAgent);
			Eden.Project.load(projectid);
		});

		me.dialog.append(buttons);
		
	});
}

EdenUI.ProjectDetails.prototype.remove = function() {
	document.body.removeChild(this.obscurer.get(0));
}

