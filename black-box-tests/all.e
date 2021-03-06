## a formula var whose dependencies have not been evaluated is not evaluated
## after definition
x is t("x", y);
check_trace([]);

## reading a formula var forces evaluation
x is t("x", y);
z = x;
check_trace(["x"]);

## passing to a function forces evaluation
x is t("x", y);
func f {}
f(x);
check_trace(["x"]);

## useless statement forces evaluation
x is t("x", y);
x;
check_trace(["x"]);

## formula var with multiple dependencies
x is t("x", y + z);
check_trace([]);
y = 1;
check_trace([]);
z = 1;
check_trace(["x"]);

## formula var with multiple dependencies
x is t("x", y + z);
x;
y;

## forcing evaluation propagates to dependees
## @FailsInJSEden
x is t("x", y);
y is t("y", z);
check_trace([]);
y;
check_trace(["y", "x"]);

## forcing evaluation
## @FailsInJSEden
x is t("x", y);
y is t("y", z);
check_trace([]);
x;
"When y becomes up to date, a second evaluation of x is scheduled by tkeden";
check_trace(["y", "x", "x"]);

## forcing evaluation detailed
## @FailsInJSEden
func return_1 { return 1; }
x is t("x_begin", 1) &&  return_1(y) && t("x_end", 1);
y is t("y", z);
check_trace([]);
x;
"When y becomes up to date, a second evaluation of x is scheduled by tkeden";
check_trace(["x_begin", "y", "x_begin", "x_end", "x_end"]);

## forcing evaluation with autocalc off
autocalc = 0;
x is t("x", y);
y is t("y", z);
check_trace([]);
x;
check_trace(["y", "x"]);

## forcing evaluation with autocalc off doesn't propagate to dependees
## @FailsInJSEden
autocalc = 0;
x is t("x", y);
y is t("y", z);
z1 is t("z1", z2);
y;
check_trace(["y"]);
autocalc = 1;
check_trace(["y", "x"]);

## flushing autocalc will trigger actions which had dependency updates scheduled
## @FailsInJSEden
autocalc = 0;
x is t("x", y);
y is t("y", z);
y;
check_trace(["y"]);
proc x { t("x_proc", @); }
check_trace(["y"]);
autocalc = 1;
"The fact that x is triggered is probably a bug in tkeden";
check_trace(["y", "x_proc"]);

## agent does not immediately fire if observees not yet defined
## @FailsInJSEden
x is t("x", y);
proc p : x { t("p", @); }
check_trace([]);

## agent immediately fires if observees have been observed
x is t("x", y);
x;
proc p : x { t("p", @); }
check_trace(["x", "p"]);

## autocalc off agent immediately fires if observees have been observed
autocalc = 0;
x is t("x", y);
x;
proc p : x { t("p", @); }
check_trace(["x"]);
autocalc = 1;
check_trace(["x", "p"]);

## agent triggers when formula evaluated
## @FailsInJSEden
x is t("x", y);
proc p : x { t("p", @); }
x;
check_trace(["x", "p"]);

## evaluating an observable that hasnt been defined/assigned doesnt evaluate it
proc p : x { t("p", @); }
y is t("y", x);
x;
check_trace([]);

## assigning to an observable evaluates it
proc p : x { t("p", @); }
y is t("y", x);
x = 2;
check_trace(["y", "p"]);

## observing a formula var with autocalc off
x is t("x", y);
autocalc = 0;
check_trace([]);
x;
check_trace(["x"]);

## observing a formula var with autocalc off doesn't trigger agents
## @FailsInJSEden
x is t("x", y);
proc p : x { t("p", @); }
autocalc = 0;
check_trace([]);
x;
check_trace(["x"]);
autocalc = 1;
check_trace(["x", "p"]);

## triggered action doesn't fire after definition if autocalc off
autocalc = 0;
x = 1;
proc p : x { t("p", @); }
check_trace([]);
autocalc = 1;
check_trace(["p"]);

## forcing by assignment
## @FailsInJSEden
proc p : x { t(str(x), @); }
check_trace([]);
x = x == @;
check_trace(["1"]);

## forcing fv by assignment
## @FailsInJSEden
x is z;
proc p : x { t(str(x), @); }
check_trace([]);
x = x == @;
check_trace(["@", "1"]);

## forcing fv by assignment
## @FailsInJSEden
x is z;
y is t(str(x), @);
check_trace([]);
x = x == @;
check_trace(["@", "1"]);
