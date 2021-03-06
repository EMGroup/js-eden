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

export async function getFullVersion(db, version, projectID, meta){
	const row = await db.models.projectversions.findOne({
		where: {
			saveID: version,
			projectID,
		},
		attributes: ['parentDiff', 'forwardPatch', 'fullsource', 'date'],
	});

	if(row.fullsource == null){
		const ret = await getFullVersion(db, row.parentDiff, projectID, meta);
		const parentSource = ret.source;
		const dmp = new window.diff_match_patch();
		const p = dmp.patch_fromText(row.forwardPatch);
		const r = dmp.patch_apply(p,parentSource);
		return {source: r[0], date: row.date, meta: meta};
	} else {
		return {source: row.fullsource, date: row.date, meta: meta};
	}
}

export function logDBError(api, err){
	if (typeof api === 'string') {
		console.log(`${new Date().toISOString().cyan}: ${api.bold} : ${err.toString().red}`);
	} else {
		console.log(`${new Date().toISOString().cyan}: ${api.toString().red}`);
		console.log(api);
	}
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
