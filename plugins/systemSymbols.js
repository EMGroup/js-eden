//System Symbols
Eden.systemObservableNames = [
	"_status",
	"Infinity",
	"PI",
	"autocalc",
	"false",
	"generate_function",
	"mouseDown",
	"mouseDownWindow",
	"mousePosition",
	"mousePressed",
	"mouseUp",
	"mouseWindow",
	"radiansPerUnit",
	"true"
];

Eden.systemAgentNames = [
	"_MenuBar_Status",
	"_update_.*",
	"alias",
	"createCanvas",
	"createHTMLView",
	"createView",
	"eager",
	"error",
	"hideView",
	"html",
	"moveView",
	"patch",
	"resizeView",
	"setProperty",
    "showObservables",
	"todo",
	"updateCanvas",
	"withAppendedItem",
	"writeln"
];

Eden.systemFunctionNames = [
	"Arc",
	"BulletSlide",
	"Button",
	"CanvasHTML5_DrawPicture",
	"Circle",
	"Combobox",
	"Div",
	"Image",
	"Line",
	"Pixel",
	"PixelList",
	"Point",
	"Polygon",
	"RadioButtons",
	"Rectangle",
	"Sector",
	"Shadow",
	"Slider",
	"Text",
	"Textbox",
	"TitleSlide",
	"abs",
	"acos",
	"apply",
	"array",
	"asin",
	"atan",
	"bulletList",
	"canvasImage",
	"ceil",
	"centre",
	"char",
	"charCode",
	"choose",
	"concat",
	"cos",
	"definitionOf",
	"definitionRHS",
	"dependent",
	"doDefault",
	"edenCode",
	"execute",
	"exp",
	"floor",
	"forget",
	"generate_function",
	"hasProperty",
	"hsl",
	"include",
	"include_css",
	"indexOf",
	"int",
	"isBoolean",
	"isCallable",
	"isChar",
	"isDefined",
	"isDependency",
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
	"lookup",
	"lowercase",
	"max",
	"min",
	"mod",
	"nameof",
	"pow",
	"properties",
	"rand",
	"random",
	"randomInteger",
	"replaceFirst",
	"require",
	"reverse",
	"rgb",
	"rotate",
	"round",
	"scale",
	"search",
	"sin",
	"sort",
	"sqrt",
	"srand",
	"str",
	"strcat",
	"sublist",
	"substr",
	"tail",
	"tan",
	"time",
	"translate",
	"trim",
	"type",
	"uppercase"
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
