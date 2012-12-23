var $dialog;
var root;
var eden;
var stored_script;
var obspos = 0;
var procspos = 0;
var funcspos = 0;
var projects;
var edenfunctions = {};
var side_bar_height = 300;
var input_dialog;
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

		modelbase = "";

		root.addGlobal(function (sym, create) {
			//console.log("Obs changed: " + sym.name.substr(1));

			return;

			//Cannot see so doesn't matter
			if ($("#symbol-search > .side-bar-topic-content").css("height") == "0px") return;

			if (create) {
				//TODO: This needs to be delayed with a timeout to increase
				//performance when loading scripts
				if (delayed_creation_timeout == false) {
					delayed_creation_timeout = true;
					setTimeout(function () {
						printObservables($('#observable-search')[0].value);
						delayed_creation_timeout = false;
					}, 500);
				}
				return;
			}

			var me = $("#sbobs_"+sym.name.substr(1));
			if (me === undefined) { return; }
			
			var namehtml;
			if (sym.definition !== undefined) {
				namehtml = "<span class=\"hasdef_text\">"+sym.name.substr(1)+"</span>";
			} else {
				namehtml = sym.name.substr(1);
			}

			var val = sym.value();
			var valhtml;
			if (typeof val == "boolean") { valhtml = "<span class='special_text'>"+val+"</span>"; }
			else if (typeof val == "undefined") { valhtml = "<span class='error_text'>undefined</span>"; }
			else if (typeof val == "string") { valhtml = "<span class='string_text'>\""+val+"\"</span>"; }
			else if (typeof val == "number") { valhtml = "<span class='numeric_text'>"+val+"</span>"; }
			else { valhtml = val; }


			//me.html("<li class=\"type-observable\">" + namehtml + "<span class='result_value'> = " + valhtml + "</span></li>");
			//me.html("<li class=\"type-observable\"><span class=\"result_name\">" + namehtml + "</span><span class='result_value'> = " + valhtml + "</span></li>");
		});

		//make_interpreter("eden","EDEN Interpreter Window");

		$('<pre id="error-window" style="font-family:monospace;"></pre>').appendTo($('body'));

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
