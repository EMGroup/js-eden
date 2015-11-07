
require("Canvas2D");
include2("models/nick/jugs/jugs.jse");
include2("models/nick/jugs/display.jse");
include2("models/nick/jugs/wmbupdate.e");

_view_picture_x = 40;
_view_picture_y = 30;
_view_picture_width = 460;
_view_picture_height = 350;

createView("fillAgent","ScriptInput");
_view_fillAgent_file = "models/nick/jugs/fillAgent.jse";
_view_fillAgent_power = true;
_view_fillAgent_x = 530;
_view_fillAgent_y = 30;
_view_fillAgent_width = 440;
_view_fillAgent_height = 530;

createView("buttonAgent","ScriptInput");
_view_buttonAgent_file = "models/nick/jugs/buttonAgent.jse";
_view_buttonAgent_power = true;
_view_buttonAgent_x = 990;
_view_buttonAgent_y = 30;
_view_buttonAgent_width = 270;
_view_buttonAgent_height = 530;
