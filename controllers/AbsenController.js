const moment        = require('moment')
const validator     = require('validatorjs')
const msg_helpers   = require('../helpers/msg_helpers')
const AbsenModel    = require('../models/AbsenModel')
const AdminModel    = require('../models/AdminModel')


class AbsenController {

    async DataSummary(req, res) {
        let apiResult = {}
        try {
            const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
            const oneDayAgo = moment().subtract(1, 'day').format('YYYY-MM-DD');
            
            const data = await AbsenModel.GetSummaryData(req.auth.id, startOfMonth, oneDayAgo);

            apiResult = msg_helpers.SetMessage('200', 'Success get data');
            apiResult.data = data;
            return res.status(201).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async Presence(req, res) {
        let apiResult = {}
        try {
            const {user_id, generated_date, generated_time, type, location} = req.body
            const input = {
                user_id,
                generated_date,
                generated_time,
                type,
                location,
            }
            const rules = {
                user_id: 'required|integer',
                generated_date: 'required',
                generated_time: 'required',
                type: 'required|integer',
                location: 'required|string',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            const dateNow = moment().format('YYYY-MM-DD')
            const usrCk = await AdminModel.UserCekData('id', user_id)
            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account not found!')
                return res.status(200).json(apiResult)
            }
            // if (type == 2) {
            //     const inCk = await AbsenModel.PrsInCek(user_id, dateNow)
            //     if (inCk.length != 0) {
            //         apiResult = msg_helpers.SetMessage('400', 'Absen masuk kamu belum di approve, silahkan hubungi administrasi!')
            //         return res.status(200).json(apiResult)
            //     }
            // }
            const presenceCk = await AbsenModel.PresenceCek(user_id, dateNow, type)
            if (presenceCk.length != 0) {
                apiResult = msg_helpers.SetMessage('400', `Kamu sudah melakukan absen ${type == 1 ? 'masuk' : 'pulang'} hari ini`)
                return res.status(200).json(apiResult)
            }

            let ParamsPresence = {
                created_at: moment().unix(),
                user_id: user_id,
                generated_date: generated_date,
                generated_time: generated_time,
                status: 1,
                location: location
            }
            if (type == 1) {
                ParamsPresence.in = 1
            } else {
                ParamsPresence.out = 1
            }

            const InsPresence = await AbsenModel.InsPresence(ParamsPresence)
            if (InsPresence.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to insert presensi data!')
                return res.status(200).json(apiResult)
            }
            
            apiResult = msg_helpers.SetMessage('201', 'Success insert presensi data')
            return res.status(201).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async LeavePermission(req, res) {
        let apiResult = {}
        try {
            const {start_date, start_time, end_date, end_time, reason} = req.body
            
            const input = {
                start_date,
                start_time,
                end_date,
                end_time,
                reason,
            }
            // return res.json(input)
            const rules = {
                start_date: 'required',
                start_time: 'required',
                end_date: 'required',
                end_time: 'required',
                reason: 'required|string|max:150',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            // user validation
            const usrCk = await AdminModel.UserCekData('id', req.auth.id)
            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Account not found!')
                return res.status(200).json(apiResult)
            }

            let params = {
                user_id: req.auth.id,
                start_date,
                start_time,
                end_date,
                end_time,
                reason,
                status: 1,
                created_at: moment().unix(),
            }

            let InsData = await AbsenModel.InsLeavePermission(params)

            if (InsData.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to insert data !')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('201', 'Success insert data')
            return res.status(201).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PresenceList(req, res) {
        let apiResult = {}
        try {
            const getData = await AbsenModel.GetListPresence()
            apiResult = getData.length == 0 ? msg_helpers.SetMessage('400', 'Data not found') : msg_helpers.SetMessage('200', 'Success get data presence')
            apiResult.data = getData

            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PresenceApprove(req, res) {
        let apiResult = {}
        try {
            const {presence_id} = req.body

            const input = {
                presence_id,
            }
            const rules = {
                presence_id: 'required|integer',
            }

            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            let CK = await AbsenModel.CkApprove(presence_id)
            
            if (CK.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Data not found!')
                return res.status(200).json(apiResult)
            }

            let approved = await AbsenModel.PresenceApprove({ status: 2, updated_at: moment().unix() }, CK[0].user_id)

            if (approved.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to approve presence!')
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success approve data')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async Reject(req, res) {
        let apiResult = {}
        try {
            
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }

}

module.exports = new AbsenController()