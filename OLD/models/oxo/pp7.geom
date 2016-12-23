/* pp7.geom */


/* Specify the geometry by (1) number of squares (numbered s1..sn)
** and (2) by the lines initially as [[int]].
** init_geom() then generates the names and lists of names.
*/

n_squares is 7;
list_lines = [[1,2,5],[2,3,6],[1,3,7],[7,6,5],[2,7,4],[1,6,4],[3,5,4]];

board_template = "   1\n\n 2   3\n   4\n5  6  7";
print_template = ["   ","\n\n ","   ","\n   ","\n","  ","  ","\n"];
