PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
CREATE TABLE "oauthusers" (
    "userid" INTEGER PRIMARY KEY NOT NULL,
    "oauthstring" TEXT NOT NULL,
    "name" TEXT
);
CREATE TABLE projectversions (
    "saveID" INTEGER NOT NULL PRIMARY KEY,
    "projectID" INTEGER NOT NULL,
    "fullsource" TEXT,
    "forwardPatch" TEXT,
    "backwardPatch" TEXT,
	"date" INTEGER  NOT NULL DEFAULT (current_timestamp),
	"parentDiff" integer,
	foreign key(projectID) REFERENCES projects(projectID),
	foreign key(parentDiff) REFERENCES projectversions(saveID)
);

CREATE TABLE projectstats(
	"projectID" INTEGER NOT NULL,
	"downloads" INTEGER NOT NULL DEFAULT 0,
	"forks" INTEGER NOT NULL DEFAULT 0,
	"stars" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE projectratings(
	"projectID" INTEGER NOT NULL,
	"userID" INTEGER NOT NULL,
	"stars" INTEGER NOT NULL
)

CREATE TABLE projects (
    "projectID" INTEGER PRIMARY KEY,
    "title" TEXT NOT NULL,
    "minimisedTitle" TEXT NOT NULL,
    "image" BLOB,
    "owner" INTEGER NOT NULL,
    "publicVersion" INTEGER,
    "parentProject" INTEGER,
    "projectMetaData" TEXT,
    foreign key(publicVersion) REFERENCES projectversions(saveID),
    foreign key(owner) REFERENCES oauthusers(userid)
);
CREATE TABLE tags (
	"projectID" INTEGER NOT NULL,
	"tag" TEXT,
	foreign key(projectID) REFERENCES projects(projectID)
);

CREATE TABLE comments(
	"commentID" INTEGER PRIMARY KEY,
	"projectID" INTEGER NOT NULL,
	"versionID" INTEGER NOT NULL,
	"date" INTEGER NOT NULL DEFAULT (current_timestamp),
	"author" INTEGER,
	"public" INTEGER NOT NULL,
	"comment" TEXT NOT NULL
);
CREATE UNIQUE INDEX "commentID" on comments(commentID ASC);
CREATE INDEX "comments_projectID" on comments(projectID ASC);
CREATE INDEX "comments_date" on comments(date ASC);

CREATE VIEW view_latestVersion AS
select saveID,date,projectid FROM (SELECT max(saveID) as maxsaveID from projectversions 
group by projectID) as maxv, projectversions where maxsaveID = projectversions.saveID;

CREATE VIEW view_listedVersion AS
select saveID,date,projects.projectid FROM projectversions,projects where saveID = publicVersion;


CREATE UNIQUE INDEX "projectrating" ON projectratings(projectID ASC,userID ASC);
CREATE UNIQUE INDEX "projectstat" ON projectstats(projectID ASC);

CREATE UNIQUE INDEX "userid" on oauthusers (userid ASC);
CREATE UNIQUE INDEX "oauthstring" on oauthusers (oauthstring ASC);
CREATE UNIQUE INDEX "saveID" on projectversions (saveID ASC);
CREATE UNIQUE INDEX "projectID" on projects (projectID ASC);
CREATE INDEX "versions_projectID" on projectversions (projectID ASC);
CREATE INDEX "date" on projectversions (date ASC);
CREATE INDEX "projectDate" on projectversions (projectID ASC, date ASC);
CREATE INDEX "tags_tag" on tags (tag ASC);
CREATE INDEX "projectTags" on tags (projectID ASC);


COMMIT;