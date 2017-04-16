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

	this.sharebox.on("change", "#thumbfile", function(e) {
		var thumb = me.sharebox.find("#projectthumb");
		var thumbinput = $("#thumbfile");
		thumb.html("<img></img>");
		var fileinput = thumbinput.get(0);
		var file = fileinput.files[0];
		console.log("THUMB FILE",file);
		var reader = new FileReader();
		reader.onload = function(e) {
			//Eden.loadFromString(e.target.result);
			var tcanvas = document.createElement("canvas");
			tcanvas.setAttribute("width","200");
			tcanvas.setAttribute("height","112");
			var ctx = tcanvas.getContext("2d");
			var img = new Image();

			img.onload = function() {
			
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

				console.log("Re-render image as " + xStart + ", " + yStart + ", " + renderableWidth + ", " + renderableHeight);

				ctx.drawImage(img, xStart, yStart, renderableWidth, renderableHeight);
				var png = tcanvas.toDataURL("image/png");
				me.thumbdata = png;
				//var thumbimg = $("<img></img>");
				//thumb.append(thumbimg);
				thumb.get(0).childNodes[0].src = png;
			}

			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	});


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
					var url = "?load="+eden.project.id+"&vid="+eden.project.vid+"&r="+eden.project.readPassword;
					window.history.replaceState({id: eden.project.id, vid: eden.project.vid},"",url);
					me.sharebox.find(".projecturl").html('<div class="sharebox-url">'+window.location.href+'</div><iframe src="https://www.facebook.com/plugins/share_button.php?href='+encodeURIComponent(window.location.href)+'&layout=button&size=small&mobile_iframe=true&appId=1447073055317881&width=59&height=20" width="59" height="20" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>');
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

	this.sharebox.on("click",".fork", function(e) {
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
			if (eden.project.id) eden.project.parentid = eden.project.id;
			eden.project.id = undefined;
			eden.project.vid = undefined;
			eden.project.setDescription(desc);
			console.log("FORK", listed, desc);
			eden.project.save(listed, function(status) {
				if (status) {
					var url = "?load="+eden.project.id+"&vid="+eden.project.vid;
					window.history.replaceState({id: eden.project.id, vid: eden.project.vid},"",url);
					me.sharebox.find(".projecturl").html('<div class="sharebox-url">'+window.location.href+'</div><iframe src="https://www.facebook.com/plugins/share_button.php?href='+encodeURIComponent(window.location.href)+'&layout=button&size=small&mobile_iframe=true&appId=1447073055317881&width=59&height=20" width="59" height="20" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>');
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
		if (eden.project.authorid != Eden.DB.userid && eden.project.authorid != -1) {
			me.sharebox.find("#projectuploadbox").html('<div id="projectthumb"></div><div style="margin-top: 40px; float: left"><input id="listpublic" type="checkbox">List publically</input></div>Thumbnail: <input id="thumbfile" type="file"></input><div class="sharebox-save-buttons"><button class="sharebox-button fork">Fork</button><span class="downloadurl"></span></div>'); //<button class="sharebox-button publish" style="margin-top: 20px;">Publish</button>');
		} else {
			me.sharebox.find("#projectuploadbox").html('<div id="projectthumb"></div><div style="margin-top: 40px; float: left"><input id="listpublic" type="checkbox">List publically</input></div><input id="thumbfile" type="file"></input><div class="sharebox-save-buttons"><button class="sharebox-button upload">Save</button><button class="sharebox-button fork">Fork</button><span class="downloadurl"></span></div>'); //<button class="sharebox-button publish" style="margin-top: 20px;">Publish</button>');
		}		
		me.sharebox.find("#projectoptions").show();
	} else {
		me.sharebox.find("#projectuploadbox").html('<div class="sharebox-save-buttons"><span class="downloadurl"></span></div>');
		me.sharebox.find("#projectoptions").hide();
	}

	var thumb = this.sharebox.find("#projectthumb");
	//projectoptions.append(thumb);
	this.thumbdata = undefined;
	this.thumbimg = $("<img></img>");
	this.thumbimg.get(0).style.border = "1px solid #aaa";
	this.thumbimg.get(0).style.marginRight = "10px";
	thumb.append(this.thumbimg);

	if (eden.project.thumb) {
		me.thumbdata = eden.project.thumb;
		me.thumbimg.get(0).src = eden.project.thumb;
	} else {
		me.thumbdata = undefined;
	}

	//Saved to your projects and shared at:<div class="projecturl"></div>

	if (eden.project.id === undefined) {
		eden.project.tags = (eden.project.title.toLowerCase()+" "+((Eden.DB.isLoggedIn()) ? Eden.DB.username.toLowerCase(): "")).split(" ");
	}
	//var tags = eden.project.tags;

	me.markdown.setValue(eden.project.getDescription());

	me.projectsource = eden.project.generate();
	var source = "data:application/octet-stream," + encodeURIComponent(me.projectsource);
	me.sharebox.find(".downloadurl").html('<a class="sharebox-button download" href="'+source+'" download="'+title+'.js-e">File</a>');
}

