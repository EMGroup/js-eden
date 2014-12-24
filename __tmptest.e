proc check_trace {
	if ($1 != eval_trace) {
		error("
Expected trace: " // str($1) // "
actual trace: " // str(eval_trace));
	}
}

proc setup_test {
	eval_trace = [];
	func t { append eval_trace, $1; return $2; }
}

setup_test();

x is z;
y is t(str(x), @);
check_trace([]);
x = x == @;
check_trace(["@", "1"]);

exit();

