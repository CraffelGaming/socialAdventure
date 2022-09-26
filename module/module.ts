import { Channel } from "../controller/channel";
import { Command } from "../controller/command";
import { CommandItem } from "../model/commandItem";
import { TranslationItem } from "../model/translationItem";

export class Module {
    language: string;
    translation: TranslationItem[];
    basicTranslation: TranslationItem[];
    commands: CommandItem[];
    channel: Channel;
    lastRun: Date;
    name: string;
    //#region Construct
    constructor(translation : TranslationItem[], channel: Channel, name: string){
        this.translation = translation;
        this.channel = channel;
        this.name = name;
    }
    //#endregion

    //#region Initialize
    async initialize(){
        this.basicTranslation = await global.worker.globalDatabase.sequelize.models.translation.findAll({where: { page: 'module', language: this.channel.node.language }, order: [ [ 'handle', 'ASC' ]], raw: true}) as unknown as TranslationItem[];
        this.commands = await this.channel.database.sequelize.models.command.findAll({where: { module: this.name }, order: [ [ 'command', 'ASC' ]], raw: true}) as unknown as CommandItem[];
    }
    //#endregion

    //#region Owner
    isOwner(command : Command){
        let result = false;

        if(this.channel.node.name === command.source)
            result = true;

        global.worker.log.trace(`is owner: ${result}`);
        return result;
    }
    //#endregion

    //#region Placeholder
    replacePlaceholder(text: string) : string{
        text = text.replace('$streamer', this.channel.node.name);
        return text;
    }
    //#endregion

    //#region Date
    getDateDifferenceSeconds(date: Date): number {
        return Math.floor((Date.now() - date.getTime()) / 1000);
    }

    getDateDifferenceMinutes(date: Date): number {
        return Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    }

    isDateTimeoutExpiredMinutes(date: Date, timeout: number): boolean {
        return this.getDateDifferenceMinutes(date) > timeout;
    }

    isDateTimeoutExpiredSeconds(date: Date, timeout: number): boolean {
        return this.getDateDifferenceSeconds(date) > timeout;
    }

    getDateTimeoutRemainingMinutes(date: Date, timeout: number): number {
        const diff = this.getDateDifferenceMinutes(date);
        return diff >= timeout ? 0 : timeout - diff;
    }

    getDateTimeoutRemainingSeconds(date: Date, timeout: number): number {
        const diff = this.getDateDifferenceMinutes(date);
        return diff >= timeout ? 0 : timeout - diff;
    }
    //#endregion

    //#region Random
    getRandomNumber(min: number, max: number): number {
        const random = Math.floor(Math.random() * (max - min + 1) + min);
        global.worker.log.trace(`node ${this.channel.node.name}, new random number ${random} between ${min} and ${max}`);
        return random;
    }
    //#endregion
}