## %eden

/* game.e */

/*
writeln("1: oxo, 2: oxo4 (3D), 3: pp7 - please press a number and then return");
s = gets();
*/

s="1";

switch(s) { 
  case "1": include("models/oxo/geomoxo.e"); include("models/oxo/oxo.geom"); break;
  case "2": include("models/oxo/geomoxo4.e"); include("models/oxo/oxo4.geom"); break;
  case "3": include("models/oxo/geompp7.e"); include("models/oxo/pp7.geom"); break;
}
include("models/oxo/display.e");
include("models/oxo/initsq.e");
include("models/oxo/status.e");
include("models/oxo/sqvals.e");
include("models/oxo/play.e");
include("models/oxo/gamestate.e");
include("models/oxo/control.e");
