const SandboxedJobMQ = require('bullmq').SandboxedJob;
const moment = require('moment');

const schedulerName = process.env.scheduleCekWeek;

module.exports = async (job) => {
    try {
        let loop = process.env.SCHEDULE_MAX_LOOP;

        for(let i = 0; i < loop; i++) {
            console.log('count: ', i);
        }

        return {
            type: 'success',
            message: 'success run scheduler!',
            data: job,
        };
    } catch (error) {
        return {
            type: 'error',
            message: error.message,
            e: error,
        };
    }
}