/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */
var edenfunctions = {};

SymbolMeta = function(sym) {
	this.symbol = sym;
	this.interestingness = 0.0;
	this.significance = 0.5;
	this.index = 0;
	this.isinteresting = false;
	this.oldstr = "";
};

SymbolMeta.DependencyComplexityRate = 0.4;
SymbolMeta.DependencyChangeProbability = 0.01;
SymbolMeta.SubscriberRate = 0.1;
SymbolMeta.DecayRate = 0.9999;

//SymbolMeta.AgentPercentage = 2 / 20;
SymbolMeta.DependencyPercentage = 1 / 2;
SymbolMeta.SubscriberPercentage = 1 / 2;
//SymbolMeta.CurrentPercentage = 4 / 23;
//SymbolMeta.DeltaPercentage = 5 / 23;

SymbolMeta.SigDeleteRate = 0.1;
SymbolMeta.SigInterestingRate = 1.01;

/**
 * Calculate an interestingness measure using dependency information.
 *   More dependencies mean increased complexity and complexity is interesting,
 *   however, more dependencies increases the chance of a change occuring
 *   which reduces interestingness as it becomes noise.
 */
SymbolMeta.prototype.dependencyInterestingness = function(ctx) {
	var count = 0;
	var icount = 0;
	var interestingness = 0.1;

	for (var x in this.symbol.dependencies) {
		count++;
		interestingness += (1.0 - interestingness) * SymbolMeta.DependencyComplexityRate;

		var name = x.substr(1);

		if (ctx.meta[name] !== undefined && ctx.meta[name].interestingness >= ctx.minInteresting()) {
			icount++;
		}
	}

	interestingness -= count * SymbolMeta.DependencyChangeProbability;

	if (count != 0) {
		interestingness = (0.5 * interestingness) + (0.5 * (icount / count));
	}

	if (interestingness < 0) return 0;
	else return interestingness;
}


SymbolMeta.prototype.subscriberInterestingness = function(ctx) {
	var count = 0;
	var icount = 0;
	var interestingness = 0;

	for (var x in this.symbol.subscribers) {
		count++;
		interestingness += (1.0 - interestingness) * SymbolMeta.SubscriberRate;

		var name = x.substr(1);

		if (ctx.meta[name] !== undefined && ctx.meta[name].interestingness >= ctx.minInteresting()) {
			icount++;
		}
	}

	interestingness = 1.0 - interestingness;

	if (count != 0) {
		interestingness = (0.5 * interestingness) + (0.5 * (icount / count));
	}
	return interestingness;
}


SymbolMeta.prototype.nameInterestingness = function() {
	var name = this.symbol.name.substr(1);

	if (name[0] == '_') {
		return 0.5;
	} else if (/\d/.test(name)) {
		return 0.9;
	} else {
		return 1.0;
	}
}


SymbolMeta.prototype.frequencyInterestingness = function() {

}


SymbolMeta.prototype.update = function(ctx) {
	var interestingness = 0.0;
	//interestingness += this.dependencyInterestingness() * SymbolMeta.DependencyPercentage;
	//interestingness += this.subscriberInterestingness() * SymbolMeta.SubscriberPercentage;

	interestingness = this.dependencyInterestingness(ctx)
						* this.subscriberInterestingness(ctx)
						* this.nameInterestingness() * this.significance;

	/*if (this.symbol.value() != this.oldvalue) {
		this.oldvalue = this.symbol.value();
		interestingness += SymbolMeta.DeltaPercentage;
	}
	interestingness += this.interestingness * SymbolMeta.CurrentPercentage;*/

	this.interestingness = interestingness;
};

/**
 * JS-Eden Symbol Viewer Plugin.
 * This plugs provides several views for inspecting the JS-Eden symbol table.
 * The views include: Functions, Observables, Agents and All.
 *
 * @author Nicolas Pope
 * @constructor
 * @param context The eden context this plugin is being loaded in to.
 */

EdenUI.plugins.ObservableMining = function (edenUI, success) {
	var me = this;

	/* Symbol meta data */
	this.meta = {};
	this.interesting = [];

	this.limitInteresting = 15;

	this.symresults = undefined;
	this.symbolsui = [];

	var generateHTML = function (viewName) {
		var html = "<div class=\"symbolframer-results\"></div>";
		return html;
	};

	/**
	 * Construct a jQuery dialog wrapper for a symbol list instance. Also
	 * constructs the symbol list instance and embeds it into the dialog.
	 *
	 * @param {string} name Identifier for the dialog. Must be globally unique.
	 * @param {string} mtitle Title string for the dialog.
	 * @param {string} Type of symbols to show: obs,agent,func,all.
	 */
	this.createDialog = function (name, mtitle) {
		var edenName = name.slice(0, -7);
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML(name));
		me.symresults = code_entry.find(".symbolframer-results")[0];

		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 360,
				height: 400,
				minHeight: 200,
				minWidth: 200,
				dialogClass: "unpadded-dialog"
			});
	};

	/**
	 * The delay between updates of all the symbol viewers. A higher value
	 * reduces the update frequency which improves performance but gives a
	 * sluggish look to the symbol lists.
	 */
	this.delay = 100;

	var symbolChanged = undefined;

	/**
	 * Timeout function for updating symbol lists with any recently changed
	 * or created symbols.
	 * @private
	 */
	var sym_changed_to = function () {
		if (me.symresults !== undefined) {
			var parent = $(me.symresults).parent();
			$(me.symresults).detach();

			// Check for free ui slots...
			for (var i = 0; i < me.symbolsui.length; i++) {
				if (me.symbolsui[i].meta.dodelete) {
					me.symbolsui.splice(i, 1);
				} else if (me.symbolsui[i].meta.isinteresting == false) {
					var myelement = me.symbolsui[i].element;
					me.symbolsui[i].element.hide( "drop", { direction: "right" }, "slow", function() {
						myelement.remove();
					});
					me.symbolsui.splice(i, 1);
				}
			}

			var mini = me.minInteresting();
			var maxi = me.maxInteresting();

			for (var i = 0; i < me.interesting.length; i++) {
				var found = false;
				for (var j = 0; j < me.symbolsui.length; j++) {
					if (me.symbolsui[j].meta == me.interesting[i]) {
						found = true;
						break;
					}
				}

				if (!found) {
					//Make new symbolui entry for this symbol.
					var symui = new EdenUI.plugins.ObservableMining.Symbol();
					me.symbolsui.push(symui);
					symui.element.appendTo(me.symresults);
					symui.symbol = me.interesting[i].symbol;
					var name = symui.symbol.name.substr(1);
					symui.name = name;
					symui.meta = me.interesting[i];
					symui.outofdate = true;
					symui.symbolChanged = symbolChanged;
				}
			}

			// For every recently created symbol
			for (var i = 0; i < me.symbolsui.length; i++) {
				me.symbolsui[i].update(mini, maxi);
			}

			// Add symbol list back into the DOM for display.
			$(me.symresults).appendTo(parent);
		}

		// Decay interestingness
		for (var i = 0; i < me.interesting.length; i++) {
			me.interesting[i].interestingness *= SymbolMeta.DecayRate;
		}

		setTimeout(sym_changed_to,me.delay);
	};

	sym_changed_to();

	/**
	 * Called every time a symbol is changed or created. Then proceeds to
	 * update all visible symbol lists.
	 */
	symbolChanged = function (sym, create) {
		var name = sym.name.substr(1);
		var meta = me.meta[name];

		if (me.symresults === undefined) return;

		// Does the symbol have a definition
		if (!sym.definition || !sym.eden_definition) {
			if (typeof(sym.cache.value) == "function") {
				return;
			}
		} else {
			// Find out what kind of definition it is (proc, func or plain)
			var definition = sym.eden_definition;
	
			if (/^proc\s/.test(definition)) {
				return;
			} else if (/^func\s/.test(definition)) {
				return;
			} else {
				//Dependency
				if (typeof(sym.cache.value) == "function") {
					return;
				}
			}
		}

		if (create || meta === undefined) {
			me.meta[name] = new SymbolMeta(sym);
			meta = me.meta[name];
		}
		meta.update(me);

		if (meta.isinteresting == false) {
			me.interesting.sort(function(a,b) { return b.interestingness - a.interestingness; });

			if (meta.interestingness >= me.minInteresting()) {
				var ix = me.interesting.length;

				if (me.interesting.length == me.limitInteresting) {
					var uninteresting = me.interesting[me.interesting.length-1];
					uninteresting.isinteresting = false;
					//ix = uninteresting.index;
					me.interesting.pop();
					
				}

				me.interesting.push(meta);
				meta.isinteresting = true;
				meta.significance *= SymbolMeta.SigInterestingRate;

				me.interesting.sort(function(a,b) { return b.interestingness - a.interestingness; });
			}
		} else {
			
		}
	};

	// Register event handler for symbol changes.
	edenUI.eden.root.addGlobal(symbolChanged);

	// Add views supported by this plugin.
	edenUI.views["ObservableMining"] = {dialog: this.createDialog, title: "Observable Mining", category: edenUI.viewCategories.comprehension, menuPriority: 1};

	$(document).tooltip();
	success();
};

EdenUI.plugins.ObservableMining.prototype.minInteresting = function() {
	if (this.interesting.length > 0) {
		return this.interesting[this.interesting.length - 1].interestingness;
	} else {
		return 0.0;
	}
}

EdenUI.plugins.ObservableMining.prototype.maxInteresting = function() {
	if (this.interesting.length > 0) {
		return this.interesting[0].interestingness;
	} else {
		return 0.0;
	}
}

/* Plugin meta information */
EdenUI.plugins.ObservableMining.title = "Observable Mining";
EdenUI.plugins.ObservableMining.description = "Automatically generate search for interesting observables";

/**
 * A class for an individual symbol result which deals with HTML formatting.
 *
 * @author Nicolas Pope
 * @constructor
 * @param symbol Internal EDEN symbol object.
 * @param name Name of the symbol.
 * @param Already detected type of the symbol: procedure,function,observable.
 */
EdenUI.plugins.ObservableMining.Symbol = function () {
	this.symbol = undefined;
	this.name = undefined;
	this.meta = undefined;
	this.element = $('<div class="symbolframer-result-element"><div class="observable"></div></div>');
	this.details = undefined;
	this.update = undefined;
	this.outofdate = false;
	this.dodelete = false;
	this.symbolChanged = undefined;
	this.editing = false;

	this.update = this.updateObservable;
	var me = this;
	this.element.hover(
		function() {
			$(this).animate({backgroundColor: "#eaeaea"}, 100);
		}, function() {
			$(this).animate({backgroundColor: "#fafafa"}, 100);
			if (me.editing == true) {
				me.editing = false;
				me.element.find("textarea").remove();
				me.element.animate({'height': '20px'}, 'fast');
			}
		}	
	).click(function () {
		if (me.editing) return;

		var val;
		if (typeof me.symbol.value() === 'function' && me.symbol.eden_definition !== undefined) {
			val = me.symbol.eden_definition;
		} else {
			if (me.symbol.definition) {
				val = me.symbol.eden_definition + ";";
			} else {
				val = me.name + " = " + Eden.edenCodeForValue(me.symbol.value()) + ";";
			}
		}

		me.element.animate({'height': '60px'}, {duration: 200, complete: function() {
			var text = $('<textarea class="mine_edit_box" style="display: none"></textarea>');
			text.val(val);
			text.appendTo(me.element);
			text.show('fast');
		}});
		me.editing = true;
	}).draggable({
		distance: 40, axis: "x", scroll: false,
		drag: function(event, ui) {
			if (ui.position.left > 150) {
				me.dodelete = true;
			} else {
				me.dodelete = false;
			}
		},
		revert: function(event, ui) {
			return !me.dodelete;
		},
		stop: function(event, ui) {
			if (me.dodelete) {
				me.meta.significance *= SymbolMeta.SigDeleteRate;
				me.symbolChanged(me.symbol, false);
				me.element.hide( "drop", { direction: "right" }, "slow", function() {
					me.element.remove();
				});
			}
		}
	});

};

function _formatFramerVal(value) {
	var str = Eden.prettyPrintValue("", value, 200, false, false);
	switch (typeof(value)) {
	case "boolean":
		return "<span class='special_text'>" + str + "</span>";
	case "undefined":
		return "<span class='error_text'>@</span>";
	case "string":
		return "<span class='string_text'>" + str + "</span>";
	case "number":
		return "<span class='numeric_text'>" + str + "</span>";
	default:
		return str;
	}
};

/**
 * Update the HTML output of a plain observable symbol. Detects the data type
 * of the observable to display its current value correctly.
 */
EdenUI.plugins.ObservableMining.Symbol.prototype.updateObservable = function (mini, maxi) {
	if (this.symbol === undefined) return;

	if (maxi == 0) maxi = 1;
	var fscale = (this.meta.interestingness - mini) * (1 / (maxi - mini));
	var fontsize = Math.round(8 + ((20 - 8) * fscale));

	var val = this.symbol.value();
	var valhtml = _formatFramerVal(val);

	var namehtml;
	if (this.symbol.definition !== undefined) {
		namehtml = "<span class='hasdef_text'>" + this.name + "</span>";
	} else {
		namehtml = this.name;
	}

	// class='result_name'
	var html = "<span>" + namehtml + "</span><span class='result_separator'> = </span> " +
		"<span class='result_value'>" + valhtml + "</span>";

	if (this.symbol.definition !== undefined) {
		var tooltip = Eden.htmlEscape(this.symbol.eden_definition, false, true);
		tooltip = Eden.htmlEscape("<pre class='symbollist-tooltip'>" + tooltip + ";</pre>");
		html = "<span onmouseenter='EdenUI.showTooltip(event, \"" + tooltip + "\")' onmouseleave='EdenUI.closeTooltip()'>" + html + "</span>";
	}

	var span = this.element.find(".observable");
	span.html(html);
	span.css({'font-size': fontsize + "px"});
};

