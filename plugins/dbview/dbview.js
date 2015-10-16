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

		function rebuild() {
			var tabele = table.get(0);
			while (tabele.firstChild) tabele.removeChild(tabele.firstChild);

			var data = Database.getValues();
			columns = [];
			var rows = [];
			for (var d in data) {
				var labels = d.split("/");
				var name = labels[0];
				var scope = labels[1];
				if (columns.indexOf(name) == -1) columns.push(name);
				if (rows.indexOf(scope) == -1) rows.push(scope);
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
					if (columns[c] == "scope_id") col = $('<td class="dbview-disabled"></td>');
					else col = $('<td contenteditable></td>');
					col.appendTo(row);
					var entry = Database.getValueEntry(columns[c], rows[r]);
					//var form = Database.getFormula(columns[c], rows[r]);
					if (entry === undefined) continue;
					col.html(entry.value);
					if (entry.origin_scope != parseInt(rows[r])) col.addClass("dbview-inherited");
					if (entry.formula !== undefined) col.addClass("dbview-formula");
				}
				row.appendTo(table);
			}
		}

		table.on('input', 'td', function(e) {
			var col = e.target.cellIndex;
			var row = e.target.parentNode.rowIndex-1;
			if (col < 0 || row < 0) return;
			var value = e.target.textContent;
			console.log("Edited: " + columns[col] + "/" + row);
			Database.setValue(columns[col],row, value); 
		});

		rebuild();

		Database.on("setvalue", rebuild);
		Database.on("setformula", rebuild);

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
