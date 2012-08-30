(function () {
	window.util = {
		isFunc: function (symbol) {
			return typeof symbol.value() == "function";
		},

		isProc: function (symbol) {
			return symbol.eden_definition && symbol.eden_definition.substring(0, 4) === "proc";
		}
	};
}());