Language.addKeywords( {
	"funkcia": "func",
	"procedúra": "proc",         
	"parametre": "para",     
	"lokálny": "local",  
	"ak": "if",
	"je": "is",
	"inak": "else",
	"vyhodnoť": "eval",  
	"pre": "for",
	"kým": "while",
	"rob": "do",
	"vyber": "switch",
	"vprípade": "case", 
	"predvolené": "default",  
	"preruš": "break",
	"pokračuj": "continue",
	"vráť": "return",
	"keď": "when",
	"zahrň": "include",
	"vlož": "insert",
	"pridajnakoniec": "append",
	"vymaž": "delete",
	"požaduje": "require",
	"po": "after",
	"presuň": "shift",
	"s" : "with",
	"akcia": "action",
	"import": "import"
});

Language.errors = [
/* EDEN_ERROR_UNKNOWN */ [
	"Vyskytla sa neznáma chyba"
],
/* EDEN_ERROR_EXPCLOSEBRACKET */ [
	"Zlý druh zátvorky, očakávaná ')'.",
	"Chýba uzatváracia ')' zátvorka na konci výroku.", 
	"Chýba uzatváracia zátvorka ')' alebo operátor."
],
/* EDEN_ERROR_BADFACTOR */ [
	"Zlý druh zátvorky, použi vo výraze '(' alebo '['.",
	"Chyba vo výraze? Neočakávaná uzatváracia zátvorka.",
	"Očakávaná hodnota alebo premenná",
	"Chýbajúci operand.",
	"Kľúčové slová nie su povolené vo výraze."
],
/* EDEN_ERROR_ACTIONCOLON */ [
	"Potrebná ':' pred zoznamom spúšťacích premenných",
	"Akcie vyžadujú zoznam premenných pre spustenie, očakávaná ':'",
	"Očakávaná ':'",
	"Potrebná ':' po názve akcie, nesmie byť rezervovaný výraz", 
],
/* EDEN_ERROR_ACTIONNOWATCH */ [
	"Rezervovaný výraz nemôže byť použitý ako názov premennej",     
	"Požiadaj o pomoc. Potrebuješ zoznam premenných",   
	"Musí byť minimálne jedna sledovaná premenná",
	"Výrazy nesmú byť použité ako sledované premenné,",
	"Primitívne premenné nemôžu byť sledované akciami",
	"Chýba prvá premenná pred čiarkou",
	"Nemožné sledovať zoznam primitívnych premenných."
],
/* EDEN_ERROR_ACTIONCOMMAS */ [
	"Buď príliš veľa ',' alebo chýba ", //watch observable
	"Názov premennej nesmie byť výraz",
	"Rezervovaný výraz '%R' nemôže byť použitý ako meno premennej",
	"Očakávaný názov premennej, ale namiesto toho dostal %T"
],
/* EDEN_ERROR_ACTIONOPEN */ [
	"Tu nie je možné zavolať funkciu.",
	"Môžeš sledovať len premenné, nie konkrétny index zoznamu",
	"Telo akcie musí tvoriť kód",
	"Chýba otváracia '{' na začiatku kódu akcie",
	"Použi ',' na oddelenie sledovaných premenných",
	"Očakávaná otváracia '{' na začiatku akcie",
	"Kód akcie musí začínať otváracou '{' zátvorkou"
],
/* EDEN_ERROR_ACTIONCLOSE */ [
	"Zlý druh zátvorky, pre zatvorenie akcie použi '}'",
	"Chýba uzatváracia '}' na konci kódu akcie"
],
/* EDEN_ERROR_LOCALNAME */ [
	"Rezervované výrazy nemôžu byť použité ako názvy lokálnych premenných",
	"Chýba názov po 'lokálny' declaration",
	"Po slove 'lokálny' musí nasledovať validný názov"
],
/* EDEN_ERROR_LOCALSEMICOLON */ [
	"Potrebná ';' po lokálnej deklarácií",
	"Tu nie je možné inicializovať lokálnu premennú"
],
/* EDEN_ERROR_WHENTYPE */ [
	"Mali ste na mysli 'pri zmene' alebo 'pri dotyku'?",
	"Potrebné poznať typ 'keď' podmienky (zmena, dotyk, podmienka)",
	"Zlý druh zátvorky, použi '(' pri 'keď' podmienke",
	"'keď' musí mať podmienku alebo spúšťacie premenné"
],
/* EDEN_ERROR_LISTINDEXEXP */ [
	"Index prvku v zozname musí byť platný",
	"Index prvku v zozname musí byť platný",
	"Index prvku v zozname musí byť platný"
],
/* EDEN_ERROR_LISTINDEXCLOSE */ [
	"Wrong kind of bracket, need a ']' to end the list index",
	"Missing a ']' to end the list index",
	"Missing a ']' to end the list index",
	"Neočakávaný názov premennej, zabudli ste ']'?"
],
/* EDEN_ERROR_LVALUE */ [
	"Musí byť názov premennej",
	"Očakávaný názov premennej, nemožno použiť rezervované výrazy ako názvy premenných",
	"Chýba premenná"
],
/* EDEN_ERROR_SEMICOLON */ [
	"Chýba ';'",
	"Nekompletné desatinné číslo",
	"Need another dot for a range, or a property name",
	"Chýba ';' na predchádzajúcom riadku?",
	"Chýba operátor alebo ';'",
	"Chýba otvárajúca zátvorka, alebo príliš veľa uzatváracích zátvoriek",
	"Očakávaná ';', nie zátvorka"
],
/* EDEN_ERROR_STATEMENT */ [
	"Kľúčové slovo nemôže byť použité ako názov premennej",
	"Chýba názov premennej",
	"Zlý druh zátvorky, povolená len '{'"
],
/* EDEN_ERROR_DEFINITION */ [
	"Musí byť 'je' alebo iný druh priradenia",
	"Musí byť 'je' alebo iný druh priradenia",
	"Musí byť 'je' alebo iný druh priradenia",
	"Zlý druh zátvorky, môže byť len '['"
],
/* EDEN_ERROR_FUNCCALLEND */ [
	"Chýba ')' po zavolaní funkcie",
	"Chýba ')' po zavolaní funkcie",
	"Chýba ')' po zavolaní funkcie",
	"Chýba ')' po zavolaní funkcie",
	"Zlý druh zátvorky, potrebná ')'"
],
/* EDEN_ERROR_LISTLITCLOSE */ [
	"Chýba ']' po primitívnej premennej zoznamu"
],
/* EDEN_ERROR_TERNIFCOLON */ [
	"Výraz 'ak' musí mať definovanú za dvojbodkou ':' inak vetvu"
],
/* EDEN_ERROR_IFCONDOPEN */ [
	"Podmienka pri 'ak' musí byť ohraničená '(' a ')'"
],
/* EDEN_ERROR_IFCONDCLOSE */ [
	"Chýba uzatváracia ')' po 'ak' podmienke"
],
/* EDEN_ERROR_PARAMNAME */ [
	"Rezervované výrazy nemôžu byť použité ako názvy parametrov",
	"'parametre' nemôžu byť použité ako názov premennej",
	"Neočakávaná zátvorka, očakávaný názov parametrov"
],
/* EDEN_ERROR_PARAMSEMICOLON */ [
	"Potrebná ';' po deklarácií parametrov",
	"Nie je možné inicializovať parametre",
	"Potrebná ';' po deklarácií parametrov",
	"Neočakávaná zátvorka, je potrebná ';'"
],
/* EDEN_ERROR_FUNCOPEN */ [
	"Tu nie je možné vykonať volanie funkcie",
	"Môžeš sledovať len premenné, nie konkrétny index zoznamu",
	"Telo akcie musí obsahovať kód",
	"Chýba otváracia '{' na začiatok kódu akcie",
	"Použi ',' na oddelenie sledovaných premenných",
	"Očakávaná otváracia '{' na začiatku akcie",
	"Kód akcie musí začínať s kučeravou '{' zátvorkou"
],
/* EDEN_ERROR_FUNCCLOSE */ [
	"Zlý druh zátvorky, použi '}' na ukončenie kódu akcie",
	"Chýba uzatváracia zátvorka '}'"
],
/* EDEN_ERROR_FUNCNAME */ [
	"'funkcia' potrebuje názov, ktorý nie je kľúčové slovo",
	"'funkcia' potrebuje názov",
	"'funkcia' potrebuje názov"
],
/* EDEN_ERROR_FOROPEN */ [
	"Chýba otváracia '(' v 'pre'"
],
/* EDEN_ERROR_FORCLOSE */ [
	"Chýba otváracia ')' po 'pre'"
],
/* EDEN_ERROR_FORSTART */ [
	"Chýba ';' po inicializovaní výrazu v 'pre'"
],
/* EDEN_ERROR_FORCOND */ [
	"Chýba ';' po 'pre' podmienke"
],
/* EDEN_ERROR_SUBSCRIBEOPEN */ [
	"Očakávaná '[' pre zoznam závislých premenných"
],
/* EDEN_ERROR_SUBSCRIBECLOSE */ [
	"Očakávaná ']' pre ukončenie zoznamu závislých premenných"
],
/* EDEN_ERROR_SWITCHOPEN */ [
	"Očakávaná '(' na začiatok 'vyber' výrazu"
],
/* EDEN_ERROR_SWITCHCLOSE */ [
	"Očakávaná ')' na koniec 'vyber' výrazu"
],
/* EDEN_ERROR_DEFAULTCOLON */ [
	"Po výraze 'predvolené' musí nasledovať ':'"
],
/* EDEN_ERROR_CASELITERAL */ [
	"Po výraze 'vprípade' nasleduje číslo alebo reťazec"
],
/* EDEN_ERROR_CASECOLON */ [
	"Výraz 'vprípade' musí končiť ':'"
],
/* EDEN_ERROR_INSERTCOMMA */ [
	"Operácia 'vlož' potrebuje 3 parametre"
],
/* EDEN_ERROR_DELETECOMMA */ [
	"Operácia 'vymaž' potrebuje 2 parametre"
],
/* EDEN_ERROR_APPENDCOMMA */ [
	"Operácia 'pridajnakoniec' potrebuje 2 parametre"
],
/* EDEN_ERROR_SCOPENAME */ [
	"Očakávané meno premennej pre blok"
],
/* EDEN_ERROR_SCOPEEQUALS */ [
	"Chýba 'je' v danom bloku"
],
/* EDEN_ERROR_SCOPECLOSE */ [
	"Chýba uzatváracia '}' po bloku"
],
/* EDEN_ERROR_BACKTICK */ [
	"Chýba uzatvárajúci `"
],
/* EDEN_ERROR_WHILEOPEN */ [
	"Cyklus 'kým' začína otváracou '('"
],
/* EDEN_ERROR_WHILECLOSE */ [
	"Chýba uzatváracia ')' po 'kým' podmienke"
],
/* EDEN_ERROR_WHILENOSTATEMENT */ [
	"'kým' cyklus musí obsahovať výrazy"
],
/* EDEN_ERROR_NEGNUMBER */ [
	"Očakávaná hodnota po znamienku mínus"
],
/* EDEN_ERROR_DEFINELISTIX */ [
	"Nemožno definovať konkrétne prvky zoznamu"
],
/* EDEN_ERROR_OUTOFBOUNDS */ [
	"Prvky zoznamu začínajú indexom 1"
],
/* EDEN_ERROR_PROPERTYNAME */ [
	"Neplatný názov"
],
/* EDEN_ERROR_WHILEOFDO */ [
	"Chýba 'kým' po 'rob' výrazoch"
],
/* EDEN_ERROR_PARAMNUMBER */ [
	"Použitie znaku '$' pre parametre vyžaduje číslo začínajúce 1"
],
/* EDEN_ERROR_FUNCCALL */ [
	"Nastal problém počas volania funkcie"
],
/* EDEN_ERROR_AFTEROPEN */ [
	"Chýba otváracia ( v 'po' výraze"
],
/* EDEN_ERROR_AFTERCLOSE */ [
	"Chýba uzatváracia ) v 'po' výraze"
],
/* EDEN_ERROR_ACTIONNAME */ [
	"Akcie potrebujú názov"
],
/* EDEN_ERROR_WHENOPEN */ [
	"Chýba '(' pred 'keď' výrazom"
],
/* EDEN_ERROR_WHENCLOSE */ [
	"Chýba ')' po 'keď' výraze"
],
/* EDEN_ERROR_DONAME */ [
	"'rob' požaduje názov funkcie"
],
/* EDEN_ERROR_PROCNAME */ [
	"Meno pri 'procedúra' nemôže obsahovať kľúčové slová",
	"Meno pri akcii 'procedúra' nemôže byť primitívna premenná",
	"Meno pri akcii 'procedúra' potrebuje meno",
	"Neočakávaná uzatváracia zátvorka",
	"'procedúra' potrebuje názov predtým než môže byť v zozname sledovaných",
	"'procedúra' potrebuje názov a zoznam sledovaných"
],
/* EDEN_ERROR_IMPORTPATH */ [
	"Nesprávna cesta importu, potrebné názvy a '/'"
],
/* EDEN_ERROR_IMPORTOPTION */ [
	"Táto možnosť pre import nie je validná"
],
/* EDEN_ERROR_IMPORTCOMB */ [
	"Kombinácia týchto možností nie je povolená"
],
/* EDEN_ERROR_IFNOSTATEMENT */ [
	"Chýba výraz po 'ak'"
],
/* EDEN_ERROR_AFTERNOSTATEMENT */ [
	"Chýba výraz po 'po'"
],
/* EDEN_ERROR_WHENNOSTATEMENT */ [
	"Chýba výraz po 'keď'"
],
/* EDEN_ERROR_LITCHAREMPTY */ [
	"Chýba znak medzi ' ' "
],
/* EDEN_ERROR_LITCHARCLOSE */ [
	"Chýba uzatvárajúca zátvorka po primitívnej premennej znaku"
],
/* EDEN_ERROR_LITSTRLINE */ [
	"Reťazce nemôžu byť oddelené viacerými riadkami"
],
/* EDEN_ERROR_LITSTRCLOSE */ [
	"Chýbajú úvodzovky na konci reťazca"
],
/* EDEN_ERROR_IMPORTTAG */ [
	"Kľúčové slovo importu je neplatné"
]
];

Language.ui = {
	"input_window": {
		title: "Prehľad súborov",
		description: "Umožňuje vytvárať, upravovať, interpretovať definované súbory a obnoviť ich históriu.",
		success: "Jupí!",
		is_undef_because: "nie je definované pretože",
		is_undef: "nie je definované",
		are_undef: "nie sú definované",
		uses: "používa",
		which_undef: "ktorý nie je definovaný",
		uses_undef: "používa nedefinované premenné",
		show_tabs: "Zobraz karty",
		show_controls: "Zobraz ovládanie",
		browse_agents: "Prehľadaj agentov",
		hide_agent: "Skry agenta",
		view_history: "Zobraz históriu",
		insert_temp: "Vlož šablónu",
		run: "Spusti (vynútene)",
		stop: "Zastav",
		clone: "Duplikuj",
		reload: "Znovu načítaj",
		upload: "Nahraj",
		hide: "Skry",
		inspect: "Preskúmaj",
		rewind: "Pretoč dozadu",
		undo: "Späť",
		redo: "Znovu",
		fast_forward: "Pretoč dopredu"
	},
	"canvas": {
		title: "Plátno"
	},
	"menu_bar": {
		title: "Menu",
		description: "Vytvára menu.",
		opt_confirm: "Potvrď zatvorenie prostredia",
		opt_simple_search: "Zjednodušené vyhľadávanie",
		opt_hide: "Skryť minimalizované okná",
		opt_collapse: "Zobraz/Skry okno dvojklikom na panel",
		opt_debug: "Ladenie JS-EDEN",
		main_views: "Nové okno",
		main_existing: "Existujúce okná",
		main_options: "Možnosti",
		comprehension: "Typ okna",
		making_defs: "Tvorba definícií",
		history: "História a stav",
		visualise: "Vizualizácia",
		management: "Správa",
		version: "Verzia",
		login: "Prihlásenie",
		notconnect: "Žiadne spojenie"
	},
	"search": {
		disjunction: "alebo"
	},
	"general": {
		error: "Chyba",
		loading: "Načítavam...",
		finished_loading: "JS-EDEN dokončil načítanie.",
		leaving: "Odchodom zo stránky stratíte aktuálny súbor. Vaša práca nebude uložená."
	}
}

