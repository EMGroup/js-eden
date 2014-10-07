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

## forcing evaluation propagates
setup_test();
x is t("x", y);
y is t("y", z);
y;
check_trace(["y", "x"]);

exit();
