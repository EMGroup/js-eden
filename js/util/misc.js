/*
 * Copyright (c) 2013, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

function noop() {}

/**
 * Generates a random string
 * 
 * @param int length_
 * @return string
 */
function randomString(length_) {

    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    if (typeof length_ !== "number") {
        length_ = Math.floor(Math.random() * chars.length_);
    }
    var str = '';
    for (var i = 0; i < length_; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

function get_time_diff( timestamp )
{
	var datetime = timestamp * 1000;
	var now = Date.now();
	var _date = new Date();
	var _userOffset = _date.getTimezoneOffset()*60000;
	datetime -= _userOffset;

	if( isNaN(datetime) )
	{
	    return "";
	}

	if (datetime < now) {
	    var milisec_diff = now - datetime;
	}else{
	    var milisec_diff = datetime - now;
	}

	var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));

	var date_diff = new Date( milisec_diff );

	if (days > 5) {
		return (new Date(datetime)).toDateString();
	} else {
		var result = "";
		if (days > 0) {
			result += days;
			if (days > 1) {
				result += " days ago";
			} else {
				result += " day ago";
			}
		} else {
			if (date_diff.getUTCHours() > 0) {
				var hours = date_diff.getUTCHours();
				result += hours;
				if (hours > 1) {
					result += " hours ago";
				} else {
					result += " hour ago";
				}
			} else {
				var mins = date_diff.getUTCMinutes();
				if (mins > 0) {
					result += mins;
					if (mins > 1) {
						result += " minutes ago";
					} else {
						result += " minute ago";
					}
				} else {
					var secs = date_diff.getUTCSeconds();
					result += secs;
					if (secs > 1) {
						result += " seconds ago";
					} else {
						result += " seconds ago";
					}
				}
			}
		}
		return result;
	}
}

function generateTimeStamp(str) {
	var relativeTimeRe = /(\d*)(minutes|minute|min|hours|hour|days|day|weeks|week|months|month|mon|years|year|Quarters|Quarter|seconds|second|sec|s|m|h|d|M|y|Y|Q|ms|w)/g;

	var comp;
	var stamp = 0;
	while ((comp = relativeTimeRe.exec(str)) !== null) {
		console.log("Reltime:",comp);
		switch(comp[2]) {
		case "second":
		case "seconds":
		case "s"	:	stamp += parseInt(comp[1]) * 1000; break;
		case "minute":
		case "minutes":
		case "m"	:	stamp += parseInt(comp[1]) * 60000; break;
		case "hour":
		case "hours":
		case "h"	:	stamp += parseInt(comp[1]) * 3600000; break;
		case "days":
		case "d":		stamp += parseInt(comp[1]) * 3600000 * 24; break;
		}
	}

	return stamp;
}

function hashCode(str){
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}

function unListen(target) {
	for (var x in this.listeners) {
		var l = this.listeners[x];
		for (var i=0; i<l.length; i++) {
			if (l[i].target === target) {
				l.splice(i,1);
				break;
			}
		}
	}
}

function listenTo(eventName, target, callback) {
	if (!this.listeners[eventName]) {
		this.listeners[eventName] = [];
	}
	this.listeners[eventName].push({target: target, callback: callback});
}

function emit(eventName, eventArgs) {
	var listenersForEvent = this.listeners[eventName];
	if (!listenersForEvent) {
		return;
	}
	var i;
	for (i = 0; i < listenersForEvent.length; ++i) {
		var target = listenersForEvent[i].target;
		var callback = listenersForEvent[i].callback;
		if (callback.apply(target, eventArgs)) return true;
	}
	return false;
}

mobilecheck = function() {
	if (Eden.mobile !== undefined) return Eden.mobile;
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	Eden.mobile = check;
  return check;
};

// import node.js modules
function concatAndResolveUrl(url, concat) {
	var url1 = url.split('/');
	var url2 = concat.split('/');
	var url3 = [ ];
	for (var i = 0, l = url1.length; i < l; i ++) {
		if (url1[i] == '..') {
			url3.pop();
		} else if (url1[i] == '.') {
			continue;
		} else {
			url3.push(url1[i]);
		}
	}
	for (var i = 0, l = url2.length; i < l; i ++) {
		if (url2[i] == '..') {
			url3.pop();
		} else if (url2[i] == '.') {
			continue;
		} else {
			url3.push(url2[i]);
		}
	}
	return url3.join('/');
}

Utils = {
	flatten: function (array) {
		var flat = [];
		for (var i = 0, l = array.length; i < l; ++i){
			flat = flat.concat(array[i] instanceof Array ? this.flatten(array[i]) : array[i]);
		}
		return flat;
	},

	construct: (function () {
		/** @constructor */
		var temp_ctor = function () {};

		return function (ctor) {
			temp_ctor.prototype = ctor.prototype;
			var instance = new temp_ctor();
			var args = [];
			for (var i = 1; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			ctor.apply(instance, args);
			return instance;
		};
	})()
};

