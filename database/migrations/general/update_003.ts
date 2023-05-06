import { DataTypes, QueryInterface } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

export async function up(queryInterface: QueryInterface, sequelize: Sequelize) {
  return Promise.all([
    queryInterface.addColumn(
      'say',
      'shortcuts',
      {
        type: DataTypes.STRING,
        allowNull: true
      },
    )
  ]);
}

export async function down(queryInterface: QueryInterface, sequelize: Sequelize) {
  return Promise.all([
    queryInterface.removeColumn('say', 'shortcuts')
  ]);
}