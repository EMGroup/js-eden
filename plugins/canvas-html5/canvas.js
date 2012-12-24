/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class CanvasHTML5 Plugin
 */
Eden.plugins.CanvasHTML5 = function(context) {
	this.clearCanvas = function(canvasname) {
		$("#"+canvasname+"-dialog-canvascontent > :not(canvas)").each(function() {
			if(/canvas_/.test(this.id)) {
				this.togarbage = true;
			}
		});
	}

	this.cleanupCanvas = function(canvasname) {
		$("#"+canvasname+"-dialog-canvascontent > :not(canvas)").each(function() {
			if (this.togarbage == true) {
				$(this).remove();
			}
		});
	}

	this.drawPicture = function(canvasname, pictureobs) {
		console.log("DrawPicture: " + canvasname);

		var picture = context.context.lookup(pictureobs).value();
		var canvas = $("#"+canvasname+"-dialog-canvas");
		if (canvas.length == 0) {
			//Need to make the canvas view first
			console.log("Making a new canvas: "+canvasname);
			eden.createView(canvasname,"CanvasHTML5");
			canvas = $("#"+canvasname+"-dialog-canvas");
		}
		canvas = canvas.get(0).getContext('2d');

		if (picture === undefined) { return; }

		for (var i = 0; i < picture.length; i++) {
			if (picture[i] === undefined) { continue; }
				picture[i].draw(canvas);
		}
	};

	this.createDialog = function(name,mtitle) {
		code_entry = $('<div id=\"'+name+'-canvascontent\"></div>');
		code_entry.html("<canvas class=\"canvashtml-canvas\" id=\""+name+"-canvas\" width=\"550px\" height=\"380px\"></canvas>");
		code_entry.find(".canvashtml-canvas").on("mousedown",function(e) {
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
