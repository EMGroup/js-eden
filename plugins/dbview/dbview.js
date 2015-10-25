/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Construit DBView Plugin.
 */

EdenUI.plugins.DBView = function(edenUI, success) {
	var me = this;

	this.createDialog = function(name,mtitle) {
		var code_entry = $('<div id=\"'+name+'-content\" class=\"dbview-content\"><div class="dbview-controls"><div class="dbview-select"><span class="dbview-label">Select:</span><input class="dbview-select-text" type="text"></input><span class="dbview-label">Where:</span><input class="dbview-where-text" type="text"></input></div></div></div>');
		var table = $('<table class="dbview-table"></table>');
		table.appendTo(code_entry);
		var columns;
		var rows;
		var select = code_entry.find(".dbview-select-text").get(0);
		var where = code_entry.find(".dbview-where-text").get(0);
		var selectre = undefined;
		var whereexp = undefined;

		function rebuild() {
			var tabele = table.get(0);
			while (tabele.firstChild) tabele.removeChild(tabele.firstChild);

			var data = Database.getValues();
			columns = [];
			rows = [];
			for (var d in data) {
				var labels = d.split("/");
				var name = labels[0];
				var scope = labels[1];
				if (selectre === undefined || selectre.test(name)) {
					if (columns.indexOf(name) == -1) columns.push(name);
					if (rows.indexOf(scope) == -1) rows.push(scope);
				}
			}

			// Build columns
			var titlerow = $('<tr></tr>');
			for (var c=0; c<columns.length; c++) {
				var coltitle = $('<th></th>');
				coltitle.html(columns[c]);
				coltitle.appendTo(titlerow);
			}
			titlerow.appendTo(table);

			for (var r=0; r<rows.length; r++) {
				var row = $('<tr></tr>');
				for (var c=0; c<columns.length; c++) {
					var col;
					if (columns[c] == "scope") col = $('<td class="dbview-disabled"></td>');
					else col = $('<td contenteditable></td>');
					col.appendTo(row);
					var entry = Database.getEntry(columns[c], rows[r]);
					//var form = Database.getFormula(columns[c], rows[r]);
					if (entry === undefined) continue;
					col.html(entry.value);
					if (entry.origin_scope != parseInt(rows[r])) col.addClass("dbview-inherited");
					if (entry.formula !== undefined) col.addClass("dbview-formula");
				}
				row.appendTo(table);
			}
		}


		function findEntry(name, scope) {
			var col = columns.indexOf(name);
			var row = rows.indexOf(scope.toString());
			if (col < 0 || row < 0) return undefined;
			return {col: col, row: row};
		}


		function clearHighlights() {
			table.find('.dbview-dependant').removeClass("dbview-dependant");
			table.find('.dbview-dependency').removeClass("dbview-dependency");
		}


		function highlightSourceScope(entry) {
			
		}

		function highlightDependants(entry) {
			for (var i=0; i<entry.dependants.length; i++) {
				var loc = findEntry(entry.dependants[i].name, entry.dependants[i].origin_scope);
				//console.log(loc);
				if (loc) {
					//console.log(table.get(0).childNodes);
					$(table.get(0).firstChild.childNodes[loc.row+1].childNodes[loc.col]).addClass("dbview-dependant");
				}
			}
		}

		function highlightDependencies(entry) {
			if (entry.formula && entry.formula.dependencies) {
				for (var i=0; i<entry.formula.dependencies.length; i++) {
					var loc = findEntry(entry.formula.dependencies[i], entry.origin_scope);
					//console.log(loc);
					if (loc) {
						//console.log(table.get(0).childNodes);
						$(table.get(0).firstChild.childNodes[loc.row+1].childNodes[loc.col]).addClass("dbview-dependency");
					}
				}
			}
		}

		table.on('input', 'td', function(e) {
			var col = e.target.cellIndex;
			var row = e.target.parentNode.rowIndex-1;
			if (col < 0 || row < 0) return;
			var value = e.target.textContent;
			//console.log("Edited: " + columns[col] + "/" + row);
			Database.setValue(columns[col],row, value);
			Database.sync();
		}).on('mouseenter', 'td', function(e) {
			var col = e.target.cellIndex;
			var row = e.target.parentNode.rowIndex-1;
			var entry = Database.getEntry(columns[col],rows[row]);

			if (entry) {
				highlightSourceScope(entry);
				if (entry.formula) {
					highlightDependencies(entry);
				}
				highlightDependants(entry);
			}
		}).on('mouseleave', 'td', function(e) {
			clearHighlights();
		});

		code_entry.on('input', '.dbview-select-text', function(e) {
			selectre = EdenUI.regExpFromStr(select.value);
			rebuild();
		})
		.on('input', '.dbview-where-text', function(e) {
			whereexp = new EdenAST(where.value, true);
			if (whereexp.script.errors.length == 0) {
				rebuild();
			}
		});

		rebuild();

		Database.addAgent("DBViewUpdater", rebuild);
		Database.on("setvalue", "DBViewUpdater");
		Database.on("setformula", "DBViewUpdater");

		$('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "dbview-dialog"
			});
		return {confirmClose: true};
	}

	//Register the DBView options
	edenUI.views["DBView"] = {dialog: this.createDialog, title: "Database Viewer", category: edenUI.viewCategories.visualization};

	success();

	//Load the Eden wrapper functions (new syntax).
	//edenUI.eden.include2("plugins/dbview/dbview.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.DBView.title = "DBView";
EdenUI.plugins.DBView.description = "Display a table showing entire database contents.";
