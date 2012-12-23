var root;
var eden;

//XXX what is this?
var current_view = new Array();

/**
 * Utility function to extract URL query string parameters.
 */
function getParameterByName( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function JS_Eden_Initialise(callback) {
	$(document).ready(function() {
		//runTests(all_the_tests);
		root = new Folder();
		eden = new Eden(root);

		//XXX don't think this is needed anymore.
		modelbase = "";

		//Create the error window. Hiden to start with.
		$('<pre id="error-window" style="font-family:monospace;"></pre>').appendTo($('body'));

		//Load the Eden library scripts
		Eden.executeFileSSI("library/eden.jse");

		//Process query string for plugins and models to load
		var plugins = getParameterByName("p").split(",");
		var views = getParameterByName("v").split(",");
		var models = getParameterByName("m").split(",");

		if (plugins[0] != "") {
			for (x in plugins) {
				eden.loadPlugin(plugins[x]);
			}
		}
		if (views[0] != "") {
			var viewcount = 0;
			for (x in views) {
				eden.createView("view-"+viewcount,views[x]);
				viewcount = viewcount + 1;
			}
		}
		if (models[0] != "") {
			for (x in models) {
				Eden.executeFileSSI(models[x]);
			}
		}

		callback();
	});
}
