/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.plugins.adm = function(context) {
	var me = this;
		
	 /** @public */
     this.createDialog = function(name, mtitle) {
	    var myeditor;
		
		$code_entry = $('<div id="'+name+'-input" class=\"inputwindow-code\"><div></div><pre class="eden exec"></pre></div>');
		$dialog = $('<div id="'+name+'"></div>')
			.html($code_entry)
			.dialog({
					title: mtitle,
					width: 360,
					height: 400,
					minHeight: 200,
					minWidth: 360,
				buttons: [
					{
						id: "btn-submit",
						text: "Submit",
						click: function() {
							//submitAdmCode({editor: myeditor});
						}
					},
					{
						text: "Previous",
						click: function() {
							//loadPreviousAdmCode({editor: myeditor});
						}
					},
					{
						text: "Next",
						click: function() {
							//loadNextAdmCode({editor: myeditor});
						}
					}
				]
			});
			
		input_dialog = $dialog;
		
		$("#btn-submit").css("margin-right", "30px");
		
		myeditor = convertToEdenPageNew('#'+name+'-input','code');

	}
	
	/** @public */
	this.createEmbedded = function(name, edenparser) {

	}
	
	context.views.adm = {
		dialog: this.createDialog,
		embed: this.createEmbedded,
		title: "ADM Input Window"
	};
};

Eden.plugins.adm.title = "ADM Input Window";
Eden.plugins.adm.description = "ADM input window";
Eden.plugins.adm.author = "Ruth King";
