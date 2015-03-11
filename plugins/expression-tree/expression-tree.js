EdenUI.plugins.ET = function(edenUI, success){
	var me = this;
	var defaultview = "";

	this.html = function(name,content) {
	//This doesn't look like its ever being called
		if (name == "DEFAULT") {
			if (defaultview == "") {
				edenUI.createView(name,"ET");
			}
			$("#"+defaultview+"-content").html(content).onclick;
		} else {
			$("#"+name+"-dialog-content").html(content).onclick;
		}
	}
	
	this.createDialog = function(name,mtitle) {

		if (defaultview == "") {
			defaultview = name;
		}

		var etHTML = "<div style=\"width: 300px; height: 450px\" class=\"etdiv\"><div id=\"infovis\" style=\"width: 300px; height: 450px\"></div></div>";
		
		$dialog = $('<div id="'+name+'"></div>')
			.html(etHTML)
			.dialog(
				{
					title: mtitle,
					width: 300,
					height: 450,
					minHeight: 120,
					minWidth: 230
				}
			)
			
			//Initialise 
var json = {
			id: "node1", name: "+", children: [{id: "node02", name: "b"},{id: "node03", name: "*", children: [{id: "node04", name: "c"},{id: "node05", name: "d"}]}]
		};
//		var json = "{id:\"node02\", name:\"0.2\", data:{}, children:[{id:\"node13\", name:\"1.3\", data:{}, children:[{id:\"node24\", name:\"2.4\", data:{}, children:[{id:\"node35\", name:\"3.5\", data:{}, children:[{id:\"node46\", name:\"4.6\", data:{}, children:[]}]}, {id:\"node37\", name:\"3.7\", data:{}, children:[{id:\"node48\", name:\"4.8\", data:{}, children:[]}, {id:\"node49\", name:\"4.9\", data:{}, children:[]}, {id:\"node410\", name:\"4.10\", data:{}, children:[]}, {id:\"node411\", name:\"4.11\", data:{}, children:[]}]}, {id:\"node312\", name:\"3.12\", data:{}, children:[{id:\"node413\", name:\"4.13\", data:{}, children:[]}]}, {id:\"node314\", name:\"3.14\", data:{}, children:[{id:\"node415\", name:\"4.15\", data:{}, children:[]}, {id:\"node416\", name:\"4.16\", data:{}, children:[]}, {id:\"node417\", name:\"4.17\", data:{}, children:[]}, {id:\"node418\", name:\"4.18\", data:{}, children:[]}]}, {id:\"node319\", name:\"3.19\", data:{}, children:[{id:\"node420\", name:\"4.20\", data:{}, children:[]}, {id:\"node421\", name:\"4.21\", data:{}, children:[]}]}]}, {id:\"node222\", name:\"2.22\", data:{}, children:[{id:\"node323\", name:\"3.23\", data:{}, children:[{id:\"node424\", name:\"4.24\", data:{}, children:[]}]}]}]}, {id:\"node125\", name:\"1.25\", data:{}, children:[{id:\"node226\", name:\"2.26\", data:{}, children:[{id:\"node327\", name:\"3.27\", data:{}, children:[{id:\"node428\", name:\"4.28\", data:{}, children:[]}, {id:\"node429\", name:\"4.29\", data:{}, children:[]}]}, {id:\"node330\", name:\"3.30\", data:{}, children:[{id:\"node431\", name:\"4.31\", data:{}, children:[]}]}, {id:\"node332\", name:\"3.32\", data:{}, children:[{id:\"node433\", name:\"4.33\", data:{}, children:[]}, {id:\"node434\", name:\"4.34\", data:{}, children:[]}, {id:\"node435\", name:\"4.35\", data:{}, children:[]}, {id:\"node436\", name:\"4.36\", data:{}, children:[]}]}]}, {id:\"node237\", name:\"2.37\", data:{}, children:[{id:\"node338\", name:\"3.38\", data:{}, children:[{id:\"node439\", name:\"4.39\", data:{}, children:[]}, {id:\"node440\", name:\"4.40\", data:{}, children:[]}, {id:\"node441\", name:\"4.41\", data:{}, children:[]}]}, {id:\"node342\", name:\"3.42\", data:{}, children:[{id:\"node443\", name:\"4.43\", data:{}, children:[]}]}, {id:\"node344\", name:\"3.44\", data:{}, children:[{id:\"node445\", name:\"4.45\", data:{}, children:[]}, {id:\"node446\", name:\"4.46\", data:{}, children:[]}, {id:\"node447\", name:\"4.47\", data:{}, children:[]}]}, {id:\"node348\", name:\"3.48\", data:{}, children:[{id:\"node449\", name:\"4.49\", data:{}, children:[]}, {id:\"node450\", name:\"4.50\", data:{}, children:[]}, {id:\"node451\", name:\"4.51\", data:{}, children:[]}, {id:\"node452\", name:\"4.52\", data:{}, children:[]}, {id:\"node453\", name:\"4.53\", data:{}, children:[]}]}, {id:\"node354\", name:\"3.54\", data:{}, children:[{id:\"node455\", name:\"4.55\", data:{}, children:[]}, {id:\"node456\", name:\"4.56\", data:{}, children:[]}, {id:\"node457\", name:\"4.57\", data:{}, children:[]}]}]}, {id:\"node258\", name:\"2.58\", data:{}, children:[{id:\"node359\", name:\"3.59\", data:{}, children:[{id:\"node460\", name:\"4.60\", data:{}, children:[]}, {id:\"node461\", name:\"4.61\", data:{}, children:[]}, {id:\"node462\", name:\"4.62\", data:{}, children:[]}, {id:\"node463\", name:\"4.63\", data:{}, children:[]}, {id:\"node464\", name:\"4.64\", data:{}, children:[]}]}]}]}, {id:\"node165\", name:\"1.65\", data:{}, children:[{id:\"node266\", name:\"2.66\", data:{}, children:[{id:\"node367\", name:\"3.67\", data:{}, children:[{id:\"node468\", name:\"4.68\", data:{}, children:[]}, {id:\"node469\", name:\"4.69\", data:{}, children:[]}, {id:\"node470\", name:\"4.70\", data:{}, children:[]}, {id:\"node471\", name:\"4.71\", data:{}, children:[]}]}, {id:\"node372\", name:\"3.72\", data:{}, children:[{id:\"node473\", name:\"4.73\", data:{}, children:[]}, {id:\"node474\", name:\"4.74\", data:{}, children:[]}, {id:\"node475\", name:\"4.75\", data:{}, children:[]}, {id:\"node476\", name:\"4.76\", data:{}, children:[]}]}, {id:\"node377\", name:\"3.77\", data:{}, children:[{id:\"node478\", name:\"4.78\", data:{}, children:[]}, {id:\"node479\", name:\"4.79\", data:{}, children:[]}]}, {id:\"node380\", name:\"3.80\", data:{}, children:[{id:\"node481\", name:\"4.81\", data:{}, children:[]}, {id:\"node482\", name:\"4.82\", data:{}, children:[]}]}]}, {id:\"node283\", name:\"2.83\", data:{}, children:[{id:\"node384\", name:\"3.84\", data:{}, children:[{id:\"node485\", name:\"4.85\", data:{}, children:[]}]}, {id:\"node386\", name:\"3.86\", data:{}, children:[{id:\"node487\", name:\"4.87\", data:{}, children:[]}, {id:\"node488\", name:\"4.88\", data:{}, children:[]}, {id:\"node489\", name:\"4.89\", data:{}, children:[]}, {id:\"node490\", name:\"4.90\", data:{}, children:[]}, {id:\"node491\", name:\"4.91\", data:{}, children:[]}]}, {id:\"node392\", name:\"3.92\", data:{}, children:[{id:\"node493\", name:\"4.93\", data:{}, children:[]}, {id:\"node494\", name:\"4.94\", data:{}, children:[]}, {id:\"node495\", name:\"4.95\", data:{}, children:[]}, {id:\"node496\", name:\"4.96\", data:{}, children:[]}]}, {id:\"node397\", name:\"3.97\", data:{}, children:[{id:\"node498\", name:\"4.98\", data:{}, children:[]}]}, {id:\"node399\", name:\"3.99\", data:{}, children:[{id:\"node4100\", name:\"4.100\", data:{}, children:[]}, {id:\"node4101\", name:\"4.101\", data:{}, children:[]}, {id:\"node4102\", name:\"4.102\", data:{}, children:[]}, {id:\"node4103\", name:\"4.103\", data:{}, children:[]}]}]}, {id:\"node2104\", name:\"2.104\", data:{}, children:[{id:\"node3105\", name:\"3.105\", data:{}, children:[{id:\"node4106\", name:\"4.106\", data:{}, children:[]}, {id:\"node4107\", name:\"4.107\", data:{}, children:[]}, {id:\"node4108\", name:\"4.108\", data:{}, children:[]}]}]}, {id:\"node2109\", name:\"2.109\", data:{}, children:[{id:\"node3110\", name:\"3.110\", data:{}, children:[{id:\"node4111\", name:\"4.111\", data:{}, children:[]}, {id:\"node4112\", name:\"4.112\", data:{}, children:[]}]}, {id:\"node3113\", name:\"3.113\", data:{}, children:[{id:\"node4114\", name:\"4.114\", data:{}, children:[]}, {id:\"node4115\", name:\"4.115\", data:{}, children:[]}, {id:\"node4116\", name:\"4.116\", data:{}, children:[]}]}, {id:\"node3117\", name:\"3.117\", data:{}, children:[{id:\"node4118\", name:\"4.118\", data:{}, children:[]}, {id:\"node4119\", name:\"4.119\", data:{}, children:[]}, {id:\"node4120\", name:\"4.120\", data:{}, children:[]}, {id:\"node4121\", name:\"4.121\", data:{}, children:[]}]}, {id:\"node3122\", name:\"3.122\", data:{}, children:[{id:\"node4123\", name:\"4.123\", data:{}, children:[]}, {id:\"node4124\", name:\"4.124\", data:{}, children:[]}]}]}, {id:\"node2125\", name:\"2.125\", data:{}, children:[{id:\"node3126\", name:\"3.126\", data:{}, children:[{id:\"node4127\", name:\"4.127\", data:{}, children:[]}, {id:\"node4128\", name:\"4.128\", data:{}, children:[]}, {id:\"node4129\", name:\"4.129\", data:{}, children:[]}]}]}]}, {id:\"node1130\", name:\"1.130\", data:{}, children:[{id:\"node2131\", name:\"2.131\", data:{}, children:[{id:\"node3132\", name:\"3.132\", data:{}, children:[{id:\"node4133\", name:\"4.133\", data:{}, children:[]}, {id:\"node4134\", name:\"4.134\", data:{}, children:[]}, {id:\"node4135\", name:\"4.135\", data:{}, children:[]}, {id:\"node4136\", name:\"4.136\", data:{}, children:[]}, {id:\"node4137\", name:\"4.137\", data:{}, children:[]}]}]}, {id:\"node2138\", name:\"2.138\", data:{}, children:[{id:\"node3139\", name:\"3.139\", data:{}, children:[{id:\"node4140\", name:\"4.140\", data:{}, children:[]}, {id:\"node4141\", name:\"4.141\", data:{}, children:[]}]}, {id:\"node3142\", name:\"3.142\", data:{}, children:[{id:\"node4143\", name:\"4.143\", data:{}, children:[]}, {id:\"node4144\", name:\"4.144\", data:{}, children:[]}, {id:\"node4145\", name:\"4.145\", data:{}, children:[]}, {id:\"node4146\", name:\"4.146\", data:{}, children:[]}, {id:\"node4147\", name:\"4.147\", data:{}, children:[]}]}]}]}]}";
/*	
	    $jit.ST.Plot.NodeTypes.implement({
	        'nodeline': {
	          'render': function(node, canvas, animating) {
	                if(animating === 'expand' || animating === 'contract') {
	                  var pos = node.pos.getc(true), nconfig = this.node, data = node.data;
	                  var width  = nconfig.width, height = nconfig.height;
	                  var algnPos = this.getAlignedPos(pos, width, height);
	                  var ctx = canvas.getCtx(), ort = this.config.orientation;
	                  ctx.beginPath();
	                  if(ort == 'left' || ort == 'right') {
	                      ctx.moveTo(algnPos.x, algnPos.y + height / 2);
	                      ctx.lineTo(algnPos.x + width, algnPos.y + height / 2);
	                  } else {
	                      ctx.moveTo(algnPos.x + width / 2, algnPos.y);
	                      ctx.lineTo(algnPos.x + width / 2, algnPos.y + height);
	                  }
	                  ctx.stroke();
	              } 
	          }
	        }

	    });
		var st = new $jit.ST(	{
				injectInto: 'infovis', orientation: 'top',
				Node: {color: '#0000ff'},Edge: { color: '#C17878',lineWidth:1.5},
			    duration: 800,  
			    //set animation transition type  
			    transition: $jit.Trans.Quart.easeInOut,  
			    //set distance between node and its children  
			    levelDistance: 50,  
			    //set max levels to show. Useful when used with  
			    //the request method for requesting trees of specific depth  
			    levelsToShow: 2,  
			    //set node and edge styles  
			    //set overridable=true for styling individual  
			    //nodes or edges  
			    Node: {  
			        height: 20,  
			        width: 40,  
			        //use a custom  
			        //node rendering function  
			        type: 'nodeline',  
			        color:'#00f',  
			        lineWidth: 2,  
			        align:"center",  
			        overridable: true  
			    },  
			      
			    Edge: {  
			        type: 'bezier',  
			        lineWidth: 2,  
			        color:'#23A4FF',  
			        overridable: true  
			    },  
			      
			    //Add a request method for requesting on-demand json trees.   
			    //This method gets called when a node  
			    //is clicked and its subtree has a smaller depth  
			    //than the one specified by the levelsToShow parameter.  
			    //In that case a subtree is requested and is added to the dataset.  
			    //This method is asynchronous, so you can make an Ajax request for that  
			    //subtree and then handle it to the onComplete callback.  
			    //Here we just use a client-side tree generator (the getTree function).  
			    request: function(nodeId, level, onComplete) {  
			      var ans = getTree(nodeId, level);  
			      onComplete.onComplete(nodeId, ans);    
			    },  
			      
			    //This method is called on DOM label creation.  
			    //Use this method to add event handlers and styles to  
			    //your node.  
			    onCreateLabel: function(label, node){  
			        label.id = node.id;              
			        label.innerHTML = node.name;  
			        label.onclick = function(){  
			            st.onClick(node.id);  
			        };  
			        //set label styles  
			        var style = label.style;  
			        style.width = 40 + 'px';  
			        style.height = 17 + 'px';              
			        style.cursor = 'pointer';  
			        style.color = '#000';  
			        //style.backgroundColor = '#1a1a1a';  
			        style.fontSize = '2.5em';  
			        style.textAlign= 'center';  
			        style.paddingTop = '3px';  
			    },  
			      
			    //This method is called right before plotting  
			    //a node. It's useful for changing an individual node  
			    //style properties before plotting it.  
			    //The data properties prefixed with a dollar  
			    //sign will override the global node style properties.  
			    onBeforePlotNode: function(node){  
			        //add some color to the nodes in the path between the  
			        //root node and the selected node.  
			        if (node.selected) {  
			            node.data.$color = "#f00";  
			        }  
			        else {  
			            delete node.data.$color;  
			        }  
			    },  
			      
			    //This method is called right before plotting  
			    //an edge. It's useful for changing an individual edge  
			    //style properties before plotting it.  
			    //Edge data proprties prefixed with a dollar sign will  
			    //override the Edge global style properties.  
			    onBeforePlotLine: function(adj){  
			        if (adj.nodeFrom.selected && adj.nodeTo.selected) {  
			            adj.data.$color = "#0f0";  
			            adj.data.$lineWidth = 3;  
			        }  
			        else {  
			            delete adj.data.$color;  
			            delete adj.data.$lineWidth;  
			        }  
			    }  
			});  
			//load json data  
		st.loadJSON(json);   
			//compute node positions and layout  
			st.compute();  
			//emulate a click on the root node.  
			st.onClick(st.root);  
*/
	}

	var convertTreeToText = function (prefixOperators, infixOperators, postfixOperators, specialOperators, functionInvocationPrecedence) {
		var convertTree = function (json, parentPrecedence, parentName) {
			if (!json.hasOwnProperty("children")) {
				return json.name;
			}

			var operatorName = json.name;
			var children = json.children;
			var operator, thisPrecedence, str;

			if (infixOperators.hasOwnProperty(operatorName) && children.length == 2) {

				operator = infixOperators[operatorName];
				thisPrecedence = operator.precedence;
				var associativity = operator.associativity;

				var leftStr = convertTree(children[0], thisPrecedence, operator.text);
				var rightStr = convertTree(children[1], thisPrecedence, operator.text);
				
				if (associativity == "left") {
					var rightChildOperatorName = children[1].name;
					if (children[1].hasOwnProperty("children") && children[1].children.length == 2 &&
						infixOperators.hasOwnProperty(rightChildOperatorName) &&
						thisPrecedence == infixOperators[rightChildOperatorName].precedence) {
						rightStr = "(" + rightStr + ")";
					}
				} else {
					var leftChildOperatorName = children[0].name;
					if (children[0].hasOwnProperty("children") && children[0].children.length == 2 &&
						infixOperators.hasOwnProperty(leftChildOperatorName) &&
						thisPrecedence == infixOperators[leftChildOperatorName].precedence) {
						leftStr = "(" + leftStr + ")";
					}		
				}
				
				if (operator.whitespace) {
					str =  leftStr + " " + operator.text + " " + rightStr;
				} else {
					str =  leftStr + operator.text + rightStr;					
				}

			} else if (prefixOperators.hasOwnProperty(operatorName)) {

				operator = prefixOperators[operatorName];
				thisPrecedence = operator.precedence;
				str = operator.text + convertTree(children[0], thisPrecedence, operator.text);
		
			} else if (postfixOperators.hasOwnProperty(operatorName)) {
				
				operator = postfixOperators[operatorName];
				thisPrecedence = operator.precedence;
				str = convertTree(children[0], thisPrecedence, operator.text) + operator.text;
				
			} else if (specialOperators.hasOwnProperty(operatorName)) {
				
				operator = specialOperators[operatorName];
				this.precedence = operator.precedence;
				str = operator.code(children, parentName);

			} else {

				thisPrecedence = functionInvocationPrecedence;
				var args = [];
				for (var i = 0; i < children.length; i++) {
					args.push(convertTree(children[i], 0, undefined));
				}
				str = operatorName + "(" + args.join(", ") + ")";

			}
			if (thisPrecedence < parentPrecedence) {
				str = "(" + str + ")";
			}
			return str;
		};

		return function (json) {
			return convertTree(json, 0, undefined);
		}
	};

	var edenInfixOperators = {};
	edenInfixOperators["="] = {precedence: 1, associativity: "right", text: "=", whitespace: true};
	edenInfixOperators["+="] = {precedence: 1, associativity: "right", text: "+=", whitespace: true};
	edenInfixOperators["-="] = {precedence: 1, associativity: "right", text: "-=", whitespace: true};
	edenInfixOperators["||"] = {precedence: 3, associativity: "left", text: "||", whitespace: true};
	edenInfixOperators["or"] = {precedence: 3, associativity: "left", text: "or", whitespace: true};
	edenInfixOperators["&&"] = {precedence: 4, associativity: "left", text: "&&", whitespace: true};
	edenInfixOperators["and"] = {precedence: 4, associativity: "left", text: "and", whitespace: true};
	edenInfixOperators["=="] = {precedence: 5, associativity: "left", text: "==", whitespace: true};
	edenInfixOperators["!="] = {precedence: 5, associativity: "left", text: "!=", whitespace: true};
	edenInfixOperators["<"] = {precedence: 6, associativity: "left", text: "<", whitespace: true};
	edenInfixOperators["<="] = {precedence: 6, associativity: "left", text: "<=", whitespace: true};
	edenInfixOperators[">"] = {precedence: 6, associativity: "left", text: ">=", whitespace: true};
	edenInfixOperators[">="] = {precedence: 6, associativity: "left", text: ">", whitespace: true};
	edenInfixOperators["//"] = {precedence: 7, associativity: "left", text: "//", whitespace: true};
	edenInfixOperators["+"] = {precedence: 8, associativity: "left", text: "+", whitespace: true};
	edenInfixOperators["-"] = {precedence: 8, associativity: "left", text: "-", whitespace: true};
	edenInfixOperators["*"] = {precedence: 9, associativity: "left", text: "*", whitespace: true};
	edenInfixOperators["/"] = {precedence: 9, associativity: "left", text: "/", whitespace: true};
	edenInfixOperators["%"] = {precedence: 9, associativity: "left", text: "%", whitespace: true};
	edenInfixOperators["^"] = {precedence: 11, associativity: "right", text: ".", whitespace: false};
	edenInfixOperators["."] = {precedence: 14, associativity: "left", text: ".", whitespace: false};

	var edenPrefixOperators = {};
	edenPrefixOperators["-"] = {precedence: 10, text: "-"};
	edenPrefixOperators["!"] = {precedence: 10, text: "!"};
	edenPrefixOperators["&"] = {precedence: 10, text: "&"};
	edenPrefixOperators["not"] = {precedence: 10, text: "!"};
	edenPrefixOperators["++."] = {precedence: 11, text: "++"};
	edenPrefixOperators["--."] = {precedence: 11, text: "--"};
	edenPrefixOperators["*"] = {precedence: 12, text: "*"};  //Pointer dereference

	var edenPostfixOperators = {};
	edenPostfixOperators["#"] = {precedence: 11, text: "#"};
	edenPostfixOperators[".++"] = {precedence: 11, text: "++"};
	edenPostfixOperators[".--"] = {precedence: 11, text: "--"};
	
	var edenSpecialOperators = {};
	var edenFuncInvocationPrecedence = 13;
	this.convertTreeToEden = convertTreeToText(edenPrefixOperators, edenInfixOperators, edenPostfixOperators, edenSpecialOperators, edenFuncInvocationPrecedence);

	edenSpecialOperators["?"] = {
		precedence: 2,
		code: function (operands) {
			var condition = me.convertTreeToEden(operands[0]);
			var trueBranch = me.convertTreeToEden(operands[1]);
			var falseBranch = me.convertTreeToEden(operands[2]);
			return condition + "? " + trueBranch + " : " + falseBranch;
		}
	};
	edenSpecialOperators["`...`"] = {
		precedence: 13,
		code: function (operands) {
			var identifier = me.convertTreeToEden(operands[0]);
			return "`" + identifier + "`";
		}
	};
	edenSpecialOperators["${{...}}$"] = {
		precedence: 13,
		code: function (operands) {
			var js = operands[0].name;
			return "${{ " + js + " }}$";
		}
	};
	edenSpecialOperators["(...)"] = { //E.g. (*funcPointer)(argument) (This operator is function application, the 2nd pair of parenthesis)
		precedence: 13,
		code: function (operands) {
			var functionExpr = me.convertTreeToEden(operands[0]);
			var operandStrs = [];
			for (var i = 1; i < operands.length; i++) {
				operandStrs.push(me.convertTreeToEden(operands[i]));
			}
			return "(" + functionExpr + ")(" + operandStrs.join(", ") + ")";
		}
	};
	edenSpecialOperators["[...]"] = {
		precedence: 13,
		code: function (operands) {
			var operandStrs = [];
			for (var i = 0; i < operands.length; i++) {
				operandStrs.push(me.convertTreeToEden(operands[i]));
			}
			return "[" + operandStrs.join(", ") + "]";
		}
	};	
	edenSpecialOperators["[n]"] = {
		precedence: 13,
		code: function (operands) {
			var list = me.convertTreeToEden(operands[0]);
			var index = me.convertTreeToEden(operands[1]);
			return list + "[" + index + "]";
		}
	};
	edenSpecialOperators["{...}"] = {
		precedence: 13,
		code: function (operands) {
			var nameValuePairs = [];
			for (var i = 0; i < operands.length - 1; i = i + 2) {
				nameValuePairs.push(operands[i].name + ": " + me.convertTreeToEden(operands[i+1]));
			}
			return "{" + nameValuePairs.join(", ") + "}";
		}
	};
	edenSpecialOperators["Point"] = {
		precedence: 13,
		code: function (operands, parentOp) {
			if (parentOp == ".") {
				//Method name called Point
				var operandStrs = [];
				for (var i = 0; i < operands.length; i++) {
					operandStrs.push(me.convertTreeToEden(operands[i]));
				}
				return "Point(" + operandStrs.join(", ") + ")";
			} else {
				var x = me.convertTreeToEden(operands[0]);
				var y = me.convertTreeToEden(operands[1]);
				return "{" + x + ", " + y + "}";
			}
		}
	};

	//Register the HTML view options
	edenUI.views["ET"] = {dialog: this.createDialog, title: "Expression Tree"};
	edenUI.eden.include("plugins/expression-tree/expression-tree.js-e", success);
};
/* Plugin meta information */
EdenUI.plugins.ET.title = "Expression Tree";
EdenUI.plugins.ET.description = "Editing definitions using an expression tree";
EdenUI.plugins.ET.author = "Meurig Beynon, Jonny Foss and Elizabeth Hudnott";
