sed "s/Adding \([A-Za-z0-9]*==\) to session \([a-z]*\) (num: \([0-9]*\))/REPLAY:C:\3:\2:\1/" $1 | sed "s/Deleting \([A-Za-z0-9]*==\) from session \([A-Za-z0-9]*\)/REPLAY:D:?:\2:\1/"
