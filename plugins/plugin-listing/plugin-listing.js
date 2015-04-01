/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.PluginManager = function (edenUI, success) {
	
	this.displayAbout = function () {
		edenUI.plugins.HTMLContent.html("About_JSEDEN",
			'<h1>About JS-EDEN</h1> \
			<h2>Status of JS-EDEN</h2> \
			<p>JS-EDEN is an open source empirical modelling environment that anyone can contribute to.  It is based on a long history of research, principles and work developed at University of Warwick, Coventry, United Kingdom.  As of March 2015 recently active developers include Jonny Foss, Elizabeth Hudnott and Tim Monks.  Warwick University retains an active interest in JS-EDEN through the <a href="http://www.construit.org" target="_blank">CONSTRUIT! project</a>, which began in October&nbsp;2014 and brings together Warwick and five other partners spread across the EU to build construals and deploy them as open educational resources.  The connections with Warwick and its partners provide much valuable feedback that guides the software development.</p> \
			<h2>JS-EDEN Web Pages</h2> \
			<ul> \
				<li><a href="http://jseden.dcs.warwick.ac.uk/construit">Latest stable version</a></li>\
				<li><a href="http://emgroup.github.io/js-eden">Development version</a></li>\
				<li><a href="https://github.com/EMGroup/js-eden/issues" target="_blank">Bug reports</a></li>\
				<li><a href="https://groups.google.com/forum/#!forum/jseden" target="_blank">Discussion group</a></li>\
				<li><a href="https://github.com/EMGroup/js-eden" target="_blank">Source code on GitHub</a></li>\
			</ul> \
			<h2>A Brief History of JS-EDEN</h2> \
			<p>JS-EDEN was created by Tim Monks in 2010&ndash;11 as the topic of his MSc thesis.  The user interface was improved during July 2012 by Joe Butler, Matt Cranham, Hui Zhu and others.  This summer project resulted in a version of JS-EDEN codenamed "emile".  Emile was successfully used to teach students of the CS405 Empirical Modelling module at Warwick during autumn term 2012.  The current user interface was mostly developed by Nick Pope and a version with this style of interface was used to teach Warwick students during autumn term 2013.  Very little code from the emile version remains in the current version apart from the core functionality retained from Tim Monks\' original code.  However, the emile project was essential for proving JS-EDEN\'s value as a educational tool.</p> \
			<p>Tim Monks and Nick Pope established JS-EDEN as an open source project on GitHub.  All of the supportive infrstructure that\'s present in the background such as the automated testing frameworks are down to Tim Monks\' careful discipline.</p> \
			<p>Since at least autumn 2013 there has always been someone who was the go-to person people approached whenever they needed a bug fixing or simply had to have a new feature added urgently.  At different points in time several different people have taken on this role and without them the project may not have succeeded.  Joe Butler admirably provided this form of technical support to the tutors during the 2013/14 academic year and at a time when it was critical that JS-EDEN worked properly for the students who were completing their coursework.  Tim Monks has also fixed a lot of bugs and helped Elizabeth Hudnott get up to speed.  We all very much indebted to Tim and there are still some parts of the code that only Tim knows how to troubleshoot.  As of March 2015 Elizabeth is the go-to person, providing technical support to fellow members of the CONSTRUIT! project.  Joking aside, the official place to report bugs to the development team is the <a href="https://github.com/emgroup/js-eden/issues" target="_blank">GitHub issues list</a>.</p> \
			<p>Anthony Harfield has created a simplified version of JS-EDEN that has been used to teach primary school age children in Thailand.</p> \
			<p>None of this would have been possible without the imense inspiration and guidance of Meurig Beynon.  Steve Russ, Ashley Ward and Carl King have also provided valuable insights.  Credit is also due to Edward Yung and everyone else who worked on tkeden, the predecessor to JS-EDEN.</p>\
			<h2>Contributors of Specific Features</h2> \
			<ul> \
				<li>The EDEN language compiler and the JS-EDEN dependency maintainer were created by Tim Monks in 2010&ndash;11 as the topic of his MSc thesis.  These components remain at the core of everything that JS-EDEN does and Tim\'s work is of such outstanding quality that the core functionality always works reliably and seldom requires others to make improvements.  One small improvement is that Elizabeth Hudnott added support for EDEN\'s eval() feature, which was previously absent from JS-EDEN.</li> \
				<li>The windowed user interface was created by Nick Pope.  Some subsequent ehancements have been made by Tim Monks, Jonny Foss and Elizabeth Hudnott.</li> \
				<li>The canvas drawing capabilities have evolved as a combination of independent efforts made over the years by Joe Butler, Elizabeth Hudnott, Tim Monks and Nick Pope.</li> \
				<li>Most of the system library was written by Elizabeth Hudnott.</li> \
				<li>The Dependency Map, State Time Line, Script Generator and Symbol Look-Up Table views were created by Joe Butler in 2013&ndash;14 for his Bachelors dissertation.  Hyperlinks were later added to the symbol look-up table by Elizabeth Hudnott, along with some improvements to the script generator, agent list, function list, observable list and symbol list.</li> \
				<li>The JSPE was created by Matt Cranham.</li> \
				<li>Ruth King created the ADM plug-in in 2013&ndash;14 for her coursework project as part of the Masters level module CS405 Empirical Modelling at University of Warwick.  It remains an outstanding piece of work that nobody has been able to improve upon.</li> \
				<li>Jonny Foss created the state listener and window layout tool.  The state listeneer has been an essential tool for the CONSTRUIT! project because i enables collaborative work sessions to take place over the internet between partners at geographically distance locations.  Jonny Foss and Elizabeth Hudnott have also worked together to add support for expression tree input.</li> \
				<li>Support for mixing JavaScript and EDEN code is a combination of efforts by Tim Monks (${{&hellip;}}$ and {&hellip;}), Nick Pope (declare_jse), and Elizabeth Hudnott (JS Observers).</li> \
			</ul> \
		');
	};
	
	this.createDialog = function (name, mtitle) {
		var $pluginList = $('<div class="projectlist-result-element"></div>');
		var pluginInfo;
		var pluginName;
		var wording;

		var loadedHtml = function (pluginName) {
			return edenUI.plugins[pluginName] ? "(loaded)" : "(not loaded)";
		};

		pluginNames = Object.keys(EdenUI.plugins).sort(function (a, b) {
			var aLoaded = edenUI.plugins[a];
			var bLoaded = edenUI.plugins[b];
			if (aLoaded && !bLoaded) {
				return 1;
			} else if (bLoaded && !aLoaded) {
				return -1;
			} else if (a < b) {
				return -1;
			} else if (a == b) {
				return 0;
			} else {
				return 1;
			}
		});
		
		for (var i = 0; i < pluginNames.length; i++) {
			pluginName = pluginNames[i];
			pluginInfo = EdenUI.plugins[pluginName];
			var pluginHTML =
				'<li class="type-project">' +
					'<div class="projectlist-result_name">' +
						pluginInfo.title +
					"</div>" +
					"<div class='projectlist-result_value'>" +
						pluginInfo.description +
					"</div>";
			if (pluginInfo.originalAuthor !== undefined) {
				pluginHTML = pluginHTML +
					"<div class='projectlist-result_value'>" +
						"Original version by " + pluginInfo.originalAuthor +
					"</div>";
			}
			if (pluginInfo.author !== undefined) {
				if (pluginInfo.originalAuthor === undefined) {
					wording = "By ";
				} else {
					wording = "Built on by ";
				}
				pluginHTML = pluginHTML +
					"<div class='projectlist-result_value'>" +
						wording + pluginInfo.author +
					"</div>";
			}
			pluginHTML = pluginHTML +
					'<div class="pluginlist-loaded projectlist-result_value">' +
						loadedHtml(pluginName) +
					"</div>" +
				"</li>"

			$(pluginHTML).click((function (pluginName) {
				return function () {
					var el = this;
					$(this).animate({backgroundColor: "#dbe5f1"}, 100);
					edenUI.loadPlugin(pluginName, function () {
						$(el).find('.pluginlist-loaded').html(loadedHtml(pluginName));
						edenUI.plugins.MenuBar.updateViewsMenu();
					});
				};
			}(pluginName))).hover(
				function() {
					$(this).stop().animate({backgroundColor: "#f2f2f2"}, 100);
				}, function() {
					$(this).stop().animate({backgroundColor: "#eaeaea"}, 100);
				}	
			).appendTo($pluginList);
		}

		var $dialogContents = $(
			'<div><a href="javascript:edenUI.plugins.PluginManager.displayAbout()">About JS-EDEN</a></div>' +
			'<div class="projectlist-listing">'+
				'<div class="projectlist-results">'+
				'</div>'+
			'</div>'
		);

		$dialogContents
			.find('.projectlist-results')
			.append($pluginList);

		$dialog = $('<div id="'+name+'"></div>')
			.html($dialogContents)
			.dialog({
				title: mtitle,
				width: 310,
				height: 400,
				minHeight: 120,
				minWidth: 230,
				position: ['right','top'],
			});
	};

	edenUI.views["PluginManager"] = {dialog: this.createDialog, title: "Plug-in Manager", category: edenUI.viewCategories.environment};
	success();
};

/* Plugin meta information */
EdenUI.plugins.PluginManager.title = "Plug-in Manager";
EdenUI.plugins.PluginManager.description = "Provides the ability to load plug-ins.";
