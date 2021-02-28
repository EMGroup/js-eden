import { DataTypes } from 'sequelize';

export default {
	localuserID: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	emailaddress: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	hashedPassword: {
		type: DataTypes.STRING,
		allowNull: false,
	},
};
