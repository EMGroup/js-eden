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

## observing a formula var with autocalc off
x is t("x", y);
autocalc = 0;
check_trace([]);
x;
check_trace(["x"]);

exit();
