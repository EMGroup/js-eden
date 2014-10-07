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

## assigning to an observable evaluates it
setup_test();
proc p : x { t("p", @); }
y is t("y", x);
x = 2;
check_trace(["y", "p"]);

exit();
