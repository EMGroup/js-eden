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
	this.dialog = $('<div class="modal-content" style="width: 500px"></div>');
	this.obscurer.append(this.dialog);

	document.body.appendChild(this.obscurer.get(0));

	Eden.DB.getMeta(projectid, function(meta) {
		console.log("DETAILS META", meta);

		var img = $('<img class="projectdetails-thumb" src="'+meta[0].image+'"></img>');
		me.dialog.append(img);

		console.log(meta[0].projectMetaData);
		var meta2 = (meta[0].projectMetaData !== null) ? JSON.parse(meta[0].projectMetaData) : {};
		var descbox = document.createElement("div");
		descbox.className = "markdown";
		var sdown = new showdown.Converter();
		var desc = meta2.description.replace(/\s(#[a-zA-Z0-9]+)/g, ' <span style="color:blue;">$1</span>');
		var res = sdown.makeHtml(desc);
		descbox.innerHTML = res;
		me.dialog.get(0).appendChild(descbox);

		var t = meta[0].date.split(/[- :]/);

		var details = $('<div class="projectdetails">\
			<span><span class="projectdetails-label">by </span><span class="projectdetails-value">'+meta[0].ownername+'</span></span>\
			<span><span class="projectdetails-label">Last Changed:</span><span class="projectdetails-value">'+get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000)+'</span></span>\
		</div>');
		me.dialog.append(details);

		var buttons;
		if (meta[0].owner == Eden.DB.userid) {
			buttons = $('<div style="clear:right;"><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button><button class="deleteproject script-button"><span class="explorer-control-icon">&#xf00d;</span>Delete</button><br></div>');
		} else {
			 buttons = $('<div><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button><br></div>');
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

		buttons.append($('<iframe src="https://www.facebook.com/plugins/like.php?href='+encodeURIComponent(window.location.href+"?load="+projectid)+'&width=350&layout=standard&action=like&size=small&show_faces=false&share=true&height=80&appId=1447073055317881" width="300" height="20" style="border:none;overflow:hidden;margin-left:5px;margin-top:5px;" scrolling="no" frameborder="0" allowTransparency="true"></iframe>'));

		me.dialog.append(buttons);
		
		Eden.DB.search(":parent("+projectid+")", function(forks) {
			if (forks.length > 0) {
				var forksbox = document.createElement("div");
				forksbox.className = "projectdetails-forks";
				for (var i=0; i<forks.length; i++) {
					var forkentry = document.createElement("div");
					forkentry.className = "projectdetails-fork";
					var t = forks[i].date.split(/[- :]/);
					forkentry.innerHTML = "Forked as \"" + forks[i].title + "\" by " + forks[i].ownername + " " + get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000);
					forksbox.appendChild(forkentry);
				}
				me.dialog.get(0).insertBefore(forksbox,descbox.nextSibling.nextSibling);
			}
		});
	});
}

EdenUI.ProjectDetails.prototype.remove = function() {
	document.body.removeChild(this.obscurer.get(0));
}

