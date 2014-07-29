/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Dependency Map Plugin.
 * Put description here
 * @class DM Plugin
 */

Eden.plugins.DM = function(context) {

	var me = this;

	this.html = function(name,content) {
			$("#"+"DM").html(content);
	}

	this.createDialog = function(name,mtitle) {

	name = "DM"
	mtitle = "Dependency Map [DM]"

		var code_entry = '<div id=\"DM\" class=\"DM-content\"><button id="#DMREFRESH" onclick=DM.generateGraph()>Re-generate Graph</button><canvas id="DMCANVAS" onclick=\"DM.generateGraph();\"></canvas></div>';
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: window.innerWidth-200,
				height: window.innerHeight-200,
				minHeight: 120,
				minWidth: 230
			});
	}
	

	//Register the DM options
	context.views["DM"] = {dialog: this.createDialog, title: "Dependency Map"};

};

/* Plugin meta information */
Eden.plugins.DM.title = "Dependency Map (DM)";
Eden.plugins.DM.description = "Displays a graph of the dependency between observables";
Eden.plugins.DM.author = "Joe Butler";


var DM = {};

DM.setCanvasWidth = function(){
	return window.innerWidth-250;
}
DM.setCanvasHeight = function(){
	return window.innerHeight-250;
}

DM.swapCanvas = function(){
	var canvas = document.getElementById("DMCANVAS");
	var parent = canvas.parentNode;
	parent.removeChild(canvas);
	var newCanvas = document.createElement("canvas");
	newCanvas.id = "DMCANVAS";
	parent.appendChild(newCanvas);
}

DM.generateGraph = function(){

	console.log("generation");
DM.swapCanvas();
	var db = SDM.getFilteredDatabase("SMOFA");
	var graph = new Springy.Graph();
	var nodes = {};

	//remove onclick generation functionality
	var canvas = document.getElementById("DMCANVAS");
	canvas.width = DM.setCanvasWidth();
	canvas.height = DM.setCanvasHeight();
	canvas.onclick = "";

	for(var i=0; i<db.length; i++){
		if(nodes[db[i].name]==undefined){
			nodes[db[i].name] = graph.newNode({label: db[i].name});
		}
		for(var j=0; j<db[i].dependantTo.length; j++){
			if(nodes[db[i].dependantTo[j]]==undefined){
				nodes[db[i].dependantTo[j]] = graph.newNode({label: db[i].dependantTo[j]});
			}
		}
	}//All Model Nodes Created

	for(var i=0; i<db.length; i++){
		for(var j=0; j<db[i].dependantTo.length; j++){
			graph.newEdge(nodes[db[i].name], nodes[db[i].dependantTo[j]]);
			nodes[db[i].name].edges = true;
			nodes[db[i].dependantTo[j]].edges = true
		}
	}//relationships made
	
	//filter out the nodes without edges
	var pred = function(node){
		return node.edges;
	}
	graph.filterNodes(pred);
	
	jQuery(function(){
		var springy = window.springy = jQuery('#DMCANVAS').springy({
			graph: graph,
			nodeSelected: function(node){
				//do nothing
			}
		});
	});

}