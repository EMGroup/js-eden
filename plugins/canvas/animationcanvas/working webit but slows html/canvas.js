/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class Canvas2D Plugin
 */

Eden.plugins.Canvas2D = function (context) {
	var me = this;

	var clearCanvas = function(content) {
		$(content).children(":not(canvas)").each(function() {
			this.togarbage = true;
		});
	}

	var cleanupCanvas = function(content) {

	   $(content).children(":not(canvas)").each(function() {
	       if (this.togarbage == true) {
		   console.log("removing:"+this)
	           var t = $(this);
			   console.log("REMOVING:");
			   console.log(t);
			   t.remove();
	       }
	   });

	}

	this.drawPicture = function(canvasname, pictureobs) {
	
		//Store the name of this canvas locally
		me.canvasName = canvasname;
		
		//Store a pointer to the list of observables to draw locally
		me.pictureobs = pictureobs;
		
		//if no name is specified, call it default
		if(me.canvasName==undefined){
			me.canvasName = "default"
		}

		//Create the view
		edenUI.createView(me.canvasName,"Canvas2D");
		
		//Store the canvas
		me.canvas = $("#"+me.canvasName+"-dialog-canvas")[0];
		
		//Store the content
		me.content = $("#"+me.canvasName+"-dialog-canvascontent")[0];

		//Store the context
		me.context = me.canvas.getContext('2d');

		//Start rendering
		me.render();

	};
	
	me.render = function(){
		
		//Get the observables to draw
		var picture = root.lookup(me.pictureobs).value();

		//Clear the canvas
		me.canvas.width = me.canvas.width;

		//Manage the content which needs to be removed
		clearCanvas(me.content);

		//Sanity
		if (picture === undefined) { return; }

		//Draw items to be drawn
		for (var i = 0; i < picture.length; i++) {
			if (picture[i] === undefined) { continue; }
			picture[i].draw(me.context, me.content);
		}
			
		//Manage the content which needs to be removed
		cleanupCanvas(me.content);

		//Call render again
		window.webkitRequestAnimationFrame(me.render)		
	
	}

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
			root.lookup('mousePosition').assign(root.lookup('Point').value().call(this, x, y));
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

					//Now need to redraw the canvas.
					eden.execute("drawPicture();");
				},
			});
	}

	//Supported canvas views
	context.views["Canvas2D"] = {dialog: this.createDialog, title: "Canvas HTML5"};

	eden.executeFileSSI("plugins/canvas-html5/canvas.js-e");
};

Eden.plugins.Canvas2D.title = "Canvas HTML5";
Eden.plugins.Canvas2D.description = "Provides an Eden drawable HTML5 canvas";
Eden.plugins.Canvas2D.author = "Nicolas Pope et. al.";
