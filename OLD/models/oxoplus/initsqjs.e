/* The original model just had this set of definitions, which
   initialises the normal OXO game.  If s10 ... s64 are not
   initialised in this manner, then the OXO4 game doesn't immediately
   start when you load game.e, and you need type to invoke
   init_game();

   s1=u; s2=u; s3=u; s4=u; s5=u; s6=u; s7=u; s8=u; s9=u;

   We're replacing these definitions with the following procedural
   statements which initialise s1 ... sn symbols.

*/

proc initAllSquares {
  auto i;

##  autocalc = 0;
  for (i = 1; i <= nofsquares; i++) {
    `"s"//str(i)` = u;
  }
## autocalc = 1;
}

initAllSquares();

/* Now we're in a state where the board exists but no game is in
   progress.  We could have left the initialisation of the board until
   the first call to init_game but this closes down the possibility of
   playing with the model before all the scripts have been loaded the
   game has started.  (Cf the 'tk' version of this model.) */
