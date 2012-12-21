var selected_observable = null;
var selected_function = null;
var delayed_creation_timeout = false;

var SYMBOL_TYPES = {
	observable: true,
	functions: true,
	drawable: true,
	procedure: true
};

function makeSearchRegexes(types) {
	var regexes = {};
	for (var t in types) {
		var pattern = $('#'+t+'-search').val();
		regexes[t] = pattern ? new RegExp("^"+pattern+".*") : undefined;
	}
	return regexes;
}

function shouldAdd(maybeRegex, name) {
	return !maybeRegex || name.search(maybeRegex) != -1;
}

function printObservables() {
	return;
	obspos = 0;

	var regexes = makeSearchRegexes(SYMBOL_TYPES);

	$('#observable-results').html('');
	$('#functions-results').html('');
	$('#drawable-results').html('');
	$('#procedure-results').html('');

	$.each(root.symbols, function (name, symbol) {
		if (!symbol.definition || !symbol.eden_definition) {
			if (shouldAdd(regexes.observable, name)) {
				add_observable(symbol, name);
			}
			return;
		}

		var subs = symbol.eden_definition.substring(0,4);
		if (subs == "proc" && shouldAdd(regexes.procedure, name)) {
			add_procedure(symbol, name);
		} else if (subs == "func" && shouldAdd(regexes.functions, name)) {
			add_function(symbol, name);
		} else if (shouldAdd(regexes.observable, name)) {
			add_observable(symbol, name);
		}
	});


	if ($('#observable-results')[0].offsetHeight > (14*16)) {
		$('#observable-scrollup').show();
		$('#observable-scrolldown').show();
	} else {
		$('#observable-scrollup').hide();
		$('#observable-scrolldown').hide();
	}

	if ($('#functions-results')[0].offsetHeight > (14*16)) {
                $('#functions-scrollup').show();
                $('#functions-scrolldown').show();
        } else {
                $('#functions-scrollup').hide();
                $('#functions-scrolldown').hide();
        }

}


var selected_project = null;



function printAllUpdates() {
	//printObservables($('#observable-search')[0].value);
}


