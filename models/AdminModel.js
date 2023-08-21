const mysql_helpers = require('../helpers/mysql_helpers')
const DB            = require('../helpers/db_helpers')
const moment        = require('moment')

class AdminModel {

    static UserCekData(whereName, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.getWhere('*', 'users', whereName, data)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetUser() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.query(DB, 'SELECT * FROM users WHERE deleted_at = 0')
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsUserData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('users', data)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static UptUserData(table, data, colName, whereVal) {
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
    static AdminCekData(whereName, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.getWhere('*', 'admin', whereName, data)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsAdminData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('admin', data)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsDivisiData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('divisi', data)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(err)
            }
        })
    }
    static GetDetailDivisi(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.getWhere('*', 'divisi', 'id', id)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetListDivisi() {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.query(DB, 'SELECT id, name, is_active, FROM_UNIXTIME(created_at, "%Y-%m-%d %H:%i:%s") created_at, FROM_UNIXTIME(updated_at, "%Y-%m-%d %H:%i:%s") updated_at FROM divisi')
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static UptDivisi(id, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update('divisi', data, 'id', id)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static DeleteDivisi(id, data) {
        return new Promise(async (resolve, reject) => {
            try {
                // const result = await mysql_helpers.update('divisi', data, 'id', id)
                const result = await mysql_helpers.delete('divisi', 'id', id)
                resolve({
                    type: 'success',
                    result
                });
            } catch (error) {
                reject(error)
            }
        })
    }
    static GetDivisiName() {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT id, name FROM divisi WHERE is_active = 1`
                const result = await mysql_helpers.query(DB, query)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static CekUserIsDeleted(email) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `SELECT * FROM users where email = ? and deleted_at = 0`
                const result = await mysql_helpers.query(DB, query, [email])
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

}

module.exports = AdminModel