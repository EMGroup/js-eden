function convertToEdenPage(page,cclass) {
	// Commented out to make the editor global so it's easier for jspe.jse to copy to input window
	// var editor;
	if (page == '#eden-input' && cclass == 'code') {
		$('.exec', page).each(function() {
			var $area = $('<div class="'+cclass+'"></div>');
			var $previous = $(this).prev();
			var $code = $(this).clone();

			$(this).remove();
			//var editor;
			$area.insertAfter($previous);
			if ($code.hasClass('eden')) {
				edeninput = CodeMirror($area.get(0), {
					value: $code.text(),
					mode: "eden"
				});
			} else {
				edeninput = CodeMirror($area.get(0), {
					value: $code.text(),
					mode: "javascript"
				});
			}
	
			$area.click(function() {
				edeninput.focus();
			});
		});
		return edeninput;
	} else {
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
}
