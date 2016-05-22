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

	/**Font size at default text size. See css/eden.css. */
	this.defaultFontSizePx = 13.3;
	/**Line height at default text size. See css/eden.css. */
	this.defaultLineHeight = this.defaultFontSizePx * 1.75;
	/**Default line width. */
	this.defaultLineWidth = 2;

	var defaultWidth = 600;
	var defaultHeight = 500;
	canvases = {};
	contents = {};
	var canvasNameToElements = {};
	var redrawDelay = 40;

	var mouseIdleTimeout, mouseIdleTimer;
	var mouseVelocityTimestamp;
	var newMouseMovement = false;
	var mouseVelocityZero = false;
	Object.defineProperty(this, "mouseIdleTimeout", {
		set: function (timeout) {
			clearInterval(mouseIdleTimer);
			mouseIdleTimer = setInterval(function () {
				if (newMouseMovement) {
					mouseVelocityZero = false;
					newMouseMovement = false;
				} else if (!mouseVelocityZero) {
						var followMouse = root.lookup("mouseFollow").value();
						root.lookup("mouseVelocity").assign(new Point(0, 0), Symbol.hciAgent, followMouse);
						mouseVelocityZero = true;
						mouseVelocityTimestamp = undefined;
				}
			}, timeout / 2);
			mouseIdleTimeout = timeout;
		},
		get: function () {
			return mouseIdleTimeout;
		},
		enumerable: true,
	});

	this.mouseVelocitySampleTime = 100;
	this.mouseVelocityDampening = 0.3;
	this.mouseIdleTimeout = 300;

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

	this.drawPicture = function(viewName) {
		var canvas = canvases[viewName];
		if (canvas === undefined) {
			//View has been destroyed.
			return;
		}

		if (!canvas.drawingQueued) {
			canvas.drawingQueued = true;

			if (!canvas.drawingInProgress) {
				var redrawFunction = function () {
					canvas.drawingInProgress = true;
					canvas.drawingQueued = false;

					var previousElements = canvasNameToElements[viewName];
					var nextElements = {};

					var pictureObsName = "_view_" + viewName + "_content";
					var pictureSym = root.lookup(pictureObsName);
					var picture = pictureSym.value();
					var context = canvas.getContext('2d');
					var content = contents[viewName];
					if (content === undefined) {
						//View has been destroyed.
						return;
					}
				  
					var backgroundColour = root.lookup("_view_" + viewName + "_background_colour").value();
					if (backgroundColour === undefined) {
						backgroundColour = "white";
					}
					context.setTransform(1, 0, 0, 1, 0, 0);
					me.setFillStyle(context, backgroundColour);
					content.style.backgroundColor = backgroundColour;
					context.fillRect(0, 0, canvas.width, canvas.height);

					var hash;
					for (hash in previousElements) {
						previousElements[hash].togarbage = true;
					}
					if (Array.isArray(picture)) {
						var scale = root.lookup("_view_" + viewName + "_scale").value();
						if (typeof(scale) != "number") {
							scale = 1;
						}
						var zoom = root.lookup("_view_" + viewName + "_zoom").value();
						if (typeof(zoom) != "number") {
							zoom = 1;
						}
						var combinedScale = scale * zoom;
						var invertedYAxis, absScale;
						if (scale < 0) {
							context.scale(-combinedScale, combinedScale);
							combinedScale = -combinedScale;
							absScale = -scale;
							invertedYAxis = true;
						} else {
							if (combinedScale != 1) {
								context.scale(combinedScale, combinedScale);
							}
							absScale = scale;
							invertedYAxis = false;
						}
						var origin = root.lookup("_view_" + viewName + "_offset").value();
						if (origin instanceof Point) {
							if (invertedYAxis) {
								var originY = canvas.height / combinedScale - origin.y;
								context.translate(origin.x, -originY);								
								origin = new Point(origin.x, originY);
							} else {
								context.translate(origin.x, origin.y);
							}
						} else {
							origin = new Point(0, 0);
						}
						//Configure JS-EDEN default options that are different from the HTML canvas defaults.
						me.configureContextDefaults(context, absScale);

						var pictureLists = [picture];
						var pictureListIndices = [0];

						while (pictureLists.length > 0) {
							var currentPicture = pictureLists.pop();
							var index = pictureListIndices.pop();
							
							if (index > 0 && currentPicture[index - 1] instanceof EdenUI.plugins.Canvas2D.Transform) {
								context.restore();
							}

							while (index < currentPicture.length) {
								var item = currentPicture[index];
								if (!(item instanceof Object)) {
									index++;
									continue;
								} else if (Array.isArray(item)) {
									pictureLists.push(currentPicture);
									pictureListIndices.push(index + 1);
									currentPicture = item;
									index = 0;
									continue;
								} else if (item instanceof EdenUI.plugins.Canvas2D.Transform) {
									pictureLists.push(currentPicture);
									pictureListIndices.push(index + 1);
									context.save();
									item.transform(context);
									currentPicture = item.items;
									if (!Array.isArray(currentPicture)) {
										currentPicture = [currentPicture];
									}
									index = 0;
									continue;
								}

								var elHash = item.hash && item.hash();
								var existingEl = elHash && previousElements[elHash];

								if (existingEl) {
									// if already existing hash, no need to draw, just set the elements
									item.elements = existingEl;
								} else {
									context.save();
									try {
										var visible = me.configureContext(context, absScale, zoom, item.drawingOptions);
										// expect draw() method to set .elements
										if (visible) {
											item.draw(context, scale, viewName);
										}
									} catch (e) {
										if (item !== undefined) {
											console.log(e);
											var debug = root.lookup("debug").value();
											if (typeof(debug) == "object" && debug.jsExceptions) {
												debugger;
											}
										}
									}
									context.restore();
								}

								if (item.elements !== undefined) {
									var parentEl = item.elements[0].parentElement;
									if (parentEl && parentEl != content) {
										//HTML item already present on another canvas.
										var copiedEl = [];
										for (var j = 0; j < item.elements.length; j++) {
											copiedEl.push($(item.elements[j]).clone(true, true).get(0));
										}
										item.elements = copiedEl;
										item.scale(combinedScale, zoom, origin);
									} else if (!existingEl || canvas.rescale) {
										item.scale(combinedScale, zoom, origin);
									}
								}
								var htmlEl = item.elements;
								if (htmlEl) { htmlEl.togarbage = false; }
								if (htmlEl && !existingEl) {
									$(content).append(htmlEl);
								}

								if (htmlEl) {
									nextElements[elHash] = htmlEl;
								}
								index++;
							} //end of redraw loop (current list).
						} // end of redraw loop (all nested lists).
					} else { //end if picture observable is a list.
						var obsName = pictureObsName;
						var definition = pictureSym.eden_definition;
						if (definition) {
							var re = new RegExp("^" + pictureObsName + "\\s+is\\s+([a-zA-Z0-9_]+)(;)?$");
							var match = definition.match(re);
							if (match !== null) {
								obsName = match[1];
							}
						}
						context.save();
						context.font = "18px sans-serif";
						context.fillStyle = "black";
						context.textAlign = "center";
						content.textBaseline = "middle";
						context.fillText(
							"Give the observable named '" + obsName + "' a list-typed value",
							canvas.width / 2,
							canvas.height / 2
						);
						context.fillText(
							"to create a picture here.",
							canvas.width / 2,
							canvas.height / 2 + 30
						);
						context.restore();
					}
					cleanupCanvas(content, previousElements);
					canvasNameToElements[viewName] = nextElements;
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
		context.lineWidth = this.defaultLineWidth / scale;
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

	this.initZoneFromDrawingOpts = function (options, agentName) {
		var name;
		if (options instanceof Object) {
			if (options.zone === false) {
				return undefined;
			}
			name = options.name;
			if (name === undefined && options.zone === true) {
				return root.currentObservableName();
			}
		} else {
			return undefined;
		}

		if (edenUI.eden.isValidIdentifier(name)) {
			var clickSym = root.lookup(name + "_click");
			if (clickSym.value() === undefined) {
				clickSym.assign(false, root.lookup(agentName));
			}
		}
		return name;
	}

	this.initZoneFromName = function (name, agentName) {
		if (edenUI.eden.isValidIdentifier(name)) {
			var clickSym = root.lookup(name + "_click");
			if (clickSym.value() === undefined) {
				clickSym.assign(false, root.lookup(agentName));
			}
		}
		return name;
	};

	this.findDrawableHit = function (viewName, x, y, fromBottom, testAll) {
		var picture = root.lookup("_view_" + viewName + "_content").value();
		if (!Array.isArray(picture)) {
			return undefined;
		}
		var canvas = canvases[viewName];
		var context = canvas.getContext("2d");
		var scale = root.lookup("_view_" + viewName + "_scale").value();

		var beginIndex, increment;
		if (fromBottom) {
			beginIndex = 0;
			increment = 1;
		} else {
			beginIndex = picture.length - 1;
			increment = -1;
		}
		for (var i = beginIndex; fromBottom? i < picture.length : i >= 0; i = i + increment) {
			var drawable = picture[i];
			if (typeof(drawable) != "object") {
				continue;
			}
			var id = drawable.name;
			if (!testAll && id === undefined) {
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
				return drawable;
			}
		}
		return undefined;
	}

	this.findAllDrawablesHit = function (viewName, x, y, testAll) {
		var picture = root.lookup("_view_" + viewName + "_content").value();

		if (!Array.isArray(picture)) {
			return [];
		}

		var canvas = canvases[viewName];
		var context = canvas.getContext("2d");
		var scale = root.lookup("_view_" + viewName + "_scale").value();
		var drawablesHit = [];

		for (var i = 0; i < picture.length; i++) {
			var drawable = picture[i];
			if (typeof(drawable) != "object") {
				continue;
			}
			var id = drawable.name;
			if (!testAll && id === undefined) {
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
				drawablesHit.push(drawable);
			}
		}
		return drawablesHit;
	}

	var mouseInfo = {
		leftButton: false, middleButton: false, rightButton: false, button4: false, button5: false,
		buttonCount: 0, insideCanvas: false, capturing: false
	};
	
	this.createDialog = function (name, mtitle) {
		//Remove -dialog name suffix.
		var canvasName = name.slice(0, -7);
		var agent = root.lookup("createView");
		var code_entry, jqCanvas;
		var viewData;

		var canvas = canvases[canvasName];
		if (canvas === undefined) {
			code_entry = $('<div id="' + name + '-canvascontent" class="canvashtml-content"></div>');
			code_entry.html('<canvas class="canvashtml-canvas" id="' + name + '-canvas" tabindex="1"></canvas>');
			jqCanvas = code_entry.find(".canvashtml-canvas");
			canvas = jqCanvas[0];
			canvases[canvasName] = canvas;
			contents[canvasName] = code_entry[0];
			canvasNameToElements[canvasName] = {};
			canvas.drawingQueued = false;
			canvas.drawingInProgress = false;
			canvas.rescale = false;
		} else {
			code_entry = $("#" + name + "-canvascontent");
			jqCanvas = code_entry.find(".canvashtml-canvas");
		}

		var contentSym = root.lookup("_view_" + canvasName + "_content");
		contentSym.addJSObserver("repaintView", function(sym, picture) {
			me.drawPicture(canvasName);
		});

		var backgroundColourSym = root.lookup("_view_" + canvasName + "_background_colour");
		if (backgroundColourSym.value() === undefined) {
		  backgroundColourSym.assign("white", agent);
		}
		backgroundColourSym.addJSObserver("refreshView", function (symbol, value) {
			me.drawPicture(canvasName);
		});

		//Events triggered by changes to the various sizing observables.
		var scaleSym = root.lookup("_view_" + canvasName + "_scale");
		var zoomSym = root.lookup("_view_" + canvasName + "_zoom");
		var offsetSym = root.lookup("_view_" + canvasName + "_offset");
		var widthSym = root.lookup("_view_" + canvasName + "_canvas_right");
		var heightSym = root.lookup("_view_" + canvasName + "_canvas_bottom");
		var viewWidthSym = root.lookup("_view_" + canvasName + "_width");
		var viewHeightSym = root.lookup("_view_" + canvasName + "_height");
		var isZooming = false;
		function resizeCanvas () {
			var scale = scaleSym.value();
			var zoom = zoomSym.value();
			var combinedScale = scale * zoom;
			var offset = offsetSym.value();
			var offsetX, offsetY;
			if (offset instanceof Point) {
				offsetX = offset.x;
				offsetY = offset.y;
			} else {
				offsetX = 0;
				offsetY = 0;
			}

			var width = widthSym.value();
			if (width !== undefined) {
				width = Math.ceil((widthSym.value() + offsetX) * combinedScale);
				canvas.width = width;
			} else if (zoom > 1) {
				canvas.width = Math.ceil(viewWidthSym.value() * zoom);
			} else {
				canvas.width = Math.floor(viewWidthSym.value());
			}

			var height;
			if (heightSym.value() !== undefined) {
				height = Math.ceil((heightSym.value() + offsetY) * combinedScale);
			} else if (zoom > 1) {
				height = Math.ceil(viewHeightSym.value() * zoom);
			} else {
				height = viewHeightSym.value();
				if (width !== undefined && width > Math.floor(viewWidthSym.value())) {
					height = height - edenUI.scrollBarSize;
				}
				height = Math.floor(height - 1);
			}
			canvas.height = height;

			canvas.rescale = true;
			me.drawPicture(canvasName);
		} //end function
		var scale = scaleSym.value();
		if (scale === undefined) {
		  scaleSym.assign(1, agent);
		  scale = 1;
		}
		scaleSym.addJSObserver("refreshView", resizeCanvas);
		var zoom = zoomSym.value();
		if (zoom === undefined) {
		  zoomSym.assign(1, agent);
		  zoom = 1;
		}
		var zoomingQueued = false;
		function zoomOnDelay() {
			if (isZooming) {
				isZooming = false;
				canvas.rescale = true;
				me.drawPicture(canvasName);
				if (!zoomingQueued) {
					zoomingQueued = true;
					setTimeout(zoomOnDelay, 1000);
				}
			} else {
				resizeCanvas();
				zoomingQueued = false;
			}
		}
		zoomSym.addJSObserver("refreshView", function (symbol, zoom) {
			var zoomPercent = Math.round(zoom * 100);
			if (zoom == 1) {
				viewData.titleBarInfo = undefined;
			} else {
				viewData.titleBarInfo = zoomPercent + "%";
			}
			//Redraw bigger but don't change the canvas size while the user is zooming in and out (avoids flicker).
			isZooming = true;
			zoomOnDelay();
		});
		var offset = offsetSym.value();
		var offsetX, offsetY;
		if (!(offset instanceof Point)) {
		  offsetSym.assign(new Point(0, 0), agent);
		  offsetX = 0;
		  offsetY = 0;
		} else {
			offsetX = offset.x;
			offsetY = offset.y;
		}
		offsetSym.addJSObserver("refreshView", resizeCanvas);
		if (widthSym.value() == undefined) {
			widthSym.assign(undefined, agent);
		}
		widthSym.addJSObserver("repaintView", resizeCanvas);
		if (heightSym.value() == undefined) {
			heightSym.assign(undefined, agent);
		}
		heightSym.addJSObserver("repaintView", resizeCanvas);
		var initialWidth = widthSym.value();
		if (initialWidth === undefined) {
			initialWidth = defaultWidth;
		} else {
			initialWidth = initialWidth * scale + offsetX;
		}
		var initialHeight = heightSym.value();
		if (initialHeight === undefined) {
			initialHeight = defaultHeight;
		} else {
			initialHeight = initialHeight * scale + offsetY;
		}

		jqCanvas.on("mousedown", function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();
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
				root.lookup('mouseDownView').assign(canvasName, Symbol.hciAgent, followMouse);
				root.lookup('mouseDown').assign(mousePos, Symbol.hciAgent, followMouse);
				var hitZone = root.lookup("mouseZone").value();
				root.lookup("mouseDownZone").assign(hitZone, Symbol.hciAgent, followMouse);
			}
			root.endAutocalcOff();

		}).on("mouseup",function(e) {
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();
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
				root.lookup("mouseButtons").assign(buttonsStr, Symbol.hciAgent, followMouse);
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
			dblClickSym.assign(numClicks + 1, Symbol.hciAgent, followMouse);
		
		}).on("wheel", function (e) {
			var e2 = e.originalEvent;
			var wheelScale;
			var height = viewHeightSym.value();
			if (e2.deltaMode == WheelEvent.DOM_DELTA_LINE) {
				//Default font size of the canvas.  See css/eden.css
				wheelScale =  me.defaultLineHeight;
			} else if (e2.deltaMode == WheelEvent.DOM_DELTA_PAGE) {
				if (e2.deltaX != 0) {
					wheelScale = viewWidthSym.value();
				} else {
					wheelScale = height;
				}
			} else {
				wheelScale = 1;
			}

			var followMouse = root.lookup("mouseFollow").value();
			if (e2.deltaY != 0 && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();
				root.beginAutocalcOff();
				var deltaY = -e2.deltaY * wheelScale;
				if (root.lookup("touchPinchEnabled").value()) {
					//Construal handles zoom gesture itself.
					var pinchSym = root.lookup("touchPinch");
					var touchPinchValue = pinchSym.value();
					touchPinchValue = touchPinchValue + deltaY;
					pinchSym.assign(touchPinchValue, Symbol.hciAgent, followMouse);
				} else {
					//Zoom on pinch gesture or Ctrl + mouse wheel.
					var zoom = zoomSym.value();
					zoom = zoom * (height + 2 * deltaY) / height;
					if (zoom < 0.05) {
						zoom = 0.05;
					}
					zoomSym.assign(zoom, Symbol.hciAgent, followMouse);
				}
				root.endAutocalcOff();
				return;
			}

			if (!root.lookup("mouseWheelEnabled").value()) {
				return;
			}

			root.beginAutocalcOff();
			if (e2.deltaY !== 0) {
				if (!e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
					e.preventDefault();
					e.stopPropagation();
					var mouseWheelSym = root.lookup("mouseWheel");
					var mouseWheelValue = mouseWheelSym.value();
					var deltaY = e2.deltaY * wheelScale;
					mouseWheelValue = mouseWheelValue + deltaY;
					mouseWheelSym.assign(mouseWheelValue, Symbol.hciAgent, followMouse);
					root.lookup("mouseWheelVelocity").assign(deltaY, Symbol.hciAgent, followMouse);
				}
			}
			if (e2.deltaX !== 0) {
				e.preventDefault();
				e.stopPropagation();
				var touchPanXSym = root.lookup("touchPanX");
				var touchPanXValue = touchPanXSym.value();
				var deltaX = e2.deltaX * wheelScale;
				touchPanXValue = touchPanXValue + deltaX;
				touchPanXSym.assign(touchPanXValue, Symbol.hciAgent, followMouse);
				root.lookup("touchPanXSpeed").assign(deltaX, Symbol.hciAgent, followMouse);
			}
			root.endAutocalcOff();

		}).on("mouseout", function (e) {
			mouseInfo.insideCanvas = false;
			var followMouse = root.lookup("mouseFollow").value();
			root.lookup("mouseZone").assign(undefined, Symbol.hciAgent, followMouse);
		
		}).on("mouseenter", function (e) {
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

					buttonsSym.assign(buttonsStr, Symbol.hciAgent, followMouse);
					root.lookup("mouseButton").assign("Enter window", Symbol.hciAgent, followMouse);				

					var pressedSym = root.lookup("mousePressed");
					if (pressedSym.value() != mouseInfo.leftButton) {
						pressedSym.assign(mouseInfo.leftButton, Symbol.hciAgent, followMouse);
					}
					if (prevButtons == "" && buttonsStr != "") {
						root.lookup("mouseDown").assign(undefined, Symbol.hciAgent, followMouse);
						root.lookup("mouseDownView").assign(undefined, Symbol.hciAgent, followMouse);
					}
					root.endAutocalcOff();
				}
			}
		
		}).on("mousemove",function(e) {
			newMouseMovement = true;
			var followMouse = root.lookup("mouseFollow").value();
			root.beginAutocalcOff();

			var viewSym = root.lookup('mouseView');
			var positionSym = root.lookup('mousePosition');
			var x, y, previousX, previousY;
			var previousView = viewSym.value();
			var previousPosition = positionSym.value();
			if (previousPosition) {
				previousX = previousPosition.x;
				previousY = previousPosition.y;
			}
			
			var scale = root.lookup("_view_" + canvasName + "_scale").value();
			var zoom = root.lookup("_view_" + canvasName + "_zoom").value();
			var combinedScale = scale * zoom;

			if (mouseInfo.capturing) {
				var e2 = e.originalEvent;
				x = previousX + e2.movementX / combinedScale;
				y = previousY + e2.movementY / combinedScale;
			} else {
				var windowPos = $(this).offset();
				x = (e.pageX - Math.round(windowPos.left)) / combinedScale;
				y = (e.pageY - Math.round(windowPos.top)) / combinedScale;

				var offset = root.lookup("_view_" + canvasName + "_offset").value();
				if (offset instanceof Point) {
					x = x - offset.x;
					y = y - offset.y;
				}
			}

			viewSym.assign(canvasName, Symbol.hciAgent, followMouse);
			var mousePos = new Point(x, y);
			positionSym.assign(mousePos, Symbol.hciAgent, followMouse);

			var deltaTime;
			var now = Date.now();
			if (previousView == canvasName && mouseVelocityTimestamp !== undefined) {
				deltaTime = now - mouseVelocityTimestamp;

				if (deltaTime >= me.mouseVelocitySampleTime) {
					var velocitySym = root.lookup("mouseVelocity");
					var previousVelocity = velocitySym.value();
					var velocityX = (x - previousX) * 1000 / deltaTime;
					var velocityY = (y - previousY) * 1000 / deltaTime;
					if (previousVelocity) {
						var dampening = me.mouseVelocityDampening;
						var previousVelocityX = previousVelocity.x;
						if ((velocityX > 0 && previousVelocityX > 0) ||
							(velocityX < 0 && previousVelocityX < 0)) {
							velocityX = dampening * previousVelocityX + (1 - dampening) * velocityX;
						}
						var previousVelocityY = previousVelocity.y;
						if ((velocityY > 0 && previousVelocityY > 0) ||
							(velocityY < 0 && previousVelocityY < 0)) {
							velocityY = dampening * previousVelocityY + (1 - dampening) * velocityY;
						}
					}
					velocityX = Math.ceil(velocityX * combinedScale) / combinedScale;
					velocityY = Math.ceil(velocityY * combinedScale) / combinedScale;
					var mouseVelocity = new Point(velocityX, velocityY);
					velocitySym.assign(mouseVelocity, Symbol.hciAgent, followMouse);
					mouseVelocityTimestamp = now;
				}
			} else {
				//Mouse has just entered the canvas.
				mouseVelocityTimestamp = now;
			}

			var drawableHit = me.findDrawableHit(canvasName, x, y, false, false);
			var zoneHit;
			if (drawableHit === undefined) {
				zoneHit = undefined;
			} else {
				zoneHit = drawableHit.name;
			}
			var zoneSym = root.lookup("mouseZone");
			var previousZone = zoneSym.value();
			if (zoneHit !== previousZone) {
				zoneSym.assign(zoneHit, Symbol.hciAgent, followMouse);
			}
			
			root.endAutocalcOff();

		}).on("keyup", function (e) {
			var keyCode = e.which;
			var handled = false;
			if (e.altKey && !e.shiftKey && !e.ctrlKey) {
				//Zooming using Alt+, Alt- and Alt0
				var zoomSym = root.lookup("_view_" + canvasName + "_zoom");
				var zoom = zoomSym.value();
				if (keyCode == 61 || keyCode == 187) {
					//Alt + =
					zoom = zoom * 1.25;
					handled = true;
				} else if (keyCode == 173 || keyCode == 189) {
					//Alt + -
					zoom = zoom / 1.25;
					handled = true;
				} else if (keyCode == 48) {
					//Alt + 0
					zoom = 1;
					handled = true;
				}
				zoomSym.assign(zoom, Symbol.hciAgent);
			}
			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		});

		$('<div id="'+name+'"></div>')
		.html(code_entry)
		.dialog({
			title: mtitle,
			width: initialWidth + edenUI.scrollBarSize,
			height: initialHeight + edenUI.titleBarHeight,
			minHeight: 120,
			minWidth: 230,
			dialogClass: "unpadded-dialog"
		});
		viewData = {
			confirmClose: true,
			destroy: function () {
				var elementsHashtable = canvasNameToElements[canvasName];
				for (var hash in elementsHashtable) {
					var elementList = elementsHashtable[hash];
					for (var i = 0; i < elementList.length; i++) {
						var element = elementList[i];
						//Preserve jQuery events
						$(element).detach();
					}
				}
				delete canvases[canvasName];
				delete contents[canvasName];
			},
			resize: function (width, height) {
				var offset = offsetSym.value();
				var offsetX, offsetY;
				if (offset instanceof Point) {
					offsetX = offset.x;
					offsetY = offset.y;
				} else {
					offsetX = 0;
					offsetY = 0;
				}
				var zoom = zoomSym.value();

				var canvas = document.getElementById(name + "-canvas");
				var redraw = false;

				/*The if redraw = true stuff is necessary because setting the width or height has the side
				 *effect of erasing the canvas.  If the width or height are defined by dependency
				 *then this method gets called whenever that dependency is re-evaluated, even if the
				 *recalculated value is the same as the old one, which previously resulted in a
				 *noticeable flicker effect.
				 */
				var neededWidth, neededHeight;
				var prescribedWidth = widthSym.value();
				if (prescribedWidth === undefined) {
					if (zoom > 1) {
						neededWidth = Math.ceil(width * zoom);
					} else {
						neededWidth = Math.floor(width);
					}
					if (canvas.width != neededWidth) {
						canvas.width = neededWidth;
						redraw = true;
					}
				} else {
					prescribedWidth = Math.ceil(prescribedWidth * scaleSym.value() * zoom + offsetX);
				}

				if (heightSym.value() === undefined) {
					if (zoom > 1) {
						neededHeight = Math.ceil(height * zoom);
					} else {
						neededHeight = height;
						if (prescribedWidth !== undefined && prescribedWidth > neededHeight) {
							neededHeight = neededHeight - edenUI.scrollBarSize
						}
						var neededHeight = Math.floor(neededHeight - 1);
					}
					if (neededHeight != canvas.height) {
						canvas.height = neededHeight;
						redraw = true;
					}
				}
				if (redraw) {
					me.drawPicture(canvasName);
				}
			}
		};
		me.drawPicture(canvasName);
		return viewData;
	}

	root.lookup("mouseDownZone").addJSObserver("recordClick", function (symbol, zone) {
		if (eden.isValidIdentifier(zone)) {
			var clickSym = root.lookup(zone + "_click");
			if (clickSym.value() === false) {
				clickSym.assign(true, Symbol.hciAgent, true);
			}
		}
	});
	
	this.endClick = function () {
		var zoneDown = root.lookup("mouseDownZone").value();
		if (eden.isValidIdentifier(zoneDown)) {
			var clickSym = root.lookup(zoneDown + "_click");
			if (clickSym.value() === true) {
				clickSym.assign(false, Symbol.hciAgent, true);
			}
		}
	};

	this.canvasNameFromElement = function (element) {
		while (element) {
			var id = element.id;
			if (id.slice(-21) == "-dialog-canvascontent") {
				return id.slice(0, -21);
			}
			element = element.parentElement;
		}
		return null;
	};

	//To catch when a mouse button is pressed down over a canvas window and then released outside of any
	//canvas window.
	document.addEventListener("mouseup", function (e) {
		var followMouse = root.lookup("mouseFollow").value();
		root.beginAutocalcOff();

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
				root.lookup('mouseView').assign(undefined, Symbol.hciAgent, followMouse);
				edenUI.plugins.Canvas2D.endClick();
			}
		}
		root.endAutocalcOff();
	});

	document.addEventListener("mousedown", function (e) {
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
		mouseInfo.capturing = locked;
		var followMouse = root.lookup("mouseFollow").value();
		root.lookup("mouseCaptured").assign(locked, undefined, followMouse);
	});

	edenUI.views["Canvas2D"] = {dialog: this.createDialog, title: "Canvas 2D", category: edenUI.viewCategories.visualization, holdsContent: true};
	edenUI.eden.include("plugins/canvas-html5/canvas.js-e", success);
};

EdenUI.plugins.Canvas2D.FillStyle = function () {
	//Abstract superclass.
}

EdenUI.plugins.Canvas2D.Transform = function () {
	//Abstract superclass.
}

EdenUI.plugins.Canvas2D.title = "Canvas 2D";
EdenUI.plugins.Canvas2D.description = "Provides the ability to draw two-dimensional shapes, images, text and user interface controls using EDEN dependencies.";
