/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

//To catch when a mouse button is pressed down over a canvas window and then released outside of any
//canvas window.
document.addEventListener("mouseup", function (e) {
	var followMouse = root.lookup("mouseFollow").value();
	var mouseButtonsSym = root.lookup("mouseButtons");
	var buttonsDown = EdenUI.plugins.CanvasHTML5.mouseButtonsDown;
	var autocalcSym = root.lookup("autocalc");
	var autocalcBeforeEvent = buttonsDown.autocalc;
	if (autocalcBeforeEvent === undefined) {
		autocalcBeforeEvent = autocalcSym.value();
		autocalcSym.assign(0);
	} else {
		buttonsDown.autocalc = undefined;
	}

	if (e.button == 0) {
		if (followMouse) {
			root.lookup('mousePressed').netAssign(false);
		} else {
			root.lookup('mousePressed').assign(false);
		}
	}

	//If the mouse pointer is inside a canvas window then buttonsDown.count has already been
	//calculated inside the canvas mouse up event listener, hence it may be when we reach zero here.
	if (buttonsDown.count > 0) {
		var buttonName;
		switch (e.button) {
			case 0:
				buttonsDown.left = false;
				buttonName = "Left";
				break;
			case 1:
				buttonsDown.middle = false;
				buttonName = "Middle";
				break;
			case 2:
				buttonsDown.right = false;
				buttonName = "Right";
				break;
			case 3:
				buttonsDown.button4 = false;
				buttonName = "Button4";
				break;
			case 4:
				buttonsDown.button5 = false;
				buttonName = "Button5";
				break;
			default:
				buttonName = "Unknown";
		}
		buttonsDown.count = buttonsDown.left + buttonsDown.middle + buttonsDown.right + buttonsDown.button4 + buttonsDown.button5;
		if (buttonsDown.count == 0) {
			//Final button released outside of any canvas window.
			if (followMouse) {
				root.lookup("mouseButtonChange").netAssign(buttonName + " up");
				root.lookup('mousePosition').netAssign(undefined);
				root.lookup('mouseUp').netAssign(undefined);
				root.lookup('mouseWindow').netAssign(undefined);
			} else {
				root.lookup("mouseButtonChange").assign(buttonName + " up");
				root.lookup('mousePosition').assign(undefined);
				root.lookup('mouseUp').assign(undefined);
				root.lookup('mouseWindow').assign(undefined);
			}
		}
	}

	var buttonsStr = "|";
	if (buttonsDown.left) {
		buttonsStr = buttonsStr + "Left|";
	}
	if (buttonsDown.middle) {
		buttonsStr = buttonsStr + "Middle|";
	}
	if (buttonsDown.right) {
		buttonsStr = buttonsStr + "Right|";
	}
	if (buttonsDown.button4) {
		buttonsStr = buttonsStr + "Button4|";
	}
	if (buttonsDown.button5) {
		buttonsStr = buttonsStr + "Button5|";
	}
	if (buttonsStr == "|") {
		buttonsStr = "";
	}

	if (followMouse) {
		mouseButtonsSym.netAssign(buttonsStr);
	} else {
		mouseButtonsSym.assign(buttonsStr);
	}
	autocalcSym.assign(autocalcBeforeEvent);
});

/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class CanvasHTML5 Plugin
 */

EdenUI.plugins.CanvasHTML5 = function (edenUI, success) {
	var me = this;

	var cleanupCanvas = function (canvasElement, previousElements, nextElements) {
		var hash;
		for (hash in previousElements) {
			if (hash in nextElements || !previousElements[hash].togarbage) {
				continue;
			}
			canvasElement.removeChild(previousElements[hash]);
		}
	};

	canvases = {};
	contents = {};
	var canvasNameToElements = {};

	this.delay = 40;

	this.drawPicture = function(canvasname, pictureobs) {

		if (!canvasNameToElements[canvasname]) {
			canvasNameToElements[canvasname] = {};
		}

		var previousElements = canvasNameToElements[canvasname];
		var nextElements = {};

		var canvas = canvases[canvasname];

		if (canvas === undefined) {
			//Need to make the canvas view first
			edenUI.createView(canvasname,"CanvasHTML5");
			
			canvases[canvasname] = $("#"+canvasname+"-dialog-canvas")[0];
			contents[canvasname] = $("#"+canvasname+"-dialog-canvascontent")[0];
			canvas = canvases[canvasname];
			canvas.drawing = false;			
		}
	
		if (!canvas.drawing){

			canvas.drawing = true;
			setTimeout(function (){
		
			var picture = root.lookup(pictureobs).value();

		    var context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);
			
		    var content = contents[canvasname];

			var hash;
			for (hash in previousElements) {
				previousElements[hash].togarbage = true;
			}

			if (picture === undefined) { return; }

			for (var i = 0; i < picture.length; i++) {

				if (picture[i] === undefined) { continue; }

				var elHash = picture[i].hash && picture[i].hash();
				var existingEl = elHash && previousElements[elHash];

				if (existingEl) {
					// if already existing hash, no need to draw, just set the element
					picture[i].element = existingEl;
				} else {
					context.save();
					EdenUI.plugins.CanvasHTML5.configureContext(context, picture[i].drawingOptions);
					// expect draw() method to set .element
					picture[i].draw(context, content, pictureobs);
					context.restore();
				}

				var htmlEl = picture[i].element;
				if (htmlEl) { htmlEl.togarbage = false; }
				if (htmlEl && !existingEl) {
					$(content).append(htmlEl);
				}

				if (htmlEl) {
					nextElements[elHash] = htmlEl;
				}
			}
			cleanupCanvas(content, previousElements, nextElements);
			canvasNameToElements[canvasname] = nextElements;
			canvas.drawing = false;
		}, me.delay);
		}
	};

	this.createDialog = function(name,mtitle) {

		code_entry = $('<div id=\"'+name+'-canvascontent\" class=\"canvashtml-content\"></div>');
		code_entry.html("<canvas class=\"canvashtml-canvas\" id=\""+name+"-canvas\" width=\"550px\" height=\"380px\"></canvas>");
		//Remove -dialog name suffix.
		var displayedName = name.slice(0, -7);
		code_entry.find(".canvashtml-canvas").on("mousedown", function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			var mouseButtonsSym = root.lookup("mouseButtons");
			var buttonsDown = EdenUI.plugins.CanvasHTML5.mouseButtonsDown;
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);
			var buttonName;
			
			if (e.buttons !== undefined && e.buttons != 0) {
				/*
				 * As of 3/2/2015 Chrome doesn't support this method of checking and Firefox has
				 * issues with OS X and with buttons 4 and 5 on Linux & Windows.  However, this
				 * property (where available) captures the case of pressing one mouse button down
				 * when outside of any canvas window and then moving the pointer inside a canvas
				 * window and then finally pressing another button down.
				 */
				buttonsDown.left = ((e.buttons & 1) == 1);
				buttonsDown.middle = ((e.buttons & 4) == 4);
				buttonsDown.right = ((e.buttons & 2) == 2);
				if (e.buttons & 8) {
					buttonsDown.button4 = true;
				}
				if (e.buttons & 16) {
					buttonsDown.button5 = true;
				}
			}
			switch (e.button) {
				case 0:
					buttonsDown.left = true;
					if (followMouse) {
						root.lookup('mousePressed').netAssign(true);
					} else {
						root.lookup('mousePressed').assign(true);					
					}
					buttonName = "Left";
					break;
				case 1:
					buttonsDown.middle = true;
					buttonName = "Middle";
					break;
				case 2:
					buttonsDown.right = true;
					buttonName = "Right";
					break;
				case 3:
					buttonsDown.button4 = true;
					buttonName = "Button4";
					break;
				case 4:
					buttonsDown.button5 = true;
					buttonName = "Button5";
					break;
				default:
					buttonName = "Unknown";
			}
			buttonsDown.count = buttonsDown.left + buttonsDown.middle + buttonsDown.right + buttonsDown.button4 + buttonsDown.button5;
			var buttonsStr = "|";
			if (buttonsDown.left) {
				buttonsStr = buttonsStr + "Left|";
			}
			if (buttonsDown.middle) {
				buttonsStr = buttonsStr + "Middle|";
			}
			if (buttonsDown.right) {
				buttonsStr = buttonsStr + "Right|";
			}
			if (buttonsDown.button4) {
				buttonsStr = buttonsStr + "Button4|";
			}
			if (buttonsDown.button5) {
				buttonsStr = buttonsStr + "Button5|";
			}

			if (followMouse) {
				mouseButtonsSym.netAssign(buttonsStr);
				root.lookup("mouseButtonChange").netAssign(buttonName + " down");
			} else {
				mouseButtonsSym.assign(buttonsStr);
				root.lookup("mouseButtonChange").assign(buttonName + " down");
			}

			if (buttonsDown.count == 1) {
				var mousePos = root.lookup('Point').value().call(this, e.clientX, e.clientY);
				if (followMouse) {
					root.lookup('mouseDownWindow').netAssign(displayedName);
					root.lookup('mouseDown').netAssign(mousePos);				
				} else {
					root.lookup('mouseDownWindow').assign(displayedName);
					root.lookup('mouseDown').assign(mousePos);
				}
			}
			autocalcSym.assign(autocalcValueOnEntry);

		}).on("mouseup",function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			//The only reason we compute which mouse buttons are pressed here is to check if we need
			//to update the mouseUp and mouseButtonUp observables.  Updates to the other observables
			//are done inside the document mouse up event handler.
			var buttonsDown = EdenUI.plugins.CanvasHTML5.mouseButtonsDown;
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);
			buttonsDown.autocalc = autocalcValueOnEntry; //To be restored in document mouse up handler
			var buttonName;

			switch (e.button) {
				case 0:
					buttonsDown.left = false;
					buttonName = "Left";
					break;
				case 1:
					buttonsDown.middle = false;
					buttonName = "Middle";
					break;
				case 2:
					buttonsDown.right = false;
					buttonName = "Right";
					break;
				case 3:
					buttonsDown.button4 = false;
					buttonName = "Button4";
					break;
				case 4:
					buttonsDown.button5 = false;
					buttonName = "Button5";
					break;
				default:
					buttonName = "Unknown";
			}
			buttonsDown.count = buttonsDown.left + buttonsDown.middle + buttonsDown.right + buttonsDown.button4 + buttonsDown.button5;

			if (followMouse) {
				root.lookup("mouseButtonChange").netAssign(buttonName + " up");
			} else {
				root.lookup("mouseButtonChange").assign(buttonName + " up");
			}
			
			if (buttonsDown.count == 0) {
				var mousePos = root.lookup('Point').value().call(this, e.clientX, e.clientY);
				if (followMouse) {
					root.lookup('mouseUp').netAssign(mousePos);
				} else {
					root.lookup('mouseUp').assign(mousePos);
				}
			}

		}).on("contextmenu", function (e) {
			if (!root.lookup("mouseContextMenuEnabled").value()) {
				e.preventDefault();
				e.stopPropagation();
			}
			
		}).on("dblclick", function (e) {
			var followMouse = root.lookup("mouseFollow").value();
			var dblClickSym = root.lookup("mouseDoubleClicks");
			var numClicks = dblClickSym.value();

			if (followMouse) {
				dblClickSym.netAssign(numClicks + 1);
			} else {
				dblClickSym.assign(numClicks + 1);
			}
		
		}).on("wheel", function (e) {
			if (!e.ctrlKey) {
				e.preventDefault();
				e.stopPropagation();
				var followMouse = root.lookup("mouseFollow").value();
				var e2 = e.originalEvent;
				if (e2.deltaY !== 0) {
					var mouseWheelSym = root.lookup("mouseWheel");
					var mouseWheelValue = mouseWheelSym.value();
					if (e2.deltaY < 0) {
						mouseWheelValue--;
					} else {
						mouseWheelValue++;
					}
					if (followMouse) {
						mouseWheelSym.netAssign(mouseWheelValue);
					} else {
						mouseWheelSym.assign(mouseWheelValue);
					}
				}
				if (e2.deltaX !== 0) {
					var touchScrollXSym = root.lookup("touchScrollX");
					var touchScrollXValue = touchScrollXSym.value();
					if (e2.deltaX < 0) {
						touchScrollXValue--;
					} else {
						touchScrollXValue++;
					}
					if (followMouse) {
						touchScrollXSym.netAssign(touchScrollXValue);
					} else {
						touchScrollXSym.assign(touchScrollXValue);
					}
				}
			}

		}).on("mousemove",function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			var mousePos = root.lookup('Point').value().call(this, e.clientX, e.clientY);
			if (followMouse) {
				root.lookup('mouseWindow').netAssign(displayedName);
				root.lookup('mousePosition').netAssign(mousePos);
			} else {
				root.lookup('mouseWindow').assign(displayedName);
				root.lookup('mousePosition').assign(mousePos);
			}

		});

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				resizeStop: function(event,ui) {
					$("#"+name+"-canvas").attr("width", (ui.size.width-50)+"px").attr("height", (ui.size.height-70)+"px");

					// Now need to redraw the canvas.
					edenUI.eden.execute("_update_" + displayedName + "();");
				},
			});
	}

	//Supported canvas views
	edenUI.views["CanvasHTML5"] = {dialog: this.createDialog, title: "Canvas HTML5"};

	edenUI.eden.include("plugins/canvas-html5/canvas.js-e", success);
};

EdenUI.plugins.CanvasHTML5.mouseButtonsDown = {left: false, middle: false, right: false, button4: false, button5: false, count: 0};

EdenUI.plugins.CanvasHTML5.configureContext = function (context, options) {
	if (options === undefined) {
		return;
	}
		
	if ("dashes" in options) {
		context.setLineDash(options.dashes);
		if ("dashOffset" in options) {
			context.lineDashOffset = options.dashOffset;
		}
	}

	if ("lineWidth" in options) {
		context.lineWidth = options.lineWidth;
	}
	
	if ("shadow" in options) {
		context.shadowColor = options.shadow.colour;
		context.shadowBlur = options.shadow.blur;
		context.shadowOffsetX = options.shadow.xOffset;
		context.shadowOffsetY = options.shadow.yOffset;
	}
}

EdenUI.plugins.CanvasHTML5.FillStyle = function () {
	//Abstract superclass.
}

EdenUI.plugins.CanvasHTML5.setFillStyle = function (context, style) {
	if (style instanceof EdenUI.plugins.CanvasHTML5.FillStyle) {
		context.fillStyle = style.getColour(context);
	} else {
		context.fillStyle = style;
	}
};

EdenUI.plugins.CanvasHTML5.title = "Canvas HTML5";
EdenUI.plugins.CanvasHTML5.description = "Provides an Eden drawable HTML5 canvas";
EdenUI.plugins.CanvasHTML5.author = "Nicolas Pope et. al.";
