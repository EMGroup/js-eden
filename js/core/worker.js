var s = {};

onmessage = function(e) {
	var res;

	switch(e.data.cmd) {
	case "register": s[e.data.name] = eval(e.data.source); res = true; break;
	case "call": res = s[e.data.name].apply(undefined, e.data.args);
					postMessage({data: res, observable: e.data.observable});break;
	}
}
