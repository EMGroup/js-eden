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

## triggered action doesn't fire after definition if autocalc off
autocalc = 0;
x = 1;
proc p : x { t("p", @); }
check_trace([]);
autocalc = 1;
check_trace(["p"]);

exit();
