Eden.plugins.DM = function(context){

	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
	//This doesn't look like its ever being called
		if (name == "DEFAULT") {
			if (defaultview == "") {
				context.createView(name,"DM");
			}
			$("#"+defaultview+"-content").html(content).onclick;
		} else {
			$("#"+name+"-dialog-content").html(content).onclick;
		}
	}
	
	this.createDialog = function(name,mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}
		
		//make graph local
		var graph = undefined;
		
		//Create new Graph
		graph = new Springy.Graph();
		graph.previousNodes = [];
		graph.previousEdges = [];
		graph.newNodes = [];
		graph.newEdges = [];
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"dependency-map-content\"></div>')
			.append($('<canvas id="'+name+'-content-canvas" />').width("100%").height("100%").attr("height", 500).attr("width",500)).append($('<input style="position:absolute; width:400px; z-index:10; right:30px; top:5px;" id="'+name+'-content-regex"/>').on("input",function(){me.updateGraph(this.value, graph)})).on("mouseover",function(){me.updateGraph(this.children[1].value, graph)});

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog(
				{
					title: mtitle,
					width: 600,
					height: 450,
					minHeight: 120,
					minWidth: 230
				}
			)
			
		jQuery(
			function(){
				ab = jQuery("#"+name+"-content-canvas").springy({
					graph: graph,
					nodeSelected: function(node){
						me.nodeClicked(node);
					}
				});
			}
		);
	}
		
	this.nodeClicked = function(node){
		//console.log(node);
	}
	
	this.updateGraph = function(regex, graph){
		//Make a regex
		
	try{	
		var re = graph.re = new RegExp("^("+regex+")$");
	}catch(syntaxError){
		return;
	}	
		graph.newNodes = [];
		graph.newEdges = [];
		for(var i in root.symbols){
		
			var nodename = root.symbols[i].name.substring(1,root.symbols[i].length);
			
			if(re.test(nodename)){
				//Get the nodes which are now in the graph
				
				//If its not in the graph and it passed the regex
				if((graph.newNodes).indexOf(nodename)==-1){
					//push it
					graph.newNodes.push(nodename);
				}
				else{
					//Do nothing
				}
				//Inward nodes
				var depArray = root.lookup(nodename).dependencies;
				for(var ii in depArray){
					var nodename2 = depArray[ii].name.substring(1,root.symbols[i].length);

					if((graph.newNodes).indexOf(nodename2)==-1){

						graph.newNodes.push(nodename2);
					}
					else{
						//do nothing
					}
					graph.newEdges.push([nodename2,nodename]);
				}
				depArray = root.lookup(nodename).observees;
				for(var ii in depArray){
					var nodename2 = depArray[ii].name.substring(1,root.symbols[i].length);

					if((graph.newNodes).indexOf(nodename2)==-1){

						graph.newNodes.push(nodename2);
					}
					else{
						//do nothing
					}
					graph.newEdges.push([nodename2,nodename]);
				}				
				
				
				
				//outward nodes
				var subArray = root.lookup(nodename).subscribers;
				for(var ii in subArray){
					var nodename2 = subArray[ii].name.substring(1,root.symbols[i].length);
					
					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					else{
						//do nothing
					}
					graph.newEdges.push([nodename,nodename2]);
				}
				subArray = root.lookup(nodename).observers;
				for(var ii in subArray){
					var nodename2 = subArray[ii].name.substring(1,root.symbols[i].length);
					
					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					else{
						//do nothing
					}
					graph.newEdges.push([nodename,nodename2]);
				}
			}
		}
		
		//Get the edges which are now in the graph
		//If the set of nodes and edges are different from before
		if(arrayCompare(graph.previousNodes, graph.newNodes) && arrayCompare(graph.previousEdges, graph.newEdges)){
			//Don't do anything
			return;
		}

		//Make the new ones previous also
		graph.previousNodes = graph.newNodes;
		graph.previousEdges = graph.newEdges;
		
		//Clear the graph
		graph.filterEdges(function(e){return false;})
		graph.filterNodes(function(n){return false;});
		//graph.filterNodes(function(n){return re.test(n);});
		
		graph.nodeObjectsStore = {};

		for(var i in graph.previousNodes){
			//Add all the new Nodes to the graph and add to a node store
			var aboutname = graph.previousNodes[i];
			graph.nodeObjectsStore[aboutname] = graph.newNode({label: aboutname},{color: '#6A4A3C'});
		}
				
		for(var ii in graph.previousEdges){
			//Add all the edges
			var aboutedge1 = graph.previousEdges[ii][0];
			var aboutedge2 = graph.previousEdges[ii][1];
			graph.newEdge(graph.nodeObjectsStore[aboutedge1], graph.nodeObjectsStore[aboutedge2]);
		}

		
	}
	
	//Register the HTML view options
	context.views["DM"] = {dialog: this.createDialog, title: "Dependency Map"};
};
/* Plugin meta information */
Eden.plugins.DM.title = "Dependency Map (DM)";
Eden.plugins.DM.description = "A graph representing the functional connection between observables";
Eden.plugins.DM.author = "Joe Butler";