Eden.systemObservableNames = [
	"_view*",
	"true",
	"false",
	"active_tab",
	"mouseClickX",
	"mouseClickY",
	"mousePressed",
	"mouseDown",
	"mouseUp",
	"autocalc",
	"_status",
	"canvas",
	"mouseX",
	"mouseY"
];

Eden.systemAgentNames = [
	"_View_*",
	"drawPicture",
	"updateCanvas",
	"_MenuBar_Status"
];

Eden.systemFunctionNames = [
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
	"html",
    "Inputbox",
    "getInputWindowCode",
    "showObservables",
	"RadioButtons",
	"Pixel",
	"Textbox",
	"canvasImage"
];
Eden.isitSystemSymbol = function(name){

	if(Eden.isitSystemFunction(name)){
		return true;
	}
	else if(Eden.isitSystemObservable(name)){
		return true;
	}
	else if(Eden.isitSystemAgent(name)){
		return true;
	}
	return false;
}

Eden.isitSystemObservable = function(name){

	var pattern1 = new RegExp("^_view_");

	if(pattern1.test(name)){
		return true;
	}
	
	for(var j=0; j<Eden.systemObservableNames.length; j++){
	
		var pattern = new RegExp("^"+Eden.systemObservableNames[j]+"$");
		
			if(pattern.test(name)){
				return true;
			}
	}
	return false;
}
Eden.isitSystemAgent = function(name){

	var pattern2 = new RegExp("^_View_");
	if(pattern2.test(name)){
		return true;
	}

	for(var j=0; j<Eden.systemAgentNames.length; j++){
	
		var pattern = new RegExp("^"+Eden.systemAgentNames[j]+"$");

			if(pattern.test(name)){
				return true;
			}
	}
	return false;
}
Eden.isitSystemFunction = function(name){

	for(var j=0; j<Eden.systemFunctionNames.length; j++){
	
		var pattern = new RegExp("^"+Eden.systemFunctionNames[j]+"$");
		
			if(pattern.test(name)){
				return true;
			}
	}
	return false;
}