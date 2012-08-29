(function () {
	function _shortName(symbol) {
		var parts = symbol.name.split('/');
		return parts[parts.length - 1];
	}

	function SymbolViewer(context, el) {
		this._context = context;
		this._filter = null;
		this._docs = null;
		this._el = el;
		this._list = this._createListView();
		this._tooltip = this._createTooltip();
		this._symbolIndexes = {};
	}

	SymbolViewer.prototype.setDocs = function (docs) {
		this._docs = docs;
		this.render();
	};

	SymbolViewer.prototype._createListView = function () {
		return $('<div></div>').appendTo(this._el);
	};

	SymbolViewer.prototype._hoverOn = function () {
		var me = this;
		return function () {
			$(this).stop().animate({backgroundColor: "#eaeaea"});
			me._showInfo(this);
			return false;
		};
	};

	SymbolViewer.prototype._createTooltip = function () {
		return $('<div class="symbol-info"></div>').appendTo(this._el);
	};

	SymbolViewer.prototype._showInfo = function (node) {
		var $node = $(node);
		var symbol = $node.data('symbol');
		var details;
		if (this._docs) {
			details = this._docs.functions[_shortName(symbol)];
		}

		if (details) {
			this._tooltip.text(details.description);
			var left = (node.offsetLeft + node.offsetWidth) + "px";
			var top = node.offsetTop + "px";
			this._tooltip.css("left", left);
			this._tooltip.css("top", top);
			this._tooltip.show();
		} else {
			this._hideInfo();
		}
	};

	SymbolViewer.prototype._hideInfo = function () {
		this._tooltip.hide();
	};

	SymbolViewer.prototype._hoverOff = function () {
		var me = this;
		return function () {
			$(this).stop().animate({backgroundColor: "white"});
			me._hideInfo(this);
			return false;
		};
	};

	// could at least use binary search to speed this up
	SymbolViewer.prototype.addEntry = function (symbol) {
		var name = _shortName(symbol);
		var $node;
		if (!this._filter || name.search(this._filter) != -1) {
			var entries = this._list.children();
			$node = this._renderEntry(symbol);
			for (var i = 0; i < entries.length; ++i) {
				if ($(entries[i]).text().toLowerCase() >= name.toLowerCase()) {
					$(entries[i]).before($node);
					return;
				}
			}
			$(this._list).append($node);
		}
	};

	SymbolViewer.prototype.updateEntry = function (symbol) {

	};

	SymbolViewer.prototype._renderValue = function (symbol) {
		var name = _shortName(symbol);
		var val = symbol.value();
		
		if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
		else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
		else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
		else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
		else { valhtml = val; }

		valhtml = " = " + valhtml;

		if (this._docs && this._docs.functions) {
			var functionDetails = window.edenfunctions.functions[name];
			if (functionDetails && functionDetails.parameters) {
				valhtml = "(" + _(functionDetails.parameters).keys().join(", ") + ")";
			}
		}

		return '<span class="result_value">'+valhtml+'</span>';
	};

	SymbolViewer.prototype._renderName = function (symbol) {
		return '<span class="result_name">'+_shortName(symbol)+'</span>';
	};

	SymbolViewer.prototype._classes = function (symbol) {
		var classes = [];
		if (typeof symbol.value() === "function") {
			classes.push("type-function");
		} else {
			classes.push("type-observable");
		}
		return classes.join(" ");
	};

	SymbolViewer.prototype._update = function ($node) {
		var symbol = $node.data('symbol');
		$node.html('<div class="result-element">'+this._renderName(symbol)+this._renderValue(symbol)+'</div>');
	};

	SymbolViewer.prototype._renderEntry = function (symbol) {
		var $node = $('<li class="'+this._classes(symbol)+'"><div class="result-element">'+this._renderName(symbol)+this._renderValue(symbol)+'</div></li>')
			.hover(this._hoverOn(), this._hoverOff())
			.data('symbol', symbol);

		var me = this;
		new Symbol(undefined, 'symbolviewer/'+_shortName(symbol)).assign(function () {me._update($node);}).observeSymbols(symbol);
		return $node;
	};

	SymbolViewer.prototype.setFilter = function (pattern) {
		this._filter = new RegExp('^'+pattern);
		this.render();
	};

	SymbolViewer.prototype.render = function () {
		var names = _(this._context.symbols).keys().sort();
		this._list.html('');
		this._symbolIndexes = {};
		var count = 0;
		for (var i = 0; i < names.length; ++i) {
			var name = names[i];
			if (!this._filter || name.search(this._filter) != -1) {
				var symbol = this._context.symbols[name];
				var $node = this._renderEntry(symbol);
				$(this._list).append($node);
			}
		}
	};

	window.SymbolViewer = SymbolViewer;
}());