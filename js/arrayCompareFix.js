arrayCompare = function (array1, array2) {
    // if the arrays is a falsy values, return
    if (!array2)
        return false;
    if (!array1)
        return false;
		
    // compare lengths - can save a lot of time
    if (array1.length != array2.length)
        return false;

    for (var i = 0; i < array1.length; i++) {
        // Check if we have nested arrays
        if (array1[i] instanceof Array && array2[i] instanceof Array){
            // recurse into the nested arrays
            if (!arrayCompare(array1[i], array2[i]))
                return false;
        }
        else if (array1[i] != array2[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}