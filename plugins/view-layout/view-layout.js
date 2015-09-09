EdenUI.plugins.WindowLayoutTool = function(edenUI, success) {
	var me = this;
	var defaultview = "";
	var program;
	var longwait = false;
	$.getScript("plugins/view-layout/gridster/jquery.gridster.min.js");
	var cssLink = $("<link rel='stylesheet' type='text/css' href='plugins/view-layout/gridster/jquery.gridster.min.css'>");
	$("head").append(cssLink);
	var cssLink = $("<link rel='stylesheet' type='text/css' href='plugins/view-layout/view-layout.css'>");
	$("head").append(cssLink);
	
	this.name = "window_name";
	
	this.createDialog = function(name,mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}
		var positions = [];
		viewlayoutstr = "View Layout";
		var baseh = 5 * edenUI.gridSizeY;
		var basew = 3 * edenUI.gridSizeX;
		
		var posDia = [];
		var views = root.lookup("_views_list").value();
		var thisViewName = this.name;

		views.forEach(function(e){
			if (e != thisViewName) {
				var tmpx = root.lookup("_view_" + e + "_x").value();
				var tmpy = root.lookup("_view_" + e + "_y").value();
				tmpx = ((typeof tmpx != "undefined") ? tmpx : 0);
				tmpy = ((typeof tmpy != "undefined") ? tmpy : 0);
				posDia = [
					e,
					tmpx,
					tmpy,
					root.lookup("_view_" + e + "_width").value() + edenUI.scrollBarSize,
					root.lookup("_view_" + e + "_height").value() + edenUI.titleBarHeight,
					root.lookup("_view_" + e + "_title").value()
				];
				console.log(posDia);
				positions.push(posDia);
			}
		});
		var fullLIList = "";
		positions.forEach(function(e,i){
			fullLIList += "<li data-row=\"" + Math.round(e[2] / (baseh)) + "\" data-col=\"" + Math.round(e[1] / (basew)) + "\" data-sizex=\"" + Math.round(e[3] / (basew * 1)) + "\" data-sizey=\"" + Math.round(e[4] / (baseh * 1)) +"\" data-name=\"" + e[0] + "\" data-num=\"" + i + "\">" + e[5] + " [" + e[0] + "]</li>";
//			$(".gridster ul").append(thisli);
		});

		var vlHTML = "<a class=\"vl-update\">Update</a><div class=\"gridster\"><ul>" + fullLIList + "</ul></div>";
		$dialog = $('<div id="'+name+'"></div>')
			.html(vlHTML)
			.dialog(
				{
					title: mtitle,
					width: $(window).width() / 2,
					height: $(window).height() / 2,
					minHeight: 120,
					minWidth: 230
				}
			);
			
			
		gridster = $(".gridster ul").gridster({
			widget_base_dimensions: [basew, baseh],
			widget_margins: [0, 0],
			min_cols: Math.round($(window).width() / basew),
			max_cols: Math.round($(window).width() / basew),	
			helper: 'clone',
			resize: {
				enabled: true
			},
			serialize_params: function($w, wgd) {
				return { col: wgd.col, row: wgd.row, size_x: wgd.size_x, size_y: wgd.size_y, name: wgd.name, name: $(wgd.el.context).attr("data-name")} 
        	}
        }).data('gridster');
		
		$(".vl-update").click(function() {
			var updatedLayout = gridster.serialize();
			var minCol = 1, minRow = 1;
			updatedLayout.forEach(function(e, i) {
				if (e.col < minCol) {
					minCol = e.col;
				}
				if (e.row < minRow) {
					minRow = e.row;
				}
			});
			updatedLayout.forEach(function(e,i) {
				var edenPosCode = "_view_" + e.name + "_y = " + ((e.row-minRow) * baseh) +
					";_view_" + e.name + "_x = " + ((e.col-minCol) * basew) +
					";_view_" + e.name +"_width = " + (e.size_x * basew - edenUI.dialogFrameWidth) +
					";_view_" + e.name +"_height = " + (e.size_y * baseh - edenUI.dialogFrameHeight) + ";";
				console.log(edenPosCode);
				eden.execute(edenPosCode);
			});
		});
	}
	
	//Register the HTML view options
	edenUI.views["WindowLayoutTool"] = {dialog: this.createDialog, title: "Window Layout", category: edenUI.viewCategories.environment};
	success();
};

/* Plugin meta information */
EdenUI.plugins.WindowLayoutTool.title = "Window Layout Tool";
EdenUI.plugins.WindowLayoutTool.description = "Provices assistance with rearranging windows.";
EdenUI.plugins.WindowLayoutTool.author = "Jonny Foss";
