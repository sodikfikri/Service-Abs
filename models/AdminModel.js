const mysql_helpers = require('../helpers/mysql_helpers')
const DB            = require('../helpers/db_helpers')

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
    static InsUserData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('users', data)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static UptUserData(table, data, colName, whereVal) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update(table, data, colName, whereVal)
                resolve(result)
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
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static InsDivisiData(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.insert('divisi', data)
                resolve(result)
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
                const result = await mysql_helpers.query(DB, 'SELECT * FROM divisi WHERE is_active = 1')
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
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }
    static DeleteDivisi(id, data) {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await mysql_helpers.update('divisi', data, 'id', id)
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    }

}

module.exports = AdminModel