/*
 * Copyright (c) 2015, Empirical Modelling Group
 * All rights reserved.
 *
 * See LICENSE.txt
 */

/**
 * Construit Canvas 3D Plugin.
 */

EdenUI.plugins.Canvas3D = function(edenUI, success) {
	var me = this;

	this.createDialog = function(name,mtitle) {
		var code_entry = $('<div id=\"'+name+'-content\" class=\"canvas3d-content\"><canvas width="600" height="450"></canvas></div>');
		var canvas = code_entry.find("canvas").get(0);
		var gl;

		function initGL() {
			try {
				gl = canvas.getContext("experimental-webgl");
				gl.viewportWidth = canvas.width;
				gl.viewportHeight = canvas.height;
			} catch(e) {
			}
		}

		initGL();
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
    	gl.enable(gl.DEPTH_TEST);

		function testTriangle() {
			var buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			var vertices = [
				0.0,	1.0,	0.0,
				-1.0,	-1.0,	0.0,
				1.0,	-1.0,	0.0
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			buf.itemSize = 3;
			buf.numItems = 3;
		}

		function rebuildScene() {
			console.log(Database.getValue("scene",0));
			//testTriangle();
		}

		testTriangle();

		function drawScene() {
			gl.viewport(0,0,gl.viewportWidth, gl.viewportHeight);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		}

		drawScene();

		Database.setValue("scene",0,[]);
		Database.addAgent("SceneBuilder-"+name, rebuildScene);
		Database.on("change", "scene/0", "SceneBuilder-"+name);

		$('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "canvas3d-dialog"
			});
		return {confirmClose: true};
	}

	//Register the DBView options
	edenUI.views["Canvas3D"] = {dialog: this.createDialog, title: "Canvas 3D", category: edenUI.viewCategories.visualization};

	success();

	//Load the Eden wrapper functions (new syntax).
	//edenUI.eden.include2("plugins/dbview/dbview.js-e", success);
};

/* Plugin meta information */
EdenUI.plugins.Canvas3D.title = "Canvas 3D";
EdenUI.plugins.Canvas3D.description = "Draw a 3D scene";
