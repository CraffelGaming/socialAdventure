import { Channel } from "../controller/channel";
import { Command } from "../controller/command";
import { SayItem } from "../model/sayItem";
import { TranslationItem } from "../model/translationItem";
import { Module } from "./module";

export class Say extends Module {
    item: SayItem;
    countMessages: number;
    timer: NodeJS.Timer;
    lastCount: Date;

    //#region Construct
    constructor(translation: TranslationItem[], channel: Channel, item: SayItem){
        super(translation, channel, 'say');
        this.countMessages = 0;
        this.lastCount = new Date();
        this.item = item;
        this.automation();
    }
    //#endregion

    //#region Remove
    remove(){
        if(this.timer != null){
            clearInterval(this.timer);
        }
    }
    //#endregion

    //#region Execute
    async execute(command: Command){
        try{
            global.worker.log.trace(`module ${this.item.command} say execute`);

            if(this.item.isActive || command.source === this.channel.node.getDataValue("name")) {
                if(command.name.startsWith(this.item.command)){
                    command.name = command.name.replace(this.item.command, "");
    
                    const allowedCommand = this.commands.find(x => x.command === command.name);
                    if(allowedCommand){
                        if(!allowedCommand.isMaster || this.isOwner(command)){
                            if(command.name.length === 0) command.name = "shout";
                            command.name = command.name.replace("+", "plus");
                            command.name = command.name.replace("-", "minus");
                            return await this[command.name](command);
                        } else global.worker.log.warn(`not owner dedection ${this.item.command} ${command.name} blocked`);
                    } else global.worker.log.warn(`hack dedection ${this.item.command} ${command.name} blocked`);
                }
            } else {
                global.worker.log.trace(`module ${this.item.command} not active`);
            }
        } catch(ex){
            global.worker.log.error(`module ${this.item.command} error ${ex.message}`);
        }
        return '';
    }
    //#endregion

    //#region Automation
    automation(){
        this.timer = setInterval(
            async () => {
                if(this.item.isActive && this.item.minutes > 0){
                    const delayDifference = this.channel.countMessages - this.countMessages;
                    if(delayDifference >= this.item.delay){
                        global.worker.log.info(`node ${this.channel.node.name}, module ${this.item.command} last run ${new Date(this.item.lastRun)}...`);

                        if(this.isDateTimeoutExpiredMinutes(new Date(this.item.lastRun), this.item.minutes)){
                            try{
                                this.item.lastRun = new Date();
                                this.item.countRuns += 1;
                                this.countMessages = this.channel.countMessages;
                                await this.channel.database.sequelize.models.say.update(this.item, {where: {command: this.item.command}});
                                global.worker.log.info(`node ${this.channel.node.name}, module ${this.item.command} run after ${this.item.minutes} Minutes.`);
                                this.channel.puffer.addMessage(this.replacePlaceholder(null, this.item.text));
                            } catch(ex){
                                global.worker.log.error(`node ${this.channel.node.name}, module ${this.item.command} automation error.`);
                                global.worker.log.error(`exception ${ex.message}`);
                            }
                        } else {
                            global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed minutes: ${this.item.minutes}`);
                            global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed time elapsed: ${this.getDateDifferenceMinutes(new Date(this.item.lastRun))}`);
                        }
                    } else {
                        global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed delay: ${this.item.delay}`);
                        global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed delay diference: ${delayDifference}`);
                    }
                } else {
                    global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed active: ${this.item.isActive}`);
                    global.worker.log.trace(`node ${this.channel.node.name}, module ${this.item.command} not executed minutes: ${this.item.minutes}`);
                }
            },
            60000 // Alle 60 Sekunden prüfen
        );
    }
    //#endregion

    //#region Commands
    async plus(command: Command){
        if(this.item.text.includes('$counter') && this.item.isCounter && this.isDateTimeoutExpiredSeconds(this.lastCount, this.item.timeout)){
            this.lastCount = new Date();
            ++this.item.count;
            await this.channel.database.sequelize.models.say.increment('count', { by: 1, where: { command: this.item.command }});
            await this.channel.database.sequelize.models.say.increment('countUses', { by: 1, where: {command: this.item.command}});
            return this.replacePlaceholder(command, this.item.text.replace('$counter', this.item.count.toString()));
        }
        return '';
    }

    async minus(command: Command){
        if(this.item.text.includes('$counter') && this.item.isCounter && this.isDateTimeoutExpiredSeconds(this.lastCount, this.item.timeout)){
            this.lastCount = new Date();
            --this.item.count;
            await this.channel.database.sequelize.models.say.decrement('count', { by: 1, where: { command: this.item.command }});
            await this.channel.database.sequelize.models.say.increment('countUses', { by: 1, where: {command: this.item.command}});
            return this.replacePlaceholder(command, this.item.text.replace('$counter', this.item.count.toString()));
        }
        return '';
    }

    async start(command: Command = null){
        if(!this.item.isActive){
            this.item.isActive = true;
            this.item.count = 0;
            await this.channel.database.sequelize.models.say.update(this.item, {where: {command: this.item.command}});
            global.worker.log.trace(`module ${this.item.command} set active: ${this.item.isActive}`);
            return TranslationItem.translate(this.basicTranslation, "start");
        }
        else {
            global.worker.log.trace(`module ${this.item.command} already started.`);
            return TranslationItem.translate(this.basicTranslation, "alreadyStarted");
        }
    }

    async stop(command: Command = null){
        if(this.item.isActive){
            this.item.isActive = false;
            await this.channel.database.sequelize.models.say.update(this.item, {where: {command: this.item.command}});
            global.worker.log.trace(`module ${this.item.command} set active: ${this.item.isActive}`);
            return TranslationItem.translate(this.basicTranslation, "stop");
        }
        else {
            global.worker.log.trace(`module ${this.item.command} already stopped.`);
            return TranslationItem.translate(this.basicTranslation, "alreadyStopped");
        }
    }

    async interval(command: Command){
        if(command.parameters.length > 0){
               const interval =  parseInt(command.parameters[0], 10);
               if(!isNaN(interval) && interval > -1){
                    this.item.minutes = interval;
                    await this.channel.database.sequelize.models.say.update(this.item as any, {where: {command: this.item.command}});
                    return TranslationItem.translate(this.basicTranslation, "intervalChanged").replace("<interval>", command.parameters[0]);
               } else {
                    global.worker.log.trace(`module ${this.item.command} wrong interval parameter.`);
                    return TranslationItem.translate(this.basicTranslation, "noInterval");
               }
        } else {
            global.worker.log.trace(`module ${this.item.command} missing interval parameter.`);
            return TranslationItem.translate(this.basicTranslation, "noParameter");
        }
    }

    async delay(command: Command){
        if(command.parameters.length > 0){
            const delay =  parseInt(command.parameters[0], 10);
            if(!isNaN(delay) && delay > -1){
                this.item.delay = delay;
                await this.channel.database.sequelize.models.say.update(this.item as any, {where: {command: this.item.command}});
                return TranslationItem.translate(this.basicTranslation, "delayChanged").replace("<delay>", command.parameters[0]);
            } else {
                global.worker.log.trace(`module ${this.item.command} wrong delay parameter.`);
                return TranslationItem.translate(this.basicTranslation, "noDelay");
            }
        } else {
            global.worker.log.trace(`module ${this.item.command} missing delay parameter.`);
            return TranslationItem.translate(this.basicTranslation, "noParameter");
        }
    }

    async text(command: Command){
        if(command.parameters.length > 0) {
            this.item.text = command.parameters[0];
            await this.channel.database.sequelize.models.say.update(this.item as any, {where: {command: this.item.command}});
            global.worker.log.trace(`module ${this.item.command} text changed active: ${this.item.text}`);
            return TranslationItem.translate(this.basicTranslation, "textChanged").replace("<text>", command.parameters[0]);
        } else {
            global.worker.log.trace(`module ${this.item.command} missing text parameter.`);
            return TranslationItem.translate(this.basicTranslation, "noParameter");
        }
    }

    async shout(command: Command){
        if(this.item.isActive){
            if(this.item.text && this.item.text.length !== 0){
                await this.channel.database.sequelize.models.say.increment('countUses', { by: 1, where: {command: this.item.command}});
                global.worker.log.trace(`module ${this.item.command} shout executed`);

                if(this.item.isCounter){
                    this.item.text = this.item.text.replace('$counter', this.item.count.toString());
                }

                return this.replacePlaceholder(command, this.item.text);
             }
             else {
                global.worker.log.trace(`module ${this.item.command} shout nothign to say`);
                return TranslationItem.translate(this.basicTranslation, "nothingToSay").replace("<module>", this.item.command);
             }
        } else {
            global.worker.log.trace(`module ${this.item.command} not running`);
            return TranslationItem.translate(this.basicTranslation, "notRunning");
        }
    }
    //#endregion
}