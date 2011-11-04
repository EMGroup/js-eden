var assignmentHelper;

(function ($) {

var Jison = require('jison'),
    bnf = require('jison/bnf');

var parser,
    parser2;

//IE, mainly
if(typeof console === 'undefined'){
    console = {};
    console.log = function (str) {$("#out").html(uneval(str))};
}
// noop
print = function (){}

var printOut = function (str) { $("#out").text(str); };

$(document).ready(function () {
    $("#process_btn").click(processGrammar);
    $("#parse_btn").click(runParser);

    $("#examples").change(function(ev) {
        var file = this.options[this.selectedIndex].value;
        $(document.body).addClass("loading");
        $.get("/jison/examples/"+file, function (data) {
                $("#grammar").val(data);
                $(document.body).removeClass("loading");
            });
    });

});

function processGrammar () {
    var type = "lalr";

    var grammar = $("#grammar").val();
    try {
        var cfg = JSON.parse(grammar);
    } catch(e) {
        try {
            var cfg = bnf.parse(grammar);
        } catch (e) {
            $("#gen_out").html("Oops. Make sure your grammar is in the correct format.\n"+e).addClass('bad');
            return;
        }
    }

    Jison.print = function () {};
    parser = new Jison.Generator(cfg, {type: type});

    $("#out").removeClass("good").removeClass("bad").html('');
    $("#gen_out").removeClass("good").removeClass("bad");
    if (!parser.conflicts) {
        $("#gen_out").html('Generated successfully!').addClass('good');
    } else {
        $("#gen_out").html('Conflicts encountered:<br/>').addClass('bad');
    }

    $("#download_btn").click(function () {
            window.location.href = "data:application/javascript;charset=utf-8;base64,"+Base64.encode(parser.generate());
        }).removeAttr('disabled');

    parser.resolutions.forEach(function (res) {
        var r = res[2];
        if (!r.bydefault) return;
        $("#gen_out").append(r.msg+"\n"+"("+r.s+", "+r.r+") -> "+r.action);
    });

    parser2 = parser.createParser();
}

function runParser () {
    if (!parser) processGrammer();
    printOut("Parsing...");
    var source = $("#source").val();
	
	var in_definition = false;
	var dependencies = {};

	var original_input = source;

	parser2.yy.extractEdenDefinition = function(first_line, first_column, last_line, last_column) {
		var definition_lines = original_input.split('\n').slice(first_line - 1, last_line);
		var definition = "";

		for (var i = 0; i < definition_lines.length; ++i) {
			var line = definition_lines[i];

			if (i === 0) {
				var start = first_column;
			} else {
				var start = 0;
			}

			if (i === definition_lines.length - 1) {
				var end = last_column;
			} else {
				var end = line.length;
			}

			definition += line.slice(start, end);
		}
		console.log("def: ", definition);

		return definition;
	}
	
	parser2.yy.enterDefinition = function() {
		dependencies = {};
		in_definition = true;
	};
	
	parser2.yy.leaveDefinition = function() {
		in_definition = false;
	};
	
	parser2.yy.inDefinition = function() {
		return in_definition;
	};
	
	parser2.yy.addDependency = function(name) {
		dependencies[name] = 1;
	};
	
	parser2.yy.getDependencies = function() {
		var dependency_list = [];
		for (p in dependencies) {
			dependency_list.push(p);
		}
		return dependency_list;
	};

	parser2.yy.locals = [];
	parser2.yy.paras = [];

    try {
        $("#out").removeClass("bad").addClass('good');
		console.log("BEAUTY");
        printOut(js_beautify(parser2.parse(source)));
    } catch(e) {
        $("#out").removeClass("good").addClass('bad');
        printOut(e.message || e);
    }
}

})(jQuery);

