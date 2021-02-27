CREATE TABLE IF NOT EXISTS "oauthusers" (
    "userid" INTEGER PRIMARY KEY NOT NULL,
    "oauthstring" TEXT NOT NULL,
    "name" TEXT
, status text, isAdmin integer not null default '0');
CREATE TABLE projectversions (
    "saveID" INTEGER NOT NULL PRIMARY KEY,
    "projectID" INTEGER NOT NULL,
    "fullsource" TEXT,
    "forwardPatch" TEXT,
    "backwardPatch" TEXT,
	"date" INTEGER  NOT NULL DEFAULT (current_timestamp),
	"parentDiff" integer, readPassword TEXT, author INT REFERENCES oauthusers(userid),
	foreign key(projectID) REFERENCES projects(projectID),
	foreign key(parentDiff) REFERENCES projectversions(saveID)
);
CREATE TABLE projects (
    "projectID" INTEGER PRIMARY KEY,
    "title" TEXT NOT NULL,
    "minimisedTitle" TEXT NOT NULL,
    "image" BLOB,
    "owner" INTEGER NOT NULL,
    "publicVersion" INTEGER,
    "parentProject" INTEGER,
    "projectMetaData" TEXT, writePassword TEXT,
    foreign key(publicVersion) REFERENCES projectversions(saveID),
    foreign key(owner) REFERENCES oauthusers(userid)
);
CREATE TABLE tags (
	"projectID" INTEGER NOT NULL,
	"tag" TEXT,
	foreign key(projectID) REFERENCES projects(projectID)
);
CREATE UNIQUE INDEX "userid" on oauthusers (userid ASC);
CREATE UNIQUE INDEX "oauthstring" on oauthusers (oauthstring ASC);
CREATE UNIQUE INDEX "saveID" on projectversions (saveID ASC);
CREATE UNIQUE INDEX "projectID" on projects (projectID ASC);
CREATE INDEX "versions_projectID" on projectversions (projectID ASC);
CREATE INDEX "date" on projectversions (date ASC);
CREATE INDEX "projectDate" on projectversions (projectID ASC, date ASC);
CREATE INDEX "tags_tag" on tags (tag ASC);
CREATE INDEX "projectTags" on tags (projectID ASC);
CREATE TABLE projectstats(
"projectID" INTEGER NOT NULL,
"downloads" INTEGER NOT NULL DEFAULT 0,
"forks" INTEGER NOT NULL DEFAULT 0,
"stars" INTEGER NOT NULL DEFAULT 0
, "avgStars" REAL);
CREATE TABLE projectratings(
"projectID" INTEGER NOT NULL,
"userID" INTEGER NOT NULL,
"stars" INTEGER NOT NULL
, "avgStars" REAL);
CREATE UNIQUE INDEX "projectrating" ON projectratings(projectID ASC,userID ASC);
CREATE UNIQUE INDEX "projectstat" ON projectstats(projectID ASC);
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
CREATE TABLE localusers(
"localuserID" INTEGER PRIMARY KEY,
"emailaddress" TEXT NOT NULL,
"hashedPassword" TEXT NOT NULL
);
CREATE UNIQUE INDEX "localuserID" ON localusers (localuserID);
CREATE UNIQUE INDEX "emailaddress" ON localusers (emailaddress);
CREATE VIEW view_latestVersion AS
select saveID,date,projectid FROM (SELECT max(saveID) as maxsaveID from projectversions 
group by projectID) as maxv, projectversions where maxsaveID = projectversions.saveID
/* view_latestVersion(saveID,date,projectID) */;
CREATE VIEW view_listedVersion AS
select saveID,date,projects.projectid FROM projectversions,projects where saveID = publicVersion
/* view_listedVersion(saveID,date,projectID) */;
CREATE TABLE followusers(
"user" INTEGER NOT NULL REFERENCES oauthusers(userid),
"follower" INTEGER NOT NULL REFERENCES oauthusers(userid)
);
CREATE UNIQUE INDEX "followships" ON followusers (user,follower);
CREATE TABLE followprojects(
"projectID" INTEGER NOT NULL REFERENCES projects(projectID),
"follower" INTEGER NOT NULL REFERENCES oauthusers(userid)
);
CREATE UNIQUE INDEX "projectfollowships" ON followprojects (projectID,follower);
CREATE VIEW view_projectfollows as select projectversions.projectID, saveID, date, title,follower,owner1users.name as owner, oauthusers.name 
from projectversions,followprojects,projects,oauthusers as owner1users left join oauthusers on author = oauthusers.userid where projectversions.projectID = followprojects.projectID 
and followprojects.projectID = projectversions.projectID and projects.projectID = projectversions.projectID and owner1users.userid = owner
/* view_projectfollows(projectID,saveID,date,title,follower,owner,name) */;
