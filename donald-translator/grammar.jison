/*
 * Translates a set of EDEN statements into JavaScript
 */

/*
 * lexical grammar
 */
%lex

%s LINECOMMENT
%%

<LINECOMMENT>[\n\r]    { this.popState(); }
<LINECOMMENT>.         {}
"##"                   { this.begin('LINECOMMENT'); }

[\n\r]                 return 'NEWLINE'
\s+                    /* skip other whitespace */
"point"                return 'POINT'
"line"                 return 'LINE'
"="                    return '='
"{"                    return '{'
"}"                    return '}'
"["                    return '['
"]"                    return ']'
","                    return ','
[0-9]+                 return 'NUMBER'
[a-zA-Z_][a-zA-Z_0-9]* return 'IDENTIFIER'

<<EOF>>                return 'EOF'
.                      return 'INVALID'

/lex

%start script

%%

script
    : statement-list-opt EOF
        { return JSON.stringify($1); }
    ;

statement-list-opt
    : statement-list
    |
        { $$ = []; }
    ;

statement-list
    : statement
        { $$ = [$1]; }
    | statement NEWLINE statement-list
        { $$ = [$1].concat($3); }
    ;

statement
    : decl IDENTIFIER
        { $$ = {nodeType: 'Decl', declType: $1, declName: $2}; }
    | IDENTIFIER '=' expression
        { $$ = {nodeType: 'Assign', lhs: $1, rhs: $3}; }
    ;

decl
    : POINT
    | LINE
    ;

expression
    : '{' expression ',' expression '}'
        { $$ = {nodeType: 'Point', fst: $2, snd: $4}; }
    | '[' expression ',' expression ']'
        { $$ = {nodeType: 'Line', fst: $2, snd: $4}; }
    | IDENTIFIER
        { $$ = {nodeType: 'Ident', name: $1}; }
    | NUMBER
        { $$ = {nodeType: 'Num', val: $1}; }
    ;
