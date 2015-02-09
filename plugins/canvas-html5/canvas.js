/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

//To catch when a mouse button is pressed down over a canvas window and then released outside of any
//canvas window.
document.addEventListener("mouseup", function (e) {
	var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
	if (!mouseInfo.insideCanvas) {
		var buttonName;
		switch (e.button) {
			case 0:
				mouseInfo.leftButton = false;
				buttonName = "Left";
				break;
			case 1:
				mouseInfo.middleButton = false;
				buttonName = "Middle";
				break;
			case 2:
				mouseInfo.rightButton = false;
				buttonName = "Right";
				break;
			case 3:
				mouseInfo.button4 = false;
				buttonName = "Button4";
				break;
			case 4:
				mouseInfo.button5 = false;
				buttonName = "Button5";
				break;
			default:
				buttonName = "Unknown";
		}
		mouseInfo.buttonCount = mouseInfo.leftButton + mouseInfo.middleButton + mouseInfo.rightButton + mouseInfo.button4 + mouseInfo.button5;
		var followMouse = root.lookup("mouseFollow").value();
		var buttonsSym = root.lookup("mouseButtons");
		if (mouseInfo.buttonCount == 0 && buttonsSym.value() != "") {
			//Final button released outside of any canvas window.
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);

			var mousePressedSym = root.lookup("mousePressed");
			var mousePressed = mousePressedSym.value();

			if (followMouse) {
				root.lookup("mouseButton").netAssign(buttonName + " up");
				buttonsSym.netAssign("");
				root.lookup('mousePosition').netAssign(undefined);
				if (mousePressed) {
					mousePressedSym.netAssign(false);
				}
				root.lookup('mouseUp').netAssign(undefined);
				root.lookup('mouseWindow').netAssign(undefined);
			} else {
				root.lookup("mouseButton").assign(buttonName + " up");
				buttonsSym.assign("");
				root.lookup('mousePosition').assign(undefined);
				if (mousePressed) {
					mousePressedSym.assign(false);
				}
				root.lookup('mouseUp').assign(undefined);
				root.lookup('mouseWindow').assign(undefined);
			}
			autocalcSym.assign(autocalcValueOnEntry);
		}
	}

});

document.addEventListener("mousedown", function (e) {
	var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
	if (!mouseInfo.insideCanvas) {
		var buttonName;
		switch (e.button) {
			case 0:
				mouseInfo.leftButton = true;
				break;
			case 1:
				mouseInfo.middleButton = true;
				break;
			case 2:
				mouseInfo.rightButton = true;
				break;
			case 3:
				mouseInfo.button4 = true;
				break;
			case 4:
				mouseInfo.button5 = true;
				break;
		}
		mouseInfo.buttonCount = mouseInfo.leftButton + mouseInfo.middleButton + mouseInfo.rightButton + mouseInfo.button4 + mouseInfo.button5;;
	}
});

document.addEventListener("pointerlockchange", function (e) {
	var locked = document.pointerLockElement !== null;
	EdenUI.plugins.CanvasHTML5.mouseInfo.capturing = locked;
	var followMouse = root.lookup("mouseFollow").value();
	if (followMouse) {
		root.lookup("mouseCaptured").netAssign(locked);
	} else {
		root.lookup("mouseCaptured").assign(locked);			
	}
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

			if (Array.isArray(picture)) {

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
			} //end if picture observable is undefined.
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
		var jqCanvas = code_entry.find(".canvashtml-canvas");
		jqCanvas.on("mousedown", function(e) {
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);

			var followMouse = root.lookup("mouseFollow").value();
			var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;			
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = true;
					if (followMouse) {
						root.lookup('mousePressed').netAssign(true);
					} else {
						root.lookup('mousePressed').assign(true);
					}
					buttonName = "Left";
					break;
				case 1:
					mouseInfo.middleButton = true;
					buttonName = "Middle";
					break;
				case 2:
					mouseInfo.rightButton = true;
					buttonName = "Right";
					break;
				case 3:
					mouseInfo.button4 = true;
					buttonName = "Button4";
					break;
				case 4:
					mouseInfo.button5 = true;
					buttonName = "Button5";
					break;
				default:
					buttonName = "Unknown";
			}
			mouseInfo.buttonCount = mouseInfo.leftButton + mouseInfo.middleButton + mouseInfo.rightButton + mouseInfo.button4 + mouseInfo.button5;;
			var buttonsStr = "|";
			if (mouseInfo.leftButton) {
				buttonsStr = buttonsStr + "Left|";
			}
			if (mouseInfo.middleButton) {
				buttonsStr = buttonsStr + "Middle|";
			}
			if (mouseInfo.rightButton) {
				buttonsStr = buttonsStr + "Right|";
			}
			if (mouseInfo.button4) {
				buttonsStr = buttonsStr + "Button4|";
			}
			if (mouseInfo.button5) {
				buttonsStr = buttonsStr + "Button5|";
			}

			if (followMouse) {
				root.lookup("mouseButtons").netAssign(buttonsStr);
				root.lookup("mouseButton").netAssign(buttonName + " down");
			} else {
				root.lookup("mouseButtons").assign(buttonsStr);
				root.lookup("mouseButton").assign(buttonName + " down");
			}

			if (mouseInfo.buttonCount == 1) {
				var mousePos = root.lookup('mousePosition').value();
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
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);

			var followMouse = root.lookup("mouseFollow").value();
			var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = false;
					if (followMouse) {
						root.lookup('mousePressed').netAssign(false);
					} else {
						root.lookup('mousePressed').assign(false);
					}
					buttonName = "Left";
					break;
				case 1:
					mouseInfo.middleButton = false;
					buttonName = "Middle";
					break;
				case 2:
					mouseInfo.rightButton = false;
					buttonName = "Right";
					break;
				case 3:
					mouseInfo.button4 = false;
					buttonName = "Button4";
					break;
				case 4:
					mouseInfo.button5 = false;
					buttonName = "Button5";
					break;
				default:
					buttonName = "Unknown";
			}
			mouseInfo.buttonCount = mouseInfo.leftButton + mouseInfo.middleButton + mouseInfo.rightButton + mouseInfo.button4 + mouseInfo.button5;

			if (followMouse) {
				root.lookup("mouseButton").netAssign(buttonName + " up");
			} else {
				root.lookup("mouseButton").assign(buttonName + " up");
			}
			
			if (mouseInfo.buttonCount == 0) {
				var mousePos = root.lookup('mousePosition').value();
				if (followMouse) {
					root.lookup("mouseButtons").netAssign("");
					root.lookup('mouseUp').netAssign(mousePos);
				} else {
					root.lookup("mouseButtons").assign("");
					root.lookup('mouseUp').assign(mousePos);
				}
			} else {
				var buttonsStr = "|";
				if (mouseInfo.leftButton) {
					buttonsStr = buttonsStr + "Left|";
				}
				if (mouseInfo.middleButton) {
					buttonsStr = buttonsStr + "Middle|";
				}
				if (mouseInfo.rightButton) {
					buttonsStr = buttonsStr + "Right|";
				}
				if (mouseInfo.button4) {
					buttonsStr = buttonsStr + "Button4|";
				}
				if (mouseInfo.button5) {
					buttonsStr = buttonsStr + "Button5|";
				}
				if (followMouse) {
					root.lookup("mouseButtons").netAssign(buttonsStr);
				} else {
					root.lookup("mouseButtons").assign(buttonsStr);
				}
			}
			autocalcSym.assign(autocalcValueOnEntry);

		}).on("contextmenu", function (e) {
			if (!root.lookup("mouseContextMenuEnabled").value()) {
				e.preventDefault();
				e.stopPropagation();
			}
		
		}).on("click", function (e) {
			if (root.lookup("mouseCapture").value()) {
				this.requestPointerLock();
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
			var e2 = e.originalEvent;
			var followMouse = root.lookup("mouseFollow").value();
			if (e2.deltaY !== 0) {
				if (!e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
					e.preventDefault();
					e.stopPropagation();
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
			}
			if (e2.deltaX !== 0) {
				e.preventDefault();
				e.stopPropagation();
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

		}).on("mouseout", function (e) {
			var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
			mouseInfo.insideCanvas = false;
		
		}).on("mouseenter", function (e) {
			var mouseInfo = EdenUI.plugins.CanvasHTML5.mouseInfo;
			if (!mouseInfo.insideCanvas) {
				mouseInfo.insideCanvas = true;
				var buttonsStr;
				if (mouseInfo.buttonCount == 0) {
					buttonsStr = "";
				} else {
					buttonsStr = "|";
					if (mouseInfo.leftButton) {
						buttonsStr = buttonsStr + "Left|";
					}
					if (mouseInfo.middleButton) {
						buttonsStr = buttonsStr + "Middle|";
					}
					if (mouseInfo.rightButton) {
						buttonsStr = buttonsStr + "Right|";
					}
					if (mouseInfo.button4) {
						buttonsStr = buttonsStr + "Button4|";
					}
					if (mouseInfo.button5) {
						buttonsStr = buttonsStr + "Button5|";
					}
				}
				
				var buttonsSym = root.lookup("mouseButtons");
				var prevButtons = buttonsSym.value();
				if (buttonsStr != prevButtons) {
					var autocalcSym = root.lookup("autocalc");
					var autocalcValueOnEntry = autocalcSym.value();
					autocalcSym.assign(0);
					
					var followMouse = root.lookup("mouseFollow").value();
					var pressedSym = root.lookup("mousePressed");

					if (followMouse) {
						root.lookup("mouseButton").netAssign("Enter window");
						buttonsSym.netAssign(buttonsStr);
						if (pressedSym.value() != mouseInfo.leftButton) {
							pressedSym.netAssign(mouseInfo.leftButton);
						}
					} else {
						root.lookup("mouseButton").assign("Enter window");				
						buttonsSym.assign(buttonsStr);
						if (pressedSym.value() != mouseInfo.leftButton) {
							pressedSym.assign(mouseInfo.leftButton);
						}
					}
					if (prevButtons == "" && buttonsStr != "") {
						if (followMouse) {
							root.lookup("mouseDown").netAssign(undefined);
							root.lookup("mouseDownWindow").netAssign(undefined);
						} else {
							root.lookup("mouseDown").assign(undefined);
							root.lookup("mouseDownWindow").assign(undefined);					
						}
					}
					autocalcSym.assign(autocalcValueOnEntry);
				}
			}
		
		}).on("mousemove",function(e) {
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			autocalcSym.assign(0);

			var followMouse = root.lookup("mouseFollow").value();
			var mousePositionSym = root.lookup('mousePosition');
			
			var x, y;
			if (EdenUI.plugins.CanvasHTML5.mouseInfo.capturing) {
				var previousPosition = mousePositionSym.value();
				var e2 = e.originalEvent;
				x = previousPosition.x + e2.movementX;
				y = previousPosition.y + e2.movementY;
			} else {
				var windowPos = $(this).offset();
				x = Math.ceil(e.pageX - windowPos.left);
				y = Math.ceil(e.pageY - windowPos.top);
			}

			var mousePos = new Point(x, y);

			if (followMouse) {
				root.lookup('mouseWindow').netAssign(displayedName);
				mousePositionSym.netAssign(mousePos);
			} else {
				root.lookup('mouseWindow').assign(displayedName);
				mousePositionSym.assign(mousePos);
			}
			autocalcSym.assign(autocalcValueOnEntry);
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

EdenUI.plugins.CanvasHTML5.mouseInfo = {leftButton: false, middleButton: false, rightButton: false,
	button4: false, button5: false, buttonCount: 0, insideCanvas: false, capturing: false};

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
