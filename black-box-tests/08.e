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

## agent triggers when formula evaluated
setup_test();
x is t("x", y);
proc p : x { t("p", @); }
x;
check_trace(["x", "p"]);

exit();
