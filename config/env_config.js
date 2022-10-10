const path = require('path')
require('dotenv').config({ path: path.join(__dirname, ".env") })

module.exports = {
    dbConfig: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    },
}