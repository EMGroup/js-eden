EdenUI.plugins.DependencyMap = function(edenUI, success){

	var me = this;

	this.createDialog = function(name, mtitle) {
		var graph = undefined;
		
		//Create new Graph
		graph = new Springy.Graph();
		graph.previousNodes = [];
		graph.previousEdges = [];
		graph.newNodes = [];
		graph.newEdges = [];
		
		var content = $('<div id="' + name + '" style="overflow: hidden"></div>');

		var canvas = $('<canvas></canvas>')
			.springy({
				graph: graph,
				nodeSelected: function (node) {
					//console.log(node);
				}
			});
		content.append(canvas);

		var controls = $('<div class="dependency-map-controls"></div>');
		content.append(controls);
		var searchBox = $('<input type="text" placeholder="search"/>');
		var searchBoxElem = searchBox.get(0);
		var exactMatches = $('<input type="checkbox" checked="checked"/>');
		var exactMatchesElem = exactMatches.get(0);
		controls.append(searchBox);
		controls.append($('<label>Exact matches only </label>').append(exactMatches));
		
		function update() {
			var re;
			if (searchBoxElem.value == "") {
				re = /^$/;
			} else {
				re = edenUI.regExpFromStr(searchBox, "", exactMatchesElem.checked);
			}
			me.updateGraph(graph, re);
		}

		searchBox.on("input", update);
		exactMatches.on("change", update);
		content.on("mouseenter", update);

		content.dialog({
			title: mtitle,
			width: 600,
			height: 450,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "dependency-map-dialog"
		});
	}
		
	this.updateGraph = function(graph, re) {
		graph.re = re;
		graph.newNodes = [];
		graph.newEdges = [];
		for(var i in root.symbols){
		
			var nodeSym = root.symbols[i];
			var nodename = nodeSym.name.slice(1);
			
			if(re.test(nodename)) {
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
				var depArray = nodeSym.dependencies;
				for (var ii in depArray) {
					if (depArray[ii] === undefined) continue;
					var nodename2 = depArray[ii].name.slice(1);

					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename2,nodename, false]);
				}

				depArray = nodeSym.dynamicDependencies;
				for (var ii in depArray) {
					var nodename2 = depArray[ii].name.slice(1);

					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename2,nodename, true]);
				}

				depArray = nodeSym.observees;
				for (var ii in depArray) {
					var nodename2 = depArray[ii].name.slice(1);

					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename2,nodename, false]);
				}				
				
				
				//outward nodes
				var subArray = nodeSym.subscribers;
				for (var ii in subArray) {
					var subscriber = subArray[ii];
					if (subscriber === undefined) continue;
					var nodename2 = subscriber.name.slice(1);
					
					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					var dashed = nodeSym.name in subscriber.dynamicDependencies;
					graph.newEdges.push([nodename,nodename2, dashed]);
				}
				subArray = nodeSym.observers;
				for (var ii in subArray) {
					var nodename2 = subArray[ii].name.slice(1);
					
					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename,nodename2, false]);
				}
			}
		}
		
		//Get the edges which are now in the graph
		//if the set of nodes and edges are different from before
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
			var attributes = {};
			if (graph.previousEdges[ii][2]) {
				attributes.dashes = [10, 10];
			}
			graph.newEdge(graph.nodeObjectsStore[aboutedge1], graph.nodeObjectsStore[aboutedge2], attributes);
		}

		
	}
	
	//Register the HTML view options
	edenUI.views["DependencyMap"] = {dialog: this.createDialog, title: "Dependency Map", category: edenUI.viewCategories.comprehension, menuPriority: 2};
	success();
};
/* Plugin meta information */
EdenUI.plugins.DependencyMap.title = "Dependency Map";
EdenUI.plugins.DependencyMap.description = "Displays a diagram showing the relationships between observables.";
EdenUI.plugins.DependencyMap.author = "Joe Butler";
