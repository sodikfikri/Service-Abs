const AuthModel     = require("../models/AuthModel")
const moment        = require('moment')
const response      = require('../config/responses')
const validator     = require('validatorjs')
const token_helpers = require('../helpers/token_helpers')

class AuthController {
    async UserLogin(req, res) {
        let apiResult = {}
        try {
            const {email, password, fcmToken} = req.body
            const input = {
                email,
                password,
                fcmToken
            }
            
            const rules = {
                email: 'required|email|max:255',
                password: 'required|string|max:255',
                fcmToken: 'required|string'
            }

            const inputValidation = new validator(input, rules)
            if(inputValidation.fails()) {
                apiResult = response[400]
                apiResult.meta.message = Object.values(inputValidation.errors.all())[0][0] // get first message
                return res.status(200).json(apiResult)
            }

            const token = await token_helpers.sign({ id: 1 })

            return res.json(token)
        } catch (error) {
            apiResult = response[500]
            apiResult.meta.message = error.message
            return res.status(500).json(apiResult)
        }
    }
}

module.exports = new AuthController()