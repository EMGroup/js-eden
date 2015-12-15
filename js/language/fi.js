Language.addKeywords( {
	"funktio": "func",
	"aliohjelma": "proc",
	"parametri": "para",
	"paikallinen": "local",
	"jos": "if",
	"on": "is",
	"muuten": "else",
	"suorita": "eval",
	"toista": "for",
	"kunnes": "while",
	"tee": "do",
	"vaihda": "switch",
	"vaihtoehto": "case",
	"oletus": "default",
	"keskeytä": "break",
	"jatka": "continue",
	"palauta": "return",
	"kun": "when",
	"sisällytä": "include",
	"aseta": "insert",
	"lisää": "append",
	"poista": "delete",
	"vaadi": "require",
	"tauko": "after",
	"ota": "shift",
	"arvolla" : "with",
	"toiminto": "action",
	"tuo": "import"
});

Language.errors = [
/* EDEN_ERROR_UNKNOWN */ [
	"Tapahtui tuntematon virhe"
],
/* EDEN_ERROR_EXPCLOSEBRACKET */ [
	"Väärä sulkumerkki, pitäisi olla ')'",
	"')' puuttuu lopusta",
	"')' tai operaattori puuttuu"
],
/* EDEN_ERROR_BADFACTOR */ [
	"Vääränlainen sulkumerkki. Käytä '(' tai '['",
	"Puuttuuko lauseke? Löydetty odottamaton sulkumerkki",
	"Odotettiin arvoa tai Tarkkailtavaa",
	"Operandi puuttuu.",
	"Varattuja sanoja ei pysty käyttämään lausekkeessa"
],
/* EDEN_ERROR_ACTIONCOLON */ [
	"Tarvitaan ':'-merkki ennen kuin listataan triggeri-Tarkkailtavat",
	"Toiminnot tarvitsevat listan Tarkkailtavista, odotettiin ':'-merkkiä",
	"Odotettiin ':'-merkkiä",
	"Toiminnon perään odotetaan ':'-merkkiä. Ei varattua sanaa."
],
/* EDEN_ERROR_ACTIONNOWATCH */ [
	"Varattu sana ei voi toimia Tarkkailtavan nimenä.",
	"Hmm. Pyydä apua, tarvitaan lista Tarkkailtavista",
	"Tässä yhteydessä tulee olla vähintään yksi Tarkkailtava",
	"Tässä yhteydessä ei voi käyttää lausekkeita",
	"Arvoja ei voi käyttää 'kun'-lausekkeessa",
	"Ensimmäinen Tarkkailtava puuttuu ennen ','-merkkiä",
	"Listan arvoja ei voi tarkkailla"
],
/* EDEN_ERROR_ACTIONCOMMAS */ [
	"Joko liian monta ','-merkkiä",
	"Täytyy antaa Tarkkailtavan nimi, ei lauseketta",
	"Varattua sanaa '%R' ei voi käyttää Tarkkailtavan nimenä",
	"Odotettiin Tarkkailtavan nimeä, löydettiin kuitenkin %T"
],
/* EDEN_ERROR_ACTIONOPEN */ [
	"Funktiokutsua ei voi käyttää tässä yhteydessä.",
	"Listan indeksiä ei voi käyttää tässä yhteydessä",
	"Toiminnon rungon tulee sisältää lausekkeita",
	"'{'-merkkiä odotettiin aloittamaan toiminnon runko",
	"Käytä ','-merkkiä aloittamaan toiminnon runko",
	"Odotettiin '{'-merkkiä aloittamaan toiminnon runko",
	"Toiminnon runko aloitetaan '{'-merkillä"
],
/* EDEN_ERROR_ACTIONCLOSE */ [
	"Vääränlainen sulku sulkemaan toiminnon runko, käytä '}'-merkkiä",
	"'}'-merkki puuttuu sulkemaan toiminnon runko"
],
/* EDEN_ERROR_LOCALNAME */ [
	"Varatut sanat eivät voi toimia paikallisten muuttujien niminä",
	"'paikallinen'-sanan jälkeen tulee käyttää muuttujan nimeä",
	"'paikallinen'-sanan jälkeen tulee käyttää sopivaa muuttujan nimeä"
],
/* EDEN_ERROR_LOCALSEMICOLON */ [
	"Lauseke tulee lopettaa merkkiin ';' käytettäessä 'paikallinen'-julistusta",
	"Tässä yhteydessä ei ole mahdollista käyttää 'paikallinen'-sanaa"
],
/* EDEN_ERROR_WHENTYPE */ [
	"Tarkoititko kirjoittaa 'kun'?",
	"Sinun tulee määritellä 'kun'-lauseke",
	"Vääränlaiset sulut. Käytä '('-sulkua 'kun'-sanan yhteydessä olevassa ehtolauseessa",
	"'kun'-sanan jälkeen tulee antaa triggeri-Tarkkailtava tai ehtolause"
],
/* EDEN_ERROR_LISTINDEXEXP */ [
	"Listan indeksin tulee olla oikeanlainen lauseke",
	"Listan indeksin tulee olla oikeanlainen lauseke",
	"Listan indeksin tulee olla oikeanlainen lauseke"
],
/* EDEN_ERROR_LISTINDEXCLOSE */ [
	"Vääränlainen sulku. Listan indeksin jälkeen tulee käyttää ']'-sulkua.",
	"']'-sulku puuttuu sulkemaan listan indeksi",
	"']'-sulku puuttuu sulkemaan listan indeksi",
	"Odottamaton Tarkkailtavan nimi. Unohditko käyttää ']'-sulkua?"
],
/* EDEN_ERROR_LVALUE */ [
	"Odotettiin Tarkkailtavan nimeä",
	"Odotettiin Tarkkailtavan nimeä. Et voi käyttää varattuja sanoja tässä yhteydessä",
	"Tarkkailtava puuttuu?"
],
/* EDEN_ERROR_SEMICOLON */ [
	"';' puuttuu",
	"Keskeneräinen desimaaliluku",
	"Tarvitaan toinen piste, kun määritellään arvoalue",
	"Puuttuuko edelliseltä riviltä ';'?",
	"Joko operaattori tai ';' puuttuu",
	"Puuttuu aloittava sulku, tai sinulla on liikaa lopettavia sulkuja",
	"Odotettiin ';', ei sulkua."
],
/* EDEN_ERROR_STATEMENT */ [
	"Varattua sanaa ei voi käyttää Tarkkailtavan nimenä",
	"Tarkkailtavan nimi puuttuu",
	"Vääränlainen sulku, vain '{'-sulkua voi käyttää tässä kontekstissa."
],
/* EDEN_ERROR_DEFINITION */ [
	"Täytyy käyttää 'on' tai arvon asetusta",
	"Täytyy käyttää 'on' tai arvon asetusta",
	"Täytyy käyttää 'on' tai arvon asetusta",
	"Vääränlainen sulkumerkki, vain '['-sulku kelpaa tässä yhteydesssä."
],
/* EDEN_ERROR_FUNCCALLEND */ [
	"')'-sulku puuttuu funktiokutsusta",
	"')'-sulku puuttuu funktiokutsusta",
	"')'-sulku puuttuu funktiokutsusta",
	"')'-sulku puuttuu funktiokutsusta",
	"Vääränlainen sulku, vain ')'-sulku kelpaa tässä yhteydessä"
],
/* EDEN_ERROR_LISTLITCLOSE */ [
	"']'-sulku puuttuu listan määrittelystä"
],
/* EDEN_ERROR_TERNIFCOLON */ [
	"Lausekkeesta löydettiin 'jos'-sana, tulee käyttää myös 'muuten'-sanaa tai ':'-merkkiä"
],
/* EDEN_ERROR_IFCONDOPEN */ [
	"'jos'-ehdossa tulee käyttää sulkuja '(' ja ')'"
],
/* EDEN_ERROR_IFCONDCLOSE */ [
	"Ehtolausekkeesta puuttuu ')'-sulku"
],
/* EDEN_ERROR_PARAMNAME */ [
	"Varattuja sanoja ei voi käyttää parametrien niminä",
	"'parameteri' ei voi olla Tarkkailtavan nimenä",
	"Odottamaton sulku, odotettiin parameteria"
],
/* EDEN_ERROR_PARAMSEMICOLON */ [
	"Parameterin julistamisen jälkeen tulee käyttää ';'-merkkiä",
	"Ei ole mahdollista alustaa alustaa parametria",
	"Parameterin julistamisen jälkeen tulee käyttää ';'-merkkiä",
	"Odottamaton sulku, odotettiin ';'-merkkiä"
],
/* EDEN_ERROR_FUNCOPEN */ [
	"Tässä yhteydessä ei ole mahdollista kutsua funktiota",
	"Ei ole mahdollista käyttää listan indeksiä tässä yhteydessä",
	"Toiminnon rungon tulee sisältää lausekkeita",
	"Aloittava sulku { puuttuu aloittamaan toiminnon runko",
	"Käytä ','-merkkiä erottelemaan Tarkkailtavat",
	"Odotettiin aloittavaa sulkua { aloittamaan toiminnon runko",
	"Toiminnon runko tulee aloittaa sululla {"
],
/* EDEN_ERROR_FUNCCLOSE */ [
	"Vääränlainen sulku, käytä '}'-sulkua lopettamaan toiminnon runko",
	"'}'-sulku puuttuu"
],
/* EDEN_ERROR_FUNCNAME */ [
	"Funktion nimi ei voi olla varattu sana",
	"Funktio tarvitsee nimen",
	"Funktio tarvitsee nimen"
],
/* EDEN_ERROR_FOROPEN */ [
	"'toista'-rakenne tarvitsee aloittavan sulun '('"
],
/* EDEN_ERROR_FORCLOSE */ [
	"'toista'-rakenne tarvitsee lopettavan sulun ')'"
],
/* EDEN_ERROR_FORSTART */ [
	"';' puuttuu lopettamaan alustamisen 'toista'-rakenteessa"
],
/* EDEN_ERROR_FORCOND */ [
	"';' puuttuu lopettamaan ehdon 'toista'-rakenteessa"
],
/* EDEN_ERROR_SUBSCRIBEOPEN */ [
	"Odotettiin '['-sulkua"
],
/* EDEN_ERROR_SUBSCRIBECLOSE */ [
	"Odotettiin ']'-sulkua sulkemaan lista"
],
/* EDEN_ERROR_SWITCHOPEN */ [
	"Odotettiin '('-sulkua aloittamaan 'vaihda'-rakenne"
],
/* EDEN_ERROR_SWITCHCLOSE */ [
	"Odotettiin ')'-sulkua lopettamaan 'vaihda'-rakenne"
],
/* EDEN_ERROR_DEFAULTCOLON */ [
	"'oletus'-sanan jälkeen tulee käyttää ':'-merkkiä"
],
/* EDEN_ERROR_CASELITERAL */ [
	"'tapaus'-sanaa tulee seurata luku tai merkkijono"
],
/* EDEN_ERROR_CASECOLON */ [
	"'tapaus'-lausekkeen tulee loppua ':'-merkkiin"
],
/* EDEN_ERROR_INSERTCOMMA */ [
	"'aseta'-operaatio tarvitsee 3 osaa"
],
/* EDEN_ERROR_DELETECOMMA */ [
	"'poista'-operaatio tarvitsee 2 osaa"
],
/* EDEN_ERROR_APPENDCOMMA */ [
	"'lisää'-operaatio tarvitsee 2 osaa"
],
/* EDEN_ERROR_SCOPENAME */ [
	"odotettiin Tarkkailtavan nimeä Tarkkailtavan ominaisuuden ylikirjottamisessa"
],
/* EDEN_ERROR_SCOPEEQUALS */ [
	"'on'-sana puuttuu Tarkkailtavan ominaisuutta ylikirjoitettaessa"
],
/* EDEN_ERROR_SCOPECLOSE */ [
	"Tarkkailtavan ominaisuuden näkyvyysalue lopetetaan '}'-sululla"
],
/* EDEN_ERROR_BACKTICK */ [
	"Sulkeva heittomerkki puuttuu"
],
/* EDEN_ERROR_WHILEOPEN */ [
	"'kunnes'-silmukan ehtorakenne aloitetaan '('-sululla"
],
/* EDEN_ERROR_WHILECLOSE */ [
	"'kunnes'-silmukan ehtorakenne lopetetaan ')'-sululla"
],
/* EDEN_ERROR_WHILENOSTATEMENT */ [
	"'kunnes'-silmukoissa tulee olla lausekkeita"
],
/* EDEN_ERROR_NEGNUMBER */ [
	"Miinusmerkin jälkeen tulee olla numero"
],
/* EDEN_ERROR_DEFINELISTIX */ [
	"Listan alkioita ei voi määritellä yksitellen"
],
/* EDEN_ERROR_OUTOFBOUNDS */ [
	"Listan alkiot alkavat numerosta 1"
],
/* EDEN_ERROR_PROPERTYNAME */ [
	"Vääränlainen ominaisuuden nimi"
],
/* EDEN_ERROR_WHILEOFDO */ [
	"'tee'-sanan jälkeen tulee olla 'kunnes'-sana"
],
/* EDEN_ERROR_PARAMNUMBER */ [
	"Kun käytät '$'-merkkiä parametreissa, tulee käyttää numeroa, joka alkaa 1:stä"
],
/* EDEN_ERROR_FUNCCALL */ [
	"Ongelmia suoritettaessa funktiokutsua"
],
/* EDEN_ERROR_AFTEROPEN */ [
	"'('-sulku puuttuu 'tauko'-sanan jälkeen"
],
/* EDEN_ERROR_AFTERCLOSE */ [
	"'tauko'-lauseke päättyy ')'-sulkuun"
],
/* EDEN_ERROR_ACTIONNAME */ [
	"Toiminnot tarvitsevat nimen"
],
/* EDEN_ERROR_WHENOPEN */ [
	"'kun'-lauseke alkaa '('-merkillä"
],
/* EDEN_ERROR_WHENCLOSE */ [
	"'kun'-lauseke päättyy ')'-merkkiin"
],
/* EDEN_ERROR_DONAME */ [
	"'tee' tarvitsee toiminnon nimen"
],
/* EDEN_ERROR_PROCNAME */ [
	"Aliohjelmien nimet eivät voi olla varattuja sanoja",
	"Aliohjelmien nimet eivät voi olla arvoja",
	"'aliohjelma' tarvitsee nimen",
	"Odottamaton lopettava sulku",
	"'aliohjelma'-sanaa tulee seurata sen nimi",
	"Aliohjelmalla tulee olla nimi"
],
/* EDEN_ERROR_IMPORTPATH */ [
	"Vääränlainen 'tuo'-polku, tarvitaan nimi sekä /"
],
/* EDEN_ERROR_IMPORTOPTION */ [
	"Vääränlainen 'tuo'-valinta"
],
/* EDEN_ERROR_IMPORTCOMB */ [
	"Valintojen yhdistäminen ei ole sallittua"
],
/* EDEN_ERROR_IFNOSTATEMENT */ [
	"'jos'-ehtolauseesta puuttuu lauseke"
],
/* EDEN_ERROR_AFTERNOSTATEMENT */ [
	"'tauko'-sanan jälkeen puuttuu lauseke"
],
/* EDEN_ERROR_WHENNOSTATEMENT */ [
	"kun-sanan perästä puuttuu lauseke"
],
/* EDEN_ERROR_LITCHAREMPTY */ [
	"Lainausmerkkien välissä ei ole kirjainta"
],
/* EDEN_ERROR_LITCHARCLOSE */ [
	"Kirjainta ei ole suljettu lainausmerkillä"
],
/* EDEN_ERROR_LITSTRLINE */ [
	"Merkkijonoa ei voi jakaa useille riveille"
],
/* EDEN_ERROR_LITSTRCLOSE */ [
	"Merkkijonoa ei ole suljettu lainausmerkillä."
],
/* EDEN_ERROR_IMPORTTAG */ [
	"Import version tag invalid"
]
];

Language.ui = {
	"input_window": {
		title: "Skripti-ikkuna",
		description: "Tarjoaa mahdollisuuden kirjoittaa  skriptejä, suorittaa niitä sekä selata aiemmin kirjoitettuja skriptejä",
		success: "Jei jee!",
		is_undef_because: "ei ole määritelty koska",
		is_undef: "on määrittelemätön",
		are_undef: "ovat määrittelemättömiä",
		uses: "käyttää",
		which_undef: "joka on määrittelemätön",
		uses_undef: "käyttää määrittelemättömiä Tarkkailtavia",
		show_tabs: "Näytä välilehdet",
		show_controls: "Näytä toiminnot",
		browse_agents: "Selaa Agentteja",
		hide_agent: "Piilota Agentti",
		view_history: "Näytä historia",
		insert_temp: "Lisää malli",
		run: "Suorita (kaikki)",
		stop: "Pysäytä",
		clone: "Monista",
		reload: "Lataa uudelleen",
		upload: "Lataa",
		hide: "Piilota",
		inspect: "Tarkastele",
		rewind: "Kelaa",
		undo: "Peru",
		redo: "Tee uudelleen",
		fast_forward: "Pikakelaa eteenpäin"
	},
	"canvas": {
		title: "Piirtopinta"
	},
	"menu_bar": {
		title: "Valikko",
		description: "Luo valikon",
		opt_confirm: "Vahvista ympäristön sulkeminen",
		opt_simple_search: "Yksinkertainen haku",
		opt_hide: "Piilota ikkunat pienennettäessä",
		opt_collapse: "Kutista ikkuna tuplaklikkaamalla",
		opt_debug: "Debuggaa JS-EDENiä",
		main_views: "Uusi ikkuna",
		main_existing: "Avoimet ikkunat",
		main_options: "Asetukset",
		comprehension: "Työkalut",
		making_defs: "Määritelmät",
		history: "Historia & Tila",
		visualise: "Visualisointi",
		management: "Hallinta",
		version: "Versio",
		login: "Kirjaudu sisään",
		notconnect: "Ei yhdistetty"
	},
	"search": {
		disjunction: "tai"
	},
	"general": {
		error: "Virhe",
		loading: "Ladataan...",
		finished_loading: "JS-EDENin lataus on valmis.",
		leaving: "Sivun sulkeminen hävittää nykyiset määritelmät. Muutoksia ei tallenneta."
	}
}

