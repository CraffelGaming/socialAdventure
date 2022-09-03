
import { Column, Table, Model, Sequelize, PrimaryKey, DataType, AutoIncrement } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import json = require('./itemItem.json');
@Table({ tableName: "item", modelName: "item"})
export class ItemItem extends Model<ItemItem>{
    @PrimaryKey
    @Column
    handle: number;
    @Column
    value: string;
    @Column
    gold: number = 50;
    @Column
    type: number = 0;
    @Column
    categoryHandle: number = 1;

    constructor(){
        super();
    }

    static createTable({ sequelize }: { sequelize: Sequelize; }){
        sequelize.define('item', {
            handle: {
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            value: {
                type: DataTypes.STRING,
                allowNull: false
            },
            gold: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 50
            },
            categoryHandle: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            type: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
          }, {freezeTableName: true});
    }

    static setAssociation({ sequelize, isGlobal }: { sequelize: Sequelize, isGlobal: boolean; }){
        if(!isGlobal){
            sequelize.models.item.hasMany(sequelize.models.heroInventory, { as: 'inventory', foreignKey: 'itemhandle'});
        }
        sequelize.models.item.belongsTo(sequelize.models.itemCategory, { as: 'category', foreignKey: 'categoryHandle'});
    }

    static async updateTable({ sequelize, isGlobal }: { sequelize: Sequelize, isGlobal: boolean; }): Promise<void>{
        try{
            const items = JSON.parse(JSON.stringify(json)) as ItemItem[];

            for(const item of items){
                if(await sequelize.models.item.count({where: {handle: item.handle}}) === 0){
                    if(isGlobal === true && item.categoryHandle !== 1){
                        await sequelize.models.item.create(item as any);
                    } else if(isGlobal === false && item.categoryHandle === 1){
                        await sequelize.models.item.create(item as any);
                    }
                } else await sequelize.models.item.update(item, {where: {handle: item.handle}});
            }
        } catch(ex){
            global.worker.log.error(ex);
        }
    }
}

module.exports.default = ItemItem;