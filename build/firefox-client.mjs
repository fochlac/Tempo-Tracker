import JWT from 'jsonwebtoken'
import got from 'got'
import { FormData } from 'formdata-node'
import { fileFromPath } from 'formdata-node/file-from-path'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class FirefoxClient {
    constructor({ apiKey, apiSecret, addonId }) {
        this.apiKey = apiKey
        this.apiSecret = apiSecret
        this.addonId = addonId
        this.baseUrl = 'https://addons.mozilla.org/api/v5'
    }

    log(emoji, message, details = null) {
        console.log(`${emoji} ${message}`)
        if (details && typeof details === 'object') {
            console.log(JSON.stringify(details, null, 2))
        } else if (details) {
            console.log(details)
        }
    }

    logCredentials() {
        this.log('🦊', 'Starting Firefox extension publishing...')
        console.log(`API Key: ${this.apiKey}`)
        console.log(`Addon ID: ${this.addonId}`)
    }

    ensureCredentials() {
        if (!this.apiKey || !this.apiSecret || !this.addonId) {
            this.log('❌', 'Missing required Firefox environment variables!')
            console.log('Please set: mozApiKey, mozApiSecret')
            throw new Error('Missing required Firefox API credentials')
        }
    }

    getJWT() {
        return JWT.sign({ iss: this.apiKey }, this.apiSecret, {
            algorithm: 'HS256',
            expiresIn: '5m'
        })
    }

    get headers() {
        return { Authorization: `JWT ${this.getJWT()}` }
    }

    async uploadExtension() {
        this.log('📤', 'Uploading Firefox extension...')

        const uploadForm = new FormData()
        uploadForm.set('channel', 'listed')
        uploadForm.set('upload', await fileFromPath(path.join(__dirname, '../extension_firefox.zip')))

        try {
            const fileUpload = await got
                .post(`${this.baseUrl}/addons/upload/`, {
                    headers: this.headers,
                    body: uploadForm
                })
                .json()

            this.log('✅', `Upload initiated (UUID: ${fileUpload.uuid})`)
            return fileUpload
        } catch (error) {
            this.log('❌', 'Extension upload failed', error.message)
            throw error
        }
    }

    async waitForValidation(fileUpload) {
        this.log('⏳', 'Waiting for validation...')

        let attempts = 0
        const maxAttempts = 20 // 50 seconds max

        while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2500))
            attempts++

            try {
                const status = await got
                    .get(fileUpload.url, {
                        headers: this.headers
                    })
                    .json()

                if (status.valid === true) {
                    this.log('✅', 'Extension validation passed')
                    this.logValidationSummary(status.validation)
                    return status
                } else if (status.processed && status.validation) {
                    this.log('❌', 'Extension validation failed')
                    this.log('📋', 'Validation details:', status.validation)
                    throw new Error(`Validation failed: ${JSON.stringify(status.validation.messages, null, 2)}`)
                }

                this.log('⏳', `Validation in progress... (attempt ${attempts}/${maxAttempts})`)
            } catch (error) {
                if (error.message.includes('Validation failed')) {
                    throw error
                }
                this.log('⚠️', `Validation check failed (attempt ${attempts}): ${error.message}`)
            }
        }

        throw new Error('Timeout waiting for validation to complete')
    }

    logValidationSummary(validation) {
        if (!validation) return

        const { errors = 0, warnings = 0, notices = 0 } = validation
        if (errors > 0) {
            this.log('🚨', `Validation: ${errors} errors, ${warnings} warnings, ${notices} notices`)
        } else if (warnings > 0) {
            this.log('⚠️', `Validation: ${warnings} warnings, ${notices} notices`)
        } else {
            this.log('✅', `Validation clean: ${notices} notices`)
        }
    }

    async createVersion(fileUpload) {
        this.log('🚢', 'Creating new version...')

        const uploadForm = new FormData()
        uploadForm.set('source', await fileFromPath(path.join(__dirname, '../extension_firefox_source.zip')))
        uploadForm.set('upload', fileUpload.uuid)

        try {
            const version = await got
                .post(`${this.baseUrl}/addons/addon/${this.addonId}/versions/`, {
                    headers: this.headers,
                    body: uploadForm
                })
                .json()

            this.log('🎉', `Version ${version.version} created successfully`)
            this.log('📋', `Edit URL: ${version.edit_url}`)
            this.log('📦', `File status: ${version.file.status}`)

            return version
        } catch (error) {
            if (error.response?.statusCode === 409) {
                this.log('⚠️', 'Version already exists (409 conflict)')
                this.log('ℹ️', 'This usually means the version was already published')
                return { conflict: true, version: fileUpload.version }
            }
            this.log('❌', 'Version creation failed', error.message)
            throw error
        }
    }

    async publishExtension() {
        this.ensureCredentials()
        this.logCredentials()

        const fileUpload = await this.uploadExtension()
        const validatedUpload = await this.waitForValidation(fileUpload)
        const version = await this.createVersion(validatedUpload)

        this.log('🎉', 'Firefox extension published successfully!')
        return version
    }
}
