import {getFullVersion, logAPI, logAPIError} from './common';
import {QueryTypes} from 'sequelize';
import 'colors';

const allKnownProjects = {};
let db;

const vstmtStr = "select projects.projectID as projectID,view_listedVersion.saveID as saveID,title,minimisedTitle,projectMetaData,ifnull(group_concat(tag, \" \"),\"\") as tags, view_listedVersion.date as date," +
 		" name as authorname from view_listedVersion, projects, oauthusers left join tags on projects.projectID = tags.projectID where " +
		"projects.projectID = view_listedVersion.projectID and owner = oauthusers.userid";

async function initASTDB(){
	console.log('Parsing...'.green);
	const rows = await db.query(
		vstmtStr + " group by projects.projectid",
		{
			type: QueryTypes.SELECT,
		}
	);
	const status = {
		count: 0,
		errors: 0,
		version2: 0,
		version3: 0,
	};

	console.log("Parser Default: ", Eden.AST.version);

	for(var i = 0; i < rows.length; i++){
		rows[i].stamp = new Date(rows[i].date).getTime();
		// console.log("Parsing row " + i, rows[i]);
		const data = await getFullVersion(db, rows[i].saveID, rows[i].projectID, rows[i]);
		if (!data) continue;
		const origin = {
			id: data.meta.projectID,
			saveID: data.meta.saveID,
			name: data.meta.minimisedTitle,
			title: data.meta.title,
			tags: data.meta.tags.split(" "),
			author: data.meta.authorname,
			stamp: data.meta.stamp
		};

		let tmpAst = new Eden.AST(
			data.source,
			undefined,
			origin,
			{version: 1}
		);

		// Try with older parser
		if (tmpAst.hasErrors()) {
			tmpAst = new Eden.AST(
				data.source,
				undefined,
				origin,
				{version: 0}
			);
		}
		
		if (tmpAst.hasErrors()) {
			console.log(`${"Error".red.bold} : "${data.meta.title.bold} (${('' + data.meta.projectID).blue})" : ${tmpAst.script.errors[0].messageText()}`);
			status.errors++;
		}

		if (tmpAst.version === 0) {
			status.version2++;
		} else {
			status.version3++;
		}
		
		allKnownProjects[data.meta.projectID] = tmpAst.script;
		status.count++;
		if (status.count === rows.length) {
			console.log(`Indexed ${status.count} construals, but ${status.errors} errored`);
			console.log(`Old construals = ${status.version2}, new = ${status.version3}`);
		}
	}
}

export async function reindexProject(projectID){
	const rows = await db.query(
		vstmtStr + " and projects.projectID = :projectID",
		{
			type: QueryTypes.SELECT,
			replacements: { projectID },
		}
	);

	for	(const row of rows){
		const data = await getFullVersion(db, row.saveID, row.projectID, row);
		if (!data) continue;
		const origin = {
			id: data.meta.projectID,
			saveID: data.meta.saveID,
			name: data.meta.minimisedTitle,
			title: data.meta.title,
			tags: data.meta.tags.split(" "),
			author: data.meta.authorname,
			stamp: data.meta.stamp
		};

		let tmpAst = new Eden.AST(
			data.source,
			undefined,
			origin,
			{version: 1}
		);

		// Try with older parser
		if (tmpAst.hasErrors()) {
			tmpAst = new Eden.AST(
				data.source,
				undefined,
				origin,
				{version: 0}
			);
		}
		
		if (tmpAst.hasErrors()) {
			console.log(`${"Error".red.bold} : "${data.meta.title.bold} (${('' + data.meta.projectID).blue})" : ${tmpAst.script.errors[0].messageText()}`);
			return false;
		}

		allKnownProjects[data.meta.projectID] = tmpAst.script;
	}

	return true;
}

export default async function(app, options) {
	db = app.db;

	app.get('/code/search', async (req, res) => {
		const sast = Eden.Selectors.parse(req.query.selector);

		if (req.query.outtype) {
			const split = req.query.outtype.split(',').map(t => t.trim());
			if (split.some(value => !Eden.Selectors.resultTypes[value])) {
				res.status(400).json({error: 'Bad outtype: ' + req.query.outtype});
				return;
			}
		}

		if (!sast || sast.local) {
			res.json([]);
		} else {
			try {
				const p = await sast.filter()
				const nodelist = Eden.Selectors.unique(p);
				let outtype = "standalone_outersource";
				if(req.query.outtype !== undefined) {
					outtype = req.query.outtype;
				}
				const srcList = Eden.Selectors.processResults(nodelist, outtype);

				if (outtype.includes('standalone_outersource')) {
					logAPI("/code/search", `'${req.query.selector}'`);
				}

				res.json(srcList);
			} catch (err) {
				logAPIError('/code/search', `For '${req.query.selector}' : ${err.toString()}`);
				res.status(400).json({error: "Code search failed"});
			}
		}
	});
	
	app.get('/code/get', async (req, res) => {
		const sast = Eden.Selectors.parse(req.query.selector);

		if (!sast || sast.local) {
			res.json([]);
		} else {
			try {
				const p = await sast.filter();
				const nodelist = Eden.Selectors.unique(p);
				const srcList = Eden.Selectors.processResults(nodelist, "standalone_outersource");

				logAPI("/code/get", `'${req.query.selector}'`);

				if(srcList.length == 0){
					res.json({"error":"Not found"});
					return;
				}
				if(parseInt(req.query.timestamp) < nodelist[0].stamp){
					res.json({timestamp: nodelist[0].stamp, src: srcList[0]});
					return;
				}
				res.json({});
			} catch (err) {
				logAPIError('/code/get', `For '${req.query.selector}' : ${err.toString()}`);
				res.status(400).json({error: "Code get failed"});
			}
		}
	});

	if (!options.noparse) {
		try {
			await initASTDB();
		} catch(err) {
			console.error(err.message.red);
			console.error(err);
		}
	}
}

export function createIndex(thedb) {
	db = thedb;
	return initASTDB();
}
