/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */



/**
 * Support function to get the caret position within the syntax highlighted
 * div. Used when clicking or selecting the highlighted script.
 */
function getCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.endContainer, range.endOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}



/**
 * Support function to get the start of a selection of the highlighted script.
 */
function getStartCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
	    sel = win.getSelection();
	    if (sel.rangeCount > 0) {
	        var range = win.getSelection().getRangeAt(0);
	        var preCaretRange = range.cloneRange();
	        preCaretRange.selectNodeContents(element);
	        preCaretRange.setEnd(range.startContainer, range.startOffset);
	        caretOffset = preCaretRange.toString().length;
	    }
	} else if ( (sel = doc.selection) && sel.type != "Control") {
	    var textRange = sel.createRange();
	    var preCaretTextRange = doc.body.createTextRange();
	    preCaretTextRange.moveToElementText(element);
	    preCaretTextRange.setEndPoint("EndToEnd", textRange);
	    caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

 
/**
 * JS-Eden Interpreter Window Plugin.
 * Which is better than the one with all the widget cak.
 * @class Input Window Plugin
 */
EdenUI.plugins.ScriptInput = function(edenUI, success) {
	/* Plugin meta information */
	// TODO This should not be here
	EdenUI.plugins.ScriptInput.title = Language.ui.input_window.title;
	EdenUI.plugins.ScriptInput.description = Language.ui.input_window.description;

	var me = this;

	var closeInput = function(options) {
		var $dialog = options.$dialog;
		$dialog.dialog('close');
		//console.log("CLOSE");
		console.log(options);
	}

	var openInput = function(options) {

		var $dialog = options.$dialog;
		$dialog.dialog('open');
		$(options.editor.getInputField()).focus();
	}

	

	$(document.body).delegate(null, 'drop', function(e) {
		if (e.originalEvent.dataTransfer === undefined) return;
		var value = e.originalEvent.dataTransfer.getData("selector");
		if (!value || value == "") {
			console.log(e.originalEvent.dataTransfer.files);
			e.preventDefault();
			return;
		}

		var valsplit = value.sp;
		var viewname = value.replace(/[^a-zA-Z0-9]+/g,"");
		eden.root.lookup("view_"+viewname+"_tabs").assign([value], eden.root.scope, Symbol.hciAgent);
		edenUI.createView(viewname, "ScriptInput");
		eden.root.lookup("view_"+viewname+"_current").assign(0, eden.root.scope, Symbol.hciAgent);
	}).delegate(null, 'dragover', function(e) {
		e.preventDefault();
	});



	/**
	 * Common input window view constructor.
	 */
	this.createCommon = function (name, mtitle, code, embedded) {
		var $dialogContents = $(`<div class="inputdialogcontent">
<div class="agent-tabs handle"></div>
<div class="scriptsubcontent">
	<div class="inputhider">
		<div class="control-bar noselect">
		</div>
	</div>
</div>
<div class="info-bar"></div>
<div class="outputbox"></div>
</div></div>`);
		//var $optmenu = $('<ul class="input-options-menu"><li>Mode</li><li>Word-wrap</li><li>Spellcheck</li><li>All Leaves</li><li>All Options</li></ul>');		
		var position = 0;
		var inputhider = $dialogContents.find('.inputhider').get(0);
		var infobox = $dialogContents.find('.info-bar').get(0);
		//var suggestions = $dialogContents.find('.eden_suggestions');
		var $tabs = $dialogContents.find('.agent-tabs');
		var $controls = $dialogContents.find('.control-bar');
		var tabs = $tabs.get(0);
		var controls = $controls.get(0);
		//suggestions.hide();
		$(infobox).hide();

		var scriptarea = new EdenUI.ScriptArea();
		inputhider.appendChild(scriptarea.contents);

		var scrolltopline = 0;
		var scrolltime = undefined;
		inputhider.addEventListener("scroll", function(e) {
			if (scrolltime !== undefined) clearTimeout(scrolltime);
			if (document.activeElement === scriptarea.outdiv) return;

			scrolltime = setTimeout(function() {
				scrolltime = undefined;
				var stop = inputhider.scrollTop;
				stop = Math.floor((stop - 50) / 20);
				if (stop < 0) stop = 0;

				if (Math.abs(stop - scrolltopline) >= 50) {
					console.log("FORCE RE HIGHLIGHT", stop);
					scriptarea.highlighter.setScrollTop(stop);
					scrolltopline = stop;
					scriptarea.updateCachedHighlight();
				}
			}, 100);
		});

		var curtab = -1;
		var tab_queries = [];
		var tab_frags = [];
		//var readonly = false;

		var obs_tabix = "view_"+name+"_current";
		var obs_showtabs = "view_"+name+"_showtabs";
		var obs_showbuttons = "view_"+name+"_showbuttons";
		var obs_tabs = "view_"+name+"_tabs";
		var obs_zoom = "view_"+name+"_zoom";

		var tabsSym = eden.root.lookup(obs_tabs);
		var zoomSym = eden.root.lookup(obs_zoom);
		var curSym = eden.root.lookup(obs_tabix);
		var showTabsSym = eden.root.lookup(obs_showtabs);
		var showButtonsSym = eden.root.lookup(obs_showbuttons);

		var origin = { name: name };

		var rebuildtimer;
		var amtyping = false;
		//var rebuildinterval = 200;
		var tabscrollix = 0;
		var showhidden = false;
		var maxtabs = 3;
		var tabpositions = {};
		var browseDialog = undefined;
		var scratchnum = 1;

		function showTabs(sym, value) {
			if (value) {
				tabs.style.display = "flex";
				inputhider.parentNode.style.top = "35px";
			} else {
				tabs.style.display = "none";
				inputhider.parentNode.style.top = "0";
			}
		}
		if (showTabsSym.value() === undefined && showTabsSym.definition === undefined) {
			showTabsSym.assign(true, eden.root.scope, Symbol.defaultAgent);
		}
		showTabsSym.addJSObserver("scriptview_"+name, showTabs);
		showTabs(showTabsSym, showTabsSym.value());


		function showButtons(sym, value) {
			if (value) {
				controls.style.display = "flex";
				//inputhider.parentNode.style.top = "35px";
			} else {
				controls.style.display = "none";
				//inputhider.parentNode.style.top = "0";
			}
		}
		if (showButtonsSym.value() === undefined && showButtonsSym.definition === undefined) {
			showButtonsSym.assign(true, eden.root.scope, Symbol.defaultAgent);
		}
		showButtonsSym.addJSObserver("scriptview_"+name, showButtons);
		showButtons(showButtonsSym, showButtonsSym.value());
		

		function curChanged(sym, value) {
			if (typeof value == "number" && value >= 0 && value < tab_frags.length) {
				if (curtab != value) {
					curtab = value;
					scriptarea.setFragment(tab_frags[curtab]);
				}
				rebuildTabs();
			} else {
				rebuildTabs();

				// Show the script browser
				if (value == -1) {
					curtab = -1;
					scriptarea.setFragment(undefined);
					browseScripts("");
				}
			}
			updateControls();
		}

		function tabsChanged(sym, value) {
			if (Array.isArray(value)) {
				//for (var i=0; i<tab_frags.length; i++) {
				//	tab_frags[i].unlock();
				//}
				var oldqs = tab_queries;
				tab_queries = edenCopy(value);
				var oldfrags = tab_frags;

				var removed = oldfrags.filter(function(e) {
					return value.indexOf(e.selector) == -1;
				});

				for (var i=0; i<removed.length; i++) {
					removed[i].destroy();
					console.log("REMOVE FRAG",removed[i].selector);
				}

				//console.log("OLDFRAGS",oldfrags);

				tab_frags = [];
				for (var i=0; i<value.length; i++) {
					var oldix = oldqs.indexOf(value[i]);
					if (oldix >= 0) {
						tab_frags.push(oldfrags[oldix]);
					} else {
						tab_frags.push(new Eden.Fragment(value[i]));
					}
				}

				curtab = -2;
				curChanged(curSym, curSym.value());
			}
		}

		curSym.addJSObserver("scriptview_"+name, curChanged);
		//curChanged(curSym, curSym.value());
		tabsSym.addJSObserver("scriptview_"+name, tabsChanged);
		tabsChanged(tabsSym, tabsSym.value());

		if (tabsSym.value() === undefined && tabsSym.definition === undefined) {
			tabsSym.assign([], eden.root.scope, Symbol.defaultAgent);
		}

		if (curSym.value() === undefined && curSym.definition === undefined) {
			curSym.assign(-1, eden.root.scope, Symbol.defaultAgent);
		}


		Eden.Fragment.listenTo("changed", scriptarea, function(frag) {
			if (frag === tab_frags[curtab]) {
				//curChanged(curSym, curSym.value());
				rebuildTabs();
				updateControls();
				//scriptarea.setFragment(tab_frags[curtab]);
				scriptarea.refresh();
			}
		});

		Eden.Fragment.listenTo("locked", scriptarea, function(frag) {
			if (frag === tab_frags[curtab]) {
				console.log("LOCKED",frag);
				curChanged(curSym, curSym.value());
			}
		});

		Eden.Fragment.listenTo("unlocked", scriptarea, function(frag) {
			if (frag === tab_frags[curtab]) {
				curChanged(curSym, curSym.value());
			}
		});

		Eden.Fragment.listenTo("errored", scriptarea, function(frag) {
			//if (frag === tab_frags[curtab]) {
				//rebuildTabs();
				//delayRebuild();
			//}
		});

		Eden.Fragment.listenTo("status", scriptarea, function(frag) {
			if (frag === tab_frags[curtab]) {
				//rebuildTabs();
				//delayRebuild();
				//setTitle(tab_frags[curtab].title);
				rebuildTabs();
				updateControls();
			}
		});

		Eden.Fragment.listenTo("gotoline", scriptarea, function(frag, line) {
			for (var i=0; i<tab_frags.length; i++) {
				if (frag === tab_frags[i]) {
					console.log("I have the goto frag");
					if (curtab != i) curSym.assign(i, eden.root.scope, Symbol.localJSAgent);
					scriptarea.gotoLine(line);
					// Scroll to correct place
					var scrollto = 50 + (line-5) * 20;
					if (scrollto < 0) scrollto = 0;
					inputhider.scrollTop = scrollto;
					break;
				}
			}
		});

		//Initialise query
		if (eden.root.lookup("view_"+name+"_query").definition === undefined) {
			eden.execute("view_"+name+"_query is jseden_script_query;");
		}

		function browseScripts(path) {
			if (path == "") path = "*";
			var selector = eden.root.lookup("view_"+name+"_query").value();
			if (selector === undefined) selector = ".type(script).name";
			var scripts = Eden.Selectors.query(selector, "path,name,remote,executed,type"); //path + " .type(script).name:not(:remote)","id");
			scriptarea.outdiv.innerHTML = "";
			for (var i=0; i<scripts.length; i++) {
				var nname = scripts[i][1]
				//nname = nname[nname.length-1];
				var iconclass = "";
				var icon;
				if (nname == eden.project.name) {
					iconclass = " project";
					icon = "&#xf0f6;";
				} else if (nname == "ACTIVE") {
					iconclass = " root";
					icon = "&#xf0e7;";
				} else if (scripts[i][2]) {
					icon = "&#xf08e;";
				} else {
					switch(scripts[i][4]) {
					case "script"	: icon = "&#xf0f6;"; break;
					case "when"		: icon = "&#xf1ae;"; break;
					default			: icon = "&#xf128;";
					}
					if (scripts[i][3]) iconclass = " executed";
					else iconclass="";
				}
				var ele = $('<div class="browse-entry" data-path="'+scripts[i][0]+'"><div class="browse-icon'+iconclass+'">'+icon+'</div>'+nname+'</div>');
				scriptarea.outdiv.appendChild(ele.get(0));
			}

			var folder = {};
		}



		function updateControls() {
			if (curtab >= 0) {
				var html = '<button class="script-button script-run" title="Run the entire script"><span class="explorer-control-icon">&#xf04b;</span>Run</button>';

				var frag = tab_frags[curtab];

				if (frag && frag.scratch && !frag.edited) {
					html += '<span class="scratchsearch"><input type="text" class="scratchsearch" placeholder="Populate..."></input></span>';
				} else if (frag && frag.scratch) {
					//html += '<button class="script-button script-name"><span class="explorer-control-icon">&#xf02b;</span>Name</button>';
					html += '<span class="editname"><input type="text" class="editname" placeholder="Enter a name..."></input></span>';
				
				} else if (frag) {
					html += '<button class="script-button script-changes" title="Show recent changes"><span class="explorer-control-icon">&#xf044;</span>Edits</button>';
					html += '<button class="script-button script-details" title="Display or edit script properties"><span class="explorer-control-icon">&#xf013;</span>Details</button>';
				}

				$controls.html(html);
			} else {
				$controls.html("");
			}		
		}

		//updateHistoryButtons();


		
		function addTab(tabs, id, title, current, ix) {
			var tab = document.createElement("div");
			tab.style.left = ""+(ix*160)+"px";
			var classname = "agent-tab noselect";
			if (current) {
				classname += " agent-tab-current handle";
			} else {
				classname += " agent-tab-notcurrent";
			}

			var tabname = tab_frags[id].getTitle();
			if (tabname.length > 18) {
				tabname = "..."+tabname.slice(-15);
			}

			var iconclass;
			if (tab_frags[id] && tab_frags[id].ast) {
				if (tab_frags[id].ast.errors && tab_frags[id].ast.errors.length > 0) {
					iconclass = "tab-icon errored";
				} else if (tab_frags[id].originast && tab_frags[id].originast.executed) {
					iconclass = "tab-icon executed";
				} else {
					iconclass = "tab-icon";
				}
			} else {
				iconclass = "tab-icon noagent";
			}

			var icon = "&#xf1ae;";
			if (tab_frags[id].remote) icon = "&#xf08e;";
			else if (tab_frags[id].origin === undefined) icon = "&#xf0c3;";
			else if (tab_frags[id].locked) icon = "&#xf023;";


			tab.className = classname;
			tab.innerHTML = "<span class='"+iconclass+"'>"+icon+"</span>"+tabname+"<span class='close'>&#xf00d;</span>";
			tab.draggable = true;
			tab.setAttribute("data-index", id);
			/*if (tabs.childNodes.length < tabscrollix) {
				tab.style.display = "none";
			}*/
			tabs.appendChild(tab);
		}



		/**
		 * Generate the agent script tabs at the top. Needs to be re-run when
		 * new tabs are added or titles are changed.
		 */
		function rebuildTabs() {
			// Remove existing tabs
			while (tabs.firstChild) tabs.removeChild(tabs.firstChild);

			var curix = curSym.value();

			var browse = document.createElement("div");
			browse.className = "agent-tab-more";
			browse.innerHTML = "<span class='tab-icon2'>&#xf0c9;</span>";
			tabs.appendChild(browse);

			// Add scroll left
			if (tab_frags.length > 3 && curix != 0) {
				var left = document.createElement("div");
				left.className = "agent-tableft noselect";
				tabs.appendChild(left);
			}

			var tabcontainer = document.createElement("div");
			tabcontainer.className = "agent-tab-container";
			tabs.appendChild(tabcontainer);
			
			//var agents = tabsSym.value();
			//if (nstanceof Array) {
				
				//tab_asts = [];

				// For each entry, do a query to get the AST
				//for (var i=0; i<agents.length; i++) {
				//	var qres = Eden.Query.querySelector(agents[i]);
				//	if (qres && qres.length > 0) {
				//		tab_asts.push(qres[0]);
				//		if (qres[0] === scriptast) curix = tab_asts.length-1;
				//	}
				//}

				if (curix > tabscrollix+(maxtabs-1)) tabscrollix = curix-(maxtabs-1);
				if (curix < tabscrollix) tabscrollix = curix;

				for (var i=0; i<tab_frags.length; i++) {
					var title = tab_frags[i].getTitle();
					//if (Eden.Agent.agents[agents[i]]) {
					//	title = Eden.Agent.agents[agents[i]].title;
					//}
					if (tabscrollix <= i) {
						addTab(tabcontainer, i, title, i == curix, i);
					}
				}
			//}

			// Add new tab button
			var newtab = document.createElement("div");
			newtab.className = "agent-newtab noselect";
			newtab.style.left = ""+(tab_frags.length*160 + 20)+"px";
			tabcontainer.appendChild(newtab);

			if (tab_frags.length > 3 && curix != tab_frags.length-1) {
				// Add scroll right
				var right = document.createElement("div");
				right.className = "agent-tabright noselect";
				tabs.appendChild(right);
			}

			// Add dialog close
			var close = document.createElement("div");
			close.className = "script-input-windowcontrols";
			close.innerHTML = "<span class='windowcontrol'>&#xf00d;</span>";
			tabs.appendChild(close);
		}


		// Initialise sub title after dialog creation
		//setTimeout(function() { if (scriptast === undefined) setSubTitle("[No Scripts]"); }, 0);


		function zoom(sym, value) {
			if (value === undefined || value == 0) {
				$dialogContents.find(".inputCodeArea").css("transform", "");
			} else {
				var scalefactor;
				var translatefactor;
				var offsetfactor;
				if (value < 0) {
					scalefactor = (1.0 / (1+(Math.abs(value)/10))).toFixed(2);
					translatefactor = (((scalefactor-1) / 2) * 100).toFixed(2);
					offsetfactor = 20 * (scalefactor - 1);
				} else {
					scalefactor = (1+(Math.abs(value)/10)).toFixed(2);
					translatefactor = (((scalefactor-1) / 2) * 100).toFixed(2);
					offsetfactor = 20 * (scalefactor - 1);
				}
				$dialogContents.find(".inputCodeArea").css("transform", "translate("+translatefactor+"%,"+translatefactor+"%) scale("+scalefactor+","+scalefactor+")");
				//$dialogContents.find(".eden-gutter").css("transform", "translate("+translatefactor+"%,"+translatefactor+"%) scale("+scalefactor+","+scalefactor+")");
			}
		}



		// Use the agent wrapper for dealing with view interaction via symbols.

		function viewobs(obs) { return "view_"+name+"_"+obs; };
		// Associate observables with dialog
		var observables = [
			viewobs("tabs"),
			viewobs("current"),
			viewobs("showtabs"),
			viewobs("showbuttons"),
			viewobs("zoom")
		];
		$dialogContents.get(0).setAttribute("data-observables", observables.join(","));





		function hideInfoBox() {
			$(infobox).hide("fast");
		}



		function scrollToLine(line) {
			var area = $codearea.get(0);
			area.scrollTop = 15 + 20 * line - 100;
		}


		function onRun() {
			//if (scriptast) scriptast.execute(tab_frags[curtab]);
			if (curtab >= 0 && tab_frags[curtab]) {
				if (tab_frags[curtab].originast) {
					console.log("ONRUN",tab_frags[curtab].originast);
					tab_frags[curtab].ast.executeStatement(tab_frags[curtab].originast, 0, tab_frags[curtab]);
				} else {
					tab_frags[curtab].ast.execute(tab_frags[curtab]);
				}
				rebuildTabs();
			}
		}

		function onBrowse() {
			// A tab index of -1 means show script browser...
			curSym.assign(-1, eden.root.scope, Symbol.localJSAgent);
		}


		function onTabClick(e) {
			var name = e.currentTarget.getAttribute("data-index");
			curSym.assign(parseInt(name), eden.root.scope, Symbol.hciAgent);
			scriptarea.intextarea.focus();
		}

		function onTabClose(e) {
			var name = parseInt(e.currentTarget.parentNode.getAttribute("data-index"));
			if (name >= 0 && name < tab_frags.length) {
				var tabs = tabsSym.value();
				tabs.splice(name, 1);
				tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
				var curt = curSym.value();
				if (curt >= tabs.length) {
					curSym.assign(curt-1, eden.root.scope, Symbol.localJSAgent);
				}
			}
			e.stopPropagation();
		}



		function onTabLeft() {
			//if (scriptast === undefined) return;
			//var tab_asts = agent.state[obs_tabs];
			var ix = curtab;
			ix--;
			if (ix >= 0) {
				//curtab = ix;
				curSym.assign(ix, eden.root.scope, Symbol.hciAgent);
				//agent.state[obs_agent] = tabs[ix];
			}
		}

		function onTabRight() {
			//if (scriptagent === undefined) return;
			//var tabs = agent.state[obs_tabs];
			var ix = curtab; // tabs.indexOf(scriptagent.name);
			ix++;
			if (ix < tab_frags.length) {
				curSym.assign(ix, eden.root.scope, Symbol.hciAgent);
			}
		}


		function onNewTab() {
			var tabs = tabsSym.value();
			tabs.push("scratch"+scratchnum);
			scratchnum++;
			tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
			curSym.assign(tabs.length-1, eden.root.scope, Symbol.localJSAgent);
		}


		var dragSX;
		var dragSY;



		function onTabDragStart(e) {
			var index = parseInt(e.target.getAttribute("data-index"));
			var selector = tab_frags[index].selector;
			e.originalEvent.dataTransfer.setData("selector", selector);

			dragSX = e.originalEvent.offsetX;
			dragSY = e.originalEvent.offsetY;

			/*if (scriptagent.name == name) {
				scriptagent.setOwned(false);
				scriptagent = undefined;
				readonly = true;
				setSubTitle("[readonly]");
				//outdiv.className = "outputcontent readonly";
				changeClass(outdiv, "readonly", true);
				outdiv.contentEditable = false;
			}*/
		}

		function shiftTab(tabs, old_index, new_index) {
			while (old_index < 0) {
				old_index += tabs.length;
			}
			while (new_index < 0) {
				new_index += tabs.length;
			}
			if (new_index >= tabs.length) {
				var k = new_index - tabs.length;
				while ((k--) + 1) {
				    tabs.push(undefined);
				}
			}
			tabs.splice(new_index, 0, tabs.splice(old_index, 1)[0]);
			return tabs; // for testing purposes
		};

		/*function onDrag(e) {
			if (e.originalEvent.offsetX - dragSX < -50) {
				dragSX = e.originalEvent.offsetX;
				var value = e.originalEvent.srcElement.getAttribute("data-name");
				var tabs = agent.state[obs_tabs];
				var ix = tabs.indexOf(value);
				if (ix > 0) {
					tabs = shiftTab(tabs, ix, ix-1);
				}
				agent.state[obs_tabs] = tabs;
			} else if (e.originalEvent.offsetX - dragSX > 50) {
				dragSX = e.originalEvent.offsetX;
				var value = e.originalEvent.srcElement.getAttribute("data-name");
				var tabs = agent.state[obs_tabs];
				var ix = tabs.indexOf(value);
				if (ix < tabs.length-1) {
					tabs = shiftTab(tabs, ix, ix+1);
				}
				agent.state[obs_tabs] = tabs;
			}
		}*/

		function onTabDragOver(e) {
			e.preventDefault();
		}

		function onTabDrop(e) {
			e.stopPropagation();
			e.preventDefault();
			var value = e.originalEvent.dataTransfer.getData("selector");
			
			console.log("DROP");
			console.log(e);

			if (!value || value == "") {
				if (window.FileReader) {
					var files = e.originalEvent.dataTransfer.files;
					for (var i=0; i<files.length; i++) {
						var file = files[i];
						if (file.name.match(/.*\.jse|.*\.js-e/)) {
							var agentname = file.name.slice(0,-4);
							agentname = agentname.replace(/[\.\-\/\s]/g, "");
							agentname = "local/file/"+agentname;

							var reader = new FileReader();
							reader.onload = function(e2) {
								var ag = new Eden.Agent(undefined, agentname);
								ag.setSource(e2.target.result, false, -1);
								/*var tabs = agent.state[obs_tabs];
								if (tabs.indexOf(agentname) == -1) {
									tabs.push(agentname);
									agent.state[obs_tabs] = tabs;
								}*/
								agent.state[obs_agent] = agentname;
							}
							reader.readAsText(file);
						}
					}
				}
				return;
			}

			var tabs = tabsSym.value();
			if (tabs.indexOf(value) == -1) {
				tabs.push(value);
				tabsSym.assign(tabs,eden.root.scope,Symbol.hciAgent);
			}
		}

		function onTabDragEnd(e) {
			var index = parseInt(e.target.getAttribute("data-index"));
			var selector = tab_frags[index].selector;
			if (e.originalEvent.dataTransfer.dropEffect != 'none') {
				console.log("DRAGEND: " + selector);
				console.log(e);
				var tabs = tabsSym.value();
				var ix = tabs.indexOf(selector);
				if (ix >= 0) {
					tabs.splice(ix,1);
					ix--;
					if (ix < 0) ix = 0;
					if (ix < tabs.length) {
						//agent.state[obs_agent] = tabs[ix];
					}
					tabsSym.assign(tabs,eden.root.scope,Symbol.hciAgent);
				}
				if(tabs.length == 0) {
					//agent.state[obs_agent] = undefined;
				}
			} else {
				//agent.state[obs_agent] = value;
			}
		}



		function onInspect(e) {
			if (inspectmode) {
				disableInspectMode();
			} else {
				enableInspectMode();
			}
		}


		function onEnterLine(e) {
			var line = parseInt(e.target.getAttribute("data-line"));
			gutter.startHover(line);
		}

		function onLeaveLine(e) {
			var line = parseInt(e.target.getAttribute("data-line"));
			gutter.endHover(line);
		}

		function onShareAgent(e) {
			shareAgent(scriptagent.name);
		}


		function onScratchSearch(e) {
			var q = e.target.value;
			Eden.Selectors.query(q,"innersource", undefined, false, function(res) {
				scriptarea.intextarea.value = res.join("\n");
				tab_frags[curtab].setSourceInitial(scriptarea.intextarea.value);
				//scriptast = tab_frags[curtab].ast;
				//highlightContent(scriptast, -1, 0);
				//intextarea.focus();
				//checkScroll();

				scriptarea.highlighter.ast = scriptarea.fragment.ast;
				scriptarea.updateCachedHighlight();
			});
		}

		function onNameChange(e) {
			//setTitle(e.target.value);
			tab_frags[curtab].name = e.target.value;
			rebuildTabs();
		}

		function onNameFinish(e) {
			console.log("FINISH NAME",e.target.value);
			tab_frags[curtab].makeReal(e.target.value);
			
			var tabs = tabsSym.value();
			tabs[curtab] = tab_frags[curtab].selector;
			tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
		}

		function onBrowseClick(e) {
			var path = e.currentTarget.getAttribute("data-path");
			var tabs = tabsSym.value();
			var ix = tabs.indexOf(path);
			if (ix == -1) {
				tabs.push(path);
				tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
				curSym.assign(tabs.length-1, eden.root.scope, Symbol.localJSAgent);
			} else {
				curSym.assign(ix, eden.root.scope, Symbol.localJSAgent);
			}
		}


		function onShowChanges(e) {
			if (scriptarea.gutter.edits) {
				scriptarea.gutter.setDiffs(undefined);
				scriptarea.cachedhlopt = undefined;
				scriptarea.updateCachedHighlight();
			} else {
				scriptarea.makeDiff();
			}
		}

		function onShowDetails(e) {
			scriptarea.details.toggle();
		}


		$controls
		.on('keyup', 'input.editname', onNameChange)
		.on('change', 'input.editname', onNameFinish)
		.on('click', '.script-run', onRun)
		.on('click', '.script-changes', onShowChanges)
		.on('click', '.script-details', onShowDetails)
		.on('keyup', 'input.scratchsearch', onScratchSearch);


		// Set the event handlers
		$dialogContents
		.on('click', '.close', onTabClose)
		.on('click', '.agent-tab-more', onBrowse)
		.on('click', '.browse-entry', onBrowseClick)
		.on('click', '.agent-tab', onTabClick)
		.on('click', '.agent-tableft', onTabLeft)
		.on('click', '.agent-tabright', onTabRight)
		.on('click', '.agent-newtab', onNewTab)
		.on('dragstart', '.agent-tab', onTabDragStart)
		//.on('drag', '.agent-tab', onDrag)
		.on('dragend', '.agent-tab', onTabDragEnd)
		.on('dragover', onTabDragOver)
		.on('drop', onTabDrop);



		var viewdata = {
			contents: $dialogContents,
			update: function(data) {
				if (curSym.value() === undefined) {
					var agname = "view/script/"+name;
					Eden.Agent.importAgent(agname, "default", ["noexec", "create"], function(ag) {
						agent.state[obs_agent] = agname;

						//if (edited == false) {
							if (data instanceof Symbol) {
								agent.setScope(data.getValueScope(eden.root.scope));
								intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(agent.code);
								updateEntireHighlight();
							} else if (data instanceof Array) {
								intextarea.value = EdenUI.plugins.ScriptInput.buildScriptFromList(data);
								updateEntireHighlight();
							} else if (typeof data == "string") {
								intextarea.value = data;
								updateEntireHighlight();
							}
						//}
					});
				}
			},
			destroy: function() {
				console.log("CLOSE SCRIPT");
				clearInterval(scriptarea.gutterinterval);
				//Eden.Agent.unlisten(agent);
				for (var i=0; i<tab_frags.length; i++) {
					tab_frags[i].unlock();
					if (tab_frags[i].ast) tab_frags[i].ast.destroy();
				}
				scriptast = undefined;
				tab_frags = undefined;
				Eden.Fragment.unListen(scriptarea);
				scriptarea = undefined;
				curSym.removeJSObserver("scriptview_"+name);
				tabsSym.removeJSObserver("scriptview_"+name);
				//Eden.Agent.remove(agent);
				//agent = undefined;
			},
			resize: function(e,ui) {
				if (ui && ui.size) {
					maxtabs = Math.floor((ui.size.width - 90) / 160);
				}
			},
			setValue: function (value) { intextarea.value = value; updateEntireHighlight(); }
		}

		// Initialise highlight content
		scriptarea.updateEntireHighlight();

		return viewdata;
	};



	this.createDialog = function(name, mtitle, code) {
		var simpleName = name.slice(0, -7);
		var viewdata = me.createCommon(simpleName, mtitle, code, false, false);

		var idealheight = 405;
		if (code) {
			var linecount = viewdata.contents.find("textarea").val().split("\n").length;
			idealheight = EdenUI.plugins.ScriptInput.getRequiredHeight(linecount + 1);
		}

		/**
		 * Helper to return the Symbol for a view property.
		 *
		 * @param {string} viewName
		 * @param {string} propName
		 * @return {Symbol}
		 */
		function view(viewName, propName) {
			return root.lookup("view_"+viewName+"_"+propName);
		}

		viewdata.contents.on("click", ".windowcontrol", function() {
			edenUI.hideView(simpleName, true);
		});


		$dialog = $('<div id="'+name+'"></div>')
			.html(viewdata.contents)
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 600,
				height: idealheight,
				minHeight: 203,
				minWidth: 300,
				classes: { "ui-dialog": "input-dialog ui-front"},
				/*close: viewdata.close,*/
				resizeStop: viewdata.resize,
				draggable: false
			});
		$dialog.parent().draggable({
			handle: ".handle",
			cancel: '.agent-tab-notcurrent',
			stop: function(event, ui) {
				var root = eden.root;
				root.beginAutocalcOff();
				view(simpleName, 'x').assign(ui.position.left, eden.root.scope, Symbol.hciAgent);
				view(simpleName, 'y').assign(ui.position.top, eden.root.scope, Symbol.hciAgent);
				root.endAutocalcOff();
			},
			start: function(event, ui) {
				if (view(simpleName, 'x').eden_definition || view(simpleName, 'y').definition) return false;
			}
		});

		viewdata.confirmClose = false;

		return viewdata;
	};

	this.createEmbedded = function(name, mtitle, code) {
		var viewdata = me.createCommon(name, mtitle, code, true);
		return viewdata;
	}



	edenUI.views.ScriptInput = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: Language.ui.input_window.title,
		category: edenUI.viewCategories.interpretation,
		menuPriority: 0
	};
	
	edenUI.history = this.history;
	
	success();
};

/**
 * Returns the required height in pixels to display the specified number
 * of lines. Used for embedding an input window.
 */
EdenUI.plugins.ScriptInput.getRequiredHeight = function(lines, embed) {
	if (embed) {
		return 15 + 40 + 20 * lines + 20;
	} else {
		return 15 + 30 + 20 * lines + 20;
	}
};


