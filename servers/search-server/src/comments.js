import {ERROR_SQL, ERROR_NOTADMIN, ERROR_INVALID_FORMAT, ERROR_COMMENT_NOT_MATCHED} from './errors';
import {ensureAuthenticated,logAPI,logDBError} from './common';
import {Op} from 'sequelize';

export default function(app) {
	const db = app.rawdb;

	app.post('/comment/post', ensureAuthenticated, async (req,res) => {
		if(req.body.publiclyVisible != 0 && req.body.publiclyVisible != 1) {
			res.status(400).json({error: ERROR_INVALID_FORMAT, description: "Invalid range for 'publiclyVisible'"});
			return;
		};

		logAPI('/comment/post', JSON.stringify(req.body));

		try {
			const result = await app.models.comments.create({
				projectID: req.body.projectID,
				versionID: req.body.versionID,
				public: req.body.publiclyVisible,
				comment: req.body.comment,
				author: req.user.id,
			});

			res.json({commentID: result.commentID});
		} catch (err) {
			logDBError('/comment/search', err);
			res.status(400).json({error: ERROR_SQL, description: "Could not save comment"});
		}	  
	});

	app.post('/comment/delete', ensureAuthenticated, async (req,res) => {
		try {
			const count = await app.models.comments.destroy({
				where: {
					commentID: req.body.commentID,
					author: req.user.id,
				},
			});

			if (count === 1) {
				res.json({status: "deleted", changes: 1});
			} else {
				res.status(400).json({error: ERROR_COMMENT_NOT_MATCHED, description: "Matching project not found"});	
			}
		} catch (err) {
			logDBError('/comment/search', err);
			res.status(400).json({error: ERROR_SQL, description: "Error deleting comment"});
		}
	});

	app.get('/comment/search', async (req,res) => {
		const userId = req.user ? req.user.id : -1;
		try {
			const results = await app.models.comments.findAll({
				where: {
					projectID: req.query.projectID,
					[Op.or]: [
						{public: 1},
						{public: 0, author: userId},
					],
					commentID: { [Op.gt]: req.query.newerThan || 0 },
				},
				offset: req.query.offset || 0,
				limit: req.query.limit || 100,
				include: app.models.oauthusers,
				order: [['date', 'DESC']],
			});

			const mapped = results.map(result => {
				const json = result.toJSON();
				return {
					...json,
					oauthuser: undefined,
					name: json.oauthuser && json.oauthuser.name,
				};
			});

			res.json(mapped);
		} catch (err) {
			logDBError('/comment/search', err);
			res.status(400).json({error: ERROR_SQL, description: "Error getting comments"});
		}
	});

	app.get('/comment/activity', async (req,res) => {
		if (!req.user || req.user.admin !== 1) {
			logAPIError('/comment/activity', 'Non-admin request');
			res.status(403).json({error: ERROR_NOTADMIN, description: "Must be admin to see comment activity"});
			return;
		}

		try {
			const results = await app.models.comments.findAll({
				where: {
					commentID: { [Op.gt]: req.query.newerThan || 0 },
					public: 1,
				},
				include: [app.models.oauthusers, app.models.projects],
				offset: req.query.offset || 0,
				limit: req.query.limit || 100,
				order: [['date', 'DESC']],
			});

			const mapped = results.map(result => {
				const json = result.toJSON();
				return {
					...json,
					oauthuser: undefined,
					project: undefined,
					name: json.oauthuser && json.oauthuser.name,
					title: json.project.title,
				};
			});

			res.json(mapped);
		} catch (err) {
			logDBError('/comment/activity', err);
			res.status(400).json({error: ERROR_SQL, description: "Error getting activity"});
		}
	});
}
