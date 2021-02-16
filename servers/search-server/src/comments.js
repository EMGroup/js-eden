import {ERROR_SQL, ERROR_NOTADMIN, ERROR_INVALID_FORMAT, ERROR_COMMENT_NOT_MATCHED} from './errors';
import db from './database';
import {ensureAuthenticated} from './common';

export default function(app) {
	app.post('/comment/post', ensureAuthenticated, function(req,res){
		var stmt = db.prepare("INSERT INTO comments VALUES (NULL, ?, ?, current_timestamp, ?, ?, ?);");
		if(req.body.publiclyVisible != 0 && req.body.publiclyVisible != 1)
			res.json({error: ERROR_INVALID_FORMAT, description: "Invalid range for 'publiclyVisible'"})
		stmt.run(req.body.projectID,req.body.versionID,req.user.id, req.body.publiclyVisible, req.body.comment,function(err){
			if(err){
					res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}else{
				res.json({commentID: this.lastID});  
			}		  
		});
	});

	app.post('/comment/delete', ensureAuthenticated, function(req,res){
		var stmt = db.prepare("DELETE FROM comments WHERE commentID = ? AND author = ?");
		stmt.run(req.body.commentID,req.user.id,function(err){
				if(err){
					res.json({error: ERROR_SQL, description: "SQL Error", err:err});
				}
				if(this.changes == 0)
					res.json({error: ERROR_COMMENT_NOT_MATCHED, description: "Matching project not found"});
				if(this.changes > 0)
					res.json({status: "deleted", changes: this.changes});  
		});
	});

	app.get('/comment/search', function(req,res){
		var stmtstr = "SELECT name,commentID,projectID,versionID,date,author,public,comment FROM comments,oauthusers WHERE projectID = @projectID AND public = 1";
		var criteriaObject = {};
		criteriaObject["@projectID"] = req.query.projectID;
		criteriaObject["@offset"] = 0;
		criteriaObject["@limit"] = 100;

		if(req.query.newerThan){
			stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
			criteriaObject["@newerThanComment"] = req.query.newerThan;
		}
		if(req.query.offset)
			criteriaObject["@offset"] = req.query.offset;
		if(req.query.limit)
			criteriaObject["@limit"] = req.query.limit;
		
		stmtstr += " AND author = userid ORDER BY date DESC LIMIT @limit OFFSET @offset";
		var stmt = db.prepare(stmtstr);
		
		stmt.all(criteriaObject,function(err,rows){
			if(err){
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}else{

				if(req.user){
					stmtstr = "SELECT name,commentID,projectID,versionID,date,author,public,comment FROM comments,oauthusers WHERE projectID = @projectID AND public = 0 AND author = @author";
					criteriaObject = {};
					
					criteriaObject["@projectID"] = req.query.projectID;
					criteriaObject["@offset"] = 0;
					criteriaObject["@limit"] = 100;
					criteriaObject["@author"] = req.user.id;

					if(req.query.newerThan){
						stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
						criteriaObject["@newerThanComment"] = req.query.newerThan;
					}
					if(req.query.offset)
						criteriaObject["@offset"] = req.query.offset;
					if(req.query.limit)
						criteriaObject["@limit"] = req.query.limit;
					
					stmtstr += " AND author = userid LIMIT @limit OFFSET @offset";
					
					var privStmt = db.prepare(stmtstr);
					
					privStmt.all(criteriaObject, function(err,privRows){
						if(err){
								res.json({error: ERROR_SQL, description: "SQL Error", err:err});
						}else{
							var mergedRows = rows.concat(privRows);
							res.json(mergedRows);
						}
					});
				}else{
					res.json(rows);
				}

			}		  
		});
	});

	app.get('/comment/activity', function(req,res){
		if (req.user.admin != 1) {
			res.json({error: ERROR_NOTADMIN, description: "Must be admin to see comment activity"});
			return;
		}
		var stmtstr = "SELECT name,commentID,comments.projectID,title,versionID,date,author,public,comment FROM comments,oauthusers,projects WHERE public = 1 AND comments.projectID = projects.projectID";
		var criteriaObject = {};
		criteriaObject["@offset"] = 0;
		criteriaObject["@limit"] = 100;

		if(req.query.newerThan){
			stmtstr += " AND date > (SELECT date from comments WHERE commentID = @newerThanComment)";
			criteriaObject["@newerThanComment"] = req.query.newerThan;
		}
		if(req.query.offset)
			criteriaObject["@offset"] = req.query.offset;
		if(req.query.limit)
			criteriaObject["@limit"] = req.query.limit;
		
		stmtstr += " AND author = userid ORDER BY date DESC LIMIT @limit OFFSET @offset";
		var stmt = db.prepare(stmtstr);
		
		stmt.all(criteriaObject,function(err,rows){
			if(err){
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}else{
				res.json(rows);
			}		  
		});
	});
}