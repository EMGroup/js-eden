require("Canvas2D");

if (_view_jspe_width == @) {
	createCanvas("jspe", "slides", "JSPE Slides");
	_view_picture_x = 2;
	_view_jspe_x = _view_picture_x + _view_picture_width + _views_frame_width + 15;
	_view_jspe_y = 0;
	_view_jspe_width is min(700, screenWidth - _view_jspe_x);
	_view_jspe_height is screenHeight - _view_jspe_y;
	_view_inputwindow_x = 2;
	_view_inputwindow_y = _view_picture_y + _view_picture_height + _views_frame_height + 22;	
	_view_inputwindow_width = min(0.4 * screenWidth, _view_picture_width);
	_view_inputwindow_height = screenHeight - _view_inputwindow_y - _views_frame_height;
}

if (slideList == @) slideList = [];

## SlideButton to overcome Button limitations
${{
SlideButton = function (name, label, x, y, enabled) {
	this.name = name;
	this.label = label;
	this.x = x;
	this.y = y;
	this.enabled = enabled;
}

SlideButton.prototype.draw = function(context) {
  var me = "jspe_" + this.name;
  var me2 = this.name;
  var agent = root.lookup("SlideButton");
  var but = $("#"+me).get(0);
  if (but === undefined) {
	var dis = "";
	if (this.enabled == true) { dis = ""; }
	else { dis = "disabled=\"true\""; }

	var can = $("#jspe-dialog-canvascontent");
	var buthtml = $("<input type=\"button\" id=\"" + me + "\" value=\"" + this.label + "\" " + dis + " style=\"position: absolute; left: " + this.x + "px; top: " + this.y + "px;\"></input").click(function() {
		root.lookup(me2 + "_clicked").assign(true, agent);
	}).appendTo(can);

	buthtml.get(0).togarbage = false;

	//Initialise
	root.lookup(me2 + "_clicked").assign(false, agent);
  } else {
	but.value = this.label;
	but.togarbage = false;
	if (this.enabled == true) { but.disabled = false; }
	else { but.disabled = true; }
	but.style.left = "" + this.x + "px";
	but.style.top = "" + this.y + "px";
  }
};
}}$;
${{
SlideButton.prototype.toString = function() {
  return "SlideButton(" + this.name + ", " + this.label + ", " + this.x + ", "+this.y+", "+this.enabled+")";
};
}}$;

func SlideButton { ${{
  var name = arguments[0];
  var label = arguments[1];
  var x = arguments[2];
  var y = arguments[3];
  var enabled = arguments[4];
  return new SlideButton(name, label, x, y, enabled);
}}$; }

## Slide
${{
Slide = function (html) {
        this.html = html;
}

Slide.prototype.draw = function(context) {
  var id = "jspe_slide";
  var jspeJQ = $('#jspe-dialog-canvas');
  var leftRightMargin = 25;
  if (this.elements === undefined) {
	var content = this.html.replace(
		/<jseden>([\s\S]*?)<\/jseden>/g,
		function (match, code, offset, string) {
		return "<div><pre>" + code.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</pre><a href=\"#\" onclick=\"execute(this)\">submit</a> <a href=\"#\" onclick=\"copyToInput(this)\">copy to input</a></div>";
		}
	);

	var can = $("#jspe-dialog-canvascontent");
	var divstyle = "position: absolute; text-align: justify; line-height: 1.75; top: 35px; ";
	divstyle = divstyle + "left: " + leftRightMargin + "px";
	var divJQ = $("<div id=\"" + id + "\" style=\"" + divstyle + "\">" + content + "</div>").appendTo(can);
	this.elements = [divJQ.get(0)];
  }
  $('#jspe_slide').css("width",(parseInt(jspeJQ.width()) - 2 * leftRightMargin) + "px");
};

Slide.prototype.scale = function (scale) {
	//Do nothing
}
}}$;

${{
Slide.prototype.toString = function() {
  return "Slide("+this.html+")";
};
}}$;

func Slide { ${{
  var html = arguments[0];
  return new Slide(html);
}}$; }

${{
  copyToInput = function(e) {

	edenUI.createView("inputwindow", "ScriptInput").setValue($(e).siblings('pre').text());
	//Copies to EDEN interpreter window
  }

  execute = function(e) {
	// Evaluates and stores in the symbol table
	edenUI.plugins.ScriptInput.submitEdenCode($(e).siblings('pre').text());
  }
}}$;

proc clearSlides { ${{
  $("#jspe-dialog-canvascontent > :not(canvas)").each(function() {
	if(/jspe_/.test(this.id)) {
		this.togarbage = true;
	}
  });

}}$; };

proc cleanupSlides { ${{
  $("#jspe-dialog-canvascontent > :not(canvas)").each(function() {
	if (this.togarbage == true) {
		$(this).remove();
	}
  });
}}$; };

proc drawSlides : slides {
  clearSlides();
  ${{
  var slides = context.lookup('slides').value();
  var jspe = $('#jspe-dialog-canvas').get(0).getContext('2d');

  if (slides === undefined) { return; }

  for (var i = 0; i < slides.length; i++) {
  if (slides[i] === undefined) { continue; }
  slides[i].draw(jspe);
  }
  }}$;
  cleanupSlides();
};

jspeleft = 2;

buttonPrevEnabled is currentSlide > 1;
buttonNextEnabled is currentSlide < slideList#;

buttonPrev is SlideButton("buttonPrev","Previous Slide", jspeleft, 4, buttonPrevEnabled);
buttonNext is SlideButton("buttonNext","Next Slide", jspeleft + 170, 4, buttonNextEnabled);

## buttonSave = SlideButton("buttonSave","Add Slide", int(${{ $('#jspe-dialog-canvas').position().left }}$) + 100, ${{ $('#jspe-dialog-canvas').height()+15 }}$, true);


proc prevSlide : buttonPrev_clicked {
	if (!buttonPrev_clicked) {
		return;
	}

	if (currentSlide > 2) {
		currentSlide--;
	} else {
		currentSlide = 1;
	}
}

proc nextSlide : buttonNext_clicked {
	if (!buttonNext_clicked) {
		return;
	}

	if (currentSlide < slideList#) {
		currentSlide++;
	} else {
		currentSlide = slideList#;
	}
}


## User interface elements.
slideNumberLabel is Text(currentSlide // " of " // slideList#, jspeleft + 140, 10, {align: "centre"});


textIncrease is SlideButton("buttonTextIncrease", "Font++", jspeleft + 345, 4, true);
textDecrease is SlideButton("buttonTextDecrease", "Font--", jspeleft + 278, 4, true);

slides is [buttonPrev, slideNumberLabel, buttonNext, slideList[currentSlide], textIncrease, textDecrease];

bindCSSNumericProperty("#jspe_slide", "font-size", "jspeFontSize", "pt");
jspeFontSize = 11;

proc increaseText : buttonTextIncrease_clicked{
	if(!buttonTextIncrease_clicked){
		return;
	}
	jspeFontSize++;
}

proc decreaseText : buttonTextDecrease_clicked{
	if(!buttonTextDecrease_clicked){
		return;
	}
	jspeFontSize--;
}

if (currentSlide == @) {
	currentSlide = 1;
}


${{
$('#canvas_buttonPrev').attr('id', 'jspe_buttonPrev');
$('#canvas_buttonNext').attr('id', 'jspe_buttonNext');
}}$;

func TitleSlide {
	para title, subtitle;
	auto slideHTML;
	if ($# == 0 || $# > 2) {
		error("TitleSlide: This function requires at least 1 argument and at most 2 arguments.");
		return @;
	}
	
	if (title == @) {
		title = "";
	} else if (!isString(title)) {
		error("TitleSlide: The second argument must be of a string, not a " // type(title));
		return @;
	}
	
	slideHTML =  "<div style=\"margin-top: calc(45% - 76px); text-align: center\"><div style=\"font-size: 28pt; transform: translateY(-50%)\">" // title // "</div>";

	if (isString(subtitle) && subtitle != "") {
		slideHTML = slideHTML // "<div style=\"font-size: 16pt; margin-top: 1pt\">" // subtitle // "</div>";
	} else if (subtitle != @ && subtitle != "") {
		error("TitleSlide: The second argument must be a string, not a " // type(subtitle));
	}
	slideHTML = slideHTML // "</div>";
	return Slide(slideHTML);
}

func TitledSlide {
	auto title, subtitle, content, slideHTML;
	if ($# == 2) {
		title = $[1];
		subtitle = @;
		content = $[2];
	} else if ($# == 3) {
		title = $[1];
		subtitle = $[2];
		content = $[3];
	} else {
		error("TitledSlide: This function must have a minimum of 2 arguments and a maximum of 3 arguments.");
		return @;
	}
	
	if (title == @) {
		slideHTML = "<h1>&nbsp;</h1>";
	} else if (isString(title)) {
		slideHTML = "<h1>" // title // "</h1>\n";
	} else {
		error("TitledSlide: The first argument must be a string, not a " // type(title));
		return @;
	}
	
	if (isString(subtitle) && subtitle != "") {
		slideHTML = slideHTML // "<h2>" // subtitle // "</h2>\n";
	} else if (subtitle != @ && subtitle != "") {
		error("TitledSlide: The second argument must be a string, not a " // type(subtitle));
	}
	
	if (isString(content)) {
		slideHTML = slideHTML // content;
	} else if (content != @) {
		error("TitledSlide: The final argument must be a string, not a " // type(content));		
	}
	
	return Slide(slideHTML);
}

func BulletSlide {
	auto title, subtitle, bullets, slideHTML, lists, savedListPositions, currentList, currentPosition, currentItem, i, errorStr;
	if ($# == 0) {
		error("BulletSlide: This function requires a minimum of one argument.");
		return @;
	} else if ($# == 1 && (isList($[1]) || $[1] == @)) {
		title = @;
		subtitle = @;
		bullets = $[1];
	} else if ($# == 2 && isList($[2])) {
		subtitle = @;
		bullets = $[2];
	} else {
		if ($[2] == @ || isString($[2])) {
			subtitle = $[2];
		} else {
			error("BulletSlide: The second argument must be a string, not a " // type($[2]));
			return @;
		}
		if ($# == 3 && isList($[3])) {
			bullets = $[3];
		} else {
			bullets = sublist($, 3, $#);
		}
	}
	
	if ($# > 1) {
		if ($[1] == @ || isString($[1])) {
			title = $[1];
		} else	{
			error("BulletSlide: The first argument must be a string, not a " // type($[1]));
			return @;
		}
	}
	
	if (title != @ && title != "") {
		slideHTML = "<h1>" // title // "</h1>\n";
	} else {
		slideHTML = "";
	}
	
	if (subtitle != @ && subtitle != "") {
		slideHTML = slideHTML // "<h2>" // subtitle // "</h2>\n";
	}
	
	
	if (bullets != @ && bullets# > 0) {	
		lists = [bullets];
		savedListPositions = [];
		currentList = bullets;
		currentPosition = 1;
		slideHTML = slideHTML // "<ul>\n";
		
		while (lists# > 0) {
			while (currentPosition <= currentList#) {
				currentItem = currentList[currentPosition];
				if (isString(currentItem)) {
					if (currentPosition > 1) {
						slideHTML = slideHTML // "</li>\n";
					}
					slideHTML = slideHTML // "<li style=\"";
					if (lists# == 1) {
						slideHTML = slideHTML // "margin-bottom: 7pt;";
					}
					slideHTML = slideHTML // "line-height: 150%\">" // currentItem;
				} else if (isList(currentItem)) {
					if (currentItem# > 0) {
						##Begin a nested list.
						append lists, currentItem;
						append savedListPositions, currentPosition + 1;
						currentList = currentItem;
						currentPosition = 0; ##Incremented below
						slideHTML = slideHTML // "\n<ul>\n";
					}
				} else if (currentItem != @) {
					errorStr = "BulletSlide: List item ";
					for (i = 1; i <= savedListPositions; i++) {
						errorStr = errorStr // str(savedListPositions[i]) // ".";
					}
					errorStr = errorStr // str(currentPosition);
					errorStr = errorStr // " must be a string, not a " // type(currentItem);
					error(errorStr);
					return @;
				}
				currentPosition++;
			} ## end while items remaining in the current list
			slideHTML = slideHTML // "</li>\n</ul>\n";
			lists = sublist(lists, 1, lists# - 1);
			
			if (lists# > 0) {
				currentList = lists[lists#];
				currentPosition = savedListPositions[savedListPositions#];
				savedListPositions = sublist(savedListPositions, 1, savedListPositions# - 1);
			}
		}
	} ## end if the slide has some bullet points
	return Slide(slideHTML);
}
