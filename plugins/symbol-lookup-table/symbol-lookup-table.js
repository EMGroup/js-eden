EdenUI.plugins.SLT = function (edenui, success) {
	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenui.createView(name,"SLT");
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
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"symbol-lookup-table-content\">' + SLT.generateAllHTML(name) + '</div>');

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
	edenui.views["SLT"] = {dialog: this.createDialog, title: "Symbol Lookup Table"};
	
	SLT = {};

	SLT.search = function (viewName) {
		//Update an SLT with search results for a new regexp.
		var regExp = document.getElementById(viewName + "-regexp").value;
		if(regExp == undefined) {
			return;
		}
		document.getElementById(viewName + "-table-div").innerHTML = SLT.generateBottomHTML(regExp, viewName);
	}
	
	SLT.generateAllHTML = function (viewName) {
		var controls = "<input id='" + viewName + "-regexp' class='SLTregex' type='text' onkeyUp=\"SLT.search('" + viewName + "')\" placeholder='search' onload='setFocus()' />";
		var indiv = 
			"<div idclass='SLT'>" +
				"<div class='upper'>" + 
					controls +
				"</div>" +
				"<div id='" + viewName + "-table-div' class='lower'>" +
					SLT.generateBottomHTML("", viewName) +
				"</div>" +
			"</div>";
		return indiv;
	}
	
	SLT.generateBottomHTML = function(regexString, viewName) {
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
			var watches = SLT.referencedObservables(symbol.observees, matchingNames, viewName).concat(
				SLT.referencedObservables(symbol.dependencies, matchingNames, viewName));

			var updates = SLT.referencedObservables(symbol.observers, matchingNames, viewName).concat(
				SLT.referencedObservables(symbol.subscribers, matchingNames, viewName));

			var lastModifiedBy = symbol.last_modified_by ? symbol.last_modified_by : 'Not yet defined';
			lastModifiedBy = SLT.referencedObservable(lastModifiedBy, matchingNames, viewName);

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

	SLT.referencedObservables = function(referencedObs, obsInTable, viewName) {
		var list = [];
		for (var key in referencedObs) {
			var name = key.slice(1);
			list.push(SLT.referencedObservable(name, obsInTable, viewName));
		}
		return list.join(", ");
	}
	
	SLT.referencedObservable = function(name, obsInTable, viewName) {
		if (name[0] == "*" || name == "include" || name == "Not yet defined") {
			return name;
		} else if (name in obsInTable) {
			return "<a href='#" + viewName + "-symbol-" + name + "'>" + name + "</a>";
		} else {
			return "<a href=\"javascript:SLT.addSymbolToSearch('" + viewName + "', " + "'" + name + "')\">" + name + "</a>";
		}		
	}
	
	SLT.addSymbolToSearch = function (viewName, symbolName) {
		var searchBox = document.getElementById(viewName + "-regexp");
		var searchStr = searchBox.value + "|" + symbolName + "$";
		searchBox.value = searchStr;
		SLT.search(viewName);
	}
	
	success();
};
/* Plugin meta information */
EdenUI.plugins.SLT.title = "Symbol Lookup Table (SLT)";
EdenUI.plugins.SLT.description = "Database of all symbols in the application";
EdenUI.plugins.SLT.author = "Joe Butler";
