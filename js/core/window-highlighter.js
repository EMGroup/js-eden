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
	var scrollX = window.pageXOffset;
	var scrollY = window.pageYOffset;
	if (this.lastDialogLeft >= scrollX + window.innerWidth ||
		this.lastDialogLeft + this.lastDialogWidth < scrollX ||
		this.lastDialogTop >= scrollY + window.innerHeight ||
		this.lastDialogTop + this.lastDialogHeight < scrollY
	) {
		dialogContent.parent().offset({
			left: scrollX + (window.innerWidth - this.lastDialogWidth) / 2,
			top: scrollY + (window.innerHeight - this.lastDialogHeight) / 2
		});
	}

	this.lastDialog.addClass('menubar-window-raise');
	this.lastDialog.css('z-index', 2147483646);
};

WindowHighlighter.prototype.stopHighlight = function (dialogName, unminimize) {
	if (!this.lastDialog) { return; }

	this.lastDialog.removeClass('menubar-window-raise');

	var dialogContent = edenUI.getDialogContent(dialogName);
	dialogContent.parent().offset({left: this.lastDialogLeft, top: this.lastDialogTop + edenUI.menuBarHeight});
	if (!unminimize) {
		if (this.lastDialogHidden) {
			edenUI.hideView(dialogName);
		} else if (this.lastDialogMinimized) {
			dialogContent.dialogExtend("minimize");
		}
	} else {
		var scrollX = window.pageXOffset;
		var scrollY = window.pageYOffset;
		var needsScrolling = false;
		if (this.lastDialogLeft + this.lastDialogWidth > scrollX + window.innerWidth) {
			scrollX = this.lastDialogLeft + this.lastDialogWidth - window.innerWidth;
			needsScrolling = true;
		} else if (this.lastDialogLeft < scrollX) {
			scrollX = this.lastDialogLeft;
			needsScrolling = true;
		}
		if (this.lastDialogTop + this.lastDialogHeight > scrollY + window.innerHeight - edenUI.menuBarHeight) {
			scrollY = this.lastDialogTop + this.lastDialogHeight - window.innerHeight - edenUI.menuBarHeight + edenUI.scrollBarSize2 + edenUI.bottomBarHeight;
			needsScrolling = true;
		} else if (this.lastDialogTop < scrollY) {
			scrollY = this.lastDialogTop - edenUI.menuBarHeight;
			needsScrolling = true;
		}
		if (needsScrolling) {
			window.scrollTo(scrollX, scrollY);
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
