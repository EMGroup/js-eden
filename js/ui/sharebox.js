EdenUI.Sharebox = function(element) {
	var me = this;
	this.title = undefined;
	this.visible = false;

	this.sharebox = element;
	this.sharebox.html('<div class="menubar-sharebox-title"><span class="menubar-shareicon">&#xf1e0;</span>Save and Share</div><div class="menubar-sharebox-content"><div id="projectoptions"></div><div id="projectuploadbox"></div></div>');
	//this.element.append(this.sharebox);
	//this.sharebox.hide();
	var projectoptions = this.sharebox.find("#projectoptions");
	//projectoptions.html('<span>Tags</span><div class=\"projecttags\" contenteditable></div><h3>Thumbnail</h3><div><input class="thumbnailtype" type="radio" name="thumbnail" value="auto" checked>Default</input><input class="thumbnailtype" type="radio" name="thumbnail" value="canvas">Canvas</input><input class="thumbnailtype" type="radio" name="thumbnail" value="manual">File</input><div id="projectthumb"></div></div><h3>Description</h3><div><textarea></textarea></div>');
	/*projectoptions.accordion({
		collapsible: true,
		heightStyle: "content",
		speed: "fast",
		classes: {
			"ui-accordian-header": "ui-corner-top sharebox-header",
			"ui-accordian-header-collapsed": "ui-corner-all sharebox-header-collapsed"
		}
	});*/
	this.markdown = new EdenUI.Markdown("");
	projectoptions.get(0).appendChild(this.markdown.contents);

	var thumb = projectoptions.find("#projectthumb");
	this.thumbdata = undefined;
	this.thumbimg = $("<img></img>");
	thumb.append(this.thumbimg);

	this.sharebox.on("change",".thumbnailtype", function(e) {
		var ttype = e.currentTarget.value;
		if (ttype == "manual") {
			thumb.html("");
			var thumbinput = $('<input type="file"></input>');
			thumb.append(thumbinput);
			thumbinput.change(function() {
				thumb.html("");
				var fileinput = thumbinput.get(0);
				var file = fileinput.files[0];
				var reader = new FileReader();
				reader.onload = function(e) {
					//Eden.loadFromString(e.target.result);
					var tcanvas = document.createElement("canvas");
					tcanvas.setAttribute("width","200");
					tcanvas.setAttribute("height","112");
					var ctx = tcanvas.getContext("2d");
					var img = new Image();
					img.src = e.target.result;


					var imgwidth = img.width;
					var imgheight = img.height;
					var canwidth = 200;
					var canheight = 112;

					var imageAspectRatio = imgwidth / imgheight;
					var canvasAspectRatio = canwidth / canheight;
					var renderableHeight, renderableWidth, xStart, yStart;

					// If image's aspect ratio is less than canvas's we fit on height
					// and place the image centrally along width
					if(imageAspectRatio < canvasAspectRatio) {
						renderableHeight = canheight;
						renderableWidth = imgwidth * (renderableHeight / imgheight);
						xStart = (canwidth - renderableWidth) / 2;
						yStart = 0;
					}

					// If image's aspect ratio is greater than canvas's we fit on width
					// and place the image centrally along height
					else if(imageAspectRatio > canvasAspectRatio) {
						renderableWidth = canwidth
						renderableHeight = imgheight * (renderableWidth / imgwidth);
						xStart = 0;
						yStart = (canheight - renderableHeight) / 2;
					}

					// Happy path - keep aspect ratio
					else {
						renderableHeight = canheight;
						renderableWidth = canwidth;
						xStart = 0;
						yStart = 0;
					}

					ctx.drawImage(img, xStart, yStart, renderableWidth, renderableHeight);
					var png = tcanvas.toDataURL("image/png");
					me.thumbdata = png;
					var thumbimg = $("<img></img>");
					thumb.append(thumbimg);
					thumbimg.get(0).src = png;
				};
				reader.readAsDataURL(file);
			});
		} else if (ttype == "canvas") {
			thumb.html("");
			me.thumbdata = undefined;
		} else if (ttype == "auto") {
			thumb.html("");
			var thumbimg = $("<img></img>");
			thumb.append(thumbimg);
			// Generate the default thumbnail...
			edenUI.plugins.Canvas2D.thumbnail(function(png) {
				me.thumbdata = png;
				thumbimg.get(0).src = png;
			});
		}
	});

	function updateTags() {
		var tagbox = me.sharebox.find(".projecttags");

		var tagstr = tagbox.get(0).textContent;

		tags = tagstr.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
		/*for (var i=0; i<tags.length; i++) {
			if (tags[i].charAt(0) != "#") tags[i] = "#" + tags[i];
		}*/

		if (tags && tags.length > 0) {
			var taghtml = "";
			for (var i=0; i<tags.length; i++) {
				taghtml += "<span class=\"project-tag\">" + tags[i] + "</span>";
				if (i < tags.length-1) taghtml += " ";
			}
			tagbox.html(taghtml);
		}
	}

	this.sharebox.on("keydown",".projecttags",function(e) { if (e.keyCode == 32) {
		var tagbox = me.sharebox.find(".projecttags").get(0);

		var spacer = document.createTextNode(" ");
		tagbox.appendChild(spacer);
		var newElement = document.createElement('span');
		newElement.className = "project-tag";
		newElement.innerHTML = "&#8203;";
		tagbox.appendChild(newElement);

		var range = document.createRange();
		var sel = window.getSelection();
		//var currange = sel.getRangeAt(0);
		//var element = currange.startContainer();
		range.selectNodeContents(newElement);
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);

		e.preventDefault();
	} });
	this.sharebox.on("blur",".projecttags",updateTags);

	this.sharebox.on("click",".upload", function(e) {
		//var title = me.element.find(".jseden-title").get(0).textContent;
		var title = me.title.textContent;
		var desc = me.markdown.intextarea.value;
		var listed = $("#listpublic").get(0).checked;

		if (title == "New Project") {
			me.sharebox.find("#projectuploadbox").html('Please give your project a name by editing the "New Project" title in the top left.');
			return;
		} else {
			me.sharebox.find("#projectuploadbox").html('Saved to your projects and shared at:<div class="projecturl">Saving...</div>');
		}
		//Eden.Agent.uploadAll(function() {
			//console.log("ALL UPLOADED");
			eden.project.thumb = me.thumbdata;
			eden.project.setDescription(desc);
			console.log("SAVE", listed, desc);
			eden.project.save(listed, function(status) {
				if (status) {
					var url = "?load="+eden.project.id+"&vid="+eden.project.vid;
					window.history.replaceState({id: eden.project.id, vid: eden.project.vid},"",url);
					me.sharebox.find(".projecturl").html(window.location.href+url+'<br><iframe src="https://www.facebook.com/plugins/share_button.php?href=http%3A%2F%2Fjseden.dcs.warwick.ac.uk%2Fnick%2Findex-dev.html&layout=button&size=small&mobile_iframe=true&appId=1447073055317881&width=59&height=20" width="59" height="20" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>');
					//function selectElementContents(el) {
					var range = document.createRange();
					range.selectNodeContents(me.sharebox.find(".projecturl").get(0));
					var sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					//}
				} else {
					me.sharebox.find(".projecturl").html('<b>Save failed</b>, not logged in.');
				}
			});
		//});
	});

	/*this.sharebox.on("click",".publish", function(e) {
		//var title = me.element.find(".jseden-title").get(0).textContent;
		var title = me.title.textContent;
		var tagbox = me.sharebox.find(".projecttags");
		var tagstr = tagbox.get(0).textContent.replace(/\u200B/g,"");
		tagstr = tagstr.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");

		if (title == "New Project") {
			me.sharebox.find("#projectuploadbox").html('<br/><br/>Please give your project a name by editing the "New Project" title in the top left.');
			return;
		} else {
			me.sharebox.find("#projectuploadbox").html('<br/><br/>Saved to your projects and shared at:<div class="projecturl">Saving...</div>');
		}
		//Eden.Agent.publishAll(function() {

		eden.project.thumb = me.thumbdata;
		eden.project.tags = tagstr;

		eden.project.save(true, function(status) {
			console.log("SAVED");
			if (status) {
				var url = "?load="+eden.project.id+"&vid="+eden.project.vid;
				window.history.replaceState({id: eden.project.id, vid: eden.project.vid},"",url);
				me.sharebox.find(".projecturl").html(window.location.href+url);
				//function selectElementContents(el) {
				var range = document.createRange();
				range.selectNodeContents(me.sharebox.find(".projecturl").get(0));
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
				//}
			} else {
				me.sharebox.find(".projecturl").html('<b>Save failed</b>, not logged in.');
			}
		});
		//});
	});*/
}

EdenUI.Sharebox.prototype.show = function() {
	if (!this.visible) this.update();
	this.visible = true;
}

EdenUI.Sharebox.prototype.hide = function() {
	this.visible = false;
}

EdenUI.Sharebox.prototype.update = function() {
	var me = this;
	if (me.title === undefined) me.title = $(document).find(".jseden-title").get(0);
	//var title = me.element.find(".jseden-title").get(0).textContent;
	var title = me.title.textContent;

	if (Eden.DB.isLoggedIn()) {
		me.sharebox.find("#projectuploadbox").html('<div id="projectthumb"></div><input id="listpublic" type="checkbox" checked>List publically</input>Thumbnail: <input type="file"></input><br/><div class="sharebox-save-buttons"><button class="sharebox-button upload">Save</button><span class="downloadurl"></span></div>'); //<button class="sharebox-button publish" style="margin-top: 20px;">Publish</button>');
		me.sharebox.find("#projectoptions").show();
	} else {
		me.sharebox.find("#projectuploadbox").html('<span class="downloadurl"></span>');
		me.sharebox.find("#projectoptions").hide();
	}
	//me.sharebox.show();

	// Generate the default thumbnail...
	edenUI.plugins.Canvas2D.thumbnail(function(png) {
		me.thumbimg.get(0).src = png;
		me.thumbdata = png;
	});

	//Saved to your projects and shared at:<div class="projecturl"></div>

	if (eden.project.id === undefined) {
		eden.project.tags = (eden.project.title.toLowerCase()+" "+((Eden.DB.isLoggedIn()) ? Eden.DB.username.toLowerCase(): "")).split(" ");
	}
	var tags = eden.project.tags;

	/*if (tags === undefined || tags.length == 0) {
		tags = title.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
		//console.log(tags);
		//for (var i=0; i<tags.length; i++) tags[i] = "#" + tags[i];
		//Eden.DB.meta[status.path].tags = tags;
		if (Eden.DB.isLoggedIn()) {
			var nametags = Eden.DB.username.toLowerCase().replace(/[\!\'\-\?\&]/g, "").split(" ");
			tags.push.apply(tags,nametags);
		}
	}*/

	if (tags && tags.length > 0) {
		var taghtml = "";
		for (var i=0; i<tags.length; i++) {
			taghtml += "<span class=\"project-tag\">" + tags[i] + "</span>";
			if (i < tags.length-1) taghtml += " ";
		}
		me.sharebox.find(".projecttags").html(taghtml);
	}

	me.markdown.setValue(eden.project.getDescription());

	me.projectsource = eden.project.generate();
	var source = "data:application/octet-stream," + encodeURIComponent(me.projectsource);
	me.sharebox.find(".downloadurl").html('<a class="sharebox-button download" href="'+source+'" download="'+title+'.js-e">File</a>');
}

