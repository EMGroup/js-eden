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
			this.previousZIndex = this.lastDialog.css('z-index');
			this.lastDialog.css('z-index', 2147483646);
			this.lastDialogMinimized = false;
		}
		this.lastDialogHidden = false;
	}
	//Ensure dialog isn't off screen.
	this.lastDialogLeft = this.lastDialog[0].offsetLeft;
	this.lastDialogWidth = this.lastDialog[0].offsetWidth;
	this.lastDialogTop = this.lastDialog[0].offsetTop;
	this.lastDialogHeight = this.lastDialog[0].offsetHeight;
	if (this.lastDialogLeft >= document.body.scrollLeft + window.innerWidth ||
		this.lastDialogLeft + this.lastDialogWidth <= document.body.scrollLeft
	) {
		dialogContent.parent().offset({
			left: document.body.scrollLeft + (window.innerWidth - this.lastDialogWidth) / 2,
			top: document.body.scrollTop + (window.innerHeight - this.lastDialogHeight) / 2
		});
	}

	this.lastDialog.addClass('menubar-window-raise');
	this.lastDialog.css('z-index', 2147483646);
};

WindowHighlighter.prototype.stopHighlight = function (dialogName, unminimize) {
	if (!this.lastDialog) { return; }

	this.lastDialog.removeClass('menubar-window-raise');

	var dialogContent = edenUI.getDialogContent(dialogName);
	dialogContent.parent().offset({left: this.lastDialogLeft, top: this.lastDialogTop});
	if (!unminimize) {
		if (this.lastDialogHidden) {
			edenUI.hideView(dialogName);
		} else if (this.lastDialogMinimized) {
			dialogContent.dialogExtend("minimize");
		}
	} else {
		if (this.lastDialogLeft + this.lastDialogWidth > document.body.scrollLeft + window.innerWidth) {
			document.body.scrollLeft = this.lastDialogLeft + this.lastDialogWidth - window.innerWidth;
		} else if (this.lastDialogLeft < document.body.scrollLeft) {
			document.body.scrollLeft = this.lastDialogLeft;
		}
		if (this.lastDialogTop + this.lastDialogHeight > document.body.scrollTop + window.innerHeight) {
			document.body.scrollTop = this.lastDialogTop + this.lastDialogHeight - window.innerHeight + edenUI.scrollBarSize2 + edenUI.bottomBarHeight;
		} else if (this.lastDialogTop < document.body.scrollTop) {
			document.body.scrollTop = this.lastDialogTop - edenUI.menuBarHeight;
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