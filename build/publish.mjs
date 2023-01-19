import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = chromeWebstoreUpload({
    extensionId: 'gcicdbcmacjeaepmfkibdbhickbdiafj',
    clientId: process.env.clientId,
    refreshToken: process.env.refreshToken
})

const myZipFile = fs.createReadStream(path.join(__dirname, '../extension_chrome.zip'))
const token = store.fetchToken()

store.uploadExisting(myZipFile, token)
    .then(() => store.publish('default', token))