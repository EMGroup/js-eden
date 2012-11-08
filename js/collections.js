var collections;

function get_collections() {
	$.ajax({
		url: "server/jse_collections.rhtml",
		success: function(data) {
			collections = JSON.parse(data);
			//collections = data;
			printCollections("");
		},
		cache: false,
		async: true
	});
}

function printCollections(pattern) {
	if (collections === undefined) return;

	procspos = 0;

	$('#project-results').html('');
	var reg = new RegExp("^"+pattern+".*");
	var i = 0;
	while (projects.projects[i] !== undefined) {
		if (projects.projects[i].name.search(reg) == -1) { i = i + 1; continue; }

		var proj = $('<div class="result-element"></div>');
		proj[0].project = projects.projects[i];
		proj.html("<li class=\"type-project\">" + projects.projects[i].name  + "<span class='result_value'> by " + projects.projects[i].author + " (" + projects.projects[i].year + ")</span></li>").appendTo($('#project-results'));

		i = i + 1;
	}

	//Now display sessions
	i = 0;
	while (collections.sessions[i] !== undefined) {
		if (collections.sessions[i].title.search(reg) == -1) { i = i + 1; continue; }

		var sess = $('<div class="result-element"></div>');
		sess[0].session = collections.sessions[i];
		sess.html("<li class=\"type-session\">" + collections.sessions[i].title + "</li>").appendTo($('#project-results'));

		i = i + 1;
	}

	$("#project-results > div").hover(
		function() {
			if (this != selected_project) {
				$(this).animate({backgroundColor: "#eaeaea"}, 100);
			}
		}, function() {
			if (this != selected_project) {
				$(this).animate({backgroundColor: "white"}, 100);
			}
		}	
	).click(function () {
		if (selected_project != null) {
			$(selected_project).animate({backgroundColor: "white"}, 100);
		}
		selected_project = this;
		$(this).animate({backgroundColor: "#ffebc9"}, 100);

		if (this.project !== undefined) {
			Eden.executeFile(this.project.runfile);
		} else {
			session_connect(this.session.cid);
		}
		printAllUpdates();
	});

	if ($('#project-results')[0].offsetHeight > (14*16)) {
		$('#project-scrollup').show();
		$('#project-scrolldown').show();
	} else {
		$('#project-scrollup').hide();
		$('#project-scrolldown').hide();
	}
}
