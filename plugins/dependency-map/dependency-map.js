EdenUI.plugins.DependencyMap = function(edenUI, success){

	var me = this;

	this.createDialog = function(name, mtitle) {
		var graph = undefined;
		
		//Create new Graph
		var nodes = new vis.DataSet([]);
		var edges = new vis.DataSet([]);
		var data = {nodes: nodes, edges: edges};
		
		var content = $('<div id="' + name + '" style="overflow: hidden"></div>');

		var container = $('<div class="dependency-map-content"></div>');
		content.append(container);

		var graph = new vis.Network(container.get(0), data, {}); //{layout: {hierarchical: true}});

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
			appendTo: "#jseden-views",
			title: mtitle,
			width: 600,
			height: 450,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "dependency-map-dialog"
		});
	}

	function makeNode(sym) {
		var val = sym.value();
		var type = typeof val;
		var icon = null;

		if (val === undefined) {
			icon = {code: '\uf06a'};
		} else if (type == "number") {
			icon = {code: Math.round(val), face: 'arial'};
		} else if (type == "string") {
			icon = {code: '\uf10d'};
		} else if (type == "boolean") {
			icon = {code: (val) ? '\uf00c' : '\uf00d'};
		} else if (type == "function") {
			icon = {code: '\uf1c9'};
		} else {
			if (Array.isArray(val)) {
				icon = {code: '\uf03a'};
			} else if (val instanceof CanvasImage) {
				icon = {code: '\uf03e'};
			} else if (val instanceof Text) {
				icon = {code: '\uf031'};
			} else {
				icon = {code: '\uf1b2'};
			}
		}

		return {
			id: sym.name,
			label: sym.name,
			shape: 'icon',
			icon: icon
		};
	}

	function makeAgentNode(sym) {
		if (sym instanceof EdenSymbol) {
			return makeNode(sym);
		} else {
			return {id: sym.id, label: "when", shape: 'icon', icon: {code: '\uf007'}};
		}
	}
		
	this.updateGraph = function(graph, re) {
		graph.re = re;
		graph.newNodes = [];
		graph.newEdges = [];
		var nodelog = {};

		for(var i in root.symbols){
		
			var nodeSym = root.symbols[i];
			var nodename = nodeSym.name;
			
			if(re.test(nodename)) {
				//Get the nodes which are now in the graph
				
				//If its not in the graph and it passed the regex
				if(!nodelog[nodename]){
					//push it
					nodelog[nodename] = true;
					graph.newNodes.push(makeNode(nodeSym));
				}
				else{
					//Do nothing
				}
				//Inward nodes
				var depArray = nodeSym.dependencies;
				for (var ii in depArray) {
					var nodename2 = depArray[ii].name;

					if(!nodelog[nodename2]){
						nodelog[nodename2] = true;
						graph.newNodes.push(makeNode(depArray[ii]));
					}
					graph.newEdges.push({from: nodename2, to: nodename, arrows: "to"});
				}

				/*depArray = nodeSym.dynamicDependencies;
				for (var ii in depArray) {
					var nodename2 = depArray[ii].name;

					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename2,nodename, true]);
				}

				depArray = nodeSym.observees;
				for (var ii in depArray) {
					var nodename2 = depArray[ii].name;

					if((graph.newNodes).indexOf(nodename2)==-1){
						graph.newNodes.push(nodename2);
					}
					graph.newEdges.push([nodename2,nodename, false]);
				}	*/			
				
				
				//outward nodes
				var subArray = nodeSym.subscribers;
				for (var ii in subArray) {
					var subscriber = subArray[ii];
					var nodename2 = subscriber.name;
					
					if(!nodelog[nodename2]){
						nodelog[nodename2] = true;
						graph.newNodes.push(makeNode(subArray[ii]));
					}
					var dashed = nodeSym.name in subscriber.dynamicDependencies;
					graph.newEdges.push({from: nodename, to: nodename2, arrows: "to"});
				}
				subArray = nodeSym.observers;
				for (var ii in subArray) {
					var nodename2 = subArray[ii].id;
					
					if(!nodelog[nodename2]){
						nodelog[nodename2] = true;
						graph.newNodes.push(makeAgentNode(subArray[ii]));
					}
					graph.newEdges.push({from: nodename, to: nodename2, arrows: "to"});
				}
			}
		}
		
		var nodes = new vis.DataSet(graph.newNodes);
		var edges = new vis.DataSet(graph.newEdges);
		var data = {nodes: nodes, edges: edges};
		graph.setData(data);
		
	}
	
	//Register the HTML view options
	edenUI.views["DependencyMap"] = {dialog: this.createDialog, title: "Dependency Map", category: edenUI.viewCategories.comprehension, menuPriority: 2};
	success();
};
/* Plugin meta information */
EdenUI.plugins.DependencyMap.title = "Dependency Map";
EdenUI.plugins.DependencyMap.description = "Displays a diagram showing the relationships between observables.";
EdenUI.plugins.DependencyMap.author = "Joe Butler";
