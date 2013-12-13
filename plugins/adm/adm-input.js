/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

Eden.plugins.adm = function(context) {
	var me = this;
	
	/** @private */
	var generateHTML = function(name) {
		return '<div id="'+name+'-input" class=\"inputwindow-code\">\
			<form>\
				<label>Name: </label><input type=\"text\" class=\"adm-name\"></input><br>\
				<label>Entities:</label><br><textarea class=\"adm-entities\"></textarea><br>\
				<label>Actions:</label><br><textarea class=\"adm-actions\"></textarea>\
			</form>\
		</div>';
	};
		
	 /** @public */
     this.createDialog = function(name, mtitle) {
	    var myeditor;
		
		var code_entry = $('<div></div>');
		code_entry.html(generateHTML(name));
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
					title: mtitle,
					width: 360,
					height: 400,
					minHeight: 200,
					minWidth: 360,
				buttons: [
					{
						id: "btn-add",
						text: "Add Agent",
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
