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

## forcing evaluation propagates
x is t("x", y);
y is t("y", z);
y;
check_trace(["y", "x"]);

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

## triggered action doesn't fire after definition if autocalc off
autocalc = 0;
x = 1;
proc p : x { t("p", @); }
check_trace([]);
autocalc = 1;
check_trace(["p"]);
