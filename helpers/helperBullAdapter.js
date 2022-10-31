const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const helpersWorkerCekWeekData = require('./helpersWorkerCekWeekData');

const serverAdapter = new ExpressAdapter();

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
      new BullMQAdapter(helpersWorkerCekWeekData.queue),
    //   new BullMQAdapter(LibWorkerSodik.queue),
    ],
    serverAdapter: serverAdapter,
});

helpersWorkerCekWeekData.setWorker();

serverAdapter.setBasePath('/' + process.env.API_PREFIX + '/bull/monitor');

module.exports = serverAdapter;