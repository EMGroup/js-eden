/* display.e */

x = 1; o = -1; u = 0;

/* DISPLAYING ROUTINES ********************************************/

func vis13 {
##	return ($1==u)?".":(($1==x)?"X":(($1==o)?"O":"?"));
	return ($1==u)?str($2):(($1==x)?"X":(($1==o)?"O":"?"));
	}

func vis2 {
##      return ($1==u)?".":(($1==x)?"X":(($1==o)?"O":"?"));
        return ($1==u)?strix($2):(($1==x)?" X ":(($1==o)?" O ":"?"));
        }

## vis13 and vis2 must be declared before this definition is introduced (in JsEden)

vis is ((s == "1") || (s == "3")) ? vis13 : vis2;

func strix {
	return " " // (($1>9) ? str(int($1/10)) : " ") // str($1 - int($1/10) * 10);
}

func concatxo {
##	auto i;
##	auto result;
	auto i, result; ## JsEden fix
	result = print_template[1];
	for (i=1; i<=$1#; i++) {
		result = result // vis($1[i], i) // print_template[i+1];
		}
	return result;
	}

board is concatxo(allsquares);

proc displayboard : board {
	writeln(board);
	}
