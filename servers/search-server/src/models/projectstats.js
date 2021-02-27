import { DataTypes } from 'sequelize';

export default {
	projectID: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
	},
	downloads: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	forks: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	stars: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	avgStars: {
		type: DataTypes.REAL,
		defaultValue: 0.0,
	}
};
