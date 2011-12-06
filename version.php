<?php

if (strpos($_SERVER['SERVER_NAME'],".dcs.",0) == FALSE)
	system("git describe --abbrev=4 HEAD");
else
	system("/local/java/git/bin/git describe --abbrev=4 HEAD");

?>
