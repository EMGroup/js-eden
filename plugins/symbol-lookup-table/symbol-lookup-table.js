Eden.plugins.SLT = function(context) {

	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				context.createView(name,"SLT");
			}
			$("#"+defaultview+"-content").html(content);
		} else {
			$("#"+name+"-dialog-content").html(content);
		}
	}

	this.createDialog = function(name,mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"symbol-lookup-table-content\">'+STL.generateAllHTML()+'</div>');

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
	context.views["SLT"] = {dialog: this.createDialog, title: "Symbol Lookup Table"};
	
	STL = {};
	STL.update = function(event){
		//Update All SLT with their respective regexs
		
		var views = document.getElementsByClassName("SLT");
		for(var j=0; j<views.length; j++){
			var regex = views[j].children[0].children[0].value;
			if(regex==undefined){
				continue;
			}
			views[j].children[1].innerHTML = STL.generateBottomHTML(regex);
		}
	}
	
	STL.generateAllHTML = function(){
		//generates the regex
		var regex = "<input class=\"SLTregex\" type=\"text\" onkeyUp=\"STL.update(event)\" placeholder=\"regex\" onload=\"setFocus()\" style='';>";
		var indiv = "<div class=\"SLT\"><div class=\"upper\" style=\" display:block; \">"+regex+"</div><div class=\"lower\" style=\" display:block; \">"+STL.generateBottomHTML("")+"</div></div>";
		return indiv;
	}
	
	
	STL.generateBottomHTML = function(regexString){
		//generates the content

		var HTML = "<tr><td class=\"lower\"><b>Name</b></td><td class=\"lower\"><b>Definition</b></td><td class=\"lower\"><b>Current Value</b></td><td class=\"lower\"><b>Watches</b></td><td class=\"lower\"><b>Updates</b></td>";
		var symbolsx = STL.arrayFromObject(root.symbols);
		
		re = new RegExp("^("+regexString+").*$","i");
		
		for(var i=0; i<symbolsx.length; i++){
		
			var blank = " - ";
		
			var name = symbolsx[i].name.replace(/\//g,'');
			if(!re.test(name)){

				continue;
			}
			
			var value = Eden.deHTML(String(symbolsx[i].cached_value)).replace("/n", "<br/>");
				if(value=="undefined"){
					value = blank;
				}
			var WATCHES = Eden.deHTML(STL.propertiesFromObject(symbolsx[i].observees).join(", ").replace(/\//g,''));
				if(WATCHES==""){
					WATCHES = blank;
				}
			var UPDATES = Eden.deHTML(STL.propertiesFromObject(symbolsx[i].observers).join(", ").replace(/\//g,''));
				if(UPDATES==""){
					UPDATES = blank;
				}
			var def = Eden.deHTML(symbolsx[i].eden_definition);
				if(def==undefined){
					def = blank;
				}
			var ofa = "";
			if(def.indexOf("proc")==0){
				ofa = "(Action)";
			}
			else if(def.indexOf("func")==0){
				ofa = "(Function)";
			}
			else{
				ofa = "(Observable)";
			}

			//table cells
			HTML = HTML.concat("<tr><td class=\"lower\"><p>"+name+"\n"+ofa+"</p></td><td class=\"lower\"><p>"+def+"</p></td><td class=\"lower\"><p>"+value+"</p></td><td class=\"lower\"><p>"+WATCHES+"</p></td><td class=\"lower\"><p>"+UPDATES+"</p></td></tr>");
		}
		return "<table>"+HTML+"</table>";
	}
	
	STL.arrayFromObject = function(object){

		var temp = [];

		$.each(object, function(){
			temp.push(this);
		});
		
		return temp;
	}
	
	STL.propertiesFromObject = function(object){

		var temp = [];

		$.each(object, function(x){
			temp.push(x);
		});
		
		return temp;
	}

};
/* Plugin meta information */
Eden.plugins.SLT.title = "Symbol Lookup Table (SLT)";
Eden.plugins.SLT.description = "Database of all symbols in the application";
Eden.plugins.SLT.author = "Joe Butler";
