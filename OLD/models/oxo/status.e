/* status.e */

func xxline {
	para lline;
	auto i, b;
	b = 1;
	for (i=1; i<=lline#; i++) {
		b = b && (lline[i] == x);
		}
	return b;
	}

func ooline {
	para lline;
	auto i, b;
	b = 1;
	for (i=1; i<=lline#; i++) {
		b = b && (lline[i] == o);
		}
	return b;
	}

func checkxwon {
	auto i, b;
	b = 0;
	for (i=1; i<=$1#; i++) {
		b = b || xxline($1[i]);
		}
	return b;
	}

func checkowon {
	auto i, b;
	b = 0;
	for (i=1; i<=$1#; i++) {
		b = b || ooline($1[i]);
		}
	return b;
	}

xwon is checkxwon(alllines);

owon is checkowon(alllines);

func nofpieces {
	auto count, total;
	total = 0;
	for (count=1; count <= $1#; count++)
		if ($1[count] == $2)
			total++;
	return total;
	}

nofx is nofpieces(allsquares, x);

nofo is nofpieces(allsquares, o);

full is (nofx + nofo == nofsquares);

draw is (! xwon) && (! owon) && full;

status is (xwon?"X wins ":"") // (owon?"O wins ":"") //
	(draw?"Draw ":"") // "";

proc xwinmess : status {
	writeln(status);
	}
