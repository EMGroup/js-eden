var translator = require('./translator');

test("Empty script", function (assert) {
	var ast = translator.parse("");
	deepEqual(ast, []);
});

test("Null statement", function (assert) {
	var ast = translator.parse(";");
	deepEqual(ast, []);
});

test("Single observable", function (assert) {
	var ast = translator.parse("x;");
	deepEqual(ast, [{type: 'identifier', data: "x"}]);
});

test("Number literal", function (assert) {
	deepEqual(translator.parse("1;"), [
		{type: 'integerLiteral', data: 1}
	]);
});

test("Addition", function (assert) {
	deepEqual(translator.parse("0 + 2;"), [
		{
			type: 'infixExpression',
			lhs: {type: 'integerLiteral', data: 0},
			operator: '+',
			rhs: {type: 'integerLiteral', data: 2}
		}
	]);
});

test("BODMAS", function (assert) {
	deepEqual(translator.parse("2*3 + 4*5;"), [
		{
			type: 'infixExpression',
			operator: '+',
			lhs: {
				type: 'infixExpression',
				operator: '*',
				lhs: {type: 'integerLiteral', data: 2},
				rhs: {type: 'integerLiteral', data: 3}
			},
			rhs: {
				type: 'infixExpression',
				operator: '*',
				lhs: {type: 'integerLiteral', data: 4},
				rhs: {type: 'integerLiteral', data: 5}
			}
		}
	]);
});

test("Array get with literal index", function (assert) {
	deepEqual(translator.parse("x[0];"), [
		{type: 'arrayGet', array: {type: 'identifier', data: 'x'}, index: {type: 'integerLiteral', data: 0}}
	]);
});