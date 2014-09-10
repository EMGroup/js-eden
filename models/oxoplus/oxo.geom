/* oxo.geom */

/* Specify the geometry by (1) number of squares (numbered s1..sn)
** and (2) by the lines initially as [[int]].
** init_geom() then generates the names and lists of names.
*/

n_squares is 9;
list_lines = [[1,2,3],[4,5,6],[7,8,9],[1,4,7],[2,5,8],[3,6,9],[1,5,9],[3,5,7]];

/* Templates for the display routines
*/

board_template = "123\n456\n789\n";
print_template = ["","","","\n","","","\n","","","\n"];
