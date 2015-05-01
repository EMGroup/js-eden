//System Symbols
Eden.systemObservableNames = [
	"_authoringMode",
	"_debug_.*",
	"_menubar_status",
	"PI",
	"autocalc",
	"mouseButton",
	"mouseButtons",
	"mouseCaptured",
	"mouseDoubleClicks",
	"mouseDown",
	"mouseDownWindow",
	"mousePosition",
	"mousePressed",
	"mouseUp",
	"mouseWheel",
	"mouseWindow",
	"randomGeneratorState",
	"randomIndex",
	"screenHeight",
	"screenWidth",
	"touchScrollX"
];

Eden.systemAgentNames = [
	"_View_.*",
	"alias",
	"arrangeWindows",
	"attemptMouseCapture",
	"bindCSSNumericProperty",
	"bindCSSProperty",
	"bindCSSRule",
	"createCanvas",
	"createHTMLView",
	"createView",
	"destroyView",
	"eager",
	"error",
	"hideView",
	"html",
	"moveView",
	"patch",
	"removeedenclock",
	"resizeView",
	"setedenclock",
	"setProperty",
    "showObservables",
	"showView",
	"todo",
	"touch",
	"unbind",
	"withAppendedItem",
	"writeln"
];

Eden.systemFunctionNames = [
	"Arc",
	"BulletSlide",
	"Button",
	"CanvasHTML5_DrawPicture",
	"Checkbox",
	"Circle",
	"Combobox",
	"Div",
	"Ellipse",
	"FillPattern",
	"GreyPixelList",
	"HTMLImage",
	"Image",
	"Line",
	"LinearGradient",
	"LineSequence",
	"List",
	"Menu",
	"MenuItem",
	"Pixel",
	"PixelList",
	"Point",
	"Polygon",
	"RadialGradient",
	"RadioButtons",
	"RE",
	"Rectangle",
	"RegularPolygon",
	"RoundedRectangle",
	"Sector",
	"Shadow",
	"Slide",
	"Slider",
	"Text",
	"Textbox",
	"TitledSlide",
	"TitleSlide",
	"Video",
	"abs",
	"acos",
	"apply",
	"array",
	"asin",
	"atan",
	"canvasURL",
	"ceil",
	"centroid",
	"char",
	"charCode",
	"choose",
	"compose",
	"concat",
	"cos",
	"curry",
	"decodeHTML",
	"definitionOf",
	"definitionRHS",
	"doDefault",
	"edenCode",
	"escapeRE",
	"execute",
	"exp",
	"floor",
	"foldl",
	"foldr",
	"forget",
	"forgetAll", 
	"generate_function",
	"hasProperty",
	"hsl2colour",
	"htmlBulletList",
	"htmlNumberedList",
	"imageWithZones",
	"include",
	"include_css",
	"indexOf",
	"indexOfRE",
	"int",
	"isBoolean",
	"isCallable",
	"isChar",
	"isDefined",
	"isDependency",
	"isDependent",
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
	"map",
	"mapPartial",
	"max",
	"min",
	"mod",
	"nameof",
	"partApply",
	"pow",
	"properties",
	"rand",
	"random",
	"randomInteger",
	"replaceFirst",
	"require",
	"reverse",
	"rgb2colour",
	"rotate",
	"round",
	"roundDown",
	"roundUp",
	"scale",
	"search",
	"sequenceItoJ",
	"sequenceN",
	"sequenceArithmetic",
	"sequenceArithmeticN",
	"sequenceList",
	"sequencePrevious",
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
	"uppercase",
	"xorshiftRandomGenerator"
];
Eden.isitSystemSymbol = function(name){
	return Eden.isitSystemObservable(name) || Eden.isitSystemAgent(name) || Eden.isitSystemFunction(name);
}

Eden.isitSystemObservable = function(name) {
	if (/^_view_/.test(name) && !/_background_colour$/.test(name)) {
	  return true;
	}
	for (var j = 0; j < Eden.systemObservableNames.length; j++) {
		var pattern = new RegExp("^" + Eden.systemObservableNames[j] + "$");
		if (pattern.test(name)) {
			return true;
		}
	}
	return false;
}
Eden.isitSystemAgent = function(name){
	for (var j = 0; j < Eden.systemAgentNames.length; j++) {
		var pattern = new RegExp("^" + Eden.systemAgentNames[j] + "$");
		if (pattern.test(name)) {
			return true;
		}
	}
	return false;
}
Eden.isitSystemFunction = function(name) {
	for(var j = 0; j < Eden.systemFunctionNames.length; j++) {
		var pattern = new RegExp("^" + Eden.systemFunctionNames[j] + "$");
		if (pattern.test(name)) {
			return true;
		}
	}
	return false;
}
