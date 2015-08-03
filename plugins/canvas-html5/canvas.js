/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * JS-Eden Canvas Plugin
 * Allows a html5 canvas to be displayed and used within JS-Eden for drawing.
 * @class Canvas2D Plugin
 */

EdenUI.plugins.Canvas2D = function (edenUI, success) {
	var me = this;

	var cleanupCanvas = function (canvasElement, previousElements) {
		var hash;
		for (hash in previousElements) {
			if (!previousElements[hash].togarbage) {
				continue;
			}
			var elementsToRemove = previousElements[hash];
			for (var i = 0; i < elementsToRemove.length; i++) {
				canvasElement.removeChild(elementsToRemove[i]);
			}
		}
	};

	var defaultWidth = 600;
	var defaultHeight = 450;
	canvases = {};
	contents = {};
	var canvasNameToElements = {};
	var pictureObsToViews = {};
	var redrawDelay = 40;

	this.drawPictures = function (pictureObs) {
		for (viewName in pictureObsToViews[pictureObs]) {
			this.drawPicture(viewName, pictureObs);
		}
	}

	this.drawPicture = function(canvasname, pictureObs) {

		if (!canvasNameToElements[canvasname]) {
			canvasNameToElements[canvasname] = {};
		}

		var canvas = canvases[canvasname];

		if (canvas === undefined) {
			//Need to make the canvas view first
			edenUI.createView(canvasname, "Canvas2D", pictureObs);
			
			canvases[canvasname] = $("#"+canvasname+"-dialog-canvas")[0];
			contents[canvasname] = $("#"+canvasname+"-dialog-canvascontent")[0];
			canvas = canvases[canvasname];
			canvas.drawingQueued = false;
			canvas.drawingInProgress = false;
		}
	
		if (!canvas.drawingQueued) {
			canvas.drawingQueued = true;

			if (!canvas.drawingInProgress) {
				var redrawFunction = function () {
					canvas.drawingInProgress = true;
					canvas.drawingQueued = false;

					var previousElements = canvasNameToElements[canvasname];
					var nextElements = {};

					var picture = root.lookup(pictureObs).value();
					var context = canvas.getContext('2d');
					var content = contents[canvasname];
				  
					var backgroundColour = root.lookup("_view_" + canvasname + "_background_colour").value();
					me.setFillStyle(context, backgroundColour);
					content.parentElement.style.backgroundColor = backgroundColour;
					context.fillRect(0, 0, canvas.width, canvas.height);

					//Configure JS-EDEN default options that are different from the HTML canvas defaults.
					me.configureContextDefaults(context);

					var hash;
					for (hash in previousElements) {
						previousElements[hash].togarbage = true;
					}

					if (Array.isArray(picture)) {

						for (var i = 0; i < picture.length; i++) {
							if (typeof(picture[i]) != "object") {
								continue;
							}

							var elHash = picture[i].hash && picture[i].hash();
							var existingEl = elHash && previousElements[elHash];

							if (existingEl) {
								// if already existing hash, no need to draw, just set the elements
								picture[i].elements = existingEl;
							} else {
								context.save();
								try {
									me.configureContext(context, picture[i].drawingOptions);
									// expect draw() method to set .elements
									picture[i].draw(context, pictureObs);
								} catch (e) {
									if (picture[i] !== undefined) {
										console.log(e);
										var debug = edenUI.eden.root.lookup("debug").value();
										if (typeof(debug) == "object" && debug.jsExceptions) {
											debugger;
										}
									}
								}
								context.restore();
							}

							if (picture[i].elements !== undefined) {
								var parentEl = picture[i].elements[0].parentElement;
								if (parentEl && parentEl != content) {
									//HTML item already present on another canvas.
									var copiedEl = [];
									for (var j = 0; j < picture[i].elements.length; j++) {
										copiedEl.push($(picture[i].elements[j]).clone(true, true).get(0));
									}
									picture[i].elements = copiedEl;
								}
							}
							var htmlEl = picture[i].elements;
							if (htmlEl) { htmlEl.togarbage = false; }
							if (htmlEl && !existingEl) {
								$(content).append(htmlEl);
							}

							if (htmlEl) {
								nextElements[elHash] = htmlEl;
							}
						} //end of redraw loop.
					} //end if picture observable is undefined.
					cleanupCanvas(content, previousElements);
					canvasNameToElements[canvasname] = nextElements;
					canvas.drawingInProgress = false;
					if (canvas.drawingQueued) {
						setTimeout(redrawFunction, redrawDelay);
					}
				}; // end of redraw function.
				setTimeout(redrawFunction, redrawDelay);
			} //end if drawing not already in progress.
		} //end redraw only if not already queued.
	};

	/**Configures JS-EDEN default drawing options that are different from the HTML canvas defaults.
	 */
	this.configureContextDefaults = function (context) {
		context.lineJoin = "bevel";
		context.lineWidth = 2;
	}
	
	this.configureContext = function (context, options) {
		if (options === undefined) {
			return;
		}
			
		if ("dashes" in options && Array.isArray(options.dashes)) {
			context.setLineDash(options.dashes);
			if ("dashOffset" in options) {
				context.lineDashOffset = options.dashOffset;
			}
		}

		if ("cap" in options) {
			context.lineCap = options.cap;
		}
		
		if ("join" in options) {
			context.lineJoin = options.join;
			context.miterLimit = 9007199254740991;
		}
		
		if ("miterLimit" in options) {
			context.miterLimit = options.miterLimit;
		}
		
		if ("lineWidth" in options) {
			context.lineWidth = options.lineWidth;
		}

		if ("opacity" in options) {
			context.globalAlpha = options.opacity;
		}
		
		if ("shadow" in options) {
			context.shadowColor = options.shadow.colour;
			context.shadowBlur = options.shadow.blur;
			context.shadowOffsetX = options.shadow.xOffset;
			context.shadowOffsetY = options.shadow.yOffset;
		}
	}

	this.setFillStyle = function (context, style) {
		if (style instanceof EdenUI.plugins.Canvas2D.FillStyle) {
			context.fillStyle = style.getColour(context);
		} else {
			context.fillStyle = style;
		}
	};

	this.mouseInfo = {
		leftButton: false, middleButton: false, rightButton: false, button4: false, button5: false,
		buttonCount: 0, insideCanvas: false, capturing: false
	};

	this.setPictureObs = function (viewName, pictureObs) {
		for (var otherPictureObs in pictureObsToViews) {
			delete pictureObsToViews[otherPictureObs][viewName];
		}
		if (!(pictureObs in pictureObsToViews)) {
			pictureObsToViews[pictureObs] = {};
		}
		pictureObsToViews[pictureObs][viewName] = true;

		edenUI.eden.root.lookup(pictureObs).addJSObserver("refreshView", function (symbol, value) {
			me.drawPictures(pictureObs);
		});
	};
	
	this.createDialog = function (name, mtitle, pictureObs) {
		//Remove -dialog name suffix.
		var displayedName = name.slice(0, -7);
		var backgroundColourSym = root.lookup("_view_" + displayedName + "_background_colour");
		if (backgroundColourSym.value() === undefined) {
		  backgroundColourSym.assign("white", {name: "createView"});
		}
		backgroundColourSym.addJSObserver("repaintView", function (symbol, value) {
			me.drawPicture(displayedName, pictureObs);		  
		});

		code_entry = $('<div id=\"'+name+'-canvascontent\" class=\"canvashtml-content\"></div>');
		code_entry.html("<canvas class=\"canvashtml-canvas\" id=\""+name+"-canvas\"></canvas>");
		var jqCanvas = code_entry.find(".canvashtml-canvas");
		jqCanvas.on("mousedown", function(e) {
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			var autocalcLastModified = autocalcSym.last_modified_by === undefined? undefined : {name: autocalcSym.last_modified_by};
			var followMouse = root.lookup("mouseFollow").value();
			autocalcSym.assign(0, Symbol.hciAgent, followMouse);

			var mouseInfo = me.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;			
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = true;
					root.lookup('mousePressed').assign(true, Symbol.hciAgent, followMouse);
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

			root.lookup("mouseButtons").assign(buttonsStr, Symbol.hciAgent, followMouse);
			root.lookup("mouseButton").assign(buttonName + " down", Symbol.hciAgent, followMouse);

			if (mouseInfo.buttonCount == 1) {
				var mousePos = root.lookup('mousePosition').value();
				root.lookup('mouseDownWindow').assign(displayedName, Symbol.hciAgent, followMouse);
				root.lookup('mouseDown').assign(mousePos, Symbol.hciAgent, followMouse);
			}
			autocalcSym.assign(autocalcValueOnEntry, autocalcLastModified, followMouse);

		}).on("mouseup",function(e) {
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			var autocalcLastModified = autocalcSym.last_modified_by === undefined? undefined : {name: autocalcSym.last_modified_by};

			var followMouse = root.lookup("mouseFollow").value();
			autocalcSym.assign(0, Symbol.hciAgent, followMouse);

			var mouseInfo = me.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = false;
					root.lookup('mousePressed').assign(false, Symbol.hciAgent, followMouse);
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

			root.lookup("mouseButton").assign(buttonName + " up", Symbol.hciAgent, followMouse);
			
			if (mouseInfo.buttonCount == 0) {
				var mousePos = root.lookup('mousePosition').value();
				root.lookup("mouseButtons").assign("", Symbol.hciAgent, followMouse);
				root.lookup('mouseUp').assign(mousePos, Symbol.hciAgent, followMouse);
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
				root.lookup("mouseButtons").assign(buttonsStr, Symbol.hciAgent, followMouse);
			}
			autocalcSym.assign(autocalcValueOnEntry, autocalcLastModified, followMouse);

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
			dblClickSym.assign(numClicks + 1, Symbol.hciAgent, followMouse);
		
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
					mouseWheelSym.assign(mouseWheelValue, Symbol.hciAgent, followMouse);
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
				touchScrollXSym.assign(touchScrollXValue, Symbol.hciAgent, followMouse);
			}

		}).on("mouseout", function (e) {
			me.mouseInfo.insideCanvas = false;
		
		}).on("mouseenter", function (e) {
			var mouseInfo = me.mouseInfo;
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
					var autocalcLastModified = autocalcSym.last_modified_by === undefined? undefined : {name: autocalcSym.last_modified_by};

					var followMouse = root.lookup("mouseFollow").value();
					autocalcSym.assign(0, Symbol.hciAgent, followMouse);

					buttonsSym.assign(buttonsStr, Symbol.hciAgent, followMouse);
					root.lookup("mouseButton").assign("Enter window", Symbol.hciAgent, followMouse);				

					var pressedSym = root.lookup("mousePressed");
					if (pressedSym.value() != mouseInfo.leftButton) {
						pressedSym.assign(mouseInfo.leftButton, Symbol.hciAgent, followMouse);
					}
					if (prevButtons == "" && buttonsStr != "") {
						root.lookup("mouseDown").assign(undefined, Symbol.hciAgent, followMouse);
						root.lookup("mouseDownWindow").assign(undefined, Symbol.hciAgent, followMouse);
					}
					autocalcSym.assign(autocalcValueOnEntry, autocalcLastModified, followMouse);
				}
			}
		
		}).on("mousemove",function(e) {
			var autocalcSym = root.lookup("autocalc");
			var autocalcValueOnEntry = autocalcSym.value();
			var autocalcLastModified = autocalcSym.last_modified_by === undefined? undefined : {name: autocalcSym.last_modified_by};

			var followMouse = root.lookup("mouseFollow").value();
			autocalcSym.assign(0, Symbol.hciAgent, followMouse);

			var mousePositionSym = root.lookup('mousePosition');
			
			var x, y;
			if (me.mouseInfo.capturing) {
				var previousPosition = mousePositionSym.value();
				var e2 = e.originalEvent;
				x = previousPosition.x + e2.movementX;
				y = previousPosition.y + e2.movementY;
			} else {
				var windowPos = $(this).offset();
				x = Math.ceil(e.pageX - windowPos.left);
				y = Math.ceil(e.pageY - windowPos.top);
			}

			var mousePos;
			//Workaround for bug #67.
			if (window.Point) {
				mousePos = new Point(x, y);
			}

			root.lookup('mouseWindow').assign(displayedName, Symbol.hciAgent, followMouse);
			mousePositionSym.assign(mousePos, Symbol.hciAgent, followMouse);
			autocalcSym.assign(autocalcValueOnEntry, autocalcLastModified, followMouse);
		});

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: defaultWidth + edenUI.scrollBarYSize,
				height: defaultHeight + edenUI.titleBarHeight + edenUI.scrollBarXSize,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "unpadded-dialog"
			});
		me.setPictureObs(displayedName, pictureObs);
		return {
			confirmClose: true,
			destroy: function () {
				delete canvases[displayedName];
				delete contents[displayedName];
				delete pictureObsToViews[pictureObs][displayedName];
			},
			resize: function (width, height) {
				var redraw = false;
				var canvas = document.getElementById(name + "-canvas");
				var roundedWidth = Math.floor(width);
				var roundedHeight = Math.floor(height);
				/* The if statements are necessary because setting the width or height has the side
				 effect of erasing the canvas. */
				if (roundedWidth != canvas.width) {
					canvas.width = roundedWidth;
					redraw = true;
				}
				if (roundedHeight != canvas.height) {
					canvas.height = roundedHeight;
					redraw = true;
				}
				if (redraw) {
					me.drawPicture(displayedName, pictureObs);
				}
			}
		};
	}

	//Describes observables whose values will change when the left mouse button is released.
	var observablesMouseDown = {};
	
	/**Sets the value of an observable (e.g. when the mouse button is pressed down) and schedules
	 * another value to be assigned when the left mouse button is later released.
	 * @param {String} name The name of the observable.
	 * @param {*} valueDown The value to assign to the observable immediately.
	 * @param {*} valueUp The value to assign when the mouse button is released.
	 * @param {Symbol} agent The agent to perform the assignment on behalf of.
	 */
	this.setMouseDown = function (name, valueDown, valueUp, agent) {
		var followMouse = root.lookup("mouseFollow").value();
		root.lookup(name).assign(valueDown, agent, followMouse);
		observablesMouseDown[name] = {agent: agent, valueOnRelease: valueUp};
	}

	/**Schedules a future assignment to an observable when the left mouse button is released.
	 * @param {String} name The name of the observable.
	 * @param {*} valueUp The value to assign when the mouse button is released.
	 * @param {Symbol} agent The agent to perform the assignment on behalf of.
	 */
	this.scheduleMouseUp = function (name, valueUp, agent) {
		observablesMouseDown[name] = {agent: agent, valueOnRelease: valueUp};
	}

	 /**Sets the value of an observable and cancels the assignment previously scheduled to happen
	 * when the left mouse button is released.
	 * @param {String} name The name of the observable.
	 * @param {*} valueUp The value to assign when the mouse button is released.
	 * @param {Symbol} agent The agent to perform the assignment on behalf of.
	 */
	this.setMouseUp = function (name, valueUp, agent) {
		var followMouse = root.lookup("mouseFollow").value();
		root.lookup(name).assign(valueUp, agent, followMouse);
		delete observablesMouseDown[name];
	}

	//To catch when a mouse button is pressed down over a canvas window and then released outside of any
	//canvas window.
	document.addEventListener("mouseup", function (e) {
		var autocalcSym = root.lookup("autocalc");
		var autocalcValueOnEntry = autocalcSym.value();
		var autocalcLastModified = autocalcSym.last_modified_by === undefined? undefined : {name: autocalcSym.last_modified_by};
		autocalcSym.assign(0, Symbol.hciAgent, followMouse);
		var followMouse = root.lookup("mouseFollow").value();

		var mouseInfo = me.mouseInfo;
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
			var buttonsSym = root.lookup("mouseButtons");
			if (mouseInfo.buttonCount == 0 && buttonsSym.value() != "") {
				//Final button released outside of any canvas window.
				var mousePressedSym = root.lookup("mousePressed");
				var mousePressed = mousePressedSym.value();

				root.lookup("mouseButton").assign(buttonName + " up", Symbol.hciAgent, followMouse);
				buttonsSym.assign("", Symbol.hciAgent, followMouse);
				root.lookup('mousePosition').assign(undefined, Symbol.hciAgent, followMouse);
				if (mousePressed) {
					mousePressedSym.assign(false, Symbol.hciAgent, followMouse);
				}
				root.lookup('mouseUp').assign(undefined, Symbol.hciAgent, followMouse);
				root.lookup('mouseWindow').assign(undefined, Symbol.hciAgent, followMouse);
			}
		}


		if (!mouseInfo.leftButton) {
			for (var observable in observablesMouseDown) {
				var clickDetails = observablesMouseDown[observable];
				root.lookup(observable).assign(clickDetails.valueOnRelease, clickDetails.agent, followMouse);
			}
			observablesMouseDown = {};
		}
		autocalcSym.assign(autocalcValueOnEntry, autocalcLastModified, followMouse);
	});

	document.addEventListener("mousedown", function (e) {
		var mouseInfo = me.mouseInfo;
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
		me.mouseInfo.capturing = locked;
		var followMouse = root.lookup("mouseFollow").value();
		root.lookup("mouseCaptured").assign(locked, undefined, followMouse);
	});

	edenUI.views["Canvas2D"] = {dialog: this.createDialog, title: "Canvas 2D", category: edenUI.viewCategories.visualization};
	edenUI.eden.include("plugins/canvas-html5/canvas.js-e", success);
};

EdenUI.plugins.Canvas2D.FillStyle = function () {
	//Abstract superclass.
}

EdenUI.plugins.Canvas2D.title = "Canvas 2D";
EdenUI.plugins.Canvas2D.description = "Provides the ability to draw two-dimensional shapes, images, text and user interface controls using EDEN dependencies.";
