import * as express from 'express';
import { NodeItem } from '../../model/nodeItem';
import { LootItem } from '../../model/lootItem';
const router = express.Router();
const endpoint = 'loot';

router.get('/' + endpoint + '/:node/', async (request: express.Request, response: express.Response) => {
    global.worker.log.trace(`get ${endpoint}, node ${request.params.node}`);
    let node: NodeItem;

    if(request.params.node === 'default')
        node = await global.defaultNode(request, response);
    else node = await global.worker.globalDatabase.sequelize.models.node.findByPk(request.params.node) as NodeItem;

    const channel = global.worker.channels.find(x => x.node.name === node.name)

    if(channel) {
        const item = await channel.database.sequelize.models.loot.findAll({order: [ [ 'command', 'ASC' ]], raw: true});
        if(item) response.status(200).json(item);
        else response.status(404).json();
    } else response.status(404).json();
});

router.put('/' + endpoint + '/:node/', async (request: express.Request, response: express.Response) => {
    global.worker.log.trace(`put ${endpoint}, node ${request.params.node}`);
    let node: NodeItem;

    if(request.params.node === 'default')
        node = await global.defaultNode(request, response);
    else node = await global.worker.globalDatabase.sequelize.models.node.findByPk(request.params.node) as NodeItem;

    const channel = global.worker.channels.find(x => x.node.name === node.name)

    if(channel) {
        if(global.isMaster(request, response, node)){
            if(request.body.command != null && request.body.command.length > 0){
                const item = await channel.database.sequelize.models.loot.findByPk(request.body.command) as unknown as LootItem;
                if(item){
                    await channel.database.sequelize.models.loot.update(request.body, {where: {command: request.body.command}});
                } else {
                    await channel.database.sequelize.models.loot.create(request.body as any);
                }
                response.status(201).json(request.body);
            } else {
                response.status(406).json();
            }
        } else {
            response.status(403).json();
        }
    } else response.status(404).json();
});

router.delete('/' + endpoint + '/:node/:command', async (request: express.Request, response: express.Response) => {
    global.worker.log.trace(`delete ${endpoint}, node ${request.params.node}, command ${request.params.command}`);
    let node: NodeItem;

    if(request.params.node === 'default')
        node = await global.defaultNode(request, response);
    else node = await global.worker.globalDatabase.sequelize.models.node.findByPk(request.params.node) as NodeItem;

    const channel = global.worker.channels.find(x => x.node.name === node.name)

    if(channel) {
        if(global.isMaster(request, response, node)){
            if(request.params.command != null){
                const item = await channel.database.sequelize.models.say.findByPk(request.params.command) as unknown as LootItem;
                if(item){
                    await channel.database.sequelize.models.say.destroy({ where: { command: request.params.command} });
                }
                response.status(204).json();
            } else response.status(404).json();
        } else {
            response.status(403).json();
        }
    } else response.status(404).json();
});
export default router;