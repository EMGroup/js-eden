function codegen(node) {
  return codegens[node.nodeType](node);
}

var codegens = {
  Decl: function (node) {
    return 'declPoint("'+node.declName+'"); proc P_'+node.declName+' : '+node.declName+' { drawPicture(); }';
  },
  Assign: function (node) {
    return node.lhs+' = '+codegen(node.rhs);
  },
  Ident: function (node) {
    return node.name;
  },
  Point: function (node) {
    return "['C', "+codegen(node.fst)+', '+codegen(node.snd)+']';
  },
  Num: function (node) {
    return node.val;
  }
};
