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

// Firefox
function getJWT() {
    return JWT.sign({ iss: process.env.mozApiKey || "user:17050180:448" }, process.env.mozApiSecret || "6d21d8eb54456c3818dcd81f75acf8b56bb1cd0d60c5470dce7275482d7d9596", {
        algorithm: 'HS256',
        expiresIn: '5m'
    })
}

async function publishFF() {
    const uuid = 'tempo-tracker@fochlac.com'
    const basePath = 'https://addons.mozilla.org'

    const uploadExtForm = new FormData()
    uploadExtForm.set('channel', 'listed')
    uploadExtForm.set('upload', await fileFromPath(path.join(__dirname, '../extension_firefox.zip')))
    const fileUpload = await got
        .post(`${basePath}/api/v5/addons/upload/`, {
            headers: { Authorization: `JWT ${getJWT()}` },
            body: uploadExtForm
        })
        .json()

    console.log('Uploaded file:\n', fileUpload)
    let isValidated = false
    while (!isValidated) {
        await new Promise(resolve => setTimeout(() => resolve(), 2500))
        const status = await got.get(fileUpload.url, { headers: { Authorization: `JWT ${getJWT()}` } }).json()
        if (status.valid === true) {
            console.log('Version is valid:\n', status)
            isValidated = true
        } else if (status.processed && status.validation) {
            console.log('Version is not valid:\n', status)
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
    console.log('Created version:\n', version)
}

// Chrome
const store = chromeWebstoreUpload({
    extensionId: 'gcicdbcmacjeaepmfkibdbhickbdiafj',
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken
})

const myZipFile = fs.createReadStream(path.join(__dirname, '../extension_chrome.zip'))
let shouldThrow = false
console.log('========= Publishing Chrome Extension ==========')
store
    .fetchToken()
    .then((token) => {
        return store.uploadExisting(myZipFile, token)
            .then((r) => {
                console.log('Uploaded Chrome extension:\n', r)
                return store.publish('default', token)
            })
    })
    .then((r) => {
        console.log('Published Chrome extension:\n', r)
    })
    .catch((e) => {
        console.log('Publishing Chrome extension failed:\n', e)
        shouldThrow = true
    })
    .then(() => {
        console.log('========= Publishing Firefox Extension ==========')
        return publishFF()
    })
    .catch(async (e) => {
        console.log('Publishing Firefox extension failed:\n', (await e?.response?.body) || e)
        shouldThrow = true
    })
    .then(() => {
        if (shouldThrow) {
            throw new Error('Publishing failed!')
        }
    })
