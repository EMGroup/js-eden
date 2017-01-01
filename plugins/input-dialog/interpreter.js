/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

 
 // First of all, prevent missing browser functionality from causing errors.
/*
 * If supported by the browser then JS-EDEN will measure how long it takes to
 * execute the user's code each time they press the submit button in the input
 * window and print the result in the JavaScript console.  If the browser
 * doesn't natively support making timing measurements then the functionality is
 * simply disabled.
*/
if (!("time" in console)) {
	console.time = function (timerName) {
		return;
	};
	console.endTime = function (timerName) {
		return;
	};
}



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
	//var inputAgent = {name: Symbol.getInputAgentName()};
	

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


	function HistoryEntry(agent, source, runforce) {
		this.script = source;
		this.timestamp = Date.now();
		this.agent = agent;
		this.runforce = runforce;
	}


	var execlog = [];
	var histdiv = undefined;


	/* Log the history of gutter executed statements */
	Eden.Agent.listenTo("executeline", this, function (agent, line) {
		if (agent && agent.ast) {
			if (line == -1) {
				execlog.push(new HistoryEntry(agent.name, agent.snapshot, true));
				
				if (histdiv) {
					prettyHistory(histdiv);
				}
			} else {
				var statement = agent.ast.lines[line];
				if (statement) {
					var base = agent.ast.getBase(statement);
					execlog.push(new HistoryEntry(agent.name, agent.ast.getSource(base)));
				
					if (histdiv) {
						prettyHistory(histdiv);
					}
				}
			}
		}
	});


	function prettyHistory(output) {
		var result = "";
		for (var i=0; i<execlog.length; i++) {
			if (execlog[i].runforce === true) {
				result += "/* "+execlog[i].agent+":run - "+get_time_diff(execlog[i].timestamp / 1000)+" */\n";
			} else {
				var lineno = Eden.Agent.agents[execlog[i].agent].findDefinitionLine(execlog[i].script)+1;
				if (lineno == 0) lineno = "n/a";
				result += "/* "+execlog[i].agent+":" + lineno + " - "+get_time_diff(execlog[i].timestamp / 1000)+" */\n";
			}
			result += execlog[i].script;
			result += "\n\n";
		}

		var ast = new Eden.AST(result, undefined,{name: "*Log"});
		var hl = new EdenUI.Highlight(output);
		hl.highlight(ast, -1, -1);

		output.scrollTop = output.scrollHeight;
	}


	this.createHistory = function(name,mtitle) {
		historydialog = $('<div id="'+name+'"></div>')
			.html("<div class=\"history readonly\"></div>")
			.dialog({
				appendTo: "#jseden-views",
				title: mtitle,
				width: 500,
				height: 500,
				minHeight: 300,
				minWidth: 300,
				dialogClass: "history-dialog",
				close: function() { histdiv = undefined; }
			}).find(".history");

		histdiv = historydialog.get(0);
		prettyHistory(historydialog.get(0));
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
		var $dialogContents = $('<div class="inputdialogcontent">\
<div class="agent-tabs handle"></div>\
<div class="scriptsubcontent">\
	<div class="inputhider">\
		<div class="control-bar noselect">\
		</div>\
		<textarea autofocus tabindex="1" class="hidden-textarea"></textarea>\
		<div class="inputCodeArea">\
			<div class="eden_suggestions"></div>\
			<div spellcheck="false" tabindex="2" contenteditable class="outputcontent"></div>\
		</div>\
	</div>\
</div>\
<div class="info-bar"></div>\
<div class="outputbox"></div>\
</div></div>');
		//var $optmenu = $('<ul class="input-options-menu"><li>Mode</li><li>Word-wrap</li><li>Spellcheck</li><li>All Leaves</li><li>All Options</li></ul>');		
		var position = 0;
		var $codearea = $dialogContents.find('.inputCodeArea');
		var codearea = $codearea.get(0);
		var inputhider = $dialogContents.find('.inputhider').get(0);
		var intextarea = $dialogContents.find('.hidden-textarea').get(0);
		var outdiv = $dialogContents.find('.outputcontent').get(0);
		var infobox = $dialogContents.find('.info-bar').get(0);
		var outputbox = $dialogContents.find('.outputbox').get(0);
		var suggestions = $dialogContents.find('.eden_suggestions');
		var $tabs = $dialogContents.find('.agent-tabs');
		var $controls = $dialogContents.find('.control-bar');
		var tabs = $tabs.get(0);
		suggestions.hide();
		$(infobox).hide();

		var curtab = -1;
		var tab_queries = [];
		var tab_frags = [];
		var readonly = false;

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

		var dragstart = 0;
		var dragvalue = 0;
		var draglast = 0;
		var dragline = -1;
		var dragint = false;
		var rebuildtimer;
		var amtyping = false;
		var rebuildinterval = 200;
		var currentlineno = 1;
		var currentcharno = 0;
		var highlighter = new EdenUI.Highlight(outdiv);
		var gutter = new EdenScriptGutter($codearea.get(0), infobox);
		var refreshentire = false;
		var edited = false;
		var dirty = false;
		var tabscrollix = 0;
		var showhidden = false;
		var inspectmode = false;
		var gotomode = false;
		var maxtabs = 3;
		var tabpositions = {};

		var scriptast;
		var browseDialog = undefined;

		function curChanged(sym, value) {
			if (typeof value == "number" && value >= 0 && value < tab_frags.length) {
				curtab = value;
				changeClass(outdiv, "browser", false);
				
				// Find base of ast
				//var p = tab_asts[curtab];
				//while (p && p.parent) p = p.parent;
				//var base = p.base;

				intextarea.value = tab_frags[curtab].getSource();
				if (tab_frags[curtab].ast) {
					scriptast = tab_frags[curtab].ast;
					highlightContent(scriptast, -1, 0);
					intextarea.focus();
					checkScroll();

					setTitle(tab_frags[curtab].title);

					gutter.setBaseAST(scriptast);
				}

				if (tab_frags[curtab].locked) {
					readonly = true;
					setSubTitle("[readonly]");
					// The readonly class changes colour scheme
					changeClass(inputhider, "readonly", true);
					outdiv.contentEditable = false;
					//outdiv.style.display = "inline-block";
				} else {
					readonly = false;
					setSubTitle("");
					// The readonly class changes colour scheme
					changeClass(inputhider, "readonly", false);
					outdiv.contentEditable = true;
					//outdiv.style.display = "inline-block";
				}

				rebuildTabs();
			} else {
				rebuildTabs();

				// Show the script browser
				if (value == -1) {
					scriptast = undefined;
					gutter.clear();
					//console.log("SHOW SCRIPT BROWSER");
					//outdiv.style.display = "none";
					curtab = -1;
					changeClass(outdiv, "browser", true);
					changeClass(inputhider, "readonly", false);
					outdiv.contentEditable = false;
					readonly = true;
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
				tab_queries = value;
				var oldfrags = tab_frags;

				//console.log("OLDFRAGS",oldfrags);

				tab_frags = [];
				for (var i=0; i<value.length; i++) {
					if (oldfrags.length > i && oldfrags[i].selector == value[i]) {
						tab_frags.push(oldfrags[i]);
					} else {
						tab_frags.push(new Eden.Fragment(value[i]));
						if (oldfrags.length > i) oldfrags[i].unlock();
					}
				}

				curChanged(curSym, curSym.value());
			}
		}

		curSym.addJSObserver("scriptview", curChanged);
		//curChanged(curSym, curSym.value());
		tabsSym.addJSObserver("scriptview", tabsChanged);
		tabsChanged(tabsSym, tabsSym.value());

		if (tabsSym.value() === undefined && tabsSym.definition === undefined) {
			tabsSym.assign([], eden.root.scope, Symbol.defaultAgent);
		}

		if (curSym.value() === undefined && curSym.definition === undefined) {
			curSym.assign(-1, eden.root.scope, Symbol.defaultAgent);
		}


		Eden.Fragment.listenTo("changed", this, function(frag) {
			if (frag === tab_frags[curtab]) {
				//curChanged(curSym, curSym.value());
				rebuildTabs();
			}
		});

		Eden.Fragment.listenTo("locked", this, function(frag) {
			if (frag === tab_frags[curtab]) {
				console.log("LOCKED",frag);
				curChanged(curSym, curSym.value());
			}
		});

		Eden.Fragment.listenTo("unlocked", this, function(frag) {
			if (frag === tab_frags[curtab]) {
				curChanged(curSym, curSym.value());
			}
		});

		Eden.Fragment.listenTo("errored", this, function(frag) {
			//if (frag === tab_frags[curtab]) {
				//rebuildTabs();
				delayRebuild();
			//}
		});

		Eden.Fragment.listenTo("status", this, function(frag) {
			if (frag === tab_frags[curtab]) {
				//rebuildTabs();
				delayRebuild();
				setTitle(tab_frags[curtab].title);
			}
		});


		//var $buttonbar = $('<div class="control-bar noselect"><div class="buttonsDivLeft"><!--button class="control-button share control-enabled">&#xf1e0;</button--><!--button class="control-button run-force control-enabled" title="Run (force)">&#xf04b;</button--></div><div class="buttonsDiv"><button class="control-button search-mode control-enabled" title="'+Language.ui.input_window.inspect+'">&#xf002;</button><button class="control-button rewind-input" title="'+Language.ui.input_window.rewind+'">&#xf122;</button><button class="control-button previous-input" title="'+Language.ui.input_window.undo+'">&#xf112;</button><button class="control-button next-input" title="'+Language.ui.input_window.redo+'">&#xf064;</button><button class="control-button fa-flip-horizontal fastforward-input" title="'+Language.ui.input_window.fast_forward+'">&#xf122;</button><button class="control-button control-enabled menu-input">&#xf142;</button></div>');
		//$buttonbar.appendTo($dialogContents);
		//var buttonbar = $buttonbar.get(0);

		var $optionsmenu = $('<div class="options-menu noselect"></div>');
		var optionsmenu = $optionsmenu.get(0);
		$optionsmenu.appendTo($dialogContents);

		function createMenuItem(icon, name, action) {
			var item = $('<div class="options-menu-item"><span class="options-menu-icon">'+icon+'</span><span>'+name+'</span></div>');
			$optionsmenu.append(item);
			item.click(action);
		}

		function hideMenu() {
			$optionsmenu.hide("slide", { direction: "down"}, 200);
		}

		function buildMenu() {
			while (optionsmenu.firstChild) optionsmenu.removeChild(optionsmenu.firstChild);

			createMenuItem((showTabsSym.value()) ? "&#xf00c;" : "&#xf00d;", Language.ui.input_window.show_tabs, function(e) { agent.state[obs_showtabs] = !agent.state[obs_showtabs]; buildMenu(); });
			createMenuItem((showButtonsSym.value()) ? "&#xf00c;" : "&#xf00d;", Language.ui.input_window.show_controls, function(e) { agent.state[obs_showbuttons] = !agent.state[obs_showbuttons]; buildMenu(); });
			createMenuItem("&#xf0c0;", Language.ui.input_window.browse_agents, function(e) { showBrowseDialog(); hideMenu(); });
			createMenuItem("&#xf21b;", Language.ui.input_window.hide_agent, function(e) {
				var tabs = agent.state[obs_tabs];
				var ix = tabs.indexOf(scriptagent.name);
				if (ix >= 0) {
					tabs.splice(ix,1);
					ix--;
					if (ix < 0) ix = 0;
					if (ix < tabs.length) {
						agent.state[obs_agent] = tabs[ix];
					}
					agent.state[obs_tabs] = tabs;
				}
				if (tabs.length == 0) agent.state[obs_agent] = undefined;
				hideMenu();
			});
			createMenuItem("&#xf1da;", Language.ui.input_window.view_history, function(e) { showSubDialog("showHistory", function(status, index, version) {
				if (status) {
					if (version != scriptagent.meta.saveID) {
						scriptagent.changeVersion(version, function() {
							//scriptagent.rollback(index);
							updateHistoryButtons();
						});
					} else {
						scriptagent.rollback(index);
					}
				}
			}, scriptagent); hideMenu(); });
			createMenuItem("&#xf0d0;", Language.ui.input_window.insert_temp, function(e) { });
		}


		function browseScripts(path) {
			var scripts = Eden.Selectors.query(path + "* script:has-name:not(:remote)","id");
			outdiv.innerHTML = "";
			for (var i=0; i<scripts.length; i++) {
				var name = scripts[i].split(".");
				name = name[name.length-1];
				var icon;
				if (scripts[i] == eden.project.name) {
					icon = "&#xf187;";
				} else if (name == "ACTIVE") {
					icon = "&#xf0e7;";
				} else {
					icon = "&#xf1ae;";
				}
				var ele = $('<div class="browse-entry" data-path="'+scripts[i]+'"><div class="browse-icon">'+icon+'</div>'+name+'</div>');
				outdiv.appendChild(ele.get(0));
			}

			scripts = Eden.Selectors.query(path + "* script:has-name:remote","id");
			for (var i=0; i<scripts.length; i++) {
				var name = scripts[i].split(".");
				name = name[name.length-1];
				var ele = $('<div class="browse-entry" data-path="'+scripts[i]+'"><div class="browse-icon">&#xf08e;</div>'+name+'</div>');
				outdiv.appendChild(ele.get(0));
			}
		}



		function updateControls() {
			if (curtab >= 0) {
				var html = '<button class="script-button script-run"><span class="explorer-control-icon">&#xf04b;</span>Run</button>';
				html += '<button class="script-button script-changes"><span class="explorer-control-icon">&#xf044;</span>Changes</button>';

				var frag = tab_frags[curtab];

				if (frag && frag.scratch && !frag.edited) {
					html += '<span class="scratchsearch"><input type="text" class="scratchsearch" placeholder="Populate..."></input></span>';
				} else if (frag && frag.scratch) {
					//html += '<button class="script-button script-name"><span class="explorer-control-icon">&#xf02b;</span>Name</button>';
					html += '<span class="editname"><input type="text" class="editname" placeholder="Enter a name..."></input></span>';
				
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
		


		/**
		 * If the input window is a dialog then set its title.
		 */
		function setTitle(title) {
			/*if (scriptagent) {
				scriptagent.setTitle(title);
				rebuildTabs();
			}*/

			var p = $dialogContents.get(0).parentNode;
			if (p) {
				p = p.parentNode;
				if (p) {
					$(p).find(".ui-dialog-title").html(title);
				}
			}
		}



		function setSubTitle(text) {
			if (embedded) return;
			var p = $dialogContents.get(0).parentNode;
			if (p) {
				p = p.parentNode;
				if (p) {
					var title = $(p).find(".ui-dialog-subtitle").get(0);
					if (title === undefined) {
						title = document.createElement("span");
						title.className = "ui-dialog-subtitle";
						$(p).find(".ui-dialog-title").get(0).parentNode.appendChild(title);
					}

					if (scriptast) {
						title.textContent = tab_frags[curtab].selector + " " + text;
					} else {
						title.textContent = text;
					}
				}
			}
		}


		// Initialise sub title after dialog creation
		setTimeout(function() { if (scriptast === undefined) setSubTitle("[No Scripts]"); }, 0);



		function toggleTabs(sym, value) {
			if (value) {
				inputhider.style.top = "30px";
			} else {
				inputhider.style.top = "0";
			}
		}



		function toggleButtons(sym, value) {
			if (value) {
				buttonbar.style.display = "inherit";
				inputhider.style.bottom = "30px";
			} else {
				buttonbar.style.display = "none";
				inputhider.style.bottom = "0";
			}
		}



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

	
	

		var gutterinterval = setInterval(function() {
			if (scriptast === undefined) return;
			gutter.generate(scriptast, currentlineno);
			//scriptast.clearExecutedState();
		}, 200);


		buildMenu();


		function updateSource(src, line) {
			//var newast = new Eden.AST(src, undefined, eden.project);
			tab_frags[curtab].setSource(src);
			highlighter.ast = tab_frags[curtab].ast;
			//eden.project.patch(scriptast, newast);
			scriptast = highlighter.ast;
			//tab_asts[curtab] = scriptast;
		}


		/**
		 * Re-parse the entire script and then re-highlight the current line
		 * (and one line either size).
		 */
		function updateLineHighlight() {
			var lineno = -1; // Note: -1 means update all.
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			//scriptagent.setSource(intextarea.value, false, lineno);
			updateSource(intextarea.value, lineno);

			runScript(lineno);

			highlightContent(scriptast, lineno, pos);
			//rebuildNotifications();
		}



		/**
		 * Re-highlight the current line without re-parsing the script.
		 * Used when moving around the script without actually causing a code
		 * change that needs a reparse.
		 */
		function updateLineCachedHighlight() {
			var lineno = -1;
			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
				lineno = getLineNumber(intextarea);
			}

			highlightContent(highlighter.ast, lineno, pos);
		}



		/**
		 * Parse the script and do a complete re-highlight. This is slow but
		 * is required when there are changes across multiple lines (or there
		 * could be such changes), for example when pasting.
		 */
		function updateEntireHighlight(rerun, options) {
			if (scriptast === undefined) return;
			//scriptagent.setSource(intextarea.value, false, -1);
			//highlighter.ast = scriptagent.ast;

			updateSource(intextarea.value, -1);

			var pos = -1;
			if (document.activeElement === intextarea) {
				pos = intextarea.selectionEnd;
			}

			if (rerun) {
				runScript(0);
			}

			highlightContent(scriptast, -1, pos, options);
		}



		function hideInfoBox() {
			$(infobox).hide("fast");
		}



		/**
		 * Add a warning icon to the left of the specified line
		 */
		function addWarningLine(lineno, msg) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-warnline");
			if (msg) {
				outdiv.childNodes[lineno-1].title = msg;
			}
		}



		/**
		 * Add an extension icon to the left of the specified line
		 */
		function addExtendedLine(lineno) {
			var $line = $(outdiv.childNodes[lineno-1]);
			$line.addClass("eden-extendedline");
		}



		/**
		 * Replace a particular line with the given content.
		 * Can be used for autocompletion and number dragging.
		 */
		function replaceLine(lineno, content) {
			var lines = intextarea.value.split("\n");
			lines[lineno] = content;
			intextarea.value = lines.join("\n");
		}



		/**
		 * Insert an array of lines into the script at the given line.
		 * Potentially used when expanding definition filters.
		 * CURRENTLY UNUSED
		 */
		function insertLines(lineno, newlines) {
			var lines = intextarea.value.split("\n");
			for (var i=0; i<newlines.length; i++) {
				lines.splice(lineno, 0, newlines[i]);
			}
			intextarea.value = lines.join("\n");
		}



		/**
		 * Prepend ## to a line to comment it out.
		 * CURRENTLY UNUSED.
		 */
		function commentOutLine(lineno) {
			var lines = intextarea.value.split("\n");
			lines[lineno-1] = "##" + lines[lineno-1];
			intextarea.value = lines.join("\n");
		}



		/**
		 * When clicking or using a syntax highlighted element, find which
		 * source line this corresponds to. Used by number dragging.
		 */
		function findElementLineNumber(element) {
			var el = element;
			while (el.parentNode !== outdiv) el = el.parentNode;

			for (var i=0; i<outdiv.childNodes.length; i++) {
				if (outdiv.childNodes[i] === el) return i;
			}
			return -1;
		}



		/**
		 * Update scroll position if cursor is near to an edge.
		 * TODO Fix for new scroll elements
		 */
		function checkScroll() {
			return;
			// Get the cursor
			var el = $(outdiv.childNodes[currentlineno-1]).find(".fake-caret").get(0);
			if (el === undefined) return;
			var area = $codearea.get(0);

			// How far from left or right?
			var distleft = el.offsetLeft - area.scrollLeft + 25;
			var distright = area.clientWidth + area.scrollLeft - el.offsetLeft - 25;

			// Need to find the current line element
			while (el.parentNode != outdiv) el = el.parentNode;

			// How far is this line from the top or bottom
			var disttop = el.offsetTop - area.scrollTop + 15;
			var distbottom = area.clientHeight + area.scrollTop - el.offsetTop - 15;

			// Move if needed.
			if (distleft < 80) area.scrollLeft = area.scrollLeft - (80-distleft);
			if (distright < 80) area.scrollLeft = area.scrollLeft + (80-distright);
			if (disttop < 40) area.scrollTop = area.scrollTop - (40-disttop);
			if (distbottom < 40) area.scrollTop = area.scrollTop + (40-distbottom);
		}



		function scrollToLine(line) {
			var area = $codearea.get(0);
			area.scrollTop = 15 + 20 * line - 100;
		}



		/**
		 * Call the highlighter to generate the new highlight output, and then
		 * post process this to allow for extra warnings and number dragging.
		 */
		function highlightContent(ast, lineno, position, options) {
			//var oldscrolltop = inputhider.scrollTop;
			highlighter.highlight(ast, lineno, position, options);
			gutter.generate(ast,lineno);
			//inputhider.scrollTop = oldscrolltop;
			//console.log("SCROLLTOP",oldscrolltop);


			// Make sure caret remains inactive if we don't have focus
			if (document.activeElement !== intextarea) {
				$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			}
		}



		/**
		 * Return the current line. Also, set currentlineno.
		 */
		function getLineNumber(textarea) {
			var lines = textarea.value.substr(0, textarea.selectionStart).split("\n");
			currentlineno = lines.length;
			currentcharno = lines[lines.length-1].length;
			return currentlineno;
		}



		/**
		 * Move the caret of the contenteditable div showing the highlighted
		 * script to be the same location as the fake caret in the highlight
		 * itself. This enables shift selection using the browsers internal
		 * mechanism.
		 */
		function setCaretToFakeCaret() {
			var el = $(outdiv).find(".fake-caret").get(0);
			var range = document.createRange();
			var sel = window.getSelection();
			if (el.nextSibling) el = el.nextSibling;
			range.setStart(el, 0);
			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
			// Finally, delete the fake caret
			$(outdiv).remove(".fake-caret");
		}



		/* Is this needed???? */
		function selectAll() {
			var range = document.createRange();
			range.selectNodeContents(outdiv);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}

		/**
		 * Script contents have changed, so re-parse, re-highlight and
		 * if live, re-execute. Used in a short interval timeout from the
		 * raw input/keyup events.
		 */
		function doRebuild() {
			// Rebuild tabs
			rebuildTabs();

			// Rebuild number dragging
			/* Number dragging code, but only if live */
			if (!readonly) {
				$(outdiv).find('.eden-number').draggable({
					helper: function(e) { return $("<div class='eden-drag-helper'></div>"); },
					axis: 'x',
					distance: 5,
					drag: function(e,u) {
						if (readonly) return;
						var newval;
						if (dragint) {
							newval = Math.round(dragvalue + ((u.position.left - dragstart) / 2));
						} else {
							newval = dragvalue + ((u.position.left - dragstart) * 0.005);
							newval = newval.toFixed(4);
						}

						// TODO: this is no good for floats
						if (newval != draglast) {
							draglast = newval;
							e.target.innerHTML = "" + newval;

							var content = e.target.parentNode.textContent;
							if (content.charAt(content.length-1) == "\n") {
								content = content.slice(0,-1);
							}
							replaceLine(dragline, content);

							updateSource(intextarea.value, dragline);

							//scriptagent.setSource(intextarea.value, false, dragline);
							//highlighter.ast = scriptagent.ast;

							//console.log("Dragline: " + dragline);

							// Execute if no errors!
							if (gutter.lines[dragline] && gutter.lines[dragline].live && !scriptast.hasErrors()) {
								scriptast.executeLine(dragline);
							}

							highlightContent(scriptast, dragline, -1);
						}
					},
					start: function(e,u) {
						if (readonly) return;
						edited = true;
						// Calculate the line we are on
						dragline = findElementLineNumber(e.target);
						dragstart = u.position.left;
						var content = e.target.textContent;
						if (content.indexOf(".") == -1) {
							dragvalue = parseInt(content);
							dragint = true;
						} else {
							dragvalue = parseFloat(content);
							dragint = false;
						}
						draglast = dragvalue;

						$(e.target).addClass("eden-select");
						$(outdiv).css("cursor","ew-resize");
					},
					stop: function(e,u) {
						if (readonly) return;
						$(e.target).removeClass("eden-select");
						$(outdiv).css("cursor","text");
						//updateEntireHighlight();
						dragline = -1;
					},
					cursor: 'move',
					cursorAt: {top: -5, left: -5}
				// Following line is hack to allow click through editing...
				}).click(function() { $(this).draggable({disabled: true}); }) .blur(function() { $(this).draggable({disabled: false}); });
			}
		}



		function runScript(line) {
			// If we should run the statement (there are no errors)
			if (gutter.lines[line-1] && gutter.lines[line-1].live && !scriptast.hasErrors()) {
				scriptast.executeLine(line-1);
			}
		}



		function showSubDialog(name, callback, data) {
			if (EdenUI.plugins.ScriptInput.dialogs[name]) {
				EdenUI.plugins.ScriptInput.dialogs[name]($dialogContents, callback, data);
			}
		}

		function hideSubDialogs() {
			if (EdenUI.plugins.ScriptInput.dialogs.hide) EdenUI.plugins.ScriptInput.dialogs.hide();
		}



		function delayRebuild() {
			// Using a timer to make rebuild async. Allows input and keyup to
			// trigger a single rebuild which overcomes Chrome input event bug.
			clearTimeout(rebuildtimer);
			rebuildtimer = setTimeout(doRebuild, rebuildinterval);
		}



		/**
		 * Set the rebuild timeout. Note: rebuildinterval MUST be less that the
		 * keyboard repeat rate or you will not see a change when holding keys
		 * down.
		 */
		function rebuild() {
			if (gutter.edits) {
				makeDiff();
			} else {
				edited = true;
				// Regenerate the AST and highlight the code.
				if (refreshentire) {
					updateEntireHighlight();
					refreshentire = false;
				} else { // if (dirty) {
					updateLineHighlight();
				/*} else {
					updateLineCachedHighlight();*/
				}
				// Adjust scroll position if required
				checkScroll();
				dirty = false;

				delayRebuild();
			}
		}



		/**
		 * Event handler for input change.
		 */
		function onInputChanged(e) {
			dirty = true;

			rebuild();

				/* Suggestions Box */
				//console.log(window.getSelection().getRangeAt(0));
				// Is there an abstract syntax tree node for this line?
				/*var curast = stream.ast.lines[stream.currentline-1];
				if (curast) {
					var pattern = stream.ast.getSource(curast).split("\n")[0];
					//console.log("Fill: " + pattern);

					// Get the current line and its screen position to
					// position the suggestions box correctly.
					var curlineele = $(textarea).find(".eden-currentline");
					var pos = curlineele.position();
					if (pos === undefined) pos = $(textarea).position();
					pos.top += $dialogContents.get(0).scrollTop;
					
					if (curast.type == "definition") {
						var rhs = pattern.split("is")[1].trim();
						//console.log("RHS: " + rhs);
						var sym = eden.root.lookup(curast.lvalue.observable);
						var def = sym.eden_definition;
						if (def) def = def.split("is")[1].trim();
						if (def && def.substr(0,rhs.length) == rhs) {
							//console.log("SUGGEST: " + sym.eden_definition);
							suggestions.text(sym.eden_definition.split("is")[1].trim());
							if (suggestions.is(":visible") == false) {
								suggestions.css("top",""+ (pos.top + 20) +"px");
								suggestions.show("fast");
							}
						} else {
							var regExp = new RegExp("^(" + rhs + ")", "");
							var suggest = "";
							var count = 0;
							var last = "";
							for (var s in eden.root.symbols) {
								if (regExp.test(s)) {
									count++;
									last = s;
									//console.log("SUGGEST: " + s);
									suggest += s + "<br/>";
								}
							}
							if (count > 1 || (count == 1 && rhs.length < last.length)) {
								suggestions.html(suggest);
								if (suggestions.is(":visible") == false) {
									suggestions.css("top",""+ (pos.top + 20) +"px");
									suggestions.show("fast");
								}
							} else {
								suggestions.hide("fast");
							}
						}
					} else {
						suggestions.hide("fast");
					}
				} else {
					suggestions.hide("fast");
				}*/
		}



		function enableInspectMode() {
			if (!inspectmode) {
				outdiv.contentEditable = false;
				changeClass(outdiv, "inspect", true);
				inspectmode = true;
				// TODO Remove caret and merge those spans
				updateInspectButton();
				setSubTitle("[inspecting]");
			}
		}

		function enableGotoMode() {
			if (!gotomode) {
				outdiv.contentEditable = false;
				changeClass(outdiv, "goto", true);
				gotomode = true;
			}
		}

		function disableGotoMode() {
			if (gotomode) {
				outdiv.contentEditable = true;
				changeClass(outdiv, "goto", false);
				gotomode = false;
				updateEntireHighlight();
				intextarea.focus();
			}
		}

		function disableInspectMode() {
			if (inspectmode) {
				changeClass(outdiv, "inspect", false);
				inspectmode = false;
				updateEntireHighlight();
				intextarea.focus();
				updateInspectButton();
				if (readonly) {
					setSubTitle("[readonly]");
				} else {
					setSubTitle("");
					outdiv.contentEditable = true;
				}
			}
		}



		/**
		 * Various keys have special actions that require intercepting. Tab key
		 * must insert a tab, shift arrows etc cause selection and require a
		 * focus shift, and adding or deleting lines need to force a full
		 * rehighlight.
		 */
		function onTextKeyDown(e) {
			// Alt and AltGr for inspect mode.
			//if (e.keyCode == 18 || e.keyCode == 225) {
			if (e.altKey && e.keyCode == 73) {
				enableInspectMode();
			} else if (!e.altKey) {
				// Don't allow editing in inspect mode.
				if (inspectmode) {
					e.preventDefault();
					return;
				}

				// If not Ctrl or Shift key then
				if (!(e.ctrlKey || e.metaKey) && e.keyCode != 17 && e.keyCode != 16 && e.keyCode != 91 && e.keyCode != 92) {
					// Make TAB key insert TABs instead of changing focus
					if (e.keyCode == 9) {
						e.preventDefault();
						var start = intextarea.selectionStart;
						var end = intextarea.selectionEnd;

						// set textarea value to: text before caret + tab + text after caret
						intextarea.value = intextarea.value.substring(0, start)
									+ "\t"
									+ intextarea.value.substring(end);

						// put caret at right position again
						intextarea.selectionStart =
						intextarea.selectionEnd = start + 1;
						//updateLineHighlight();
						rebuild();
					} else if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
						// Shift arrow selection, move to editable div.
						if (e.shiftKey) {
							setCaretToFakeCaret();
							outdiv.focus();
							return;
						}
					
						// Update fake caret position at key repeat rate
						updateLineCachedHighlight();
						// Adjust scroll position if required
						checkScroll();
					} else if (e.keyCode == 13 || (e.keyCode == 8 && intextarea.value.charCodeAt(intextarea.selectionStart-1) == 10)) {
						// Adding or removing lines requires a full re-highlight at present
						refreshentire = true;
						//console.log("ADD/REMOVE LINE REFRESH");
					}

				} else if (e.ctrlKey || e.metaKey) {
					if (e.shiftKey) {
						if (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 36 || e.keyCode == 35) {
							// Ctrl+Shift arrow selection, move to editable div.
							setCaretToFakeCaret();
							outdiv.focus();
							return;
						}
					} else if (e.keyCode === 38) {
						// up
						onPrevious();
					} else if (e.keyCode === 40) {
						// down
						onNext();
					} else if (e.keyCode === 86) {

					} else if (e.keyCode === 65) {
						// Ctrl+A to select all.
						e.preventDefault();
						outdiv.focus();
						selectAll();
					} else if (e.keyCode === 17 || e.keyCode == 91 || e.keyCode == 92) {
						//console.log(e.keyCode);
						enableGotoMode();
					}
				}
			} else {
				// Alt key is pressed so.....
				if (e.keyCode == 187 || e.keyCode == 61) {
					// Alt+Plus: Zoom in
					console.log("ZOOM IN");
					agent.state[obs_zoom] = agent.state[obs_zoom] + 1;
					e.preventDefault();
				} else if (e.keyCode == 189 || e.keyCode == 173) {
					// Alt+Minus: Zoom out
					agent.state[obs_zoom] = agent.state[obs_zoom] - 1;;
					e.preventDefault();
				} else if (e.keyCode == 48) {
					//Alt+0
					agent.state[obs_zoom] = 0;
					e.preventDefault();
				}
			}
		}



		function onTextPaste(e) {
			refreshentire = true;
		}



		/**
		 * Some keys don't change content but still need a rehighlight. And,
		 * in case the input change event is skipped (Chrome!!), make sure a
		 * rebuild does happen.
		 */
		function onTextKeyUp(e) {
			// Alt and AltGr for disable inspect mode.
			if (e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 92) {
				disableGotoMode();
			} else if (e.keyCode == 18 || (e.altKey && e.keyCode == 73)) {
				disableInspectMode();
				e.preventDefault();
			} else if (!e.altKey) {
				if (!(e.ctrlKey || e.metaKey) && (	e.keyCode == 37 ||	//Arrow keys
									e.keyCode == 38 ||
									e.keyCode == 39 ||
									e.keyCode == 40 ||
									e.keyCode == 36 ||	// Home key
									e.keyCode == 35)) {	// End key

					updateLineCachedHighlight();
					gutter.selectLine(currentlineno);

					// Force a scroll for home and end AFTER key press...
					if (e.keyCode == 36 || e.keyCode == 35) {
						checkScroll();
					}
				} else {
					rebuild();
				}
			}
		}



		/**
		 * When focus is on the output and a key is pressed. This occurs when
		 * text is selected that needs replacing.
		 */
		function onOutputKeyDown(e) {
			if (readonly) return;
			// Alt and AltGr for inspect mode.
			if (e.altKey && e.keyCode == 73) {
				enableInspectMode();
			} else if (!e.altKey) {
				if (outdiv.style.cursor == "pointer") outdiv.style.cursor = "initial";
				if (e.keyCode == 16 || e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 92 || ((e.ctrlKey || e.metaKey) && e.keyCode == 67)) {
					// Ignore Ctrl and Ctrl+C.
				// If not shift selecting...
				} else if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36))) {
					var end = getCaretCharacterOffsetWithin(outdiv);
					var start = getStartCaretCharacterOffsetWithin(outdiv);

					intextarea.focus();
					intextarea.selectionEnd = end;
					intextarea.selectionStart = start;
					if (start != end) refreshentire = true;
				}
			}
		}



		function onOutputPaste(e) {
			intextarea.focus();
			setTimeout(updateEntireHighlight, 0);
		}



		function onOutputKeyUp(e) {
			if (e.keyCode == 18 || (e.altKey && e.keyCode == 73)) {
				disableInspectMode();
				e.preventDefault();
			} else if (e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 92) {
				disableGotoMode();
			}
		}



		/**
		 * Make the caret look invisible. It must still exist to keep record
		 * of current location for selection purposes.
		 */
		function onTextBlur(e) {
			//$(outdiv).find(".fake-caret").addClass("fake-blur-caret");
			// Finally, delete the fake caret
			$(outdiv).find(".fake-caret").remove();
			hideInfoBox();
			//disableInspectMode();
		}



		/**
		 * Make the caret visible.
		 */
		function onTextFocus(e) {
			//$(outdiv).find(".fake-caret").removeClass("fake-blur-caret");
		}



		function onOutputMouseDown(e) {
			if (readonly) return;

			setTimeout(function() {
				// To prevent false cursor movement when dragging numbers...
				if (document.activeElement === outdiv) {
					var end = getCaretCharacterOffsetWithin(outdiv);
					var start = getStartCaretCharacterOffsetWithin(outdiv);
					//if (start != end) {
						// Fix to overcome current line highlight bug on mouse select.
					//	refreshentire = true;
					//} else {
						// Move caret to clicked location
					//	intextarea.focus();
						intextarea.selectionEnd = end;
						intextarea.selectionStart = end;
						var curline = getLineNumber(intextarea);
						gutter.selectLine(curline);
					//	if (highlighter.ast) {		
					//		highlighter.highlight(highlighter.ast, curline, end);
					//		updateLineCachedHighlight();
					//	}
						//checkScroll();
					//}
				}
			},0);
		}

		/**
		 * Clicking on the highlighted script needs to move the cursor position.
		 * Unless a selection is being made, in which case keep the focus on
		 * the highlighted output instead.
		 */
		function onOutputMouseUp(e) {
			hideInfoBox();
			hideMenu();

			if (readonly) return;

			if (inspectmode) {
				var element = e.target;
				if (element.className == "" && element.parentNode.nodeName == "SPAN") {
					element = element.parentNode;
				}
				if (element.className == "eden-path") {
					//console.log();
					disableInspectMode();
					var path = element.parentNode.textContent.split("@");
					if (path.length == 1) {
						openTab(path[0]);
					} else {
						openTab(path[0], path[1]);
					}
				} else if (element.className == "eden-observable") {
					var obs = element.getAttribute("data-observable");
					element.textContent =  Eden.edenCodeForValue(eden.root.lookup(obs).value());
					element.className += " select";
				} else if (element.className == "eden-observable select") {
					var obs = element.getAttribute("data-observable");
					element.textContent = obs;
					element.className = "eden-observable";
				}
				e.preventDefault();
			} else if (gotomode) {
				var element = e.target;
				if (element.className == "" && element.parentNode.nodeName == "SPAN") {
					element = element.parentNode;
				}
				if (element.className == "eden-selector" || element.className == "eden-selector2") {
					//console.log();
					disableGotoMode();
					var path = element.parentNode.textContent;
					console.log("PATH",path);
					var tabs = tabsSym.value();
					tabs.push(path);
					tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
				} else if (element.className == "eden-observable") {
					var obs = element.getAttribute("data-observable");
					//console.log("GOTO: " + obs);
					//var sym = eden.root.symbols[obs];
					//if (sym) {
						/*var a = Eden.Agent.agents[sym.last_modified_by];
						if (a) {
							if (a !== scriptagent) {
								agent.state[obs_agent] = sym.last_modified_by;
							}
							var lineno = a.findDefinitionLine(sym.eden_definition);
							if (lineno >= 0) setTimeout(function() {
								scrollToLine(lineno);
							}, 100);
							//console.log(" in " + sym.last_modified_by + "@"+lineno);
						}*/
					//	console.log(sym.last_modified_by);
					//}
					edenUI.gotoCode("/"+obs);
				}
				e.preventDefault();
			} else {
				// To prevent false cursor movement when dragging numbers...
				if (document.activeElement === outdiv) {
					var end = getCaretCharacterOffsetWithin(outdiv);
					var start = getStartCaretCharacterOffsetWithin(outdiv);
					if (start != end) {
						// Fix to overcome current line highlight bug on mouse select.
						refreshentire = true;
					} else {
						// Move caret to clicked location
						intextarea.focus();
						intextarea.selectionEnd = end;
						intextarea.selectionStart = end;
						var curline = currentlineno;
						//gutter.selectLine(curline);
						if (highlighter.ast) {		
							//highlighter.highlight(highlighter.ast, curline, end);
							updateLineCachedHighlight();
						}
						//checkScroll();
					}
				} else {

				}
			}
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


		/**
		 * Move script to previous in history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onPrevious() {
			/*if (agent[obs_override] == true) {
				agent[obs_prev] = true;
				agent[obs_prev] = false;
			} else if (!readonly && scriptagent.canUndo()) {
				scriptagent.undo();
				intextarea.value = scriptagent.snapshot;
				updateEntireHighlight(true);
				updateHistoryButtons();
			}*/
		}



		/**
		 * Move script to next in history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onNext() {
			/*if (agent[obs_override] == true) {
				agent[obs_next] = true;
				agent[obs_next] = false;
			} else if (!readonly && scriptagent.canRedo()) {
				scriptagent.redo();
				intextarea.value = scriptagent.snapshot;
				updateEntireHighlight(true);
				updateHistoryButtons();
			}*/
		}



		/**
		 * Fast forward script through history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onFastForward() {
			/*if (agent[obs_override] == true) {
				//agent[obs_] = true;
				//agent[obs_next] = false;
			} else if (!readonly && scriptagent.canRedo()) {
				while (scriptagent.canRedo()) scriptagent.redo();
				intextarea.value = scriptagent.snapshot;
				updateEntireHighlight(true);
				updateHistoryButtons();
			}*/
		}



		/**
		 * Fast forward script through history, or toggle symbol for custom
		 * previous/next functionality.
		 */
		function onRewind() {
			/*if (agent[obs_override] == true) {
				//agent[obs_] = true;
				//agent[obs_next] = false;
			} else if (!readonly && scriptagent.canUndo()) {
				while (scriptagent.canUndo()) scriptagent.undo();
				intextarea.value = scriptagent.snapshot;
				updateEntireHighlight(true);
				updateHistoryButtons();
			}*/
		}



		function onTabClick(e) {
			var name = e.currentTarget.getAttribute("data-index");
			curSym.assign(parseInt(name), eden.root.scope, Symbol.hciAgent);
			intextarea.focus();
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



		function onMenu() {
			$optionsmenu.toggle("slide", { direction: "down"}, 200);
		}



		function onNewTab() {
			var tabs = tabsSym.value();
			tabs.push("");
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
				intextarea.value = res.join("\n");
				tab_frags[curtab].setSourceInitial(intextarea.value);
				scriptast = tab_frags[curtab].ast;
				highlightContent(scriptast, -1, 0);
				//intextarea.focus();
				//checkScroll();

				//setTitle(tab_frags[curtab].title);

				gutter.setBaseAST(scriptast);

				readonly = false;
				// The readonly class changes colour scheme
				changeClass(inputhider, "readonly", false);
				outdiv.contentEditable = true;
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
			tabs[curtab] = e.target.value;
			tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
		}

		function onBrowseClick(e) {
			var path = e.currentTarget.getAttribute("data-path");
			var tabs = tabsSym.value();
			tabs.push(path);
			tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);
			curSym.assign(tabs.length-1, eden.root.scope, Symbol.localJSAgent);
		}

		function makeDiff() {
			var spacing = {};
			var edits = tab_frags[curtab].diff();
			var lineshift = 0;
		
			// For each remove line, insert a blank line into the highlighter.
			for (var x in edits.remove) {
				if (edits.remove[x].consecutive) continue;
				var oline = parseInt(x);

				//if (edits[ix].insert.length > 0 && edits[ix].consecutive) lineshift--;
				//if (edits[ix].consecutive && edits[ix].insert.length == 0) continue;
				//lineshift += edits[ix].insert.length;
				var j = 0;
				var height = 20;
				do {
					height += 20;
					j++;
				} while (edits.remove[oline+j] && edits.remove[oline+j].consecutive);
			//	if (edits[x].insert.length > 0) lineshift -= edits[x].insert.length+1;
				/*var ele = outdiv.childNodes[edits.remove[x].nline-1+lineshift];
				if (ele === undefined) {
					ele = document.createElement("div");
					ele.className = "eden-line";
					outdiv.insertBefore(ele, outdiv.firstChild);
					height -= 20;
					lineshift = 1;
				}*/
				//ele.style.height = ""+height+"px";
				spacing[edits.remove[x].nline+lineshift] = height;
				//if (j > 0) lineshift += j-1;
			}

			gutter.setDiffs(edits);
			updateEntireHighlight(false, {spacing: spacing});
		}


		function onShowChanges(e) {
			if (gutter.edits) {
				gutter.setDiffs(undefined);
				updateEntireHighlight();
			} else {
				makeDiff();
			}
		}


		$controls
		.on('keyup', 'input.editname', onNameChange)
		.on('change', 'input.editname', onNameFinish)
		.on('click', '.script-run', onRun)
		.on('click', '.script-changes', onShowChanges)
		.on('keyup', 'input.scratchsearch', onScratchSearch);


		// Set the event handlers
		$dialogContents
		.on('click', '.close', onTabClose)
		.on('click', '.agent-tab-more', onBrowse)
		.on('click', '.browse-entry', onBrowseClick)
		.on('input', '.hidden-textarea', onInputChanged)
		.on('keydown', '.hidden-textarea', onTextKeyDown)
		.on('keyup', '.hidden-textarea', onTextKeyUp)
		.on('paste', '.hidden-textarea', onTextPaste)
		.on('keydown', '.outputcontent', onOutputKeyDown)
		.on('keyup', '.outputcontent', onOutputKeyUp)
		.on('paste', '.outputcontent', onOutputPaste)
		.on('blur', '.hidden-textarea', onTextBlur)
		.on('focus', '.hidden-textarea', onTextFocus)
		.on('mouseup', '.outputcontent', onOutputMouseUp)
		.on('mousedown', '.outputcontent', onOutputMouseDown)
		//.on('mouseenter','.eden-line', onEnterLine)
		//.on('mouseleave','.eden-line', onLeaveLine)
		.on('click', '.previous-input', onPrevious)
		.on('click', '.next-input', onNext)
		.on('click', '.rewind-input', onRewind)
		.on('click', '.fastforward-input', onFastForward)
		//.on('click', '.share', onShareAgent)
		.on('click', '.menu-input', onMenu)
		.on('click', '.search-mode', onInspect)
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
				if (agent.state[obs_agent] === undefined) {
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
				clearInterval(gutterinterval);
				//Eden.Agent.unlisten(agent);
				for (var i=0; i<tab_frags.length; i++) {
					tab_frags[i].unlock();
					tab_frags[i].ast.destroy();
				}
				scriptast = undefined;
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
		updateEntireHighlight();

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
			edenUI.destroyView(simpleName, true);
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
				dialogClass: "input-dialog",
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

	edenUI.views.History = {
		dialog: this.createHistory,
		title: "Execution History",
		category: edenUI.viewCategories.history
	};
	
	edenUI.history = this.history;
	
	success();
};

EdenUI.plugins.ScriptInput.buildScriptFromList = function(value) {
	var res = "";
	if (value instanceof Array) {
		for (var i=0; i < value.length; i++) {
			if (typeof value[i] == "string") {
				res += value[i] + "\n";
			} else if (typeof value[i] == "object") {
				if (value[i].definition !== undefined) {
					res += value[i].eden_definition+"\n";
				} else {
					var name = value[i].name.slice(1);
					res += name + " = " + Eden.edenCodeForValue(value[i].value()) + ";\n";
				}
			}
		}
	}
	return res;
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


