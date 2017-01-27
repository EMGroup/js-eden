/* gamestate.e */

startplayer = o;

x_to_play is (! end_of_game) && (startplayer == x && nofo == nofx) ||
		nofo > nofx;

o_to_play is (! end_of_game) && (startplayer == o && nofo == nofx) ||
		nofx > nofo;

end_of_game is xwon || owon || draw;
