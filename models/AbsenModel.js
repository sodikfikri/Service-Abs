const mysql_helpers = require('../helpers/mysql_helpers')
const DB = require('../helpers/db_helpers')
const moment = require('moment')

class AbsenModel {

    static GetSummaryData(user_id, start_date, end_date) {
        return new Promise(async (resolve, reject) => {
            try {
                // console.log('user id: ', user_id);
                // console.log('start date: ', start_date);
                // console.log('end date', end_date);
                const sql_presence = `SELECT * FROM service_abs.presensi WHERE user_id = ${user_id} AND status = 2 AND is_valid = 1 AND (generated_date BETWEEN '${start_date}' AND '${end_date}') GROUP BY generated_date`;
                const result_presence = await mysql_helpers.query(DB, sql_presence)

                const sql_cuti = `SELECT * FROM service_abs.cuti WHERE user_id = ${user_id} AND status = 2 AND (start_date BETWEEN '${start_date}' AND '${end_date}') GROUP BY start_date`
                const result_cuti = await mysql_helpers.query(DB, sql_cuti)

                const count_cuti = `SELECT * FROM service_abs.users WHERE id = ${user_id}`
                const result_count = await mysql_helpers.query(DB, count_cuti)

                const result = {
                    presence: result_presence.length,
                    cuti: result_cuti.length,
                    count_cuti: result_count[0].count
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
                const query = `SELECT abs.* FROM service_abs.presensi abs WHERE abs.user_id = ${user_id} AND abs.generated_date = '${date}' AND ${cats}`;
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
    static GetListPresence(user_id) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT presensi.*, DATE_FORMAT(presensi.generated_date, "%Y%m%d") dt, users.fullname user_name, status.name status_name 
                                FROM 
                                    presensi 
                                JOIN status 
                                    ON presensi.status = status.id 
                                JOIN users
                                    ON presensi.user_id = users.id
                                WHERE presensi.user_id = ${user_id} AND DATE_FORMAT(generated_date, "%Y-%m") = '${moment().format('YYYY-MM')}'`
                const result = await mysql_helpers.query(DB, query)

                if (result.length != 0) {
                    for (let key in result) {
                        result[key].generated_date = moment(result[key].generated_date).format('YYYY-MM-DD')
                    }
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetPermissionList(user_id) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT 
                                    cuti.start_date, cuti.end_date, cuti.reason, cuti.reason_reject reason_refusing,
                                    stts.name status_name, cuti.approve_at, cuti.reject_at
                                FROM
                                    service_abs.cuti cuti 
                                JOIN service_abs.status stts 
                                    ON cuti.status = stts.id 
                                WHERE 
                                    user_id = ${user_id} AND FROM_UNIXTIME(cuti.created_at, "%Y-%m") = '${moment().format('YYYY-MM')}'`
                const result = await mysql_helpers.query(DB, query)
                if (result.length != 0) {
                    for (let key in result) {
                        result[key].start_date = moment(result[key].start_date).format('YYYY-MM-DD')
                        result[key].end_date = moment(result[key].end_date).format('YYYY-MM-DD')
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
    static PresenceApprove(data, id, gdate) {
        return new Promise(async (resolve, reject) => {
            try {
                let query = `UPDATE presensi SET ? WHERE user_id = ? AND generated_date = ?`
                const result = await mysql_helpers.query(DB, query, [data, id, gdate]);
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
    static PermissionStatusCek(cuti_id) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = 'SELECT * FROM cuti WHERE id = ? AND status = 1'
                const result = await mysql_helpers.query(DB, query, [cuti_id])
                resolve(result)
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

    // for admin
    static GetListAbs(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let status = data.status != 0 ? `AND status IN (${data.status})` : ``
                const query = `SELECT presensi.*, DATE_FORMAT(presensi.generated_date, "%Y%m%d") dt, users.fullname user_name, status.name status_name 
                                FROM 
                                    presensi 
                                JOIN status 
                                    ON presensi.status = status.id 
                                JOIN users
                                    ON presensi.user_id = users.id
                                WHERE FROM_UNIXTIME(presensi.created_at, "%Y-%m-%d") BETWEEN "${data.start_date}" AND "${data.end_date}" ${status}`
                // const query = `select * from presensi`
                const result = await mysql_helpers.query(DB, query)
                // console.log(result);
                if (result.length != 0) {
                    for (let key in result) {
                        result[key].generated_date = moment(result[key].generated_date).format('YYYY-MM-DD')
                    }
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetListCuti(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let status = data.status != 0 ? `AND status IN (${data.status})` : ``
                let query = `SELECT cuti.*, users.fullname user_name, status.name status_name FROM service_abs.cuti JOIN status ON cuti.status = status.id JOIN users ON cuti.user_id = users.id
                            WHERE cuti.start_date >= "${data.start_date}" AND cuti.end_date <= "${data.end_date}" ${status}`
                // console.log(query);
                const result = await mysql_helpers.query(DB, query)
                if (result.length != 0) {
                    for (let key in result) {
                        result[key].start_date = moment(result[key].start_date).format('YYYY-MM-DD')
                        result[key].end_date = moment(result[key].end_date).format('YYYY-MM-DD')
                        if (result[key].approve_at) {
                            result[key].approve_at = moment.unix(result[key].approve_at).format('YYYY-MM-DD')
                        }
                        if (result[key].reject_at) {
                            result[key].reject_at = moment(result[key].reject_at).format('YYYY-MM-DD')
                        }
                    }
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetAbsData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT * FROM presensi WHERE status = 2 AND DATE_FORMAT(generated_date, "%Y-%m-%d") BETWEEN '${data.start_date}' AND '${data.end_date}'`
                const result = await mysql_helpers.query(DB, query)
                if (result.length != 0) {
                    for (let key in result) {
                        result[key].generated_date = moment(result[key].generated_date).format('DD/MM/YYYY')
                    }
                }
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetUserName(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT * FROM users WHERE id = ${id}`
                const result = await mysql_helpers.query(DB, query);

                resolve(result[0])
            } catch (error) {
                reject(error)
            }
        })
    }
    static AdminSummaryDsb() {
        return new Promise(async (resolve, reject) => {
            try {
                let sql_abs = `SELECT abs.id FROM presensi abs WHERE abs.status = ?`
                let sql_ct = `SELECT id FROM cuti WHERE status = ?`

                // abs
                let abs_waiting = await mysql_helpers.query(DB, sql_abs, [1])
                let abs_approve = await mysql_helpers.query(DB, sql_abs, [2])
                let abs_reject = await mysql_helpers.query(DB, sql_abs, [3])

                // cuti
                let ct_waiting = await mysql_helpers.query(DB, sql_ct, [1])
                let ct_approve = await mysql_helpers.query(DB, sql_ct, [2])
                let ct_reject = await mysql_helpers.query(DB, sql_ct, [3])

                let resp = {
                    absen: {
                        waiting: abs_waiting.length,
                        approve: abs_approve.length,
                        reject: abs_reject.length
                    },
                    cuti: {
                        waiting: ct_waiting.length,
                        approve: ct_approve.length,
                        reject: ct_reject.length
                    }
                }

                resolve(resp)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetPermissionRecap(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT 
                                    users.fullname, DATE_FORMAT(cuti.start_date, "%d-%m-%Y") start_date,
                                    DATE_FORMAT(cuti.end_date, "%d-%m-%Y") end_date, cuti.reason, cuti.status,
                                    cuti.approve_at, cuti.reject_at, cuti.reason_reject, status.name status_name
                                FROM 
                                    cuti 
                                JOIN 
                                    users ON cuti.user_id = users.id 
                                JOIN
                                    status ON cuti.status = status.id
                                WHERE 
                                    FROM_UNIXTIME(cuti.created_at, "%Y-%m-%d") BETWEEN ? AND ?`
                const result = await mysql_helpers.query(DB, query, [data.start_date, data.end_date])

                let response = []
                if (result.length != 0) {
                    for (let key in result) {
                        let obj = {
                            'User Name': result[key].fullname,
                            'Start Date': result[key].start_date,
                            'End Date': result[key].end_date,
                            'Reason': result[key].reason,
                            'Reason Refusing': result[key].reason_reject,
                            'Status': result[key].status_name,
                            'Approve Date': result[key].approve_at ? moment(result[key].approve_at).format('DD-MM-YYYY HH:mm') : '-',
                            'Reject Date': result[key].reject_at ? moment(result[key].reject_at).format('DD-MM-YYYY HH:mm') : '-',
                        }

                        response.push(obj)
                    }
                }

                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsInbox(table, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert(table, data)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static InboxList(user_id) {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await mysql_helpers.query(DB, `SELECT title, body, reason, FROM_UNIXTIME(created_at, "%Y-%m-%d %H:%i:%s") time_format FROM inbox WHERE user_id = ?`, [user_id])
                resolve(data)
            } catch (error) {
                reject(error)
            }
        })
    }
}

module.exports = AbsenModel