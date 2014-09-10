/* control.e */

proc init_game {
	initAllSquares();
	writeln("Who is to start? Respond with either");
	writeln("startplayer = o;");
	writeln("    or");
	writeln("startplayer = x;");
	}

proc play : end_of_game, o_to_play, x_to_play {
	if (end_of_game) {
		writeln("bye bye");
		}
	else if (o_to_play) {
		writeln("Positions are");
		writeln(board_template);
		writeln("please play; type");
		writeln("sn=o;");
		}
	else if (x_to_play) {
		mvsq = "s" // str(maxindex) ;
		`mvsq` = x;
		writeln("I move to square " // mvsq);
		}
	}
