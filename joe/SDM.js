
var SDM = {};

SDM.filterString = "MO";
//Global String to maintain which buttons are depressed

SDM.printOutModelDatabase = function(){
//TESTING PURPOSES ONLY
	var db = SDM.getStateDatabase();
	
	for(var i=0; i<db.length; i++){

		var depon = db[i].dependantOn;
		var deponString = "";
		var depto = db[i].dependantTo;
		var deptoString = "";
		
		for(var j=0; j<depon.length; j++){
			deponString = deponString+", "+depon[j];
		}
		for(var j=0; j<depto.length; j++){
			deptoString = deptoString+", "+depto[j];
		}
		if(!db[i].system){
			console.log(db[i].name+"/ "+db[i].value+"/ "+deponString+"/ "+deptoString+"/ DEFINITION/ "+db[i].system+"/ "+db[i].ofa);
		}
	}
}

SDM.filterButton = function(name){

	if(name=='System'){
		if(SDM.filterString.indexOf("S") != -1){
			SDM.filterString = SDM.filterString.replace("S","");
		}
		else{
			SDM.filterString = SDM.filterString.concat("S");
		}
	}
	else if(name=='Model'){
		if(SDM.filterString.indexOf("M") != -1){
			SDM.filterString = SDM.filterString.replace("M","");
		}
		else{
			SDM.filterString = SDM.filterString.concat("M");
		}
	}
	else if(name=='Observables'){
		if(SDM.filterString.indexOf("O") != -1){
			SDM.filterString = SDM.filterString.replace("O","");
		}
		else{
			SDM.filterString = SDM.filterString.concat("O");
		}	
	}
	else if(name=='Functions'){
		if(SDM.filterString.indexOf("F") != -1){
			SDM.filterString = SDM.filterString.replace("F","");
		}
		else{
			SDM.filterString = SDM.filterString.concat("F");
		}	
	}
	else if(name=='Agents'){
		if(SDM.filterString.indexOf("A") != -1){
			SDM.filterString = SDM.filterString.replace("A","");
		}
		else{
			SDM.filterString = SDM.filterString.concat("A");
		}	
	}

	SDM.refreshButton();

}

SDM.updateButtons = function(){

	var buttons = [];
	
	buttons.push(document.getElementsByName("SystemButton")[0]);
	buttons.push(document.getElementsByName("ModelButton")[0]);
	buttons.push(document.getElementsByName("ObservablesButton")[0]);
	buttons.push(document.getElementsByName("AgentsButton")[0]);
	buttons.push(document.getElementsByName("FunctionsButton")[0]);
	
	for(var i=0; i<buttons.length; i++){
		if(SDM.filterString.indexOf(buttons[i].name[0])!=-1){
		//If button is supposed to be bold
			if(buttons[i].innerHTML.indexOf("<b>")!=-1){
			//If button is already bold	
				//Do nothing
			}
			else{
			//If button is not already bold	
				//Make it bold
				buttons[i].innerHTML = "<b>".concat(buttons[i].innerHTML.concat("</b>"));
			}
		}
		else{
		//If button is not supposed to be bold
			if(buttons[i].innerHTML.indexOf("<b>")!=-1){
			//If button is already bold	
				buttons[i].innerHTML = buttons[i].innerHTML.replace("<b>","");
				buttons[i].innerHTML = buttons[i].innerHTML.replace("</b>","");
			}
			else{
			//If button is not already bold	
				//do nothing
			}
		}
	}
}

SDM.refreshButton = function(){

	var views = document.getElementsByClassName("SDM-content");
	views[0].innerHTML = SDM.generateHTML();
	SDM.updateButtons();
}

Array.prototype.stringify = function(){

	var ret = undefined;
	
	for(var i=0; i<this.length; i++){
		if(ret==undefined){
			ret = this[i];
		}
		else{
			ret = ret+", "+this[i];
		}
	}
	return ret;
}

SDM.generateHTML = function(){

	var db = SDM.getFilteredDatabase(SDM.filterString);
	
	//table header
	var HTML = "<th>Name</th><th>Current Value</th><th>Dependant On</th><th>Dependant To</th><th>Definition</th>";
	
	for(var i=0; i<db.length; i++){
	
		//table cells
		HTML = HTML.concat("<tr><td><p>"+db[i].name+"</p></td><td><p>"+db[i].value+"</p></td><td><p>"+db[i].dependantOn.stringify()+"</p></td><td><p>"+db[i].dependantTo.stringify()+"</p></td><td><p>"+db[i].definition+"</p></td></tr>");
	}
	
	//wrap the table element around it
	HTML = ("<table class='SDM'>".concat(HTML)).concat("</table>");
	
	//add the buttons
	
	HTML = ("<button name='SystemButton' onclick='SDM.filterButton(\"System\")' type='button'>System</button><button name='ModelButton' onclick='SDM.filterButton(\"Model\")' type='button'>Model</button><button style='float: right'; name='RefreshButton' onclick='SDM.refreshButton()' type='button'>Refresh</button><br/><button name='ObservablesButton' onclick='SDM.filterButton(\"Observables\")' type='button'>Observables</button><button name='AgentsButton' onclick='SDM.filterButton(\"Agents\")' type='button'>Agents</button><button name='FunctionsButton' onclick='SDM.filterButton(\"Functions\")' type='button'>Functions</button>").concat(HTML);
	
	return HTML;
}

SDM.getFilteredDatabase = function(filterBy){
//String passed substring of "SMOFA"
//if letter S is contained, output will include system
//if letter M is contained, output will include model

	var fdb = SDM.getStateDatabase();

	for(var i=0; i<fdb.length; i++){

			if(fdb[i].system){
				if(filterBy.indexOf("S")==-1){
					fdb.splice(i,1);
					i--;
					continue;
				}
			}


			if(!fdb[i].system){
				if(filterBy.indexOf("M")==-1){
					fdb.splice(i,1);
					i--;
					continue;
				}
			}
	
			if((fdb[i].ofa=="Observable")){
				if(filterBy.indexOf("O")==-1){
					fdb.splice(i,1);
					i--;
					continue;
				}
			}


			if((fdb[i].ofa=="Function")){
				fdb.splice(i,1);
				i--;
				continue;
			}


			if((fdb[i].ofa=="Agent")){
				fdb.splice(i,1);
				i--;
				continue;
			}

	}
	//Else will not filter by O/F/A ie: will be all
	
	return fdb;
}

SDM.getStateDatabase = function(){
	
	var database = [];
	
	var all = SDM.getAllSymbolNames();

	for(var i=0; i<all.length; i++){
	
		var dbObject = {};
		dbObject.name = all[i];
		dbObject.value = SDM.getSymbolValue(all[i]);
		dbObject.dependantOn = SDM.getDependantOn(all[i]);
		dbObject.dependantTo = SDM.getDependantTo(all[i]);
		dbObject.definition = SDM.getDefinition(all[i]);

		var sd = SDM.getSymbolDetails(all[i]);
		if(sd[0]=="S"){
			dbObject.system = true;
		}
		else{
			dbObject.system = false;
		}
		
		if(sd[1]=="O"){
			dbObject.ofa = "Observable";
		}
		else if(sd[1]=="F"){
			dbObject.ofa = "Function";
		}
		else if(sd[1]=="A"){
			dbObject.ofa = "Agent";
		}
		
		database.push(dbObject);

	}
	
	return database;
}

SDM.getSymbolDetails = function(name){
//returns one of either SO, SF, SA, SU, MO, MF, MA, MU
//if the symbol is S_ system, M_ model
//_O observable, _F function, _A agent, _U Unknown
//respectively

	if(SDM.isitSystemObservable(name)){
		return "SO";
	}
	else if(SDM.isitSystemAgent(name)){
		return "SA";
	}
	else if(SDM.isitSystemFunction(name)){
		return "SF";
	}
	else{
		return "MU";
		//Need a way to determine whether the model is OFA when M
	}
}

SDM.getAllSymbolNames = function(){
	
	return(SDM.getObjectProperties(root.symbols));
	
}

SDM.lookupSymbol = function(name){

	return root.lookup(name);
}

SDM.getObjectProperties = function(object){

	var temp = [];

	$.each(object, function (f1) {
		temp.push(f1);
	});
	
	return temp;
}

SDM.removeSlashFromNames = function(array){

	for(var i=0; i<array.length; i++){
		array[i] = array[i].substring(1,array[i].length);
	}
	return array;
}

SDM.getSymbolValue = function(name){

	return SDM.lookupSymbol(name).value();
}

SDM.getDefinition = function(name){

	return SDM.lookupSymbol(name).eden_definition;
}

SDM.getDependantOn = function(name){

	return SDM.removeSlashFromNames(SDM.getObjectProperties(SDM.lookupSymbol(name).dependencies));
}

SDM.getDependantTo = function(name){

	return SDM.removeSlashFromNames(SDM.getObjectProperties(SDM.lookupSymbol(name).subscribers));
}

SDM.isitSystemObservable = function(name){
	
	for(var j=0; j<SDM.systemObservableNames.length; j++){
	
		var pattern = new RegExp(SDM.systemObservableNames[j]);
		
			if(pattern.test(name)){
				return true;
			}

	}
	return false;
}

SDM.isitSystemAgent = function(name){

	for(var j=0; j<SDM.systemAgentNames.length; j++){
	
		var pattern = new RegExp(SDM.systemAgentNames[j]);

			if(pattern.exec(name)){
				return true;
			}
	}
	return false;
}

SDM.isitSystemFunction = function(name){

	for(var j=0; j<SDM.systemFunctionNames.length; j++){
	
		var pattern = new RegExp(SDM.systemFunctionNames[j]);
		
			if(pattern.exec(name)){
				return true;
			}
	}
	return false;
}

SDM.systemObservableNames = [
	"_view*",
	"true",
	"false",
	"autocalc",
	"_status",
	"canvas",
	"picture",
	"mouseX",
	"mouseY"
];

SDM.systemAgentNames = [
	"_View_*",
	"drawPicture",
	"updateCanvas",
	"_MenuBar_Status",
];

SDM.systemFunctionNames = [
	"int",
	"translate",
	"cos",
	"sin",
	"str",
	"eager",
	"time",
	"writeln",
	"rand",
	"srand",
	"substr",
	"forget",
	"include",
	"execute",
	"require",
	"createView",
	"hideView",
	"moveView",
	"resizeView",
	"includeSSI",
	"Vector",
	"Matrix",
	"Plane",
	"TestDraw",
	"abs",
	"acos",
	"asin",
	"atan",
	"ceil",
	"exp",
	"floor",
	"log",
	"pow",
	"random",
	"round",
	"sqrt",
	"tan",
	"centre",
	"rotate",
	"include_js",
	"include_css",
	"CanvasHTML5_DrawPicture",
	"Arc",
	"Button",
	"Circle",
	"Combobox",
	"Div",
	"Image",
	"Line",
	"Polygon",
	"Rectangle",
	"Slider",
	"Text",
	"Point",
];