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
	this.dialog = $('<div class="modal-content" style="width: 600px"></div>');
	this.obscurer.append(this.dialog);

	document.body.appendChild(this.obscurer.get(0));

	Eden.DB.getMeta(projectid, function(meta) {
		console.log("DETAILS META", meta);

		if (meta[0].image !== null) {
			var img = $('<img class="projectdetails-thumb" src="'+meta[0].image+'"></img>');
			me.dialog.append(img);
		}

		console.log(meta[0].projectMetaData);
		var meta2 = (meta[0].projectMetaData !== null) ? JSON.parse(meta[0].projectMetaData) : {};
		var descbox = document.createElement("div");
		descbox.className = "markdown";
		var sdown = new showdown.Converter();
		var desc = (meta2 && meta2.description) ? meta2.description.replace(/\s(#[a-zA-Z0-9]+)/g, ' <span class="markdown-hashtag">$1</span>') : "";
		var res = sdown.makeHtml(desc);
		descbox.innerHTML = res;
		me.dialog.get(0).appendChild(descbox);

		var t = meta[0].date.split(/[- :]/);
		var astars = (meta[0].overallRating !== null) ? meta[0].overallRating / meta[0].numRatings : 0;

		var details = $('<div class="projectdetails">\
			<span class="projectdetails-rateavg">'+astars.toFixed(1)+'</span><span><span class="projectdetails-label">by:</span><span class="projectdetails-value">'+meta[0].ownername+'</span></span>\
			<span>, <span class="projectdetails-value">'+get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000)+'</span></span>\
		</div>');

		var rating = $('<div class="projectdetails-rating">\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
</div>');
		me.dialog.append(rating);
		me.dialog.append(details);

		rating.on("click",".projectdetails-star", function(e) {
			if (Eden.DB.isLoggedIn() == false) return;
			var p = e.currentTarget.parentNode;
			var stars = 0;
			for (var i=0; i<5; i++) {
				p.childNodes[i].className = "projectdetails-star" + ((stars > 0) ? "" : " selected");
				p.childNodes[i].innerHTML = (stars > 0) ? "&#xf005;" : "&#xf005;";
				if (p.childNodes[i] === e.currentTarget) {
					stars = i+1;
				}
			}
			//console.log("RATE",stars);
			Eden.DB.rate(projectid, stars);
		});

		var p = rating[0];
		if (astars) {
			var astarsf = Math.floor(astars);
			for (var i=0; i<5; i++) {
				p.childNodes[i].className = "projectdetails-star" + ((i >= astarsf) ? "" : " average");
				p.childNodes[i].innerHTML = (i >= stars) ? "&#xf005;" : "&#xf005;";
			}
		}
		var stars = meta[0].myrating;
		if (stars) {
			for (var i=0; i<5; i++) {
				p.childNodes[i].className = "projectdetails-star" + ((i >= stars) ? "" : " selected");
				p.childNodes[i].innerHTML = (i >= stars) ? "&#xf005;" : "&#xf005;";
			}
		}
		

		var buttons;
		if (meta[0].owner == Eden.DB.userid) {
			buttons = $('<div class="projectdetails-buttons"><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button><button class="deleteproject script-button"><span class="explorer-control-icon">&#xf00d;</span>Delete</button><br></div>');
		} else {
			 buttons = $('<div class="projectdetails-buttons"><button class="openproject script-button"><span class="explorer-control-icon">&#xf04b;</span>Open</button><button class="restoreproject script-button"><span class="explorer-control-icon">&#xf040;</span>Maker</button><br></div>');
		}

		buttons.on("click",".openproject", function() {
			me.remove();
			Eden.Project.load(projectid);
		});

		buttons.on("click",".deleteproject", function() {
			if (confirm("Are you sure you want to delete this project?")) {
				me.remove();
				Eden.DB.remove(projectid);
			}
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

EdenUI.ProjectDetails.searchProjects = function(output, query, count, cb) {
	if (!query) query = "";
	Eden.DB.search(query, function(data) {
		EdenUI.ProjectDetails._searchProjects(output, !query.startsWith(":me"), data , count);
		if (cb) cb(data);
	});
}

EdenUI.ProjectDetails._searchProjects = function(output, pub, projects, count) {
	var maxres = (count) ? count : 6;

	if (projects === undefined) return;

	for (var i=0; i<projects.length; i++) {
		if (i == maxres) {
			output.append($('<div class="cadence-plisting-entry more noselect"><div class="cadence-plisting-icon more">&#xf103;</div></div>'));
			output.on("click",".more",function(e) {
				output.html("");
				EdenUI.ProjectDetails._searchProjects(output, pub, projects, maxres + 6);
			});
			break;
		}

		var meta = projects[i];
		var t = meta.date.split(/[- :]/);
		var title = meta.title;
		var thumb = meta.image;
		//var tags = meta.tags;

		//if (meta.hidden) continue;

		var subtitle;
		if (pub) {
			subtitle = meta.ownername;
		} else {
			subtitle = get_time_diff((new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5])).getTime()/1000);
		}

		var ele;
		//Eden.DB.getMeta(path+"/"+x,function(path,meta) {
		if (thumb !== null) {
			ele = $('<div class="cadence-plisting-entry project noselect" data-pid="'+(meta.projectID)+'"><div class="cadence-plisting-img"><img src="'+thumb+'"></img></div><div class="cadence-plisting-title">'+title+'</div><div class="cadence-plisting-subtitle">'+subtitle+'</div></div>');
		} else {
			ele = $('<div class="cadence-plisting-entry project noselect" data-pid="'+(meta.projectID)+'"><div class="cadence-plisting-icon">&#xf0c3;</div><div class="cadence-plisting-title">'+title+'</div><div class="cadence-plisting-subtitle">'+subtitle+'</div></div>');
			//console.log(Eden.DB.meta[path+"/"+x]);
		}
		output.append(ele);
		//});

		var astars = (meta.overallRating !== null) ? meta.overallRating / meta.numRatings : 0;
		var rating = $('<div class="projectdetails-ratingsmall">\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
<span class="projectdetails-star">&#xf005;</span>\
</div>');
		ele.append(rating);
		var p=rating.get(0);
		if (astars) {
			var astarsf = Math.floor(astars);
			for (var j=0; j<5; j++) {
				p.childNodes[j].className = "projectdetails-star" + ((j >= astarsf) ? "" : " average");
			}
		}
	}
}

