EdenUI.ScriptArea.Mouse = function(sa) {
	function onOutputMouseDown(e) {
		if (sa.readonly) return;

		//setTimeout(function() {
			// To prevent false cursor movement when dragging numbers...
			/*if (document.activeElement === sa.outdiv) {
				var end = getCaretCharacterOffsetWithin(sa.outdiv);
				var start = getStartCaretCharacterOffsetWithin(sa.outdiv);
				sa.intextarea.selectionEnd = end;
				sa.intextarea.selectionStart = end;
				var curline = sa.getLineNumber();
				if (sa.gutter) sa.gutter.selectLine(curline);
			}*/
		//},0);
	}

	/**
	 * Clicking on the highlighted script needs to move the cursor position.
	 * Unless a selection is being made, in which case keep the focus on
	 * the highlighted output instead.
	 */
	function onOutputMouseUp(e) {
		if (e.target.nodeName == "INPUT" || e.target.nodeName == "textarea") return;
		sa.hideInfoBox();
		//hideMenu();

		if (sa.readonlycomment) {
			var seenbutton = false;
			var seencomment = false;
			for (var i=0; i<e.path.length; ++i) {
				if (e.path[i].nodeName == "BUTTON" || e.path[i].nodeName == "A") seenbutton = true;

				if (e.path[i].classList && e.path[i].classList.contains("eden-comment-line")) {
					seencomment = true;
				}
			}
			if ($(e.target).find(".eden-comment-line").length > 0 || seencomment) {
				if (!seenbutton) e.preventDefault();
				sa.intextarea.blur();
				sa.outdiv.blur();
				return;
			}
		}

		if (sa.readonly || e.target.isContentEditable == false) return;

		if (sa.gotomode) {
			var element = e.target;
			if (element.className == "" && element.parentNode.nodeName == "SPAN") {
				element = element.parentNode;
			}
			if (element.className == "eden-selector" || element.className == "eden-selector2") {
				sa.disableGotoMode();
				var path = element.parentNode.textContent;
				Eden.Selectors.goto(path);
				// TODO Use global goto.
				/*var tabs = tabsSym.value();
				tabs.push(path);
				tabsSym.assign(tabs, eden.root.scope, Symbol.localJSAgent);*/
			} else if (element.className == "eden-observable") {
				var obs = element.getAttribute("data-observable");
				Eden.Selectors.goto(obs+":active");
			}
			e.preventDefault();
		} else {
			// To prevent false cursor movement when dragging numbers...
			if (document.activeElement === sa.outdiv) {
				var end = getCaretCharacterOffsetWithin(sa.outdiv);
				var start = getStartCaretCharacterOffsetWithin(sa.outdiv);
				if (start != end) {
					// Fix to overcome current line highlight bug on mouse select.
					sa.refreshentire = true;
				} else {
					// Move caret to clicked location
					sa.intextarea.focus();
					sa.intextarea.selectionEnd = end;
					sa.intextarea.selectionStart = end;
					var curline = sa.currentlineno;
					//gutter.selectLine(curline);
					//if (sa.fragment) {		
						sa.updateLineCachedHighlight();
					//}
					//checkScroll();
				}
			} else {

			}
		}
	}


	sa.outdiv.addEventListener("mouseup",onOutputMouseUp);
	sa.outdiv.addEventListener("mousedown", onOutputMouseDown);
}
