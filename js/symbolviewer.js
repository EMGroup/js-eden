(function () {
	function _shortName(symbol) {
		var parts = symbol.name.split('/');
		return parts[parts.length - 1];
	}

	function SymbolViewer(context, el, dialog) {
		this._context = context;
		this._filter = null;
		this._docs = {functions: {}};
		this._el = el;
		this._list = this._createListView();
		this._tooltip = this._createTooltip();
		this._symbolIndexes = {};
		this._dialog = dialog;
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
		return $('<div class="symbol-info"></div>').css('display', 'none').appendTo('body');
	};

	SymbolViewer.prototype._showInfo = function (node) {
		var $node = $(node);
		var symbol = $node.data('symbol');
		var details = {
			docs: this._docs.functions[_shortName(symbol)],
			definition: symbol.eden_definition
		};

		if (details.docs || details.definition) {
			this._tooltip.html('');
			this._tooltip.append('<div class="symbol-name">'+_shortName(symbol)+'</div>');
			if (details.docs) {
				this._tooltip.append('<div>'+details.docs.description+'</div>');
			}
			if (details.definition) {
				this._tooltip.append('<pre class="ellipsis">'+details.definition+'</pre>');
			}
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

	SymbolViewer.prototype._renderValue = function (symbol) {
		var name = _shortName(symbol);
		var val = symbol.value();
		var valhtml;
		
		if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
		else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
		else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
		else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
		else { valhtml = val; }

		valhtml = " = " + valhtml;

		if (util.isProc(symbol)) {
			if (_(symbol.observees).isEmpty()) {
				valhtml = "";
			} else {
				valhtml = " : " + _(symbol.observees).keys().join(", ");
			}
		}

		else if (util.isFunc(symbol)) {
			var functionDetails = this._docs.functions[name] || {};
			var parameters = functionDetails.parameters || {"...": 1};
			valhtml = "(" + _(parameters).keys().join(", ") + ")";
		}

		return '<span class="result_value">'+valhtml+'</span>';
	};

	SymbolViewer.prototype._renderName = function (symbol) {
		return '<span class="result_name">'+_shortName(symbol)+'</span>';
	};

	SymbolViewer.prototype._classes = function (symbol) {
		var classes = [];
		if (typeof symbol.value() === "function") {
			if (symbol.eden_definition) {
				var subs = symbol.eden_definition.substring(0, 4);
				if (subs === "proc") {
					classes.push("type-procedure");
				} else {
					classes.push("type-function");
				}
			}
			classes.push("type-function");
		} else {
			classes.push("type-observable");
		}
		return classes.join(" ");
	};

	SymbolViewer.prototype._update = function ($node) {
		var symbol = $node.data('symbol');
		$node.attr('class', this._classes(symbol));
		$node.html('<div class="result-element">'+this._renderName(symbol)+this._renderValue(symbol)+'</div>');
	};

	SymbolViewer.prototype._renderEntry = function (symbol) {
		var me = this;
		var $node = $('<li class="'+this._classes(symbol)+'"><div class="result-element">'+this._renderName(symbol)+this._renderValue(symbol)+'</div></li>')
			.hover(this._hoverOn(), this._hoverOff())
			.click(function () { me._dialog(symbol); })
			.data('symbol', symbol);

		new Symbol(undefined, 'symbolviewer/'+_shortName(symbol)).assign(function () {me._update($node);}).observeSymbols(symbol);
		return $node;
	};

	SymbolViewer.prototype.setFilter = function (pattern) {
		this._filter = new RegExp('^(?:'+pattern+')', "i");
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