function make_interpreter(name, mtitle, edenparser) {
	var myeditor;

	$code_entry = $('<div id="'+name+'-input"><div></div><pre class="eden exec"></pre></div>');
	$dialog = $('<div id="'+name+'interpreter-window"></div>')
		.html($code_entry)
		.dialog({
			title: mtitle, 
			width: 450,
			height: 240,
			minHeight: 120,
			minWidth: 230,
			position: ['right','bottom'],
			buttons: [{
				id : "btn-submit",
				text : "Submit",
				click : function() {
						try {
							var myvalue;
							eden.addHistory(myeditor.getValue());
							$('#history-content').append('<div id="history-'+eden.history.length+'">'+myeditor.getValue()+'<hr /></div>');
							if (edenparser !== undefined) {
							      //Parse special notation to eden
							} else {
							    myvalue = myeditor.getValue();
							}
							
							eval(Eden.translateToJavaScript(myvalue));
							myeditor.setValue("");
							//printSymbolTable();
							printAllUpdates();
							//eden.saveLocalModelState();
						} catch(e) {
							$('#error-window').addClass('ui-state-error').append("<div class=\"error-item\">## ERROR number " + eden.errornumber + ":<br>" + e.message + "</div>\r\n\r\n").dialog({title:"EDEN Errors"});
							var contents = $('#history-'+eden.history.length).html();
							$('#history-'+eden.history.length).attr('class','history-error').html('## '+contents);
							eden.errornumber = eden.errornumber + 1;
						}
					}
				},
				{
				text : "Previous",
				click : function() {
						myeditor.setValue(eden.previousHistory());
					}
				},
				{
				text : "Next",
				click : function() {
						myeditor.setValue(eden.nextHistory());
					}
				}
			]
		});
	input_dialog = $dialog;
	$("#btn-submit").css("margin-right", "30px");

	myeditor = convertToEdenPageNew('#'+name+'-input','code'); 
}
