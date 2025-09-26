import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'
import { EdgeClient } from './edge-client.mjs'
import { FirefoxClient } from './firefox-client.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.mozApiKey = 'user:17050180:281'
process.env.mozApiSecret = 'f3185a5839c0b619a29e96cbca439d409853256ec81cd5680b08610e04e65853'

// Firefox
async function publishFF() {
    const firefoxClient = new FirefoxClient({
        apiKey: process.env.mozApiKey,
        apiSecret: process.env.mozApiSecret,
        addonId: 'tempo-tracker@fochlac.com'
    })

    await firefoxClient.publishExtension()
}

// Edge
async function publishEdge() {
    const edgeClient = new EdgeClient({
        apiKey: process.env.edge_api_key,
        clientId: process.env.edge_client_id,
        productId: process.env.edge_product_id
    })

    edgeClient.ensureCredentials()
    edgeClient.logCredentials()
    await edgeClient.ensureReadyForPublish()

    const file = Readable.toWeb(fs.createReadStream(path.join(__dirname, '../extension_chrome.zip')))

    const uploadOperationId = await edgeClient.uploadPackage(file)
    await edgeClient.waitForOperation(uploadOperationId, { type: 'upload' })
    edgeClient.log('✅', 'Upload completed')

    const publishOperationId = await edgeClient.publishSubmission()
    await edgeClient.waitForOperation(publishOperationId, { type: 'publish' })
    edgeClient.log('🎉', 'Edge extension published successfully')
}

// Chrome

async function publishChrome() {
    const store = chromeWebstoreUpload({
        extensionId: 'gcicdbcmacjeaepmfkibdbhickbdiafj',
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        refreshToken: process.env.refreshToken
    })

    const token = await store.fetchToken()
    const myZipFile = fs.createReadStream(path.join(__dirname, '../extension_chrome.zip'))
    const result = await store.uploadExisting(myZipFile, token)
    console.log('Uploaded Chrome extension:\n', result)
    const publish = await store.publish('default', token)
    console.log('Published Chrome extension:\n', publish)
}

async function publish() {
    let failed = false
    const withCatch = (fn, store) =>
        fn().catch((e) => {
            console.log(`Publishing ${store} extension failed:\n`, e)
            failed = true
        })

    console.log('========= Publishing Chrome Extension ==========')
    await withCatch(publishChrome, 'Chrome')
    console.log('========= Publishing Firefox Extension ==========')
    await withCatch(publishFF, 'Firefox')
    console.log('========= Publishing Edge Extension ==========')
    await withCatch(publishEdge, 'Edge')
    if (failed) {
        throw new Error('Publishing failed!')
    }
}

publish()
