import { AdventureItem } from "../model/adventureItem.js";
import { HeroItem } from "../model/heroItem.js";
export class LootExploring {
    //#region Construct
    constructor(loot) {
        this.experience = 0;
        this.gold = 0;
        this.damage = 0;
        this.isWinner = true;
        this.loot = loot;
    }
    //#endregion
    //#region Execute
    async execute() {
        this.hero = await this.getHero();
        if (this.hero) {
            this.dungeon = await this.getDungeon();
            global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, hero ${this.hero.getDataValue("name")}`);
            if (this.dungeon) {
                this.item = await this.getItem(this.dungeon);
                global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, dungeon ${this.dungeon.getDataValue("name")}`);
                if (this.item) {
                    this.enemy = await this.getEnemy(this.dungeon);
                    global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, item ${this.item.getDataValue("value")}`);
                    if (this.enemy) {
                        global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, enemy ${this.enemy.getDataValue("name")}`);
                        this.wallet = await this.getWallet();
                        this.trait = await this.getTrait();
                        this.experience = this.loot.getRandomNumber(this.enemy.getDataValue("experienceMin"), this.enemy.getDataValue("experienceMax")) + this.wallet.getDataValue("blood");
                        this.gold = this.loot.getRandomNumber(this.enemy.getDataValue("goldMin"), this.enemy.getDataValue("goldMax")) + this.wallet.getDataValue("blood");
                        this.gold = Math.round(this.gold * ((this.trait.getDataValue("goldMultipler") / 10) + 1));
                        this.fight();
                        return true;
                    }
                }
            }
        }
        return false;
    }
    //#endregion
    //#region Fight
    async fight() {
        let enemyHitpoints = this.enemy.getDataValue("hitpoints");
        const heroHitpoints = this.hero.getDataValue("hitpoints");
        global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight enemyHitpoints ${enemyHitpoints}`);
        global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight heroHitpoints ${heroHitpoints}`);
        while (enemyHitpoints > 0 && heroHitpoints - this.damage > 0) {
            const heroDamage = this.loot.getRandomNumber(Math.round(this.hero.getDataValue("strength") / 2), this.hero.getDataValue("strength"));
            enemyHitpoints -= heroDamage;
            global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight heroDamage ${heroDamage}`);
            global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight enemyHitpoints ${enemyHitpoints}`);
            if (enemyHitpoints > 0) {
                const enemyDamage = this.loot.getRandomNumber(Math.round(this.enemy.getDataValue("strength") / 2), this.enemy.getDataValue("strength"));
                this.damage += Math.round(enemyDamage / 100 * (100 - this.trait.getDataValue("defenceMultipler")) / 2);
                global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight enemyDamage ${enemyDamage}`);
                global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight complete damage ${this.damage}`);
            }
        }
        if (this.damage >= heroHitpoints) {
            this.isWinner = false;
            this.damage = heroHitpoints;
        }
        else {
            this.isWinner = true;
        }
        global.worker.log.info(`node ${this.loot.channel.node.getDataValue('name')}, module exploring, fight isWinner ${this.isWinner}`);
    }
    //#endregion
    //#region Save
    async save() {
        if (this.isWinner) {
            const adventure = new AdventureItem(this.item.getDataValue("handle"), this.hero.getDataValue("name"));
            await this.loot.channel.database.sequelize.models.adventure.create(adventure);
            await this.loot.channel.database.sequelize.models.heroWallet.increment('gold', { by: this.gold, where: { heroName: this.hero.getDataValue("name") } });
            await this.hero.increment('experience', { by: this.experience });
            await this.hero.decrement('hitpoints', { by: this.damage });
            await HeroItem.calculateHero({ sequelize: this.loot.channel.database.sequelize, element: this.hero.get() });
        }
        else {
            await this.loot.channel.database.sequelize.models.hero.decrement('hitpoints', { by: this.damage, where: { name: this.hero.getDataValue("name") } });
        }
    }
    //#endregion
    //#region Hero
    async getHero() {
        let heroes = await this.loot.channel.database.sequelize.models.hero.findAll({ where: { isActive: true } });
        heroes = heroes.filter(x => x.getDataValue("hitpoints") > 0);
        if (heroes.length > 0) {
            return heroes[this.loot.getRandomNumber(0, heroes.length - 1)];
        }
        return null;
    }
    //#endregion
    //#region Dungeon
    async getDungeons() {
        const dungeons = await this.loot.channel.database.sequelize.models.location.findAll({ where: { isActive: true } });
        const found = [];
        for (const dungeon in dungeons) {
            if ((await this.getItems(dungeons[dungeon])).length > 0) {
                found.push(dungeons[dungeon]);
            }
        }
        return found;
    }
    async getDungeon() {
        const found = await this.getDungeons();
        return found[this.loot.getRandomNumber(0, found.length - 1)];
        ;
    }
    //#endregion
    //#region Item
    async getItems(dungeon) {
        const adventures = await this.loot.channel.database.sequelize.models.adventure.findAll();
        let items = await this.loot.channel.database.sequelize.models.item.findAll({ where: { categoryHandle: dungeon.getDataValue("categoryHandle") } });
        for (const adventure in adventures) {
            if (adventures[adventure]) {
                items = items.filter(x => x.getDataValue("handle") !== adventures[adventure].getDataValue("itemHandle"));
            }
        }
        return items;
    }
    async getItem(dungeon) {
        const items = await this.getItems(dungeon);
        return items[this.loot.getRandomNumber(0, items.length - 1)];
    }
    //#endregion
    //#region Enemy
    async getEnemy(dungeon) {
        const enemies = await this.loot.channel.database.sequelize.models.enemy.findAll({ where: { difficulty: dungeon.getDataValue("difficulty") } });
        if (enemies.length > 0) {
            return enemies[this.loot.getRandomNumber(0, enemies.length - 1)];
        }
        return null;
    }
    //#endregion
    //#region Wallet
    async getWallet() {
        const wallet = await this.loot.channel.database.sequelize.models.heroWallet.findByPk(this.hero.getDataValue("name"));
        const blood = this.loot.settings.find(x => x.getDataValue("command") === "blood");
        if (wallet) {
            if (this.loot.isDateTimeoutExpiredMinutes(new Date(wallet.getDataValue("lastBlood")), blood.getDataValue("minutes"))) {
                wallet.setDataValue("blood", 0);
                wallet.save();
            }
            return wallet;
        }
        return null;
    }
    //#endregion
    //#region Trait
    async getTrait() {
        const trait = await this.loot.channel.database.sequelize.models.heroTrait.findByPk(this.hero.getDataValue("name"));
        if (trait) {
            return trait;
        }
        return null;
    }
}
//# sourceMappingURL=lootExploring.js.map