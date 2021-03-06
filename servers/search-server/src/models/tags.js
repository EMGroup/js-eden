import { DataTypes } from 'sequelize';

export default {
	projectID: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
	},
	tag: {
		type: DataTypes.STRING,
		allowNull: false,
	},
};
