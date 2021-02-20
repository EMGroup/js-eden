import { DataTypes } from 'sequelize';

export const oauthusers = {
	userid: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	oauthstring: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	name: {
		type: DataTypes.STRING,
	},
	status: {
		type: DataTypes.STRING,
	},
};

export const projects = {
	projectID: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	minimisedTitle: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	image: {
		type: DataTypes.BLOB,
	},
	owner: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	publicVersion: {
		type: DataTypes.INTEGER,
	},
	parentProject: {
		type: DataTypes.INTEGER,
	},
	projectMetaData: {
		type: DataTypes.STRING,
	},
};

export const comments = {
	commentID: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	projectID: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	versionID: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	date: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
	author: {
		type: DataTypes.INTEGER,
	},
	public: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	comment: {
		type: DataTypes.STRING,
		allowNull: false,
	},
};

export default function(db) {
	db.models.projects.belongsTo(db.models.oauthusers, {
		foreignKey: 'owner',
		key: 'userid',
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
