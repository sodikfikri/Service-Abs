const moment        = require('moment')
const validator     = require('validatorjs')
const firebase_helpers = require('../helpers/firebase_helpers')
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
                // start_time,
                end_date,
                // end_time,
                reason,
            }
            // return res.json(input)
            const rules = {
                start_date: 'required',
                // start_time: 'required',
                end_date: 'required',
                // end_time: 'required',
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

            let dataArr = [], groupDate = []
            let no = 0
            for(let row of getData) {
                if (groupDate.includes(row.dt)) {
                    dataArr[no - 1].out = {
                        time: row.generated_time,
                        location: row.location
                    }
                } 
                else {
                    groupDate.push(row.dt);
                    if (row.in == 1) {
                        dataArr.push({
                            generated_date: row.generated_date,
                            status: row.status,
                            in: {
                                time: row.generated_time,
                                location: row.location
                            },
                        })
                    } else {
                        dataArr.push({
                            generated_date: row.generated_date,
                            status: row.status,
                            out: {
                                time: row.generated_time,
                                location: row.location
                            },
                        })
                    }
                }
                no++
            }

            apiResult = getData.length == 0 ? msg_helpers.SetMessage('400', 'Data not found') : msg_helpers.SetMessage('200', 'Success get data presence')
            apiResult.data = dataArr

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
            // cek abs data
            let CK = await AbsenModel.CkApprove(presence_id)
            if (CK.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            // cek usr data
            const usrCk = await AdminModel.UserCekData('id', CK[0].user_id)
            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'User not found!')
                return res.status(200).json(apiResult)
            }
            // approve data abs
            let approved = await AbsenModel.PresenceApprove({ status: 2, approve_at: moment().unix(), updated_at: moment().unix() }, CK[0].user_id)
            // fail response
            if (approved.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to approve presence!')
                return res.status(200).json(apiResult)
            }
            // firebase need to check
            firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                data: {
                    user_name: 'nama kamu',
                    message: 'Absen kamu telah di setijui',
                }
            });
            // success response
            apiResult = msg_helpers.SetMessage('200', 'Success approve data')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PresenceReject(req, res) {
        let apiResult = {}
        try {
            const {presence_id, reason} = req.body
            // return res.json(req.body)
            const input = {
                presence_id,
                reason,
            }
            const rules = {
                presence_id: 'required|integer',
                reason: 'required'
            }

            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            // cek abs data
            let CK = await AbsenModel.CkApprove(presence_id)
            if (CK.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            // cek usr data
            const usrCk = await AdminModel.UserCekData('id', CK[0].user_id)
            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('400', 'User not found!')
                return res.status(200).json(apiResult)
            }

            let reject = await AbsenModel.PresenceApprove({ status: 3, reason: reason, reject_at: moment().unix(), updated_at: moment().unix() }, CK[0].user_id)
            if (reject.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to reject presence!')
                return res.status(200).json(apiResult)
            }
            // firebase need to check
            firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                data: {
                    user_name: '' + usrCk[0].fullname,
                    message: 'Absen kamu tidak distujui admin',
                }
            });
            // success response
            apiResult = msg_helpers.SetMessage('200', 'Success reject data')
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PermissionApprove(req, res) {
        let apiResult = {}
        try {
            const {cuti_id} = req.body
            // return res.json(req.body)
            const input = {
                cuti_id,
            }
            const rules = {
                cuti_id: 'required|integer',
            }

            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            let params = {}
            // cek data
            const Ck = await AbsenModel.LeavePermissionCk(cuti_id)
            if (Ck.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            params.cuti_id = cuti_id
            params.start_date = moment(Ck[0].start_date)
            params.end_date = moment(Ck[0].end_date)
            params.diff_date = parseInt(params.end_date.diff(params.start_date, 'days')) + parseInt(1)
            // ge usr data
            const usrCk = await AdminModel.UserCekData('id', Ck[0].user_id)
            params.usrid = usrCk[0].id
            params.usrCount = usrCk[0].count

            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'User not found!')
                return res.status(200).json(apiResult)
            }
            if (parseInt(usrCk[0].count) - parseInt(params.diff_date) < 0) {
                apiResult = msg_helpers.SetMessage('400', 'Jatah cuti tidak cukup!')
                return res.status(200).json(apiResult)
            }

            let approve = await AbsenModel.PermissionApprove(params)
            if (approve.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to approve data!')
                return res.status(200).json(apiResult)
            }

            firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                data: {
                    user_name: '' + usrCk[0].fullname,
                    message: 'Pengajuan cuti kamu telah di setujui',
                }
            });

            apiResult = msg_helpers.SetMessage('200', 'Success approve data')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PermissionReject(req, res) {
        let apiResult = {}
        try {
            const {cuti_id, reason} = req.body
            // return res.json(req.body)
            const input = {
                cuti_id,
                reason
            }
            const rules = {
                cuti_id: 'required|integer',
                reason: 'required'
            }

            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            let params = {}
            // cek data
            const Ck = await AbsenModel.LeavePermissionCk(cuti_id)
            if (Ck.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            const usrCk = await AdminModel.UserCekData('id', Ck[0].user_id)
            if (usrCk.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'User not found!')
                return res.status(200).json(apiResult)
            }
            // set params
            params.status = 3
            params.reason_reject = reason

            let reject = await AbsenModel.PerminssionReject(params, cuti_id)
            if (reject.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to reject data!')
                return res.status(200).json(apiResult)
            }

            firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                data: {
                    user_name: '' + usrCk[0].fullname,
                    message: 'Pengajuan cuti kamu tidak disetujui',
                }
            });
            
            apiResult = msg_helpers.SetMessage('200', 'Success reject data')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }

}

module.exports = new AbsenController()