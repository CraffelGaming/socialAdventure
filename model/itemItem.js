"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemItem = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_1 = require("sequelize");
const json = require("./itemItem.json");
let ItemItem = class ItemItem extends sequelize_typescript_1.Model {
    constructor() {
        super();
        this.gold = 50;
        this.type = 0;
        this.categoryHandle = 1;
    }
    static createTable({ sequelize }) {
        sequelize.define('item', {
            handle: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            value: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false
            },
            gold: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 50
            },
            categoryHandle: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            type: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            }
        }, { freezeTableName: true });
    }
    static setAssociation({ sequelize, isGlobal }) {
        if (!isGlobal) {
            sequelize.models.item.hasMany(sequelize.models.heroInventory, { as: 'inventory', foreignKey: 'itemHandle' });
            sequelize.models.item.hasOne(sequelize.models.adventure, { as: 'adventure', foreignKey: 'itemHandle' });
        }
        sequelize.models.item.belongsTo(sequelize.models.itemCategory, { as: 'category', foreignKey: 'categoryHandle' });
    }
    static updateTable({ sequelize, isGlobal }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const items = JSON.parse(JSON.stringify(json));
                for (const item of items) {
                    if ((yield sequelize.models.item.count({ where: { handle: item.handle } })) === 0) {
                        if (isGlobal === true && item.categoryHandle !== 1) {
                            yield sequelize.models.item.create(item);
                        }
                        else if (isGlobal === false && item.categoryHandle === 1) {
                            yield sequelize.models.item.create(item);
                        }
                    }
                    else
                        yield sequelize.models.item.update(item, { where: { handle: item.handle } });
                }
            }
            catch (ex) {
                global.worker.log.error(ex);
            }
        });
    }
    static put({ sequelize, element }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (element.handle != null && element.handle > 0) {
                    const item = yield sequelize.models.item.findByPk(element.handle);
                    if (item) {
                        yield sequelize.models.item.update(element, { where: { handle: element.handle } });
                        return 201;
                    }
                }
                else {
                    if (element.value != null && element.value.length > 0) {
                        yield sequelize.models.item.create(element);
                        return 201;
                    }
                    else
                        return 406;
                }
            }
            catch (ex) {
                global.worker.log.error(ex);
                return 500;
            }
        });
    }
};
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ItemItem.prototype, "handle", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", String)
], ItemItem.prototype, "value", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ItemItem.prototype, "gold", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ItemItem.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], ItemItem.prototype, "categoryHandle", void 0);
ItemItem = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: "item", modelName: "item" }),
    __metadata("design:paramtypes", [])
], ItemItem);
exports.ItemItem = ItemItem;
module.exports.default = ItemItem;
//# sourceMappingURL=itemItem.js.map