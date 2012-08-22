(function () {
	var _ = require('underscore');
	var grammar = require('./grammar');
	
	var nodeConstructors = {};
	function _construct(type) {
		var names = Array.prototype.slice.call(arguments, 1);
		nodeConstructors[type] = function () {
			var node = {type: type};
			for (var i = 0; i < names.length; ++i) {
				node[names[i]] = arguments[i];
			}
			return node;
		};
	}

	_construct('identifier', 'data');
	_construct('after', 'timeout', 'code');
	_construct('ifStatement', 'condition', 'trueCode', 'falseCode');
	_construct('arrayGet', 'array', 'index');
	_construct('integerLiteral', 'data');
	_construct('infixExpression', 'lhs', 'operator', 'rhs');

	_.extend(grammar.parser.yy, nodeConstructors);

	exports.parse = function (source) {
		return grammar.parse(source);
	};
}());