Eden.plugins.InputWindow = function(context) {
	var me = this;

	context.views.InputWindow = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "ADM Input Window"
	};
};

Eden.plugins.InputWindow.title = "ADM Input Window";
Eden.plugins.InputWindow.description = "ADM input window";
Eden.plugins.InputWindow.author = "Ruth King";
