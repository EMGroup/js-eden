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
				if (elementsToRemove[i].parentElement !== null) {
					canvasElement.removeChild(elementsToRemove[i]);
				}
			}
		}
	};

	var defaultWidth = 600;
	var defaultHeight = 500;
	canvases = {};
	contents = {};
	var canvasNameToElements = {};
	var pictureObsToViews = {};
	var viewsToPictureObs = {};
	var redrawDelay = 40;

	this.drawPictures = function (pictureObs) {
		for (var viewName in pictureObsToViews[pictureObs]) {
			this.drawPicture(viewName, pictureObs);
		}
	}

	this.drawPicture = function(canvasname, pictureObs) {
		var canvas = canvases[canvasname];
		if (canvas === undefined) {
			//View has been detroyed.
			return;
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
					if (content === undefined) {
						//View has been detroyed.
						return;
					}
				  
					var backgroundColour = root.lookup("_view_" + canvasname + "_background_colour").value();
					if (backgroundColour === undefined) {
						backgroundColour = "white";
					}
					var scale = root.lookup("_view_" + canvasname + "_scale").value();
					if (typeof(scale) != "number") {
						scale = 1;
					}
					var zoom = root.lookup("_view_" + canvasname + "_zoom").value();
					if (typeof(zoom) != "number") {
						zoom = 1;
					}
					var combinedScale = scale * zoom;
					var origin = root.lookup("_view_" + canvasname + "_offset").value();
					if (origin instanceof Point) {
						context.translate(origin.x, origin.y);
					} else {
						origin = new Point(0, 0);
					}

					me.setFillStyle(context, backgroundColour);
					content.parentElement.style.backgroundColor = backgroundColour;
					context.setTransform(1, 0, 0, 1, 0, 0);
					context.fillRect(0, 0, canvas.width, canvas.height);
					context.scale(combinedScale, combinedScale);

					//Configure JS-EDEN default options that are different from the HTML canvas defaults.
					me.configureContextDefaults(context, scale);

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
									var visible = me.configureContext(context, scale, zoom, picture[i].drawingOptions);
									// expect draw() method to set .elements
									if (visible) {
										picture[i].draw(context, scale, pictureObs);
									}
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
									picture[i].scale(combinedScale, zoom, origin);
								} else if (!existingEl || canvas.rescale) {
									picture[i].scale(combinedScale, zoom, origin);
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
	this.configureContextDefaults = function (context, scale) {
		context.lineJoin = "bevel";
		context.miterLimit = 429496656;
		context.lineWidth = 2 / scale;
	}
	
	this.configureContext = function (context, scale, zoom, options) {
		if (typeof(options) != "object") {
			return true;
		}
		
		if (options.visible === false) {
			return false;
		}
			
		if (Array.isArray(options.dashes)) {
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
		}
		
		if ("miterLimit" in options) {
			context.miterLimit = options.miterLimit;
		}
		
		if ("lineWidth" in options) {
			context.lineWidth = options.lineWidth / scale;
		}

		if ("opacity" in options) {
			context.globalAlpha = options.opacity;
		}
		
		if (typeof(options.shadow) == "object") {
			context.shadowColor = options.shadow.colour;
			if (options.shadow.scale) {
				var combinedScale = zoom * scale;
				context.shadowBlur = options.shadow.blur * combinedScale;
				context.shadowOffsetX = options.shadow.xOffset * combinedScale;
				context.shadowOffsetY = options.shadow.yOffset * combinedScale;
			} else {
				context.shadowBlur = options.shadow.blur * zoom;
				context.shadowOffsetX = options.shadow.xOffset * zoom;
				context.shadowOffsetY = options.shadow.yOffset * zoom;
			}
		}

		return true;
	}

	this.setFillStyle = function (context, style) {
		if (style instanceof EdenUI.plugins.Canvas2D.FillStyle) {
			context.fillStyle = style.getColour(context);
		} else {
			context.fillStyle = style;
		}
	};

	this.findZoneHit = function (canvasName, pictureObs, x, y) {
		var picture = root.lookup(pictureObs).value();
		if (!Array.isArray(picture)) {
			return undefined;
		}
		var canvas = canvases[canvasName];
		var context = canvas.getContext("2d");
		var scale = root.lookup("_view_" + canvasName + "_scale").value();

		for (var i = picture.length - 1; i >= 0; i--) {
			var drawable = picture[i];
			if (typeof(drawable) != "object") {
				continue;
			}
			var drawingOptions = drawable.drawingOptions;
			if (drawingOptions === undefined) {
				continue;
			}
			var id = drawingOptions.name;
			if (id === undefined) {
				continue;
			}
			var hitTest = drawable.isHit;
			if (hitTest === undefined) {
				continue;
			}
			context.save();
			var isHit = drawable.isHit(context, scale, x, y);
			context.restore();
			if (isHit) {
				return id;
			}
		}
		return undefined;
	}

	this.findZoneHit2 = function (pictureOrView, x, y) {
		var viewName, pictureObs;
		if (pictureOrView instanceof Symbol) {
			pictureObs = pictureOrView.name.slice(1);
			for (var view in pictureObsToViews[pictureObs]) {
				//Grab the first view.
				viewName = view;
				break;
			}
		} else {
			viewName = pictureOrView;
			pictureObs = viewsToPictureObs[viewName];
		}
		return this.findZoneHit(viewName, pictureObs, x, y);
	}

	this.findAllZonesHit = function (pictureOrView, x, y) {
		var viewName, pictureObs, picture;
		if (pictureOrView instanceof Symbol) {
			pictureObs = pictureOrView.name.slice(1);
			for (var view in pictureObsToViews[pictureObs]) {
				//Grab the first view.
				viewName = view;
				break;
			}
			picture = pictureOrView.value();
		} else {
			viewName = pictureOrView;
			pictureObs = viewsToPictureObs[viewName];
			picture = root.lookup(pictureObs).value();
		}

		if (!Array.isArray(picture)) {
			return [];
		}

		var canvas = canvases[viewName];
		var context = canvas.getContext("2d");
		var scale = root.lookup("_view_" + viewName + "_scale").value();
		var zonesHit = [];

		for (var i = 0; i < picture.length; i++) {
			var drawable = picture[i];
			if (typeof(drawable) != "object") {
				continue;
			}
			var drawingOptions = drawable.drawingOptions;
			if (drawingOptions === undefined) {
				continue;
			}
			var id = drawingOptions.name;
			if (id === undefined) {
				continue;
			}
			var hitTest = drawable.isHit;
			if (hitTest === undefined) {
				continue;
			}
			context.save();
			var isHit = drawable.isHit(context, scale, x, y);
			context.restore();
			if (isHit) {
				zonesHit.push(id);
			}
		}
		return zonesHit;
	}

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
		viewsToPictureObs[viewName] = pictureObs;

		edenUI.eden.root.lookup(pictureObs).addJSObserver("refreshView", function (symbol, value) {
			me.drawPictures(pictureObs);
		});
	};
	
	this.createDialog = function (name, mtitle, pictureObs) {
		//Remove -dialog name suffix.
		var canvasName = name.slice(0, -7);
		var agent = root.lookup("createView");

		var backgroundColourSym = root.lookup("_view_" + canvasName + "_background_colour");
		if (backgroundColourSym.value() === undefined) {
		  backgroundColourSym.assign("white", root.scope, agent);
		}
		backgroundColourSym.addJSObserver("repaintView", function (symbol, value) {
			me.drawPicture(canvasName, pictureObs);
		});

		var scaleSym = root.lookup("_view_" + canvasName + "_scale");
		if (scaleSym.value() === undefined) {
		  scaleSym.assign(1, root.scope, agent);
		}
		scaleSym.addJSObserver("repaintView", function (symbol, value) {
			document.getElementById(name + "-canvas").rescale = true;
			me.drawPicture(canvasName, pictureObs);
		});
		var zoomSym = root.lookup("_view_" + canvasName + "_zoom");
		if (zoomSym.value() === undefined) {
		  zoomSym.assign(1, root.scope, agent);
		}
		zoomSym.addJSObserver("repaintView", function (symbol, value) {
			document.getElementById(name + "-canvas").rescale = true;
			me.drawPicture(canvasName, pictureObs);
		});
		var offsetSym = root.lookup("_view_" + canvasName + "_offset");
		if (offsetSym.value() === undefined) {
		  offsetSym.assign(new Point(0, 0), root.scope, agent);
		}
		offsetSym.addJSObserver("repaintView", function (symbol, value) {
			document.getElementById(name + "-canvas").rescale = true;
			me.drawPicture(canvasName, pictureObs);
		});

		code_entry = $('<div id=\"'+name+'-canvascontent\" class=\"canvashtml-content\"></div>');
		code_entry.html("<canvas class=\"canvashtml-canvas\" id=\""+name+"-canvas\" tabindex=\"1\"></canvas>");
		var jqCanvas = code_entry.find(".canvashtml-canvas");

		if (!(canvasName in canvases)) {		
			var canvas = jqCanvas[0];
			canvases[canvasName] = canvas;
			contents[canvasName] = code_entry[0];
			canvasNameToElements[canvasName] = {};
			canvas.drawingQueued = false;
			canvas.drawingInProgress = false;
			canvas.rescale = false;
		}

		jqCanvas.on("mousedown", function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();

			var mouseInfo = me.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;			
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = true;
					root.lookup('mousePressed').assign(true, root.scope, Symbol.hciAgent, followMouse);
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

			root.lookup("mouseButtons").assign(buttonsStr, root.scope, Symbol.hciAgent, followMouse);
			root.lookup("mouseButton").assign(buttonName + " down", root.scope, Symbol.hciAgent, followMouse);

			if (mouseInfo.buttonCount == 1) {
				var mousePos = root.lookup('mousePosition').value();
				root.lookup('mouseDownWindow').assign(canvasName, root.scope, Symbol.hciAgent, followMouse);
				root.lookup('mouseDown').assign(mousePos, root.scope, Symbol.hciAgent, followMouse);
				var hitZone = root.lookup("mouseZone").value();
				root.lookup("mouseDownZone").assign(hitZone, root.scope, Symbol.hciAgent, followMouse);
			}
			root.endAutocalcOff();

		}).on("mouseup",function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();

			var mouseInfo = me.mouseInfo;
			mouseInfo.insideCanvas = true;

			var buttonName;
			switch (e.button) {
				case 0:
					mouseInfo.leftButton = false;
					root.lookup('mousePressed').assign(false, root.scope, Symbol.hciAgent, followMouse);
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

			root.lookup("mouseButton").assign(buttonName + " up", root.scope, Symbol.hciAgent, followMouse);
			
			if (mouseInfo.buttonCount == 0) {
				var mousePos = root.lookup('mousePosition').value();
				root.lookup("mouseButtons").assign("", root.scope, Symbol.hciAgent, followMouse);
				root.lookup('mouseUp').assign(mousePos, root.scope, Symbol.hciAgent, followMouse);
				edenUI.plugins.Canvas2D.endClick();
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
				root.lookup("mouseButtons").assign(buttonsStr, root.scope, Symbol.hciAgent, followMouse);
			}
			root.endAutocalcOff();

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
			dblClickSym.assign(numClicks + 1, root.scope, Symbol.hciAgent, followMouse);
		
		}).on("wheel", function (e) {
			if (!root.lookup("mouseWheelEnabled").value()) {
				return;
			}
			var e2 = e.originalEvent;
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();

			var direction;
			if (e2.deltaY !== 0) {
				if (!e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
					e.preventDefault();
					e.stopPropagation();
					var mouseWheelSym = root.lookup("mouseWheel");
					var mouseWheelValue = mouseWheelSym.value();
					if (e2.deltaY < 0) {
						mouseWheelValue--;
						direction = "up";
					} else {
						mouseWheelValue++;
						direction = "down";
					}
					mouseWheelSym.assign(mouseWheelValue, root.scope, Symbol.hciAgent, followMouse);
					root.lookup("mouseWheelDir").assign(direction, root.scope, Symbol.hciAgent, followMouse);
				}
			}
			if (e2.deltaX !== 0) {
				e.preventDefault();
				e.stopPropagation();
				var touchScrollXSym = root.lookup("touchScrollX");
				var touchScrollXValue = touchScrollXSym.value();
				if (e2.deltaX < 0) {
					touchScrollXValue--;
					direction = "left";
				} else {
					touchScrollXValue++;
					direction = "right";
				}
				touchScrollXSym.assign(touchScrollXValue, root.scope, Symbol.hciAgent, followMouse);
				root.lookup("touchScrollXDir").assign(direction, root.scope, Symbol.hciAgent, followMouse);
			}
			root.endAutocalcOff();

		}).on("mouseout", function (e) {
			me.mouseInfo.insideCanvas = false;
			var followMouse = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(undefined, root.scope, Symbol.hciAgent, followMouse);
		
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
					var followMouse = root.lookup("mouseFollow").value();
					root.beginAutocalcOff();

					buttonsSym.assign(buttonsStr, root.scope, Symbol.hciAgent, followMouse);
					root.lookup("mouseButton").assign("Enter window", root.scope, Symbol.hciAgent, followMouse);				

					var pressedSym = root.lookup("mousePressed");
					if (pressedSym.value() != mouseInfo.leftButton) {
						pressedSym.assign(mouseInfo.leftButton, root.scope, Symbol.hciAgent, followMouse);
					}
					if (prevButtons == "" && buttonsStr != "") {
						root.lookup("mouseDown").assign(undefined, root.scope, Symbol.hciAgent, followMouse);
						root.lookup("mouseDownWindow").assign(undefined, root.scope, Symbol.hciAgent, followMouse);
					}
					root.endAutocalcOff();
				}
			}
		
		}).on("mousemove",function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();

			var mousePositionSym = root.lookup('mousePosition');			
			var scale = root.lookup("_view_" + canvasName + "_scale").value();
			var zoom = root.lookup("_view_" + canvasName + "_zoom").value();
			var combinedScale = scale * zoom;
			var x, y;

			if (me.mouseInfo.capturing) {
				var previousPosition = mousePositionSym.value();
				var e2 = e.originalEvent;
				x = previousPosition.x + e2.movementX / combinedScale;
				y = previousPosition.y + e2.movementY / combinedScale;
			} else {
				var windowPos = $(this).offset();
				x = (e.pageX - Math.round(windowPos.left)) / combinedScale;
				y = (e.pageY - Math.round(windowPos.top)) / combinedScale;
			}

			var mousePos;
			//Workaround for bug #67.
			if (window.Point) {
				mousePos = new Point(x, y);
			}

			root.lookup('mouseWindow').assign(canvasName, root.scope, Symbol.hciAgent, followMouse);
			mousePositionSym.assign(mousePos, root.scope, Symbol.hciAgent, followMouse);

			var hitZone = me.findZoneHit(canvasName, pictureObs, x, y);
			root.lookup("mouseZone").assign(hitZone, root.scope, Symbol.hciAgent, followMouse);
			
			root.endAutocalcOff();

		}).on("keyup", function (e) {
			var keyCode = e.which;
			if (e.altKey && !e.shiftKey && !e.ctrlKey) {
				if (keyCode == 187 || keyCode == 189 || keyCode == 48) {
					//Zooming using Alt+, Alt- and Alt0
					var zoomSym = root.lookup("_view_" + canvasName + "_zoom");
					var zoom = zoomSym.value();
					if (keyCode == 187) {
						zoom = zoom * 1.25;
					} else if (keyCode == 189) {
						zoom = zoom / 1.25;
					} else {
						zoom = 1;
					}
					zoomSym.assign(zoom, root.scope, Symbol.hciAgent);
				}
			}
		});

		$('<div id="'+name+'"></div>')
		.html(code_entry)
		.dialog({
			title: mtitle,
			width: defaultWidth + edenUI.scrollBarYSize,
			height: defaultHeight + edenUI.titleBarHeight,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "unpadded-dialog"
		});
		me.setPictureObs(canvasName, pictureObs);
		return {
			confirmClose: true,
			destroy: function () {
				delete canvases[canvasName];
				delete contents[canvasName];
				delete pictureObsToViews[pictureObs][canvasName];
				delete viewsToPictureObs[canvasName];
			},
			resize: function (width, height) {
				var redraw = false;
				var canvas = document.getElementById(name + "-canvas");
				var roundedWidth = Math.floor(width);
				var roundedHeight = Math.floor(height - 1);
				/*The if statements are necessary because setting the width or height has the side
				 *effect of erasing the canvas.  If the width or height are defined by dependency
				 *then this method gets called whenever that dependency is re-evaluated, even if the
				 *recalculated value is the same as the old one, which previously resulted in a
				 *noticeable flicker effect.
				 */
				if (roundedWidth != canvas.width) {
					canvas.width = roundedWidth;
					redraw = true;
				}
				if (roundedHeight != canvas.height) {
					canvas.height = roundedHeight;
					redraw = true;
				}
				if (redraw) {
					me.drawPicture(canvasName, pictureObs);
				}
			}
		};
	}

	root.lookup("mouseDownZone").addJSObserver("recordClick", function (symbol, zone) {
		if (eden.isValidIdentifier(zone)) {
			root.lookup(zone + "_click").assign(true, root.scope, Symbol.hciAgent);
		}
	});
	
	this.endClick = function () {
		var zoneDown = root.lookup("mouseDownZone").value();
		if (eden.isValidIdentifier(zoneDown)) {
			root.lookup(zoneDown + "_click").assign(false, root.scope, Symbol.hciAgent);
		}
	};

	//To catch when a mouse button is pressed down over a canvas window and then released outside of any
	//canvas window.
	document.addEventListener("mouseup", function (e) {
		var followMouse = root.lookup("mouseFollow").value();
		root.beginAutocalcOff();

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

				root.lookup("mouseButton").assign(buttonName + " up", root.scope, Symbol.hciAgent, followMouse);
				buttonsSym.assign("", root.scope, Symbol.hciAgent, followMouse);
				root.lookup('mousePosition').assign(undefined, root.scope, Symbol.hciAgent, followMouse);
				if (mousePressed) {
					mousePressedSym.assign(false, root.scope, Symbol.hciAgent, followMouse);
				}
				root.lookup('mouseUp').assign(undefined, root.scope, Symbol.hciAgent, followMouse);
				root.lookup('mouseWindow').assign(undefined, root.scope, Symbol.hciAgent, followMouse);
				edenUI.plugins.Canvas2D.endClick();
			}
		}
		root.endAutocalcOff();
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
		root.lookup("mouseCaptured").assign(locked, root.scope, undefined, followMouse);
	});

	edenUI.views["Canvas2D"] = {dialog: this.createDialog, title: "Canvas 2D", category: edenUI.viewCategories.visualization};
	edenUI.eden.include("plugins/canvas-html5/canvas.js-e", success);
};

EdenUI.plugins.Canvas2D.FillStyle = function () {
	//Abstract superclass.
}

EdenUI.plugins.Canvas2D.title = "Canvas 2D";
EdenUI.plugins.Canvas2D.description = "Provides the ability to draw two-dimensional shapes, images, text and user interface controls using EDEN dependencies.";
