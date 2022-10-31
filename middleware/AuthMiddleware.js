const response = require("../config/responses");
const msg_helpers = require("../helpers/msg_helpers");
const token_helpers = require("../helpers/token_helpers");

const AuthMiddleware = async function(req, res, next) {
    let apiResult = {}
    try {
        const payload = await token_helpers.verify(req.headers['x-api-key']);
        req.auth = { ...payload };
    } catch (error) {
        apiResult = msg_helpers.SetMessage('401', 'Token not provided!')
        return res.status(401).send(apiResult);
    }
    next();
}

module.exports = AuthMiddleware 