To use the project-manager server:

1. cd into this directory and run "npm install".

2. Create a config.js file (based on config-template.js) - you'll need to generate keys/ids/secrets for each authentication service, you can find details on how to configure each authentication strategy at http://passportjs.org/

3. Import the dump file into a working database by typing "cat dumpSQLite.sql | sqlite3 database.sqlite3"
