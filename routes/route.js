const AbsenController   = require("../controllers/AbsenController")
const AdminController   = require("../controllers/AdminController")
const AuthMiddleware    = require("../middleware/AuthMiddleware")

const PREFIX = process.env.API_PREFIX

exports.routesConfig = function(app) {
    // admin auth
    app.post(`/${PREFIX}/admin/user_register`, AdminController.UserRegister)
    app.post(`/${PREFIX}/admin/register`, AdminController.AdminRegister)
    app.post(`/${PREFIX}/admin/login`, AdminController.AdminLogin)
    app.post(`/${PREFIX}/user/login`, AdminController.UserLogin)
    app.get(`/${PREFIX}/user/summary`, AuthMiddleware, AbsenController.DataSummary)
    // admin divisi
    app.post(`/${PREFIX}/admin/create_divisi`, AuthMiddleware, AdminController.CreateDivisi)
    app.get(`/${PREFIX}/admin/list_divisi`, AuthMiddleware, AdminController.ListDivisi)
    app.get(`/${PREFIX}/admin/detail_divisi`, AuthMiddleware, AdminController.DetailDivisi)
    app.put(`/${PREFIX}/admin/update_divisi`, AuthMiddleware, AdminController.UpdateDivisi)
    app.delete(`/${PREFIX}/admin/delete_divisi`, AuthMiddleware, AdminController.DeleteDivisi)
    // abs route
    app.post(`/${PREFIX}/user/presence`, AuthMiddleware, AbsenController.Presence)
    app.post(`/${PREFIX}/user/cuti`, AuthMiddleware, AbsenController.LeavePermission)
    app.get(`/${PREFIX}/user/presence_list`, AuthMiddleware, AbsenController.PresenceList)
    app.post(`/${PREFIX}/admin/presence/approve`, AuthMiddleware, AbsenController.PresenceApprove)
    app.post(`/${PREFIX}/admin/presence/reject`, AuthMiddleware, AbsenController.PresenceReject)
    app.post(`/${PREFIX}/admin/cuti/approve`, AuthMiddleware, AbsenController.PermissionApprove)
    app.post(`/${PREFIX}/admin/cuti/reject`, AuthMiddleware, AbsenController.PermissionReject)

    // abs for admin
    app.get(`/${PREFIX}/admin/presence_list`, AuthMiddleware, AbsenController.AbsList)
    app.get(`/${PREFIX}/admin/abs/recap`, AuthMiddleware, AbsenController.AbsRecap)

}