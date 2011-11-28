
## makes an html version of the Jugs state for JsEden

## new a simpler version of the repchar function which parses on JsEden

func repchar {
	para a,n;
	auto s, i;
	s = "";
	for (i=1; i<=n; i++) s = s // a;
	return s;
}

func juglinehtml {
	/* $1 is the line number of the display, $2 is height of jug */
	/* $3 is the width of the jug, $4 is the content of the jug */
	/* line number 0 corresponds to the base of the jug */
	auto c,r,s,t;
	r = repchar("&nbsp;",$3-1);
	s = repchar((($1>$4)||($1<0))?"&nbsp;":(($1==0)?'|':'*'),$3);
	c = (($1>$2)||($1<0))?"&nbsp;":"|";
	t = r // c // s // c // r;
	return t;
}

func jugdisplayhtml
{
	/* $1 is height of display, $2 is height of the jug */
	/* $3 is the width of the jug, $4 is the content of the jug */
	/* func returns list of strings representing the display of the jug */

	auto s,i;
	s = [];
	for (i=$1; i>=0; i--)
	{
		append s,juglinehtml(i-1, $2,$3,$4);
	}
	return s;
}

func menudisplay
{
	/* construct display list for menu $1[1] with associated status $1[2] */
	auto i,s,l;
	s = "";
	for (i=1; i<=$1[1]#; i++)
	{
		s = s // "  " // (($1[2][i])?$1[1][i]:("<" // $1[1][i] // ">"));
	}
	l = [s];
 	return l;
}

func displayabove
{
	/* two display lists $1 and $2 -> display list for $1 above $2 */
	auto s,i;
	s = $1;
	for (i=1; i<=$2#; i++) {
		append s, $2[i];
	}
	return s;
}

func displayrt
{
	/* two display lists $1 and $2 -> display list for $1 to right of $2 */
	auto s,i;
	s = [];
	for (i=1; i<=$1#; i++) {
		append s, ($1[i] // $2[i]);
	}
	return s;
}

## minor edit here for JsEden: introduce the int() around the integer division in the for-loop

func messdisplay
{
	/* display text line in a specified vertical position */
	/* $1+1 is the height  of the display, $2 is the message */
	auto i,s;
	s=[];
	for (i=0; i<=$1; i++) {
		append s, ((i==int($1/2))?$2:repchar(' ',$2#));
	}
	return s;
}


height is max(capA,capB)+2;

jugAhtml is jugdisplayhtml(height, capA, widthA, contentA);
jugBhtml is jugdisplayhtml(height, capB, widthB, contentB);
menuform is menudisplay([menu,menustatus]);

jstat is messdisplay(height,totstat);
targt is messdisplay(height,targ);

jjthtml is displayrt(jugAhtml,displayrt(jugBhtml,displayrt(targt,jstat)));

_displayhtml is displayabove(jjthtml, menuform);

func mkoutput {	
	para displs;
	auto result;
	result = "";
	for (i=1; i<=displs#; i++)
		result = result // displs[i] // "<br>";
	return result;
}

outputtxt is mkoutput(_displayhtml);

proc outputjugshtml : _displayhtml {
  html("<font face=\"courier\" color=\"red\">" // outputtxt // "</font>");
};
