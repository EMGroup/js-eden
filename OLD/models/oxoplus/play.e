/* play.e */

func findmaxindex {
	auto maxval,foundindex,looping;
	maxval=0;
	foundindex=0;
	square=1;
	looping=1;
	while (looping) {
		if (availsquare && (cursqval >= maxval)) {
			maxval=cursqval;
			foundindex = square;
			}
		if (square < nofsquares)
			square++;
		else if (square == nofsquares)
			looping = 0;
		}
	return foundindex;
	}

maxindex is findmaxindex(allsquares);
