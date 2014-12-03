EdenUI.plugins.SG = function(edenUI, success) {

	var me = this;
	var defaultview = "";

	function lastModifiedByInput(name) {
		return root.lookup(name).last_modified_by === 'input';
	}

	this.html = function(name, content) {
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"SG");
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
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"script-generator-content\">'+SG.generateAllHTML()+'</div>');

		$dialog = $('<div class=\"SG\" id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230
			});
	}

	//Register the HTML view options:
	edenUI.views["SG"] = {dialog: this.createDialog, title: "Script Generator"};
	
	SG = {};
	SG.update = function(event){
		//Update All SG with their respective regexs
		
		var views = document.getElementsByClassName("SG");
		for(var j=0; j<views.length; j++){
			var regex = views[j].children[0].children[0].value;
			if(regex==undefined){
				continue;
			}
			views[j].children[0].children[1].innerHTML = SG.generateInnerHTML(regex);
		}
	}
	
	SG.generateAllHTML = function(){
		//generates the regex
		var indiv = '<input onkeyup="SG.update()" type="select" placeholder="Regex to not display"/><div style=\" display:block; \">'+SG.generateInnerHTML()+'</div>';
		return indiv;
	}
	
	
	SG.generateInnerHTML = function(regexX){
		//generates the content

		var HTML = "";
		var symbolsx = SG.arrayFromObject(root.symbols);
		
		var obsDefs = [];
		var obsAssins = [];
		var acts = [];
		var functs = [];
			
		var autocalcOn = "autocalc = 1;"
		var autocalcOff = "autocalc = 0;"
		var picture = root.lookup("picture").eden_definition;
		if(picture==undefined){
			picture = "picture is [];"
		}
		else{
			picture = picture+";";
		}
		var comments = [
			"## Auto-Generated Script of Model by JS-Eden J-version",
			"## Auto calculation is turned off to until the model has been fully loaded",
			"## Observable Assignments:",
			"## Observable Definitions:",
			"## Action Definitions:",
			"## Function Definitions:",
			"## Picture Definition:",
			"## Auto calculation is turned on and the updating is fired",
			"## End of Auto-Generated Script"
		];
		
		for(var i=0; i<symbolsx.length; i++){

		if(symbolsx[i].name.replace(/\//g,'')=="picture"){
			continue;
		}
		
			var blank = " - ";
			var ofa = "";
			var ofai = 5;
		
			var name = symbolsx[i].name.replace(/\//g,'');
				
			if (!lastModifiedByInput(name)) {
				continue;
			}

			var def = Eden.deHTML(symbolsx[i].eden_definition);
				if(def==undefined){
					def = blank;
				}
			if((regexX!=undefined)&&(regexX!="")){
				
				var RE = new RegExp(regexX);
					
				if(RE.test(name)){
					continue;
				}
			}

			//check this early
			if(def.indexOf("proc")==0){
				ofa = "(Action)";
				ofai = 2;
			}
			else if(def.indexOf("func")==0){
				ofa = "(Function)";
				ofai = 1;
			}
			else{
				ofa = "(Observable)";
				ofai = 0;
			}
				
			var value = Eden.deHTML(String(symbolsx[i].cached_value)).replace("/n", "<br/>");
				if(value=="undefined"){
					value = blank;
				}
				else{
					if(typeof symbolsx[i].cached_value=="string"){
						value = "\""+value+"\"";
					}
					else if(symbolsx[i].cached_value instanceof Array){
						value = Eden.deHTML(SG.toActualString(symbolsx[i].cached_value)).replace("/n", "<br/>");
					}
				}
			var WATCHES = Eden.deHTML(SG.propertiesFromObject(symbolsx[i].observees).join(", ").replace(/\//g,''));
				if(WATCHES==""){
					WATCHES = blank;
				}
			var UPDATES = Eden.deHTML(SG.propertiesFromObject(symbolsx[i].observers).join(", ").replace(/\//g,''));
				if(UPDATES==""){
					UPDATES = blank;
				}
			
			//Reasoning /push to appropriate array
			if(ofai==1){
				functs.push(def);
			}
			else if(ofai==0){
				if((value==blank)&&(def==blank)){
					continue;
				}
				else if(def==blank){
					obsAssins.push(name+" = "+value+";");
				}
				else{
					obsDefs.push(def+";");
				}
			}
			else if(ofai==2){
				acts.push(def);
			}
			else{
				console.log("oh dear error");
			}
		}
		
		//Script Generation
		var lines = [];
			
		lines.push(comments[0]);
		lines.push("");
		lines.push(comments[1]);
		lines.push(autocalcOff);
		lines.push("");
		lines.push(comments[2]);
		lines.push("");
		for(var i=0; i<obsAssins.length; i++){
			lines.push(obsAssins[i]);
		}
		lines.push("");
		lines.push(comments[3]);
		lines.push("");
		for(var i=0; i<obsDefs.length; i++){
			lines.push(obsDefs[i]);
		}
		lines.push("");
		lines.push(comments[4]);
		lines.push("");	
		for(var i=0; i<acts.length; i++){
			lines.push(acts[i]);
			lines.push("");
		}
		lines.push("");
		lines.push(comments[5]);
		lines.push("");
		for(var i=0; i<functs.length; i++){
			lines.push(functs[i]);
			lines.push("");
		}
		lines.push(comments[6]);
		lines.push(picture);
		lines.push("");
		lines.push(comments[7]);
		lines.push(autocalcOn);
		lines.push("");
		lines.push(comments[8]);

		//console.log(lines.join("\n"));

		return "<pre>"+lines.join("\n")+"</pre>";
	}
	
	SG.arrayFromObject = function(object){

		var temp = [];

		$.each(object, function(){
			temp.push(this);
		});
		
		return temp;
	}
	
	SG.propertiesFromObject = function(object){

		var temp = [];

		$.each(object, function(x){
			temp.push(x);
		});
		
		return temp;
	}
	
	SG.toActualString = function(array){
		var returnstring = "[";
		for(var i=0; i<array.length; i++){
			if(typeof array[i]=="string"){
				returnstring = returnstring+"\""+String(array[i])+"\""
			}
			else if(array[i] instanceof Array){
				returnstring = returnstring+SG.toActualString(array[i]);
			}
			else{
				returnstring = returnstring+String(array[i]);
			}
			if(i!=array.length-1){
				returnstring = returnstring +", "
			}
		}
		returnstring = returnstring+"]";
		return returnstring;
	}

	success();
};
/* Plugin meta information */
EdenUI.plugins.SG.title = "Script Generator (SG)";
EdenUI.plugins.SG.description = "A script that represents the model";
EdenUI.plugins.SG.author = "Joe Butler";
