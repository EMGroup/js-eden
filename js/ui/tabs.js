EdenUI.Tabs = function(element) {
	this.tabs = element;
	this.scrollix = 0;
	this.maxtabs = 3;
}

EdenUI.Tabs.prototype.build = function(agents, current) {
	// Remove existing tabs
	while (this.tabs.firstChild) this.tabs.removeChild(this.tabs.firstChild);

	// Add scroll left
	var left = document.createElement("div");
	left.className = "agent-tableft noselect";
	this.tabs.appendChild(left);

	var tabcontainer = document.createElement("div");
	tabcontainer.className = "agent-tab-container";
	this.tabs.appendChild(tabcontainer);
	
	if (agents && agents instanceof Array) {
		var curix = -1;

		if (current) {
			// Find index of current tab
			curix = agents.indexOf(current);
		}

		if (curix > this.scrollix+(this.maxtabs-1)) this.scrollix = curix-(this.maxtabs-1);
		if (curix < this.scrollix) this.scrollix = curix;

		for (var i=0; i<agents.length; i++) {
			var title = agents[i];
			if (Eden.Agent.agents[agents[i]]) {
				title = Eden.Agent.agents[agents[i]].title;
			}
			if (this.scrollix <= i) {
				this.add(tabcontainer, agents[i], title, (current && agents[i] == current), i);
			}
		}
	}

	// Add new tab button
	var newtab = document.createElement("div");
	newtab.className = "agent-newtab noselect";
	newtab.style.left = ""+(agents.length*160 + 20)+"px";
	tabcontainer.appendChild(newtab);

	// Add scroll right
	var right = document.createElement("div");
	right.className = "agent-tabright noselect";
	this.tabs.appendChild(right);
}

EdenUI.Tabs.prototype.add = function(container, name, title, current, ix) {
	var tab = document.createElement("div");
	tab.style.left = ""+(ix*160)+"px";
	var classname = "agent-tab noselect";
	if (current) {
		classname += " agent-tab-current";
	} else {
		classname += " agent-tab-notcurrent";
	}

	var tabname = name.split("/").pop();

	if (tabname.length > 18) {
		tabname = "..."+tabname.slice(-15);
	}

	var iconclass;
	if (Eden.Agent.agents[name]) {
		if (Eden.Agent.agents[name].hasErrors()) {
			iconclass = "tab-icon errored";
		} else if (Eden.Agent.agents[name].executed) {
			iconclass = "tab-icon executed";
		} else {
			iconclass = "tab-icon";
		}
	} else {
		iconclass = "tab-icon noagent";
	}


	tab.className = classname;
	tab.innerHTML = "<span class='"+iconclass+"'>&#xf007;</span>"+tabname;
	tab.draggable = true;
	tab.setAttribute("data-name", name);
	/*if (tabs.childNodes.length < tabscrollix) {
		tab.style.display = "none";
	}*/
	container.appendChild(tab);
}

