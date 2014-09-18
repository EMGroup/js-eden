/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class CanvasHTML5 Plugin
 */

EdenUI.plugins.CanvasHTML5 = function (edenUI) {
	var me = this;

	var clearCanvas = function(content) {

		$(content).children(":not(canvas)").each(function() {
			//XXX What is this check for?? To prevent destruction of child divs
			//if(/canvas_/.test(this.id)) {
				this.togarbage = true;
			//}
		});
	}

	var cleanupCanvas = function(content) {

	   $(content).children(":not(canvas)").each(function() {
	       if (this.togarbage == true) {
	           $(this).remove();
	       }
	   });

	}


	canvases = {};
	contents = {};

	this.delay = 40;

	this.drawPicture = function(canvasname, pictureobs) {

		var canvas = canvases[canvasname];

		if (canvas === undefined) {
			//Need to make the canvas view first
			edenUI.createView(canvasname,"CanvasHTML5");
			
			canvases[canvasname] = $("#"+canvasname+"-dialog-canvas")[0];
			contents[canvasname] = $("#"+canvasname+"-dialog-canvascontent")[0];
			canvas = canvases[canvasname];
			canvas.drawing = false;
		}

		if (!canvas.drawing){

			canvas.drawing = true;
			setTimeout(function(){

			canvas.drawing = false;
			
			var picture = root.lookup(pictureobs).value();

			//To clear canvas.
			canvas.width = canvas.width;

		    canvas = canvas.getContext('2d');
		    var content = contents[canvasname];

		    clearCanvas(content);

			if (picture === undefined) { return; }

			for (var i = 0; i < picture.length; i++) {

				if (picture[i] === undefined) { continue; }
				picture[i].draw(canvas,content);
			}
			cleanupCanvas(content);

		},me.delay);
		}
	};

	this.createDialog = function(name,mtitle) {

		code_entry = $('<div id=\"'+name+'-canvascontent\" class=\"canvashtml-content\"></div>');
		code_entry.html("<canvas class=\"canvashtml-canvas\" id=\""+name+"-canvas\" width=\"550px\" height=\"380px\"></canvas>");
		code_entry.find(".canvashtml-canvas").on("mousedown",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			root.lookup('mousePressed').assign(true);
			root.lookup('mouseDown').assign(root.lookup('Point').value().call(this, x, y), this);
		}).on("mouseup",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			root.lookup('mousePressed').assign(false);
			root.lookup('mouseUp').assign(root.lookup('Point').value().call(this, x, y), this);
		}).on("mousemove",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			root.lookup('mouseX').assign(x);
			root.lookup('mouseY').assign(y);
		}).on("click",function(e) {
			pos = $(this).offset();
			x = e.pageX - pos.left;
			y = e.pageY - pos.top;
			root.lookup('mouseClickX').assign(x);
			root.lookup('mouseClickY').assign(y);
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
					$("#"+name+"-canvas").attr("width", (ui.size.width-50)+"px").attr("height", (ui.size.height-70)+"px");

					// Now need to redraw the canvas.
					edenUI.eden.execute("drawPicture();");
				},
			});
	}

	//Supported canvas views
	edenUI.views["CanvasHTML5"] = {dialog: this.createDialog, title: "Canvas HTML5"};

	edenUI.eden.executeFileSSI("plugins/canvas-html5/canvas.js-e");
};

EdenUI.plugins.CanvasHTML5.title = "Canvas HTML5";
EdenUI.plugins.CanvasHTML5.description = "Provides an Eden drawable HTML5 canvas";
EdenUI.plugins.CanvasHTML5.author = "Nicolas Pope et. al.";
