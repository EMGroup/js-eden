
function printCollections(pattern) {
	procspos = 0;

	$('#project-results').html('');
	var reg = new RegExp("^"+pattern+".*");
	var i = 0;
	while (projects.projects[i] !== undefined) {
		if (projects.projects[i].name.search(reg) == -1) { i = i + 1; continue; }

		var proj = $('<div class="result-element"></div>');
		proj[0].project = projects.projects[i];
		proj.html("<li class=\"type-project\"><span class=\"result_name\">" + projects.projects[i].name  + "</span><span class='result_value'> by " + projects.projects[i].author + " (" + projects.projects[i].year + ")</span></li>").appendTo($('#project-results'));

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
			//session_connect(this.session.cid);
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
