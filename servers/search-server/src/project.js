import {ERROR_SQL, ERROR_NOTADMIN, ERROR_NO_PROJECTID, ERROR_USER_NOT_OWNER, ERROR_PROJECT_NOT_MATCHED} from './errors';
import {ensureAuthenticated, getFullVersion, logDBError, logAPI, logAPIError, log} from './common';
import {reindexProject} from './search';
import {QueryTypes, Op} from 'sequelize';

const projectRatings = {};
const projectRatingsCount = {};
let db;

async function checkOwner(req,res,pid) {
	const result = await db.models.projects.findOne({
		where: {projectID: pid || req.body.projectID},
	});

	if (!result) {
		res.status(400).json({error: ERROR_PROJECT_NOT_MATCHED, description: "No existing project"});
		return false;
	} else {
		if(result.owner == req.user.id || (req.body.writePassword == result.writePassword && result.writePassword != null)){
			req.body.writePassword = result.writePassword;
			return true;
		}else{
			res.status(403).json({error: ERROR_USER_NOT_OWNER, description: "User does not own this project"});
			return false;
		}
	}
}

async function updateProject(req, transaction) {
	const updates = {};

	const {title, minimisedTitle, image, metadata, tags, projectID} = req.body;

	if (title) updates.title = title;
	if (minimisedTitle) updates.minimisedTitle = minimisedTitle;
	if (image) updates.image = image;
	if (metadata) updates.projectMetaData = metadata;

	if (Object.keys(updates).length > 0) {
		await db.models.projects.update(updates, {where:{projectID}, transaction});
	}
	
	if (tags) {
		await db.models.tags.destroy({where: {projectID}, transaction});
		await updateTags(tags, projectID, transaction);
	}
}

async function updateTags(tags, projectID, transaction){
	if (!tags) return;

	let tagList;
	if (Array.isArray(tags))
		tagList = tags;
	else
		tagList = [tags];

	return tagList.length > 0 ? db.models.tags.create({
		projectID, tag: tagList.join(' '),
	}, {transaction}) : null;
}

async function createProject(req, transaction){
	const writePassword = parseInt(Math.random() * 100000000000000000).toString(36);
	req.body.writePassword = writePassword;
	const {title, minimisedTitle, image, metadata, parentProject} = req.body;

	const projectData = {
		title,
		minimisedTitle,
		image,
		projectMetaData: metadata,
		parentProject,
		writePassword,
		owner: req.user.id
	};

	const project = await db.models.projects.create(projectData, {transaction});
	const {projectID} = project;

	await updateTags(req.body.tags, projectID, transaction);

	if (parentProject) {
		const result = await db.models.projectstats.update(
			{forks: db.literal('forks + 1') },
			{where: {projectID: parentProject}, transaction}
		);
		if (result[0] === 0) throw new Error('Parent does not exist');
	}
	await db.models.projectstats.create({projectID}, {transaction});

	return projectID;
}

async function addProjectVersion(req, res, projectID, transaction){
	let listed = false;
	let readPassword = null;

	if(req.body.listed && req.body.listed == "true"){
		listed = true;
	}else{
		readPassword = parseInt(Math.random() * 100000000000000000).toString(36);
	}

	const entry = {
		author: req.user.id,
		projectID,
		readPassword,
	};

	let pTextForward = null;
	let pTextBackward = null;

	if(req.body.from){
		const version = await getFullVersion(db, req.body.from, projectID, []);
		if (!version) throw new Error('Project version not found');
		const baseSrc = version.source;
		const dmp = new window.diff_match_patch();
		let d = dmp.diff_main(baseSrc,req.body.source,false);
		let p = dmp.patch_make(baseSrc,req.body.source,d);
		pTextForward = dmp.patch_toText(p);
		d = dmp.diff_main(req.body.source,baseSrc,false);
		p = dmp.patch_make(req.body.source,baseSrc,d);
		pTextBackward = dmp.patch_toText(p);
		entry.fullsource = null;
		entry.forwardPatch = pTextForward;
		entry.backwardPatch = pTextBackward;
		entry.parentDiff = req.body.from;
		await runAddVersion(entry, listed, req, res, transaction);
	}else{
		entry.fullsource = req.body.source;
		entry.forwardPatch = null;
		entry.backwardPatch = null;
		entry.parentDiff = null;
		await runAddVersion(entry, listed, req, res, transaction);
	}
}

async function runAddVersion(entry, listed, req, res, transaction){
	const {projectID} = entry;
	const version = await db.models.projectversions.create(entry, {transaction});
	const lastSaveID = version.saveID;

	if (listed) {
		await db.models.projects.update(
			{publicVersion: lastSaveID},
			{where: {projectID}, transaction},
		);

		reindexProject(projectID);

		log(`Created public version ${lastSaveID} of project ${projectID}`);
		res.json({"saveID": lastSaveID, "projectID": projectID, "writePassword": req.body.writePassword, "readPassword": entry.readPassword});
	} else {
		log(`Created private version ${lastSaveID} of project ${projectID}`);
		res.json({"saveID": lastSaveID, "projectID": projectID, "writePassword": req.body.writePassword, "readPassword": entry.readPassword});
	}
}

function getListQueryStr(targetTable){
	return 'SELECT saveID, projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags, date, downloads,forks, myrating, avgStars FROM (SELECT saveID, projects.projectID, title, minimisedTitle, image, owner, name as ownername, date,' 
		+ ' publicVersion, parentProject, projectMetaData,	projectratings.stars as myrating, projectStats.avgStars, downloads,forks, (" " || group_concat(tag, " ") || " " ) as tags FROM projects,oauthusers,' + targetTable + ' left outer join tags'
		+ ' on projects.projectID = tags.projectID LEFT OUTER JOIN projectstats ON projectstats.projectID = projects.projectID LEFT OUTER JOIN projectratings ON projectratings.projectID = projects.projectID AND projectratings.userID = @ratingsUser WHERE owner = oauthusers.userid AND '+targetTable+'.projectID = projects.projectID ';	
}

async function getMaxReadableSaveID(projectID, user, res){
	// try {
		const row = await db.query(
			'SELECT max(saveID) as maxSaveID FROM projectversions, projects WHERE projects.projectID = projectversions.projectID ' +
			'AND projectversions.projectID = :projectID AND (readPassword is NULL OR projects.owner = :user)',
			{
				plain: true,
				type: QueryTypes.SELECT,
				replacements: { projectID, user },
			}
		);

		if(row == undefined) {
			res.status(400).json({error: ERROR_SQL, description: ""})
		}
		return row.maxSaveID;
	// } catch(err) {
	// 	logDBError(err);
	//	res.status(400).json({error: ERROR_SQL, description: "SQL Error", err: err});
	//}
}

async function getVersionInfo(saveID,projectID,userID, readPassword, res){
	// try {
		const row = await db.query(
			'SELECT date, readPassword, owner FROM projectversions, projects WHERE projectversions.projectid = projects.projectid and saveID = :saveID',
			{
				plain: true,
				type: QueryTypes.SELECT,
				replacements: { saveID },
			}
		);

		if(row && (row.owner == userID || row.readPassword == null || row.readPassword == readPassword)){
			return [saveID, projectID, row.date];
		}else{
			if(row)
				res.status(400).json({error: ERROR_USER_NOT_OWNER, description: "No permissions"});
			else
				res.status(400).json({error: ERROR_PROJECT_NOT_MATCHED, description: "No matching saveID"});
		}
	// } catch(err) {
	// 	logDBError(err);
	//	res.status(400).json({error: ERROR_SQL, description: "SQL Error", err: err});
	//}
}

function getProjectMetaDataFromSaveID(saveID, res, callback){
	getProjectIDFromSaveID(saveID,res,function(projectID){
		getProjectMetaData(projectID,null,callback);
	});
}

async function getProjectIDFromSaveID(saveID) {
	const version = await db.models.projectversions.findOne({
		where: {saveID},
		attributes: ['projectID'],
	});
	return version.projectID;
}

async function getProjectMetaData(projectID, userID){
	const row = await db.query(
		'SELECT projects.projectID, title, minimisedTitle, image, owner, oauthusers.name as ownername, publicVersion, parentProject, projectMetaData, '
		+ '(" " || group_concat(tag, " ") || " " ) as tags, stars as myrating '
		+ 'FROM projects, oauthusers left outer join tags on projects.projectID = tags.projectID left outer join projectratings on '
		+ 'projectratings.projectID = projects.projectID AND projectratings.userID = :userID WHERE owner = oauthusers.userid AND projects.projectID = :projectID',
		{
			plain: true,
			type: QueryTypes.SELECT,
			replacements: { userID, projectID },
		}
	);

	if (row?.image) {
		row.image = row.image.toString();
	}

	return row;
}

async function increaseProjectDownloadStat(projectID, transaction){
	const [count] = await db.models.projectstats.update(
		{downloads: db.literal('downloads + 1') },
		{where: {projectID}, transaction}
	);
	if (count === 0) {
		throw new Error('Could not update project stats');
	}
}

async function sendDiff(fromID,toSource,projectID,toID,metaRow){
	const ret = await getFullVersion(db, fromID,projectID,[]);
	if (!ret) throw new Error('Project version not found');

	const source = ret.source;
	const dmp = new window.diff_match_patch();
	const d = dmp.diff_main(source,toSource,false);
	const p = dmp.patch_make(source,toSource,d);
	const patchText = dmp.patch_toText(p);
	const srcRow = {from: fromID, projectID, to: toID, patch: patchText};
	return Object.assign(srcRow,metaRow);
}

function processSelectorNode(t, criteria, req){
	if (t.type === 'property') {
		switch (t.name) {
		case '.id':
			criteria['$projects.projectID$'] = t.value;
			break;
		case '.title':
			criteria.$title$ = {[Op.substring]: t.param};
			break;
		case ':me':
			criteria.$owner$ = req.user?.id;
			break;
		case '.author':
			criteria.$owner$ = t.value;
			break;
		case '.name':
			criteria.$minimisedTitle$ = {[Op.substring]: t.param}
			break;
		case '.parent':
		case ':parent':
			criteria.$parentProject$ = t.value;
			break;
		case '.listed':
			criteria.$publicVersion$ = {[Op.not]: null};
			break;
		}
	}
	if (t.type === 'tag') {
		if (!t.tag) return;
		criteria['$projects.projectID$'] = {[Op.in]: db.literal(`(SELECT projectID FROM tags WHERE tag LIKE '%${t.tag.substring(1).replaceAll("'", "''")}%')`)};
	}
	if (t.type === 'name') {
		if (!t.name) return;
		criteria[Op.or] = [
			{$title$: {[Op.substring]: t.name}},
			{$minimisedTitle$: {[Op.substring]: t.name}},
			{['$projects.projectID$']: {[Op.in]: db.literal(`(SELECT projectID FROM tags WHERE tag LIKE '%${t.name.replaceAll("'", "''")}%')`)}},
		];
	}
}

function parseCriteria(arr){
	if(!Array.isArray(arr) || arr.length == 1){
		if(arr == "AND" || arr == "OR")
			return "";
		return arr;
	}
	if(arr.length == 2)
		return parseCriteria(arr[1]);
	var connectionType = arr[0];

	arr.shift();
	var tmpArr = [];
	for(var j = 0; j < arr.length; j++){
		tmpArr.push(parseCriteria(arr[j]));
	}
	return "(" + tmpArr.join(" " + connectionType + " ") + ")";
}

function processNextRating(projectRows, unknownRatings,i,res){
	if(i == unknownRatings.length){
		for(let j = 0; j < projectRows.length; j++){
			if(projectRows[j].overallRating == undefined){
				projectRows[j].overallRating = projectRatings[projectRows[j].projectID];
				projectRows[j].numRatings = projectRatingsCount[projectRows[j].projectID];
			}
		}
		res.json(projectRows);
	}else{
		var getRatingsStmt = "SELECT count(1) as c,sum(stars) as s FROM projectratings WHERE projectID = ?";
		var projectID = unknownRatings[i];
		db.get(getRatingsStmt,projectID,function(err,row){
			if(err || row === undefined){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err:err});
			}
			projectRatings[projectID] = row.s;
			projectRatingsCount[projectID] = row.c;
			var overallRating = Number(row.s / row.c).toFixed(1);
			
			if(isNaN(overallRating))
				overallRating = null;
			
			var updateStarsStmt = "UPDATE projectstats SET avgStars = ? WHERE projectID = ?";
			db.run(updateStarsStmt, overallRating, projectID, function(err){
				if(err){
					logDBError(err);
					res.json({error: ERROR_SQL, description: "SQL Error", err:err});
				}
				processNextRating(projectRows,unknownRatings,i+1,res);
			});
		});
	}
}

function rectifySource(source) {
	let ast = new Eden.AST(source, undefined, {}, {noparse: true, noindex: true, version: 1});
	ast.next();

	let hasVersionName = false;
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
	}

	// Otherwise, needs fixing
	const script = ast.pSCRIPT();
	if (script.errors.length === 0) {
		return `"use cs3;"\n${source}`;
	} else {
		return `"use cs2;"\n${source}`;
	}
}

export default function(app) {
	db = app.db;

	app.get('/project/tags', async (req,res) => {
		try {
			const rows = await app.models.tags.findAll({
				where: {tag: {[Op.substring]: req.query.tag}},
				offset: 0,
				limit: 100,
			});
		
			const tags = {};
			
			for (let i=0; i<rows.length; i++) {
				let tmp = rows[i].tag.split(" ");
				for (let j=0; j<tmp.length; j++) {
					if (tmp[j] == req.query.tag) continue;
					if (tags[tmp[j]] === undefined) tags[tmp[j]] = 1;
					else tags[tmp[j]]++;
				}
			}

			// TODO: Broken
			var sorted = [];
			for (let x in tags) sorted.push(x);
			sorted.sort(function(a,b) {
				return tags[b] - tags[a];
			});

			res.json(sorted);
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
	});
	
	app.get('/project/activity', async (req,res) => {
		if (req.user.admin != 1) {
			res.status(403).json({error: ERROR_NOTADMIN, description: "Must be admin to see project activity"});
			return;
		}

		const query = {
			offset: req.query.offset || 0,
			limit: req.query.limit || 100,
			include: [app.models.oauthusers, app.models.projects],
			order: [['date','DESC']],
		};

		try {
			if (req.query.newerThan) {
				const refVersion = await app.models.projectversions.findOne({
					where: {saveID: req.query.newerThan},
					attributes: ['date'],
				});
				if (!refVersion) throw new Error('Bad newerThan');
				query.where = {date: {[Op.gt]: refVersion.date}}
			}

			const versions = await app.models.projectversions.findAll(query);
			const mapped = versions.map(version => ({
				name: version.oauthuser.name,
				saveID: version.saveID,
				projectID: version.projectID,
				date: version.date,
				title: version.project?.title || '[Missing Title]',
				readPassword: version.readPassword,
			}));
			res.json(mapped);
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
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
	
	app.get('/project/get', async (req,res) => {
		//ProjectID must be defined
		//Request should have 'from' and 'to', which gives the diff between the two versions
		//If both undefined, get full snapshot of latest version (with no diffs)
		//If 'from' undefined, get full snapshot of 'to' version (no diffs).
		//If 'to' undefined but from is defined, get diff from 'from' to latest version.

		const {projectID, readPassword, to, from, api} = req.query;
	
		if(!projectID) {
			logAPIError("/project/get", "projectID must be defined");
			return res.status(400).json({error: ERROR_NO_PROJECTID, description: "projectID must be defined" });
		}

		logAPI("/project/get", `id = ${projectID}`);
		
		var userID = -1;
		if(req.user != undefined){
			userID = req.user.id;
		}

		// Do a source rectification for new version
		const rectify = api >= 3;

		try {
			await db.transaction(async t => {
				let targetSaveID = null; 

				if (to){
					targetSaveID = to;
					const version = await getVersionInfo(targetSaveID,projectID,userID,readPassword,res);
					if (!version) return;
					const [saveID] = version;
					const metaRow = await getProjectMetaData(projectID, userID);
					const ret = await getFullVersion(db, saveID,projectID, metaRow);
					if (!ret) throw new Error('Project version not found');
					const source = rectify ? rectifySource(ret.source) : ret.source;
					const date = ret.date;

					if(from){
						res.json(await sendDiff(from,source,projectID,targetSaveID,metaRow));
					}else{
						const srcRow = {saveID, projectID,source, date, meta: metaRow};
						res.json(Object.assign(srcRow,metaRow));
					}
				} else {
					const saveID = await getMaxReadableSaveID(projectID, userID, res);
					const version = await getVersionInfo(saveID,projectID,userID, readPassword, res);
					if (!version) return;
					const metaRow = await getProjectMetaData(projectID, userID);
					const ret = await getFullVersion(db, saveID,projectID, metaRow);
					if (!ret) throw new Error('Project version not found');
					const source = rectify ? rectifySource(ret.source) : ret.source;
					const date = ret.date;

					metaRow.tags = metaRow.tags || '';

					if(from){
						res.json(await sendDiff(from,source,projectID,saveID,metaRow));
					}else{
						const srcRow = {saveID, projectID,source, date, meta: metaRow};
						res.json(Object.assign(srcRow,metaRow));
					}	
				}

				await increaseProjectDownloadStat(projectID, t);
			});
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
	});
	
	app.post('/project/rate', function(req,res){
		var userID = req.user.id;
		var starRating = req.body.stars;
		var projectID = req.body.projectID;
		var rateSQL = "UPDATE projectratings SET stars = ? WHERE projectID = ? AND userID = ?;";
		delete projectRatings[req.body.projectID];
		db.run(rateSQL,starRating,projectID,userID,function(err){
			if(err){
				res.json({error: ERROR_SQL, description: "SQL Error", err: err})
				return;
			}
			if(this.changes == 0){
				var insRateSQL = "INSERT INTO projectratings VALUES (?,?,?,NULL);";
				db.run(insRateSQL,projectID,userID,starRating,function(err){
					if(err){
						logDBError(err);
						res.json({error: ERROR_SQL, description: "SQL Error", err: err})
						return;
					}
					res.json({status: "INSERTED"});
				});
			}else{
				res.json({status: "UPDATED"});
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
	
	app.get('/project/search', async (req, res) => {
		logAPI("/project/search", `query = ${req.query.query}`);

		const where = {};
		const query = {
			//offset: req.query.offset || 0,
			// limit: req.query.limit || 50,
			// where,
			include: [
				{model: app.models.tags, attributes: ['tag']},
				{model: app.models.projectversions, as: 'versions', attributes: [[db.fn('MAX', db.col('versions.date')), 'date'],[db.fn('MAX', db.col('versions.saveID')), 'saveID']]},
				{model: app.models.oauthusers, as: 'user', where, attributes: ['name']},
				{model: app.models.projectstats, required: true, attributes: ['downloads', 'forks', 'avgStars']},
				{model: app.models.projectversions, as: 'public', attributes: ['saveID', 'date']},
				{model: app.models.projectratings},
			],
			group: 'projects.projectID',
			order: [[{model: app.models.projectversions, as: 'versions'}, 'date', 'DESC']],		
			attributes: {
				includes: [
					//[db.literal('(SELECT date FROM projectversions WHERE projectID = projects.projectID ORDER BY date DESC LIMIT 1)'),'date'],
					'projectID',
					'title',
					'minimisedTitle',
					'image',
					'owner',
					'publicVersion',
					'parentProject',
					'projectMetaData',
				],
			},
		};
	
		if(req.query.query && req.query.query != " "){
			const selectorAST = Eden.Selectors.parse(req.query.query.trim());
			if(selectorAST !== undefined){
				if(selectorAST.type == "intersection"){
					const criteriaList = [];
					where[Op.and] = criteriaList;
					for(var i = 0; i < selectorAST.children.length; i++){
						const criteria = {};
						if (!selectorAST.children[i]) continue;
						processSelectorNode(selectorAST.children[i], criteria, req);
						criteriaList.push(criteria);
					}
				}else{
					processSelectorNode(selectorAST, where, req);
				}
			}else{
				res.json([]);
				return;
			}
		}

		try {
			// saveID, projectID, title, minimisedTitle, image, owner, ownername, publicVersion, parentProject, projectMetaData, tags, date, downloads,forks, myrating, avgStars
			//console.log("Constructed query = ", JSON.stringify(query.where, '\n'));
			const projects = (await app.models.projects.findAll(query)).map(project => project.toJSON());
			const processed = projects.map(project => ({
				projectID: project.projectID,
				saveID: project.owner === req.user?.id ? project.versions?.[0]?.saveID : project.public?.saveID,
				date: project.owner === req.user?.id ? project.versions?.[0]?.date : project.public?.date,
				title: project.title,
				minimisedTitle: project.minimisedTitle,
				projectMetaData: project.projectMetaData,
				tags: project.tags || '',
				parentProject: project.parentProject,
				image: project?.image ? project.image.toString() : null,
				owner: project.owner,
				ownername: project.user.name,
				publicVersion: project.publicVersion,
				downloads: project.projectstat.downloads,
				forks: project.projectstat.forks,
				avgStars: project.projectstat.avgStars,
				overallRating: project.projectstat.avgStars,
				numRatings: 1,
			}));
			res.json(processed.filter(project => project.publicVersion || project.owner === req.user?.id));
		} catch(err) {
			logDBError(err);
			console.error(err);
			res.status(400).json({error: err.message});
		}
		
		/*var mineOnly = (criteriaVals["@mineOnly"] !== undefined) ? criteriaVals["@mineOnly"] : false;
		var listedOnly = (criteriaVals["@listedOnly"] !== undefined) ? criteriaVals["@listedOnly"] : false;
		
		if(criteriaVals["@mineOnly"] !== undefined)
			delete criteriaVals["@mineOnly"];
		if(criteriaVals["@listedOnly"] !== undefined)
			delete criteriaVals["@listedOnly"];
		
		var conditionStr = "";
		
		var tagConditionStr = "";
		if(tmpCriteria.length > 0){
			var tmpCStr = parseCriteria(tmpCriteria);
			if(tmpCStr.length > 0)
				tagConditionStr = "\n WHERE " + tmpCStr;
		}

		var listQueryStr;
		
		if(!mineOnly && !listedOnly){
			if(req.user == null)
				listedOnly = true;
		}
		
		var orderString = " order by date desc ";
		if(req.query.by){
			if(req.query.by == "downloads")
				orderString = " order by downloads desc ";
			if(req.query.by == "rating")
				orderString = " order by avgStars desc "
		}
		
		if(req.user == null)
			criteriaVals["@ratingsUser"] = -1;
		else
			criteriaVals["@ratingsUser"] = req.user.id;
			
		if(mineOnly){
			if(req.user == null) return res.json([]);
			listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner' + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
			criteriaVals["@owner"] = req.user.id;
		}else if(listedOnly){
			listQueryStr = getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID)' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
		}else{
			listQueryStr = getListQueryStr("view_latestVersion") + ' AND owner = @owner';
			criteriaVals["@owner"] = req.user.id;
			listQueryStr += conditionStr + ' group by projects.projectID)' + tagConditionStr;
			listQueryStr += " UNION " + getListQueryStr("view_listedVersion") + conditionStr + ' group by projects.projectID) ' + tagConditionStr + orderString + 'LIMIT @limit OFFSET @offset';
		}
	
		var listProjectStmt = db.prepare(listQueryStr);
		var unknownRatings = [];
	
		listProjectStmt.all(criteriaVals,function(err,rows){
			if(err){
				logDBError(err);
				res.json({error: ERROR_SQL, description: "SQL Error", err: err})
				return;
			}
			for(var i = 0; i < rows.length; i++){
				if(rows[i].tags){
					var tmpTags = rows[i].tags.split(" ");
					for(var j = tmpTags.length - 1; j >= 0; j--){
						if(tmpTags[j] == "")
							tmpTags.splice(j,1);
					}
					
					rows[i].tags = tmpTags;
				}
				var projectID = rows[i].projectID;
				if(projectRatings[projectID] !== undefined){
					rows[i].overallRating = projectRatings[projectID];
					rows[i].numRatings = projectRatingsCount[projectID];
				}else{
					unknownRatings.push(projectID);
				}
			}
			processNextRating(rows,unknownRatings,0,res);
		});*/
	});
	
	app.post('/project/remove',ensureAuthenticated, async (req,res) => {
		const {projectID} = req.body;
		const owner = req.user.id;

		try {
			await db.transaction(async transaction => {
				if (await checkOwner(req, res, projectID)) {
					let count = 0;
					count += await app.models.projects.update({publicVersion: null}, {where: {projectID}, transaction});
					count += await app.models.projectversions.destroy({where: {projectID}, transaction});
					count += await app.models.projectstats.destroy({where: {projectID}, transaction});
					count += await app.models.tags.destroy({where: {projectID}, transaction});
					count += await app.models.comments.destroy({where: {projectID}, transaction});
					count += await app.models.projectratings.destroy({where: {projectID}, transaction});
					count += await app.models.projects.destroy({
						where: {projectID, owner},
						transaction,
					});

					if (count > 0) {
						res.json({status: "deleted", changes: count});
					} else {
						res.json({error: ERROR_PROJECT_NOT_MATCHED, description: "Matching project not found"});
					}
				}
			});
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
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
	
	app.get('/project/versions', async (req, res) => {
		const {projectID, userID} = req.query;

		try {
			let versions;

			if (projectID) {
				versions = await app.models.projectversions.findAll({
					where: {projectID},
					include: app.models.oauthusers,
				});			
			} else if (userID) {
				versions = await app.models.projectversions.findAll({
					where: {author: userID},
					include: app.models.oauthusers,
					order: [['date', 'DESC']],
				});	
			}

			const mapped = versions.map(({projectID, saveID, date, parentDiff, author, oauthuser, readPassword}) => {
				return {
					projectID,
					saveID,
					date,
					parentDiff,
					author,
					name: oauthuser.name,
					private: readPassword ? 1 : 0,
				};
			});

			res.json(mapped);
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
	});

	/*
	* Title: Project Add
	* URL: /project/add
	* Method: POST
	* Data Params:
	* {
	* 	projectID: [integer],
	*  title: [string],
	*  minimisedTitle: [string],
	*  image: [base64 string],
	*  metadata: [json string],
	*  source: [string] source to be saved,
	*  tags: [string] separated by space
	* }
	* 
	* Success response: JSON object containing saveID and projectID
	* If no source provided, the title, minimisedTitle,image,metadata will 
	* be updated and will result in a JSON object with status "updated" and the projectID
	* 
	*/
	app.post('/project/add', ensureAuthenticated, async (req, res) => {
		// Should not happen
		if(typeof req.user == "undefined")
			return res.status(401).json({error: ERROR_UNAUTHENTICATED, description: "Unauthenticated"});

		const {projectID} = req.body;
		logAPI("/project/add", `project = ${projectID}`);
		
		try {
			await db.transaction(async t => {
				if (projectID === undefined || projectID === null || projectID === ""){
					const newID = await createProject(req, t);
					logAPI("/project/add", "New project id is " + newID);
					await addProjectVersion(req, res, newID, t);
				} else if (isNaN(projectID)){
					res.status(400).json({error: ERROR_INVALID_PROJECTID_FORMAT, description: "Invalid projectID format"});
				} else {
					if (await checkOwner(req,res, projectID)) {
						await updateProject(req, t);
						if (req.body.source === undefined){
							res.json({status:"updated", projectID});
						} else {
							await addProjectVersion(req, res, projectID, t);	
						}
					};
				}
			});
		} catch(err) {
			logDBError(err);
			res.status(400).json({error: err.message});
		}
	});

	/*
	* Title: Project Add
	* URL: /project/add
	* Method: POST
	* Data Params:
	* {
	*  source: [string],
	*  selector: [string]
	* }
	* 
	* Success response: 
	* Reindex then patch AST
	* 
	*/
	app.post('/project/patch', ensureAuthenticated, async (req, res) => {
		if(typeof req.user == "undefined")
			return res.status(401).json({error: ERROR_UNAUTHENTICATED, description: "Unauthenticated"});

		logAPI("/project/patch", `selector = ${req.body.selector}`);

		const sast = Eden.Selectors.parse(req.body.selector);
		
		if (sast.local) {
			res.json([]);
		} else {
			try {
				const p = await sast.filter();
				const astres = Eden.Selectors.unique(p);

				if(astres.length != 1 || astres[0].type != "script"){
					return false;
				}
				var parent = astres[0];
				while(parent.parent){
					parent = parent.parent;
				}
				if (await checkOwner(req,res)) {
					var newnode = Eden.AST.parseScript(req.body.source);
					astres[0].patchInner(newnode);
					res.json({status:"updated", projectID: parent.id});
				}
			} catch(err) {
				res.status(400).json({error: err.message});
			}
		}
	});

}