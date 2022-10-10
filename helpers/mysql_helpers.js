const dbMysql = require("../helpers/db_helpers")
const Promise = require("bluebird")

const mysql_helpers = {
    insert: async function (table, data) {
      return new Promise((resolve, reject) => {
        const query = `INSERT INTO ${table} SET ?;`;
        dbMysql.getConnection(function (err, conn) {
          if (err) {
            conn.release();
            reject(err);
            return false;
          }
          conn.beginTransaction(async function (err) {
            if (err) {
              conn.release();
              reject(err);
              return false;
            }
            conn.query(query, data, function (err, result) {
              if (err) {
                conn.rollback(async function () {
                  reject(err);
                  return false;
                });
              }
              // Number(result.insertId);
              conn.commit(async function (err) {
                if (err) {
                  conn.release();
                  reject(err);
                  return false;
                }
                conn.release();
                resolve({
                  type: 'success',
                  result,
                });
                return true;
              });
            });
          });
  
        });
      })
    },
    update: async function (table, data, colId, valId) {
      return new Promise((resolve, reject) => {
        const query = `UPDATE ${table} SET ? WHERE ${colId} = ?;`;
        dbMysql.getConnection(function (err, conn) {
          if (err) {
            conn.release();
            reject(err);
            return false;
          }
          conn.beginTransaction(async function (err) {
            if (err) {
              conn.release();
              reject(err);
              return false;
            }
            conn.query(query, [data, valId], function (err, result) {
              if (err) {
                conn.rollback(async function () {
                  reject(err);
                  return false;
                });
              }
              conn.commit(async function (err) {
                if (err) {
                  conn.release();
                  reject(err);
                  return false;
                }
                conn.release();
                resolve({
                  type: 'success',
                  result,
                });
                return true;
              });
            });
          });
  
        });
      })
    },
    delete: async function(table, column, values) {
      return new Promise((resolve, reject) => {
        const query = `DELETE FROM ${table} WHERE ${column} IN (${values})`
        dbMysql.getConnection(function(err, conn) {
          if (err) {
            conn.release()
            reject(err)
            return false
          }
          conn.beginTransaction(async function(err) {
            if (err) {
              conn.release()
              reject(err)
              return false
            }
            conn.query(query, function(err, result) {
              if (err) {
                conn.rollback(async function () {
                  reject(err);
                  return false;
                });
              }
              conn.commit(async function(err) {
                if (err) {
                  conn.release();
                  reject(err);
                  return false;
                }
                conn.release();
                resolve({
                  type: 'success',
                  result,
                });
                return true;
              })
            })
          })
        })
      })
    },
    get: async function (table, select) {
      return new Promise((resolve, reject) => {
        const query = `SELECT ${select} FROM ${table};`;
        dbMysql.query(query, [], function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve({
              type: 'success',
              result,
            });
          }
        })
      })
    },
    getWhere: async function(select, table, whereName, whereValue) {
      return new Promise((resolve, reject) => {
          const sql = `SELECT ${select} FROM ${table} WHERE ${whereName} IN (?)`
          dbMysql.query(sql, [whereValue], function (err, result) {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
      })
    },
    createConnection: async function () {
      return new Promise((resolve, reject) => {
        dbMysql.getConnection(function (err, conn) {
          if (err) {
            // close connection
            conn.release();
            reject(err);
            return false;
          }
          resolve(conn);
        });
      })
    },
    createTrx: async function(conn) {
      return new Promise((resolve, reject) => {
        conn.beginTransaction(async function(err) {
          if (err) {
            // close connection
            conn.release()
            reject(err)
            return false
          } else {
            resolve(conn)
          }
        })
      })
    },
    queryTrx: async function(conn, query = '', params = []) {
      return new Promise((resolve, reject) => {
        conn.query(query, params, function(err, result) {
          if (err) {
            conn.rollback(async function(){
              reject(err)
              return false
            })
          }
          resolve(result)
        })
      })
    },
    commit: async function (conn) {
      return new Promise((resolve, reject) => {
        conn.commit(async function (err) {
          if (err) {
            conn.release();
            reject(err);
            return false;
          }
          conn.release();
          resolve(true);
        });
      })
    },
    rollback: async function (conn) {
      return new Promise((resolve, reject) => {
        conn.rollback(async function () {
          conn.release();
          reject(err);
          return false;
        });
      })
    },
    query: async function (conn, query = '', params = []) {
      return new Promise((resolve, reject) => {
        conn.query(query, params, function (err, result) {
          if (err) return reject(err);
          // Number(result.insertId);
          resolve(result);
        });
      })
    },
}
  
module.exports = mysql_helpers;