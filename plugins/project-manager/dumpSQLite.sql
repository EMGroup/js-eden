PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "oauthusers" (
    "id" INTEGER PRIMARY KEY NOT NULL,
    "oauthstring" TEXT NOT NULL,
    "name" TEXT
);
CREATE TABLE versions (
    "saveID" INTEGER NOT NULL PRIMARY KEY,
    "agentID" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "tag" TEXT,
    "parentSaveID" INTEGER
, "date" INTEGER  NOT NULL  DEFAULT (current_timestamp),
"owner" INTEGER NOT NULL,
"permission" INTEGER,
"group" INTEGER);
CREATE TABLE agents (
    "id" INTEGER PRIMARY KEY,
    "title" TEXT NOT NULL,
    "path" TEXT
);
CREATE UNIQUE INDEX "userid" on oauthusers (id ASC);
CREATE UNIQUE INDEX "oauthstring" on oauthusers (oauthstring ASC);
CREATE UNIQUE INDEX "path" on agents (path ASC);
CREATE INDEX "agentID" on versions (agentID ASC);
CREATE INDEX "date" on versions (date ASC);
CREATE INDEX "agentDate" on versions (agentID ASC, date ASC);
COMMIT;
