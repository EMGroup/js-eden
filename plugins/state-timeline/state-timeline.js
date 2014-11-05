EdenUI.plugins.ST = function(edenUI, success){
	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
	//This doesn't look like its ever being called
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"ST");
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

		//Things not to delete
		me.ignoreRE = new RegExp("((_view.*)|(_View.*)|(_status)|(mouse.*)|(picture)|(canvas)|(drawPicture)|(CanvasHTML5_DrawPicture)|(updateCanvas))");
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"st-content\"></div>').append($("<input id=\""+name+"-regex\"></input>")).append($('<button style="margin-bottom:20px;">Generate State</button>').click(function(){
			
			//Adds a new state to the tree
			edenUI.plugins.ST.ST.states.push(edenUI.plugins.ST.generateState("partial"));
			
			var statename = document.getElementById(name+"-regex").value;
			if(statename==""){
				statename = "State "+edenUI.plugins.ST.ST.nextBlankState;
			}
			
			$('#'+name+'-content-states').append(
				"<div id='stdiv"+edenUI.plugins.ST.ST.nextBlankState+"' class='stdiv'>"+statename+": <a class='stlinkrestore' href='javascript:edenUI.plugins.ST.changeState("+edenUI.plugins.ST.ST.nextBlankState+")'>Restore</a> "+new Date().toLocaleTimeString()+" <a class='stlinkdelete' href='javascript:edenUI.plugins.ST.deleteState("+edenUI.plugins.ST.ST.nextBlankState+")'> Delete</a></div>"
			);
			
			document.getElementById(name+"-regex").value = "";
			
			//Increment the next blank state
			edenUI.plugins.ST.ST.nextBlankState++;
			
		})).append($('<div id="'+name+'-content-states"></div>'));
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog(
				{
					title: mtitle,
					width: 300,
					height: 450,
					minHeight: 120,
					minWidth: 230
				}
			)
			
			//Initialise 
	}
	
	me.ST = {};
	me.ST.states = [];
	me.ST.nextBlankState = 0;

		this.deleteState = function(index){
		
			($(document.getElementById("stdiv"+index))).remove();
		}
	
		this.changeState = function(stateIndex){
		//console.log("change state called"+stateIndex+" element:"+element)
		//console.log(me)
/*		
			var beforeStore = [];
			var before = 0;
			for(var i in root.symbols){
				before++;
				beforeStore.push(i);
			}
			//console.log("before"+before);
*/		
			//Erase everything
			for (var ii in root.symbols){
			
				if(Eden.isitSystemSymbol(root.symbols[ii].name.substring(1,root.symbols[ii].name.length))){
				//console.log("not deleting because its system:"+root.symbols[ii].name)
					continue;
				}
			
				if(edenUI.plugins.ST.ignoreRE.test(root.symbols[ii].name.substring(1,root.symbols[ii].name.length))){
				//console.log("not deleting:"+root.symbols[ii].name)
					continue;
				}
				//console.log("deleting:"+root.symbols[ii].name)
				delete root.symbols[ii];
			}
			
			//Interpret the given state
			edenUI.plugins.InputWindow.submitEdenCode(edenUI.plugins.ST.ST.states[stateIndex]);
			
/*
			var afterStore = [];
			var after = 0;
			for(var i in root.symbols){
				after++;
				afterStore.push(i);
			}
				
			var missingFromAfter = [];
			for(var i in beforeStore){
				if(afterStore.indexOf(beforeStore[i])==-1){
					missingFromAfter.push(beforeStore[i]);
				}
			}	
			var missingFromBefore = [];
			for(var i in afterStore){
				if(beforeStore.indexOf(afterStore[i])==-1){
					missingFromBefore.push(afterStore[i]);
				}
			}			
			console.log("missing from after");
			console.log(missingFromAfter);
			console.log(missingFromAfter.length);
			console.log("missing from before");
			console.log(missingFromBefore);
			console.log(missingFromBefore.length);
*/
			
		}
	
		this.generateState = function(type){
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
/*
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
*/		
		for(var i=0; i<symbolsx.length; i++){
		
			var blank = " - ";
			var ofa = "";
			var ofai = 5;
		
			var name = symbolsx[i].name.replace(/\//g,'');
						
			var def = symbolsx[i].eden_definition;
				if(def==undefined){
					def = blank;
				}
				
			//check this early
			if(def.indexOf("proc")==0){
				ofa = "(Action)";
				ofai = 2;

				if(type=="partial"){
					if(Eden.isitSystemAgent(name)){
						continue;
					}
				}
			}
			else if(def.indexOf("func")==0){
				ofa = "(Function)";
				ofai = 1;

				if(type=="partial"){
					if(Eden.isitSystemFunction(name)){
						continue;
					}
				}

			}
			else{
				ofa = "(Observable)";
				ofai = 0;

				if(type=="partial"){
					if(Eden.isitSystemObservable(name)){
						continue;
					}
				}
			}
				
			var value = ""+symbolsx[i].cached_value;
			
			if(Object.prototype.toString.call(symbolsx[i].cached_value) === '[object Array]'){
				value = "["+symbolsx[i].cached_value+"]"
			}
				if(value=="undefined"){
					value = blank;
				}
				else{
					if(typeof symbolsx[i].cached_value=="string"){
						value = "\""+value+"\"";
					}
				}
			var WATCHES = SG.propertiesFromObject(symbolsx[i].observees).join(", ").replace(/\//g,'');
				if(WATCHES==""){
					WATCHES = blank;
				}
			var UPDATES = SG.propertiesFromObject(symbolsx[i].observers).join(", ").replace(/\//g,'');
				if(UPDATES==""){
					UPDATES = blank;
				}
			
			//Reasoning /push to appropriate array
						
			if(edenUI.plugins.ST.ignoreRE.test(name)){
				continue;
			}
			
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
			
		//lines.push(comments[0]);
		//lines.push("");
		//lines.push(comments[1]);
		lines.push(autocalcOff);
		//lines.push("");
		//lines.push(comments[2]);
		//lines.push("");
		for(var i=0; i<obsAssins.length; i++){
			lines.push(obsAssins[i]);
		}
		//lines.push("");
		//lines.push(comments[3]);
		//lines.push("");
		for(var i=0; i<obsDefs.length; i++){
			lines.push(obsDefs[i]);
		}
		//lines.push("");
		//lines.push(comments[4]);
		//lines.push("");	
		for(var i=0; i<acts.length; i++){
			lines.push(acts[i]);
			lines.push("");
		}
		//lines.push("");
		//lines.push(comments[5]);
		//lines.push("");
		for(var i=0; i<functs.length; i++){
			lines.push(functs[i]);
			lines.push("");
		}
		//lines.push(comments[6]);
		lines.push(picture);
		//lines.push("");
		//lines.push(comments[7]);
		lines.push(autocalcOn);
		//lines.push("");
		//lines.push(comments[8]);

		//console.log(lines.join("\n"));

		return lines.join("\n");
	}
	
	//Register the HTML view options
	edenUI.views["ST"] = {dialog: this.createDialog, title: "State Timeline"};
	success();
};
/* Plugin meta information */
EdenUI.plugins.ST.title = "State Timeline (ST)";
EdenUI.plugins.ST.description = "A timeline of states for the Application Environment JS-EDEN";
EdenUI.plugins.ST.author = "Joe Butler";
