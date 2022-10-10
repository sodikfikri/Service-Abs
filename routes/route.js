const AbsenController   = require("../controllers/AbsenController")
const AdminController   = require("../controllers/AdminController")
const AuthMiddleware    = require("../middleware/AuthMiddleware")
const PREFIX = process.env.API_PREFIX

exports.routesConfig = function(app) {
    // admin auth
    app.post(`/${PREFIX}/admin/user_register`, AdminController.UserRegister)
    app.post(`/${PREFIX}/user/login`, AdminController.UserLogin)
    app.post(`/${PREFIX}/admin/register`, AdminController.AdminRegister)
    app.post(`/${PREFIX}/admin/login`, AdminController.AdminLogin)

    // admi divisi
    app.post(`/${PREFIX}/admin/create_divisi`, AuthMiddleware, AdminController.CreateDivisi)
    app.get(`/${PREFIX}/admin/list_divisi`, AuthMiddleware, AdminController.ListDivisi)
    app.get(`/${PREFIX}/admin/detail_divisi`, AuthMiddleware, AdminController.DetailDivisi)
    app.put(`/${PREFIX}/admin/update_divisi`, AuthMiddleware, AdminController.UpdateDivisi)
    app.delete(`/${PREFIX}/admin/delete_divisi`, AuthMiddleware, AdminController.DeleteDivisi)

    // abs route
    app.post(`/${PREFIX}/user/presence`, AuthMiddleware, AbsenController.Presence)
    app.get(`/${PREFIX}/admin/presence_list`, AuthMiddleware, AbsenController.PresenceList)
}