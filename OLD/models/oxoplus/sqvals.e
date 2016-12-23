/* sqvals.e */

badline = -999;

player = o;
square = 5;

func linval {
	para lline;
	auto xs, os, i;
	xs = 0; os = 0;
	for (i=1; i <=lline#; i++) { 
		if (lline[i] == x)
			xs++;
		else if (lline[i] == o)
			os++;
		}
	return [xs, os, lline#-xs-os ];
	}

func weighting {
##	auto xs, os, blanks, plr;
##	auto players, opponents;
	auto xs, os, blanks, plr, players, opponents; ## JsEden fix
	xs = $1[1];
	os = $1[2];
	blanks = $1[3];
	players = (plr == x)?xs:os;
	opponents = (plr == x)?os:xs;
	if (players > 0 && opponents > 0)
		return (-1);
	if ((opponents == 0) && (blanks == 1))
		return 100;
	else if ((players == 0) && (blanks == 1))
		return 20;
	else if (opponents == 0)
		return 3;
	else if (players == 0)
		return 1;
	else return 0;
	}

func sqval {
	para linelist;
	auto listlen,i,total;
	listlen = linelist#;
	total = 0;

	for (i=1; i <= listlen; i++)
		total += weighting(linval(linelist[i]), player);
	return total;
	}

availsquare is allsquares[square] == u;

cursqval is sqval(linesthru[square]);
