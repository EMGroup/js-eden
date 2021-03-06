import { DataTypes } from 'sequelize';

export default {
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
