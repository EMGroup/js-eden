EdenUI.plugins.WindowLayout = function(edenUI, success){
	var me = this;
	var defaultview = "";
	var program;
	var longwait = false;
	$.getScript("plugins/view-layout/gridster/jquery.gridster.min.js");
	var cssLink = $("<link rel='stylesheet' type='text/css' href='plugins/view-layout/gridster/jquery.gridster.min.css'>");
	$("head").append(cssLink);
	var cssLink = $("<link rel='stylesheet' type='text/css' href='plugins/view-layout/view-layout.css'>");
	$("head").append(cssLink);
	this.html = function(name,content) {
	//This doesn't look like its ever being called
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"WindowLayout");
			}
			$("#"+defaultview+"-content").html(content).onclick;
		} else {
			$("#"+name+"-dialog-content").html(content).onclick;
		}
	}
	
	this.name = "window_name";
	
	this.createDialog = function(name,mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}
		var positions = [];
		viewlayoutstr = "View Layout";
		var baseh = 100;
		var basew = 100;
		
		var posDia = [];
		var views = root.lookup("_view_list").value();
		var thisViewName = this.name;

		views.forEach(function(e){
			if (e != thisViewName) {
				var tmpx = root.lookup("_view_" + e + "_x").value();
				var tmpy = root.lookup("_view_" + e + "_y").value();
				tmpx = ((typeof tmpx != "undefined") ? tmpx : 0);
				tmpy = ((typeof tmpy != "undefined") ? tmpy : 0);
				posDia = [e,tmpx,tmpy,root.lookup("_view_" + e + "_width").value(), root.lookup("_view_" + e + "_height").value(), root.lookup("_view_" + e + "_title").value()];
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
			)
			
			
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
		$(".vl-update").click(function(){
			var updatedLayout = gridster.serialize();
			updatedLayout.forEach(function(e,i){
				var edenPosCode = "_view_" + e.name + "_y = " + (30 + (e.row-1)*baseh) + ";_view_" + e.name + 
						"_x = " + ((e.col-1)* basew) + ";_view_" + e.name +"_width = " + (e.size_x * basew) + ";_view_" + e.name +"_height = " + (e.size_y * baseh) + ";";
				console.log(edenPosCode);
				eden.execute(edenPosCode);
			});
		});
			//Initialise 
	}
	
	//Register the HTML view options
	edenUI.views["WindowLayout"] = {dialog: this.createDialog, title: "Window Layout", category: edenUI.viewCategories.environment};
	success();
};
/* Plugin meta information */
EdenUI.plugins.WindowLayout.title = "Window Layout Tool";
EdenUI.plugins.WindowLayout.description = "Provices assistance with rearranging windows.";
EdenUI.plugins.WindowLayout.author = "Jonny Foss";
