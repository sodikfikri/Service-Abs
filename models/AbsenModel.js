const mysql_helpers = require('../helpers/mysql_helpers')
const DB            = require('../helpers/db_helpers')
const moment        = require('moment')

class AbsenModel {

    static GetSummaryData(user_id, start_date, end_date) {
        return new Promise(async (resolve, reject) => {
            try {
                const sql_presence = `SELECT * FROM db_absensi.presensi WHERE user_id = ${user_id} AND status = 2 AND is_valid = 1 AND (generated_date BETWEEN '${start_date}' AND '${end_date}') GROUP BY generated_date`;
                const result_presence = await mysql_helpers.query(DB, sql_presence)

                const sql_cuti = `SELECT * FROM db_absensi.cuti WHERE user_id = ${user_id} AND status = 2 AND (start_date BETWEEN '${start_date}' AND '${end_date}') GROUP BY start_date`
                const result_cuti = await mysql_helpers.query(DB, sql_cuti)
                const result = {
                    presence: result_presence.length,
                    cuti: result_cuti.length
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
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
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetListPresence() {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT presensi.*, DATE_FORMAT(presensi.generated_date, "%Y%m%d") dt, users.fullname user_name, status.name status_name 
                                FROM 
                                    presensi 
                                JOIN status 
                                    ON presensi.status = status.id 
                                JOIN users
                                    ON presensi.user_id = users.id
                                WHERE DATE_FORMAT(generated_date, "%Y-%m") = '${moment().format('YYYY-MM')}'`
                const result = await mysql_helpers.query(DB, query)

                if (result.length != 0) {
                    for(let key in result) {
                        result[key].generated_date = moment(result[key].generated_date).format('YYYY-MM-DD')
                    }
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static LeavePermissionCk(idx) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.getWhere('*', 'cuti', 'id', idx)
                resolve(result);
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsLeavePermission(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('cuti', data);
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static CkApprove(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.getWhere('*', 'presensi', 'id', id);
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static PresenceApprove(data, id) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update('presensi', data, 'user_id', id);
                resolve({
                    type: 'success',
                    result
                })
            } catch (error) {
                reject(error)
            }
        })
    }
    static UpdateData(table, data, colName, whereVal) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update(table, data, colName, whereVal)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static PermissionApprove(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const conn = await mysql_helpers.createConnection();
                await mysql_helpers.createTrx(conn)

                let dataApprove = {
                    status: 2, 
                    approve_at: moment().unix()
                }
                const approve = await mysql_helpers.queryTrx(conn, 'UPDATE cuti SET ? WHERE id = ?', [dataApprove, parseInt(data.cuti_id)])
                
                const dataCount = {
                    count: parseInt(data.usrCount) - parseInt(data.diff_date)
                }

                const uptUsr = await mysql_helpers.queryTrx(conn, 'UPDATE users SET ? WHERE id = ?', [dataCount, data.usrid])
                
                await mysql_helpers.commit(conn);

                resolve({
                    type: 'success',
                })
            } catch (error) {
                reject(error)
            }
        })
    }
    static PerminssionReject(data, cuti_id) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update('cuti', data, 'id', cuti_id)
                resolve({
                    type: 'success',
                    result
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}

module.exports = AbsenModel