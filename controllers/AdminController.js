const moment            = require('moment')
const validator         = require('validatorjs')
const msg_helpers       = require('../helpers/msg_helpers')
const AdminModel        = require('../models/AdminModel')
const password_helper   = require('../helpers/password_helpers')
const token_helpers     = require('../helpers/token_helpers')

class AdminController {
    
    async UserRegister(req, res) {
        let apiResult = {}
        try {
            const {fullname, email, password, re_password, phone, address, divisi_id} = req.body

            const input = {
                fullname,
                email,
                password,
                re_password,
                phone,
                address,
                divisi_id,
            }
            const rules = {
                fullname: 'required|max:255',
                email: 'required|email|max:45',
                password: 'required|string|max:50',
                re_password: 'required|string|max:50',
                phone: 'required|max:15',
                address: 'string',
                divisi_id: 'required|integer',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const ckMail = await AdminModel.UserCekData('email', email)
            const ckPhone = await AdminModel.UserCekData('phone', phone)
            if (ckMail.length != 0) {
                apiResult = msg_helpers.SetMessage('400', 'Email has been used!')
                return res.status(200).json(apiResult)
            }
            if (password != re_password) {
                apiResult = msg_helpers.SetMessage('400', 'Password doest not match!')
                return res.status(200).json(apiResult)
            }
            if (ckPhone.length != 0) {
                apiResult = msg_helpers.SetMessage('400', 'Phone number has been used!')
                return res.status(200).json(apiResult)
            }

            const data = {
                fullname: fullname,
                email: email,
                password: await password_helper.hash(password),
                phone: phone,
                address: address,
                divisi_id: divisi_id,
                count: 12,
                created_at: moment().unix()
            }

            const InsUser = await AdminModel.InsUserData(data)
            if (InsUser.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to insert user data!')
                return res.status(200).json(apiResult)
            }
            
            apiResult = msg_helpers.SetMessage('201', 'Success insert user data')
            return res.status(201).json(apiResult)
            
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async AdminRegister(req, res) {
        let apiResult = {}
        try {
            const {fullname, email, password, re_password, phone, is_active} = req.body
            const input = {
                fullname,
                email,
                password,
                re_password,
                phone,
                is_active,
            }
            const rules = {
                fullname: 'required|max:255',
                email: 'required|email|max:45',
                password: 'required|string|max:50',
                re_password: 'required|string|max:50',
                phone: 'required|max:15',
                is_active: 'required|integer',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const ckMail = await AdminModel.AdminCekData('email', email)
            const ckPhone = await AdminModel.AdminCekData('phone', phone)
            if (ckMail.length != 0) {
                apiResult = msg_helpers.SetMessage('400', 'Email has been used!')
                return res.status(200).json(apiResult)
            }
            if (password != re_password) {
                apiResult = msg_helpers.SetMessage('400', 'Password doest not match!')
                return res.status(200).json(apiResult)
            }
            if (ckPhone.length != 0) {
                apiResult = msg_helpers.SetMessage('400', 'Phone number has been used!')
                return res.status(200).json(apiResult)
            }

            const data = {
                fullname: fullname,
                email: email,
                password: await password_helper.hash(password),
                phone: phone,
                is_active: is_active,
                created_at: moment().unix()
            }

            const InsData = await AdminModel.InsAdminData(data)
            if (InsData.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to insert admin data!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('201', 'Success insert admin data')
            return res.status(201).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UserLogin(req, res) {
        let apiResult = {}
        try {
            const {email, password, fcm_token} = req.body
            const input = {
                email,
                password,
                fcm_token,
            }
            const rules = {
                email: 'required|email|max:45',
                password: 'required|max:50',
                fcm_token: 'required|string',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const find = await AdminModel.UserCekData('email', email)
            if (find.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account not found!')
                return res.status(200).json(apiResult)
            }
            if (find[0].is_active == 2) {
                apiResult = msg_helpers.SetMessage('400', 'Account Inactive!')
                return res.status(200).json(apiResult)
            }
            if (find[0].deleted_at != 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account has been deleted!')
                return res.status(200).json(apiResult)
            }
            const userCekIsdeleted = await AdminModel.CekUserIsDeleted(email)
            if (userCekIsdeleted.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account has been deleted!')
                return res.status(200).json(apiResult)
            }
            const isMatch = await password_helper.compare(password, find[0].password)
            if (!isMatch) {
                apiResult = msg_helpers.SetMessage('400', 'Your password is wrong!')
                return res.status(200).json(apiResult)
            }

            const params = {
                fcm_token: fcm_token
            }

            const UptFcm = await AdminModel.UptUserData('users', params, 'id', find[0].id)
            if (UptFcm.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to update fcm token!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Login has success full')
            apiResult.data = await AdminModel.UserCekData('email', email)
            apiResult.token = await token_helpers.sign({ id: find[0].id })
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async AdminLogin(req, res) {
        let apiResult = {}
        try {
            const {email, password} = req.body
            const input = {
                email,
                password,
            }
            const rules = {
                email: 'required|email|max:45',
                password: 'required|max:50',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const find = await AdminModel.AdminCekData('email', email)
            if (find.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account not found!')
                return res.status(200).json(apiResult)
            }
            const isMatch = await password_helper.compare(password, find[0].password)
            if (!isMatch) {
                apiResult = msg_helpers.SetMessage('400', 'Your password is wrong!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Login has success full')
            apiResult.token = await token_helpers.sign({ id: find[0].id })
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UserList(req, res) {
        let apiResult = {}
        try {
            let data = await AdminModel.GetUser()
            if (data.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            apiResult = msg_helpers.SetMessage('200', 'Success get data!')
            apiResult.data = data
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UserDetail(req, res) {
        let apiResult = {}
        try {
            const {id} = req.query
            const input = {
                id,
            }
            const rules = {
                id: 'required|integer'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            const find = await AdminModel.UserCekData('id', id)
            if (find.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            apiResult = msg_helpers.SetMessage('200', 'Sucess get data!')
            apiResult.data = find[0]
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UserEdit(req, res) {
        let apiResult = {}
        try {
            const {id, fullname, email, password, phone, address, divisi_id, is_active} = req.body
            const input = {
                id,
                fullname,
                email,
                phone,
                address,
                divisi_id,
                is_active,
            }
            const rules = {
                id: 'required|integer',
                fullname: 'required|max:150',
                email: 'required|max:40',
                phone: 'required',
                address: 'required',
                divisi_id: 'required|integer',
                is_active: 'required|integer',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            const find = await AdminModel.UserCekData('id', id)
            if (find.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Account not found!')
                return res.status(200).json(apiResult)
            }

            const params = {
                fullname,
                email,
                phone,
                address,
                divisi_id,
                is_active,
                updated_at: moment().unix()
            }
            const doChange = await AdminModel.UptUserData('users', params, 'id', id);
            if (password) { // change password
                let params = {
                    password: await password_helper.hash(password),
                }
                await AdminModel.UptUserData('users', params, 'id', id);
            }
            if (doChange.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to update data!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success update data!')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UserDelete(req, res) {
        let apiResult = {}
        try {
            const {id} = req.body
            const input = {
                id
            }
            const rules = {
                id: 'required'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            
            const find = await AdminModel.UserCekData('id', id)
            if (find.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account not found!')
                return res.status(200).json(apiResult)
            }

            let params = {
                deleted_at: moment().unix()
            }

            const doChange = await AdminModel.UptUserData('users', params, 'id', id);
            if (doChange.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to delete data!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success delete data!')
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async CreateDivisi(req, res) {
        let apiResult = {}
        try {
            const {name, is_active} = req.body
            const input = {
                name,
                is_active
            }
            const rules = {
                name: 'required|max:50',
                is_active: 'required|integer'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const params = {
                name: name,
                is_active: is_active,
                created_at: moment().unix()
            }

            const InsDivisi = await AdminModel.InsDivisiData(params)
            if (InsDivisi.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to insert divisi data!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('201', 'Success insert data!')
            return res.status(201).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async DetailDivisi(req, res) {
        let apiResult = {}
        try {
            const {id} = req.query
            const input = {
                id,
            }
            const rules = {
                id: 'required|integer'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const data = await AdminModel.GetDetailDivisi(id)
            if (data.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Fail to get detail divisi!')
                return res.status(200).json(apiResult)
            }
            apiResult = msg_helpers.SetMessage('200', 'Success get data!')
            apiResult.data = data[0]
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async ListDivisi(req, res) {
        let apiResult = {}
        try {
            const data = await AdminModel.GetListDivisi()
            if (data.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Fail to get divisi data!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success get data!')
            apiResult.data = data
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async UpdateDivisi(req, res) {
        let apiResult = {}
        try {
            const {id, name, status} = req.body
            const input = {
                id,
                name,
                status
            }
            const rules = {
                id: 'required|integer',
                name: 'required|max:50',
                status: 'required',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            const params = {
                name: name,
                updated_at: moment().unix(),
                is_active: status
            }
            const doChange = await AdminModel.UptDivisi(id, params)
            if (doChange.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to update divisi!')
                return res.status(200).json(apiResult)
            }
            apiResult = msg_helpers.SetMessage('200', 'Success update data!')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async DeleteDivisi(req, res) {
        let apiResult = {}
        try {
            const {id} = req.body
            const input = {
                id,
            }
            const rules = {
                id: 'required|integer'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            const params = {
                is_active: 0,
                updated_at: moment().unix()
            }
            const doChange = await AdminModel.DeleteDivisi(id, params)
            if (doChange.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to delete divisi!')
                return res.status(200).json(apiResult)
            }
            apiResult = msg_helpers.SetMessage('200', 'Success delete data!')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async DiveiDDL(req, res) {
        let apiResult = {}
        try {
            let data = await AdminModel.GetDivisiName()
            
            if (data.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'data not found!')
                apiResult.data = []
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success get data!')
            apiResult.data = data
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
}

module.exports = new AdminController()