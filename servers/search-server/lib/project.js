"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _errors = require("./errors");

var _database = _interopRequireDefault(require("./database"));

var _common = require("./common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var projectRatings = {};
var projectRatingsCount = {};

function getListQueryStr(targetTable) {
  return 'SELECT saveID, projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags, date, downloads,forks, myrating, avgStars FROM (SELECT saveID, projects.projectID, title, minimisedTitle, image, owner, name as ownername, date,' + ' publicVersion, parentProject, projectMetaData,	projectratings.stars as myrating, projectStats.avgStars, downloads,forks, (" " || group_concat(tag, " ") || " " ) as tags FROM projects,oauthusers,' + targetTable + ' left outer join tags' + ' on projects.projectID = tags.projectID LEFT OUTER JOIN projectstats ON projectstats.projectID = projects.projectID LEFT OUTER JOIN projectratings ON projectratings.projectID = projects.projectID AND projectratings.userID = @ratingsUser WHERE owner = oauthusers.userid AND ' + targetTable + '.projectID = projects.projectID ';
}

function getMaxReadableSaveID(projectID, user, res, callback) {
  var getMaxSaveIDStmt = _database["default"].prepare("SELECT max(saveID) as maxSaveID FROM projectversions, projects WHERE projects.projectID = projectversions.projectID " + "AND projectversions.projectID = ? AND (readPassword is NULL OR projects.owner = ?)");

  getMaxSaveIDStmt.get(projectID, user, function (err, row) {
    if (err) {
      (0, _common.logDBError)(err);
      res.json({
        error: _errors.ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (row == undefined) {
      res.json({
        error: _errors.ERROR_SQL,
        description: ""
      });
    }

    callback(row.maxSaveID);
  });
}

function getVersionInfo(saveID, projectID, userID, readPassword, res, callback) {
  var getVersionInfoStmt = _database["default"].prepare("SELECT date, readPassword, owner FROM projectversions, projects WHERE projectversions.projectid = projects.projectid and saveID = ?");

  getVersionInfoStmt.get(saveID, function (err, row) {
    if (err) {
      (0, _common.logDBError)(err);
      res.json({
        error: _errors.ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (row && (row.owner == userID || row.readPassword == null || row.readPassword == readPassword)) {
      callback(saveID, projectID, row.date);
    } else {
      if (row) res.json({
        error: ERROR_USER_NOT_OWNER,
        description: "No permissions"
      });else res.json({
        error: ERROR_PROJECT_NOT_MATCHED,
        description: "No matching saveID"
      });
    }
  });
}

function getProjectMetaDataFromSaveID(saveID, res, callback) {
  getProjectIDFromSaveID(saveID, res, function (projectID) {
    getProjectMetaData(projectID, null, callback);
  });
}

function getProjectIDFromSaveID(saveID, res, callback) {
  var query = _database["default"].prepare('SELECT projectID FROM projectversions WHERE saveID = ?');

  query.get(saveID, function (err, row) {
    if (err) {
      (0, _common.logDBError)(err);
      res.json({
        error: _errors.ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    } else {
      callback(row ? row.projectID : undefined);
    }
  });
}

function getProjectMetaData(projectID, userID, res, callback) {
  var metadataQuery = _database["default"].prepare('SELECT projects.projectID, title, minimisedTitle, image, owner, oauthusers.name as ownername, publicVersion, parentProject, projectMetaData, ' + '(" " || group_concat(tag, " ") || " " ) as tags, stars as myrating ' + 'FROM projects, oauthusers left outer join tags on projects.projectID = tags.projectID left outer join projectratings on ' + 'projectratings.projectID = projects.projectID AND projectratings.userID = ? WHERE owner = oauthusers.userid AND projects.projectID = ?');

  metadataQuery.get(userID, projectID, function (err, row) {
    if (err) {
      (0, _common.logDBError)(err);
      res.json({
        error: _errors.ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    } else {
      callback(row);
    }
  });
}

function increaseProjectDownloadStat(req, res) {
  var downloadsSQL = "UPDATE projectstats SET downloads = downloads + 1 WHERE projectID = ?;";

  _database["default"].run(downloadsSQL, req.query.projectID, function (err) {
    if (err) {
      (0, _common.logDBError)(err);
      res.json({
        error: _errors.ERROR_SQL,
        description: "SQL Error",
        err: err
      });
      return;
    }

    if (this.changes == 0) {
      var insDownloadsSQL = "INSERT INTO projectstats VALUES (?,1,0,0,0)";

      _database["default"].run(insDownloadsSQL, req.query.projectID, function (err) {
        if (err) {
          (0, _common.logDBError)(err);
          res.json({
            error: _errors.ERROR_SQL,
            description: "SQL Error",
            err: err
          });
          return;
        }
      });
    } else {}
  });
}

function sendDiff(fromID, toSource, projectID, toID, res, metaRow) {
  _database["default"].serialize(function () {
    (0, _common.getFullVersion)(fromID, projectID, [], function (ret) {
      var source = ret.source;
      var dmp = new window.diff_match_patch();
      var d = dmp.diff_main(source, toSource, false);
      var p = dmp.patch_make(source, toSource, d);
      var patchText = dmp.patch_toText(p);
      var srcRow = {
        from: fromID,
        projectID: projectID,
        to: toID,
        patch: patchText
      };
      res.json(Object.assign(srcRow, metaRow));
    });
  });
}

function processSelectorNode(t, criteria, criteriaVals, i) {
  if (t.type == "property") {
    switch (t.name) {
      case ".id":
        criteria.push("projectID = @projectID" + i);
        criteriaVals["@projectID" + i] = t.value;
        break;

      case ".title":
        criteria.push("title LIKE @title" + i);
        criteriaVals["@title" + i] = t.param.replace(/\*/g, "%");
        break;

      case ":me":
        criteriaVals["@mineOnly"] = true;
        break;

      case ".author":
        //			criteria.push("owner = @otherAuthor");
        //			criteriaVals["@otherAuthor"] = 
        break;

      case ".name":
        if (t.param === undefined) return;
        criteria.push("minimisedTitle LIKE @minimisedTitle" + i);
        criteriaVals["@minimisedTitle" + i] = t.param.replace(/\*/g, "%");
        break;

      case ".parent":
      case ":parent":
        criteria.push("parentProject = @parentProject" + i);
        criteriaVals["@parentProject" + i] = t.value;
        break;

      case ".listed":
        criteriaVals["listedOnly"] = true;
        break;
    }
  }

  if (t.type == "tag") {
    if (t.tag === undefined) return;
    criteria.push("tags like @tag" + i);
    criteriaVals["@tag" + i] = "% " + t.tag.replace(/\*/g, "%").substring(1) + " %";
  }

  if (t.type == "name") {
    if (t.name === undefined) return;
    var tmpCriteria = ["OR"];
    tmpCriteria.push("minimisedTitle LIKE @minimisedTitle" + i);
    tmpCriteria.push("tags like @minimisedTitleTag" + i);
    criteria.push(tmpCriteria);
    criteriaVals["@minimisedTitle" + i] = t.name.replace(/\*/g, "%");
    criteriaVals["@minimisedTitleTag" + i] = "% " + t.name.replace(/\*/g, "%") + " %";
  }
}

function parseCriteria(arr) {
  if (!Array.isArray(arr) || arr.length == 1) {
    if (arr == "AND" || arr == "OR") return "";
    return arr;
  }

  if (arr.length == 2) return parseCriteria(arr[1]);
  var connectionType = arr[0];
  arr.shift();
  var tmpArr = [];

  for (j = 0; j < arr.length; j++) {
    tmpArr.push(parseCriteria(arr[j]));
  }

  return "(" + tmpArr.join(" " + connectionType + " ") + ")";
}

function processNextRating(projectRows, unknownRatings, i, res) {
  if (i == unknownRatings.length) {
    for (var _j = 0; _j < projectRows.length; _j++) {
      if (projectRows[_j].overallRating == undefined) {
        projectRows[_j].overallRating = projectRatings[projectRows[_j].projectID];
        projectRows[_j].numRatings = projectRatingsCount[projectRows[_j].projectID];
      }
    }

    res.json(projectRows);
  } else {
    var getRatingsStmt = "SELECT count(1) as c,sum(stars) as s FROM projectratings WHERE projectID = ?";
    var projectID = unknownRatings[i];

    _database["default"].get(getRatingsStmt, projectID, function (err, row) {
      if (err || row === undefined) {
        (0, _common.logDBError)(err);
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      }

      projectRatings[projectID] = row.s;
      projectRatingsCount[projectID] = row.c;
      var overallRating = Number(row.s / row.c).toFixed(1);
      if (isNaN(overallRating)) overallRating = null;
      var updateStarsStmt = "UPDATE projectstats SET avgStars = ? WHERE projectID = ?";

      _database["default"].run(updateStarsStmt, overallRating, projectID, function (err) {
        if (err) {
          (0, _common.logDBError)(err);
          res.json({
            error: _errors.ERROR_SQL,
            description: "SQL Error",
            err: err
          });
        }

        processNextRating(projectRows, unknownRatings, i + 1, res);
      });
    });
  }
}

function rectifySource(source) {
  var ast = new Eden.AST(source, undefined, {}, {
    noparse: true,
    noindex: true,
    version: 1
  });
  ast.next();
  var hasVersionName = false;

  while (ast.token === "STRING") {
    switch (ast.data.value) {
      case "use cs2;":
      case "use cs3;":
        hasVersionName = true;
        break;

      default:
        break;
    }

    ast.next();
  }

  if (hasVersionName) {
    return source;
  } // Otherwise, needs fixing


  var script = ast.pSCRIPT();

  if (script.errors.length === 0) {
    return "\"use cs3;\n".concat(source);
  } else {
    return "\"use cs2;\n".concat(source);
  }
}

function _default(app) {
  app.get('/project/tags', function (req, res) {
    var stmtstr = "SELECT projectID,tag FROM tags WHERE tag LIKE @tagname";
    var criteriaObject = {};
    criteriaObject["@offset"] = 0;
    criteriaObject["@limit"] = 100;
    criteriaObject["@tagname"] = "%" + req.query.tag + "%";
    /*if(req.query.offset)
     criteriaObject["@offset"] = req.query.offset;
    if(req.query.limit)
     criteriaObject["@limit"] = req.query.limit;*/

    stmtstr += " LIMIT @limit OFFSET @offset";

    var stmt = _database["default"].prepare(stmtstr);

    var tags = {};
    stmt.all(criteriaObject, function (err, rows) {
      if (err) {
        (0, _common.logDBError)(err);
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      } else {
        //res.json(rows);
        for (var i = 0; i < rows.length; i++) {
          var tmp = rows[i].tag.split(" ");

          for (var _j2 = 0; _j2 < tmp.length; _j2++) {
            if (tmp[_j2] == req.query.tag) continue;
            if (tags[tmp[_j2]] === undefined) tags[tmp[_j2]] = 1;else tags[tmp[_j2]]++;
          }
        }

        var sorted = [];

        for (var x in tags) {
          sorted.push(x);
        }

        sorted.sort(function (a, b) {
          return tags[b] - tags[a];
        });
        res.json(sorted);
      }
    });
  });
  app.get('/project/activity', function (req, res) {
    if (req.user.admin != 1) {
      res.json({
        error: _errors.ERROR_NOTADMIN,
        description: "Must be admin to see project activity"
      });
      return;
    }

    var stmtstr = "SELECT name,saveID,projectversions.projectID,date,title,readPassword FROM projectversions,oauthusers,projects WHERE oauthusers.userid = projects.owner AND projectversions.projectID = projects.projectID";
    var criteriaObject = {};
    criteriaObject["@offset"] = 0;
    criteriaObject["@limit"] = 100;

    if (req.query.newerThan) {
      stmtstr += " AND date > (SELECT date from projectversions WHERE saveID = @newerThanVersion)";
      criteriaObject["@newerThanVersion"] = req.query.newerThan;
    }

    if (req.query.offset) criteriaObject["@offset"] = req.query.offset;
    if (req.query.limit) criteriaObject["@limit"] = req.query.limit;
    stmtstr += " ORDER BY date DESC LIMIT @limit OFFSET @offset";

    var stmt = _database["default"].prepare(stmtstr);

    stmt.all(criteriaObject, function (err, rows) {
      if (err) {
        (0, _common.logDBError)(err);
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      } else {
        res.json(rows);
      }
    });
  });
  /**
  * Title: Project Get
  * URL: /project/get
  * Method: GET
  * Data Params:
  * {
  *  projectID: integer,
  *  to: [integer],
  *  from: [integer],
  * }
  * 
  * Request should have 'from' and 'to', which gives the diff between the two versions
  * If both undefined, get full snapshot of latest version (with no diffs)
  * If from undefined, get full snapshot of 'to' version (no diffs)
  * If to undefined but from is defined, get diff from 'from' to latest version.
  * Returns JSON object with saveID, projectID and source properties.
  * If a 'from' is defined, the object won't contain a source property, but will contain a patch property
  **/

  app.get('/project/get', function (req, res) {
    //ProjectID must be defined
    //Request should have 'from' and 'to', which gives the diff between the two versions
    //If both undefined, get full snapshot of latest version (with no diffs)
    //If 'from' undefined, get full snapshot of 'to' version (no diffs).
    //If 'to' undefined but from is defined, get diff from 'from' to latest version.
    if (!req.query.projectID) {
      (0, _common.logAPIError)("/project/get", "projectID must be defined");
      return res.json({
        error: _errors.ERROR_NO_PROJECTID,
        description: "projectID must be defined"
      });
    }

    (0, _common.logAPI)("/project/get", "id = ".concat(req.query.projectID));
    var userID = -1;

    if (req.user != undefined) {
      userID = req.user.id;
    } // Do a source rectification for new version


    var rectify = req.query.rectify;
    var targetSaveID = null;

    if (req.query.to) {
      targetSaveID = req.query.to;
      getVersionInfo(targetSaveID, req.query.projectID, userID, req.query.readPassword, res, function (saveID, projectID, date) {
        getProjectMetaData(req.query.projectID, userID, res, function (metaRow) {
          _database["default"].serialize(function () {
            (0, _common.getFullVersion)(saveID, req.query.projectID, metaRow, function (ret) {
              var source = rectify ? rectifySource(ret.source) : ret.source;
              var date = ret.date;

              if (req.query.from) {
                sendDiff(req.query.from, source, req.query.projectID, targetSaveID, res, metaRow);
              } else {
                var srcRow = {
                  saveID: saveID,
                  projectID: projectID,
                  source: source,
                  date: date,
                  meta: metaRow
                };
                res.json(Object.assign(srcRow, metaRow));
              }
            });
          });
        });
      });
    } else {
      getMaxReadableSaveID(req.query.projectID, userID, res, function (saveID) {
        getVersionInfo(saveID, req.query.projectID, userID, req.query.readPassword, res, function () {
          getProjectMetaData(req.query.projectID, userID, res, function (metaRow) {
            _database["default"].serialize(function () {
              (0, _common.getFullVersion)(saveID, req.query.projectID, metaRow, function (ret) {
                var source = rectify ? rectifySource(ret.source) : ret.source;
                var date = ret.date;

                if (req.query.from) {
                  sendDiff(req.query.from, source, req.query.projectID, saveID, res, metaRow);
                } else {
                  var srcRow = {
                    saveID: saveID,
                    projectID: req.query.projectID,
                    source: source,
                    date: date,
                    meta: metaRow
                  };
                  res.json(Object.assign(srcRow, metaRow));
                }
              });
            });
          });
        });
      });
    }

    increaseProjectDownloadStat(req, res);
  });
  app.post('/project/rate', function (req, res) {
    var userID = req.user.id;
    var starRating = req.body.stars;
    var projectID = req.body.projectID;
    var rateSQL = "UPDATE projectratings SET stars = ? WHERE projectID = ? AND userID = ?;";
    delete projectRatings[req.body.projectID];

    _database["default"].run(rateSQL, starRating, projectID, userID, function (err) {
      if (err) {
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
        return;
      }

      if (this.changes == 0) {
        var insRateSQL = "INSERT INTO projectratings VALUES (?,?,?,NULL);";

        _database["default"].run(insRateSQL, projectID, userID, starRating, function (err) {
          if (err) {
            (0, _common.logDBError)(err);
            res.json({
              error: _errors.ERROR_SQL,
              description: "SQL Error",
              err: err
            });
            return;
          }

          res.json({
            status: "INSERTED"
          });
        });
      } else {
        res.json({
          status: "UPDATED"
        });
      }
    });
  });
  /**
  * Title: Project Search
  * URL: /project/search
  * Method: GET
  * * Data Params:
  * {
  *  projectid: [integer],
  *  dateBefore: [date],
  *  dateAfter: [date],
  *  minimisedTitle: [string like pattern],
  *  title: [string like pattern],
  *  query: [string],
  *  limit: [integer],
  *  offset: [offset],
  *  }
  *  
  *  Returns JSON
  **/

  app.get('/project/search', function (req, res) {
    (0, _common.logAPI)("/project/search", "query = ".concat(req.query.query));
    var criteriaVals = {};
    criteriaVals["@limit"] = 50;
    if (req.query.limit && req.query.limit <= 50) criteriaVals["@limit"] = req.query.limit;
    criteriaVals["@offset"] = 0;
    if (req.query.offset) criteriaVals["@offset"] = req.query.offset;
    var tmpCriteria = ["AND"];

    if (req.query.query && req.query.query != " ") {
      var selectorAST = Eden.Selectors.parse(req.query.query.trim());

      if (selectorAST !== undefined) {
        if (selectorAST.type == "intersection") {
          for (var i = 0; i < selectorAST.children.length; i++) {
            processSelectorNode(selectorAST.children[i], tmpCriteria, criteriaVals, i);
          }
        } else {
          processSelectorNode(selectorAST, tmpCriteria, criteriaVals, 0);
        }
      } else {
        res.json([]);
        return;
      }
    }

    var mineOnly = criteriaVals["@mineOnly"] !== undefined ? criteriaVals["@mineOnly"] : false;
    var listedOnly = criteriaVals["@listedOnly"] !== undefined ? criteriaVals["@listedOnly"] : false;
    if (criteriaVals["@mineOnly"] !== undefined) delete criteriaVals["@mineOnly"];
    if (criteriaVals["@listedOnly"] !== undefined) delete criteriaVals["@listedOnly"];
    var conditionStr = "";
    var tagConditionStr = "";

    if (tmpCriteria.length > 0) {
      var tmpCStr = parseCriteria(tmpCriteria);
      if (tmpCStr.length > 0) tagConditionStr = "\n WHERE " + tmpCStr;
    }

    var listQueryStr;

    if (!mineOnly && !listedOnly) {
      if (req.user == null) listedOnly = true;
    }

    var orderString = " order by date desc ";

    if (req.query.by) {
      if (req.query.by == "downloads") orderString = " order by downloads desc ";
      if (req.query.by == "rating") orderString = " order by avgStars desc ";
    }

    if (req.user == null) criteriaVals["@ratingsUser"] = -1;else criteriaVals["@ratingsUser"] = req.user.id;

    if (mineOnly) {
      if (req.user == null) return res.json([]);
      listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner' + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
      criteriaVals["@owner"] = req.user.id;
    } else if (listedOnly) {
      listQueryStr = getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
    } else {
      listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner';
      criteriaVals["@owner"] = req.user.id;
      listQueryStr += conditionStr + ' group by projects.projectID)' + tagConditionStr;
      listQueryStr += " UNION " + getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID) ' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
    } //console.log(listQueryStr);


    var listProjectStmt = _database["default"].prepare(listQueryStr);

    var unknownRatings = [];
    listProjectStmt.all(criteriaVals, function (err, rows) {
      if (err) {
        (0, _common.logDBError)(err);
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
        return;
      }

      for (var i = 0; i < rows.length; i++) {
        if (rows[i].tags) {
          var tmpTags = rows[i].tags.split(" ");

          for (var j = tmpTags.length - 1; j >= 0; j--) {
            if (tmpTags[j] == "") tmpTags.splice(j, 1);
          }

          rows[i].tags = tmpTags;
        }

        var projectID = rows[i].projectID;

        if (projectRatings[projectID] !== undefined) {
          rows[i].overallRating = projectRatings[projectID];
          rows[i].numRatings = projectRatingsCount[projectID];
        } else {
          unknownRatings.push(projectID);
        }
      }

      processNextRating(rows, unknownRatings, 0, res);
    });
  });
  app.post('/project/remove', _common.ensureAuthenticated, function (req, res) {
    var projectID = req.body.projectID;
    var userID = req.user.id;
    var delStatement = "DELETE FROM projects WHERE projectID = ? AND owner = ?";

    _database["default"].run(delStatement, projectID, userID, function (err) {
      if (err) {
        (0, _common.logDBError)(err);
        res.json({
          error: _errors.ERROR_SQL,
          description: "SQL Error",
          err: err
        });
      }

      if (this.changes == 0) res.json({
        error: ERROR_PROJECT_NOT_MATCHED,
        description: "Matching project not found"
      });
      if (this.changes > 0) res.json({
        status: "deleted",
        changes: this.changes
      });
    });
  });
  /**
   * 
   * GET version info for either projectID or userID
   * 
   * URL: /project/versions
   * 
   * Data param{
   * 	projectID: [integer],
   *  userID: [integer]
   * }
   * 
   * Note - the user ID does not have to be the logged in user!
   * 
   */

  app.get('/project/versions', function (req, res) {
    if (req.query.projectID !== undefined) {
      var listProjectIDStmt = _database["default"].prepare("select projectid, saveID, date, parentDiff,author,name, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions left join oauthusers ON author = userid where projectid = ?;");

      listProjectIDStmt.all(req.query.projectID, function (err, rows) {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].author === undefined || rows[i].author == null) rows[i].name = "[Me]";
        }

        res.json(rows);
      });
    } else if (req.query.userID !== undefined) {
      var listProjectStmt = _database["default"].prepare("select projects.projectid, saveID, date, parentDiff, case ifnull(readpassword,0) when 0 then 0 else 1 end as private from projectversions,projects where projects.projectid = projectversions.projectid AND owner = ? ORDER BY date;");

      listProjectStmt.all(req.user.id, function (err, rows) {
        res.json(rows);
      });
    }
  });
}