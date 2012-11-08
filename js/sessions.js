var session_id = 0;
var session_changes = {};
var session_timestamp = "2012-02-13 13:00:00";
var session_frequency = 2000;

function session_init() {
	setTimeout(session_update,session_frequency);
}

function session_connect(id) {
	session_id = id;
	session_timestamp = "2012-02-10 13:00:00";
	session_changes = {};
	session_observables = {};
}

function session_update() {
	var sym;
	var changestr = "<jse>\n";

	if (session_id != 0) {
		for (var key in session_changes) {
			var sym = root.lookup(key);
			if (sym.definition === undefined) {
				if (sym.value() !== undefined) {
					changestr += "<observable><name>"+key+"</name><value>"+sym.value()+"</value></observable>\n";
				}
			} else {
				if (sym.eden_definition !== undefined) {
					//var subs = sym.eden_definition.substring(0,4);
					//if (subs != "proc") {
						changestr += "<observable><name>"+key+"</name><definition><![CDATA["+sym.eden_definition+"]]></definition></observable>\n";
					//}
				}
			}
		}
	}
	changestr += "</jse>";

	$.ajax({
		url: "server/jse.rhtml",
		type: 'POST',
		data: "sid=" + session_id + "&timestamp=" + session_timestamp+"&xml="+encodeURIComponent(changestr),
		dataType: 'text',
		success: function(data) {
			session_observables = JSON.parse(data);

			root.autocalc(false);

			for (var key in session_observables) {
				if (key == "timestamp") {
					session_timestamp = session_observables[key];
					continue;
				} else if (key == "error") {
					console.log(session_observables[key]);
					continue;
				}
				sym = root.lookup(key);
				var newsym = session_observables[key];
				if (newsym['definition']) {
					//only change definition if it has changed.
					if (sym.eden_definition != newsym.definition) {
						eval(Eden.translateToJavaScript(decodeURIComponent(newsym.definition)+";"));
						//sym.assignKeepDef(newsym.value);
						//sym.current_value = newsym.value;
					} else {
						//change current value and notify.
						//sym.assignKeepDef(newsym.value);
						//sym.current_value = newsym.value;
					}
				} else {
					sym.assign(newsym.value);
				}
				session_changes[key] = false;
			}

			root.autocalc(true);

			setTimeout(session_update,session_frequency);
		},
		cache: false,
		async: true
	});

	session_changes = {};
}
