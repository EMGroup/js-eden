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

function convertToEdenPageNew(page,cclass) {
	var editor;
	$('.exec', page).each(function() {
		var $area = $('<div class="'+cclass+'"></div>');
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
	});
	return editor;
}
