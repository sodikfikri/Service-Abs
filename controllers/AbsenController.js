const moment        = require('moment')
const validator     = require('validatorjs')
const msg_helpers   = require('../helpers/msg_helpers')
const AbsenModel    = require('../models/AbsenModel')
const AdminModel    = require('../models/AdminModel')


class AbsenController {

    async DataSummary(req, res) {
        let apiResult = {}
        try {
            
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
    async PresenceList(req, res) {
        let apiResult = {}
        try {
            const getData = await AbsenModel.GetListPresence()
            // return res.json(getData)
            apiResult = getData.length == 0 ? msg_helpers.SetMessage('400', 'Data not found') : msg_helpers.SetMessage('200', 'Success get data presence')
            apiResult.data = getData

            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async Approve(req, res) {
        let apiResult = {}
        try {
            
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