const response = require("../config/responses")

class msgErr_helpers {

    SetMessage(code, message) {
        let apiResult = {}
        switch (code) {
            case '200':
                apiResult = {...response[200]}
                break;
            case '201':
                apiResult = {...response[201]}
                break;
            case '400':
                apiResult = {...response[400]}
                break;
            case '404':
                apiResult = {...response[404]}
                break;
            case '401':
                apiResult = {...response[401]}
                break;
            case '500':
                apiResult = {...response[500]}
                break;
            default:
                apiResult = {...response[400]}
                break;
        }
        apiResult.meta.message = message
        return apiResult
    }

}

module.exports = new msgErr_helpers()