/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */


/**
 * Generic JSEden context menu widget. Create it pass it the element to
 * be the context menu of. Use addItems to initially populate it, each of
 * which takes two functions, one to calculate enabled/disabled status and one
 * as the action callback.
 */
EdenUI.ContextMenu = function(origin, callback) {
	this.element = $('<div class="eden-contextmenu"></div>');
	this.callback = callback;
	this.origin = origin;
	this.target = undefined;
	this.items = [];

	$(document.body).append(this.element);

	var me = this;

	this.element.on('mousedown', '.eden-contextmenu-item', function(e) {
		var index = parseInt(e.currentTarget.getAttribute("data-index"));
		if (me.items[index].action) me.items[index].action(me.target);
	});

	this.origin.oncontextmenu = function(e) {
		me.target = e.target;
		me.element.css("top", ""+(e.clientY+10)+"px");
		me.element.css("left", ""+e.clientX+"px");

		for (var i=0; i<me.items.length; i++) {
			changeClass(me.items[i].element, "disabled", !me.items[i].status());
		}

		me.element.slideDown("fast");
		e.preventDefault();
	}

	document.addEventListener("mousedown", function() { me.element.hide(); }, true);
}



/**
 * Add a menu item with a font icon, text, an enabled/disabled status function
 * and a callback function.
 */
EdenUI.ContextMenu.prototype.addItem = function(icon, text, statusfunc, actionfunc) {
	var item = $('<div class="eden-contextmenu-item"><span class="eden-contextmenu-icon">'+icon+'</span><span>'+text+'</span></div>');
	item.get(0).setAttribute("data-index", ""+this.items.length);
	this.element.append(item);
	this.items.push({status: statusfunc, action: actionfunc, element: item.get(0)});
}



/**
 * Separator.
 */
EdenUI.ContextMenu.prototype.addSeparator = function() {
	var item = $('<div class="eden-contextmenu-sep"></div>');
	this.element.append(item);
}

