const fs = require('fs');
const path = require("path");

const firebase_helpers = {

    firebaseAdmin: null,
    firebaseInit: function() {
        const firebase = require('firebase-admin');

        const account = require(path.join(__dirname, '../files/keys/boncengabsensi-firebase-adminsdk-wqf50-b469e169a0.json')); // langsung json
        return firebase.initializeApp({
            credential: firebase.credential.cert(account),
            databaseURL: 'https://boncengabsensi-default-rtdb.asia-southeast1.firebasedatabase.app',
        });
    },
    sendNotiftoDevice: function(registrationToken = '', payload = {}, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.firebaseAdmin === null) {
                    this.firebaseAdmin = this.firebaseInit();
                }
                if (!options['priority']) {
                    options.priority = 'normal';
                }
                if (!options['timeToLive']) {
                    options.timeToLive = 60 * 60 * 24;
                }

                const response = await this.firebaseAdmin.messaging().sendToDevice(registrationToken, payload, options);
                
                resolve(response);
            } catch (error) {
                reject(error)
            }
        })
    }

}

module.exports = firebase_helpers