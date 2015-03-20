EdenUI.plugins.SymbolLookUpTable = function (edenui, success) {
	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenui.createView(name,"SymbolLookUpTable");
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
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"symbol-lookup-table-content\">' + generateAllHTML(name) + '</div>');

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230
			});
	}

	//Register the HTML view options
	edenui.views["SymbolLookUpTable"] = {dialog: this.createDialog, title: "Symbol Look-Up Table", category: edenUI.viewCategories.comprehension, menuPriority: 3};
	
	this.search = function (viewName) {
		//Update a symbol look-up table with search results for a new regexp.
		var regExp = document.getElementById(viewName + "-regexp").value;
		if(regExp == undefined) {
			return;
		}
		document.getElementById(viewName + "-table-div").innerHTML = generateBottomHTML(regExp, viewName);
	}
	
	var generateAllHTML = function (viewName) {
		var controls = "<input id='" + viewName + "-regexp' class='SLTregex' type='text' onkeyUp=\"edenUI.plugins.SymbolLookUpTable.search('" + viewName + "')\" placeholder='search' onload='setFocus()' />";
		var indiv = 
			"<div class='upper'>" + 
				controls +
			"</div>" +
			"<div id='" + viewName + "-table-div' class='lower'>" +
				generateBottomHTML("", viewName) +
			"</div>";
		return indiv;
	}
	
	var generateBottomHTML = function(regexString, viewName) {
		var tableHeadHTML = "<tr>"+
			"<td class=\"lower\"><b>Name</b></td>"+
			"<td class=\"lower\"><b>Type</b></td>" +
			"<td class=\"lower\"><b>Definition</b></td>"+
			"<td class=\"lower\"><b>Current Value</b></td>"+
			"<td class=\"lower\"><b>Watches</b></td>"+
			"<td class=\"lower\"><b>Updates</b>"+
			"<td class=\"lower\"><b>Last Modified By</b></td>" +
			"<td class=\"lower\"><b>JavaScript Actions</b></td>" +
		"</tr>";
		tableBodyHTML = "";
		
		var re = new RegExp("^(" + regexString + ")", "i");
		var partialTable = [];
		var matchingNames = {};
		var symbol;
		
		for (var name in root.symbols) {
			symbol = root.symbols[name];
			
			if (!re.test(name)) {
				continue;
			}
			
			var kind, definition, value;
			if (symbol.eden_definition === undefined) {
				definition = "-";
				kind = typeof(symbol.cached_value) == "function"? "Function" : "Observable";
				value = Eden.htmlEscape(Eden.edenCodeForValue(symbol.cached_value));
			} else {
				definition = Eden.htmlEscape(symbol.eden_definition);
				if (definition.indexOf("proc") == 0) {
					if (Eden.isitSystemAgent(name) && !(new RegExp("\\b" + name + "\\b")).test(regexString)) {
						continue;
					}
					kind = "Agent";
					value = "";
				} else if (definition.indexOf("func") == 0) {
					if (Eden.isitSystemFunction(name) && !(new RegExp("\\b" + name + "\\b")).test(regexString)) {
						continue;
					}
					kind = "Function";
					value = "";
				} else {
					kind = "Dependency";
					value = Eden.htmlEscape(Eden.edenCodeForValue(symbol.cached_value));
				}
			}
			partialTable.push([symbol, name, kind, definition, value]);
			matchingNames[name] = true;
		}
		
		for (var i = 0; i < partialTable.length; i++) {
			var row = partialTable[i];
			symbol = row[0];
			var watches = referencedObservables(symbol.observees, matchingNames, viewName).concat(
				referencedObservables(symbol.dependencies, matchingNames, viewName));

			var updates = referencedObservables(symbol.observers, matchingNames, viewName).concat(
				referencedObservables(symbol.subscribers, matchingNames, viewName));

			var lastModifiedBy = symbol.last_modified_by ? symbol.last_modified_by : 'Not yet defined';
			lastModifiedBy = referencedObservable(lastModifiedBy, matchingNames, viewName);

			var jsObservers = Object.keys(symbol.jsObservers).join(", ");
			
			var rowHTML =
				"<tr id='" + viewName + "-symbol-" + row[1] + "'>"+
					"<td class=\"lower\"><p>" + row[1] + "</p></td>" +
					"<td class=\"lower\"><p>" + row[2] + "</p></td>" +
					"<td class=\"lower\"><p>" + row[3] + "</p></td>" +
					"<td class=\"lower\"><p>" + row[4] + "</p></td>" +
					"<td class=\"lower\"><p>" + watches + "</p></td>" +
					"<td class=\"lower\"><p>" + updates + "</p></td>" +
					"<td class=\"lower\"><p>" + lastModifiedBy + "</p></td>" +
					"<td class=\"lower\"><p>" + jsObservers + "</p></td>" +
				"</tr>";

			/* Officially the order in which object properties are returned during iteration is
			 * implementation defined, though most browsers do usually return them in the order
			 * they were first assigned, so it's not guaranteed but we hope the following code puts
			 * the most recently defined symbols at the top (excluding the coordinates of GUI
			 * window positions, etc. which should hopefully end up at the bottom of the table.
			 */
			if (/^((_view_.*)|mousePosition|mouseWindow)$/.test(row[1])) {
				tableBodyHTML = tableBodyHTML + rowHTML;
			} else {
				tableBodyHTML = rowHTML + tableBodyHTML;
			}
		}
		return "<table>" + tableHeadHTML + tableBodyHTML + "</table>";
	}

	var referencedObservables = function(referencedObs, obsInTable, viewName) {
		var list = [];
		for (var key in referencedObs) {
			var name = key.slice(1);
			list.push(referencedObservable(name, obsInTable, viewName));
		}
		return list.join(", ");
	}
	
	var referencedObservable = function(name, obsInTable, viewName) {
		if (name[0] == "*" || name == "include" || name == "Not yet defined") {
			return name;
		} else if (name in obsInTable) {
			return "<a href=\"javascript:edenUI.plugins.SymbolLookUpTable.jump('" + viewName + "-symbol-" + name + "')\">" + name + "</a>";
		} else {
			return "<a href=\"javascript:edenUI.plugins.SymbolLookUpTable.addSymbolToSearch('" + viewName + "', " + "'" + name + "')\">" + name + "</a>";
		}		
	}
	
	this.addSymbolToSearch = function (viewName, symbolName) {
		var searchBox = document.getElementById(viewName + "-regexp");
		var searchStr = searchBox.value + "|" + symbolName + "$";
		searchBox.value = searchStr;
		this.search(viewName);
	}
	
	this.jump = function (anchor) {
		var url = location.href;                 //Save down the URL without hash.
		location.href = "#" + anchor;            //Go to the target element.
		history.replaceState(null, null, url);  //Don't like hashes. Changing it back.		
	}
	
	success();
};
/* Plugin meta information */
EdenUI.plugins.SymbolLookUpTable.title = "Symbol Look-Up Table";
EdenUI.plugins.SymbolLookUpTable.description = "Displays detailed information about symbols.";
EdenUI.plugins.SymbolLookUpTable.originalAuthor = "Joe Butler";
