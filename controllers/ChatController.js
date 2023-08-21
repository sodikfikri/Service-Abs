const moment            = require('moment')
const validator         = require('validatorjs')
const msg_helpers       = require('../helpers/msg_helpers')

class ChatController {

    async ChatCallback(req, res) {
        let apiResult = {}
        try {
            let {marketplace} = req.body
            console.log(req.body);
            req.io.sockets.emit(marketplace, {
                message: req.body
            })
            apiResult = msg_helpers.SetMessage('200', 'Success emit message')
            apiResult.data = req.body
            
            return res.json(apiResult)
        } catch (error) {
            apiResult = msg_helpers.SetMessage('500', error.message)
            return res.status(500).json(apiResult)
        }
    }

}

module.exports = new ChatController()