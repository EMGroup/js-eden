/* Jison generated parser */
var grammar = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"script":3,"statement-list-opt":4,"EOF":5,"statement-list":6,"statement":7,";":8,"expression":9,"lvalue":10,"NUMBER":11,"+":12,"-":13,"*":14,"/":15,"%":16,">":17,"<":18,">=":19,"<=":20,"==":21,"!=":22,"&&":23,"AND":24,"||":25,"OR":26,"OBSERVABLE":27,"[":28,"]":29,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:";",11:"NUMBER",12:"+",13:"-",14:"*",15:"/",16:"%",17:">",18:"<",19:">=",20:"<=",21:"==",22:"!=",23:"&&",24:"AND",25:"||",26:"OR",27:"OBSERVABLE",28:"[",29:"]"},
productions_: [0,[3,2],[4,1],[4,0],[6,1],[6,2],[7,1],[7,2],[9,1],[9,1],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[9,3],[10,1],[10,4]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 3: this.$ = []; 
break;
case 4: this.$ = $$[$0] ? [$$[$0]] : []; 
break;
case 5: this.$ = [$$[$0-1]].concat($$[$0]); 
break;
case 6: this.$ = undefined; 
break;
case 9: this.$ = yy.integerLiteral(parseInt($$[$0])); 
break;
case 10: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 11: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 12: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 13: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 14: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 15: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 16: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 17: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 18: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 19: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 20: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 21: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 22: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 23: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 24: this.$ = yy.infixExpression($$[$0-2], $$[$0-1], $$[$0]); 
break;
case 25: this.$ = yy.identifier($$[$0]); 
break;
case 26: this.$ = yy.arrayGet($$[$0-3], $$[$0-1]); 
break;
}
},
table: [{3:1,4:2,5:[2,3],6:3,7:4,8:[1,5],9:6,10:7,11:[1,8],27:[1,9]},{1:[3]},{5:[1,10]},{5:[2,2]},{5:[2,4],6:11,7:4,8:[1,5],9:6,10:7,11:[1,8],27:[1,9]},{5:[2,6],8:[2,6],11:[2,6],27:[2,6]},{8:[1,12],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[1,24],24:[1,25],25:[1,26],26:[1,27]},{8:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[2,8],17:[2,8],18:[2,8],19:[2,8],20:[2,8],21:[2,8],22:[2,8],23:[2,8],24:[2,8],25:[2,8],26:[2,8],28:[1,28],29:[2,8]},{8:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],17:[2,9],18:[2,9],19:[2,9],20:[2,9],21:[2,9],22:[2,9],23:[2,9],24:[2,9],25:[2,9],26:[2,9],29:[2,9]},{8:[2,25],12:[2,25],13:[2,25],14:[2,25],15:[2,25],16:[2,25],17:[2,25],18:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],28:[2,25],29:[2,25]},{1:[2,1]},{5:[2,5]},{5:[2,7],8:[2,7],11:[2,7],27:[2,7]},{9:29,10:7,11:[1,8],27:[1,9]},{9:30,10:7,11:[1,8],27:[1,9]},{9:31,10:7,11:[1,8],27:[1,9]},{9:32,10:7,11:[1,8],27:[1,9]},{9:33,10:7,11:[1,8],27:[1,9]},{9:34,10:7,11:[1,8],27:[1,9]},{9:35,10:7,11:[1,8],27:[1,9]},{9:36,10:7,11:[1,8],27:[1,9]},{9:37,10:7,11:[1,8],27:[1,9]},{9:38,10:7,11:[1,8],27:[1,9]},{9:39,10:7,11:[1,8],27:[1,9]},{9:40,10:7,11:[1,8],27:[1,9]},{9:41,10:7,11:[1,8],27:[1,9]},{9:42,10:7,11:[1,8],27:[1,9]},{9:43,10:7,11:[1,8],27:[1,9]},{9:44,10:7,11:[1,8],27:[1,9]},{8:[2,10],12:[2,10],13:[2,10],14:[1,15],15:[1,16],16:[1,17],17:[2,10],18:[2,10],19:[2,10],20:[2,10],21:[2,10],22:[2,10],23:[2,10],24:[2,10],25:[2,10],26:[2,10],29:[2,10]},{8:[2,11],12:[2,11],13:[2,11],14:[1,15],15:[1,16],16:[1,17],17:[2,11],18:[2,11],19:[2,11],20:[2,11],21:[2,11],22:[2,11],23:[2,11],24:[2,11],25:[2,11],26:[2,11],29:[2,11]},{8:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[1,17],17:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12],29:[2,12]},{8:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[1,17],17:[2,13],18:[2,13],19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[2,13],24:[2,13],25:[2,13],26:[2,13],29:[2,13]},{8:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[1,17],17:[2,14],18:[2,14],19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[2,14],24:[2,14],25:[2,14],26:[2,14],29:[2,14]},{8:[2,15],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[2,15],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15],24:[2,15],25:[2,15],26:[2,15],29:[2,15]},{8:[2,16],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[2,16],18:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[2,16],24:[2,16],25:[2,16],26:[2,16],29:[2,16]},{8:[2,17],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[2,17],18:[2,17],19:[2,17],20:[2,17],21:[2,17],22:[2,17],23:[2,17],24:[2,17],25:[2,17],26:[2,17],29:[2,17]},{8:[2,18],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[2,18],18:[2,18],19:[2,18],20:[2,18],21:[2,18],22:[2,18],23:[2,18],24:[2,18],25:[2,18],26:[2,18],29:[2,18]},{8:[2,19],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[2,19],24:[2,19],25:[2,19],26:[2,19],29:[2,19]},{8:[2,20],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[2,20],24:[2,20],25:[2,20],26:[2,20],29:[2,20]},{8:[2,21],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[2,21],24:[2,21],25:[2,21],26:[2,21],29:[2,21]},{8:[2,22],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[2,22],24:[2,22],25:[2,22],26:[2,22],29:[2,22]},{8:[2,23],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[1,24],24:[1,25],25:[2,23],26:[2,23],29:[2,23]},{8:[2,24],12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[1,24],24:[1,25],25:[2,24],26:[2,24],29:[2,24]},{12:[1,13],13:[1,14],14:[1,15],15:[1,16],16:[1,17],17:[1,18],18:[1,19],19:[1,20],20:[1,21],21:[1,22],22:[1,23],23:[1,24],24:[1,25],25:[1,26],26:[1,27],29:[1,45]},{8:[2,26],12:[2,26],13:[2,26],14:[2,26],15:[2,26],16:[2,26],17:[2,26],18:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],28:[2,26],29:[2,26]}],
defaultActions: {3:[2,2],10:[2,1],11:[2,5]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0: this.popState(); 
break;
case 1:
break;
case 2: this.begin('BLOCKCOMMENT'); 
break;
case 3: this.popState(); 
break;
case 4:
break;
case 5: this.begin('LINECOMMENT'); 
break;
case 6: this.begin('JS'); return "OPENJS"; 
break;
case 7: this.popState(); return 'ENDJS'; 
break;
case 8:return 'JSCODE'
break;
case 9:return 'STRINGCHARACTER'
break;
case 10: this.popState(); return '"'; 
break;
case 11:return 'STRINGCHARACTER'
break;
case 12: this.begin('D'); return '"'; 
break;
case 13:return 'STRINGCHARACTER'
break;
case 14: this.popState(); return "'"; 
break;
case 15:return 'STRINGCHARACTER'
break;
case 16: this.begin('QUOTE'); return "'"; 
break;
case 17:/* skip whitespace */
break;
case 18:return 'UNDEFINED'
break;
case 19:return 11
break;
case 20: /*yy.enterDefinition()*/; return 'IS'; 
break;
case 21:return 'DELETE'
break;
case 22:return 'INSERT'
break;
case 23:return 'APPEND'
break;
case 24:return 'SHIFT'
break;
case 25:return 'AFTER'
break;
case 26:return 'IF'
break;
case 27:return 'ELSE'
break;
case 28:return 'FOR'
break;
case 29:return 'WHILE'
break;
case 30:return 'DO'
break;
case 31:return 'SWITCH'
break;
case 32:return 'CASE'
break;
case 33:return 'DEFAULT'
break;
case 34:return 'BREAK'
break;
case 35:return 'CONTINUE'
break;
case 36:return 'RETURN'
break;
case 37: /*yy.paras.unshift({}); yy.locals.unshift({});*/ return 'FUNC'; 
break;
case 38: /*yy.paras.unshift({}); yy.locals.unshift({});*/ return 'PROC'; 
break;
case 39:return 'AUTO'
break;
case 40:return 'PARA'
break;
case 41:return 27
break;
case 42:return '?'
break;
case 43:return '//'
break;
case 44:return 20
break;
case 45:return 19
break;
case 46:return 18
break;
case 47:return 17
break;
case 48:return 21
break;
case 49:return 22
break;
case 50:return 24
break;
case 51:return 26
break;
case 52:return 25
break;
case 53:return 23
break;
case 54:return '!'
break;
case 55:return '='
break;
case 56:return '+='
break;
case 57:return '-='
break;
case 58:return '++'
break;
case 59:return '--'
break;
case 60:return '&'
break;
case 61:return 14
break;
case 62:return 15
break;
case 63:return 16
break;
case 64:return 13
break;
case 65:return 12
break;
case 66:return 8
break;
case 67:return '?'
break;
case 68:return ':'
break;
case 69:return ','
break;
case 70:return '~>'
break;
case 71:return 28
break;
case 72:return 29
break;
case 73:return '{'
break;
case 74:return '}'
break;
case 75:return '('
break;
case 76:return ')'
break;
case 77:return '.'
break;
case 78:return '`'
break;
case 79:return '$ARG'
break;
case 80:return '$ARGS'
break;
case 81:return '#'
break;
case 82:return 5
break;
case 83:return 'INVALID'
break;
}
};
lexer.rules = [/^(?:\*\/)/,/^(?:.)/,/^(?:\/\*)/,/^(?:[\n\r])/,/^(?:.)/,/^(?:##)/,/^(?:\$\{\{)/,/^(?:\}\}\$)/,/^(?:([\n\r]|.))/,/^(?:\\")/,/^(?:")/,/^(?:(.|\n))/,/^(?:")/,/^(?:\\.)/,/^(?:')/,/^(?:.)/,/^(?:')/,/^(?:\s+)/,/^(?:@)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:is\b)/,/^(?:delete\b)/,/^(?:insert\b)/,/^(?:append\b)/,/^(?:shift\b)/,/^(?:after\b)/,/^(?:if\b)/,/^(?:else\b)/,/^(?:for\b)/,/^(?:while\b)/,/^(?:do\b)/,/^(?:switch\b)/,/^(?:case\b)/,/^(?:default\b)/,/^(?:break\b)/,/^(?:continue\b)/,/^(?:return\b)/,/^(?:func\b)/,/^(?:proc\b)/,/^(?:auto\b)/,/^(?:para\b)/,/^(?:[a-zA-Z_][a-zA-Z_0-9]*)/,/^(?:\?)/,/^(?:\/\/)/,/^(?:<=)/,/^(?:>=)/,/^(?:<)/,/^(?:>)/,/^(?:==)/,/^(?:!=)/,/^(?:and\b)/,/^(?:or\b)/,/^(?:\|\|)/,/^(?:&&)/,/^(?:!)/,/^(?:=)/,/^(?:\+=)/,/^(?:-=)/,/^(?:\+\+)/,/^(?:--)/,/^(?:&)/,/^(?:\*)/,/^(?:\/)/,/^(?:%)/,/^(?:-)/,/^(?:\+)/,/^(?:;)/,/^(?:\?)/,/^(?::)/,/^(?:,)/,/^(?:~>)/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:\()/,/^(?:\))/,/^(?:\.)/,/^(?:`)/,/^(?:\$[0-9]+)/,/^(?:\$)/,/^(?:#)/,/^(?:$)/,/^(?:.)/];
lexer.conditions = {"BLOCKCOMMENT":{"rules":[0,1,2,5,6,12,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true},"LINECOMMENT":{"rules":[2,3,4,5,6,12,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true},"QUOTE":{"rules":[2,5,6,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true},"D":{"rules":[2,5,6,9,10,11,12,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true},"JS":{"rules":[2,5,6,7,8,12,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true},"INITIAL":{"rules":[2,5,6,12,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = grammar;
exports.Parser = grammar.Parser;
exports.parse = function () { return grammar.parse.apply(grammar, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}