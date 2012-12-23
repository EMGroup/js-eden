/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class CanvasHTML5 Plugin
 */
Eden.plugins.CanvasHTML5 = function(context) {
	this.createDialog = function(name,mtitle) {
		code_entry = $('<div id=\"eden-content\"></div>');
		code_entry.html("<canvas id=\""+"d1canvas"+"\" width=\"550px\" height=\"380px\"></canvas>");
		code_entry.on("mousedown",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			context.context.lookup('mousePressed').assign(true);
			context.context.lookup('mouseDown').assign(root.lookup('Point').value().call(this, x, y), this);
		}).on("mouseup",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			context.context.lookup('mousePressed').assign(false);
			context.context.lookup('mouseUp').assign(root.lookup('Point').value().call(this, x, y), this);
		}).on("mousemove",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			context.context.lookup('mouseX').assign(x);
			context.context.lookup('mouseY').assign(y);
		}).on("click",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			context.context.lookup('mouseClickX').assign(x);
			context.context.lookup('mouseClickY').assign(y);
		});

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				resizeStop: function(event,ui) {
					console.log(ui.size);
					$("#d1canvas").attr("width", (ui.size.width-50)+"px").attr("height", (ui.size.height-70)+"px");

					//Now need to redraw the canvas.
					//TODO: Dont use eden
					try {
						eval(Eden.translateToJavaScript("drawPicture();"));
					} catch(e) {
						console.error(e);
					}
				},
			});
	}

	//Supported canvas views
	context.views["CanvasHTML5"] = {dialog: this.createDialog, title: "Canvas HTML5"};

	Eden.executeFileSSI("plugins/canvas-html5/canvas.js-e");
};

Eden.plugins.CanvasHTML5.title = "Canvas HTML5";
Eden.plugins.CanvasHTML5.description = "Provides an Eden drawable HTML5 canvas";
Eden.plugins.CanvasHTML5.author = "Nicolas Pope et. al.";
