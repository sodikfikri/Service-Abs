const Redis = require('ioredis')
const redisConn = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})

module.exports = redisConn;