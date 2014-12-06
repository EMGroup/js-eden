function codegen(node) {
  return codegens[node.nodeType](node);
}

var codegens = {
  Decl: function (node) {
    return 'declDonald("_'+node.declName+'");\n'+
      'A_'+node.declName+' = "";\n'+
      'proc P_'+node.declName+' : _'+node.declName+', A_'+node.declName+' { drawPicture(); }';
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
  Num: function (node) {
    return node.val;
  }
};
