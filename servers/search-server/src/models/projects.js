import { DataTypes } from 'sequelize';

export default {
	projectID: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false,
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
	writePassword: {
		type: DataTypes.STRING,
	},
};
