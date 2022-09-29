import * as express from 'express';

const router = express.Router();
const endpoint = 'placeholder';

router.get('/' + endpoint + '/', async (request: express.Request, response: express.Response) => {
    global.worker.log.trace(`get ${endpoint}`);
    const item = await global.worker.globalDatabase.sequelize.models.placeholder.findAll({ order: [ [ 'handle', 'ASC' ]], raw: true});
    if(item) response.status(200).json(item);
    else response.status(404).json();
});

export default router;