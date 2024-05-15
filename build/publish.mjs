import chromeWebstoreUpload from 'chrome-webstore-upload'
import fs from 'fs'
import got from 'got'
import JWT from 'jsonwebtoken'
import path from 'path'
import { FormData } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'
import { fileURLToPath } from 'url'
import { Readable } from 'stream'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Firefox
function getJWT() {
    return JWT.sign({ iss: process.env.mozApiKey }, process.env.mozApiSecret, {
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
        await new Promise((resolve) => setTimeout(() => resolve(), 2500))
        const status = await got.get(fileUpload.url, { headers: { Authorization: `JWT ${getJWT()}` } }).json()
        if (status.valid === true) {
            console.log('Version is valid:\n', status)
            isValidated = true
        }
        else if (status.processed && status.validation) {
            console.log('Version is not valid:\n', status)
            console.log('Error messages:\n', JSON.stringify(status.validation?.messages, null, 4))
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

// Edge
async function publishEdge() {
    const BASE_API_URL = `https://api.addons.microsoftedge.microsoft.com/v1/products/${process.env.edge_product_id}/submissions`

    async function upload({ Authorization, file: body }) {
        const res = await fetch(`${BASE_API_URL}/draft/package`,
            { headers: { Authorization, 'Content-Type': 'application/zip' }, duplex: 'half', method: 'POST', body }
        )

        const operationId = res.headers.get('location')
        if (res.status !== 202) throw new Error(`Got status ${res.status} when uploading add-on`)
        if (!operationId) throw new Error('Failed to get operation ID from response')

        return operationId
    }

    async function publish({ Authorization }) {
        const res = await fetch(`${BASE_API_URL}`, { headers: { Authorization }, method: 'POST' })

        const operationId = res.headers.get('location')
        if (res.status !== 202) throw new Error(`Got status ${res.status} when uploading add-on`)
        if (!operationId) throw new Error('Failed to get operation ID from response')

        return operationId
    }

    async function waitForOperation({ Authorization, operation, operationId }) {
        const startTime = Date.now()
        const operationUrl = operation === 'upload' ? `${BASE_API_URL}/draft/package/operations/${operationId}` : `${BASE_API_URL}/operations/${operationId}`

        let status
        while (status?.status !== 'Succeeded') {
            status = await fetch(operationUrl, { headers: { Authorization } }).then((res) => res.json())

            if (status.status === 'Failed') throw new Error(`Operation failed: ${status.message} (code ${status.errorCode})`)
            if (Date.now() - startTime > 10 * 60 * 1000) throw new Error('Timed out waiting for operation to complete')

            await new Promise((resolve) => setTimeout(resolve, 5000))
        }
    }

    async function getAccessToken() {
        const body = new URLSearchParams({
            client_id: process.env.edge_client_id,
            client_secret: process.env.edge_client_secret,
            grant_type: 'client_credentials',
            scope: 'https://api.addons.microsoftedge.microsoft.com/.default'
        })
        const data = await fetch(`https://login.microsoftonline.com/${process.env.edge_oauth_key}/oauth2/v2.0/token`, { method: 'POST', body }).then((res) => res.json())
        if (!data.access_token) throw new Error('Error getting access-token.')
        return `Bearer ${data.access_token}`
    }

    const Authorization = await getAccessToken()
    const file = Readable.toWeb(fs.createReadStream(path.join(__dirname, '../extension_chrome.zip')))
    const uploadOperationId = await upload({ Authorization, file })
    await waitForOperation({ Authorization, operation: 'upload', operationId: uploadOperationId })
    console.log('Uploaded edge extension.\n')
    const publishOperationId = await publish({ Authorization, notes: '' })
    await waitForOperation({ Authorization, operation: 'publish', operationId: publishOperationId })
    console.log('Published Edge extension.\n')
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
    const withCatch = (fn, store) => fn().catch((e) => {
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
