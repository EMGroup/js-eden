
EdenUI.plugins.Veden = function(edenUI, success) {
	var me = this;
	var selectedElement = 0;
	var currentX = 0;
	var currentY = 0;
	var currentMatrix = 0;

	function moveElement(evt){
		if (selectedElement == 0) return;
		dx = evt.clientX - currentX;
		dy = evt.clientY - currentY;
		currentMatrix[4] += dx;
		currentMatrix[5] += dy;
		newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
				
		selectedElement.setAttributeNS(null, "transform", newMatrix);
		currentX = evt.clientX;
		currentY = evt.clientY;
	}

	function deselectElement(evt){
		if(selectedElement != 0){
			selectedElement.removeAttributeNS(null, "onmousemove");
			selectedElement.removeAttributeNS(null, "onmouseout");
			selectedElement.removeAttributeNS(null, "onmouseup");
			selectedElement.removeAttribute("filter");
			selectedElement = 0;
		}
	}

	function selectElement(evt) {
		selectedElement = evt.target;

		while (selectedElement.nodeName != "g") {
			selectedElement = selectedElement.parentNode;
		}

		selectedElement.setAttribute("filter","url(#fdrop)");

		currentX = evt.clientX;
		currentY = evt.clientY;
		currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
		console.log(evt);
		  for(var i=0; i<currentMatrix.length; i++) {
			currentMatrix[i] = parseFloat(currentMatrix[i]);
		  }

		selectedElement.parentNode.onmousemove = moveElement;
		//selectedElement.onmouseout = deselectElement;
		selectedElement.parentNode.onmouseup = deselectElement;
	}

	function makeOperatorBlock(text, x, y) {
		var node = document.createElementNS("http://www.w3.org/2000/svg", 'path');
		node.setAttribute("d", "m 26,0.36220432 -26,0 c 0.45127068,0.32157 0.9835405,0.53336 1.3743821,0.92382998 0.9046334,0.90375 1.6355873,1.98054 2.1407706,3.17773 0.5051733,1.19719 0.7839656,2.51344 0.7839656,3.8984401 0,1.385 -0.2787923,2.7031996 -0.7839656,3.9003896 -0.5051833,1.19719 -1.2361372,2.273981 -2.1407706,3.177731 -0.3898106,0.38944 -0.92052889,0.60096 -1.37047829,0.92188 l 25.37243719,0 c -0.417708,-0.3028 -0.916555,-0.49769 -1.280551,-0.86133 -0.885755,-0.88489 -1.601153,-1.939121 -2.095796,-3.111331 -0.494633,-1.17221 -0.76832,-2.4622596 -0.76832,-3.8183596 0,-1.3561001 0.273687,-2.6461501 0.76832,-3.8183601 0.494643,-1.17221 1.210041,-2.22643 2.095796,-3.11133 C 24.637019,1.1008043 25.343879,0.76452432 26,0.36220432 Z");
		node.setAttribute("style", "fill:#ff0038;fill-opacity:0.71859294;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");
		//node.setAttribute("transform", "scale(" + 0.4 + " " + 0.4 +")");
		node.setAttribute("x", ""+x);
		node.setAttribute("y", ""+y);
		return node;
	}

	function makeObservableBlock(text, x, y, width) {
		var box = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
		box.setAttribute("width", ""+width);
		box.setAttribute("height", "20");
		box.setAttribute("x", "0");
		box.setAttribute("y", "0");
		box.setAttribute("ry", "10");
		box.setAttribute("rx", "0");
		box.setAttribute("transform","matrix(1 0 0 1 0 0)");
		box.setAttribute("style","fill:#000038;fill-opacity:0.60301507;fill-rule:evenodd;stroke:none;stroke-width:0.41716799px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1");

		var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
		text.setAttribute("class", "veden-observable");
		text.setAttribute("x", ""+((width/2)));
		text.setAttribute("y", ""+((20/2)));
		text.setAttribute("text-anchor", "middle");
		text.setAttribute("alignment-baseline", "middle");
		text.setAttribute("style","fill:white;");
		text.textContent = "Observable";

		var group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
		group.setAttribute("transform","matrix(1 0 0 1 "+x+" "+y+")");
		group.setAttribute("cursor","pointer");
		group.appendChild(box);
		group.appendChild(text);
		group.onmousedown = selectElement;
		return group;
	}

	this.createDialog = function(name,mtitle) {
		var code_entry = $('<div id=\"'+name+'-content\" class=\"veden-content\"></div>');
		var svg1 = $('<svg width="100%" height="100%" version="1.1"\
			 baseProfile="full"\
			 xmlns="http://www.w3.org/2000/svg">\
			<defs>\
    <filter id="fdrop" x="0" y="0" width="200%" height="200%">\
      <feOffset result="offOut" in="SourceAlpha" dx="5" dy="5" />\
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />\
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />\
    </filter>\
  </defs>\
		</svg>');
		code_entry.append(svg1);
		svg1.append(makeOperatorBlock("", 110, 10));
		svg1.append(makeObservableBlock("",140, 10, 100));
		svg1.append(makeObservableBlock("",21, 10, 100));

		$('<div id="'+name+'"></div>')
			.html(code_entry)
			.dialog({
				title: mtitle,
				width: 600,
				height: 450,
				minHeight: 120,
				minWidth: 230,
				dialogClass: "veden-dialog"
			});
		return {confirmClose: false};
	}

	//Register the DBView options
	edenUI.views["Veden"] = {dialog: this.createDialog, title: "Visual Eden", category: edenUI.viewCategories.interpretation};

	success();
}

/* Plugin meta information */
EdenUI.plugins.Veden.title = "Veden";
EdenUI.plugins.Veden.description = "Visual Eden Code Editor";
