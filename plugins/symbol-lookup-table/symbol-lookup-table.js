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
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"symbol-lookup-table-content\">'+SLT.generateAllHTML()+'</div>');

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
	SLT.update = function(event){
		//Update All SLT with their respective regexs
		
		var views = document.getElementsByClassName("SLT");
		for(var j=0; j<views.length; j++){
			var regex = views[j].children[0].children[0].value;
			if(regex==undefined){
				continue;
			}
			views[j].children[1].innerHTML = SLT.generateBottomHTML(regex);
		}

	}
	
	SLT.generateAllHTML = function(){
		//Generates the regex
		var regex = "<input class=\"SLTregex\" type=\"text\" onkeyUp=\"SLT.update(event)\" placeholder=\"regex\" onload=\"setFocus()\" style='';>";
		var indiv = "<div class=\"SLT\"><div class=\"upper\" style=\" display:block; \">"+regex+"</div><div class=\"lower\" style=\" display:block; \">"+SLT.generateBottomHTML("")+"</div></div>";
		return indiv;
	}
	
	
	SLT.generateBottomHTML = function(regexString){
		var HTML = "<tr>"+
			"<td class=\"lower\"><b>Name</b></td>"+
			"<td class=\"lower\"><b>Type</b></td>" +
			"<td class=\"lower\"><b>Definition</b></td>"+
			"<td class=\"lower\"><b>Current Value</b></td>"+
			"<td class=\"lower\"><b>Watches</b></td>"+
			"<td class=\"lower\"><b>Updates</b>"+
			"<td class=\"lower\"><b>Last Modified By</b></td>" +
		"</tr>";
		var symbolsx = SLT.arrayFromObject(root.symbols);
		
		re = new RegExp("^("+regexString+").*$","i");
		
		for(var i=0; i<symbolsx.length; i++){
			var symbol = symbolsx[i];
			var name = symbol.name.slice(1);
			
			if(!re.test(name)){
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
					kind = "Agent";
					value = "";
				} else if (definition.indexOf("func") == 0) {
					kind = "Function";
					value = "";
				} else {
					kind = "Dependency";
					value = Eden.htmlEscape(Eden.edenCodeForValue(symbol.cached_value));
				}
			}
			
			var WATCHES = Eden.htmlEscape(SLT.propertiesFromObject(symbol.observees).concat(SLT.propertiesFromObject(symbol.dependencies)).join(", ").replace(/\//g,''));
			var UPDATES = Eden.htmlEscape(SLT.propertiesFromObject(symbol.observers).concat(SLT.propertiesFromObject(symbol.subscribers)).join(", ").replace(/\//g,''));
			var lastModifiedBy = symbol.last_modified_by ? symbol.last_modified_by : 'Not yet defined';

			HTML = HTML.concat(
				"<tr>"+
					"<td class=\"lower\"><p>" + name + "</p></td>" +
					"<td class=\"lower\"><p>" + kind + "</p></td>" +
					"<td class=\"lower\"><p>" + definition + "</p></td>" +
					"<td class=\"lower\"><p>"+value+"</p></td>"+
					"<td class=\"lower\"><p>"+WATCHES+"</p></td>"+
					"<td class=\"lower\"><p>"+UPDATES+"</p></td>"+
					"<td class=\"lower\"><p>"+lastModifiedBy+"</p></td>"+
				"</tr>"
			);
		}
		return "<table>"+HTML+"</table>";
	}
	
	SLT.arrayFromObject = function(object){

		var temp = [];

		$.each(object, function(){
			temp.push(this);
		});
		
		return temp;
	}
	
	SLT.propertiesFromObject = function(object){

		var temp = [];

		$.each(object, function(x){
			temp.push(x);
		});
		
		return temp;
	}
	
	success();
};
/* Plugin meta information */
EdenUI.plugins.SLT.title = "Symbol Lookup Table (SLT)";
EdenUI.plugins.SLT.description = "Database of all symbols in the application";
EdenUI.plugins.SLT.author = "Joe Butler";
