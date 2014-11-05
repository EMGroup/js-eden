//System Symbols
Eden.systemObservableNames = [
	"_status",
	"_view*",
	"Infinity",
	"active_tab",
	"autocalc",
	"canvas",
	"false",
	"generate_function",
	"mouseClickX",
	"mouseClickY",
	"mouseDown",
	"mousePressed",
	"mouseUp",
	"mouseX",
	"mouseY",
	"true"
];

Eden.systemAgentNames = [
	"_MenuBar_Status",
	"_View_*",
	"createView",
	"drawPicture",
	"error",
	"hideView",
	"html",
	"moveView",
	"resizeView",
    "showObservables",
	"todo",
	"updateCanvas",
	"writeln"
];

Eden.systemFunctionNames = [
	"_keys",
	"Arc",
	"Button",
	"CanvasHTML5_DrawPicture",
	"Circle",
	"Combobox",
	"Div",
	"Image",
    "Inputbox",
	"Line",
	"Matrix",
	"Pixel",
	"Plane",
	"Point",
	"Polygon",
	"RadioButtons",
	"Rectangle",
	"Slider",
	"TestDraw",
	"Text",
	"Textbox",
	"Vector",
	"abs",
	"acos",
	"apply",
	"array",
	"asin",
	"atan",
	"canvasImage",
	"ceil",
	"centre",
	"char",
	"charCode",
	"concat",
	"cos",
	"doDefault",
	"eager",
	"execute",
	"exp",
	"floor",
	"forget",
	"generate_function",
	"include",
	"includeSSI",
	"include_css",
	"indexOf",
	"int",
	"isBoolean",
	"isCallable",
	"isChar",
	"isDefined",
	"isFunc",
	"isInt",
	"isList",
	"isNaN",
	"isNumber",
	"isObject",
	"isPointer",
	"isProc",
	"isString",
	"listcat",
	"log",
	"lowercase",
	"max",
	"min",
	"mod",
	"nameof",
	"pow",
	"rand",
	"random",
	"randomInteger",
	"replaceFirst",
	"require",
	"reverse",
	"rotate",
	"round",
	"search",
	"sin",
	"sort",
	"sqrt",
	"srand",
	"str",
	"strcat",
	"sublist",
	"substr",
	"tan",
	"time",
	"translate",
	"trim",
	"type",
	"uppercase",
    "getInputWindowCode" //No longer exists?
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
