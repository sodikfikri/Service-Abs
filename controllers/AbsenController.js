const moment        = require('moment')
const validator     = require('validatorjs')
const firebase_helpers = require('../helpers/firebase_helpers')
const functionEx = require('../helpers/functionEx')
const msg_helpers   = require('../helpers/msg_helpers')
const mysql_helpers = require('../helpers/mysql_helpers')
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
            console.log(input);
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
            const cekByDatInput = await AbsenModel.PresenceCek(user_id, generated_date, type)
            if (cekByDatInput.length != 0) {
                apiResult = msg_helpers.SetMessage('400', `Kamu sudah melakukan absen ${type == 1 ? 'masuk' : 'pulang'} pada tanggal ini`)
                return res.status(200).json(apiResult)
            }
            // const presenceCk = await AbsenModel.PresenceCek(user_id, dateNow, type)
            // if (presenceCk.length != 0) {
            //     apiResult = msg_helpers.SetMessage('400', `Kamu sudah melakukan absen ${type == 1 ? 'masuk' : 'pulang'} hari ini`)
            //     return res.status(200).json(apiResult)
            // }

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
            const getData = await AbsenModel.GetListPresence(req.auth.id)
            // return res.json(req.auth.id)
            let dataArr = [], groupDate = []
            for(let row in getData) {
                console.log(dataArr);
                if (groupDate.includes(getData[row].dt)) {
                    let data = dataArr.find(o => o.dt === `${getData[row].dt}`);
                    console.log(data);
                    data.out = {
                        time: getData[row].generated_time,
                        location: getData[row].location
                    }
                } 
                else {
                    groupDate.push(getData[row].dt);
                    if (getData[row].in == 1) {
                        dataArr.push({
                            generated_date: getData[row].generated_date,
                            status: getData[row].status,
                            dt: getData[row].dt,
                            in: {
                                time: getData[row].generated_time,
                                location: getData[row].location
                            },
                        })
                    } 
                    else {
                        dataArr.push({
                            generated_date: getData[row].generated_date,
                            status: getData[row].status,
                            dt: getData[row].dt,
                            out: {
                                time: getData[row].generated_time,
                                location: getData[row].location
                            },
                        })
                    }
                }
                // no++
            }
            apiResult = getData.length == 0 ? msg_helpers.SetMessage('400', 'Data not found') : msg_helpers.SetMessage('200', 'Success get data presence')
            apiResult.data = dataArr

            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PermissionList(req, res) {
        let apiResult = {}
        try {
            let getData = await AbsenModel.GetPermissionList(req.auth.id);
            
            if (getData.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                return res.status(200).json(apiResult)
            }
            
            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = getData
            return res.json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PresenceApprove(req, res) {
        let apiResult = {}
        try {
            const {presence_id, generated_date} = req.body

            const input = {
                presence_id,
                generated_date
            }
            const rules = {
                presence_id: 'required|integer',
                generated_date: 'required'
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
            let approved = await AbsenModel.PresenceApprove({ status: 2, is_valid: 1, approve_at: moment().unix(), updated_at: moment().unix() }, CK[0].user_id, generated_date)
            // fail response
            if (approved.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to approve presence!')
                return res.status(200).json(apiResult)
            }
            // firebase need to check
            await firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                notification: {
                    title: '',
                    body: '',
                },
                data: {
                    ket_notif: 'Absensi disetujui',
                    message: 'Absesnsi kamu telah disetujui'
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
            const {presence_id, generated_date, reason} = req.body
            // return res.json(req.body)
            const input = {
                presence_id,
                generated_date,
                reason,
            }
            const rules = {
                presence_id: 'required|integer',
                generated_date: 'required',
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

            let reject = await AbsenModel.PresenceApprove({ status: 3, reason: reason, reject_at: moment().unix(), updated_at: moment().unix() }, CK[0].user_id, generated_date)
            if (reject.type != 'success') {
                apiResult = msg_helpers.SetMessage('400', 'Fail to reject presence!')
                return res.status(200).json(apiResult)
            }
            // firebase need to check
            await firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                notification: {
                    title: '',
                    body: '',
                },
                data: {
                    ket_notif: 'Absensi ditolak',
                    message: 'Absesnsi kamu ditolak'
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

            await firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                notification: {
                    title: '',
                    body: '',
                },
                data: {
                    ket_notif: 'Pengajuan cuti disetujui',
                    message: 'Pengajuan cuti kamu telah disetujui'
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

            console.log('token: ', usrCk[0].fcm_token);

            let send = await firebase_helpers.sendNotiftoDevice(usrCk[0].fcm_token, {
                notification: {
                    title: '',
                    body: '',
                },
                data: {
                    ket_notif: 'Pengajuan cuti ditolak',
                    message: 'Pengajuan cuti kamu ditolak'
                }
            });
            console.log('send: ', send);
            apiResult = msg_helpers.SetMessage('200', 'Success reject data')
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    // API for admin
    async AbsList(req, res) {
        let apiResult = {}
        try {
            const {start_date, end_date, status} = req.query;
            const input = {
                start_date,
                end_date,
                status,
            }
            const rules = {
                start_date: 'required',
                end_date: 'required',
                status: 'required',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            let params = {
                start_date,
                end_date,
                status
            }
            const _data = await AbsenModel.GetListAbs(params)
            // return res.json(_data)
            let dataArr = [], groupDate = []
            for(let row in _data) {
                if (groupDate.includes(`${_data[row].user_id}_${_data[row].dt}`)) {
                    // search array
                    let data = dataArr.find(o => o.combine === `${_data[row].user_id}_${_data[row].dt}`);
                    data.out = {
                        time: _data[row].generated_time,
                        location: _data[row].location
                    }
                } 
                else {
                    groupDate.push(`${_data[row].user_id}_${_data[row].dt}`);
                    if (_data[row].in == 1) {
                        dataArr.push({
                            id: _data[row].id,
                            generated_date: _data[row].generated_date,
                            status_id: _data[row].status,
                            user_name: _data[row].user_name,
                            status: _data[row].status_name,
                            reason: _data[row].reason,
                            combine: `${_data[row].user_id}_${_data[row].dt}`,
                            in: {
                                time: _data[row].generated_time,
                                location: _data[row].location
                            },
                        })
                    } 
                    else {
                        dataArr.push({
                            id: _data[row].id,
                            generated_date: _data[row].generated_date,
                            status_id: _data[row].status,
                            user_name: _data[row].user_name,
                            status: _data[row].status_name,
                            reason: _data[row].reason,
                            combine: `${_data[row].user_id}_${_data[row].dt}`,
                            out: {
                                time: _data[row].generated_time,
                                location: _data[row].location
                            },
                        })
                    }
                }
                // no++
            }
            // return res.json(dataArr)
            if (dataArr.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                apiResult.data = []
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = dataArr
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async ListCuti(req, res) {
        let apiResult = {}
        try {
            const {start_date, end_date, status} = req.query
            const input = {
                start_date,
                end_date,
                status,
            }
            const rules = {
                start_date: 'required',
                end_date: 'required',
                status: 'required',
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            let params = {
                start_date,
                end_date,
                status
            }
            let data = await AbsenModel.GetListCuti(params)
            if (data.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                apiResult.data = []
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = data
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async AbsRecap(req, res) {
        let apiResult = {}
        try {
            const {start_date, end_date} = req.query
            const input = {
                start_date,
                end_date
            }
            const rules = {
                start_date: 'required',
                end_date: 'required'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }

            let final_arr = []
            let xlsx_data = []

            let params = {
                start_date,
                end_date
            }
            const _data = await AbsenModel.GetAbsData(params)
            // return res.json(_data)
            let _arr_group = functionEx.ArrGroup(_data, 'user_id')
            // return res.json(_arr_group)
            for(let _val of _arr_group) {
                let arrGdate = []
                for(let key2 in _val) {
                    // create obj data
                    if (typeof final_arr[_val[key2].user_id] == 'undefined') {
                        final_arr[_val[key2].user_id] = {}
                    }
                    // console.log(_val[key2]);
                    // ambil user data
                    final_arr[_val[key2].user_id]['User'] = (await AbsenModel.GetUserName(_val[key2].user_id)).fullname
                    // console.log(`'${_val[key2].generated_date}'`);
                    if (_val[key2].out == '0') {
                        if (typeof final_arr[_val[key2].user_id]['in_'+_val[key2].user_id+'_'+_val[key2].generated_date] == 'undefined') {
                            final_arr[_val[key2].user_id]['in_'+_val[key2].user_id+'_'+_val[key2].generated_date] = _val[key2].generated_time
                        }
                    }
                    // ambil waktu jam pulang kerja
                    if (_val[key2].out == '1') {
                        final_arr[_val[key2].user_id]['out_'+_val[key2].generated_date] = _val[key2].generated_time
                        // jika tidak absen pada saat masuk kerja,tapi absen saat pulang kerja
                        if (typeof final_arr[_val[key2].user_id]['in_'+_val[key2].user_id+'_'+_val[key2].generated_date] == 'undefined') {
                            let calculate =  parseInt(9) / parseInt(9)
                            final_arr[_val[key2].user_id][_val[key2].generated_date] = parseFloat(calculate)
                            final_arr[_val[key2].user_id][`total_${_val[key2].generated_date}`] = parseFloat(calculate)
                        }
                        // jika absen pada saat masuk dan pulang kerja (complate)
                        else {
                            let start = moment(final_arr[_val[key2].user_id]['in_'+_val[key2].user_id+'_'+_val[key2].generated_date], 'HH:mm')
                            let end = moment(final_arr[_val[key2].user_id]['out_'+_val[key2].generated_date], 'HH:mm')
                            let calculate = parseFloat(end.diff(start, 'hours')) / parseFloat(9)
                                calculate = calculate.toFixed(1)
                            // calculate
                            final_arr[_val[key2].user_id][_val[key2].generated_date] = parseFloat(calculate)
                            final_arr[_val[key2].user_id][`total_${_val[key2].generated_date}`] = parseFloat(calculate)
                        }
                    }
                    // tidak absen pada saat pulang kerja
                    else {
                        let calculate = parseInt(9) / parseInt(9)
                        final_arr[_val[key2].user_id][_val[key2].generated_date] = parseFloat(calculate)
                        final_arr[_val[key2].user_id][`total_${_val[key2].generated_date}`] = parseFloat(calculate)
                    }
                    
                    // if (typeof _val[parseInt(key2)+1] == 'undefined' || _val[parseInt(key2)].generated_date != _val[parseInt(key2)+1].generated_date) {
                    //     if (typeof final_arr[_val[key2].user_id]['Total Point'] == 'undefined') {
                    //         final_arr[_val[key2].user_id]['Total Point'] = parseFloat(final_arr[_val[key2].user_id][_val[key2].generated_date])
                    //     } 
                    //     else {
                    //         // if (arrGdate.find(element => element == _val[key2].generated_date) == undefined) {
                    //             let t_point = final_arr[_val[key2].user_id]['Total Point']
                    //                 t_point = final_arr[_val[key2].user_id]['Total Point'] += parseFloat(final_arr[_val[key2].user_id][_val[key2].generated_date])
                    //                 t_point = t_point.toFixed(1)
                    //             final_arr[_val[key2].user_id]['Total Point'] = parseFloat(t_point)
                    //         // }
                    //     }
                    // }
                    // console.log(final_arr[_val[key2].user_id]['Total Point']);
                    // if (arrGdate.find(element => element == _val[key2].generated_date) == undefined) {
                    //     arrGdate.push(_val[key2].generated_date)
                    // }
                    // console.log(arrGdate);
                }
                
            }
            // return res.json(final_arr)
            for (let key in final_arr) {
                for (let okey in final_arr[key]) {
                    
                    if (okey.search('in_') > -1) {
                        delete final_arr[key][okey]
                    }
                    if (okey.search('out_') > -1) {
                        delete final_arr[key][okey]
                    }
                    if (okey.search('total_') > -1) {
                        if (typeof final_arr[key]['Total Point'] == 'undefined') {
                            final_arr[key]['Total Point'] = final_arr[key][okey]
                        } 
                        else {
                            let dt1 = final_arr[key]['Total Point']
                            let dt2 = final_arr[key][okey]
                            let total = parseFloat(dt1) + parseFloat(dt2)
                            final_arr[key]['Total Point'] = total.toFixed(1)
                        }
                        delete final_arr[key][okey]
                    }
                }
            }
            // sort index key array
            for(let i in final_arr){
                xlsx_data.push(final_arr[i])
            }

            if (xlsx_data.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                apiResult.data = []
                return res.status(200).json(apiResult)
            }
            // success response
            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = xlsx_data 
            return res.status(200).json(apiResult)

        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async PermissionRecap(req, res) {
        let apiResult = {}
        try {
            const {start_date, end_date} = req.query
            const input = {
                start_date,
                end_date
            }
            const rules = {
                start_date: 'required',
                end_date: 'required'
            }
            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = msg_helpers.SetMessage('400', Object.values(inputValidation.errors.all())[0][0]) // get first message
                return res.status(200).json(apiResult)
            }
            const _get = await AbsenModel.GetPermissionRecap(input)
            
            if (_get.length == 0) {
                apiResult = msg_helpers.SetMessage('404', 'Data not found!')
                apiResult.data = []
                return res.status(200).json(apiResult)
            }

            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = _get
            return res.status(200).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }
    async AdminSummaryDashboard(req, res) {
        let apiResult = {}
        try {
            let data = await AbsenModel.AdminSummaryDsb()

            apiResult = msg_helpers.SetMessage('200', 'Success get data')
            apiResult.data = data
            return res.status(500).json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }

}

module.exports = new AbsenController()