function WindowHighlighter(edenUI) {
	this.edenUI = edenUI;
	this.lastDialog = undefined;
	this.lastDialogMinimized = false;
	this.previousZIndex = undefined;  //z-index before raising, or undefined if window has become unpinned since.
}

WindowHighlighter.prototype.highlight = function (dialogName) {
	this.lastDialog = edenUI.getDialogWindow(dialogName);
	var dialogContent = edenUI.getDialogContent(dialogName);
	var lastDialogMin = dialogContent.data('dialog-extend-minimize-controls');
	if (lastDialogMin) {
		this.previousZIndex = lastDialogMin.css('z-index');
		dialogContent.dialogExtend("restore");
		this.lastDialog.removeClass("window-activated");
		this.lastDialog.addClass('menubar-window-raise');
		this.lastDialog.css('z-index', 2147483646);
		this.lastDialogMinimized = true;
	} else {
		this.lastDialog.addClass('menubar-window-raise');
		this.previousZIndex = this.lastDialog.css('z-index');
		this.lastDialog.css('z-index', 2147483646);
		this.lastDialogMinimized = false;
	}
};

WindowHighlighter.prototype.stopHighlight = function (dialogName, unminimize) {
	if (!this.lastDialog) { return; }

	this.lastDialog.removeClass('menubar-window-raise');

	var dialogContent = edenUI.getDialogContent(dialogName);
	if (this.lastDialogMinimized && !unminimize) {
		dialogContent.dialogExtend("minimize");
	}

	if (this.previousZIndex === undefined) {
		dialogContent.dialog("moveToTop");
	} else {
		this.lastDialog.css('z-index', this.previousZIndex);
	}

	this.lastDialog = undefined;
	this.lastDialogMinimized = false;
	this.previousZIndex = undefined;
};

WindowHighlighter.prototype.unpin = function (dialog) {
	if (dialog === this.lastDialog) {
		this.previousZIndex = undefined;
	}
}