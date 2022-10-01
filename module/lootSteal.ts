import { setMaxListeners } from "events";
import sequelize from "sequelize";
import { Model } from "sequelize-typescript";
import { AdventureItem } from "../model/adventureItem";
import { HeroItem } from "../model/heroItem";
import { HeroTraitItem } from "../model/heroTraitItem";
import { ItemItem } from "../model/itemItem";
import { LootItem } from "../model/lootItem";
import { Loot } from "./loot";

export class LootSteal {
    item: Model<ItemItem>;
    adventure: Model<AdventureItem>;
    itemHandle: number;
    targetHeroName: string;
    targetHero: Model<HeroItem>;
    sourceHeroName: string;
    sourceHero: Model<HeroItem>;
    loot: Loot;

    isSource: boolean = true;
    isTarget: boolean = true;
    isItem: boolean = true;
    isAdventure: boolean = true;
    isTimeout: boolean = true;
    isSteal: boolean = true;
    isLoose: boolean = true;
    isSelf: boolean = true;
    isActive: boolean = true;

    //#region Construct
    constructor(loot: Loot, sourceHeroName: string, targetHeroName: string = null, itemHandle: number = null){
        this.sourceHeroName = sourceHeroName;
        this.targetHeroName = targetHeroName;
        this.itemHandle = itemHandle;
        this.loot = loot;
    }
    //#endregion

    //#region Execute
    async execute(settings: LootItem) : Promise<boolean>{
        await this.loadElements();

        if(settings.isActive){
            if(this.item){
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, item ${this.item.getDataValue("value")}`);
                if(this.sourceHero){
                    global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, sourceHero ${this.sourceHero.getDataValue("name")}`);
                    if(this.loot.isDateTimeoutExpiredMinutes(new Date(this.sourceHero.getDataValue("lastSteal")), settings.minutes)){
                        global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, timeout expired`);
                        if(this.targetHero){
                            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, targetHero ${this.targetHero.getDataValue("name")}`);
                            if(this.sourceHero.getDataValue("name") !== this.targetHero.getDataValue("name")){
                                if(this.adventure){
                                    global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, adventure`);
                                    if(await this.isStealSuccess()){
                                        global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, succsess`);
                                        await this.save(this.sourceHero, this.sourceHero);
                                        return true;
                                    } else {
                                        global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, failed`);
                                        this.isSteal = false
                                        this.adventure = await this.getAdventure(this.sourceHero);

                                        if(this.adventure){
                                            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, adventure`);
                                            this.item = await this.loot.channel.database.sequelize.models.item.findByPk(this.adventure.getDataValue("itemHandle")) as Model<ItemItem>;
                                            if(this.isItem){
                                                this.isLoose = false;
                                                await this.save(this.sourceHero, this.targetHero);
                                            }
                                        }
                                    }
                                } else this.isAdventure = false;
                            }
                        } else this.isTarget = false;
                    } else this.isTimeout = false;
                } else this.isSource = false;
            } else this.isItem = false;
        } else this.isActive = false;

        return false;
    }

    async save(source: Model<HeroItem>, target: Model<HeroItem>){
        await this.adventure.destroy();
        const adventure = new AdventureItem(this.item.getDataValue("handle"), target.getDataValue("name"));
        await AdventureItem.put({sequelize: this.loot.channel.database.sequelize, element: adventure});
        source.setDataValue("lastSteal", new Date());
        await source.save();
    }

    async loadElements(){
        this.sourceHero = await this.loot.channel.database.sequelize.models.hero.findByPk(this.sourceHeroName) as Model<HeroItem>;

        if(this.itemHandle){
            this.item = await this.loot.channel.database.sequelize.models.item.findByPk(this.itemHandle) as Model<ItemItem>;
            if(this.item){
                this.adventure = await this.loot.channel.database.sequelize.models.adventure.findOne({ where: { itemHandle: this.item.getDataValue("handle") }}) as Model<AdventureItem>;
                if(this.adventure){
                    this.targetHero = await this.loot.channel.database.sequelize.models.hero.findByPk(this.adventure.getDataValue("heroName")) as Model<HeroItem>;
                }
            }
        } else if(this.targetHeroName){
            this.targetHero = await this.loot.channel.database.sequelize.models.hero.findByPk(this.targetHeroName) as Model<HeroItem>;

            if(this.targetHero){
                this.adventure = await this.getAdventure(this.targetHero);
                if(this.adventure){
                    this.item = await this.loot.channel.database.sequelize.models.item.findByPk(this.adventure.getDataValue("itemHandle")) as Model<ItemItem>;
                }
            }
        } else {
            this.adventure = await this.getAdventure();
            if(this.adventure){
                this.targetHero = await this.loot.channel.database.sequelize.models.hero.findByPk(this.adventure.getDataValue("heroName")) as Model<HeroItem>;
                this.item = await this.loot.channel.database.sequelize.models.item.findByPk(this.adventure.getDataValue("itemHandle")) as Model<ItemItem>;
            }
        }
    }

    async isStealSuccess() : Promise<boolean>{
        const sourceTrait = await this.loot.channel.database.sequelize.models.heroTrait.findByPk(this.sourceHero.getDataValue("name")) as Model<HeroTraitItem>;
        const targetTrait = await this.loot.channel.database.sequelize.models.heroTrait.findByPk(this.targetHero.getDataValue("name")) as Model<HeroTraitItem>;
        let targetResult = 0;
        let sourceResult = 0;

        if(sourceTrait && targetTrait){
            const sourceTrys = targetTrait.getDataValue("stealMultipler");
            const targetTrys = targetTrait.getDataValue("defenceMultipler");

            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence sourceTrys ${sourceTrys}`);
            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence targetTrys ${targetTrys}`);

            for(let i = 1; i <= sourceTrys; i++) {
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence source try ${i}`);
                const sourceDice = this.loot.getRandomNumber(0, 100);
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence source dice ${sourceDice}`);
                if(sourceDice > sourceResult){
                    sourceResult = sourceDice;
                }
            }

            for(let i = 1; i <= targetTrys; i++) {
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence target try ${i}`);
                const targetDice = this.loot.getRandomNumber(0, 100);
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence target dice ${targetDice}`);
                if(targetDice > targetResult){
                    targetResult = targetDice;
                }
            }

            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence source result ${sourceResult}`);
            global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence target result ${targetResult}`);

            if(sourceResult >= targetResult){
                global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence source win`);
                return true;
            }
        }

        global.worker.log.info(`node ${this.loot.channel.node.name}, module steal, silence target win`);
        return false;
    }
    //#endregion

    //#region Adventure
    async getAdventures(hero: Model<HeroItem> = null): Promise<Model<AdventureItem>[]>{
        if(hero){
            return await this.loot.channel.database.sequelize.models.adventure.findAll({ where: { heroName: hero.getDataValue("name") }}) as Model<AdventureItem>[];
        } else {
            return await this.loot.channel.database.sequelize.models.adventure.findAll({ where: { heroName: {[sequelize.Op.not]: this.sourceHero.getDataValue("name") }}}) as Model<AdventureItem>[];
        }
    }

    async getAdventure(hero: Model<HeroItem> = null): Promise<Model<AdventureItem>>{
        const adventures = await this.getAdventures(hero);

        if(adventures.length > 0){
            return adventures[this.loot.getRandomNumber(0, adventures.length -1)];
        }

        return null;
    }
    //#endregion
}