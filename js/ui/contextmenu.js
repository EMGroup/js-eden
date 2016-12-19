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
EdenUI.ContextMenu = function(origin) {
	this.element = $('<div class="eden-contextmenu"></div>');
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
		if (me.target.nodeName == "SPAN") me.target = me.target.parentNode;
		var nx = document.body.scrollLeft+e.clientX;
		if (nx + 150 >= screen.width) nx -= ((nx + 150) - screen.width);
		me.element.css("top", ""+(document.body.scrollTop+e.clientY+10)+"px");
		me.element.css("left", ""+nx+"px");

		for (var i=0; i<me.items.length; i++) {
			var status;
			if (typeof me.items[i].status == "function") {
				status = me.items[i].status(me.target);
			} else {
				status = me.items[i].status;
			} 
			changeClass(me.items[i].element, "disabled", !status);
		}

		me.element.slideDown(100);
		e.preventDefault();
	}

	document.addEventListener("mousedown", function() { me.element.hide(); }, true);
}



/**
 * Add a menu item with a font icon, text, an enabled/disabled status function
 * and a callback function.
 *   @param icon A unicode character for the icon font.
 *   @param text Text label for action..
 *   @param statusfunc A boolean value or a function returning a boolean.
 *   @param actionfunc Called when action is clicked.
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

