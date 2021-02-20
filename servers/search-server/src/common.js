import db from './database';
import 'colors';

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
export function ensureAuthenticated(req, res, next) {
	if(req.user) {return next();}
  res.status(403).send('logout');
}

export function getFullVersion(version, projectID, meta, callback){
	var versionStmt = db.prepare("SELECT fullsource, forwardPatch,parentDiff,date FROM projectversions WHERE saveID = ? AND projectID = ?");
	versionStmt.each(version,projectID, function(err,row){
		if(row.fullsource == null){
			//Go and get the source from the parentDiff
//			collateBasesAndPatches(row.parentDiff);
			getFullVersion(row.parentDiff, projectID, meta, function(ret){
				var parentSource = ret.source;
				var dmp = new window.diff_match_patch();
				var p = dmp.patch_fromText(row.forwardPatch);
				var r = dmp.patch_apply(p,parentSource);
				callback({source: r[0], date: row.date, meta: meta});
			});
		}else{
			callback({source: row.fullsource, date: row.date, meta: meta});
		}
	});
}

export function logDBError(str){
	console.error(`${new Date().toISOString().cyan}: ${str.red}`);
}

export function logAPI(api, str){
	console.log(`${new Date().toISOString().cyan}: ${api.bold} : ${str}`);
}

export function logAPIError(api, str){
	console.error(`${new Date().toISOString().cyan}: ${api.bold} : ${str.red}`);
}

export function log(str){
	console.log(`${new Date().toISOString().cyan}: ${str}`);
}
