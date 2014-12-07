function codegen(node) {
  return codegens[node.nodeType](node);
}

var codegens = {
  Decl: function (node) {
    return node.declNames.map(function (declName) {
      return 'declDonald("_'+declName+'");\n'+
        'A_'+declName+' = "";\n'+
        'proc P_'+declName+' : _'+declName+', A_'+declName+' { drawPicture(); }';
    }).join('\n');
  },
  Assign: function (node) {
    return '_'+node.lhs+' is '+codegen(node.rhs);
  },
  Ident: function (node) {
    return '_'+node.name;
  },
  Point: function (node) {
    return 'cart('+codegen(node.fst)+', '+codegen(node.snd)+')';
  },
  Line: function (node) {
    return 'line('+codegen(node.fst)+', '+codegen(node.snd)+')';
  },
  Arc: function (node) {
    return 'arc('+codegen(node.fst)+', '+codegen(node.snd)+', '+codegen(node.angle)+')';
  },
  Num: function (node) {
    return node.val;
  }
};
