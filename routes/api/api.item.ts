import * as express from 'express';
const router = express.Router();
const endpoint = 'item';

router.get('/' + endpoint + '/:node/', async (request: express.Request, response: express.Response) => {
    global.worker.log.trace('GET ' + endpoint);
    let node = request.params.node;

    if(node === 'default')
        node = global.defaultNode(request, response);

    const channel = global.worker.channels.find(x => x.node.name === node )

    if(channel) {
        const item = await channel.database.sequelize.models.item.findAll({order: [ [ 'handle', 'ASC' ]], raw: false});
        if(item) response.status(200).json(item);
        else response.status(404).json();
    } else response.status(404).json();
});

export default router;