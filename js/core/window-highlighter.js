function WindowHighlighter(edenUI) {
	this.edenUI = edenUI;
	this.lastDialog = undefined;
	this.previousZIndex = undefined;
}

WindowHighlighter.prototype.highlight = function (dialogName) {
	this.lastDialog = edenUI.getDialogWindow(dialogName);
	var lastDialogMin = edenUI.getDialogContent(dialogName).data('dialog-extend-minimize-controls');
	if (lastDialogMin) {
		lastDialogMin.addClass('menubar-window-raise');
		previousZIndex = lastDialogMin.css('z-index');
		this.lastDialogMin.css('z-index', 2147483646);
		lastDialogMin.css('position', 'relative');
	} else {
		this.lastDialog.addClass('menubar-window-raise');
		previousZIndex = this.lastDialog.css('z-index');
		this.lastDialog.css('z-index', 2147483646);
	}
};

WindowHighlighter.prototype.stopHighlight = function (dialogName) {
	if (!this.lastDialog) { return; }

	// check if window is minimized, this data attribute is set by dialogExtend
	var lastDialogMin = edenUI.getDialogContent(dialogName).data('dialog-extend-minimize-controls');
	var elementToStopHighlighting = lastDialogMin || this.lastDialog;

	elementToStopHighlighting
		.removeClass('menubar-window-raise')
		.css('z-index', previousZIndex);
	this.lastDialog = undefined;
	this.previousZIndex = undefined;
};
