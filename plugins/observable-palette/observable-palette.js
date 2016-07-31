/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

EdenUI.plugins.ObservablePalette = function(edenUI, success) {
	var me = this;

	var widgetCounter = 0;
	var observableSearchCache = {};

	function canHaveUI(symbol) {
		var value = symbol.value();
		return typeof(value) != "function" || !/\breturn\s+([^\/;]|(\/[^\/*]))/.test(value.toString());
	}

	function autocompleteObservable(request, callback) {
		var searchStr = request.term;
		var results = observableSearchCache[searchStr];
		if (results === undefined) {
			var re = new RegExp("^" + searchStr);
			results = [];
			for (var name in root.symbols) {
				if (re.test(name) && canHaveUI(root.symbols[name])) {
					results.push(name);
				}
			}
			observableSearchCache[searchStr] = results;
		}
		callback(results);
	}

	root.addGlobal(function (folder, symbol, create) {
		if (create && canHaveUI(symbol)) {
			var name = symbol.name.slice(1);
			for (var search in observableSearchCache) {
				if ((new RegExp("^" + search)).test(name)) {
					observableSearchCache[search].push(name);
				}
			}
		}
	});

	function getWidgetNumber() {
		var current = widgetCounter;
		widgetCounter++;
		return current;
	}

	function makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly) {
		var maxHeadingLength = 128;
		if (obsPanel) {
			if (obsPanel.hasClass("ui-accordion")) {
				obsPanel.accordion("destroy")
			}
			obsPanel.html("");
		} else {
			obsPanel = $('<div class="observable-palette-obs-box observable-palette-visible" data-observable="' + obsName + '"></div>');
			if (readOnly) {
				obsPanel.data("editor", "read-only");
			}
		}

		var root = edenUI.eden.root;
		var symbol = root.lookup(obsName);
		var initialValue = symbol.value();
		var dataType = typeof(initialValue);
		var longValue = dataType == "string";
		var needsPanel = !readOnly || longValue;
		var edenDefinition = symbol.definition;
		var jsObserver;

		if (!readOnly && edenDefinition !== undefined) {
			var defsource = edenDefinition.getFullSource();
			console.log(defsource);
			//var match = defsource.match(/^\S+\s+is\s+(.*?);?$/)
			//rhs = match[1];
			rhs = defsource;
			dataType = "definition";
		}

		/* Create the collapsible heading.  There are 2 parts.  The observable name is on the left.
		 * The right-hand side toggles when clicked between showing the current value and a UI to
		 * alter the observable's type.
		 */
		var heading = $('<h3><span class="observable-palette-obs-heading">' + obsName + '</span> </h3>');
		if (readOnly) {
			obsPanel.addClass("observable-palette-dependency-value-box");
		}
		var headingRight = $('<div class="observable-palette-heading-right"></div>');
		heading.append(headingRight);
		obsPanel.append(heading);

		//Display the current value in the heading (possibly truncated).
		var valueStr = Eden.prettyPrintValue("", initialValue, maxHeadingLength, false, false);
		var headingHyperlink = $('<a>' + valueStr + '</a>');
		headingRight.append(headingHyperlink);

		//UI for altering the observable's type.
		var typeList = $('<select></select>');
		if (readOnly) {
			typeList.append('<option value="' + dataType + '">' + dataType[0].toUpperCase() + dataType.slice(1) + '</option>');
		} else {
			typeList.append('<option value="number">Number</option>');
			typeList.append('<option value="string">Text (String)</option>');
			typeList.append('<option value="boolean">Yes/No (Boolean)</option>');
			typeList.append('<option value="undefined">Undefined</option>');
		}
		typeList.append('<option value="hide">Hide</option>');
		typeList[0].value = dataType;
		function changeType(event) {
			var value = event.target.value;
			if (value == "hide") {
				functions.remove(obsName, obsPanel, widgetNum);
				return;
			}

			var initValue;
			if (value == "boolean") {
				initValue = false;
			} else if (value == "number") {
				initValue = 0;
			} else if (value == "string") {
				initValue = "";
			}
			symbol.assign(initValue, Symbol.hciAgent, true);
		}
		typeList.on("change", changeType);

		//Event handlers for toggling between the two uses of the right side of the heading.
		headingRight.on("click", function (event) {
			event.stopPropagation();
		});
		headingHyperlink.on("click", function (event) {
			headingHyperlink.detach();
			headingRight.append(typeList);
			typeList.focus();
		});
		typeList.on("blur", function (event) {
			typeList.detach();
			headingRight.append(headingHyperlink);
		});

		var controlsPanel = $('<div></div>');

		if (dataType == "definition") {

			var definitionDiv = $('<div class="observable-palette-definition"></div>');
			//definitionDiv.append(obsName + ' is ');
			rhsSpan = $('<span class="observable-palette-definition-rhs" contenteditable="true"></span>');
			rhsSpan.append(Eden.htmlEscape(rhs));
			definitionDiv.append(rhsSpan);
			//definitionDiv.append(';');
			definitionDiv.on("click", function (event) {
				rhsSpan.focus();
				definitionDiv.addClass("focussed");
			});
			rhsSpan.on("blur", function (event) {
				definitionDiv.removeClass("focussed");
			});
			controlsPanel.append(definitionDiv);
			var commands = $('<div class="observable-palette-view-commands"> </div>');
			controlsPanel.append(commands);
			var expand = $('<a onclick="">Expand</a>');
			expand.click(function () {
				dependenciesDiv.find('.observable-palette-obs-box.ui-accordion').accordion("option", "active", 0);
			});
			var collapse = $('<a onclick="">Collapse</a>');
			collapse.click(function () {
				dependenciesDiv.find('.observable-palette-obs-box.ui-accordion').accordion("option", "active", false);
			});
			var hide = $('<a onclick="">Hide</a>');
			hide.click(function () {
				var obsBoxes = dependenciesDiv.find('.observable-palette-obs-box');
				obsBoxes.removeClass('observable-palette-visible');
				obsBoxes.slideUp();
			});
			var show = $('<a onclick="">Show</a>');
			show.click(function () {
				var obsBoxes = dependenciesDiv.find('.observable-palette-obs-box');
				obsBoxes.addClass('observable-palette-visible');
				obsBoxes.slideDown();
//TODO Re-add any that have been removed individually.
			});
			commands.append(expand);
			commands.append(collapse);
			commands.append(hide);
			commands.append(show);

			var dependenciesDiv = $('<div class="observable-palette-dependencies"></div>');
			dependenciesDiv.sortable({
				connectWith: '.observable-palette-column',
				forcePlaceholderSize: true,
				handle: 'h3',
				items: '>.observable-palette-obs-box',
				placeholder: "observable-palette-drag-placeholder",
				tolerance: "pointer",
				receive: function (event, ui) {
					var item = ui.item;
					var droppedObsName = item.data("observable");
					if (!symbol.isDependentOn("/" + droppedObsName) ||
						(droppedObsName == obsName && item.data("editor") != "read-only")
					) {
						ui.sender.sortable("cancel");
					}
					if (dependenciesDiv.children('.observable-palette-visible').length == 2) {
						commands.slideDown();
					}
					functions.removeDuplicates(event.target, item);
				},
				remove: function (event, ui) {
					if (dependenciesDiv.children('.observable-palette-visible').length < 2) {
						commands.slideUp();
					}
				}
			});
			var dependencyPanel;
			var numDependencies = 0;
			for (var dependencyName in symbol.dependencies) {
				var dependency = symbol.dependencies[dependencyName];
				dependencyName = dependencyName.slice(1);
				if (dependency.definition === undefined) {
					dependencyPanel = makeUIForObservable(
						dialogName,
						dependencyName,
						getWidgetNumber(),
						undefined,
						functions,
						false
					);
					functions.register(dependencyName, dependencyPanel);
					dependenciesDiv.append(dependencyPanel);
					numDependencies++;
				} else {
//TODO handle dependencies defined in terms of dependencies.
					
				}
			}
			if (numDependencies < 2) {
				commands.hide();
			}

			jsObserver = function (symbol, value) {
				var newDefinition = symbol.definition;
				if (newDefinition === undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, false);
				} else {
					headingHyperlink.html(Eden.prettyPrintValue("", value, maxHeadingLength, false, false));
					if (newDefinition !== edenDefinition) {
//TODO adjust nested panels to match new definition
					
					}
				}
			};

			controlsPanel.append(dependenciesDiv);

			if (longValue) {
				var valueDisplay = makeUIForObservable(
					dialogName,
					obsName,
					getWidgetNumber(),
					undefined,
					functions,
					true
				);
				dependenciesDiv.append(valueDisplay);
			}

		} else if (dataType == "number") {

			//Create UI for a numeric observable.
			var initialMin, initialMax, initialStep;
			if (initialValue == 1 || initialValue == -1 || initialValue != Math.floor(initialValue)) {
				initialStep = 1 / 2000;
			} else {
				initialStep = 1;
			}
			if (initialValue == 0) {
				initialMin = 0;
				initialMax = 10;
			} else if (initialValue >= -1 && initialValue <= 1) {
				if (initialValue > 0) {
					initialMin = 0;
				} else {
					initialMin = -1;
				}
				initialMax = 1;
			} else if (initialValue < 0) {
				initialMin = initialValue * 2;
				var initialRemainder = Number((-initialValue % initialStep).toPrecision(14));
				if (initialRemainder != 0 && initialRemainder != initialStep) {
					initialMin = initialMin + initialRemainder - initialStep;
				}
				initialMax = initialMin + (initialValue - initialMin) * 2;
			} else {
				initialMin = 0;
				initialMax = Math.ceil((initialValue / initialStep).toPrecision(16)) * 2 * initialStep;
			}

			var sliderJQ = $('<input type="range" min="' + initialMin + '" max="' + initialMax +
				'" step="' + initialStep + '" value="' + initialValue + '" class="observable-palette-slider"/>');
			var slider = sliderJQ[0];

			sliderJQ.on("input", function (event) {
				symbol.assign(parseFloat(slider.value), Symbol.hciAgent, true);
			});

			var table = $('<table class="observable-palette-number-controls"></table>');
			var sliderRow = $('<tr></tr>');
			table.append(sliderRow);
			var sliderCell = $('<td colspan="3" class="observable-palette-left-cell observable-palette-right-cell observable-palette-slider-cell"></td>');
			sliderCell.append(sliderJQ);
			sliderRow.append(sliderCell);

			var limitsRow = $('<tr class="observable-palette-limits"></tr>');
			table.append(limitsRow);
			var minCell = $('<td class="observable-palette-advanced observable-palette-left-cell"></td>');
			var minInput = $('<input type="number" value="' + initialMin + '" step=' + initialStep + '" title="Smallest value"/>');
			var minElem = minInput[0];
			minCell.append(minInput);
			limitsRow.append(minCell);
			minInput.on("input", function (event) {
				var minStr = event.target.value;
				if (minStr != "") {
					var min = parseFloat(minStr);
					slider.min = minStr;
					var value = symbol.value();
					if (min >= 0 && value < min) {
						symbol.assign(min, Symbol.hciAgent, true);
					}
				}
			});
			var minStrOnEntry, valueStrOnEntry;
			var editingValue = false;
			minInput.on("focus", function (event) {
				minStrOnEntry = event.target.value;
			});
			minInput.on("blur", function (event) {
				var minStr = event.target.value;
				if (minStr == "") {
					event.target.value = minStrOnEntry;
					slider.min = minStrOnEntry;
				} else {
					var min = parseFloat(minStr);
					var max = parseFloat(slider.max);
					var step = parseFloat(slider.step);
					var newMax = min + Math.round((max - min) / step) * step;
					if (newMax <= min) {
						if (min > 0) {
							newMax = min + Math.ceil((min / step).toPrecision(16)) * step;
						} else {
							newMax = Math.ceil(((min / 2) / step).toPrecision(16)) * step;;
						}
						if (newMax < min + 10 * step) {
							newMax = min + 10 * step;
						}
					}
					slider.max = newMax;
					maxElem.value = newMax;
					var value = symbol.value();
					if (value < min) {
						symbol.assign(min, Symbol.hciAgent, true);
					}
				}
			});

			var centreCell = $('<td class="observable-palette-centre-cell"></td>');
			limitsRow.append(centreCell);
			var centreDiv = $('<div class="observable-palette-number-centre"></div>');
			centreCell.append(centreDiv);

			var valueLabel = $('<label><span class="observable-palette-label">Value&nbsp;</span></label>');
			centreDiv.append(valueLabel);
			var valueInput = $('<input type="number" value="' + initialValue + '" step=' + initialStep + '"/>');
			var valueElem = valueInput[0];
			valueLabel.append(valueInput);
			valueInput.on("input", function (event) {
				var valueStr = event.target.value;
				if (valueStr != "") {
					slider.value = valueStr;
					symbol.assign(parseFloat(valueStr), Symbol.hciAgent, true);
				}
			});
			valueInput.on("focus", function (event) {
				editingValue = true;
				valueStrOnEntry = event.target.value;
			});
			valueInput.on("blur", function (event) {
				var valueStr = event.target.value;
				if (valueStr == "") {
					symbol.assign(parseFloat(valueStrOnEntry), Symbol.hciAgent, true);
				} else {
					var value = symbol.value();
					var min = parseFloat(slider.min);
					if (value < min) {
						minElem.value = value;
						slider.min = value;
					}
					slider.value = value;
				}
				editingValue = false;
			});

			var maxCell = $('<td  class="observable-palette-advanced observable-palette-right-cell"></td>');
			var maxInput = $('<input type="number" value="' + initialMax + '" step=' + initialStep + '" title="Biggest value"/>');
			var maxElem = maxInput[0];
			maxCell.append(maxInput);
			limitsRow.append(maxCell);
			maxInput.on("input", function (event) {
				slider.max = event.target.value;
			});

			var stepLabel = $('<label class="observable-palette-advanced"><span class="observable-palette-label observable-palette-step-label">Step&nbsp;</span></label>');
			centreDiv.append(stepLabel);
			var stepInput = $('<input type="number" value="' + initialStep + '" min="0" title="Slider step size"/>');
			var stepElem = stepInput[0];
			stepElem.acceptedValue = initialStep;
			stepLabel.append(stepInput);
			stepInput.on("input", function (event) {
				var newStep = parseFloat(stepElem.value);
				if (newStep > 0) {
					var newStepInt = Math.floor(newStep);
					var stepStep;
					if (newStep == newStepInt) {
						var match = String(newStep).match(/(0*)$/);
						stepStep = Math.pow(10, match[1].length);
					} else {
						stepStep = Math.pow(10, -((newStep - newStepInt).toPrecision(15).replace(/0*$/, "").length - 2));
					}
					if (newStep == stepStep && newStep < stepElem.acceptedValue) {
						stepStep = stepStep / 10;
					}
					stepElem.acceptedValue = newStep;
					stepElem.step = stepStep;
				}
			});
			stepInput.on("blur", function (event) {
				var newStep = parseFloat(stepElem.value);
				if (newStep == 0) {
					stepElem.value = 1;
					stepElem.acceptedValue = 1;
				} else if (newStep < 0 || isNaN(newStep)) {
					stepElem.value = stepElem.acceptedValue;
				} else {
					slider.step = newStep;
					minElem.step = newStep;
					maxElem.step = newStep;
					valueElem.step = newStep;
				}
			});

			jsObserver = function (symbol, value) {
				if (typeof(value) != "number" || symbol.definition !== undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly);
				} else {
					headingHyperlink.html(Eden.prettyPrintValue("", value, maxHeadingLength, false, false));
					if (!editingValue) {
						var min = parseFloat(slider.min);
						var max = parseFloat(slider.max);
						var step = parseFloat(slider.step);
						var newMin, newMax, remainder;
						if (value < min) {
							if (value == 0) {
								newMin = 0;
							} else if (value > 0) {
								newMin = Math.ceil((value / 2) / step) * step - step;
								remainder = Number((value % step).toPrecision(14));
								if (remainder != 0 && remainder != step) {
									newMin = newMin + remainder;
								}
							} else {
								newMin = value * 2;
								remainder = Number((-value % step).toPrecision(14));
								if (remainder != 0 && remainder != step) {
									newMin = newMin + remainder - step;
								}
							}
							slider.min = newMin;
							minElem.value = newMin;
							newMax = newMin + Math.round((max - newMin) / step) * step;
							slider.max = newMax;
							maxElem.value = newMax;
						} else if (value > max) {
							newMax = min + Math.ceil(((value - min) / step).toPrecision(16)) * 2 * step;
							slider.max = newMax;
							maxElem.value = newMax;
						}
						slider.value = value;
						valueElem.value = value;
					}
				}
			};

			controlsPanel.append(table);

		} else if (dataType == "boolean") {

			//Create UI for a Boolean observable.
			var checkboxJQ = $('<input type="checkbox"/>');
			var checkbox = checkboxJQ[0];
			var labelJQ = $('<span class="bool_text"></span>');

			function setLabel(bool) {
				labelJQ.fadeOut(250, "linear", function () {
					if (bool) {
						labelJQ.html("true");
						labelJQ.css("color", "green");
					} else {
						labelJQ.html("false");
						labelJQ.css("color", "red");
					}
					labelJQ.fadeIn(400, "swing", function () {
						headingHyperlink.html(bool? "true" : "false");
					});
				});
			}
			checkboxJQ.on("change", function (event) {
				var value = checkbox.checked;
				symbol.assign(value, symbol.hciAgent, true);
			});
			jsObserver = function (symbol, value) {
				if ((value !== true && value !== false) || symbol.definition !== undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly);					
				} else {
					checkbox.checked = value;
					setLabel(value);
				}
			}
			setLabel(initialValue);
			var labelWrapper = $('<label class="observable-palette-bool"></label>');
			labelWrapper.append(checkboxJQ);
			labelWrapper.append(labelJQ);
			controlsPanel.append(labelWrapper);

		} else if (dataType == "string") {

			//Create UI for a string observable.
			var textboxJQ = $('<textarea class="string-input">' + initialValue + '</textarea>');
			var textbox = textboxJQ[0];

			textboxJQ.on("input", function (event) {
				var value = textbox.value;
				symbol.assign(value, Symbol.hciAgent, true);
				textbox.style.height = "";
				textbox.style.height = String(textbox.scrollHeight + 4) + "px";
			});

			jsObserver = function (symbol, value) {
				if (typeof(value) != "string" || symbol.definition !== undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly);
				} else {
					textbox.value = value;
					textbox.rows = value.split("\n").length;
					headingHyperlink.html(Eden.prettyPrintValue("", value, maxHeadingLength, false, false));
				}
			};
			controlsPanel.append($('<div class="quote left-quote">&ldquo;</div>'));
			controlsPanel.append(textboxJQ);
			controlsPanel.append($('<div class="quote right-quote">&rdquo;</div>'));

		} else if (dataType == "undefined") {

			//Create UI for undefined observable.
			controlsPanel.append($('<p><span class="result_name">' + obsName + '</span> is currently undefined.</p>'));
			if (!readOnly) {
				var typeList2 = typeList.clone();
				typeList2[0].value = "undefined";
				typeList2.on("change", changeType);

				var label = $('<label>Choose type: </label>');
				label.append(typeList2);
				var div = $('<div></div>');
				div.append(label);
				controlsPanel.append(div);
			}

			jsObserver = function (symbol, value) {
				if (value !== undefined || symbol.definition !== undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly);
				}
			};

		} else {

			jsObserver = function (symbol, value) {
				if (value !== undefined || symbol.definition !== undefined) {
					makeUIForObservable(dialogName, obsName, widgetNum, obsPanel, functions, readOnly);
				}
			};
		}

		symbol.addJSObserver(dialogName + "/" + obsName + "/" + widgetNum, jsObserver);

		if (needsPanel) {
			if (readOnly) {
				controlsPanel.find("input, textarea").attr("readonly", "readonly");
			}
			obsPanel.append(controlsPanel);
			obsPanel.accordion({
				active: dataType == "undefined"? false : undefined,
				collapsible: true,
				heightStyle: "content"
			});
		} else {
			heading.addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all observable-palette-static-header");
		}
		obsPanel.removeFromDialog = function () {
			functions.remove(obsName, obsPanel, widgetNum);
		};
		return obsPanel;
	}

	function resizeColumn(event, ui) {
		event.target.style.minWidth = ui.size.width + "px";
	}

	this.createDialog = function(dialogName, mtitle) {
		var viewName = dialogName.slice(0, -7);
		var agent = root.lookup("createView");
		var content = $('<div class="observable-palette" id="' + dialogName + '"></div>');

		//Map observable names to their panel.
		var observablePanels = {};

		//Create the UI for typing in new observable names, etc.
		var searchBox = $('<input type="text" class="observable-palette-search-box" placeholder="observable name"/>');
		var searchBoxElem = searchBox[0];
		searchBox.on("keyup", function (event) {
			if (event.which == 13) {
				addObservable(searchBoxElem.value, 0, false);
				searchBoxElem.value = "";
			}
		});
		searchBox.autocomplete({
			minLength: 2,
			source: autocompleteObservable,
		});

		var addButton = $('<button type="button">+</button>');
		addButton.click(function () {
			addObservable(searchBoxElem.value, 0, false);
			searchBoxElem.value = "";
		});

		var removeButton = $('<button type="button">-</button>');
		removeButton.on("click", function (event) {
			removeAllInstances(searchBoxElem.value);
			searchBoxElem.value = "";
		});

		var advancedLabel = $('<label></label>');
		var advancedCheckbox = $('<input type="checkbox"/>');
		var advancedCheckboxElem = advancedCheckbox[0];
		advancedLabel.append(advancedCheckbox);
		advancedLabel.append(" Advanced");
		var advancedSym = root.lookup("_view_" + viewName + "_advanced");
		var initialAdvanced = advancedSym.value();
		if (initialAdvanced === undefined) {
			advancedSym.assign(false, agent);
			content.addClass("observable-palette-no-advanced");
		} else if (!initialAdvanced) {
			content.addClass("observable-palette-no-advanced");
		}
		advancedSym.addJSObserver("repaintView", function (symbol, value) {
			content.toggleClass("observable-palette-no-advanced", !value);
			advancedCheckboxElem.checked = value;
		});
		advancedCheckbox.on("change", function (event) {
			advancedSym.assign(event.target.checked, agent);
		});

		var toolbox = $('<div class="observable-palette-toolbox"></div>');
		toolbox.append(searchBox);
		toolbox.append(addButton);
		toolbox.append(removeButton);
		toolbox.append(advancedLabel);

		//Create columns
		var columns = [];
		var numColumns = 7;
		var observablesSym = root.lookup("_view_" + viewName + "_observables");
		var initialObservableColumns = observablesSym.value();
		if (Array.isArray(initialObservableColumns)) {
			if (initialObservableColumns.length > 0 && !Array.isArray(initialObservableColumns[0])) {
				initialObservableColumns = [initialObservableColumns];
			}
			if (initialObservableColumns.length > numColumns) {
				numColumns = initialObservableColumns.length;
			}
		}

		for (var i = 0; i < numColumns; i++) {
			var column = $('<div class="observable-palette-column"></div>');
			column.sortable({
				connectWith: '.observable-palette-column, .observable-palette-dependencies',
				forcePlaceholderSize: true,
				handle: 'h3',
				items: '>.observable-palette-obs-box',
				placeholder: "observable-palette-drag-placeholder",
				scroll: false,
				tolerance: "pointer",
				receive: function (event, ui) {
					var col = event.target;
					var item = ui.item;
					removeDuplicates(col, item);
				},
			});
			if (i < numColumns - 1) {
				column.resizable({
					handles: "e",
					resize: resizeColumn,
				});
			}
			columns.push(column);
			content.append(column);
		}
		columns[0].append(toolbox);

		//Functions
		var functions = {
			register:			registerObservable,
			remove:				removeObservable,
			removeDuplicates:	removeDuplicates,
		};

		//parent elem, child jQuery
		function removeDuplicates(parent, child) {
			var obsName = child.data("observable");
			var childElem = child[0];
			var panelArr = observablePanels[obsName];
			//Ensure that the observable appears at most once in each column (unless nested).
			for (var j = 0; j < panelArr.length; j++) {
				var possiblePanel = panelArr[j];
				var possiblePanelElem = possiblePanel[0];
				if (possiblePanelElem !== childElem && possiblePanelElem.parentNode === parent) {
					possiblePanel.removeFromDialog();
					break;
				}
			}
		}

		//For recording nested panels
		function registerObservable(obsName, panel) {
			var panelArr = observablePanels[obsName];
			if (panelArr === undefined) {
				panelArr = [];
				observablePanels[obsName] = panelArr;
			}
			panelArr.push(panel);
		}

		function addObservable(obsName, columnNum, append) {
			if (!edenUI.eden.isValidIdentifier(obsName)) {
				return;
			}

			var panelArr = observablePanels[obsName];
			var panel;
			if (panelArr === undefined) {
				panelArr = [];
				observablePanels[obsName] = panelArr;
			} else {
				for (var i = 0; i < panelArr.length; i++) {
					var possiblePanel = panelArr[i];
					if (possiblePanel[0].parentNode === columns[columnNum][0]) {
						panel = possiblePanel;
						break;
					}
				}
			}
			function add(panel) {
				if (append) {
					// When initializing from _view_XXX_observables
					columns[columnNum].append(panel);
				} else {
					// When adding using the UI.
					if (columnNum == 0) {
						toolbox.after(panel);
					} else {
						columns[columnNum].prepend(panel);
					}
					panel.hide(0, "linear", function () {
						panel.slideDown(400);
					});
				}
			}

			if (panel === undefined) {
				panel = makeUIForObservable(
					dialogName,
					obsName,
					getWidgetNumber(),
					undefined,
					functions,
					false
				);
				panelArr.push(panel);
				add(panel);
			} else {
				panel.slideUp(400, "swing", function () {
					panel.detach();
					add(panel);
				});
			}
		}

		function removeObservable(obsName, panel, widgetNum) {
			var panelArr = observablePanels[obsName];
			if (panelArr !== undefined) {
				for (var i = 0; i < panelArr.length; i++) {
					if (panelArr[i] === panel) {
						panelArr.splice(i, 1);
					}
				}
			}
			root.lookup(obsName).removeJSObserver(dialogName + "/" + obsName + "/" + widgetNum);
			panel.slideUp(400, "swing", function () {
				panel.remove();
			});
		}

		function removeAllInstances(obsName) {
			var panelArr = observablePanels[obsName];
			if (panelArr) {
				var path = dialogName + "/" + obsName + "/";
				var pathLen = path.length;
				var sym = root.lookup(obsName);
				for (var name in sym.jsObservers) {
					if (name.slice(0, pathLen) == path) {
						sym.removeJSObserver(name);
					}
				}

				var newPanelArr = [];
				for (var i = 0; i < panelArr.length; i++) {
					var panel = panelArr[i];
					if (panel[0].parentNode.parentNode === content[0]) {
						panel.slideUp(400, "swing", function () {
							panel.remove();
						});
					} else {
						newPanelArr.push(panel);
					}
				}
				observablePanels[obsName] = newPanelArr;
			}
		}

		//Initialize the view.
		if (Array.isArray(initialObservableColumns)) {
			var hasWildcards = false;
			var searchLang = root.lookup("_view_" + viewName + "_search_language").value();
			var regExps = [];
			for (var col = 0; col < initialObservableColumns.length; col++) {
				var observablesColumn = initialObservableColumns[col];
				regExps[col] = [];
				if (Array.isArray(observablesColumn)) {
					for (var j = 0; j < observablesColumn.length; j++) {
						var searchStr = observablesColumn[j];
						if (edenUI.eden.isValidIdentifier(searchStr) && !/[\\*+?^$|({[]|(\s+or\s+)/i.test(searchStr)) {
							addObservable(searchStr, col, true);
						} else {
							var regExp = edenUI.regExpFromStr(searchStr, "", true, searchLang);
							regExps[col].push(regExp);
							hasWildcards = true;
						}
					}
				}
			}

			if (hasWildcards) {
				for (name in root.symbols) {
					for (var col = 0; col < regExps.length; col++) {
						var columnRegExps = regExps[col];
						for (var j = 0; j < columnRegExps.length; j++) {
							var regExp = columnRegExps[j];
							if (regExp.test(name)) {
								addObservable(name, col, true);
								break;
							}
						}
					}
				}
			}
		}

		content.dialog({
				title: mtitle,
				width: 260,
				height: 400 + edenUI.scrollBarSize,
		});
	};

	//Register the HTML view options
	edenUI.views["ObservablePalette"] = {dialog: this.createDialog, title: "Observable Palette", category: edenUI.viewCategories.interpretation};
	success();
};

/* Plugin meta information */
EdenUI.plugins.ObservablePalette.title = "Observable Palette";
EdenUI.plugins.ObservablePalette.description = "Provides the ability to change observables using a simple form.";
