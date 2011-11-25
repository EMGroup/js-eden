/* display.e */

x = 1; o = -1; u = 0;

/* DISPLAYING ROUTINES ********************************************/

func vis{
	return ($1==u)?".":(($1==x)?"X":(($1==o)?"O":"?"));
	}

func concatxo {
##	auto i;
##	auto result;
	auto i, result; ## JsEden fix
	result = print_template[1];
	for (i=1; i<=$1#; i++) {
		result = result // vis($1[i]) // print_template[i+1];
		}
	return result;
	}

board is concatxo(allsquares);

proc displayboard : board {
	writeln(board);
	}
