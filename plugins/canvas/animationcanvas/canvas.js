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
	q = me;

	var clearCanvas = function(content) {
		$(content).children(":not(canvas)").each(function(){
		//console.log(this);
		k = this;
			this.togarbage = true;
		//console.log(this.togarbage);
		});
	}

	var cleanupCanvas = function(content) {
	   $(content).children(":not(canvas)").each(function() {
	       if (this.togarbage == true) {
		   console.log(this);
	           $(this).remove();
	       }
	   });
	}

	this.render = function() {

		var observable = root.lookup(me.name);
		
		//console.log(observable)
		//Get the array of things to be drawn
		if(typeof observable.definition == "function"){
			var toDraw = me.toDraw = observable.definition();
		}else{
			var toDraw = me.toDraw = observable.cache.value;
		}
	

		//For all HTML elements: set to be destroyed; if the HTML element is drawn, this will be reversed for that particular element.
		clearCanvas(me.content);
		
		//Clear the native drawables
		me.ctx.clearRect(0,0,me.canvas.width,me.canvas.height);
		
		//Draw loop
		if(toDraw instanceof Array){
			for(var i=0; i<toDraw.length; i++){
				//console.log(toDraw[i].HTMLelement);
				toDraw[i].draw(me.ctx, me.content);
			}
		}
		
		//For each HTML element, if it wasnt drawn, and its destructor subsequently unset, then it will be removed.
		cleanupCanvas(me.content);

		//Call re-render properly
		window.webkitRequestAnimationFrame(me.render);
	};

	this.createDialog = function(name,mtitle) {
	
	
		me.name = name.replace("-dialog", "");
		me.mtitle = mtitle;
		
		//Creates the observable which it will get the array of drawables from
		root.lookup(me.name).assign([]);
	
		me.contentid = name+"-content"; // class = HTML5CONTENT
		me.canvasid = name+"-canvas"; // class = HTML5CANVAS
		
		me.internalCanvasResolutionHeight = 380+"px";
		me.internalCanvasResolutionWidth = 550+"px";

		//Make the HTML content div element
		me.content = contentdiv = $('<div id=\"'+me.contentid+'\" style="overflow:hidden; padding:1px;" class=\"HTML5CONTENT\"></div>');
		//Make the HTML canvas element
		me.canvas = canvasdiv = $('<canvas id="'+me.canvasid+'-canvas" style="width:100%; height:100%;" class="HTML5CANVAS" width="'+me.internalCanvasResolutionWidth+'" height="'+me.internalCanvasResolutionHeight+'"></canvas>');
		
		//Jquery Workaround
		me.content = me.content[0];
		me.canvas = me.canvas[0];
		me.ctx = me.canvas.getContext('2d');

		//Make the dialog
		$dialog = contentdiv
			.append(canvasdiv)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
			});
			
			console.log(me.canvas);
			console.log(me.content);
	}

	//Supported canvas views
	context.views["Canvas2D"] = {dialog: this.createDialog, title: "Canvas HTML5"};
	eden.executeFileSSI("plugins/canvas-html5/canvas.js-e");
	
	//Initial Call to Render
	window.webkitRequestAnimationFrame(me.render);
};

Eden.plugins.Canvas2D.title = "Canvas";
Eden.plugins.Canvas2D.description = "An HTML5 Canvas for EDEN Drawables";
Eden.plugins.Canvas2D.author = "Joe Butler";
