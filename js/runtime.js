// functions to act in the same way as EDEN operators
var rt = {
	length: function (value) {
		if (value == undefined) {
			return undefined;
		}
		return value.length;
	}
};