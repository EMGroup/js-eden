EdenUI.ScriptArea.Keyboard = function(sa) {
	function genKey(e) {
		var key = e.key;
		if (e.shiftKey) key = "Shift-"+key;
		if (e.altKey) key = "Alt-"+key;
		if (e.ctrlKey || e.metaKey) key = "Ctrl-"+key;
		return key;
	}
	/**
	 * Various keys have special actions that require intercepting. Tab key
	 * must insert a tab, shift arrows etc cause selection and require a
	 * focus shift, and adding or deleting lines need to force a full
	 * rehighlight.
	 */
	function onTextKeyDown(e) {
		var key = genKey(e);
		console.log(e);

		switch(key) {
		case "Tab"			:	e.preventDefault();
								sa.insertTab();
								break;
		case "ArrowLeft"	:
		case "ArrowRight"	:
		case "ArrowUp"		:
		case "ArrowDown"	:
		case "Home"			:
		case "End"			:	sa.moveCaret(); break;

		case "Ctrl-a"					:	sa.selectAll(); break;

		case "Ctrl-Shift-ArrowLeft"		:
		case "Ctrl-Shift-ArrowRight"	:
		case "Ctrl-Shift-ArrowUp"		:
		case "Ctrl-Shift-ArrowDown"		:
		case "Ctrl-Shift-Home"			:
		case "Ctrl-Shift-End"			:		
		case "Shift-ArrowLeft"			:
		case "Shift-ArrowRight"			:
		case "Shift-ArrowUp"			:
		case "Shift-ArrowDown"			:
		case "Shift-Home"				:
		case "Shift-End"				:	sa.focusOutput(); break;

		case "Backspace"	:	sa.refreshentire = sa.intextarea.value.charCodeAt(sa.intextarea.selectionStart-1) == 10; break;
		case "Enter"		:	sa.refreshentire = true; break;

		case "Ctrl-Control"	:	sa.enableGotoMode(); break;
		}
	}



	/**
	 * Pasting must highlight entire script, not just current line.
	 */
	function onTextPaste(e) {
		sa.refreshentire = true;
	}



	/**
	 * Some keys don't change content but still need a rehighlight. And,
	 * in case the input change event is skipped (Chrome!!), make sure a
	 * rebuild does happen.
	 */
	function onTextKeyUp(e) {
		var key = genKey(e);

		switch(key) {
		case "Ctrl-Control"	:	sa.disableGotoMode(); break;
		case "ArrowLeft"	:
		case "ArrowRight"	:
		case "ArrowUp"		:
		case "ArrowDown"	:
		case "Home"			:
		case "End"			:	sa.updateLineCachedHighlight();
								sa.gutter.selectLine(sa.currentlineno);
								sa.checkScroll();
								break;
		default : //sa.rebuild();
		}
	}



	/**
	 * When focus is on the output and a key is pressed. This occurs when
	 * text is selected that needs replacing.
	 */
	function onOutputKeyDown(e) {
		if (!(e.shiftKey && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36))) {
			sa.focusText();
		}
	}



	/**
	 * Make sure paste goes into text area, and then once done,
	 * update the highlight. The actual paste occurs after the event!
	 */
	function onOutputPaste(e) {
		sa.intextarea.focus();
		setTimeout(function() { sa.updateEntireHighlight() }, 0);
	}



	function onOutputKeyUp(e) {
		if (e.keyCode == 17 || e.keyCode == 91 || e.keyCode == 92) {
			sa.disableGotoMode();
		}
	}



	/**
	 * Make the caret look invisible. It must still exist to keep record
	 * of current location for selection purposes.
	 */
	function onTextBlur(e) {
		// Delete the fake caret
		$(sa.outdiv).find(".fake-caret").remove();
		//this.hideInfoBox();
	}


	/**
	 * Event handler for input change.
	 */
	function onInputChanged(e) {
		sa.dirty = true;
		sa.rebuild();
	}



	/**
	 * Make the caret visible.
	 */
	function onTextFocus(e) {
		//$(outdiv).find(".fake-caret").removeClass("fake-blur-caret");
	}

	// Add the event listeners
	sa.intextarea.addEventListener("input", onInputChanged);
	sa.intextarea.addEventListener("keydown", onTextKeyDown);
	sa.intextarea.addEventListener("keyup", onTextKeyUp);
	sa.intextarea.addEventListener("paste", onTextPaste);
	sa.outdiv.addEventListener("keydown", onOutputKeyDown);
	sa.outdiv.addEventListener("keyup", onOutputKeyUp);
	sa.outdiv.addEventListener("paste", onOutputPaste);
	sa.intextarea.addEventListener("blur", onTextBlur);
	sa.intextarea.addEventListener("focus", onTextFocus);
}
