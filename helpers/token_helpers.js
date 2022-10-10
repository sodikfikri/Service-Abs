const jwt = require("jsonwebtoken")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// openssl genrsa -aes256 -out private.key 2048 // generate private.key
// openssl rsa -in private.key -pubout -out public.key // extract public.key

const passphrase = process.env.PASS_PHRASE;
const secretKey = crypto.createHash('sha256').update(String(passphrase)).digest();

const token_helpers = {

    sign(data) {
        return new Promise((resolve, reject) => {
            // encoded value
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
            const text = JSON.stringify(data);
            const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
            // resolve(encrypted)
            const payload = {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex'),
            };
            // generate token
            const opts = {
                algorithm: 'RS256',
                audience: 'MOBILE_ABS',
                issuer: 'SERVICE_ABS',
                subject: 'BONCENG_ABS',
                expiresIn: '30d', // ex: 120(ms), 10h, 7d
            };
            jwt.sign(payload, { key: fs.readFileSync(path.join(__dirname, '../files/keys/private.key')), passphrase }, opts, function (err, token) {
                if (err) return reject(err);
                resolve(token);
            });
        });
    },
    verify(token) {
        return new Promise((resolve, reject) => {
          try {
            // decode token
            jwt.verify(token, fs.readFileSync(path.join(__dirname, '../files/keys/public.key')), { algorithm: 'RS256' }, function (err, hash) {
                if (err) return reject(err);

                // decrypted value
                const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, Buffer.from(hash.iv, 'hex'));
                const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);;
                resolve(JSON.parse(decrpyted.toString()));
            });
          } catch (err) {
            reject(err);
          }
        });
    },

}

module.exports = token_helpers