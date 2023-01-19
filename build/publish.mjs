import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import got from 'got'
import JWT from 'jsonwebtoken'
import path from 'path'
import { FormData } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chrome 
const store = chromeWebstoreUpload({
    extensionId: 'gcicdbcmacjeaepmfkibdbhickbdiafj',
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken
})

const myZipFile = fs.createReadStream(path.join(__dirname, '../extension_chrome.zip'))
store
    .fetchToken()
    .then((token) => {
        console.log('token', token)
        return store.uploadExisting(myZipFile, token).then((r) => {
            console.log('uploaded', r)
            return store.publish('default', token)
        })
    })
    .catch((e) => {
        console.log('error', e)
    })

// Firefox
function getJWT ()  {
 return JWT.sign(
    { iss: process.env.mozApiKey },
    process.env.mozApiSecret,
    {
        algorithm: 'HS256',
        expiresIn: '5m'
    }
)
}
async function publishFF() {
    const uuid = 'tempo-tracker@fochlac.com'
    const basePath = 'https://addons.mozilla.org'

    try {
        const uploadExtForm = new FormData()
        uploadExtForm.set('channel', 'listed')
        uploadExtForm.set('upload', await fileFromPath(path.join(__dirname, '../extension_firefox.zip')))
        const fileUpload = await got
            .post(`${basePath}/api/v5/addons/upload/`, {
                headers: { Authorization: `JWT ${getJWT()}` },
                body: uploadExtForm
            })
            .json()

        console.log('uploaded file', fileUpload)
        let isValidated = false
        while (!isValidated) {
            const status = await got.get(fileUpload.url, { headers: { Authorization: `JWT ${getJWT()}` } }).json()
            if (status.valid === true) {
                console.log(status)
                isValidated = true
            } else if (status.processed && status.validation) {
                throw new Error('Version is not valid', JSON.stringify(status.validation, null, 4))
            }
        }

        const uploadSrcForm = new FormData()
        uploadSrcForm.set('source', await fileFromPath(path.join(__dirname, '../extension_firefox_source.zip')))
        uploadSrcForm.set('upload', fileUpload.uuid)
        const version = await got
            .post(`${basePath}/api/v5/addons/addon/${uuid}/versions/`, {
                headers: { Authorization: `JWT ${getJWT()}` },
                body: uploadSrcForm
            })
            .json()
        console.log('created version', version)
    } catch (e) {
        console.log((await e?.response.body) || e)
    }
}

publishFF()
