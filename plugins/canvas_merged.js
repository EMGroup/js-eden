/* Copyright (c) 2013-2022, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
let eden;
let root;
let edenUI;

global.CLIEden.setCanvasRoot = function(){
	eden = global.CLIEden.eden;
	edenUI = global.CLIEden.edenUI;
	root = eden.root;
};


// function setCanvasRoot(edenIn){
// 	eden = edenIn;
// 	root = edenIn.root;	
// 	root.lookup("mouseCapture").addJSObserver("releaseCapture", function (obs, lock) {
// 		if (!lock && document.exitPointerLock) {
// 			document.exitPointerLock();
// 		}
// 	});	
// }
Button = function (name, label, imageURL, x, y, width, minHeight, enabled, fillcolour, textcolour) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.label = label;
	this.imageURL = imageURL;
	this.x = x;
	this.y = y;
	this.width = width;
	this.minHeight = minHeight;
	this.enabled = enabled;
	this.fillcolour = fillcolour;
	this.textcolour = textcolour;
};

Button.imageFileSuffixes = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".svgz", ".webp", ".bmp", ".ico"];

Button.prototype.hash = function () {
	return this.name+"$$"+
				this.label+"$$"+
				this.imageURL+"$$"+
				this.x+"$$"+
				this.y+"$$"+
				this.width+"$$"+
				this.minHeight+"$$"+
				this.enabled+"$$"+
				this.fillcolour+"$$"+
				this.textcolour;
};

Button.prototype.draw = function (context) {

	if (this.elements === undefined) {
		var name = this.name;

		var disabled = this.enabled === false? 'disabled="disabled" ' : ' ';
		var inputHtml = '<button ' +
			disabled +
			'class="canvashtml-item" ' +
			'style="';
		if (this.fillcolour !== undefined) {
			inputHtml = inputHtml + 'background-color: ' + this.fillcolour + '; ';
		}
		if (this.textcolour !== undefined) {
			inputHtml = inputHtml + 'color: ' + this.textcolour + '; ';
		}
		if (this.width === undefined) {
			inputHtml = inputHtml + 'max-width: 256px';
		}
		inputHtml = inputHtml + '">';
		if (this.imageURL !== undefined) {
			inputHtml = inputHtml + '<img src="' + this.imageURL + '" style="max-width: 100%"/><br/>';
		}
		if (this.label !== undefined) {
			inputHtml = inputHtml + this.label;
		}
		inputHtml = inputHtml + '</button>';

		var inputJQ = $(inputHtml);
		var clickSym = root.lookup(name + "_click");
		if (clickSym.value() === undefined) {
			//var agent = root.lookup("Button");
			clickSym.assign(false, root.scope, EdenSymbol.hciAgent);
			root.lookup(name + "_clicked").assign(false, root.scope, EdenSymbol.hciAgent);
		}

		inputJQ
		.click(function () {
			root.lookup(name + "_clicked").assign(true, root.scope, EdenSymbol.hciAgent, true);
			root.lookup(name + "_clicked").assign(false, root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		var button = inputJQ.get(0);
		this.elements = [button];

	} else {

		//Case when the user has performed direct assignment to one or more JavaScript properties.
		var button = this.elements[0];
		button.value = this.label;

		if (this.enabled) {
			button.disabled = false;
		} else {
			button.disabled = true;
		}

		var style = button.style;
		var fillcolour = this.fillcolour;
		if (style.backgroundColor != fillcolour) {
			if (fillcolour === undefined) {
				style.backgroundColor = "";
			} else {
				style.backgroundColor = fillcolour;
			}
		}
		var textcolour = this.textcolour;
		if (style.color != textcolour) {
			if (textcolour === undefined) {
				style.color = "";
			} else {
				style.color = textcolour;
			}
		}
	}
};

Button.prototype.scale = function (scale, zoom, origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	style.fontSize = zoom + "em";

	if (this.width === undefined) {
		style.width = "";
	} else {
		style.width = Math.round(this.width * scale) + "px";
	}

	if (this.minHeight === undefined) {
		style.minHeight = "";
	} else {
		style.minHeight = Math.ceil(this.minHeight * scale) + "px";
	}
};

Button.prototype.toString = function () {
	var s;
	if (this.name == this.obsName) {
		s = "Button(" + Eden.edenCodeForValues(this.label, this.imageURL, this.x, this.y, this.enabled);
	} else {
		s = "Button(" + Eden.edenCodeForValues(this.name, this.label, this.imageURL, this.x, this.y, this.enabled);
	}
	if (this.fillcolour !== undefined || this.textcolour !== undefined) {
		s = s + ", " + Eden.edenCodeForValues(this.fillcolour, this.textcolour);
	}
	s = s + ")";
	return s;
};

Button.prototype.getEdenCode = Button.prototype.toString;


	// Taints the canvas if the file is located on another domain.
CanvasImage = function (name, dx, dy, dWidth, dHeight, sx1, sy1, sx2, sy2, smoothed, file) {
	this.name = edenUI.plugins.Canvas2D.initZoneFromName(name, "Image");
	this.obsName = root.currentObservableName();

	var temp;
	if (sx2 !== undefined) {
		if (sx1 > sx2) {
			temp = sx1;
			sx1 = sx2;
			sx2 = temp;
		}
		this.sWidth = sx2 - sx1;
	}
	if (sy2 !== undefined) {
		if (sy1 > sy2) {
			temp = sy1;
			sy1 = sy2;
			sy2 = temp;
		}
		this.sHeight = sy2 - sy1;
	}

	this.originalDWidth = dWidth;
	this.originalDHeight = dHeight;
	this.originalSX2 = sx2;
	this.originalSY2 = sy2;
	
	this.dx = dx;
	this.dy = dy;
	this.dWidth = dWidth;
	this.dHeight = dHeight;
	this.sx = sx1;
	this.sy = sy1;
	this.smoothed = smoothed;

	this.canvasesToRepaint = {};

	if (CanvasImage.cache[file]) {
		this.image = CanvasImage.cache[file];
		this.loaded = this.image.complete;

		var me = this;

		if (this.loaded) {
			if (me.sWidth === undefined) {
				me.sWidth = me.image.width - me.sx;
			}
			if (me.sHeight === undefined) {
				me.sHeight = me.image.height - me.sy;
			}
			if (me.dWidth === undefined && me.dHeight === undefined) {
				me.dWidth = me.sWidth;
				me.dHeight = me.sHeight;		
			} else if (me.dWidth === undefined) {
				me.dWidth = me.sWidth * me.dHeight / me.sHeight;
			} else if (me.dHeight === undefined) {
				me.dHeight = me.sHeight * me.dWidth / me.sWidth;
			}
		}
	} else {
		this.image = new Image();
		//this.image.setAttribute("crossorigin","anonymous");	
		this.loaded = false;
	
		var me = this;
	
		this.image.onload = function() {
			if (me.sWidth === undefined) {
				me.sWidth = me.image.width - me.sx;
			}
			if (me.sHeight === undefined) {
				me.sHeight = me.image.height - me.sy;
			}
			if (me.dWidth === undefined && me.dHeight === undefined) {
				me.dWidth = me.sWidth;
				me.dHeight = me.sHeight;		
			} else if (me.dWidth === undefined) {
				me.dWidth = me.sWidth * me.dHeight / me.sHeight;
			} else if (me.dHeight === undefined) {
				me.dHeight = me.sHeight * me.dWidth / me.sWidth;
			}

			me.loaded = true;
			for (var viewName in me.canvasesToRepaint) {
				edenUI.plugins.Canvas2D.drawPicture(viewName);
			}
		}
		this.image.src = file;
		CanvasImage.cache[file] = this.image;
	}
};

CanvasImage.cache = {};

CanvasImage.prototype.draw = function(context, scale, viewName) {
	if (this.loaded) {
		var smoothed = this.smoothed;
		context.mozImageSmoothingEnabled = smoothed;
		context.msImageSmoothingEnabled = smoothed;
		context.imageSmoothingEnabled = smoothed;
		if (scale > 0) {
			context.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, this.dx, this.dy, this.dWidth, this.dHeight);
		} else {
			if (!this.flippedImage) {
				var buffer = document.createElement("canvas");
				buffer.width = this.dWidth;
				buffer.height = this.dHeight;
				var bufferContext = buffer.getContext("2d");
				bufferContext.scale(1, -1);
				bufferContext.drawImage(this.image, this.sx, this.sy, this.sWidth, this.sHeight, 0, -this.dHeight, this.dWidth, this.dHeight);
				this.flippedImage = buffer;
			}
			context.drawImage(this.flippedImage, this.dx, this.dy - this.dHeight);
		}
	} else {
		this.canvasesToRepaint[viewName] = true;
	}
};

CanvasImage.prototype.isHit = function (context, scale, x, y) {
	return x >= this.dx && x < this.dx + this.dWidth && y >= this.dy && y < this.dy + this.dHeight;
}

CanvasImage.prototype.toString = function() {
  return "Image(" +	Eden.edenCodeForValues(this.dx, this.dy, this.originalDWidth,
	this.originalDHeight, this.sx, this.sy, this.originalSX2, this.originalSY2, this.smoothed, this.image.src) + ")";
};

CanvasImage.prototype.getEdenCode = CanvasImage.prototype.toString;


Checkbox = function (name, label, x, y, tristate, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.label = label;
	this.x = x;
	this.y = y;
	this.tristate = tristate;
    this.enabled = enabled;
}

Checkbox.prototype.hash = function () {
	return this.label+"$$"+
				this.name+"$$"+
				this.x+"$$"+
				this.y+"$$"+
				this.tristate+"$$"+
				this.enabled;
};

Checkbox.prototype.draw = function(context) {

	if (this.elements === undefined) {
		var me = this;
		var name = this.name;

		var inputJQ = $('<input type="checkbox"/>');
		var inputElement = inputJQ.get(0);
		var element, elementJQ;
		if (this.label === undefined) {
			element = inputElement;
			elementJQ = inputJQ;
		} else {
			var labelJQ = $('<label> ' + this.label + '</label>');
			labelJQ.prepend(inputJQ);
			element = labelJQ.get(0);
			elementJQ = labelJQ;
		}
		element.className = "canvashtml-item";

		inputElement.disabled = (this.enabled === false);
		
		var valueSym = root.lookup(name + "_checked");
		var value = valueSym.value();
		if (value === undefined) {
			if (this.tristate) {
				inputElement.indeterminate = true;
			} else {
				valueSym.assign(false, root.scope, root.lookup("Checkbox"));
			}
		} else {
			inputElement.checked = value;
		}
		valueSym.addJSObserver("updateCheckbox", function (obs, value) {
			var element = me.elements[0];
			if (value === undefined) {
				element.indeterminate = true;
				element.checked = false;
			} else {
				element.indeterminate = false;
				element.checked = (value == true);
			}
		});

		inputJQ.change(function (event) {
			var element = event.target;
			var value;
			if (element.indeterminate) {
				element.indeterminate = false;
				element.checked = true;
				value = true;
			} else if (me.tristate && valueSym.value() === false) {
				element.indeterminate = true;
				element.checked = false;
				value = undefined;
			} else {
				value = element.checked;
			}
			valueSym.assign(value, root.scope, EdenSymbol.hciAgent, true);
		})

		elementJQ.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		this.elements = [element];
	}
};

Checkbox.prototype.scale = function (scale, zoom, origin) {
	var outerElement = this.elements[0];
	var inputElement;
	if (outerElement.tagName.toLowerCase() == "label") {
		inputElement = outerElement.children[0];
	} else {
		inputElement = outerElement;
	}
	var outerStyle = outerElement.style;
	var inputStyle = inputElement.style;

	outerStyle.left = Math.round((this.x + origin.x) * scale) + "px";
	outerStyle.top =  Math.round((this.y + origin.y) * scale) + "px";

	var checkboxSize = Math.round(13 * zoom) + "px";
	inputStyle.width = checkboxSize;
	inputStyle.height = checkboxSize;
};

Checkbox.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "Checkbox(" + Eden.edenCodeForValues(this.x, this.y, this.tristate, this.enabled) + ")";
	} else {
		return "Checkbox(" + Eden.edenCodeForValues(this.name, this.x, this.y, this.tristate, this.enabled) + ")";	
	}
};

Checkbox.prototype.getEdenCode = Checkbox.prototype.toString;

Circle = function(x, y, radius, fillcolour, outlinecolour, drawingOptions) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	if (fillcolour === undefined && outlinecolour === undefined) {
		this.fillcolour = undefined;
		this.outlinecolour = "black";
	} else {
		this.fillcolour = fillcolour;
		this.outlinecolour = outlinecolour;
	}
	this.drawingOptions = drawingOptions;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "Circle");
	this.obsName = root.currentObservableName();
}

Circle.prototype.draw = function (context, scale) {
	if (this.radius > 0) {

		this.tracePath(context, scale);
		if (this.fillcolour !== undefined) {
			edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
			context.fill();
		}
		if (this.outlinecolour !== undefined) {
			context.strokeStyle = this.outlinecolour;
			context.stroke();
		}

	}
};

Circle.prototype.tracePath = function (context, scale) {
	var halfLineWidth;
	if (this.outlinecolour !== undefined) {
		halfLineWidth = context.lineWidth / 2;
	} else {
		halfLineWidth = 0;
	}

	var adjustedRadius;
	if (this.radius <= halfLineWidth) {
		context.lineWidth = this.radius;
		adjustedRadius = this.radius / 2;
	} else {
		adjustedRadius = this.radius - halfLineWidth;
	}
	context.beginPath();
	context.arc(this.x, this.y, adjustedRadius, 0, 2 * Math.PI, false);
	context.closePath();
}

Circle.prototype.isHit = function (context, scale, x, y) {
	this.tracePath(context, scale);
	return context.isPointInPath(x,y);
}

Circle.prototype.toString = function(p) {
	var s = "Circle(" + Eden.edenCodeForValuesP(p, this.x, this.y, this.radius, this.fillcolour, this.outlinecolour);
	
	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

Circle.prototype.getEdenCode = Circle.prototype.toString;

Circle.prototype.imageMapArea = function () {
	return "shape=\"circle\" coords=\"" + this.x + "," + this.y + "," + this.radius + "\"";
}

Circle.prototype.centre = function () {
	return new Point(this.x, this.y);
}


Combobox = function (name, suggestions, x, y, width, placeholder, maxlength, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.suggestions = suggestions;
	this.x = x;
	this.y = y;
	this.width = width;
	this.placeholder = placeholder;
	this.maxlength = maxlength;
	this.enabled = enabled;
}

Combobox.prototype.hash = function () {
	return this.name+"$$"+
				(Array.isArray(this.suggestions)? this.suggestions.join("$$") : "") +
				this.x+"$$"+
				this.y+"$$"+
				this.width+"$$"+
				this.placeholder+"$$"+
				this.maxlength+"$$"+
				this.enabled;
};

Combobox.prototype.makeOptionsHTML = function() {
	var html = "";
	for (var i = 0; i < this.suggestions.length; i++) {
		html = html + '\n<option value="' + this.suggestions[i] + '"/>';
	}
	return html;
}

Combobox.prototype.draw = function(context) {
	var input, suggestions;
	var me = this;
	var name = this.name;
	var valueSym = root.lookup(name + '_value');

	if (this.elements === undefined) {

		var disabled = this.enabled === false? 'disabled="disabled"' : '';
		var placeholder = ' placeholder="' + (this.placeholder === undefined? name : this.placeholder) + '"';
		var maxlength = this.maxlength !== undefined? ' maxlength="' + this.maxlength + '"' : '';
		var inputJQ = $('<input type="text" list="combobox-' + name + '" ' + disabled +
			placeholder + maxlength + ' class="canvashtml-item"/>');

		input = inputJQ.get(0);
		var suggestionsJQ = $('<datalist id="combobox-' + this.name + '"></datalist>');
		suggestions = suggestionsJQ.get(0);
		suggestionsJQ.html(this.makeOptionsHTML(this.values));

		var initialValue = valueSym.value();
		if (initialValue !== undefined) {
			input.value = initialValue;
		}
		valueSym.addJSObserver("updateCombobox", function (symbol, value) {
			input.value = value;
		});

		inputJQ.on("input", function(event) {
			valueSym.assign(event.target.value, root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		this.elements = [input, suggestions];

	} else {

		//Case when the user has performed direct assignment to one or more JavaScript properties.
		input = this.elements[0];
		suggestions = this.elements[1];
		$(suggestions).html(this.makeOptionsHTML());

		input.value = valueSym.value();

		if (this.enabled === false) { 
			input.disabled = true;
		} else {
			input.disabled = false;
		}

	}
};

Combobox.prototype.scale = function (scale, zoom, origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	if (this.width !== undefined) {
		style.width = Math.round(this.width * scale - 6) + "px";
	}
	style.fontSize = zoom + "em";
};

Combobox.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "Combobox(" + Eden.edenCodeForValues(this.suggestions, this.x, this.y, this.enabled) + ")";
	} else {
		return "Combobox(" + Eden.edenCodeForValues(this.name, this.suggestions, this.x, this.y,
			this.maxlength, this.enabled) + ")";
	}
};

Combobox.prototype.getEdenCode = Combobox.prototype.toString;


	/**Creates an object that holds the boundaries of a two or three dimensional space in which a
	 * function will be evaluated at various discrete points and used to form a line (or a surface).
	 * If zMin and zMax are both left undefined then the space is two-dimensional, otherwise
	 * it is three-dimensional.
	 */
	EuclideanSpace = function (xMin, yMin, zMin, xMax, yMax, zMax) {
		this.xMin = xMin;
		this.yMin = yMin;
		this.zMin = zMin;
		this.xMax = xMax;	
		this.yMax = yMax;
		this.zMax = zMax;
	}

	EuclideanSpace.prototype.toString = function () {
		if (this.zMin === undefined && this.zMax === undefined) {
			return "EuclideanSpace(" + Eden.edenCodeForValues(this.xMin, this.yMin, this.xMax,
				this.yMax) + ")";
		} else {
			return "EuclideanSpace(" + Eden.edenCodeForValues(this.xMin, this.yMin, this.zMin,
				this.xMax, this.yMax, this.zMax) + ")";		
		}
	}

	EuclideanSpace.prototype.getEdenCode = EuclideanSpace.prototype.toString;

	/**Creates an abstract representation of a two-dimensional shape produced by evaluating a
	 * function at discrete points.  The vertices are expressed in an abstract space ranging from
	 * (0, 0) to (numX - 1, numY - 1), where numX and numY are the number of points to evaluate the
	 * function for in each direction.  That is, numX and numY control the image resolution.
	 * @param {TwoDScalarField} field An object that provides the function values (possibly from an
	 * internal cache).
	 * @param {Number} isoValue The threshold value that determines which function values fall
	 * inside the boundary of the shape.
	 * @param {Number} t The time instant at which to evaluate the function.  May be omitted if the
	 * function is time invariant.
	 */
	ContourData = function (field, isoValue, t) {
		this.field = field;
		this.isoValue = isoValue;
		this.t = t;
		if (field instanceof TwoDScalarField) {
			//Compute and store vertices, ready to be plotted later (after simple translation and scaling).
			var fieldValues = field.getValues(isoValue, t);
			this.paths = this.computePaths(fieldValues);
		}
	}

	/**Translates and scales the vertices from the abstract shape to fit the location and dimensions
	 * of the output space on the canvas.
	 * @return {Array<Array<Point>>} An array of paths, each path represented as an array of Points.
	 */
	ContourData.prototype.scalePaths = function (x, y, width, height, scale, lineWidth) {
		var paths = this.paths;
		var halfLineWidth = lineWidth / 2;
		x = x + halfLineWidth;
		y = y + halfLineWidth;
		if (this.paths !== undefined) {
			var scaledPaths = new Array(paths.length);
			/* If the points are connected with straight lines then the nature of the algorithm
			 * prevents the vertices from being less than 0.5 units away from the edge of the space,
			 * except as a result of the linear interpolation post processing step, which we decide
			 * not to apply to the edge points.  This decision means that if a value above the iso
			 * threshold is yielded when applying the function to a point on the edge of the input
			 * space then the perimeter of the shape also extends hard up the edge of the visual
			 * space.  From this idea we get the values 2 and 0.5 below.
			 */
			var cellRenderWidth = (width - (lineWidth + 1) / scale) / (this.field.numX - 2);
			var cellRenderHeight = (height - (lineWidth + 1) / scale) / (this.field.numY - 2);
			for (var i = 0; i < paths.length; i++) {
				var path = paths[i];
				var scaledPath = new Array(path.length);
				for (var j = 0; j < path.length; j++) {
					var p = path[j];
					var sx = Math.round((x + (p.x - 0.5) * cellRenderWidth) * scale) / scale;
					var sy = Math.round((y + (p.y - 0.5) * cellRenderHeight) * scale) / scale;
					scaledPath[j] = new Point(sx, sy);
				}
				scaledPaths[i] = scaledPath;
			}
			return scaledPaths;
		} else {
			return [];
		}
	}

	ContourData.prototype.toString = function () {
		return "ContourData(" + Eden.edenCodeForValues(this.field, this.isoValue, this.t) + ")";
	}

	ContourData.prototype.getEdenCode = ContourData.prototype.toString;

	/**Computes the locations of the vertices in the abstract space and the correct order to
	 * traverse them in order to plot the perimeter of the shape.
	 * @param {Array<Array<Number>>} An array of function result values (i.e. the raw values and
	 * not the TwoDScalarField object that represents all of information about the field (including
	 * the algorithm for computing the values)).
	 * @return {Array<Array<Point>>} An array of paths, each path represented as an array of Points.
	 */
	ContourData.prototype.computePaths = function (field) {
//console.log("Field values");
//console.log(field);
		if (field === undefined) {
			return [];
		}
		var fieldObj = this.field;
		var isoValue = this.isoValue;
		var t = this.t;

		//Compute which cells have values above the threshold.
		var thresholdValues = new Array(field.length);
		for (var i = 0; i < field.length; i++) {
			var inputColumn = field[i];
			var thresholdColumn = new Array(inputColumn.length);
			thresholdValues[i] = thresholdColumn;
			for (var j = 0; j < inputColumn.length; j++) {
				thresholdColumn[j] = inputColumn[j] >= isoValue? 1 : 0;
			}
		}

		//Compute patterns.
		var numColumns = fieldObj.numX - 1;
		var numRows = fieldObj.numY - 1;
		var completed = new Array(numColumns);
		var patterns = new Array(numColumns);
		for (var i = 0; i < numColumns; i++) {
			completed[i] = new Array(numRows);
			patterns[i] = new Array(numRows);
		}

		var middleValue;
		var allInside = true;
		for (var i = 0; i < numColumns; i++) {
			var columnComplete = completed[i];
			var patternColumn = patterns[i];
			for (var j = 0; j < numRows; j++) {
				var pattern =
					15 -
					(thresholdValues[i][j] * 8 + 
					thresholdValues[i+1][j] * 4 +
					thresholdValues[i+1][j+1] * 2 +
					thresholdValues[i][j+1]);
				if (pattern == 5 || pattern == 10) {
					middleValue = fieldObj.middleValue(i, j, t);
					if (middleValue >= isoValue) {
						//Case "-5" is similar to Case 10, and Case "-10" like Case 5.
						pattern = - pattern;
					}
				} // end resolve ambiguity
				patternColumn[j] = pattern;
				var isInside = (pattern == 0);
				columnComplete[j] = Number(isInside || pattern == 15);
				allInside = allInside && isInside;
			} //end scan down a column
		} //end scan across columns
//console.log("Patterns");
//console.log(patterns);

		/* Traverse the grid.  For each point not yet marked as complete, trace a path (part or all
		 * of the shape's perimeter) beginning from that point.
		 */
		var shapes = [];
		this.shapes = shapes;
		var shape;
		if (allInside) {
			var shape = new Array(4);
			shape[0] = new Point(0.5, 0.5);
			shape[1] = new Point(numColumns - 0.5, 0.5);
			shape[2] = new Point(numColumns - 0.5, numRows - 0.5);
			shape[3] = new Point(0.5, numRows - 0.5);
			shapes.push(shape);
		} else {
			for (var i = 0; i < numColumns; i++) {
				var columnComplete = completed[i];
				for (var j = 0; j < numRows; j++) {
					if (columnComplete[j] < 1) {
						shape = this.computePathFromPoint(field, patterns, completed, i, j);
						shapes.push(shape);
						foundPath = true;
					}
				}
			}
		}
		return shapes;
	}

	ContourData.prototype.computePathFromPoint = function(field, patterns, completed, beginI, beginJ) {
		var fieldObj = this.field;
		var maxCol = fieldObj.numX - 2;
		var maxRow = fieldObj.numY - 2;
		var isoValue = this.isoValue;

		var prevI, prevJ;
		var i = beginI;
		var j = beginJ;

		var points = [];
		var sum, outX, outY, nextI, nextJ;
		var val;

//console.log("Begin path");
		do {
			var pattern = patterns[i][j];
//console.log("(" + i + ", " + j + ") " + pattern);
			switch (pattern) {
			case 14:
				val = field[i][j+1] - isoValue;
				sum = 1 + val;
				if (prevJ == j) {
					outX = 1 - 0.5 / sum;
					outY = 1;
					nextI = 0;
					nextJ = 1;
				} else {
					outX = 0;
					outY = 1 - (0.5 + val) / sum;
					nextI = -1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 13:
				val = field[i+1][j+1] - isoValue;
				sum = 1 + val;
				if (prevJ == j) {
					outX = 1 - (0.5 + val) / sum;
					outY = 1;
					nextI = 0;
					nextJ = 1;
				} else {
					outX = 1;
					outY = 1 - (0.5 + val) / sum;
					nextI = 1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 11:
				val = field[i+1][j] - isoValue;
				sum = 1 + val;
				if (prevJ == j) {
					outX = 1 - (0.5 + val) / sum;
					outY = 0;
					nextI = 0;
					nextJ = -1;
				} else {
					outX = 1;
					outY = 1 - 0.5 / sum;
					nextI = 1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 7:
				val = field[i][j] - isoValue;
				sum = 1 + val;
				if (prevJ == j) {
					outX = 1 - 0.5 / sum;
					outY = 0;
					nextI = 0;
					nextJ = -1;
				} else {
					outX = 0;
					outY = 1 - 0.5 / sum;
					nextI = -1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 1:
				if (prevJ == j) {
					val = field[i+1][j+1] - isoValue;
					sum = 1 + val;
					outX = 1 - (0.5 + val) / sum;
					outY = 1;
					nextI = 0;
					nextJ = 1;
				} else {
					val = field[i][j] - isoValue;
					sum = 1 + val;
					outX = 0;
					outY = 1 - 0.5 / sum;
					nextJ = 0;
					nextI = -1;
				}
				completed[i][j] = 1;
				break;
			case 2:
				if (prevJ == j) {
					val = field[i][j+1] - isoValue;
					sum = 1 + val;
					outX = 1 - 0.5 / sum;
					outY = 1;
					nextI = 0;
					nextJ = 1;
				} else {
					val = field[i+1][j] - isoValue;
					sum = 1 + val;
					outX = 1;
					outY = 1 - 0.5 / sum;
					nextI = 1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 4:
				if (prevJ == j) {
					val = field[i][j] - isoValue;
					sum = 1 + val;
					outX = 1 - 0.5 / sum;
					outY = 0;
					nextI = 0;
					nextJ = -1;
				} else {
					val = field[i+1][j+1] - isoValue;
					sum = 1 + val;
					outX = 1;
					outY = 1 - (0.5 + val) / sum;
					nextI = 1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 8:
				if (prevJ == j) {
					val = field[i+1][j] - isoValue;
					sum = 1 + val;
					outX = 1 - (0.5 + val) / sum;
					outY = 0;
					nextI = 0;
					nextJ = -1;
				} else {
					val = field[i][j+1] - isoValue;
					sum = 1 + val;
					outX = 0;
					outY = 1 - (0.5 + val) / sum;
					nextI = -1;
					nextJ = 0;
				}
				completed[i][j] = 1;
				break;
			case 12:
				if (prevI == i - 1) {
					val = field[i+1][j+1] - isoValue;
					outX = 1;
					nextI = 1;
				} else {
					val = field[i][j+1] - isoValue;
					outX = 0;
					nextI = -1;
				}
				sum = 1 + val;
				outY = 1 - (0.5 + val) / sum;
				nextJ = 0;
				completed[i][j] = 1;
				break;
			case 9:
				if (prevJ == j - 1) {
					val = field[i+1][j+1] - isoValue;
					outY = 1;
					nextJ = 1;
				} else {
					val = field[i+1][j] - isoValue;
					outY = 0;
					nextJ = -1;
				}
				sum = 1 + val;
				outX = 1 - (0.5 + val) / sum;
				nextI = 0;
				completed[i][j] = 1;
				break;
			case 3:
				if (prevI == i - 1) {
					val = field[i+1][j] - isoValue;
					outX = 1;
					nextI = 1;
				} else {
					val = field[i][j] - isoValue;
					outX = 0;
					nextI = -1;
				}
				sum = 1 + val;
				outY = 1 - 0.5 / sum;
				nextJ = 0;
				completed[i][j] = 1;
				break;
			case 6:
				if (prevJ == j - 1) {
					val = field[i][j+1] - isoValue;
					outY = 1;
					nextJ = 1;
				} else {
					val = field[i][j] - isoValue;
					outY = 0;
					nextJ = -1;
				}
				sum = 1 + val;
				outX = 1 - 0.5 / sum;
				nextI = 0;
				completed[i][j] = 1;
				break;
			case 5:
				switch (prevJ - j) {
				case 0:
					if (prevI == i + 1) {
						val = field[i+1][j+1] - isoValue;
						sum = 1 + val;
						outX = 1 - (0.5 + val) / sum;
						outY = 1;
						nextJ = 1;
						completed[i][j] = completed[i][j] + 0.4;
					} else {
						val = field[i][j] - isoValue;
						sum = 1 + val;
						outX = 1 - 0.5 / sum;
						outY = 0;
						nextJ = -1;
						completed[i][j] = completed[i][j] + 0.6;
					}
					nextI = 0;
					break;
				case 1:
					val = field[i+1][j+1] - isoValue;
					sum = 1 + val;
					outX = 1;
					outY = 1 - (0.5 + val) / sum;
					nextI = 1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.4;
					break;
				case -1:
					val = field[i][j] - isoValue;
					sum = 1 + val;
					outX = 0;
					outY = 1 - 0.5 / sum;
					nextI = -1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.6;
					break;
				default:
					if (completed[i][j] == 0.4) {
						val = field[i][j] - isoValue;
						sum = 1 + val;
						outX = 0;
						outY = 1 - 0.5 / sum;
						nextI = -1;
						nextJ = 0;
						completed[i][j] = 1;
					} else {
						val = field[i+1][j+1] - isoValue;
						sum = 1 + val;
						outX = 1;
						outY = 1 - (0.5 + val) / sum;
						nextI = 1;
						nextJ = 0;
						completed[i][j] = completed[i][j] + 0.4;
					}
				}
				break;
			case 10:
				switch (prevJ - j) {
				case 0:
					if (prevI == i + 1) {
						val = field[i+1][j] - isoValue;
						sum = 1 + val;
						outX = 1 - (0.5 + val) / sum;
						outY = 0;
						nextJ = -1;
						completed[i][j] = completed[i][j] + 0.6;
					} else {
						val = field[i][j+1] - isoValue;
						sum = 1 + val;
						outX = 1 - 0.5 / sum;
						outY = 1;
						nextJ = 1;
						completed[i][j] = completed[i][j] + 0.4;
					}
					nextI = 0;
					break;
				case 1:
					val = field[i][j+1] - isoValue;
					sum = 1 + val;
					outX = 0;
					outY = 1 - (0.5 + val) / sum;
					nextI = -1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.4;
					break;
				case -1:
					val = field[i+1][j] - isoValue;
					sum = 1 + val;
					outX = 1;
					outY = 1 - 0.5 / sum;
					nextI = 1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.6;
					break;
				default:
					if (completed[i][j] == 0.4) {
						val = field[i+1][j] - isoValue;
						sum = 1 + val;
						outX = 1 - (0.5 + val) / sum;
						outY = 0;
						nextJ = -1;
						completed[i][j] = 1;
					} else {
						val = field[i][j+1] - isoValue;
						sum = 1 + val;
						outX = 1 - 0.5 / sum;
						outY = 1;
						nextJ = 1;
						completed[i][j] = completed[i][j] + 0.4;					
					}
					nextI = 0;
				}
				break;
			case -5:
				switch (prevJ - j) {
				case 0:
					if (prevI == i + 1) {
						val = field[i][j] - isoValue;
						sum = 1 + val;
						outX = 1 - 0.5 / sum;
						outY = 0;
						nextJ = -1;
						completed[i][j] = completed[i][j] + 0.6;
					} else {
						val = field[i+1][j+1] - isoValue;
						sum = 1 + val;
						outX = 1 - (0.5 + val) / sum;
						outY = 1;
						nextJ = 1;
						completed[i][j] = completed[i][j] + 0.4;
					}
					nextI = 0;
					break;
				case 1:
					val = field[i][j] - isoValue;
					sum = 1 + val;
					outX = 0;
					outY = 1 - 0.5 / sum;
					nextI = -1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.4;
					break;
				case -1:
					val = field[i+1][j+1] - isoValue;
					sum = 1 + val;
					outX = 1;
					outY = 1 - (0.5 + val) / sum;
					nextI = 1;
					nextJ = 0;
					completed[i][j] = completed[i][j] + 0.6;
					break;
				default:
					if (completed[i][j] == 0.4) {
						val = field[i][j] - isoValue;
						sum = 1 + val;
						outX = 1 - 0.5 / sum;
						outY = 0;
						nextJ = -1;
						completed[i][j] = 1;
					} else {
						val = field[i+1][j+1] - isoValue;
						sum = 1 + val;
						outX = 1 - (0.5 + val) / sum;
						outY = 1;
						nextJ = 1;
						completed[i][j] = completed[i][j] + 0.4;					
					}
					nextI = 0;
				}
				break;
			}

			if (i == 0) {
				if (outX < 0.5) {
					outX = 0.5;
				}
			} else if (i == maxCol) {
				if (outX > 0.5) {
					outX = 0.5;
				}
			}
			if (j == 0) {
				if (outY < 0.5) {
					outY = 0.5;
				}
			} else if (j == maxRow) {
				if (outY > 0.5) {
					outY = 0.5;
				}
			}
			points.push(new Point(i + outX, j + outY));

			nextI = i + nextI;
			nextJ = j + nextJ;

			var overflowX = 0, overflowY = 0;
			var prevVal;
			if (nextI < 0) {
				prevVal = field[0][j] - isoValue;
				if (prevVal >= 0) {
					//Traverse up to find the first point in column 0 that is outside of the shape.
					overflowY = -1;
				} else {
					//Traverse down to find the first point in column 0 that is outside of the shape.
					overflowY = 1;
				}
			} else if (nextI > maxCol) {
				prevVal = field[maxCol+1][j] -isoValue;
				if (prevVal >= 0) {
					//Traverse up to find the first point in the rightmost column that is outside of the shape.
					overflowY = -1;
				} else {
					//Traverse down to find the first point in the rightmost column that is outside of the shape.
					overflowY = 1;
				}
			} else if (nextJ < 0) {
				prevVal = field[i][0] - isoValue;
				if (prevVal >= 0) {
					//Traverse left to find the first point in row 0 that is outside of the shape.
					overflowX = -1;
				} else {
					//Traverse right to find the first point in row 0 that is outside of the shape.
					overflowX = 1;
				}
			} else if (nextJ > maxRow) {
				prevVal = field[i][maxRow+1] - isoValue;
				if (prevVal >= 0) {
					//Traverse left to find the first point in the bottommost row that is outside of the shape.
					overflowX = -1;
				} else {
					//Traverse right to find the first point in the bottommost row that is outside of the shape.
					overflowX = 1;
				}
			}

			var check, put, prev, inCoord;
			while (overflowX != 0 || overflowY != 0) {
				if (overflowY == -1) {
					//Traverse 1 step upwards.
					nextJ--;
					if (nextI < 0) {
						check = 0;
						put = 0;
						prev = -1;
					} else {
						check = maxCol + 1;
						put = maxCol;
						prev = maxCol + 1;
					}
					if (nextJ >= 0) {
						val = field[check][nextJ] - isoValue;
						if (val < 0) {
							sum = 1 + prevVal;
							inCoord = 1 - (0.5 + prevVal) / sum;
							nextI = put;
							i = prev;
							j = nextJ;
							points.push(new Point(put + 0.5, nextJ + inCoord));
							overflowY = 0;
						}
					} else {
						//Top-left or top-right corner reached.  Start traversing right/left.
						points.push(new Point(put + 0.5, 0.5));
						overflowX = check == 0? 1 : -1;
						overflowY = 0;
						val = 0;
					}
				} else if (overflowY == 1) {
					//Traverse 1 step downwards.
					nextJ++;
					if (nextI < 0) {
						check = 0;
						put = 0;
						prev = -1;
					} else {
						check = maxCol + 1;
						put = maxCol;
						prev = maxCol + 1;
					}
					if (nextJ <= maxRow + 1) {
						val = field[check][nextJ] - isoValue;
						if (val < 0) {
							sum = 1 + prevVal;
							inCoord = 1 - 0.5 / sum;
							nextI = put;
							nextJ--;
							i = prev;
							j = nextJ;
							points.push(new Point(put + 0.5, nextJ + inCoord));
							overflowY = 0;
						}
					} else {
						//Bottom-left or bottom-right corner reached.  Start traversing right/left.
						points.push(new Point(0.5, maxRow + 0.5));
						overflowX = check == 0? 1 : -1;
						overflowY = 0;
						val = 0;
					}
				} else if (overflowX == -1) {
					//Traverse 1 step left.
					nextI--;
					if (nextJ < 0) {
						check = 0;
						put = 0;
						prev = -1;
					} else {
						check = maxRow + 1;
						put = maxRow;
						prev = maxRow + 1;
					}
					if (nextI >= 0) {
						val = field[nextI][check] - isoValue;
						if (val < 0) {
							sum = 1 + prevVal;
							inCoord = 1 - (0.5 + prevVal) / sum;
							nextJ = put;
							i = nextI;
							j = prev;
							points.push(new Point(nextI + inCoord, put + 0.5));
							overflowX = 0;
						}
					} else {
						//Top-left or bottom-left corner reached.  Start traversing down/up.
						points.push(new Point(0.5, put + 0.5));
						overflowX = 0;
						overflowY = check == 0? 1 : -1;
						val = 0;
					}
				} else {
					//Traverse 1 step right.
					nextI++;
					if (nextJ < 0) {
						check = 0;
						put = 0;
						prev = -1;
					} else {
						check = maxRow + 1;
						put = maxRow;
						prev = maxRow + 1;
					}
					if (nextI <= maxCol + 1) {
						val = field[nextI][check] - isoValue;
						if (val < 0) {
							sum = 1 + prevVal;
							inCoord = 1 - 0.5 / sum;
							nextI--;
							nextJ = put;
							i = nextI;
							j = prev;
							points.push(new Point(nextI + inCoord, put + 0.5));
							overflowX = 0;
						}
					} else {
						//Top-right or bottom-right corner reached.  Start traversing down/up.
						points.push(new Point(maxCol + 0.5, put + 0.5));
						overflowX = 0;
						overflowY = check == 0? 1 : -1;
						val = 0;
					}					
				}

				prevVal = val;
			}

			prevI = i;
			prevJ = j;
			i = nextI;
			j = nextJ;
		} while (i != beginI || j != beginJ);
		return points;
	}

	TwoDScalarField = function (ptr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter) {
		if (numX !== undefined) {
			numX = Math.ceil(numX);
		}
		if (numY !== undefined) {
			numY = Math.ceil(numY);
		}
		if (numT !== undefined) {
			numT = Math.ceil(numT);
		}

		this.ptr = ptr;
		this.space = space;
		this.numX = numX;
		this.numY = numY;
		this.tMin = tMin;
		this.tMax = tMax;
		this.numT = numT;
		this.existsBefore = existsBefore;
		this.existsAfter = existsAfter;

		if (space !== undefined) {
			this.cellWidth = (space.xMax - space.xMin) / numX;
			this.cellHeight = (space.yMax - space.yMin) / numY;
		}
	}

	TwoDScalarField.prototype.toString = function () {
		var s = "ScalarField2D(" + Eden.edenCodeForValues(this.ptr, this.space, this.numX, this.numY);

		if (this.tMin !== undefined || this.tMax !== undefined || this.numT !== undefined ||
		 this.existsBefore !== undefined || this.existsAfter !== undefined) {
			s = s + ", " + Eden.edenCodeForValues(this.tMin, this.tMax, this.numT, this.existsBefore, this.existsAfter);
		}
		s = s + ")";
		return s;
	}

	TwoDScalarField.prototype.getEdenCode = TwoDScalarField.prototype.toString;


	KeyFrame2DScalarField = function (fPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter) {
		TwoDScalarField.call(this, fPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter);
		var f = fPtr.value();
		this.f = f;
		var keyFrames = new Array(this.numT);
		this.keyFrames = keyFrames;
		var minVals = new Array(this.numT);
		this.minVals = minVals;
		var maxVals = new Array(this.numT);
		this.maxVals = maxVals;
		var xMin = space.xMin;
		var yMin = space.yMin;
		var cellWidth = this.cellWidth;
		var cellHeight = this.cellHeight;
		var timeBetweenKeyframes = (tMax - tMin) / (this.numT - 1);
		
		for (var k = 0; k < this.numT; k++) {
			var minVal = Infinity;
			var maxVal = -Infinity;
			var t = tMin + k * timeBetweenKeyframes;
			var field = new Array(this.numX);
			keyFrames[k] = field;

			for (var i = 0; i < this.numX; i++) {
				var column = new Array(this.numY);
				field[i] = column;
				var x = xMin + (i + 0.5) * cellWidth;
			
				for (var j = 0; j < this.numY; j++) {
					var y = yMin + (j + 0.5) * cellHeight;
					var value = f(x, y, t);
					column[j] = value;
					if (value < minVal) {
						minVal = value;
					} else if (value > maxVal) {
						maxVal = value;
					}
				}
			}
			minVals[k] = minVal;
			maxVals[k] = maxVal;
		}
	}

	KeyFrame2DScalarField.prototype = new TwoDScalarField();

	KeyFrame2DScalarField.prototype.middleValue = function (i, j, t) {
		return this.f(
			this.space.xMin + (i + 1) * this.cellWidth,
			this.space.yMin + (j + 1) * this.cellHeight,
			t);
	}

	KeyFrame2DScalarField.prototype.getValues = function (threshold, t) {
		var tMin = this.tMin;
		var tMax = this.tMax;

		if (t !== undefined && (
		 (t >= tMin || this.existsBefore) &&
		 (t <= tMax || this.existsAfter))) {
			var frameNumber = (t - tMin) / (tMax - tMin) * (this.numT - 1);
			var frameNumberBefore = Math.floor(frameNumber);
			var frameNumberAfter = Math.ceil(frameNumber);

			if (frameNumberBefore == frameNumberAfter) {
				return this.keyFrames[frameNumberBefore];
			} else {
				var numX = this.numX;
				var numY = this.numY;
				var values = new Array(numX);
				var proportionAfter = frameNumber - frameNumberBefore;
				var proportionBefore = frameNumberAfter - frameNumber;
				var keyFrameBefore = this.keyFrames[frameNumberBefore];
				var keyFrameAfter = this.keyFrames[frameNumberAfter];
				var beforeMin = this.minVals[frameNumberBefore];
				var beforeMax = this.maxVals[frameNumberBefore];
				var afterMin = this.minVals[frameNumberAfter];
				var afterMax = this.maxVals[frameNumberAfter];
				var weightedMin = beforeMin * proportionBefore + afterMin * proportionAfter;
				var weightedMax = beforeMax * proportionBefore + afterMax * proportionAfter;
				
				for (var i = 0; i < numX; i++) {
					var column = new Array(numY);
					var columnBefore = keyFrameBefore[i];
					var columnAfter = keyFrameAfter[i];
					values[i] = column;
					for (var j = 0; j < numY; j++) {
						var value1, distance1, value2, distance2;
						value1 = columnBefore[j];
						if (value1 >= threshold) {
							distance1 = (value1 - threshold) / (beforeMax - threshold);
						} else {
							distance1 = -(threshold - value1) / (threshold - beforeMin);
						}
						value2 = columnAfter[j];
						if (value2 >= threshold) {
							distance2 = (value2 - threshold) / (afterMax - threshold);
						} else {
							distance2 = -(threshold - value2) / (threshold - afterMin);
						}
						var sumDistance = distance1 * proportionBefore + distance2 * proportionAfter;
						if (sumDistance >= 0) {
							column[j] = threshold + sumDistance * (weightedMax - threshold);
						} else {
							column[j] = threshold + sumDistance * (threshold - weightedMin);
						}
					}
				}
				return values;
			}
		} else {
			return undefined;
		}
	}


	Static2DScalarField = function (fPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter) {
		TwoDScalarField.call(this, fPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter);
		var f = fPtr.value();
		this.f = f;
		var field = new Array(this.numX);
		this.field = field;
		var xMin = space.xMin;
		var yMin = space.yMin;
		var cellWidth = this.cellWidth;
		var cellHeight = this.cellHeight;
		var t;
		if (tMin !== undefined && tMax !== undefined) {
			t = (tMin + tMax) / 2;
		} else if (tMin !== undefined) {
			t = tMin;
		} else if (tMax !== undefined) {
			t = tMax;
		} else {
			t = 0;
		}
		this.t = t;

		for (var i = 0; i < this.numX; i++) {
			var column = new Array(this.numY);
			field[i] = column;
			var x = xMin + (i + 0.5) * cellWidth;
		
			for (var j = 0; j < this.numY; j++) {
				var y = yMin + (j + 0.5) * cellHeight;
				column[j] = f(x, y, t);
			}
		}
	}

	Static2DScalarField.prototype = new TwoDScalarField();

	Static2DScalarField.prototype.middleValue = function (i, j) {
		return this.f(
			this.space.xMin + (i + 1) * this.cellWidth,
			this.space.yMin + (j + 1) * this.cellHeight,
			this.t);
	}

	Static2DScalarField.prototype.getValues = function (threshold, t) {
		var tMin = this.tMin;
		var tMax = this.tMax;

		if (t === undefined || (
		 (t >= tMin || tMin === undefined || this.existsBefore !== false) &&
		 (t <= tMax || tMax === undefined || this.existsAfter !== false))) {
			return this.field;
		} else {
			 return undefined;
		}
	}


	Explicit2DScalarField = function (listPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter) {
		var transposed = listPtr instanceof Symbol? listPtr.value() : undefined;
		var numRows;
		if (Array.isArray(transposed)) {
			numRows = transposed.length;
			if (numX === undefined) {
				numX = transposed[0].length;
			}
		} else {
			numRows = 0;
		}
		if (numY === undefined) {
			numY = numRows;
		}
		TwoDScalarField.call(this, listPtr, space, numX, numY, tMin, tMax, numT, existsBefore, existsAfter);
		var field = new Array(numX);
		for (var i = 0; i < numX; i++) {
			var column = new Array(numY);
			field[i] = column;
			for (var j = 0; j < numY && j < numRows; j++) {
				var row = transposed[j];
				var numCols = Array.isArray(row)? row.length : 0;
				if (i < numCols) {
					column[j] = row[i];
				} else {
					column[j] = -Infinity;
				}
			}
			for (var j = numRows; j < numY; j++) {
				column[j] = -Infinity;
			}
		}
		this.field = field;
	}

	Explicit2DScalarField.prototype = new TwoDScalarField();

	Explicit2DScalarField.prototype.middleValue = function (i, j) {
		var field = this.field;
		return (field[i][j] + field[i+1][j] + field[i][j+1] + field[i+1][j+1]) / 4;
	}

	Explicit2DScalarField.prototype.getValues = function (threshold, t) {
		var tMin = this.tMin;
		var tMax = this.tMax;

		if (t === undefined || (
		 (t >= tMin || tMin === undefined || this.existsBefore !== false) &&
		 (t <= tMax || tMax === undefined || this.existsAfter !== false))) {
			return this.field;
		} else {
			 return undefined;
		}
	}


	ContourLine = function (x, y, width, height, isoLine, fillcolour, outlinecolour, drawingOptions) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.line = isoLine;
		this.fillcolour = fillcolour;
		this.outlinecolour = outlinecolour;
		this.drawingOptions = drawingOptions;
	}

	ContourLine.prototype.draw = function (context, scale) {

		this.tracePath(context, scale);

		if (this.fillcolour !== undefined) {
			edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
			context.fill("evenodd");
		}

		if (this.outlinecolour !== undefined) {
			context.strokeStyle = this.outlinecolour;
			context.stroke();
		}
	}

	ContourLine.prototype.tracePath = function (context, scale) {
		if (!(this.line instanceof ContourData)) {
			return;
		}

		var lineWidth;
		if (this.drawingOptions !== undefined) {
			lineWidth = this.drawingOptions.lineWidth || edenUI.plugins.Canvas2D.defaultLineWidth;
		} else {
			lineWidth = edenUI.plugins.Canvas2D.defaultLineWidth;
		}
		if (this.outlinecolour === undefined) {
			lineWidth = 0;
		} else if (lineWidth % 2 == 1) {
			context.translate(0.5 / scale, 0.5 / scale);
		}

		var paths = this.line.scalePaths(this.x, this.y, this.width, this.height, scale, lineWidth);
		context.beginPath();
		for (var i = 0; i < paths.length; i++) {
			var path = paths[i];
			var point = path[0];
			var startX = point.x;
			var startY = point.y;
			context.moveTo(startX, startY);
			for (var j = 1; j < path.length; j++) {
				point = path[j];
				context.lineTo(point.x, point.y);
			}
			context.lineTo(startX, startY);
		}
	}

	ContourLine.prototype.isHit = function (context, scale, x, y) {
		this.tracePath(context, scale);
		return context.isPointInPath(x,y);
	}

	ContourLine.prototype.toString = function () {
		return "ContourLine(" + Eden.edenCodeForValues(this.x, this.y, this.width, this.height,
			this.line, this.fillcolour, this.outlinecolour, this.drawingOptions) + ")";
	}

	ContourLine.prototype.getEdenCode = ContourLine.prototype.toString;
	

	Curve = function (x1, y1, x2, y2, r, elasticity, theta1, theta2, mid, overshoot, dirSwitch, colours, drawingOptions) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.r = r;
		this.elasticity = elasticity;
		this.theta1 = theta1;
		this.theta2 = theta2;
		this.mid = mid;
		this.overshoot = overshoot;
		this.dirSwitch = dirSwitch;
		this.colours = colours;
		this.drawingOptions = drawingOptions;

		elasticity = elasticity * 0.94;
		var xDistance = x2 - x1;
		var yDistance = y2 - y1;
		this.theta3 = Math.atan2(yDistance, xDistance);
		this.fullLength = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
		this.length1 = mid * this.fullLength;
		var length2 = this.fullLength - this.length1;

		var radiansPerUnit = Math.PI / root.lookup("semicircleAngle").value();
		this.delta1 = elasticity * this.length1;
		this.delta2 = elasticity * length2;
		var fullTurn = 2 * Math.PI;

		if (theta1 === undefined) {
			this.deltaX1 = 0;
			this.deltaY1 = 0;
		} else {
			var theta1Normalized = (theta1 * radiansPerUnit) % fullTurn;
			if (theta1Normalized < 0) {
				theta1Normalized = theta1Normalized + fullTurn;
			}
			var tanTheta1 = Math.abs(Math.tan(theta1Normalized));

			if (theta1Normalized > fullTurn/4 && theta1Normalized <= fullTurn * 3/4) {
				this.deltaX1 = -overshoot;
			} else {
				this.deltaX1 = Math.abs(this.length1 - this.delta1);
			}

			this.deltaY1 = Math.abs(this.deltaX1) * tanTheta1;
			if (theta1Normalized > fullTurn/2) {
				this.deltaY1 = -this.deltaY1;
			} else if (this.deltaY1 > r) {
				this.deltaY1 = r;
				this.deltaX1 = r / tanTheta1;
			}
		}

		if (theta2 === undefined) {
			this.deltaX2 = 0;
			this.deltaY2 = 0;
		} else {
			var theta2Normalized = (theta2 * radiansPerUnit) % fullTurn;
			if (theta2Normalized < 0) {
				theta2Normalized = theta2Normalized + fullTurn;
			}
			var tanTheta2 = Math.abs(Math.tan(theta2Normalized));

			if (theta2Normalized > fullTurn/4 && theta2Normalized <= fullTurn * 3/4) {
				this.deltaX2 = -overshoot;
			} else {
				this.deltaX2 = Math.abs(length2 - this.delta2);
			}

			this.deltaY2 = Math.abs(this.deltaX2) * tanTheta2;
			if (theta2Normalized > fullTurn/2) {
				this.deltaY2 = -this.deltaY2;
			} else if (this.deltaY2 > r) {
				this.deltaY2 = r;
				this.deltaX2 = r / tanTheta2;
			}
		}

		if (dirSwitch) {
			this.radius = -r;
			this.deltaY1 = -this.deltaY1;
			this.deltaY2 = -this.deltaY2;
		} else {
			this.radius = r;
		}
	}

	Curve.prototype.draw = function (context, scale) {
		if (this.colours.length == 1) {
			context.strokeStyle = this.colours[0];
		} else {
			var gradient = context.createLinearGradient(0, 0, this.fullLength, 0);
			for (var i = 0; i < this.colours.length; i++) {
				gradient.addColorStop(i / (this.colours.length - 1), this.colours[i]);
			}
			context.strokeStyle = gradient;
		}

		context.translate(this.x1, this.y1);
		context.rotate(this.theta3);
		context.beginPath();
		context.moveTo(0, 0);
		context.bezierCurveTo(this.deltaX1, this.deltaY1, this.length1 - this.delta1, this.radius, this.length1, this.radius);
		context.bezierCurveTo(this.length1 + this.delta2, this.radius, this.fullLength - this.deltaX2, this.deltaY2, this.fullLength, 0);
		context.stroke();

		if (this.drawingOptions !== undefined && this.drawingOptions.arrowhead instanceof Arrowhead) {
			var gradient1, gradient2, t, x1, y1;
			if (this.deltaX1 == 0 && this.deltaY1 == 0) {
				t = 0.01;
				x1 = 3 * (1 - t) * t * t * (this.length1 - this.delta1) + t * t * t * this.length1;
				y1 = 3 * (1 - t) * t * t * this.radius + t * t * t * this.radius;
				gradient1 = y1 / x1;
			} else {
				gradient1 = this.deltaY1 / this.deltaX1;
			}
			if (this.deltaX2 == 0 && this.deltaY2 == 0) {
				t = 0.99;
				x1 = (1 - t) * (1 - t) * (1 - t) * this.length1 +
					3 * (1 - t) * (1 - t) * t * (this.length1 + this.delta2) +
					3 * (1 - t) * t * t * this.fullLength +
					t * t * t * this.fullLength;
				y1 = (1 - t) * (1 - t) * (1 - t) * this.radius + 3 * (1 - t) * (1 - t) * t * this.radius;
				gradient2 = -y1 / (this.fullLength - x1);
			} else {
				gradient2 = -this.deltaY2 / this.deltaX2;
			}
			this.drawingOptions.arrowhead.draw(context, scale, 0, 0, gradient1, false, this.fullLength, 0, gradient2, false);
		}
	};

	Curve.prototype.toString = function () {
		return "Curve(" + Eden.edenCodeForValues(this.x1, this.y1, this.x2, this.y2, this.r, this.elasticity, this.theta1, this.theta2, this.mid, this.overshoot, this.dirSwitch, this.colours, this.drawingOptions) + ")";
	}
	
	Curve.prototype.getEdenCode = Curve.prototype.toString;


Div = function (html, x, y, width, height, id, classNames, style) {
	this.html = html;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.name = id;
	this.obsName = root.currentObservableName();
	this.classNames = classNames;
	this.style = style;
	this.transformCSS = null;

	//Separate font-size from other CSS information.
	var styleType = typeof(style);
	var matcher, matcher2;
	this.fontSizeSpecified = false;
	if (styleType == "string") {
		matcher = style.match(/(^|;)\s*font-size:\s*([^;]*)(;|$)/);
		if (matcher !== null) {
			matcher2 = matcher[2].match(/^(\d+(\.\d+)?)([a-z%]+)\s*$/);
			if (matcher2 !== null) {
				this.fontSizeNumber = Number(matcher2[1]);
				this.fontSizeUnits = matcher2[3];
				this.fontSizeSpecified = true;
			}
		} else {
			matcher = style.match(/(^|;)\s*font:([^\/;]+\s+)?(\d+(\.\d+)?)([a-z%]+)(\/|\s|;|$)/);
			if (matcher !== null) {
				this.fontSizeNumber = Number(matcher[3]);
				this.fontSizeUnits = matcher[5];
				this.fontSizeSpecified = true;
			}
		}
	} else if (styleType == "object") {
		var propertyValue = style.fontSize || style["font-size"];
		if (propertyValue) {
			matcher2 = propertyValue.match(/^(\d+(\.\d+)?)([a-z%]+)\s*$/);
			if (matcher2 !== null) {
				this.fontSizeNumber = Number(matcher2[1]);
				this.fontSizeUnits = matcher2[3];
				this.fontSizeSpecified = true;
			}
		} else {
			propertyValue = style.font;
			if (propertyValue) {
				matcher = style.match(/([^\/;]+\s+)?(\d+(\.\d+)?)([a-z%]+)(\/|\s|;|$)/);
				if (matcher !== null) {
					this.fontSizeNumber = Number(matcher[2]);
					this.fontSizeUnits = matcher[4];
					this.fontSizeSpecified = true;
				}
			}
		}
	}
}

Div.prototype.hash = function () {
	return this.x+"$$"+
		this.y+"$$"+
		this.width+"$$"+
		this.height+"$$"+
		this.html+"$$"+
		this.name+"$$"+
		this.classNames+"$$"+
		Eden.edenCodeForValue(this.style);
};

Div.prototype.draw = function(context) {

  if (this.elements === undefined) {
	var me = this;

	var divElement = document.createElement("div");
	if (this.name !== undefined) {
		divElement.id = this.name;
	}

	divElement.addEventListener("click", function(event) {
		var script = event.target.getAttribute("data-jseden");
		if (!event.target.className.includes("disabled") && script !== null && script != "") {
			eden.execute2(script);
		}
	});

	if (Array.isArray(this.classNames)) {
		divElement.setAttribute("class", "canvashtml-item canvashtml-div-item " + this.classNames.join(" "));
	} else {
		divElement.setAttribute("class", "canvashtml-item canvashtml-div-item");
	}

	if (this.style != "") CSSUtil.setStyle(divElement, this.style);
	divElement.innerHTML = this.html;

	if (this.name !== undefined) {
		divElement.onmousedown = function (event) {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(event.target.id, root.scope, EdenSymbol.hciAgent, mouseFollow);
		};
		divElement.onmouseup = function (event) {
			edenUI.plugins.Canvas2D.endClick();
		};
		divElement.onmouseenter = function (event) {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(event.target.id, root.scope, EdenSymbol.hciAgent, mouseFollow);
		};
		edenUI.plugins.Canvas2D.initZoneFromName(name, "Div")
	}

	//Create object properties that record the automatically generated width and/or height.
	if (this.width === undefined || this.name !== undefined) {
		var objectElement = document.createElement("object");
		objectElement.setAttribute("style", "display: block; position: absolute; top: 0px; left: 0px; " + 
			"height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;");

		objectElement.onload = function () {
			me.resize();
		}

		objectElement.type = "text/html";
		objectElement.data = "about:blank";
		divElement.appendChild(objectElement);
	}

	this.elements = [divElement];
  }
};

Div.prototype.resize = function () {
	var scale = this.cachedScale;
	if (scale === undefined) {
		//Not yet added drawn onto a canvas.
		return;
	}

	var element = this.elements[0];
	var style = element.style;
	//style.transform = "scale("+scale+")";
	var autoWidth = this.width === undefined;
	var autoHeight = this.height === undefined;

	/*if (autoWidth) {
		var savedHeight = style.height;
		style.width = "auto";
		style.height = "auto";
		var contentWidth = element.clientWidth;
		style.width = contentWidth + "px";
		style.height = savedHeight;
		var scrollBarSize = element.offsetWidth - element.clientWidth;
		if (scrollBarSize > 0) {
			scrollBarSize = scrollBarSize + 2;
			style.width = String(contentWidth + scrollBarSize) + "px";
		} else {
			style.width = "auto";
		}
	}*/

	if (this.name !== undefined) {
		var agent = root.lookup("Div");
		var widthSymName = this.name + "_width";
		var heightSymName = this.name + "_height";

		if (autoWidth || widthSymName in root.symbols) {
			root.lookup(widthSymName).assign(element.offsetWidth / scale, root.scope, agent);
		}
		if (autoHeight || heightSymName in root.symbols) {
			root.lookup(heightSymName).assign(element.offsetHeight / scale, root.scope, agent);
		}
	}
}

Div.prototype.scale = function (scale, zoom , origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top = Math.round((this.y + origin.y) * scale) + "px";

	if (this.width !== undefined) {
		style.width = Math.round(this.width) + "px";
	}
	if (this.height !== undefined) {
		style.height = Math.round(this.height) + "px";
	}
	/*if (this.fontSizeSpecified) {
		style.fontSize = String(this.fontSizeNumber * zoom) + this.fontSizeUnits;
	} else {
		if (zoom == 1) {
			style.fontSize = ""; //Could be specified by a CSS class.
		} else {
			style.fontSize = zoom + "em";
		}
	}*/
	//if (scale != this.cachedScale) {
		//style.transform = "scale("+zoom+")";
		this.transformCSS = "scale("+zoom+")";
	//}
	this.cachedScale = scale;
	this.resize();
};

Div.prototype.toString = function() {
	return this.getEdenCode();
};

Div.prototype.getEdenCode = function () {
	var s = "Div(" + Eden.edenCodeForValues(this.html, this.x, this.y, this.width, this.height);

	if (this.name !== undefined) {
		s = s + ", \"" + this.name + "\"";
	}
	if (this.classNames !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.classNames);
	}
	if (this.style != "") {
		s = s + ", \"" + this.style + "\"";
	}
	s = s + ")";
	return s;
};


DropDownList = function (name, values, labels, x, y, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.values = values;
	this.labels = labels;
	this.x = x;
	this.y = y;
	this.enabled = enabled;
}

DropDownList.prototype.hash = function () {
	return this.name+"$$"+
				(Array.isArray(this.values)? this.values.join("$$") : "") +
				(Array.isArray(this.labels)? this.labels.join("$$") : "") +
				this.x+"$$"+
				this.y+"$$"+
				this.enabled;
};

DropDownList.prototype.makeOptionsHTML = function() {
	var html = "";
	for (var i = 0; i < this.values.length; i++) {
		html = html + '\n<option value="' + this.values[i] + '">' + this.labels[i] + '</option>';
	}
	return html;
}

DropDownList.prototype.draw = function(context) {
	var dropDownList;
	var me = this;
	var name = this.name;
	var valueSym = root.lookup(name + '_value');

	if (this.elements === undefined) {

		var disabled = this.enabled === false? 'disabled="disabled"' : '';
		var dropDownListJQ = $('<select ' + disabled + ' class="canvashtml-item"></select>');
		dropDownListJQ.html(this.makeOptionsHTML(this.values));

		dropDownList = dropDownListJQ.get(0);
		var initialValue = valueSym.value();
		if (initialValue === undefined) {
			valueSym.assign(me.values[0], root.scope, root.lookup("DropDownList"), true);
		} else {
			dropDownList.value = initialValue;
		}
		valueSym.addJSObserver("updateDropDownList", function (symbol, value) {
			dropDownList.value = value;
		});

		dropDownListJQ.change(function(event) {
			valueSym.assign(event.target.value, root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		this.elements = [dropDownList];

	} else {

		//Case when the user has performed direct assignment to one or more JavaScript properties.
		dropDownList = this.elements[0];
		$(dropDownList).html(this.makeOptionsHTML());

		dropDownList.value = valueSym.value();

		if (this.enabled === false) { 
			dropDownList.disabled = true;
		} else {
			dropDownList.disabled = false;
		}

	}
};

DropDownList.prototype.scale = function (scale, zoom, origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	style.fontSize = zoom + "em";
};

DropDownList.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "DropDownList(" + Eden.edenCodeForValues(this.values, this.labels, this.x,
			this.y, this.enabled) + ")";
	} else {
		return "DropDownList(" + Eden.edenCodeForValues(this.name, this.values, this.labels, this.x,
			this.y, this.enabled) + ")";
	}
};

DropDownList.prototype.getEdenCode = DropDownList.prototype.toString;


Ellipse = function(x, y, xradius, yradius, fillcolour, outlinecolour, drawingOptions) {
	this.x = x;
	this.y = y;
	this.xradius = xradius;
	this.yradius = yradius;
	this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;
	this.drawingOptions = drawingOptions;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "Ellipse");
	this.obsName = root.currentObservableName();
}

Ellipse.prototype.draw = function (context) {
	if (this.xradius > 0 && this.yradius > 0) {

		var scaleOutline;
		if (this.outlinecolour === undefined || this.outlinecolour == "transparent") {
			scaleOutline = false;
		} else if (this.drawingOptions === undefined || !("scaleOutline" in this.drawingOptions)) {
			scaleOutline = (this.fillcolour !== undefined && this.fillcolour != "transparent");
		} else {
			scaleOutline = this.drawingOptions.scaleOutline;
		}
		if (!scaleOutline) {
			context.save();
		}

		var lineWidth = this.tracePath(context, scaleOutline);

		if (this.fillcolour !== undefined) {
			edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
			context.fill();
		}

		if (!scaleOutline) {
			context.restore();
			context.lineWidth = lineWidth;
		}
		if (this.outlinecolour !== undefined) {
			context.strokeStyle = this.outlinecolour;
			context.stroke();
		}

	}
};

Ellipse.prototype.tracePath = function (context, scaleOutline) {
	var scaleFactor = this.yradius / this.xradius;
	var lineWidth;
	if (this.outlinecolour !== undefined && this.outlinecolour != "transparent") {
		if (scaleOutline) {
			lineWidth = context.lineWidth;
		} else {
			lineWidth = context.lineWidth / scaleFactor;
		}
	} else {
		lineWidth = 0;
	}

	var adjustedXRadius;
	//Not sure what to do when xradius is bigger than 1/2 line width but less than line width, but it isn't correct atm.
	if (this.xradius <= context.lineWidth / 2) {
		lineWidth = this.xradius;
		context.lineWidth = lineWidth;
		adjustedXRadius = this.xradius / 2;
	} else {
		adjustedXRadius = this.xradius - lineWidth / 2;
	}
	context.scale(1, scaleFactor);
	context.beginPath();
	context.arc(this.x, this.y / scaleFactor, adjustedXRadius, 0, 2 * Math.PI, false);
	context.closePath();
	return lineWidth;
}

Ellipse.prototype.isHit = function (context, scale, x, y) {
	this.tracePath(context, false);
	return context.isPointInPath(x,y);
}

Ellipse.prototype.toString = function() {
	var s = "Ellipse(" + Eden.edenCodeForValues(this.x, this.y, this.xradius, this.yradius, this.fillcolour, this.outlinecolour);
	
	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

Ellipse.prototype.getEdenCode = Ellipse.prototype.toString;

FillPattern = function (url) {
	this.image = new Image();
	this.canvasesToRepaint = {};
	this.loaded = false;
	
	var me = this;
	
	this.image.onload = function(){
		me.loaded = true;
		for (var viewName in me.canvasesToRepaint) {
			edenUI.plugins.Canvas2D.drawPicture(viewName);
		}
	}
	this.image.src = url;
};



	FillPattern.prototype = new EdenUI.plugins.Canvas2D.FillStyle();
	
	FillPattern.prototype.getColour = function (context) {
		return context.createPattern(this.image, 'repeat');
	}

	FillPattern.prototype.toString = function() {
		return "FillPattern(\"" + this.image.src + "\")";
	}

	FillPattern.prototype.getEdenCode = FillPattern.prototype.toString;

	FlowLayout = function(x, y, width, content, drawingOptions) {
		this.obsName = root.currentObservableName();
		this.x = x;
		this.y = y;
		this.width = width;
		this.content = content;
		this.drawingOptions = drawingOptions;
	};

	FlowLayout.defaultSpacing = 14;
	FlowLayout.defaultVerticalSpacing = 9;

	FlowLayout.prototype.hash = function () {
		var hash = this.x + "$$" +
			this.y + "$$" +
			this.width + "$$";

		if (Array.isArray(this.content)) {
			for (var i = 0; i < this.content.length; i++) {
				var item = this.content[i];
				if (item.elements === undefined) {
					return hash + Math.random();
				} else {
					hash = hash + item.hash() + "$$";
				}
			}
		}

		if (this.drawingOptions !== undefined) {
			hash = hash +
				this.drawingOptions.align + "$$" +
				this.drawingOptions.valign + "$$" +
				this.drawingOptions.spacing + "$$" +
				this.drawingOptions.vspacing;
		}

		return hash;
	};

	FlowLayout.prototype.toString = function () {
		return "FlowLayout(" + Eden.edenCodeForValues(this.x, this.y, this.width, this.content,
			this.drawingOptions) + ")";
	};

	FlowLayout.prototype.draw = function (context, scale, viewName) {
		if (this.elements === undefined && Array.isArray(this.content)) {
			var me = this;

			var container = $(
				'<div class="canvashtml-item canvashtml-flow-layout-item" ' +
				'style="left: ' + this.x + 'px; top: ' + this.y + 'px"' +
				'></div>'
			);

			if (this.drawingOptions !== undefined) {
				var align = this.drawingOptions.align;
				if (align == "right") {
					container.css("justify-content", "flex-end");
				} else if (align == "centre" || align == "center") {
					container.css("justify-content", "center");
				} else if (align == "justify") {
					container.css("justify-content", "space-between");
				}
				var vAlign = this.drawingOptions.valign;
				if (vAlign == "bottom") {
					container.css("align-items", "flex-end");
				} else if (vAlign == "baseline") {
					container.css("align-items", "baseline");
				} else if (vAlign !== "top") {
					container.css("align-items", "center");
				}
			} else {
				container.css("align-items", "center");
			}

			for (var i = 0; i < this.content.length; i++) {
				var item = this.content[i];
				item.draw(context, scale, viewName);
				var childContainer = $('<div class="canvashtml-flow-layout-child"></div>');
				childContainer.append(item.elements);
				container.append(childContainer);
			}

			var objectElement = document.createElement("object");
			objectElement.setAttribute("style", "display: block; position: absolute; top: 0px; left: 0px; " +
				"height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;");

			objectElement.onload = function () {
				me.resize();
			}
			objectElement.type = "text/html";
			objectElement.data = "about:blank";
			container.append(objectElement);

			this.elements = container;
		}
	}

	FlowLayout.prototype.resize = function () {
		var scale = this.cachedScale;
		if (scale === undefined) {
			//Not yet added drawn onto a canvas.
			return;
		}

		var element = this.elements[0];
		var style = element.style;
		var autoWidth = this.width === undefined;

		var agent = root.lookup("FlowLayout");
		var widthSymName = this.obsName + "_width";
		var heightSymName = this.obsName + "_height";

		var spacing, vSpacing;
		if (this.drawingOptions !== undefined) {
			spacing = this.drawingOptions.spacing;
			vSpacing = this.drawingOptions.vspacing;
		}
		if (spacing === undefined) {
			spacing = FlowLayout.defaultSpacing;
		}
		if (vSpacing === undefined) {
			vSpacing = FlowLayout.defaultVerticalSpacing;
		}

		if (autoWidth || widthSymName in root.symbols) {
			root.lookup(widthSymName).assign((element.offsetWidth - spacing) / scale, root.scope, agent);
		}

		root.lookup(heightSymName).assign((element.offsetHeight - vSpacing) / scale, root.scope, agent);
	};

	FlowLayout.prototype.scale = function(scale, zoom, origin) {
		if (!Array.isArray(this.content)) {
			return;
		}

		var align, vAlign, spacing, vSpacing;
		if (this.drawingOptions !== undefined) {
			align = this.drawingOptions.align;
			vAlign = this.drawingOptions.valign;
			spacing = this.drawingOptions.spacing;
			vSpacing = this.drawingOptions.vspacing;
		}
		if (spacing === undefined) {
			spacing = FlowLayout.defaultSpacing;
		}
		if (vSpacing === undefined) {
			vSpacing = FlowLayout.defaultVerticalSpacing;
		}

		var container = this.elements;
		var children = container.children();

		var actualLeft, actualTop;
		var padLeft, padRight, padTop, padBottom;

		if (align == "centre" || align == "center") {
			//Place padding on both sides (left and right)
			padLeft = spacing / 2;
			padRight = spacing / 2;
			actualLeft = this.x - this.width / 2 - spacing / 2;
		} else {
			//Place padding on the left side.
			padLeft = spacing;
			padRight = 0;
			actualLeft = this.x - spacing;
		}

		if (vAlign === undefined || vAlign == "middle") {
			//Place padding on both sides (top and bottom)
			padTop = vSpacing / 2;
			padBottom = vSpacing / 2;
			actualTop = this.y - vSpacing / 2;
		} else {
			//Place padding on the top side
			padTop = vSpacing;
			padBottom = 0;
			actualTop = this.y - vSpacing;
		}

		var containerStyle = container[0].style;
		if (this.width !== undefined) {
			actualWidth = this.width + spacing;
			containerStyle.width = Math.round(actualWidth * scale) + "px";
		}
		if (align == "centre" || align == "center") {
			containerStyle.left = "calc(" + Math.round((this.x + origin.x) * scale) + "px - 50%)";
			containerStyle.width = "100%";
		} else {
			containerStyle.left = Math.round((actualLeft + origin.x) * scale) + "px";
		}
		containerStyle.top =  Math.round((actualTop + origin.y) * scale) + "px";

		for (var i = 0; i < this.content.length; i++) {
			var item = this.content[i];
			var childStyle = children[i].style;
			childStyle.paddingRight = Math.ceil((padRight + item.x) * scale) + "px";
			childStyle.paddingBottom = Math.ceil((padBottom + item.y) * scale) + "px";
			item.scale(scale, zoom, origin);
		}
		children.css("padding-left", Math.floor(padLeft * scale) + "px");
		children.css("padding-top", Math.floor(padTop * scale) + "px");

		this.cachedScale = scale;
		this.resize();
	};

	FlowLayout.prototype.getEdenCode = FlowLayout.prototype.toString;

	
GreyPixelList = function(name, ptrToData, x, y, width, redMultiply, greenMultiply, blueMultiply, redAdd, greenAdd, blueAdd) {
	this.name = edenUI.plugins.Canvas2D.initZoneFromName(name, "GreyPixelList");
	this.obsName = root.currentObservableName();
	this.ptr = ptrToData;
	this.data = ptrToData instanceof Symbol? ptrToData.value() : [];
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = this.data.length / width;
	this.redMultiply = redMultiply;
	this.greenMultiply = greenMultiply;
	this.blueMultiply = blueMultiply;
	this.redAdd = redAdd;
	this.greenAdd = greenAdd;
	this.blueAdd = blueAdd;
}

GreyPixelList.prototype.draw = function(context) {
	var imageData = context.createImageData(this.width, this.height);
	var imageArr = imageData.data;
	var dataArr = this.data;
	var dataArrayLen = dataArr.length;
	var imageArrayLen = dataArrayLen * 4;
	var offset;
	
	offset = 0;
	for (var i = 0; i < dataArrayLen; i++) {
		imageArr[offset] = this.redMultiply * dataArr[i] + this.redAdd;
		offset = offset + 4;
	}

	offset = 1;
	for (var i = 0; i < dataArrayLen; i++) {
		imageArr[offset] = this.greenMultiply * dataArr[i] + this.greenAdd;
		offset = offset + 4;
	}

	offset = 2;
	for (var i = 0; i < dataArrayLen; i++) {
		imageArr[offset] = this.blueMultiply * dataArr[i] + this.blueAdd;
		offset = offset + 4;
	}

	offset = 3;
	for (var i = 0; i < dataArrayLen; i++) {
		if (dataArr[i] !== undefined) {
			imageArr[offset] = 255;
		}
		offset = offset + 4;
	}

	context.putImageData(imageData, this.x, this.y);
}

GreyPixelList.prototype.isHit = function (context, scale, x, y) {
	return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height &&
	this.data[(y - this.y) * this.width + x - this.x] !== undefined;
}


GreyPixelList.prototype.toString = function() {
	var s = "GreyPixelList(";
	if (this.name !== undefined) {
		s = s + Eden.edenCodeForValue(this.name) + ", ";
	}
	s = s + Eden.edenCodeForValues(this.ptr, this.x, this.y, this.width, this.redMultiply,
		this.redAdd, this.greenMultiply, this.greenAdd, this.blueMultiply, this.blueAdd) + ")";
	return s;
}

GreyPixelList.prototype.getEdenCode = GreyPixelList.prototype.toString;



HTMLImage = function (name, x, y, width, height, asPercent, scaleFactor, url, imageMap) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.asPercent = asPercent;
	this.scaleFactor = scaleFactor;
	this.scaledWidth = width;
	this.scaledHeight = height;
	this.url = url;
	this.imageMap = imageMap;	
}

HTMLImage.prototype.hash = function () {
	return this.name+"$$"+
				this.x+"$$"+
				this.y+"$$"+
				this.width+"$$"+
				this.height+"$$"+
				this.isPercent+"$$"+
				this.scaleFactor+"$$"+
				this.url+"$$"+
				this.imageMap;
};


HTMLImage.prototype.draw = function(context) {
  if (this.elements === undefined) {
	var id = "canvas_" + this.name;
	var name = this.name;
	var me = this;

	var html = '<img class="canvashtml-item"';
	if (this.imageMap !== undefined) {
		html = html + ' usemap="#' + id + '-map" draggable="false" class="noselect"';
	}
	html = html + '/>';
	var imageJQ = $(html);

	if (this.scaledWidth === undefined || this.scaledHeight === undefined || this.asPercent) {
		imageJQ.on("load", function (event) {
			var image = event.target;
			var canvasName = edenUI.plugins.Canvas2D.canvasNameFromElement(image);
			var canvasScale = root.lookup("_view_" + canvasName + "_scale").value() * root.lookup("_view_" + canvasName + "_zoom").value();

			if (me.asPercent) {
				if (me.width !== undefined) {
					me.scaledWidth = me.width / 100 * image.naturalWidth;
				}
				if (me.height !== undefined) {
					me.scaledHeight = me.height / 100 * image.naturalHeight;
				}
			}
			if (me.scaledWidth === undefined && me.scaledHeight === undefined) {
				me.scaledWidth = image.naturalWidth;
				me.scaledHeight = image.naturalHeight;
			} else if (me.scaledWidth === undefined) {
				me.scaledWidth = image.naturalWidth * me.scaledHeight / image.naturalHeight;
			}
			if (me.scaledHeight === undefined) {
				me.scaledHeight = image.naturalHeight * me.scaledWidth / image.naturalWidth;
			}
			image.width = Math.round(me.scaledWidth * canvasScale / me.scaleFactor);
			image.height = Math.round(me.scaledHeight * canvasScale / me.scaleFactor);
		});
	}
	imageJQ[0].src = this.url;
	this.elements = [imageJQ.get(0)];

	imageJQ.on("mousemove", function (event) {
		var image = event.target;
		var canvasName = edenUI.plugins.Canvas2D.canvasNameFromElement(image);
		var canvasScale = root.lookup("_view_" + canvasName + "_scale").value() * root.lookup("_view_" + canvasName + "_zoom").value();
		var mouseFollow = root.lookup("mouseFollow").value();
		var imagePos = $(this).offset();
		var x = (event.pageX - Math.round(imagePos.left)) / canvasScale;
		var y = (event.pageY - Math.round(imagePos.top)) / canvasScale;
		root.lookup("mousePosition").assign(new Point(x, y), root.scope, EdenSymbol.hciAgent, mouseFollow);
	});

	if (name !== undefined) {
		edenUI.plugins.Canvas2D.initZoneFromName(name, "HTMLImage");
		imageJQ.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});
	}
	
	if (this.imageMap !== undefined) {
		var mapJQ = $("<map name=\"" + id + "-map\" id=\"" + id + "-map\"></map>");

		var setAreaEvents = function (area, regionName) {
			area.on("mouseenter", function (event) {
				var followMouse = root.lookup("mouseFollow").value();
				root.lookup("mouseZone").assign(regionName, root.scope, EdenSymbol.hciAgent, followMouse);
			})
			.on("mousedown", function (event) {
				var followMouse = root.lookup("mouseFollow").value();
				root.lookup("mouseDownZone").assign(regionName, root.scope, EdenSymbol.hciAgent, followMouse);

			}).on("mouseup", function (event) {
				edenUI.plugins.Canvas2D.endClick();
			});
		};

		for (var i = this.imageMap.length - 1; i >= 0; i--) {
			var shape = this.imageMap[i];
			var regionName;
			if (shape.drawingOptions !== undefined) {
				regionName = shape.drawingOptions.name;
			} else {
				regionName = undefined;
			}
			var areaJQ = $('<area ' + shape.imageMapArea() + '/>');
			if (regionName !== undefined) {
				setAreaEvents(areaJQ, regionName);
			} else if (name !== undefined) {
				setAreaEvents(areaJQ, name);
			}
			mapJQ.append(areaJQ);

			if (Eden.isValidIdentifier(regionName)) {
				var clickSym = root.lookup(regionName + "_click");
				if (clickSym.value() === undefined) {
					clickSym.assign(false, root.scope, root.lookup("HTMLImage"));
				}
			}
		}
		this.elements.push(mapJQ.get(0));
	}
  }
};

HTMLImage.prototype.scale = function (scale, zoom, origin) {
	var imageElem = this.elements[0];
	var style = imageElem.style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	imageElem.width = Math.round(this.scaledWidth * scale / this.scaleFactor);
	imageElem.height = Math.round(this.scaledHeight * scale / this.scaleFactor);
};

HTMLImage.prototype.toString = function() {
  return "HTMLImage(" + Eden.edenCodeForValues(this.name, this.x, this.y, this.width, this.height, this.url, this.imageMap) + ")";
};

HTMLImage.prototype.getEdenCode = HTMLImage.prototype.toString;


Line = function(x1, y1, x2, y2, colours, drawingOptions) {
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
	var align, valign, shift;
	if (drawingOptions !== undefined) {
		align = drawingOptions.align;
		valign = drawingOptions.valign;
	}
	if (this.x1 == this.x2) {
		if (align == "left") {
			shift = -1;
		} else if (align == "right") {
			shift = 1;
		} else {
			shift = 0;
		}
		this.xShift1 = shift;
		this.xShift2 = shift;
		this.yShift1 = 0;
		this.yShift2 = 0;
	} else if (this.y1 == this.y2) {
		if (valign == "top") {
			shift = -1;
		} else if (valign == "bottom") {
			shift = 1;
		} else {
			shift = 0;
		}
		this.xShift1 = 0;
		this.xShift2 = 0;
		this.yShift1 = shift;
		this.yShift2 = shift;
	} else {
		this.xShift1 = this.x2 > this.x1? 1 : -1;
		this.xShift2 = -this.xShift1;
		this.yShift1 = this.y2 > this.y1? 1 : -1;
		this.yShift2 = -this.yShift1;
	}
	this.colours = colours;
	this.drawingOptions = drawingOptions;
}

Line.prototype.draw = function(context, scale) {
	context.beginPath();
	var xShift1, xShift2, yShift1, yShift2;
	if (this.drawingOptions !== undefined) {
		var width = (context.lineWidth / 2 + 0.5 / scale) / Math.SQRT2;
		xShift1 = this.xShift1 * width;
		xShift2 = this.xShift2 * width;
		yShift1 = this.yShift1 * width;
		yShift2 = this.yShift2 * width;
		if ((this.xShift1 == 0 || this.yShift1 == 0) && this.drawingOptions.lineWidth % 2 == 1) {
			context.translate(0.5 / scale, 0.5 / scale);
		}
	} else {
		xShift1 = 0;
		xShift2 = 0;
		yShift1 = 0;
		yShift2 = 0;
	}
	var x1 = this.x1 + xShift1;
	var y1 = this.y1 + yShift1;
	var x2 = this.x2 + xShift2;
	var y2 = this.y2 + yShift2;

	if (this.colours.length == 1) {
		context.strokeStyle = this.colours[0];
	} else {
		var colourGradient = context.createLinearGradient(x1, y1, x2, y2);
		for (var i = 0; i < this.colours.length; i++) {
			colourGradient.addColorStop(i / (this.colours.length - 1), this.colours[i]);
		}
		context.strokeStyle = colourGradient;
	}

	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.stroke();

	if (this.drawingOptions !== undefined && this.drawingOptions.arrowhead instanceof Arrowhead) {
		var gradient = (y2 - y1) / (x2 - x1);
		var reversed = x1 > x2;
		this.drawingOptions.arrowhead.draw(context, scale, x1, y1, gradient, reversed, x2, y2, gradient, reversed);
	}
};

Line.prototype.toString = function(p) {
	var s = "Line(" + Eden.edenCodeForValuesP(p,this.x1, this.y1, this.x2, this.y2) + ", ";

	if (this.colours.length > 1) {
		s = s + Eden.edenCodeForValue(this.colours, undefined, p);
	} else {
		s = s + Eden.edenCodeForValue(this.colours[0], undefined, p);	
	}

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions, undefined, p);
	}
	
	s = s + ")";
	return s;
};

Line.prototype.getEdenCode = Line.prototype.toString;


	LinearGradient = function(x1, y1, x2, y2, colourStops) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.colourStops = colourStops;
	}
	
	LinearGradient.prototype = new EdenUI.plugins.Canvas2D.FillStyle();
	
	LinearGradient.prototype.getColour = function (context) {
		var gradient = context.createLinearGradient(this.x1, this.y1, this.x2, this.y2);
		var colourStop;
		for (var i = 0; i < this.colourStops.length; i++) {
			colourStop = this.colourStops[i];
			gradient.addColorStop(colourStop[0], colourStop[1]);
		}
		return gradient;
	};

	LinearGradient.prototype.toString = function() {
		return "LinearGradient(" + Eden.edenCodeForValues(this.x1, this.y1, this.x2, this.y2, this.colourStops) + ")";
		
	};

	LinearGradient.prototype.getEdenCode = LinearGradient.prototype.toString;


LineSequence = function(vertices, colours, drawingOptions) {
	this.vertices = vertices;
	this.colours = colours;
	this.drawingOptions = drawingOptions;

	this.minX = this.vertices[0].x;
	this.minY = this.vertices[0].y;
	this.maxX = this.minX, this.maxY = this.minY;
	for (var i = 1; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];
		if (vertex.x < this.minX) {
			this.minX = vertex.x;
		} else if (vertex.x > this.maxX) {
			this.maxX = vertex.x;
		}
		if (vertex.y < this.minY) {
			this.minY = vertex.y;
		} else if (vertex.y > this.maxY) {
			this.maxY = vertex.y;
		}
	}
}

LineSequence.prototype.draw = function(context, scale) {
	if (this.drawingOptions !== undefined && this.drawingOptions.lineWidth % 2 == 1) {
		context.translate(0.5 / scale, 0.5 / scale);
	}

	context.beginPath();
	var maxVertex = this.vertices.length - 1;
	if (this.colours.length == 1) {
		context.strokeStyle = this.colours[0];
	} else {
		var gradient = context.createLinearGradient(this.minX, this.minY, this.maxX, this.maxY);
		for (var i = 0; i < this.colours.length; i++) {
			gradient.addColorStop(i / (this.colours.length - 1), this.colours[i]);
		}
		context.strokeStyle = gradient;
	}

	context.moveTo(this.vertices[0].x, this.vertices[0].y);
	for (var i = 1; i <= maxVertex; i++) {
		context.lineTo(this.vertices[i].x, this.vertices[i].y);
	}
	
	context.stroke();

	if (this.drawingOptions !== undefined && this.drawingOptions.arrowhead instanceof Arrowhead) {
		var vertex0 = this.vertices[0];
		var vertex1 = this.vertices[1];
		var vertexN = this.vertices[maxVertex];
		var vertexNMinus1 = this.vertices[maxVertex - 1];
		var gradient1 = (vertex1.y - vertex0.y) / (vertex1.x - vertex0.x);
		var gradient2 = (vertexN.y - vertexNMinus1.y) / (vertexN.x - vertexNMinus1.x);
		var reverse1 = vertex0.x > vertex1.x;
		var reverse2 = vertexNMinus1.x > vertexN.x;
		this.drawingOptions.arrowhead.draw(context, scale, vertex0.x, vertex0.y, gradient1, reverse1,
			vertexN.x, vertexN.y, gradient2, reverse2);
	}	
};

LineSequence.prototype.toString = function() {
	var s = "LineSequence(" + Eden.edenCodeForValue(this.vertices) + ",";
	
	if (this.colours.length > 1) {
		s = s + Eden.edenCodeForValue(this.colours);
	} else {
		s = s + Eden.edenCodeForValue(this.colours[0]);	
	}

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

LineSequence.prototype.getEdenCode = LineSequence.prototype.toString;


Pixel = function(x, y, colour) {
  this.x = x;
  this.y = y;
  this.colour = colour;
}


Pixel.prototype.toString = function() {
  return "Pixel("+ Eden.edenCodeForValues(this.x, this.y, this.colour) + ")";
};

Pixel.prototype.getEdenCode = Pixel.prototype.toString;

Pixel.prototype.draw = function(context) {
  context.fillStyle = this.colour;
  context.fillRect( this.x, this.y, 1, 1);
};

PixelList = function(name, ptrToData, x, y, width) {
	this.name = edenUI.plugins.Canvas2D.initZoneFromName(name, "PixelList");
	this.obsName = root.currentObservableName();
	this.ptr = ptrToData;
	this.data = ptrToData instanceof Symbol? ptrToData.value() : [];
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = this.data.length / (4 * width);
}

PixelList.prototype.draw = function (context) {
	var imageData = context.createImageData(this.width, this.height);
	var imageArr = imageData.data;
	var dataArr = this.data;
	var arrayLen = dataArr.length;
	for (var i = 0; i < arrayLen; i++) {
		imageArr[i] = dataArr[i];
	}
	context.putImageData(imageData, this.x, this.y);
}

PixelList.prototype.isHit = function (context, scale, x, y) {
	return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
}

PixelList.prototype.toString = function() {
	var s = "PixelList(";
	if (this.name !== undefined) {
		s = s + Eden.edenCodeForValue(this.name) + ", ";
	}
	s = s + Eden.edenCodeForValues(this.ptr, this.x, this.y, this.width) + ")";
	return s;
}

PixelList.prototype.getEdenCode = PixelList.prototype.toString;

Polygon = function(vertices, fillcolour, outlinecolour, drawingOptions, centreY) {
	this.vertices = vertices;
	this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;
	this.drawingOptions = drawingOptions;
	this.centreY = centreY; //Used by RegularPolygon
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "Polygon");
	this.obsName = root.currentObservableName();
}

Polygon.prototype.draw = function (context, scale) {
	if (this.drawingOptions !== undefined && this.drawingOptions.lineWidth % 2 == 1) {
		context.translate(0.5 / scale, 0.5 / scale);
	}

	this.tracePath(context, scale);

	if (this.fillcolour !== undefined) {
		edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
		context.fill();
	}
	
	if (this.outlinecolour !== undefined) {
		context.strokeStyle = this.outlinecolour;
		context.stroke();
	}
};

Polygon.prototype.tracePath = function (context, scale) {
	context.beginPath();
	if (scale < 0 && this.centreY !== undefined) {
		var a = 2 * this.centreY;
		context.moveTo(this.vertices[0].x, a - this.vertices[0].y);
		for (var i = 1; i < this.vertices.length; i++) {
			context.lineTo(this.vertices[i].x, a - this.vertices[i].y);
		}
	} else {
		context.moveTo(this.vertices[0].x, this.vertices[0].y);
		for (var i = 1; i < this.vertices.length; i++) {
			context.lineTo(this.vertices[i].x, this.vertices[i].y);
		}
	}
	context.closePath();
}

Polygon.prototype.isHit = function (context, scale, x, y) {
	this.tracePath(context, scale);
	return context.isPointInPath(x,y);
}

Polygon.prototype.toString = function() {
	var s = "Polygon(" + Eden.edenCodeForValues(this.vertices, this.fillcolour, this.outlinecolour);

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

Polygon.prototype.getEdenCode = Polygon.prototype.toString;

Polygon.prototype.imageMapArea = function () {
	var s = "shape=\"poly\" coords=\"";
	for (var i = 0; i < this.vertices.length; i++) {
		var vertex = this.vertices[i];
		s = s + vertex.x + "," + vertex.y + ",";
	}
	s = s.slice(0, -1);
	s = s + "\"";
	return s;
}

Polygon.prototype.centre = function () {
	var centreX = 0, centreY = 0;
	for (var i = 0; i < this.vertices.length; i++) {
		centreX = centreX + this.vertices[i].x;
		centreY = centreY + this.vertices[i].y;
	}
	centreX = centreX / this.vertices.length;
	centreY = centreY / this.vertices.length;
	return new Point(centreX, centreY);
}


	RadialGradient = function(x1, y1, r1, x2, y2, r2, colourStops) {
		this.x1 = x1;
		this.y1 = y1;
		this.r1 = r1;
		this.x2 = x2;
		this.y2 = y2;
		this.r2 = r2;
		this.colourStops = colourStops;
	}
	
	RadialGradient.prototype = new EdenUI.plugins.Canvas2D.FillStyle();

	RadialGradient.prototype.getColour = function (context) {
		var gradient = context.createRadialGradient(this.x1, this.y1, this.r1, this.x2, this.y2, this.r2);
		var colourStop;
		for (var i = 0; i < this.colourStops.length; i++) {
			colourStop = this.colourStops[i];
			gradient.addColorStop(colourStop[0], colourStop[1]);
		}
		return gradient;
	};

	RadialGradient.prototype.toString = function() {
		return "RadialGradient(" + Eden.edenCodeForValues(this.x1, this.y1, this.r1, this.x2, this.y2, this.r2, this.colourStops) + ")";
		
	};

	RadialGradient.prototype.getEdenCode = RadialGradient.prototype.toString;


RadioButtons = function (name, values, labels, x, y, width, horizontal, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.values = values;
	this.labels = labels;
	this.x = x;
	this.y = y;
	this.width = width;
	this.horizontal = horizontal;
    this.enabled = enabled;
}

RadioButtons.prototype.hash = function () {
	return this.name+"$$"+
				(Array.isArray(this.values)? this.values.join("$$") : "") +
				(Array.isArray(this.labels)? this.labels.join("$$") : "") +
				this.x+"$$"+
				this.y+"$$"+
				this.width+"$$"+
				this.horizontal+"$$"+
				this.enabled
};


RadioButtons.prototype.makeHTML = function() {
	var build = "";
	var disabled = this.enabled === false? ' disabled="disabled"' : '';

	for (var i = 0; i < this.values.length; i++) {
		build = build + '<label><input type="radio" name="' + this.name +
			'" value="' + this.values[i] + '"' + disabled + '/> ' +
			this.labels[i] + '</label><br/>';
	}

	if (this.horizontal) {
		return '<form class="canvashtml-item canvas-horizontal-radio-buttons">' + build + '</form>';
	} else {
		return '<form class="canvashtml-item">' + build + '</form>';
	}
};

RadioButtons.prototype.draw = function (context) {

	if(this.elements === undefined) {
		var name = this.name;

		//Make the HTML
		var formJQ = $(this.makeHTML());

		var formElement = formJQ.get(0);
		var updateValue = function (buttonGroup, value) {
			for (var i = 0; i < buttonGroup.length; i++) {
				if (buttonGroup[i].value == value) {
					buttonGroup[i].checked = true;
					break;
				} else {
					//Possibility of having no radio button selected.
					buttonGroup[i].checked = false;
				}
			}
		
		};
		var valueSym = root.lookup(name + "_value");
		var initialValue = valueSym.value();
		if (initialValue !== undefined) {
			updateValue(formElement.elements, initialValue);
		}
		valueSym.addJSObserver("updateUI", function (symbol, value) {
			updateValue(formElement.elements, value);
		});

		formJQ.change(function(event) {
			root.lookup(name + "_value").assign(event.target.value, root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		this.elements = [formElement];
	}
};

RadioButtons.prototype.scale = function (scale, zoom, origin) {
	var elem = this.elements[0];
	var style = elem.style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	if (this.width === undefined) {
		style.width = "";
	} else {
		style.width = Math.round(this.width * scale) + "px";
	}
	style.fontSize = zoom + "em";
	var buttonSize = Math.round(13 * zoom) + "px";
	$(elem).find("input").css({width: buttonSize, height: buttonSize});
};

RadioButtons.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "RadioButtons(" + Eden.edenCodeForValues(this.values, this.labels, this.x,
			this.y, this.width, this.horizontal, this.enabled) + ")";
	} else {
		return "RadioButtons(" + Eden.edenCodeForValues(this.name, this.values, this.labels, this.x,
			this.y, this.width, this.horizontal, this.enabled) + ")";
	}
};

RadioButtons.prototype.getEdenCode = RadioButtons.prototype.toString;

Rectangle = function(x, y, width, height, fillcolour, outlinecolour, drawingOptions) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;
	this.drawingOptions = drawingOptions;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "Rectangle");
	this.obsName = root.currentObservableName();
}

Rectangle.prototype.draw = function (context, scale) {
	var lineWidth;
	if (this.outlinecolour !== undefined) {
		lineWidth = context.lineWidth;
		if (this.drawingOptions !== undefined) {
			if (!("join" in this.drawingOptions) && lineWidth < 10) {
				//Bug in Chrome v44, shape isn't drawn when miter join is used with larger line widths.
				context.lineJoin = "miter"
			}
		}
	} else {
		lineWidth = 0;
	}
	var y = this.y;
	if (scale < 0) {
		y = y - this.height;
	}
	if (this.fillcolour !== undefined) {
		edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
		context.fillRect(this.x + lineWidth, y + lineWidth, this.width - 2 * lineWidth, this.height - 2 * lineWidth);
	}
	if (this.outlinecolour !== undefined) {
		context.strokeStyle = this.outlinecolour;
		context.strokeRect(this.x + lineWidth / 2, y + lineWidth / 2, this.width - lineWidth, this.height - lineWidth);
	}
};

Rectangle.prototype.isHit = function (context, scale, x, y) {
	return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
}

Rectangle.prototype.toString = function() {
	var s = "Rectangle(" + Eden.edenCodeForValues(this.x, this.y, this.width, this.height, this.fillcolour, this.outlinecolour);

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

Rectangle.prototype.getEdenCode = Rectangle.prototype.toString;

Rectangle.prototype.imageMapArea = function () {
	return "shape=\"rect\" coords=\"" + this.x + "," + this.y + "," + (this.x + this.width) + "," +
		(this.y + this.height) + "\"";
}

Rectangle.prototype.centre = function () {
	return new Point(this.x + this.width / 2, this.y + this.height / 2);
}


	RegularPolygon = function (x, y, r, n, star, rotation, interiorOutline, fillcolour, outlinecolour, drawingOptions) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.n = n;
		this.star = star;
		star = Math.floor(star);
		this.interiorOutline = interiorOutline;
		this.rotation = rotation;
		this.rotationInRadians = rotation * Math.PI / root.lookup("semicircleAngle").value();
		this.fillcolour = fillcolour;
		this.outlinecolour = outlinecolour;
		this.drawingOptions = drawingOptions;
		this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "RegularPolygon");
		this.obsName = root.currentObservableName();

		this.exteriorAngle = (2 * Math.PI) / n;
		this.vertices = [];
		var pointsDone = new Array(n);
		var px, py;
		var currentPolygonVertices, currentPoint;
		var nudge;
		if (drawingOptions !== undefined && drawingOptions.valign == "bottom") {
			if (drawingOptions.lineWidth !== undefined) {
				nudge = drawingOptions.lineWidth;
			} else {
				nudge = 2;
			}
		} else {
			nudge = 0;
		}
		var rotation2;
		if (n % 4 == 0) {
			rotation2 = -this.rotationInRadians - Math.PI * (0.5 - 1 / n);
		} else {
			rotation2 = -this.rotationInRadians - Math.PI * (0.5 - 2 / n); //Zero rotation means "pointing upwards"
		}
		for (var i = 0; i < n; i++) {
			var j = i;
			currentPolygonVertices = [];
			while (pointsDone[j] !== true) {
				px = x + r * Math.cos(rotation2 + j * this.exteriorAngle);
				py = y + r * Math.sin(rotation2 + j * this.exteriorAngle) + nudge;
				currentPoint = new Point(px, py);
				currentPolygonVertices.push(currentPoint);
				pointsDone[j] = true;
				j = (j + star) % n;
			}
			if (currentPolygonVertices.length > 0) {
				this.vertices = this.vertices.concat(currentPolygonVertices);
			}
		}
		if (outlinecolour === undefined && star % n != 0) {
			this.calculatePolygons(0);
		}
	}

	RegularPolygon.degenerateMonogramRadii = 7;

	RegularPolygon.prototype.calculatePolygons = function (lineWidth, scale) {
		var radius;
		var rotation;
		if (this.n % 4 == 0) {
			rotation = -this.rotationInRadians - Math.PI * (0.5 - 1 / this.n);
		} else {
			rotation = -this.rotationInRadians - Math.PI * (0.5 - 2 / this.n); //Zero rotation means "pointing upwards"
		}

		var nudge;
		if (this.drawingOptions !== undefined && this.drawingOptions.valign == "bottom") {
			nudge = lineWidth;
		} else {
			nudge = 0;
		}

		var px, py;
		var polygons = [];
		this.outlinePolygons = [];
		var star = Math.floor(this.star);
		if (star % this.n == 0) {
			var circlesRadius = RegularPolygon.degenerateMonogramRadii / scale + (this.outlinecolour === undefined? 0 : lineWidth * 2);
			radius = this.r - circlesRadius;
			for (var i = 0; i < this.n; i++) {
				px = this.x + radius * Math.cos(rotation + i * this.exteriorAngle);
				py = this.y + radius * Math.sin(rotation + i * this.exteriorAngle) + nudge;
				polygons.push(new Circle(px, py, circlesRadius, this.fillcolour, this.outlinecolour, this.drawingOptions));
			}
			this.filledPolygons = polygons;
			return;
		}

		radius = this.r - lineWidth / 2
		var separatePolygonsPossiblyNeeded;
		if (this.fillcolour !== undefined && this.fillcolour != "transparent" &&
			this.outlinecolour !== undefined &&
			this.n / star != 2
		) {
			separatePolygonsPossiblyNeeded = true;
		} else {
			separatePolygonsPossiblyNeeded = false;		
		}
		
		var pointsDone = new Array(this.n);
		var currentPolygonVertices, currentPoint;
		for (var i = 0; i < this.n; i++) {
			var j = i;
			currentPolygonVertices = [];
			while (pointsDone[j] !== true) {
				px = this.x + radius * Math.cos(rotation + j * this.exteriorAngle);
				py = this.y + radius * Math.sin(rotation + j * this.exteriorAngle) + nudge;
				currentPoint = new Point(px, py);
				currentPolygonVertices.push(currentPoint);
				pointsDone[j] = true;
				j = (j + star) % this.n;
			}
			if (currentPolygonVertices.length > 0) {
				polygons.push(new Polygon(currentPolygonVertices, this.fillcolour, this.outlinecolour, this.drawingOptions, this.y));
			}
		}
		if (separatePolygonsPossiblyNeeded) {
			if (polygons.length == 1) {
				if (!this.interiorOutline) {
					/* Case: single constituent polygon (e.g. five-pointed star) with an outline but
					 * not an outline drawn in inside the shape (i.e. a star or a pentagon rather
					 * than a pentagram).
					 * Solution: add extra polygons to over-paint those inside edges that we don't want.
					 * N.B. We can (and do) safely ignore these extra polygons when performing hit testing.
					 */
					var smallerRadius = this.r - lineWidth;
					currentPolygonVertices = [];
					i = 0;
					do {
						px = this.x + smallerRadius * Math.cos(rotation + i * this.exteriorAngle);
						py = this.y + smallerRadius * Math.sin(rotation + i * this.exteriorAngle);
						currentPoint = new Point(px, py);
						currentPolygonVertices.push(currentPoint);
						i = (i + star) % this.n;
					} while (i != 0);
					polygons.push(new Polygon(currentPolygonVertices, this.fillcolour, undefined, this.drawingOptions, this.y));
				} else {
					/* Case: the user wants to see the edges that intersect the interior of the
					 * polygon.
					 */
				}
				this.filledPolygons = polygons;
			} else {
				/* Case: multiple constituent polygons (specifically, more than 2).  Occurs when
				 * n / star is an integer greater than 2.
				 * Solution: Paint the fill and the outline as separate polygons.  The requirement
				 * to show or hide the interior edges determines whether the outlines are painted
				 * first or the fill is painted first.
				 */
				this.filledPolygons = [];
				for (var i = 0; i < polygons.length; i++) {
					this.filledPolygons.push(new Polygon(polygons[i].vertices, this.fillcolour, undefined, this.drawingOptions, this.y));
				}
				for (var i = 0; i < polygons.length; i++) {
					this.outlinePolygons.push(new Polygon(polygons[i].vertices, undefined, this.outlinecolour, this.drawingOptions, this.y));
				}
			}
		} else {
			/* Case: the outline doesn't have intersecting edges (or only degenerate ones, i.e. n / star = 2),
			 * or doesn't have an outline, or doesn't have a fill colour.
			 * N.B: n / star = 2 is the degenerate case when a polygon is reduced to being a set of unconnected lines.
			 * Solution: One set of polygons that paint either the fill or the outline (the shape doesn't have both).
			 */
			this.filledPolygons = polygons;
		}	
	}

	
RegularPolygon.prototype.draw = function (context, scale) {
	var lineWidth = context.lineWidth;
	if (!this.interiorOutline) {
		lineWidth = lineWidth * 2;
	}
	if (this.outlinecolour !== undefined || Math.floor(this.star) % this.n == 0) {
		if (lineWidth !== this.cachedPolygonLineWidth) {
			this.calculatePolygons(lineWidth, scale);
			this.cachedPolygonLineWidth = lineWidth;
		}
	}

	if (this.interiorOutline) {
		for (var i = 0; i < this.filledPolygons.length; i++) {
			this.filledPolygons[i].draw(context, scale);
		}
		for (var i = 0; i < this.outlinePolygons.length; i++) {
			this.outlinePolygons[i].draw(context, scale);
		}
	} else {
		context.lineWidth = lineWidth;
		for (var i = 0; i < this.outlinePolygons.length; i++) {
			this.outlinePolygons[i].draw(context, scale);
		}
		context.lineWidth = lineWidth / 2;
		for (var i = 0; i < this.filledPolygons.length; i++) {
			this.filledPolygons[i].draw(context, scale);
		}
	}
}

RegularPolygon.prototype.isHit = function (context, scale, x, y) {
	var hit;
	var star = Math.floor(this.star);
	var ratio = this.n / star;
	var limit;
	if (this.fillcolour !== undefined && this.fillcolour != "transparent" &&
		this.outlinecolour !== undefined &&
		ratio != 2 &&
		(star == 1 || ratio != Math.floor(ratio)) &&
		!this.interiorOutline
	) {
		limit = this.filledPolygons.length / 2;
	} else {
		limit = this.filledPolygons.length;
	}
	for (var i = 0; i < limit; i++) {
		hit = this.filledPolygons[i].isHit(context, scale, x, y);
		if (hit) {
			return true;
		}
	}
	return false;
};

RegularPolygon.prototype.toString = function () {
	var s = "RegularPolygon(" + Eden.edenCodeForValues(this.x, this.y, this.r, this.n, this.star,
		this.interiorOutline, this.rotation, this.fillcolour, this.outlinecolour);

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	s = s + ")";
	return s;
}

RegularPolygon.prototype.getEdenCode = RegularPolygon.prototype.toString;
	
RegularPolygon.prototype.imageMapArea = function () {
	return this.filledPolygons[0].imageMapArea();
}

RegularPolygon.prototype.centre = function () {
	return new Point(this.x, this.y);
}

	Rotation = function (angle, centre, origin, angle2, radius, items) {
		this.angle = angle;
		this.centre = centre;
		this.origin = origin;
		this.angle2 = angle2;
		this.radius = radius;
		this.items = items;

		var radiansPerUnit = Math.PI / root.lookup("semicircleAngle").value();
		if (angle2 === undefined) {
			this.radians2 = 0;
		} else {
			this.radians2 = -angle2 * radiansPerUnit;
		}
		if (angle === undefined) {
			this.radians = 0;
		} else {
			this.radians = -angle * radiansPerUnit - this.radians2;
		}
	}

	Rotation.prototype = new EdenUI.plugins.Canvas2D.Transform();
	
	Rotation.prototype.transform = function (context) {
		var origin = this.origin;
		var centre = this.centre;
		var radius = this.radius;

		context.translate(origin.x, origin.y);

		if (radius !== undefined) {
			context.rotate(this.radians2);
			context.translate(radius, 0);
		}
		context.rotate(this.radians);

		if (centre !== undefined) {
			context.translate(-centre.x, -centre.y);
		}
	}

	Rotation.prototype.getCSS = function (scale) {
		var origin = this.origin;
		var centre = this.centre;
		var radius = this.radius;

		var css, x, y, theta;

		x = origin.x * scale;
		y = origin.y * scale;
		css = "translate(" + x + "px, " + y + "px) ";

		if (radius !== undefined) {
			theta = this.radians2;
			x = radius * scale;
			css = css +  "rotate(" + theta + "rad) translateX(" + x + "px) ";
		}

		theta = this.radians;
		css = css + "rotate(" + theta + "rad) ";

		if (centre !== undefined) {
			x = -centre.x * scale;
			y = -centre.y * scale;
			css = css + "translate(" + x + "px, " + y + "px)";
		}

		return css;
	}

	Rotation.prototype.inverse = function (x, y) {
		var origin = this.origin;
		var centre = this.centre;
		var radius = this.radius;

		var invX = x - origin.x;
		var invY = y - origin.y;
		var temp, sin, cos;

		if (radius !== undefined) {
			sin = Math.sin(-this.radians2);
			cos = Math.cos(-this.radians2);
			temp = invX;
			invX = cos * invX - sin * invY;
			invY = sin * temp + cos * invY;
			invX = invX - radius;
		}

		sin = Math.sin(-this.radians);
		cos = Math.cos(-this.radians);
		temp = invX;
		invX = cos * invX - sin * invY;
		invY = sin * temp + cos * invY;

		if (centre !== undefined) {
			invX = invX + centre.x;
			invY = invY + centre.y;
		}
		return new Point(invX, invY);
	}

	Rotation.prototype.toString = function() {
		if (this.radius !== undefined && this.centre !== undefined) {
			return "CombinedRotation(" + Eden.edenCodeForValues(this.angle, this.centre, this.origin, this.angle2, this.radius, this.items) + ")";
		} else if (this.radius !== undefined) {
			return "RotateAboutPoint(" + Eden.edenCodeForValues(this.angle2, this.origin, this.radius, this.items) + ")";
		} else {
			return "RotateAboutCentre(" + Eden.edenCodeForValues(this.angle, this.centre, this.origin, this.items) + ")";
		}
	}

	Rotation.prototype.getEdenCode = Rotation.prototype.toString;


RoundedRectangle = function(x, y, width, height, radius, fillcolour, outlinecolour, drawingOptions) {
	this.x1 = x;
	this.y1 = y;
	this.x2 = x + width;
	this.y2 = y + height;
	this.radius = radius;
	this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;
	this.drawingOptions = drawingOptions;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "RoundedRectangle");
	this.obsName = root.currentObservableName();
}

RoundedRectangle.prototype.draw = function (context, scale) {

	this.tracePath(context, scale);

	if (this.fillcolour !== undefined) {
		edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
		context.fill();
	}
	if (this.outlinecolour !== undefined) {
		context.strokeStyle = this.outlinecolour;
		context.stroke();
	}
};

RoundedRectangle.prototype.tracePath = function (context, scale) {
	var halfLineWidth;
	if (this.outlinecolour !== undefined) {
		halfLineWidth = context.lineWidth / 2;
	} else {
		halfLineWidth = 0;
	}
	var x1 = this.x1 + halfLineWidth;
	var x2 = this.x2 - halfLineWidth;
	var y1 = this.y1 + halfLineWidth;
	var y2 = this.y2 - halfLineWidth;
	if (scale < 0) {
		var temp = y1 - (y2 - y1);
		y2 = y1;
		y1 = temp;
	}
	
	context.beginPath();
    context.moveTo(x1 + this.radius, y1);
    context.lineTo(x2 - this.radius, y1);
	context.arcTo(x2, y1, x2, y1 + this.radius, this.radius);
	context.lineTo(x2, y2 - this.radius);
	context.arcTo(x2, y2, x2 - this.radius, y2, this.radius);
	context.lineTo(x1 + this.radius, y2);
	context.arcTo(x1, y2, x1, y2 - this.radius, this.radius);
	context.lineTo(x1, y1 + this.radius);
	context.arcTo(x1, y1, x1 + this.radius, y1, this.radius);
	context.closePath();
};

RoundedRectangle.prototype.isHit = function (context, scale, x, y) {
	this.tracePath(context, scale);
	return context.isPointInPath(x,y);
}

RoundedRectangle.prototype.toString = function() {
	var s = "RoundedRectangle(" + Eden.edenCodeForValues(this.x1, this.y1) + ", ";
	
	if (this.x2 === undefined || this.x1 === undefined) {
		s = s + "@, ";
	} else {
		s = s + String(this.x2 - this.x1) + ", ";
	}
	if (this.y2 === undefined || this.y1 === undefined) {
		s = s + "@, ";
	} else {
		s = s + String(this.y2 - this.y1) + ", ";
	}
	s = s + Eden.edenCodeForValues(this.radius, this.fillcolour, this.outlinecolour);
	
	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
};

RoundedRectangle.prototype.getEdenCode = RoundedRectangle.prototype.toString;

	Scaling = function (scaleX, scaleY, centreX, centreY, translateX, translateY, items) {
		this.scaleX = scaleX;
		this.scaleY = scaleY;
		this.centreX = centreX;
		this.centreY = centreY;
		this.translateX = translateX;
		this.translateY = translateY;
		this.items = items;
	}

	Scaling.prototype = new EdenUI.plugins.Canvas2D.Transform;

	Scaling.prototype.transform = function (context) {
		var translateX = this.translateX;
		if (translateX !== undefined) {
			context.translate(translateX, this.translateY);
		}

		context.scale(this.scaleX, this.scaleY);

		var centreX = this.centreX;
		if (centreX !== undefined) {
			context.translate(-centreX, -this.centreY);
		}
	}

	Scaling.prototype.getCSS = function (scale) {
		var x = this.translateX;
		var y = this.translateY;
		var css;
		if (x || y) {
			x = x * scale;
			y = y * scale;
			css = "translate(" + x + "px, " + y + "px) ";
		} else {
			css = "";
		}

		var scaleX = this.scaleX * scale;
		var scaleY = this.scaleY * scale;
		css = css + "scale(" + scaleX + ", " + scaleY + ") ";

		x = this.centreX;
		y = this.centreY;
		if (x || y) {
			x = -x / this.scaleX;
			y = -y / this.scaleY;
			css = css + "translate(" + x + "px, " + y + "px)";
		}
		return css;
	}

	Scaling.prototype.inverse = function (x, y) {
		var invX = x, invY = y;
		
		var translateX = this.translateX;
		if (translateX) {
			invX = invX - translateX;
			invY = invY - this.translateY;
		}

		invX = invX / this.scaleX;
		invY = invY / this.scaleY;

		var centreX = this.centreX;
		if (centreX) {
			invX = invX + centreX;
			invY = invY + this.centreY;
		}
		return new Point(invX, invY);
	}

	Scaling.prototype.toString = function () {
		return "Scale(" + Eden.edenCodeForValues(this.scaleX, this.scaleY, this.centreX,
			this.centreY, this.translateX, this.translateY, this.items) + ")";
	}

	Scaling.prototype.getEdenCode = Scaling.prototype.toString;


Sector = function(x, y, r, sAngle, eAngle, unitsInCircle, fillcolour, outlinecolour,drawingOptions) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.sAngle = sAngle;
	this.eAngle = eAngle;
	this.unitsInCircle = unitsInCircle;
	var radiansPerUnit;
	if (unitsInCircle === undefined) {
		radiansPerUnit = Math.PI / root.lookup("semicircleAngle").value();
	} else {
		radiansPerUnit = (2 * Math.PI) / unitsInCircle;
	}
	this.sRadians = sAngle * radiansPerUnit;
	this.eRadians = eAngle * radiansPerUnit;

    this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;
	this.drawingOptions = drawingOptions;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(drawingOptions, "Sector");
	this.obsName = root.currentObservableName();
}

Sector.prototype.draw = function (context, scale) {

	this.tracePath(context, scale);

	if (this.fillcolour !== undefined) {
		edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
		context.fill();
	}
	if (this.outlinecolour !== undefined) {
		context.strokeStyle = this.outlinecolour;
		context.stroke();
	}
};

Sector.prototype.tracePath = function (context, scale) {
	var anticlockwise;
	if (this.drawingOptions !== undefined && "direction" in this.drawingOptions) {
		switch (this.drawingOptions.direction) {
		case "anticlockwise":
		case "acw":
		case "ccw":
			anticlockwise = true;
			break;
		case "auto":
			anticlockwise = this.sAngle < this.eAngle;
			break;
		case "clockwise":
		case "cw":
			anticlockwise = false;
			break;
		default:
			//Invalid value specified.
			anticlockwise = true;
		}
	} else {
		//Default to "auto" 
		anticlockwise = this.sAngle < this.eAngle;
	}

	var sRadians = this.sRadians;
	var eRadians = this.eRadians;
	if (scale < 0) {
		sRadians = -sRadians;
		eRadians = -eRadians;
		anticlockwise = !anticlockwise;
	}
	var radius;
	if (this.outlinecolour === undefined) {
		radius = this.r;
	} else if (this.drawingOptions !== undefined && this.drawingOptions.lineWidth % 2 == 1) {
		context.translate(0.5 / scale, 0.5 / scale);
		radius = this.r - 0.5 * context.lineWidth - 0.5 / scale;
	} else {
		radius = this.r - 0.5 * context.lineWidth;
	}

	context.beginPath();
	context.arc(this.x, this.y, radius, -sRadians, -eRadians, anticlockwise);
	context.lineTo(this.x, this.y);
	context.closePath();
};

Sector.prototype.isHit = function (context, scale, x, y) {
	this.tracePath(context, scale);
	return context.isPointInPath(x,y);
}

Sector.prototype.toString = function() {
	var s = "Sector(" + Eden.edenCodeForValues(this.x, this.y, this.r, this.sAngle, this.eAngle,
		this.unitsInCircle, this.fillcolour, this.outlinecolour);

	if (this.drawingOptions !== undefined) {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions);
	}
	
	s = s + ")";
	return s;
}

Sector.prototype.getEdenCode = Sector.prototype.toString;

	function Shadow(colour, xOffset, yOffset, blur, scale) {
		this.colour = colour;
		this.blur = blur;
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.scale = scale;
	}

	Shadow.prototype.toString = function() {
		return "Shadow(" + Eden.edenCodeForValues(this.colour, this.xOffset, this.yOffset, this.blur, this.scale) + ")";
	}

	Shadow.prototype.getEdenCode = Shadow.prototype.toString;

Slider = function(name, min, max, step, labelInterval, tickMarkInterval, labelDivisor, x, y, length, orientation, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.min = min;
	this.max = max;
	this.step = step;
	this.labelInterval = labelInterval;
	this.tickMarkInterval = tickMarkInterval;
	this.labelDivisor = labelDivisor;
	this.x = x;
	this.y = y;
	this.length = length;
	this.orientation = orientation;
	this.enabled = enabled;
}

Slider.prototype.hash = function () {
	return this.name+"$$"+
				this.min+"$$"+
				this.max+"$$"+
				this.step+"$$"+
				this.labelInterval+"$$"+
				this.tickMarkInterval+"$$"+
				this.labelDivisor+"$$"+
				this.x+"$$"+
				this.y+"$$"+
				this.length+"$$"+
				this.orientation+"$$"+
				this.enabled;
};

Slider.prototype.draw = function (context) {

	if (this.elements === undefined) {
		var name = this.name;
		var me = this;
		var agent = root.lookup("Slider");

		var cssClass;
		if (this.orientation == "down"){
			cssClass = "slider-down"
		} else if (this.orientation == "up" || this.orientation == "vertical") {
			cssClass = "slider-up"
		} else {
			cssClass = "slider-horizontal";
		}
		var disabled = this.enabled === false? "disabled=\"disabled\"" : "";
		var inputHTML = '<input ' +
			disabled +
			'type="range" ' +
			'min="' + this.min + '" ' +
			'max="' + this.max + '" ';
		if (this.step === undefined) {
			inputHTML = inputHTML + 'step="0.0000001"';		
		} else {
			inputHTML = inputHTML + 'step="' + this.step + '"';
		}
		inputHTML = inputHTML + '/>';
		var inputJQ = $(inputHTML);
		var inputElem = inputJQ.get(0);
		this.sliderElement = inputElem;

		var valueSym = root.lookup(name + "_value");
		var previewSym = root.lookup(name + "_preview");

		function setValue(obs, value, force) {
			if (typeof(value) != "number") {
				return;
			}
			var previewSym = root.lookup(name + "_preview");
			var previewValue = previewSym.value();
			if (previewValue !== value || force) {
				var roundedValue;
				if (value >= me.min && value <= me.max) {
					inputElem.value = value;
					roundedValue = parseFloat(inputElem.value);
					if (roundedValue != value) {
						//Value didn't match the step size.
						obs.assign(roundedValue, root.scope, agent);
					}
				} else {
					if (value < me.min) {
						inputElem.value = me.min;
					} else {
						inputElem.value = me.max;
					}
					if (me.step !== undefined) {
						roundedValue = Math.round(((value - me.min) / me.step).toPrecision(16)) * me.step + me.min;
						if (roundedValue != value) {
							obs.assign(roundedValue, root.scope, agent);
						}
					} else {
						roundedValue = value;
					}
				}
				if (previewValue != roundedValue) {
					previewSym.assign(roundedValue, root.scope, EdenSymbol.hciAgent);
				}
			}
		}

		valueSym.addJSObserver("updateUI", setValue);
		previewSym.addJSObserver("updateUI", function (obs, preview) {
			if (typeof(preview) != "number") {
				return;
			}
			var previewSym = root.lookup(name + "_preview");
			var valueSym = root.lookup(name + "_value");
			if (previewSym.last_modified_by !== EdenSymbol.hciAgent.name) {
				var roundedValue;
				if (preview >= me.min && preview <= me.max) {
					inputElem.value = preview;
					roundedValue = parseFloat(inputElem.value);
					if (roundedValue != preview) {
						//Value didn't match the step size.
						obs.assign(roundedValue, root.scope, agent);
					}
				} else {
					if (preview < me.min) {
						inputElem.value = me.min;
					} else {
						inputElem.value = me.max;
					}
					if (me.step !== undefined) {
						roundedValue = Math.round(((preview - me.min) / me.step).toPrecision(16)) * me.step + me.min;
						if (roundedValue != value) {
							obs.assign(roundedValue, root.scope, agent);
						}
					} else {
						roundedValue = preview;
					}
				}
				valueSym.assign(roundedValue, root.scope, agent);
			}
		});

		inputJQ
		.on("input", function(){
			root.lookup(name + "_preview").assign(parseFloat(this.value), root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			root.lookup(name + "_value").assign(parseFloat(this.value), root.scope, EdenSymbol.hciAgent, true);
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("keyup", function () {
			root.lookup(name + "_value").assign(parseFloat(this.value), root.scope, EdenSymbol.hciAgent, true);		
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		var outerDiv = $('<div class="' + cssClass + '" ></div>');
		if ((this.tickMarkInterval > 0 || this.labelInterval > 0) && this.max > this.min) {
			var innerDiv = $('<div style="position: relative; height: 100%"></div>');
			outerDiv.append(innerDiv);
			if (this.tickMarkInterval > 0) {
				for (var i = this.min; i <= this.max; i = i + this.tickMarkInterval) {
					var percentage = (i - this.min) / (this.max - this.min) * 100;
					//The offset is to get the centre of the slider thumb positioned exactly on the tick mark.
					var offset = Math.round((50 - percentage) / 100 * 10);
					var position = 'calc(' + percentage + '% + ' + offset + 'px)';
					var tickMark = $('<div"></div>');
					if (this.orientation == "horizontal") {
						tickMark.css("left", position);
					} else {
						tickMark.css("top", position);
					}
					if ((i - this.min) % this.labelInterval == 0) {
						tickMark.addClass("slider-major-tick-mark");
					} else {
						tickMark.addClass("slider-minor-tick-mark");
					}
					innerDiv.append(tickMark);
				}
			}
			inputJQ.css("width", "100%");
			innerDiv.append(inputJQ);
			if (this.labelInterval > 0) {
				if (this.orientation == "horizontal") {
					var labelWidth = 100 / ((this.max - this.min) / this.labelInterval);
					var halfLabelWidth = labelWidth / 2;
					for (var i = this.min; i <= this.max; i = i + this.labelInterval) {
						var percentage = (i - this.min) / (this.max - this.min) * 100 - halfLabelWidth;
						var offset = Math.round((50 - percentage) / 100 * 10);
						var labelText = i / this.labelDivisor;
						var label = $(
							'<div ' + 
								'class="slider-label" ' +
								'style="left: calc(' + percentage + '% + ' + offset + 'px); width: ' + labelWidth + '%"' +
							'>' +
								labelText +
							'</div>'
						);
						innerDiv.append(label);
					}
				} else {
					for (var i = this.max; i >= this.min; i = i - this.labelInterval) {
						var percentage = (this.max - i) / (this.max - this.min) * 100;
						var offset = Math.round((50 - percentage) / 100 * 10 + 1);
						var labelText;
						if (this.orientation == "down") {
							labelText = (this.max - i) / this.labelDivisor;
						} else {
							labelText = i / this.labelDivisor;
						}
						var label = $(
							'<div ' +
								'class="slider-label" ' +
								'style="top: calc(' + percentage + '% + ' + offset + 'px - 0.5em)"' +
							'>' +
								labelText +
							'</div>'
						);
						innerDiv.append(label);
					}
				}
			}
		} else {
			outerDiv.append(inputJQ);
		}
		this.elements = [outerDiv.get(0)];

		//Initialization
		var value = valueSym.value();
		var previewValue = previewSym.value();
		if (value === undefined) {
			if (previewValue === undefined) {
				var defaultValue = (this.max - this.min) / 2 + this.min;
				valueSym.assign(defaultValue, root.scope, agent);
				setValue(valueSym, defaultValue, true);
			} else {
				valueSym.assign(previewValue, root.scope, agent);
				setValue(valueSym, previewValue, true);
			}
		} else {
			setValue(valueSym, value, true);
		}
	}
};

Slider.prototype.scale = function (scale, zoom, origin) {
	if (!this.sliderElement) {
		return;
	}
	var slider = this.sliderElement;
	var sliderStyle = slider.style;
	var divStyle = this.elements[0].style;
	var width = Math.round(this.length * scale);
	var isVertical = this.orientation == "up" || this.orientation == "down" || this.orientation == "vertical";
	if (isVertical) {
		sliderStyle.left = Math.round(-this.length / 2 * scale) + "px";
		sliderStyle.top = Math.round((this.length / 2 - 10) * scale) + "px";
		sliderStyle.width = width + "px";
		divStyle.height = width + "px";
	} else {
		divStyle.width = width + "px";	
	}

	divStyle.fontSize = zoom + "em";
	divStyle.left = Math.round((this.x + origin.x) * scale) + "px";
	divStyle.top =  Math.round((this.y + origin.y) * scale) + "px";

	if (this.step == undefined) {
		slider.step = String((slider.max - slider.min) / (width  - 1)).slice(0, 16);
	}
};

Slider.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "Slider(" + Eden.edenCodeForValues(this.min, this.max, this.step, this.labelInterval,
			this.tickMarkInterval, this.labelDivisor, this.x, this.y, this.length, this.orientation,
			this.enabled) + ")";
	} else {
		return "Slider(" + Eden.edenCodeForValues(this.name, this.min, this.max, this.step,
			this.labelInterval, this.tickMarkInterval, this.labelDivisor, this.x, this.y,
			this.length, this.orientation, this.enabled) + ")";
	}
};

Slider.prototype.getEdenCode = Slider.prototype.toString;

	TableLayout = function (x, y, width, content, drawingOptions) {
		this.obsName = root.currentObservableName();
		this.x = x;
		this.y = y;
		this.width = width;
		this.content = content;
		this.drawingOptions = drawingOptions;

		var rows = [ [] ];
		var numRows = 1;
		if (Array.isArray(this.content)) {
			var maxCol = 0;
			for (var i = 0; i < this.content.length; i++) {
				var item = this.content[i];
				var columnNo = item.x;
				var rowNo = item.y;
				if (columnNo !== undefined && rowNo !== undefined) {
					columnNo--;
					rowNo--;
					if (rowNo > numRows - 1) {
						for (var j = numRows; j <= rowNo; j++) {
							rows[j] = [];
						}
						numRows = rowNo + 1;
					}
					var row = rows[rowNo];
					var numColumns = row.length;
					if (columnNo > numColumns - 1) {
						for (var j = numColumns; j <= columnNo; j++) {
							row[j] = [];
						}
						if (columnNo > maxCol) {
							maxCol = columnNo;
						}
					}
					var cell = row[columnNo];
					cell.push(item);
				}
			}
		}
		this.rows = rows;
		this.maxCol = maxCol;
	}

	TableLayout.prototype.hash = function () {
		var hash = this.x + "$$" +
			this.y + "$$" +
			this.width + "$$";

		if (Array.isArray(this.content)) {
			for (var i = 0; i < this.content.length; i++) {
				var item = this.content[i];
				if (item.elements === undefined) {
					return hash + Math.random();
				} else {
					hash = hash + item.hash() + "$$";
				}
			}
		}

		if (this.drawingOptions !== undefined) {

		}

		return hash;
	};

	TableLayout.prototype.toString = function () {
		return "TableLayout(" + Eden.edenCodeForValues(this.x, this.y, this.width, this.content,
			this.drawingOptions) + ")";
	};

	TableLayout.prototype.draw = function (context, scale, viewName) {
		if (this.elements === undefined && Array.isArray(this.content)) {
			var me = this;

			var tableJQ = $(
				'<table class="canvashtml-item canvashtml-table-layout-item" ' +
					'style="left: ' + this.x + 'px; top: ' + this.y + 'px"' +
				'></table>'
			);

			for (var j = 0; j < this.rows.length; j++) {
				var rowItems = this.rows[j];
				var rowJQ = $('<tr class="canvashtml-table-layout-row"></tr>');
				tableJQ.append(rowJQ);
				var rowLength = rowItems.length;
				for (var i = 0; i < rowLength; i++) {
					var cellJQ = $('<td class="canvashtml-table-layout-cell"></td>');
					rowJQ.append(cellJQ);
					var cellItems = rowItems[i];
					var numItems = cellItems.length;
					for (var k = 0; k < numItems; k++) {
						var item = cellItems[k];
						item.draw(context, scale, viewName);
						cellJQ.append(item.elements);
						if (k != numItems - 1) {
							cellJQ.append('<br/>');
						}
					}
				}
				for (i = rowLength; i <= this.maxCol; i++) {
					rowJQ.append('<td class="canvashtml-table-layout-cell">&nbsp;</td>');
				}
			}

			this.elements = tableJQ;
		}
	}

	TableLayout.prototype.resize = function () {
		var scale = this.cachedScale;
		if (scale === undefined) {
			//Not yet added drawn onto a canvas.
			return;
		}

		var element = this.elements[0];
		var style = element.style;
		var autoWidth = this.width === undefined;

		var agent = root.lookup("TableLayout");
		var widthSymName = this.obsName + "_width";
		var heightSymName = this.obsName + "_height";

		if (autoWidth || widthSymName in root.symbols) {
			root.lookup(widthSymName).assign(element.offsetWidth / scale, eden.root.scope, agent);
		}
		root.lookup(heightSymName).assign(element.offsetHeight / scale, eden.root.scope, agent);
	}

	TableLayout.prototype.scale = function (scale, zoom, origin) {
		if (!Array.isArray(this.content)) {
			return;
		}

		var container = this.elements;
		var containerStyle = container[0].style;
		if (this.width !== undefined) {
			containerStyle.width = Math.round(this.width * scale) + "px";
		}
		containerStyle.left = Math.round((this.x + origin.x) * scale) + "px";
		containerStyle.top =  Math.round((this.y + origin.y) * scale) + "px";

		var children = container.children();
		for (var i = 0; i < this.content.length; i++) {
			var item = this.content[i];
			item.scale(scale, zoom, origin);
		}

		this.cachedScale = scale;
		this.resize();
	}

	TableLayout.prototype.getEdenCode = TableLayout.prototype.toString;

Text = function(text, x, y, size, fillcolour, outlinecolour, options, valign, align) {
	this.text = text;
	this.x = x;
	this.y = y;
	this.size = size;
	this.fillcolour = fillcolour;
	this.outlinecolour = outlinecolour;

	var optionsType = typeof(options);
	var css;

	if (optionsType == "object") {

		this.drawingOptions = options;

		if (options.italic) {
			css = "italic ";
		} else {
			css = "";
		}
		if (options.smallCaps) {
			css = css + "small-caps ";
		}
		if (options.bold) {
			css = css + "bold ";
		}
		if (size !== undefined) {
			css = css + size + "px ";
		} else {
			css = css + edenUI.plugins.Canvas2D.defaultFontSizePx + "px ";
		}
		if (options.fontFace === undefined) {
			css = css + "sans-serif";
		} else {
			css = css + options.fontFace + ", sans-serif";
		}

	} else if (optionsType == "string") {

		this.drawingOptions = {align: align, valign: valign};
		css = options;

	} else {

		this.drawingOptions = {align: "top"};
		if (size !== undefined) {
			css = size + "px sans-serif";
		} else {
			css = edenUI.plugins.Canvas2D.defaultFontSizePx + "px sans-serif";
		}

	}

	if (this.drawingOptions.align == "centre") {
		this.drawingOptions.align = "center";
	}
	if (this.drawingOptions.valign == "baseline") {
		this.drawingOptions.valign = "alphabetic";
	}

	this.css = css;
	this.optionsType = optionsType;
	this.name = edenUI.plugins.Canvas2D.initZoneFromDrawingOpts(options, "Text");
	this.obsName = root.currentObservableName();
}

// RegExp groups: (valign) (align) (style) (size) (font)
Text.cssRegExp = new RegExp(
		"^\\s*(" +
		"?:(top|middle|baseline|alphabetic|ideographic|bottom)?\\s*" + 
		"(\\b(?:left|right|center|centre))?\\s*" +
		"((?:\\bitalic)?\\s*" +
		"(?:\\bsmall-caps)?\\s*" +
		"(?:\\bbold)?)\\s*" +
		"(\\b(?:smaller|larger|(?:\\d+(?:\\.\\d+)?[a-zA-Z%]+)))?\\s*" +
		"(\\b(?:.+,)?\\s*(?:(?:sans-)?serif|monospace|cursive|fantasy))?" +
		")\\s*$"
);

Text.prototype.draw = function (context, scale) {

	if (scale != 1) {
		var inverseScale = 1 / scale;
		if (scale >= 0) {
			context.scale(inverseScale, inverseScale);
		} else {
			context.scale(-inverseScale, inverseScale);
		}
	}
	context.font = this.css;
	if (this.drawingOptions.valign) {
		context.textBaseline = this.drawingOptions.valign;
	} else {
		context.textBaseline = "top";
	}

	var lineWidth;
	if (this.outlinecolour !== undefined) {
		lineWidth = context.lineWidth;
	} else {
		lineWidth = 0;
	}

	var x = (this.x + lineWidth / 2) * scale + 1;
	var y = this.y * scale + 1;

	var align = this.drawingOptions.align;
	if (align) {
		context.textAlign = align;
		if (align == "center") {
			x--;
		}
	}

	if (this.fillcolour !== undefined) {
		edenUI.plugins.Canvas2D.setFillStyle(context, this.fillcolour);
		context.fillText(this.text, x, y);
	}
	if (this.outlinecolour !== undefined) {
		context.lineWidth = lineWidth * scale;
		context.strokeStyle = this.outlinecolour;
		context.strokeText(this.text, x, y);	
	}
};

Text.prototype.isHit = function (context, scale, px, py) {
	var x = this.x + 1 / scale;
	var y = this.y + 1 / scale;
	var width, height;
	
	if (this.width === undefined) {
		var div = document.createElement("div");
		div.innerHTML = this.text;
		div.style.position = 'absolute';
		div.style.top  = '-9999px';
		div.style.font = this.css;
		document.body.appendChild(div);
		this.width = div.offsetWidth;
		this.height = div.offsetHeight;
		document.body.removeChild(div);
	}

	var lineWidth;
	if (this.outlinecolour !== undefined) {
		lineWidth = context.lineWidth;
	} else {
		lineWidth = 0;
	}
	width = this.width / scale + lineWidth;
	height = this.height / scale + lineWidth / 2;

	return px >= x && px < x + width && py >= y && py < y + height;
}

Text.prototype.toString = function() {
	var s = "Text(" + Eden.edenCodeForValues(this.text, this.x, this.y, this.size, this.fillcolour,
		this.outlinecolour);
	var optionsType = this.optionsType;

	if (optionsType == "string") {
		s = s + ", \"";
		if (this.drawingOptions.valign) {
			s = s + this.drawingOptions.valign + " ";
		}
		if (this.drawingOptions.align) {
			s = s + this.drawingOptions.align + " ";
		}
		s = s + this.css + "\")";
	} else if (optionsType == "object") {
		s = s + ", " + Eden.edenCodeForValue(this.drawingOptions) + ")";
	}
	return s;
};

Text.prototype.getEdenCode = Text.prototype.toString;

Text.parseArgs = function () {
	var text = arguments[0];
	var size;
	var css, optionsObj, scale;

	var argsProcessed = 1;
	var arg = arguments[1];
	var argType = typeof(arg);

	if (arg === undefined || argType == "number") {
		size = arg;
		argsProcessed++;
		arg = arguments[argsProcessed];
		argType = typeof(arg);
	}

	if (argType == "string") {

		var match = arg.match(Text.cssRegExp);
		if (match) {
			if (match[3]) {
				// italic, bold, etc.
				css = match[3];
			} else {
				css = "";
			}
			if (match[4]) {
				// size
				css = css + " " + match[4];
			} else if (size !== undefined) {
				css = css + " " + size + "px";
			} else {
				css = css + " 1em";
			}
			if (match[5]) {
				// font family
				css = css + " " + match[5];
			} else {
				css = css + " sans-serif";
			}
		} else {
			css = arg;
		}

		argsProcessed++;
		arg = arguments[argsProcessed];

	} else if (argType == "object") {

		optionsObj = arg;
		if (arg.italic) {
			css = "italic ";
		} else {
			css = "";
		}
		if (arg.smallCaps) {
			css = css + "small-caps ";
		}
		if (arg.bold) {
			css = css + "bold ";
		}
		if (size) {
			css = css + size + "px ";
		} else {
			css = css + "1em ";
		}
		if (arg.fontFace === undefined) {
			css = css + "sans-serif";
		} else {
			css = css + arg.fontFace + ", sans-serif";
		}

		argsProcessed++;
		arg = arguments[argsProcessed];

	} else if (arg === undefined) {

		if (size !== undefined) {
			css = size + "px sans-serif";
		} else {
			css = edenUI.plugins.Canvas2D.defaultFontSizePx + "px sans-serif";
		}

		argsProcessed++;
		arg = arguments[argsProcessed];

	}

	scale = arg;
	if (scale === undefined) {
		scale = 1;
	}

	return [css, optionsObj, scale];
};

Textbox = function (name, x, y, width, height, placeholder, maxlength, enabled) {
	this.name = name;
	this.obsName = root.currentObservableName();
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.placeholder = placeholder;
	this.maxlength = maxlength;
    this.enabled = enabled;
}

Textbox.prototype.hash = function () {
	return this.name+"$$"+
				this.x+"$$"+
				this.y+"$$"+
				this.width+"$$"+
				this.height+"$$"+
				this.placeholder+"$$"+
				this.maxlength+"$$"+
				this.enabled;
};

Textbox.prototype.draw = function(context) {	

	if(this.elements === undefined) {
		var me = this;
		var name = this.name;

		var disabled = this.enabled === false? 'disabled="disabled"' : '';
		var placeholder;
		var maxlength = this.maxlength !== undefined? ' maxlength="' + this.maxlength + '"' : '';
		var jQuery;
		if (this.height === undefined) {
			placeholder = ' placeholder="' +
				(this.placeholder === undefined? name : this.placeholder) + '"';
			jQuery = $('<input type="text" ' + disabled + placeholder + maxlength + ' class="canvashtml-item" />');
		} else {
			// Placeholder text for textarea tag is buggy in IE11, so don't use it by default.
			placeholder = this.placeholder !== undefined && this.placeholder != ""?
				' placeholder="' + this.placeholder + '"' :
				'';
			jQuery = $('<textarea ' + disabled + placeholder + maxlength + ' class="canvashtml-item"></textarea>');
		}

		var element = jQuery.get(0);
		var valueSymbol = root.lookup(name + "_value");
		var value = valueSymbol.value();
		if (value === undefined) {
			valueSymbol.assign("", root.scope, root.lookup("Textbox"));
		} else {
			element.value = value;
		}
		valueSymbol.addJSObserver("updateTextbox", function (obs, value) {
			me.elements[0].value = value;
		});

		jQuery
		.on("input", function(event) {
			root.lookup(name + "_value").assign(event.target.value, root.scope, EdenSymbol.hciAgent, true);
		})
		.on("mousedown", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseDownZone").assign(undefined, root.scope, EdenSymbol.hciAgent, mouseFollow);
		})
		.on("mouseup", function () {
			edenUI.plugins.Canvas2D.endClick();
		})
		.on("mouseenter", function () {
			var mouseFollow = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(name, root.scope, EdenSymbol.hciAgent, mouseFollow);
		});

		this.elements = [element];
  }
};

Textbox.prototype.scale = function (scale, zoom, origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top =  Math.round((this.y + origin.y) * scale) + "px";
	style.width = Math.round(this.width * scale - 6) + "px";
	if (this.height !== undefined) {
		var lineHeight = edenUI.plugins.Canvas2D.defaultLineHeight;
		var rows = Math.floor(Math.round(this.height * scale - 4) / (lineHeight * zoom));	//See css/eden.css
		if (rows == 0) {
			rows = 1;
		}
		style.height = (rows * lineHeight * zoom) + "px";
	}
	style.fontSize = (edenUI.plugins.Canvas2D.defaultFontSizePx * zoom) + "px";
	style.transform = "scale("+zoom+")";
};

Textbox.prototype.toString = function() {
	if (this.name == this.obsName) {
		return "Textbox(" + Eden.edenCodeForValues(this.x, this.y, this.width,
			this.height, this.placeholder, this.enabled) + ")";
	} else {
		return "Textbox(" + Eden.edenCodeForValues(this.name, this.x, this.y, this.width,
			this.height, this.placeholder, this.enabled) + ")";	
	}
};

Textbox.prototype.getEdenCode = Textbox.prototype.toString;

	Translation = function (centreX, centreY, x, y, items) {
		this.centreX = centreX;
		this.centreY = centreY;
		this.x = x;
		this.y = y;
		this.items = items;
	}

	Translation.prototype = new EdenUI.plugins.Canvas2D.Transform;

	Translation.prototype.transform = function (context) {
		context.translate(this.x - this.centreX, this.y - this.centreY);
	}
	
	Translation.prototype.getCSS = function (scale) {
		var x = (this.x - this.centreX) * scale;
		var y = (this.y - this.centreY) * scale;
		return "translate(" + x + "px, " + y + "px)";
	}

	Translation.prototype.inverse = function (x, y) {
		return new Point(x - (this.x - this.centreX), y - (this.y - this.centreY));
	}

	Translation.prototype.toString = function () {
		return "Translate(" + Eden.edenCodeForValues(this.centreX, this.centreY, this.x, this.y, this.items) + ")";
	}

	Translation.prototype.getEdenCode = Translation.prototype.toString;


	

	// Audiovisual = function(name, type, preload) {
	// 	this.name = name;
	// 	this.obsName = root.currentObservableName();
	// 	this.type = type;
	// 	this.preload = preload;
	// 	this.atEnd = false;
		
	// 	Object.defineProperty(this, "duration", {
	// 		enumerable: true,
	// 		get: function () {
	// 			if (this.elements === undefined || !this.elements[0].duration) {
	// 				return 0;
	// 			} else {
	// 				return this.elements[0].duration;
	// 			}
	// 		}
	// 	});
	// }

	// Audiovisual.prototype.hash = function () {
	// 	return this.name;
	// }

	// function getMediaElement(audiovisual) {
	// 	return audiovisual.elements[0];
	// }

	// function loadMedia(audiovisual) {
	// 	var mediaElement = getMediaElement(audiovisual);
	// 	mediaElement.autoplay = !root.lookup(audiovisual.name + "_paused").value();
	// 	if (audiovisual.preload) {
	// 		mediaElement.preload = "auto";
	// 	} else {
	// 		mediaElement.preload = "metadata";
	// 	}
	// 	mediaElement.load();
	// }

	// Audiovisual.prototype.reload = function () {
	// 	var mediaElement = getMediaElement(this);
	// 	var position = mediaElement.currentTime;
	// 	loadMedia(this);
	// 	mediaElement.currentTime = position;
	// };

	// Audiovisual.prototype.unmute = function () {
	// 	getMediaElement(this).muted = false;
	// }

	// Audiovisual.prototype.draw = function (context) {
	// 	if (this.elements === undefined ) {
	// 		var me = this;
	// 		var name = this.name;
	// 		var agent = EdenSymbol.localJSAgent;
	// 		root.beginAutocalcOff();

	// //Create HTML tag

	// 		var mediaElement = document.createElement(this.type.toLowerCase());


	// //Symbols not unique to videos

	// 		var chapterSym = root.lookup(name + "_chapter");
	// 		var chapterMarksSym = root.lookup(name + "_chapters");
	// 		var loopSym = root.lookup(name + "_looping");
	// 		var pausedSym = root.lookup(name + "_paused");
	// 		var positionSym = root.lookup(name + "_position");
	// 		var speedSym = root.lookup(name + "_speed");
	// 		var timeSym = root.lookup(name + "_time");
	// 		var urlSym = root.lookup(name + "_url");
	// 		var volumeSym = root.lookup(name + "_volume");


	// //Chapters

	// 		var chapterMarks, chapterNames, chapterIndex, nextChapterAt;
	// 		var goToChapter = function () {
	// 			var numChapters = chapterMarks.length;
	// 			if (chapterIndex == -1) {
	// 				if (numChapters > 0 && chapterMarks[0] == 0) {
	// 					chapterIndex = 0;
	// 				}
	// 			}
	// 			var chapterName;
	// 			if (chapterIndex == -1) {
	// 				chapterName = "start";
	// 			} else if (chapterIndex == numChapters) {
	// 				chapterName = "end";
	// 				me.atEnd = true;
	// 			} else {
	// 				chapterName = chapterNames[chapterIndex];
	// 			}
	// 			if (chapterName != chapterSym.value()) {
	// 				chapterSym.assign(chapterName, root.scope, EdenSymbol.defaultAgent);
	// 			}
	// 			if (chapterIndex < numChapters - 1) {
	// 				nextChapterAt = chapterMarks[chapterIndex + 1];
	// 			} else {
	// 				nextChapterAt = undefined;
	// 			}
	// 		};
	// 		var setChapters = function (symbol, chapters) {
	// 			chapterMarks = [];
	// 			chapterNames = [];
	// 			chapterIndex = -1;
	// 			nextChapterAt = undefined;
				
	// 			if (chapters instanceof Object) {
	// 				for (var chapterName in chapters) {
	// 					var beginsAt = chapters[chapterName];
	// 					var i = 0;
	// 					while (i < chapterMarks.length) {
	// 						if (beginsAt < chapterMarks[i]) {
	// 							break;
	// 						}
	// 						i++;
	// 					}
	// 					chapterMarks.splice(i, 0, beginsAt);
	// 					chapterNames.splice(i, 0, chapterName);
	// 				}
					
	// 				if (!me.atEnd) {
	// 					var currentPos = timeSym.value();
	// 					while (chapterIndex < chapterMarks.length - 1 &&
	// 					 currentPos >= chapterMarks[chapterIndex + 1]) {
	// 						chapterIndex++;
	// 					}
	// 					goToChapter();
	// 				}
	// 			}
	// 		}; //end of function
	// 		if (chapterMarksSym.value() === undefined && chapterMarksSym.definition === undefined) {
	// 			chapterMarksSym.assign({}, root.scope, EdenSymbol.defaultAgent);
	// 		}
	// 		setChapters(chapterMarksSym, chapterMarksSym.value());
	// 		chapterMarksSym.addJSObserver("setChapters", setChapters);

	// 		chapterSym.addJSObserver("jumpToChapter", function (symbol, value) {
	// 			var currentTime = mediaElement.currentTime;
	// 			var numChapters = chapterMarks.length;
	// 			var newTime;
	// 			if (value == "start") {
	// 				chapterIndex = -1;
	// 				newTime = 0;
	// 			} else if (value == "end") {
	// 				chapterIndex = numChapters;
	// 				newTime = mediaElement.duration;
	// 			} else {
	// 				var found = false;
	// 				for (var i = 0; i < numChapters; i++) {
	// 					if (value == chapterNames[i]) {
	// 						chapterIndex = i;
	// 						newTime = chapterMarks[chapterIndex];
	// 						break;
	// 					}
	// 				}
	// 			}
	// 			if (newTime !== undefined) {
	// 				timeSym.assign(newTime, root.scope, agent);
	// 				mediaElement.currentTime = newTime;
	// 				goToChapter();
	// 			}
	// 		});

	// //Looping

	// 		var initialLooping = loopSym.value();
	// 		if (initialLooping === undefined && loopSym.definition === undefined) {
	// 			loopSym.assign(false, root.scope, EdenSymbol.defaultAgent);
	// 		} else if (initialLooping) {
	// 			mediaElement.loop = true;
	// 		}
	// 		loopSym.addJSObserver("setLooping", function (sym, value) {
	// 			mediaElement.loop = value;
	// 		});


	// //Playback controls

	// 		if (this.type == "Video") {

	// 			var controlsSym = root.lookup(name + "_controls");
	// 			var controls = controlsSym.value();
	// 			if (controls === undefined) {
	// 				if (controlsSym.definition === undefined) {
	// 					controlsSym.assign(true, root.scope, agent);
	// 				} else {
	// 					mediaElement.controls = true;
	// 				}
	// 			} else {
	// 				mediaElement.controls = controls;
	// 			}
	// 			controlsSym.addJSObserver("showHideControls", function (symbol, showControls) {
	// 				mediaElement.controls = showControls;
	// 			});
	// 		} else {
	// 			mediaElement.controls = true;
	// 		}


	// //Position on screen

	// 		mediaElement.className = "canvashtml-item";
	// 		this.cachedOrigin = new Point(0, 0);
	// 		this.cachedScaleFactor = 1;
	// 		var position = positionSym.value();
	// 		if (position === undefined) {
	// 			position = new Point(0, 0);
	// 			positionSym.assign(position, root.scope, EdenSymbol.defaultAgent);
	// 		}
	// 		positionSym.addJSObserver("reposition", function (sym, position) {
	// 			me.doTranslation(position);
	// 		});


	// //Size

	// 		this.cachedZoom = 1;
	// 		if (this.type == "Video") {
	// 			var sizeSym = root.lookup(name + "_size");
	// 			var scaleSym = root.lookup(name + "_scale");
	// 			var size = sizeSym.value();
	// 			sizeSym.addJSObserver("resize", function (symbol, size) {
	// 				var scale = scaleSym.value();
	// 				if (scale !== undefined) {
	// 					me.doScaling(size, scale);
	// 				}
	// 			});
	// 			scaleSym.addJSObserver("resize", function (symbol, scale) {
	// 				if (scale !== undefined) {
	// 					me.doScaling(sizeSym.value(), scale);
	// 				}
	// 			});
	// 			mediaElement.addEventListener("loadedmetadata", function (event) {
	// 				if (sizeSym.value() === undefined) {
	// 					root.beginAutocalcOff();
	// 					scaleSym.assign(1, root.scope, agent);
	// 					sizeSym.assign(new Point(mediaElement.videoWidth, root.scope, mediaElement.videoHeight), agent);
	// 					root.endAutocalcOff();
	// 				}
	// 			});

	// 		} else {
			
	// 		}


	// //Paused or playing

	// 		var beginPaused = pausedSym.value();
	// 		if (beginPaused === undefined && pausedSym.definition === undefined) {
	// 			pausedSym.assign(true, root.scope, agent);
	// 		} else if (beginPaused == false) {
	// 			mediaElement.autoplay = true;
	// 		}
	// 		pausedSym.addJSObserver("pausePlay", function (symbol, pause) {
	// 			if (pause) {
	// 				mediaElement.pause();
	// 			} else {
	// 				me.atEnd = false;
	// 				mediaElement.play();
	// 			}
	// 		});
	// 		mediaElement.addEventListener("pause", function (event) {
	// 			if (pausedSym.definition === undefined && pausedSym.value() != true) {
	// 				pausedSym.assign(true, root.scope, agent);
	// 			}
	// 		});
	// 		mediaElement.addEventListener("playing", function (event) {
	// 			if (pausedSym.definition === undefined  && pausedSym.value() != false) {
	// 				pausedSym.assign(false, root.scope, agent);
	// 			}
	// 			if (speedSym.value() == 0) {
	// 				mediaElement.defaultPlaybackRate = 1;
	// 				mediaElement.playbackRate = 1;
	// 			}
	// 		});


	// //Seeking and time moving forward

	// 		var time = timeSym.value();
	// 		if (time !== undefined) {
	// 			mediaElement.currentTime = parseFloat(time);
	// 		} else if (timeSym.definition === undefined) {
	// 			timeSym.assign(0, root.scope, EdenSymbol.defaultAgent);
	// 		}

	// 		function findChapter() {
	// 			var oldChapterIndex  = chapterIndex;
	// 			var numChapters = chapterMarks.length;
	// 			if (me.atEnd) {
	// 				//Seeked to the end (and not looping)
	// 				chapterIndex = numChapters;
	// 			} else {
	// 				var currentTime = mediaElement.currentTime;
	// 				if (nextChapterAt !== undefined && currentTime >= nextChapterAt) {
	// 					//Seeking forward
	// 					while (chapterIndex < numChapters - 1 && currentTime >= chapterMarks[chapterIndex + 1]) {
	// 						chapterIndex++;
	// 					}
	// 				} else {
	// 					//Seeking backward
	// 					if (chapterIndex == numChapters) {
	// 						chapterIndex--;
	// 					}
	// 					while (chapterIndex >= 0 && chapterMarks[chapterIndex] > currentTime) {
	// 						chapterIndex--;
	// 					}
	// 				}
	// 			}

	// 			if (chapterIndex != oldChapterIndex) {
	// 				goToChapter();
	// 			}
	// 		}

	// 		timeSym.addJSObserver("seek", function (symbol, seconds) {
	// 			if (symbol.origin !== EdenSymbol.localJSAgent) {
	// 				mediaElement.currentTime = seconds;
	// 			}
	// 		});
	// 		mediaElement.addEventListener("timeupdate", function (event) {
	// 			if (mediaElement.paused) {
	// 				return;
	// 			}
	// 			var currentTime = mediaElement.currentTime;
	// 			var newTimeIndex = Math.floor(currentTime);
	// 			if (newTimeIndex != me.timeIndex) {
	// 				timeSym.assign(newTimeIndex, root.scope, EdenSymbol.localJSAgent);
	// 				me.timeIndex = newTimeIndex;					
	// 			}
	// 			if (nextChapterAt !== undefined && currentTime >= nextChapterAt) {
	// 				chapterIndex++;
	// 				chapterSym.assign(chapterNames[chapterIndex], root.scope, agent);
	// 				if (chapterIndex < chapterMarks.length - 1) {
	// 					nextChapterAt = chapterMarks[chapterIndex]
	// 				} else {
	// 					nextChapterAt = undefined;
	// 				}
	// 			}
	// 		});
	// 		mediaElement.addEventListener("ended", function (event) {
	// 			timeSym.assign(mediaElement.duration, root.scope, EdenSymbol.localJSAgent);
	// 			chapterIndex = chapterMarks.length;
	// 			goToChapter();
	// 		});
	// 		mediaElement.addEventListener("seeking", function (event) {
	// 			var currentTime = mediaElement.currentTime;
	// 			if (timeSym.value() !== currentTime) {
	// 				timeSym.assign(currentTime, root.scope, EdenSymbol.localJSAgent);
	// 			}
	// 			me.atEnd = currentTime == mediaElement.duration;
	// 			findChapter();
	// 		});
	// 		mediaElement.addEventListener("seeked", function (event) {
	// 			var isPaused = pausedSym.value();
	// 			me.timeIndex = Math.floor(mediaElement.currentTime);
	// 			if (!isPaused) {
	// 				mediaElement.play();
	// 			}
	// 		});


	// //Playback speed

	// 		var speedResetOnLoad;
	// 		var speed = speedSym.value();
	// 		if (speed === undefined) {
	// 			speedSym.assign(1, root.scope, EdenSymbol.defaultAgent);
	// 		} else if (speed > 0) {
	// 			mediaElement.defaultPlaybackRate = speed;
	// 		}
	// 		speedSym.addJSObserver("changePlaybackSpeed", function (symbol, speed) {
	// 			if (mediaElement.playbackRate != speed) {
	// 				if (speed > 0) {
	// 					mediaElement.defaultPlaybackRate = speed;
	// 				} else {
	// 					mediaElement.defaultPlaybackRate = 1;					
	// 				}
	// 				mediaElement.playbackRate = speed;
	// 			}
	// 		});
	// 		mediaElement.addEventListener("ratechange", function (event) {
	// 			root.beginAutocalcOff();
	// 			var speed = mediaElement.playbackRate;
	// 			if (speedSym.definition === undefined) {
	// 				speedSym.assign(speed, root.scope, agent);
	// 			}
	// 			if (speed == 0) {
	// 				mediaElement.pause();
	// 			} else if (!pausedSym.value()) {
	// 				mediaElement.play();
	// 			}
	// 			root.endAutocalcOff();
	// 		});


	// //Volume

	// 		var volume = volumeSym.value();
	// 		if (volume === undefined) {
	// 			volumeSym.assign(1, root.scope, EdenSymbol.defaultAgent);
	// 		} else if (volume == 0) {
	// 			mediaElement.muted = true;
	// 		} else {
	// 			mediaElement.volume = volume;			
	// 		}
	// 		this.volumeChanging = false;
	// 		volumeSym.addJSObserver("adjustVolume", function (symbol, volume) {
	// 			if (!me.volumeChanging) {
	// 				me.volumeChanging = true;
	// 				if (symbol.definition === undefined) {
	// 					if (volume == 0) {
	// 						mediaElement.muted = true;
	// 					} else {
	// 						mediaElement.muted = false;
	// 						mediaElement.volume = volume;
	// 					}
	// 				} else {
	// 					mediaElement.volume = volume;
	// 				}
	// 				me.volumeChanging = false;
	// 			}

	// 		});
	// 		mediaElement.addEventListener("volumechange", function (event) {
	// 			if (!me.volumeChanging) {
	// 				me.volumeChanging = true;
	// 				var oldVolume = volumeSym.value();
	// 				var newVolume = mediaElement.volume;
	// 				if (mediaElement.muted) {
	// 					if (volumeSym.definition === undefined) {
	// 						volumeSym.assign(0, root.scope, agent);
	// 					}
	// 				} else if (oldVolume != newVolume) {
	// 					if (volumeSym.definition === undefined) {
	// 						volumeSym.assign(newVolume, root.scope, agent);
	// 					} else {
	// 						mediaElement.volume = oldVolume;
	// 					}
	// 				}
	// 				me.volumeChanging = false;
	// 			}
	// 		});

	// //Loading a video file

	// 		var url = urlSym.value();
	// 		if (url !== undefined) {
	// 			if (this.preload) {
	// 				mediaElement.preload  = "auto";
	// 			} else {
	// 				mediaElement.preload = "metadata";
	// 			}
	// 			mediaElement.src = url;
	// 		}
	// 		urlSym.addJSObserver("newVideo", function (symbol, url) {
	// 			if (url != mediaElement.src) {
	// 				timeSym.assign(0, root.scope, agent);
	// 				me.timeIndex = 0;
	// 				chapterIndex = -1;
	// 				goToChapter();
	// 				mediaElement.src = url;
	// 				loadMedia(me);
	// 			}
	// 		});


	// //Mouse Zones

	// 	if (this.type == "Video") {
	// 		mediaElement.onmousedown = function (event) {
	// 			var mouseFollow = root.lookup("mouseFollow").value();
	// 			root.lookup("mouseDownZone").assign(me.name, root.scope, EdenSymbol.hciAgent, mouseFollow);
	// 		};
	// 		mediaElement.onmouseup = function (event) {
	// 			edenUI.plugins.Canvas2D.endClick();
	// 		};
	// 		edenUI.plugins.Canvas2D.initZoneFromName(this.name, this.type)
	// 	}
	// 	mediaElement.onmouseenter = function (event) {
	// 		var mouseFollow = root.lookup("mouseFollow").value();
	// 		root.lookup("mouseZone").assign(me.name, root.scope, EdenSymbol.hciAgent, mouseFollow);
	// 	};


	// //Finalize creation

	// 		this.elements = [mediaElement];
	// 		root.endAutocalcOff();
	// 	}
	// }

	// Audiovisual.prototype.scale = function (scale, zoom , origin) {
	// 	this.cachedScaleFactor = scale;
	// 	this.cachedOrigin = origin;

	// 	var name = this.name;
	// 	var position = root.lookup(name + "_position").value();
	// 	this.doTranslation(position);

	// 	if (this.type == "Video") {
	// 		this.cachedZoom = zoom;
	// 		var scaleSym = root.lookup(name + "_scale");
	// 		var videoScale = scaleSym.value();

	// 		if (videoScale === undefined) {
	// 			videoScale = scale / zoom;
	// 			scaleSym.assign(videoScale, root.scope, root.lookup(this.type));
	// 		} else {
	// 			var size = root.lookup(name + "_size").value();
	// 			this.doScaling(size, videoScale);
	// 		}
	// 	}
	// }

	// Audiovisual.prototype.doScaling = function (size, scale) {
	// 	if (size instanceof Point) {
	// 		var element = this.elements[0];
	// 		var scaleFactor = this.cachedZoom * scale;
	// 		element.width = size.x * scaleFactor;
	// 		element.height = size.y * scaleFactor;
	// 	}
	// }

	// Audiovisual.prototype.doTranslation = function (position) {
	// 	if (position instanceof Point) {
	// 		var style = this.elements[0].style;
	// 		var origin = this.cachedOrigin;
	// 		var scaleFactor = this.cachedScaleFactor;
	// 		style.left = ((origin.x + position.x) * scaleFactor) + "px";
	// 		style.top = ((origin.y + position.y) * scaleFactor) + "px";
	// 	}
	// }

	// Audiovisual.prototype.toString = function () {
	// 	if (this.name == this.obsName) {
	// 		return this.type + "(" + Eden.edenCodeForValues(this.preload) + ")";
	// 	} else {
	// 		return this.type + "(" + Eden.edenCodeForValues(this.name, this.preload) + ")";		
	// 	}
	// }
	
	// Audiovisual.prototype.getEdenCode = Audiovisual.prototype.toString;

	// //Create an observable for background sounds.
	// var backgroundAudioSym = root.lookup("background_audio");
	// var backgroundAudioPausedSym = root.lookup("background_audio_paused");
	// if (backgroundAudioPausedSym.value() === undefined && backgroundAudioPausedSym.definition === undefined) {
	// 	backgroundAudioPausedSym.assign(false, root.scope, EdenSymbol.defaultAgent);
	// }
	// var backgroundAudio = new Audiovisual("background_audio", "Audio", true);
	// backgroundAudioSym.assign(backgroundAudio, root.scope,EdenSymbol.defaultAgent);
	// backgroundAudio.draw();
	// backgroundAudioSym.addJSObserver("initialize", function (sym, value) {
	// 	if (value instanceof Audiovisual) {
	// 		value.draw();
	// 	}
	// });


View = function (name, type, x, y, width, height) {
	this.type = type;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.name = name;
}

View.prototype.hash = function () {
	return this.x+"$$"+
		this.y+"$$"+
		this.width+"$$"+
		this.height+"$$"+
		this.type+"$$"+
		this.name+"$$";
};

View.prototype.draw = function(context) {

  if (this.elements === undefined) {
	var me = this;

	var divElement = edenUI.createEmbedded(this.name, this.type).contents.get(0);
	divElement.className += " canvashtml-item canvashtml-div-item";

	/*document.createElement("div");
	if (this.name !== undefined) {
		divElement.id = this.name;
	}

	divElement.addEventListener("click", function(event) {
		var script = event.target.getAttribute("data-jseden");
		if (script !== null && script != "") {
			eden.execute2(script);
		}
	});*/

	//Create object properties that record the automatically generated width and/or height.
	if (this.width === undefined || this.name !== undefined) {
		var objectElement = document.createElement("object");
		objectElement.setAttribute("style", "display: block; position: absolute; top: 0px; left: 0px; " + 
			"height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;");

		objectElement.onload = function () {
			me.resize();
		}

		objectElement.type = "text/html";
		objectElement.data = "about:blank";
		divElement.appendChild(objectElement);
	}

	this.elements = [divElement];
  }
};

View.prototype.resize = function () {
	var scale = this.cachedScale;
	if (scale === undefined) {
		//Not yet added drawn onto a canvas.
		return;
	}

	var element = this.elements[0];
	var style = element.style;
	//style.transform = "scale("+scale+")";
	var autoWidth = this.width === undefined;
	var autoHeight = this.height === undefined;

	/*if (autoWidth) {
		var savedHeight = style.height;
		style.width = "auto";
		style.height = "auto";
		var contentWidth = element.clientWidth;
		style.width = contentWidth + "px";
		style.height = savedHeight;
		var scrollBarSize = element.offsetWidth - element.clientWidth;
		if (scrollBarSize > 0) {
			scrollBarSize = scrollBarSize + 2;
			style.width = String(contentWidth + scrollBarSize) + "px";
		} else {
			style.width = "auto";
		}
	}*/

	if (this.name !== undefined) {
		var agent = root.lookup("Div");
		var widthSymName = this.name + "_width";
		var heightSymName = this.name + "_height";

		if (autoWidth || widthSymName in eden.root.symbols) {
			root.lookup(widthSymName).assign(element.offsetWidth / scale, root.scope, agent);
		}
		if (autoHeight || heightSymName in eden.root.symbols) {
			root.lookup(heightSymName).assign(element.offsetHeight / scale, root.scope, agent);
		}
	}
}

View.prototype.scale = function (scale, zoom , origin) {
	var style = this.elements[0].style;
	style.left = Math.round((this.x + origin.x) * scale) + "px";
	style.top = Math.round((this.y + origin.y) * scale) + "px";

	if (this.width !== undefined) {
		style.width = Math.round(this.width) + "px";
	}
	if (this.height !== undefined) {
		style.height = Math.round(this.height) + "px";
	}
	/*if (this.fontSizeSpecified) {
		style.fontSize = String(this.fontSizeNumber * zoom) + this.fontSizeUnits;
	} else {
		if (zoom == 1) {
			style.fontSize = ""; //Could be specified by a CSS class.
		} else {
			style.fontSize = zoom + "em";
		}
	}*/
	if (scale != this.cachedScale) {
		style.transform = "scale("+scale+")";
		this.transformCSS = "scale("+scale+")";
	}
	this.cachedScale = scale;
	this.resize();
};

View.prototype.toString = function() {
	return this.getEdenCode();
};

View.prototype.getEdenCode = function () {
	var s = "View(" + Eden.edenCodeForValues(this.name, this.type, this.x, this.y, this.width, this.height)+")";
	return s;
};
