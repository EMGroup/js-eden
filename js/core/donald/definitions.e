





proc drawLine {
    auto picture;
	picture = $1;
    ${{
	local_picture
}

proc defineLine {
	execute(
		macro("A?1 is 0; proc : A?1Watcher,?1 { draw_line(



proc definePoint {
    execute(macro("A_?1 is 0;", $1));
}

proc writeln {
	${{
	console.log(args.value()[0])
	}}$;
}

//
// DONALD RELATED FUNCTIONS
//
// XXX: need to support escaped double quotes
// XXX: need to support underscores in observable names
// XXX: need to make JSCODE less greedy
// XXX: causes problems if string spans over multiple lines I think.
// XXX: need to expand auto support to PROC statements
// XXX: yy.locals becomes undefined after parsing a function, doesn't seem to get fixed next function



window = ${{ 
	$('<div></div>').css({
		width:'500px', 
		height:'500px', 
		position:'absolute', 
		top:'100px', 
		left:'300px', 
		'border-style':'solid', 
		'border-width':'1px'
	}).appendTo($('body')) 
}}$;

paper = ${{
	new Raphael(context.lookup('window').value().get(0))
}}$;

func macro {
    ${{
    var format_string = args.value()[0];

    return format_string.replace(/\?(\d+)/g, function(match, number) {
        return typeof args.value()[number] != 'undefined'
          ? args.value()[number]
          : '{' + number + '}'
        ;
    });

    }}$;
}

proc execute {
    ${{ 
	eval(translateEdenToJavaScript(args.value()[0]))
    }}$;
}

func cart {
    return ["C", $1, $2];
}

func circle {
    return ["E", $1, $2];
}

func line {
    return ["L", $1, $2];
}

//
// circles
//
// XXX: shouldn't depend on globally defined paper. Probably easy to have this as a parameter
func declareCircle {
    execute(
        macro("?1Circle = ${{ context.lookup('paper').value().circle() }}$; proc ?1Drawer : ?1 { updateCircle(?1, ?1Circle); }", $1)
    );
}

func updateCircle {
    auto circleData, raphaelCircle;
    circleData = $1;
    raphaelCircle = $2;
    
	${{ 
	local_raphaelCircle.value().attr({
		cx:local_circleData.value()[1][1], 
		cy:local_circleData.value()[1][2], 
		r:local_circleData.value()[2]
	})
	}}$;
}

myCircleX = 300;
myCircleY = 400;
myCircleR = 30;
myCircle is circle(cart(myCircleX, myCircleY), myCircleR);

declareCircle("mySecondCircle");
mySecondCircleX = 300;
mySecondCircleY = 450;
mySecondCircleR = 30;
mySecondCircle is circle(cart(mySecondCircleX, mySecondCircleY), mySecondCircleR);

//
// lines
//

func declareLine {
    execute(
        macro("?1Path = ${{ context.lookup('paper').value().path() }}$; proc ?1Drawer : ?1 { updateLine(?1, ?1Path); }", $1)
    );
}

func updateLine {
    auto lineData, raphaelPath, p;
	p = paper;
    lineData = $1;
    raphaelPath = $2;
    
	${{ 
	var start_x = local_lineData.value()[1][1];
	var start_y = local_lineData.value()[1][2];
	var end_x = local_lineData.value()[2][1];
	var end_y = local_lineData.value()[2][2];
	
	local_raphaelPath.value().attr({path:"M" + start_x + " " + start_y + "L" + end_x + " " + end_y});
	}}$;
}


