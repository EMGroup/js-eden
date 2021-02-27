import { DataTypes } from 'sequelize';

export default {
	saveID: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		autoIncrement: true,
	},
	projectID: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	fullsource: {
		type: DataTypes.STRING,
	},
	forwardPatch: {
		type: DataTypes.STRING,
	},
	backwardPatch: {
		type: DataTypes.STRING,
	},
	date: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
	parentDiff: {
		type: DataTypes.INTEGER,
	},
	readPassword: {
		type: DataTypes.STRING,
	},
	author: {
		type: DataTypes.INTEGER,
	},
};
