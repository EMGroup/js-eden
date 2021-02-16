import db from './database';
import {getFullVersion, logAPI} from './common';
import 'colors';

const allKnownProjects = {};

const vstmtStr = "select projects.projectID as projectID,view_listedVersion.saveID as saveID,title,minimisedTitle,projectMetaData,ifnull(group_concat(tag, \" \"),\"\") as tags, view_listedVersion.date as date," +
 		" name as authorname from view_listedVersion, projects, oauthusers left join tags on projects.projectID = tags.projectID where " +
		"projects.projectID = view_listedVersion.projectID and owner = oauthusers.userid";

const vstmt = db.prepare(vstmtStr + " group by projects.projectid");

function initASTDB(cb){
	vstmt.all(function(err,rows){
		const status = {
			count: 0,
			errors: 0,
			version2: 0,
			version3: 0,
		};

		console.log("Parser Default: ", Eden.AST.version);

		if(err){
			console.log("Error: " + err);
		}
		for(var i = 0; i < rows.length; i++){
			rows[i].stamp = new Date(rows[i].date).getTime();
			// console.log("Parsing row " + i, rows[i]);
			getFullVersion(rows[i].saveID, rows[i].projectID, rows[i], function(data) {
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
					cb();
				}
			});
		}

	});
}

export function reindexProject(projectID){
	var myVStmt = db.prepare(vstmtStr + " and projects.projectID = @projectID");
	
	var params = {};
	params["@projectID"] = projectID;
	
	myVStmt.all(params,function(err,rows){
		if(err){
			log("Error: " + err);
			return;
		}else{
			var row = rows[0];
			getFullVersion(row.saveID, row.projectID,row,function(data){
				if(allKnownProjects[row.projectID])
					allKnownProjects[row.projectID].destroy();

				var tmpAst = new Eden.AST(data.source,undefined,{id: row.projectID, saveID: row.saveID, name: data.meta.minimisedTitle, title: data.meta.title, tags: data.meta.tags.split(" "), author: data.meta.authorname, stamp: data.meta.stamp});

				allKnownProjects[row.projectID] = tmpAst.script;
			});
		}
	});
}

export default function(app) {
	app.get('/code/search', function(req, res){
			var sast = Eden.Selectors.parse(req.query.selector);
	
			if (sast.local) {
				res.json([]);
			} else {
				sast.filter().then((p) => {
					var nodelist = Eden.Selectors.unique(p);
					var outtype = "standalone_outersource";
					if(req.query.outtype !== undefined) {
						outtype = req.query.outtype;
					}
					var srcList = Eden.Selectors.processResults(nodelist, outtype);

					if (outtype.includes('standalone_outersource')) {
						logAPI("/code/search", `'${req.query.selector}'`);
					}
	
					res.json(srcList);
				}).catch(error => { console.error("Query error for: "+req.body.selector+" - "+error); });
			}
	});
	
	app.get('/code/get', function(req, res){
			var sast = Eden.Selectors.parse(req.query.selector);
	
			if (sast.local) {
				res.json([]);
			} else {
				sast.filter().then((p) => {
					var nodelist = Eden.Selectors.unique(p);
					var srcList = Eden.Selectors.processResults(nodelist, "standalone_outersource");

					if (outtype === 'standalone_outersource') {
						logAPI("/code/get", `'${req.query.selector}'`);
					}
	
					if(srcList.length == 0){
						res.json({"error":"Not found"});
						return;
					}
					if(parseInt(req.query.timestamp) < nodelist[0].stamp){
						res.json({timestamp: nodelist[0].stamp, src: srcList[0]});
						return;
					}
					res.json({});
				}).catch(error => { console.error("Query error for: "+req.body.selector+" - "+error); });
			}
	});

	return new Promise((resolve, reject) => {
		initASTDB(() => resolve());
	});
}
