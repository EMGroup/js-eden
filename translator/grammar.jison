/*
 * Translates a set of EDEN statements into JavaScript
 */

/*
 * lexical grammar
 */
%lex

%s JS
%s D
%s QUOTE
%s LINECOMMENT
%s BLOCKCOMMENT
%%

<BLOCKCOMMENT>"*/"    { this.popState(); }
<BLOCKCOMMENT>.       {}
"/*"                  { this.begin('BLOCKCOMMENT'); }


<LINECOMMENT>[\n\r]   { this.popState(); }
<LINECOMMENT>.        {}
"##"                  { this.begin('LINECOMMENT'); }

"${{"                 { this.begin('JS'); return "OPENJS"; }
<JS>"}}$"             { this.popState(); return 'ENDJS'; }
<JS>([\n\r]|.)        return 'JSCODE'

<D>"\\\""             return 'STRINGCHARACTER'
<D>'"'                { this.popState(); return '"'; }
<D>(.|\n)             return 'STRINGCHARACTER'
"\""                  { this.begin('D'); return '"'; }

<QUOTE>"\\".         return 'STRINGCHARACTER'
<QUOTE>"'"            { this.popState(); return "'"; }
<QUOTE>.              return 'STRINGCHARACTER'
"'"                   { this.begin('QUOTE'); return "'"; }

\s+                   /* skip whitespace */
"@"                   return 'UNDEFINED'
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"is"                  { yy.enterDefinition(); return 'IS'; }
"include"             return 'INCLUDE'
"require"             return 'REQUIRE'
"delete"              return 'DELETE'
"insert"              return 'INSERT'
"append"              return 'APPEND'
"shift"               return 'SHIFT'
"after"               return 'AFTER'
"if"                  return 'IF'
"else"                return 'ELSE'
"for"                 return 'FOR'
"while"               return 'WHILE'
"do"                  return 'DO'
"switch"              return 'SWITCH'
"case"                return 'CASE'
"default"             return 'DEFAULT'
"break"               return 'BREAK'
"continue"            return 'CONTINUE'
"return"              return 'RETURN'
"func"                %{ yy.paras.unshift({}); yy.locals.unshift({}); return 'FUNC'; %}
"proc"                %{ yy.paras.unshift({}); yy.locals.unshift({}); return 'PROC'; %}
"auto"                return 'AUTO'
"para"                return 'PARA'
[a-zA-Z_][a-zA-Z_0-9]* return 'OBSERVABLE'

"?"                   return '?'

"//"                  return '//'

"<="                  return '<='
">="                  return '>='
"<"                   return '<'
">"                   return '>'
"=="                  return '=='
"!="                  return '!='

"and"                 return 'AND'
"or"                  return 'OR'
"||"                  return '||'
"&&"                  return '&&'
"!"                   return '!'

"="                   return '='
"+="                  return '+='
"-="                  return '-='
"++"                  return '++'
"--"                  return '--'

"&"                   return '&'
"*"                   return '*'
"/"                   return '/'
"%"                   return '%'

"-"                   return '-'
"+"                   return '+'

";"                   return ';'

"?"                   return '?'
":"                   return ':'
","                   return ','

"~>"                  return '~>'
"["                   return '['
"]"                   return ']'

"{"                   return '{'
"}"                   return '}'
"("                   return '('
")"                   return ')'

"."                   return '.'
"`"                   return '`'

"$"[0-9]+             return '$ARG'
"$"                   return '$ARGS'

"#"                   return '#'

<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/*
 * operator associations and precedence
 */

%right '=' '+=' '-='
%left '||' OR
%left '&&' AND
%right '==' '!='
%left '>' '<' '>=' '<='
%left '+' '-'
%left '*' '/'
%right '%'
%left UMINUS
%right '?'
%left '!'
%nonassoc DEREFERENCE LENGTH

%start script

%%

/*
 * language grammar
 */

script
    : statement-list-opt EOF { return '(function (includePrefix, done) { (function(context, rt) { ' + yy.printObservableDeclarations() + yy.withIncludes($1, 'done') + ' })(root, rt); })'; }
    ;

lvalue
    : OBSERVABLE
    %{
    if (yy.paras.length !== 0 && yy.paras[0][$1] !== undefined) {
        $$ = "args.get(" + yy.paras[0][$1] + ")";
    } else if (yy.locals.length !== 0 && yy.locals[0][$1] !== undefined) {
        $$ = "local_" + $1;
    } else {
        if (yy.inDefinition()) yy.addDependency($1);
        $$ = yy.observable($1);
    }
    %}
    | '$ARGS'
        { $$ = "args"; }
    | '$ARG'
        { var n = Number($1.slice(1)); $$ = "args.get(" + (n - 1) + ")"; }
    | lvalue '[' expression ']'
        { $$ = $1 + '.get(' + $3 + ' - 1)' }
    | lvalue '.' OBSERVABLE
        { $$ = $1 + '.get("' + $3 + '")' }
    | '(' lvalue ')'
        { $$ = $2; }
    | '`' expression '`'
        { $$ = 'context.lookup(' + $expression + ')'; }

// XXX: this introduces some shift reduce conflicts apparently, but not sure what the conflict output means
// so not sure where to look for problems
    | '*' primary-expression %prec DEREFERENCE
        { $$ = $2; }
    ;

statement-list-opt
    : statement-list
    |
        { $$ = ""; }
    ;

expression
    : literal
    | '(' expression ')'
        { $$ = $1 + $2 + $3; }
    | primary-expression
    | '-' expression %prec UMINUS
        { $$ = '-' + $2; }

// XXX: currently unsure what the precedence for not needs to be
    | '!' expression
        { $$ = '!' + $2; }

    | '&' lvalue
        { $$ = $2; }

// XXX: Lots of SR conflicts :(
// no idea if any of the resolutions behave in a way that would bother us though...
    | expression '#' %prec LENGTH
        { $$ = 'rt.length('+$1+')'; }

    //
    // binary operators
    //
    | expression '+' expression
        { $$ = '' + $1 + ' + ' + $3; }
    | expression '-' expression
        { $$ = '' + $1 + ' - ' + $3; }

    | expression '*' expression
        { $$ = '' + $1 + ' * ' + $3; }
    | expression '/' expression
        { $$ = '' + $1 + ' / ' + $3; }
    | expression '%' expression
        { $$ = '' + $1 + ' % ' + $3; }

    | expression '>' expression
        { $$ = '' + $1 + ' > ' + $3; }
    | expression '<' expression
        { $$ = '' + $1 + ' < ' + $3; }

    | expression '>=' expression
        { $$ = '' + $1 + ' >= ' + $3; }
    | expression '<=' expression
        { $$ = '' + $1 + ' <= ' + $3; }
    | expression '==' expression
        { $$ = '' + $1 + ' == ' + $3; }
    | expression '!=' expression
        { $$ = '' + $1 + ' != ' + $3; }

    | expression '&&' expression
        { $$ = '' + $1 + ' && ' + $3; }
    | expression AND expression
        { $$ = '' + $1 + ' && ' + $3; }

    | expression '||' expression
        { $$ = '' + $1 + ' || ' + $3; }
    | expression OR expression
        { $$ = '' + $1 + ' || ' + $3; }

    | '{' expression ',' expression '}'
        { $$ = "context.lookup('Point').value().call(this, " + $2 +"," + $4 +")" }

// XXX: introduces a TON of SR conflicts and I have no idea why!
    | expression '//' expression
        { $$ = $1 + '.concat(' + $3 +')'; }

    //
    // assignment operators
    //
    | lvalue '=' expression
        { $$ = $lvalue + '.assign(' + $expression + ', this).value()'; }
    | lvalue '+=' expression
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() + ' + $expression + ', this).value()'; }
    | lvalue '-=' expression
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() - ' + $expression + ', this).value()'; }
    | '++' lvalue
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() + 1, this).value()'; }
    | lvalue '++'
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() + 1, this).value() - 1'; }
    | '--' lvalue
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() - 1, this).value()'; }
    | lvalue '--'
        { $$ = $lvalue + '.assign(' + $lvalue + '.value() - 1, this).value() + 1'; }

    //
    // ternary operator
    //
    | expression '?' expression ':' expression
        { $$ = $expression1 + ' ? ' + $expression2 + ' : ' + $expression3; }
    | OPENJS javascript ENDJS
        { $$ = $2; }
    ;

javascript
    : JSCODE
    | JSCODE javascript
         { $$ = $1 + $2; }
    ;

literal
    : NUMBER
    | UNDEFINED
        { $$ = 'undefined'; }
    | list-literal
    | object-literal
    | string-literal
    | char-literal
    ;

char-literal
    : "'" STRINGCHARACTER "'"
        { $$ = '"' + $2 + '"'; }
    ;

string-literal
    : '"' string-contents-opt '"'
        { $$ = '"' + $2 + '"'; }
    ;

string-contents-opt
    : string-contents
    |
        { $$ = ""; }
    ;

string-contents
    : STRINGCHARACTER
        { $$ = $1 !== '\n' ? $1 : '\\n'; }
    | STRINGCHARACTER string-contents
        { $$ = ($1 !== '\n' ? $1 : '\\n') + $2; }
    ;

list-literal
    : '[' expression-list-opt ']'
        { $$ = '[' + $2 + ']'; }
    ;

object-literal
    : '{' pair-list-opt '}'
        { $$ = '{' + $2 + '}'; }
    ;

pair-list-opt
    : pair-list
    |
        { $$ = ""; }
    ;

pair-list
    : pair
    | pair ',' pair-list
        { $$ = $1 + ', ' + $3; }
    ;

pair
    : OBSERVABLE ':' expression
        { $$ = $1 + ': ' + $3; }
    ;

primary-expression
    : lvalue
        { $$ = $lvalue + '.value()'; }
    | lvalue '.' OBSERVABLE '(' expression-list-opt ')'
        { $$ = $lvalue + '.value().' + $3 + '(' + $5 + ')'; }
    | primary-expression '(' expression-list-opt ')'
        { $$ = '' + $1 + '.call('+ ['this'].concat($3) + ')'; }
    ;

statement
    : expression ';'
        { $$ = $1 + ';'; }
    | function-definition
    | formula-definition
    | action-specification
    | dependency-link
    | query-command
    | compound-statement
    | AFTER '(' expression ')' statement
        { $$ = 'setTimeout(function() ' + $statement + ', ' + $expression + ');' }
    | IF '(' expression ')' statement else-opt
        { $$ = 'if (' + $expression + ') ' + $statement + $6; }
    | WHILE '(' expression ')' statement
        { $$ = 'while (' + $expression + ') ' + $statement; }
    | DO statement WHILE '(' expression ')' ';'
        { $$ = 'do ' + $statement + ' while (' + $expression + ');'; }
    | FOR '(' expression-opt ';' expression-opt ';' expression-opt ')' statement
        { $$ = 'for (' + $3 + '; ' + $5 + '; ' + $7 + ') ' + $statement; }
    | SWITCH '(' expression ')' statement
        { $$ = 'switch (' + $expression + ') ' + $statement; }
    | BREAK ';'
        { $$ = 'break;'; }
    | CONTINUE ';'
        { $$ = 'continue;'; }
    | RETURN ';'
        { $$ = 'return;'; }
    | RETURN expression ';'
        { $$ = 'return ' + $expression + ';'; }
    | INCLUDE expression ';'
        { $$ = yy.async('eden.include', $expression, 'includePrefix'); }
    | REQUIRE expression ';'
        { $$ = yy.async('edenUI.loadPlugin', $expression); }
    | INSERT lvalue ',' expression ',' expression ';'
        { $$ = $lvalue + '.mutate(function(s) { s.cached_value.splice(' + $expression1 + ', 0, ' + $expression2 + '); });'; }
    | DELETE lvalue ',' expression ';'
        { $$ = $lvalue + '.mutate(function(s) { s.cached_value.splice(' + $expression1 + ', 1); });' }
    | APPEND lvalue ',' expression ';'
        { $$ = $lvalue + '.mutate(function(s) { s.cached_value.push(' + $expression1 + '); });' }
    | SHIFT lvalue ';'
        { $$ = $lvalue + '.mutate(function(s) { s.cached_value.shift(); });' }
    | CASE literal ':' statement
        { $$ = 'case ' + $literal + ': ' + $statement; }
    | DEFAULT ':' statement
        { $$ = 'default: ' + $statement; }
    | ';'
    ;

else-opt
    : ELSE statement
        { $$ = ' else ' + $statement; }
    |
        { $$ = ''; }
    ;

expression-opt
    : expression
    |
        { $$ = ""; }
    ;

expression-list
    : expression
        { $$ = [$1]; }
    | expression ',' expression-list
        { $3.unshift($1); $$ = $3; }
    ;

expression-list-opt
    : expression-list
    |
        { $$ = []; }
    ;

query-command
    : '?' lvalue ';'
        { $$ = "console.log(" + $lvalue + ")" }
    ;

function-definition
    : function-declarator function-body
        {
        var eden_definition = JSON.stringify(yy.extractEdenDefinition(@1.first_line, @1.first_column, @2.last_line, @2.last_column));
        yy.paras.pop();
        yy.locals.pop();
        $$ = "context.lookup('" + $1 + "').define(function(context) { return " + $2 + "}).eden_definition = " + eden_definition + ";"; }
    ;

function-declarator
    : FUNC OBSERVABLE
        { $$ = $2; }
    | PROC OBSERVABLE
        { $$ = $2; }
    ;

identifier-list-opt
    : identifier-list
    |
        { $$ = ""; }
    ;

local-var-decl
    : AUTO identifier-list-opt ';'
        { var declarations = yy.map($2, function(id) { yy.locals[0][id] = 1; return "var local_" + id + " = new Symbol();"; }).join(" "); $$ = declarations;}
    ;

local-var-decl-opt
    : local-var-decl
    |
        { $$ = ""; }
    ;

para-alias-opt
    : para-alias
    |
        { $$ = ""; }
    ;

para-alias
    : PARA identifier-list ';'
        { yy.map($2, function(id,i) { yy.paras[0][id] = i; }); $$ = ""; }
    ;

function-body
    : '{' para-alias-opt local-var-decl-opt statement-list-opt '}'
        { $$ = 'function() { var args = new Symbol().assign(Array.prototype.slice.call(arguments)); ' + $2 + ' ' + $3 + ' ' + $4 + '}'; }
    ;



action-specification
    : function-declarator dependency-list function-body
        {
        var eden_definition = JSON.stringify(yy.extractEdenDefinition(@1.first_line, @1.first_column, @3.last_line, @3.last_column));
        yy.paras.pop();
        yy.locals.pop();
        $$ = "context.lookup('" + $1 + "').define(function(context) { return " + $3 + "; }).observe(" + JSON.stringify($2) + ").eden_definition = " + eden_definition + ";";
        }
    ;

dependency-list
    : ':' identifier-list
        { $$ = $2; }
    ;

identifier-list
    : OBSERVABLE
        { $$ = [$1]; }
    | OBSERVABLE ',' identifier-list
        { $3.unshift($1); $$ = $3; }
    ;

dependency-link
    : OBSERVABLE '~>' '[' identifier-list ']' ';'
        { $$ = "ERROR; context.lookup('" + $1 + "').subscribe(" + JSON.stringify($4) + ");"; }
    ;

compound-statement
    : '{' statement-list-opt '}'
        { $$ = '{ ' + $2 + ' }'; }
    ;

statement-list
    : statement
    | statement statement-list
        { $$ = $1 + ' ' + $2; }
    ;

formula-definition
    : OBSERVABLE IS expression ';'
        %{
        var eden_definition = JSON.stringify(
          yy.extractEdenDefinition(
            @1.first_line,
            @1.first_column,
            @3.last_line,
            @3.last_column
          )
        );

        yy.leaveDefinition();
        $$ = "(" +
               yy.observable($1) +
                 ".eden_definition = " + eden_definition + ", " +

               yy.observable($1) +
                 ".define(function(context) { return " + $3 + "; })" +

               ".subscribe(" + JSON.stringify(yy.getDependencies()) + ")" +
             ");"
        %}
    ;
	
	
