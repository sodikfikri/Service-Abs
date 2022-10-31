const path = require('path')
const RedisConn = require('../helpers/redis_connection')
const QueueSchedulerMQ = require('bullmq').QueueScheduler;
const WorkerMQ = require('bullmq').Worker;

const EventEmitter = require('events')

const schedulerName = process.env.REDIS_SCHEDULER_NAME;
const theQueue = new QueueMQ(schedulerName, { connection: RedisConn });

class MyEmitter extends EventEmitter { };
const myEmitter = new MyEmitter();

const helpersWorkerCekWeekData = {
    name: schedulerName,
    queue: theQueue,
    runQueueScheduler: function (data) {
    // * * * * * // every minute
    // */3 * * * * // every 3 minute
    // 0 */1 * * * // every hour
        this.queue.add(schedulerName, data, {
            removeOnComplete: false, // false just for debugging
            repeat: {
                cron: process.env.SCHEDULE_TIME,
            },
            attempts: 0,
        });
    },
    addQueue: function (data) {
        this.queue.add(schedulerName, data, {
        removeOnComplete: false, // false just for debugging
        });
    },
    pauseQueue: function () {
        this.queue.pause();
    },
    resumeQueue: function () {
        this.queue.resume();
    },
    getJobs: async function () {
        return await this.queue.getJobs();
    },
    getRepeatableJobs: async function () {
        return await this.queue.getRepeatableJobs();
    },
    setWorker: function () {
        try {
        const processorFile = path.join(__dirname, '../workers/WorkerCekWeekData.js');
        const schedulerWorker = new WorkerMQ(schedulerName, processorFile, {
            connection: RedisConn,
            concurrency: 1,
        })
        schedulerWorker.on('completed', async (job, returnValue) => {
            console.log('info', `${schedulerName} completed: ${JSON.stringify(returnValue)}`);
            // this.obliterateQueue()
        })
        schedulerWorker.on('failed', async (job, failedReason) => {
            console.log('error', `${schedulerName} failed: ${JSON.stringify(failedReason)}`);
        });
        schedulerWorker.on('error', async (errMsg) => {
            console.log('error', `${schedulerName} error: ${JSON.stringify(errMsg)}`);
        });
        myEmitter.on(schedulerName + 'ShutDown', () => {
            // gracefull shutdown
            console.log('masuk ke myemiter nih');
            schedulerWorker.close();
        });
        } catch (e) {
            console.log('error', `${schedulerName} worker_error: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`);
        }
    },
    drainQueue: function () {
        this.queue.drain();
    },
    obliterateQueue: function () {
        this.queue.obliterate();
    },
    workerShutDown: function () {
        myEmitter.emit(schedulerName + 'ShutDown');
    }
}

module.exports = helpersWorkerCekWeekData;