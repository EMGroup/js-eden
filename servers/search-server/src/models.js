export {default as oauthusers} from './models/oauthusers';
export {default as projects} from './models/projects';
export {default as projectversions} from './models/projectversions';
export {default as comments} from './models/comments';
export {default as tags} from './models/tags';
export {default as projectstats} from './models/projectstats';
export {default as projectratings} from './models/projectratings';
export {default as localusers} from './models/localusers';

export default function(db) {
	db.models.projects.belongsTo(db.models.oauthusers, {
		foreignKey: 'owner',
		as: 'user',
		allowNull: false,
	});

	db.models.projects.belongsTo(db.models.projectversions, {
		foreignKey: 'publicVersion',
		as: 'public',
		//sourceKey: 'publicVersion',
		allowNull: true,
		constraints: false,
	});

	db.models.projects.hasMany(db.models.projectversions, {
		foreignKey: 'projectID',
		as: 'versions',
		sourceKey: 'projectID',
		allowNull: false,
		constraints: false,
	});

	db.models.projects.hasOne(db.models.tags, {
		foreignKey: 'projectID',
		sourceKey: 'projectID',
		allowNull: true,
	});

	db.models.projects.hasOne(db.models.projectstats, {
		foreignKey: 'projectID',
		allowNull: true,
	});

	db.models.projects.hasMany(db.models.projectratings, {
		foreignKey: 'projectID',
		allowNull: true,
	});

	db.models.projectversions.belongsTo(db.models.projects, {
		foreignKey: 'projectID',
		sourceKey: 'projectID',
		allowNull: false,
	});

	db.models.projectversions.belongsTo(db.models.oauthusers, {
		foreignKey: 'author',
		sourceKey: 'userid',
		allowNull: false,
	});

	db.models.tags.belongsTo(db.models.projects, {
		foreignKey: 'projectID',
		sourceKey: 'projectID',
		allowNull: false,
	});

	db.models.comments.belongsTo(db.models.oauthusers, {
		foreignKey: 'author',
		key: 'userid',
		allowNull: true,
	});

	db.models.comments.belongsTo(db.models.projects, {
		foreignKey: 'projectID',
		key: 'projectID',
		allowNull: true,
	});
}
