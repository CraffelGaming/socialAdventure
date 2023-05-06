import { Model } from "sequelize";
import { NodeItem } from "../model/nodeItem.js";

export class Puffer {
    messages: string[];
    node: Model<NodeItem>;

    //#region Construct
    constructor(node: Model<NodeItem>) {
        this.messages = [];
        this.node = node;
    }
    //#endregion

    //#region Message
    addMessage(message: string) {
        try {
            if (message && message.length > 0) {
                global.worker.log.trace(`message push ${message}`);
                this.messages.push(message);
            }
        } catch (ex) {
            global.worker.log.error(`puffer error - function addMessage - ${ex.message}`);
        }
    }

    addMessages(messages: string[]) {
        try {
            for (const key in messages) {
                if (messages.hasOwnProperty(key)) {
                    if (messages[key] && messages[key].length > 0) {
                        global.worker.log.trace(`message push ${messages[key]}`);
                        this.messages.push(messages[key]);
                    }
                }
            }
        } catch (ex) {
            global.worker.log.error(`puffer error - function addMessages - ${ex.message}`);
        }
    }
    //#endregion

    //#region Interval
    interval() {
        setInterval(
            () => {
                try {
                    if (this.messages.length > 0) {
                        const message = this.messages.shift();
                        global.worker.log.trace(`message shift ${message}`);
                        global.worker.tmi.say(this.node.getDataValue('name'), message);
                    }
                } catch (ex) {
                    global.worker.log.error(`puffer error - function interval - ${ex.message}`);
                }
            },
            1000 * 1.4 // 1.4 Sekunde(n)
        );
    }
    //#endregion
}