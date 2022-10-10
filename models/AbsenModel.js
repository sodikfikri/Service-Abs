const mysql_helpers = require('../helpers/mysql_helpers')
const DB            = require('../helpers/db_helpers')
const moment        = require('moment')

class AbsenModel {

    static PresenceCek(user_id, date, type) {
        return new Promise(async (resolve, reject) => {
            try {
                const cats = type == 1 ? 'abs.in = 1' : 'abs.out = 1'
                const query = `SELECT abs.* FROM db_absensi.presensi abs WHERE abs.user_id = ${user_id} AND abs.generated_date = '${date}' AND ${cats}`;
                const result = await mysql_helpers.query(DB, query)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static PrsInCek(user_id, date) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT abs.* FROM presensi abs WHERE abs.user_id = ${user_id} AND abs.generated_date = '${date}' AND abs.in = 1 AND abs.status = 1`
                const result = await mysql_helpers.query(DB, query)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsPresence(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('presensi', data)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetListPresence() {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT * FROM presensi WHERE generated_date = '${moment().format('YYYY-MM-DD')}'`
                const result = await mysql_helpers.query(DB, query)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

}

module.exports = AbsenModel