EdenUI.Dialogs = {};

EdenUI.Dialogs.MergeError = function(oldsrc, newsrc, cb) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(oldsrc, newsrc);
	dmp.diff_cleanupSemantic(d);
	var diffhtml = dmp.diff_prettyHtml(d);

	var diag = $('<div title="Import Merge Conflict">'+diffhtml+'</div>');
	diag.dialog({
		resizable: true,
		height: "auto",
		width: 600,
		modal: true,
		buttons: {
			"Use Mine": function() {
				if (cb) cb("old");
				$( this ).dialog( "close" );
			},
			"Use New": function() {
				if (cb) cb("new");
				$( this ).dialog( "close" );
			},
			"Merge": function() {
				if (cb) cb("merge");
				$( this ).dialog( "close" );
			}
		}
	});
}
