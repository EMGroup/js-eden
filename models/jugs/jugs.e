/* if the user re-includes this file to reset the model, we don't want
the display to be re-generated after every redefinition made by this
file, so turn autocalc off for the time being */

autocalc = 0;

func max { return $1<$2 ? $2 : $1; };

target=1;
capA = 5;
capB = 7;
Afull is capA==contentA;
Bfull is capB==contentB;
contentA = 0;
contentB = 0;

height is max(capA,capB)+2;

widthB = 5;
widthA = 5;
menu is ["1:Fill A","2:Fill B","3:Empty A","4:Empty B","5:Pour"];
menustatus is [valid1, valid2, valid3, valid4, valid5, valid6, valid7];
				/* two invisible options 6 & 7 */
valid1 is !Afull;
valid2 is !Bfull;
valid3 is contentA != 0;
valid4 is contentB != 0;
valid5 is valid6 || valid7;
valid6 is valid3 && valid2;
valid7 is valid4 && valid1;

/* specifying the control information */

Error=0; updating=0;
finish is ((contentA==target)||(contentB==target))&&!updating;

func avail
{
	/* indicates whether the menu option with parameter $1 is open */
	auto t;
	t = menustatus[$1];
	return t;
}


proc init_pour : input
{
        updating = 1;
	if (int(input) == 5)	{
		content5 = contentA + contentB;
		contentB is content5 - contentA;
		option = valid6 ? 6 : 7;
	} else
		option = int(input);
	step = 0;
}
 
proc pour :  step
{
	if (avail(option)) {
		switch (option) {
		case 1:
			contentA = contentA + 1;
			break;
		case 2:
			contentB = contentB + 1;
			break;
		case 3:
			contentA = contentA - 1;
			break;
		case 4:
			contentB = contentB - 1;
			break;
		case 6:
			contentA = contentA - 1;
			break;
		case 7:
			contentA = contentA + 1;
			break;
		default:
			writeln("option = ", option);
			return;
		}
		##eager();
		##delay(viscosity);

		${{setTimeout(function(){}}$;
		step++;
		${{}, root.lookup("viscosity").value());}}$;
	} else {
                contentA = contentA;
                contentB = contentB;
                updating = 0;
        }
}

status is (Error)?"invalid option": ((updating)?"updating":"awaiting input");
totstat is (finish) ? "Success!" : status;
targ is ("Target is " // str(target) // " : ");


viscosity = 1000;

autocalc = 1;

