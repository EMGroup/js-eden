//System Symbols
Eden.systemObservableNames = {
	"_authoringMode": true,
	"_menubar_status": true,
	"PI": true,
	"autocalc": true,
	"debug": true,
	"mouseButton": true,
	"mouseButtons": true,
	"mouseCaptured": true,
	"mouseDoubleClicks": true,
	"mouseDown": true,
	"mouseDownWindow": true,
	"mousePosition": true,
	"mousePressed": true,
	"mouseUp": true,
	"mouseWheel": true,
	"mouseWheelDir": true,
	"mouseWindow": true,
	"mouseX": true,
	"mouseY": true,
	"randomGeneratorState": true,
	"randomIndex": true,
	"screenHeight": true,
	"screenWidth": true,
	"touchScrollX": true,
	"touchScrollXDir": true,
	"_views_frame_width": true,
	"_views_frame_height": true,
};

Eden.systemAgentNames = {
	"alias": true,
	"arrangeWindows": true,
	"attemptMouseCapture": true,
	"bindCSSNumericProperty": true,
	"bindCSSProperty": true,
	"bindCSSRule": true,
	"createCanvas": true,
	"createHTMLView": true,
	"createView": true,
	"destroyView": true,
	"eager": true,
	"error": true,
	"hideView": true,
	"html": true,
	"moveView": true,
	"patch": true,
	"removeedenclock": true,
	"resizeView": true,
	"setedenclock": true,
	"setProperty": true,
    "showObservables": true,
	"showView": true,
	"todo": true,
	"touch": true,
	"unbind": true,
	"withAppendedItem": true,
	"writeln": true,
};

Eden.systemFunctionNames = {
	"Arc": true,
	"BulletSlide": true,
	"Button": true,
	"Checkbox": true,
	"Circle": true,
	"Combobox": true,
	"Div": true,
	"Ellipse": true,
	"FillPattern": true,
	"GreyPixelList": true,
	"HTMLImage": true,
	"Image": true,
	"Line": true,
	"LinearGradient": true,
	"LineSequence": true,
	"List": true,
	"Menu": true,
	"MenuItem": true,
	"Pixel": true,
	"PixelList": true,
	"Point": true,
	"Polygon": true,
	"RadialGradient": true,
	"RadioButtons": true,
	"RE": true,
	"Rectangle": true,
	"RegularPolygon": true,
	"RoundedRectangle": true,
	"Sector": true,
	"Shadow": true,
	"Slide": true,
	"Slider": true,
	"Text": true,
	"Textbox": true,
	"TitledSlide": true,
	"TitleSlide": true,
	"Video": true,
	"abs": true,
	"acos": true,
	"apply": true,
	"array": true,
	"asin": true,
	"atan": true,
	"canvasURL": true,
	"ceil": true,
	"centroid": true,
	"char": true,
	"charCode": true,
	"choose": true,
	"compose": true,
	"concat": true,
	"cos": true,
	"curry": true,
	"decodeHTML": true,
	"definitionOf": true,
	"definitionRHS": true,
	"doDefault": true,
	"edenCode": true,
	"escapeRE": true,
	"execute": true,
	"exp": true,
	"floor": true,
	"foldl": true,
	"foldr": true,
	"forget": true,
	"forgetAll": true,
	"generate_function": true,
	"hasProperty": true,
	"hsl2colour": true,
	"htmlBulletList": true,
	"htmlNumberedList": true,
	"imageWithZones": true,
	"include": true,
	"include_css": true,
	"indexOf": true,
	"indexOfRE": true,
	"int": true,
	"isBoolean": true,
	"isCallable": true,
	"isChar": true,
	"isDefined": true,
	"isDependency": true,
	"isDependent": true,
	"isFunc": true,
	"isInt": true,
	"isList": true,
	"isNaN": true,
	"isNumber": true,
	"isObject": true,
	"isPointer": true,
	"isProc": true,
	"isString": true,
	"ln": true,
	"log": true,
	"lookup": true,
	"lowercase": true,
	"map": true,
	"mapPartial": true,
	"max": true,
	"min": true,
	"mod": true,
	"nameof": true,
	"partApply": true,
	"pow": true,
	"properties": true,
	"rand": true,
	"random": true,
	"randomBoolean": true,
	"randomFloat": true,
	"randomInteger": true,
	"replaceFirst": true,
	"require": true,
	"reverse": true,
	"rgb2colour": true,
	"rotate": true,
	"round": true,
	"roundDown": true,
	"roundUp": true,
	"scale": true,
	"search": true,
	"sequenceItoJ": true,
	"sequenceN": true,
	"sequenceArithmetic": true,
	"sequenceArithmeticN": true,
	"sequenceList": true,
	"sequencePrevious": true,
	"sin": true,
	"sort": true,
	"sqrt": true,
	"str": true,
	"sublist": true,
	"substr": true,
	"sum": true,
	"tail": true,
	"tan": true,
	"textWidth": true,
	"time": true,
	"translate": true,
	"trim": true,
	"type": true,
	"uppercase": true,
	"xorshiftRandomGenerator": true,
};

Eden.symbolCategories = {};
Eden.symbolCategories["Canvas 2D"] = {
	obs: {
		"_view_picture_background_colour": true,
		"_view_picture_offset": true,
		"_view_picture_scale": true,
		"_view_picture_title": true,
		"_view_picture_width": true,
		"_view_picture_height": true,
		"menus": true,
		"mouseButton": true,
		"mouseButtons": true,
		"mouseCapture": true,
		"mouseCaptured": true,
		"mouseContextMenuEnabled": true,
		"mouseDoubleClicks": true,
		"mouseDown": true,
		"mouseDownWindow": true,
		"mouseFollow": true,
		"mousePosition": true,
		"mousePressed": true,
		"mouseUp": true,
		"mouseWheel": true,
		"mouseWheelEnabled": true,
		"mouseWheelDir": true,
		"mouseWindow": true,
		"mouseX": true,
		"mouseY": true,
		"picture": true,
		"touchScrollX": true,
		"touchScrollXDir": true,
	},
	agent: {
		"attemptMouseCapture": true,
		"bindCSSNumericProperty": true,
		"bindCSSProperty": true,
		"bindCSSRule": true,
		"createCanvas": true,
		"destroyView": true,
		"include_css": true,
		"unbind": true,
	},
	func: {
		"Arc": true,
		"Button": true,
		"canvasURL": true,
		"Checkbox": true,
		"Circle": true,
		"Combobox": true,
		"Div": true,
		"Ellipse": true,
		"FillPattern": true,
		"GreyPixelList": true,
		"hsl2colour": true,
		"HTMLImage": true,
		"Image": true,
		"imageWithZones": true,
		"Line": true,
		"LinearGradient": true,
		"LineSequence": true,
		"Menu": true,
		"MenuItem": true,
		"Pixel": true,
		"PixelList": true,
		"Point": true,
		"Polygon": true,
		"RadialGradient": true,
		"RadioButtons": true,
		"Rectangle": true,
		"RegularPolygon": true,
		"rgb2colour": true,
		"RoundedRectangle": true,
		"Sector": true,
		"Shadow": true,
		"Slider": true,
		"Text": true,
		"Textbox": true,
		"textWidth": true,
		"Video": true,
	}
};


Eden.isitSystemSymbol = function(name){
	return Eden.isitSystemObservable(name) || Eden.isitSystemAgent(name) || Eden.isitSystemFunction(name);
}

Eden.isitSystemObservable = function(name) {
	if (/^_view_/.test(name) && !/_(background_colour|offset|scale)$/.test(name)) {
	  return true;
	}
	return name in Eden.systemObservableNames;
}
Eden.isitSystemAgent = function(name){
	if (/^_View_/.test(name)) {
		return true;
	}
	return name in Eden.systemAgentNames;
}
Eden.isitSystemFunction = function(name) {
	return name in Eden.systemFunctionNames;
}

Eden.isitCategory = function (name, category, type) {
	var categoryData = Eden.symbolCategories[category];
	if (type == "all") {
		return ("obs" in categoryData && name in categoryData.obs) ||
			("agent" in categoryData && name in categoryData.agent) ||
			("func" in categoryData && name in categoryData.func);
	} else {
		return type in categoryData && name in categoryData[type];
	}
}

Eden.getSymbolCategories = function (type) {
	if (type == "all") {
		return Object.keys(Eden.symbolCategories);
	} else {
		var applicableCategories = [];
		for (var category in Eden.symbolCategories) {
			if (type in Eden.symbolCategories[category]) {
				applicableCategories.push(category);
			}
		}
		return applicableCategories;
	}
}
