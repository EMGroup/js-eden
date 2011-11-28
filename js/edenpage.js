function convertToEdenPage(page) {
	$('.exec', page).each(function() {
		var $area = $('<div class="code"></div>');
		var $previous = $(this).prev();
		var $code = $(this).clone();

		$(this).remove();
		$area.insertAfter($previous);
		var editor;
		if ($code.hasClass('eden')) {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "eden"
			});
		} else {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "javascript"
			});
		}

		var $button;
		if ($code.hasClass('eden')) {
			$button = $('<button>execute</button>').click(function() {
				eval(Eden.translateToJavaScript(editor.getValue()));
			});
		} else {
			$button = $('<button>execute</button>').click(function() {
				eval(editor.getValue());
			});
		}
		$area.append($button);
	});
}

function convertToEdenPageNew(page) {
	var editor;
	$('.exec', page).each(function() {
		var $area = $('<div class="code"></div>');
		var $previous = $(this).prev();
		var $code = $(this).clone();

		$(this).remove();
		//var editor;
		$area.insertAfter($previous);
		if ($code.hasClass('eden')) {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "eden"
			});
		} else {
			editor = CodeMirror($area.get(0), {
				value: $code.text(),
				mode: "javascript"
			});
		}

		$area.click(function() {
			editor.focus();
		});

		/* DOES NOT WORK */
		$area.bind('keyup','alt+n', function() {
			editor.setValue(eden.nextHistory());
		});
		$area.bind('keyup','alt+p', function() {
			editor.setValue(eden.previousHistory());
		});

		/*var $buttonarea = $('<div class="code_buttons"></div');
		//$area.append($buttonarea);
		$buttonarea.insertAfter($area);

		$buttonarea.append($('<button>Previous</button>').click(function() {
			editor.setValue(eden.previousHistory());
		}));

		$buttonarea.append($('<button>Next</button>').click(function() {
			editor.setValue(eden.nextHistory());
		}));

		var $button;
		if ($code.hasClass('eden')) {
			$button = $('<button>Submit</button>').click(function() {

				try {
					eden.addHistory(editor.getValue());
					eval(Eden.translateToJavaScript(editor.getValue()));
					editor.setValue("");
					//printSymbolTable();
					printAllUpdates();
					//eden.saveLocalModelState();
				} catch(e) {
					$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>\n" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
					eden.errornumber = eden.errornumber + 1;
				}

				//eval(Eden.translateToJavaScript(editor.getValue()));
			});
		} else {
			$button = $('<button>execute</button>').click(function() {
				eval(editor.getValue());
			});
		}
		$buttonarea.append($button);*/
	});
	return editor;
}
