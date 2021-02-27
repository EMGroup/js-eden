import { DataTypes } from 'sequelize';

export default {
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
