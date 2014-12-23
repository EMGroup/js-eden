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
x is t("x", y);
y is t("y", z);
check_trace([]);
y;
check_trace(["y", "x"]);

## forcing evaluation
x is t("x", y);
y is t("y", z);
check_trace([]);
x;
"When y becomes up to date, a second evaluation of x is scheduled by tkeden";
check_trace(["y", "x", "x"]);

## forcing evaluation with autocalc off
autocalc = 0;
x is t("x", y);
y is t("y", z);
check_trace([]);
x;
check_trace(["y", "x"]);

## forcing evaluation with autocalc off doesn't propagate to dependees
autocalc = 0;
x is t("x", y);
y is t("y", z);
z1 is t("z1", z2);
y;
check_trace(["y"]);
autocalc = 1;
check_trace(["y", "x"]);

## agent does not immediately fire if observees not yet defined
x is t("x", y);
proc p : x { t("p", @); }
check_trace([]);

## agent triggers when formula evaluated
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
