function WindowHighlighter(edenUI) {
	this.edenUI = edenUI;
	this.lastDialog = undefined;
	this.lastDialogMinimized = false;
	this.lastDialogHidden = false;
	this.previousZIndex = undefined;  //z-index before raising, or undefined if window has become unpinned since.
}

WindowHighlighter.prototype.highlight = function (dialogName) {
	this.lastDialog = edenUI.getDialogWindow(dialogName);
	var dialogContent = edenUI.getDialogContent(dialogName);
	if (!dialogContent.dialog("isOpen")) {
		this.previousZIndex = undefined;
		edenUI.showView(dialogName);
		edenUI.moveView(dialogName);
		this.lastDialogHidden = true;
	} else {
		var lastDialogMin = dialogContent.data('dialog-extend-minimize-controls');
		if (lastDialogMin) {
			this.previousZIndex = lastDialogMin.css('z-index');
			dialogContent.dialogExtend("restore");
			this.lastDialog.removeClass("window-activated");
			this.lastDialogMinimized = true;
		} else {
			this.lastDialog.addClass('menubar-window-raise');
			this.previousZIndex = this.lastDialog.css('z-index');
			this.lastDialog.css('z-index', 2147483646);
			this.lastDialogMinimized = false;
		}
		this.lastDialogHidden = false;
	}
	this.lastDialog.addClass('menubar-window-raise');
	this.lastDialog.css('z-index', 2147483646);
};

WindowHighlighter.prototype.stopHighlight = function (dialogName, unminimize) {
	if (!this.lastDialog) { return; }

	this.lastDialog.removeClass('menubar-window-raise');

	var dialogContent = edenUI.getDialogContent(dialogName);
	if (!unminimize) {
		if (this.lastDialogHidden) {
			edenUI.hideView(dialogName);
		} else if (this.lastDialogMinimized) {
			dialogContent.dialogExtend("minimize");
		}
	}

	if (this.previousZIndex !== undefined) {
		this.lastDialog.css('z-index', this.previousZIndex);
	}

	this.lastDialog = undefined;
	this.lastDialogMinimized = false;
	this.lastDialogHidden = false;
	this.previousZIndex = undefined;
};

WindowHighlighter.prototype.unpin = function (dialog) {
	if (dialog === this.lastDialog) {
		this.previousZIndex = undefined;
	}
}