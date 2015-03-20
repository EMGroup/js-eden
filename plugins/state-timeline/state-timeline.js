EdenUI.plugins.StateTimeLine = function(edenUI, success){
	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
	//This doesn't look like its ever being called
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"StateTimeLine");
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
		me.ignoreRE = new RegExp("((_view.*)|(_View.*)|(_status)|(mouse.*)|(picture))");
		
		code_entry = $('<div id=\"'+name+'-content\" class=\"st-content\"></div>').append($("<input id=\""+name+"-regex\"></input>")).append($('<button style="margin-bottom:20px;">Generate State</button>').click(function(){
			
			//Adds a new state to the tree
			me.ST.states.push(generateState("partial"));
			
			var statename = document.getElementById(name+"-regex").value;
			if(statename==""){
				statename = "State " + me.ST.nextBlankState;
			}
			
			$('#'+name+'-content-states').append(
				"<div id='stdiv"+edenUI.plugins.StateTimeLine.ST.nextBlankState+"' class='stdiv'>"+statename+": <a class='stlinkrestore' href='javascript:edenUI.plugins.StateTimeLine.changeState("+edenUI.plugins.StateTimeLine.ST.nextBlankState+")'>Restore</a> "+new Date().toLocaleTimeString()+" <a class='stlinkdelete' href='javascript:edenUI.plugins.StateTimeLine.deleteState("+edenUI.plugins.StateTimeLine.ST.nextBlankState+")'> Delete</a></div>"
			);
			
			document.getElementById(name+"-regex").value = "";
			
			//Increment the next blank state
			edenUI.plugins.StateTimeLine.ST.nextBlankState++;
			
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
			
				if(edenUI.plugins.StateTimeLine.ignoreRE.test(root.symbols[ii].name.substring(1,root.symbols[ii].name.length))){
				//console.log("not deleting:"+root.symbols[ii].name)
					continue;
				}
				//console.log("deleting:"+root.symbols[ii].name)
				delete root.symbols[ii];
			}
			
			//Interpret the given state
			edenUI.plugins.ScriptInput.submitEdenCode(edenUI.plugins.StateTimeLine.ST.states[stateIndex]);
			
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
	
		var generateState = function(type){
		//generates the content

		var HTML = "";
		
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
		for(var name in root.symbols){
		
			var blank = "@";
			var ofa = "";
			var ofai = 5;

			var symbol = root.symbols[name];
			var def = symbol.eden_definition;
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
				
			var value = Eden.edenCodeForValue(symbol.cached_value);
			
			//Reasoning /push to appropriate array
						
			if(edenUI.plugins.StateTimeLine.ignoreRE.test(name)){
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
	edenUI.views["StateTimeLine"] = {dialog: this.createDialog, title: "State Time Line", category: edenUI.viewCategories.history};
	success();
};
/* Plugin meta information */
EdenUI.plugins.StateTimeLine.title = "State Time Line";
EdenUI.plugins.StateTimeLine.description = "Provides the ability to save the current state, keep a history of saved states and go back to a saved state later.";
EdenUI.plugins.StateTimeLine.author = "Joe Butler";
