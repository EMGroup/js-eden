function addSymbolTable(root) {
	var $symbolTableContainer = $('<div class="symbolTable"></div>')
		.append('<h3>Observables</h3>')
		.append('<small>(mouseover for definitions)</small>')
		.insertBefore('#model-body');

	var $symbolTable = $('<ul></ul>')
		.appendTo($symbolTableContainer);

	$(root).bind('symbolCreate', function(e, s, name) {

		var $value = $('<span class="value"></span>');
		var $nameAndValue = $('<p><span class="name">' + name + '</span> = </p>')
			.append($value);

		var $view = $('<li></li>')
			.append($nameAndValue)
			.appendTo($symbolTable);

		var $definition = $('<pre></pre>')
			.addClass('symbolDefinition')
			.css('position', 'absolute')
			.hide()
			.appendTo(document.body);

		// XXX: currently symbols don't really specify if their definition
		// has been changed, only that they're out of date
		//
		// should probably have Symbol.value_up_to_date
		// and
		// Symbol.definition_up_to_date
		var lastSeenDefinition = undefined;

		function updateSymbolDefinition() {
			// only update if the definition has changed since last time
			if (lastSeenDefinition !== s.definition) {
				lastSeenDefinition = s.definition;

				if (s.definition && s.eden_definition) {
					$definition.text(s.eden_definition);
				} else {
					$definition.text("" + s.definition);
				}
			}
		}

		function setHtmlClassAsAssignedOrDerived() {
			if (s.definition) {
				$view.addClass('derivedValue');
			} else {
				$view.addClass('assignedValue');
			}
		}

		function updateSymbolValue() {
			var value = s.value();

			if (typeof value === "function") {
				$value.text("function() { ... }");
			} else {
				$value.text("" + s.value());
			}
		}

		function updateSymbolView() {
			updateSymbolValue();
			updateSymbolDefinition();
			setHtmlClassAsAssignedOrDerived();
		}

		var watcher = new Symbol();
		watcher.context = root;
		watcher.name = "/symbolTable/" + name;
		watcher.assign(updateSymbolView).observe([name]);

		var mouseOver = false;

		$nameAndValue.mouseover(function(e) {
			if (!mouseOver) {
				mouseOver = true;
				if (lastSeenDefinition) {
					$definition
						.css({top:e.pageY, left: e.pageX - $definition.width()})
						.show();
				}
			}
		}).mouseleave(function() {
			mouseOver = false;
			$definition.hide();
		});

		updateSymbolView();
	});
}
