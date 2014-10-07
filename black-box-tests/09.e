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

## evaluating an observable that hasnt been defined/assigned doesnt evaluate it
setup_test();
proc p : x { t("p", @); }
y is t("y", x);
x;
check_trace([]);

exit();
