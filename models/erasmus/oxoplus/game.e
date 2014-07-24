## %eden
/* game.e */

## can't use gets() in js-eden

/*
writeln("1: oxo, 2: oxo4 (3D), 3: pp7 - please press a number and then return");
s = gets();
*/

s = 1;

switch(s) { 
  case "1": include("geomoxo.e"); include("oxo.geom"); break;
  case "2": include("geomoxo4.e"); include("oxo4.geom"); break;
  case "3": include("geompp7.e"); include("pp7.geom"); break;
}
include("display.e");
include("initsq.e");
include("status.e");
include("sqvals.e");
include("play.e");
include("gamestate.e");
include("control.e");
