class EdgeClient {
    constructor({ apiKey, clientId, productId }) {
        this.apiKey = apiKey
        this.clientId = clientId
        this.productId = productId
        this.baseUrl = `https://api.addons.microsoftedge.microsoft.com/v1/products/${productId}/submissions`
    }

    mask(value, visible = 4) {
        return value ? `${value.substring(0, visible)}...` : 'NOT SET'
    }

    get headers() {
        return {
            Authorization: `ApiKey ${this.apiKey}`,
            'X-ClientID': this.clientId
        }
    }

    logCredentials() {
        console.log('� Starting Edge extension publishing...')
        console.log(`Product ID: ${this.mask(this.productId, 8)}`)
        console.log(`Client ID: ${this.mask(this.clientId, 8)}`)
        console.log(`API Key: ${this.mask(this.apiKey, 4)}`)
    }

    ensureCredentials() {
        if (!this.apiKey || !this.clientId || !this.productId) {
            console.log('\n❌ Missing required environment variables!')
            console.log('Please set: edge_api_key, edge_client_id, edge_product_id')
            console.log('Get these from: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
            throw new Error('Missing required Edge API credentials')
        }
    }

    async fetchJson(url, options) {
        try {
            const res = await fetch(url, options)
            let data = null
            const text = await res.clone().text()

            if (text) {
                try {
                    data = JSON.parse(text)
                } catch {
                    // If JSON parsing fails, keep data as null and return text as rawBody
                }
            }

            return { res, data, rawBody: text }
        } catch (error) {
            throw new Error(`Network request failed: ${error.message}`)
        }
    }

    log(emoji, message, details = null) {
        console.log(`${emoji} ${message}`)
        if (details) console.log(details)
    }

    handleApiError(res, rawBody, context) {
        if (rawBody) this.log('⚠️', `${context} error response:`, rawBody)

        if (res.status === 401 || res.status === 403) {
            this.log('🔑', 'API Key might be expired or invalid!')
            console.log('Please check your credentials at: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
        } else if (res.status === 404) {
            this.log('❌', 'Product not found!')
            console.log('Please verify your product ID at: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
            console.log(`Current product ID: ${this.mask(this.productId, 8)}`)
        }

        throw new Error(`${context} failed with status ${res.status}${rawBody ? `: ${rawBody}` : ''}`)
    }

    async checkSubmissionStatus() {
        this.log('🔍', 'Checking current submission status...')
        const { res, data, rawBody } = await this.fetchJson(this.baseUrl, {
            headers: this.headers,
            method: 'GET'
        })

        if (res.status === 200 && data) {
            this.log('ℹ️', `Current submission status: ${data.status}`)
            return data
        }
        if (res.status === 404) {
            this.log('ℹ️', 'No current submission found')
            return null
        }

        this.log('⚠️', `Failed to check submission status: ${res.status}`, rawBody)
        return null
    }

    async cancelSubmission() {
        console.log('❌ Cancelling existing submission...')
        const { res, body } = await this.fetchJson(this.baseUrl, {
            headers: this.headers,
            method: 'DELETE'
        })

        if (res.status === 202) {
            const operationId = res.headers.get('location')
            console.log(`Cancel operation ID: ${operationId}`)
            return operationId
        }
        console.log('Cancel response body:', body)
        throw new Error(`Failed to cancel submission: ${res.status}`)
    }

    async waitForOperation(operationId, { type, timeoutMs = 10 * 60 * 1000, pollIntervalMs = 5000 }) {
        const startTime = Date.now()
        const operationUrl =
            type === 'upload' ? `${this.baseUrl}/draft/package/operations/${operationId}` : `${this.baseUrl}/operations/${operationId}`

        let status
        do {
            const { data } = await this.fetchJson(operationUrl, { headers: this.headers })
            if (data && Object.keys(data).length > 0) {
                status = data
            } else {
                status = {} // or handle as appropriate for empty response
            }

            if (type === 'cancel') {
                console.log(`Cancellation status: ${status.status}`)
            }

            if (status.status === 'Failed') {
                throw new Error(`Operation failed: ${status.message} (code ${status.errorCode})`)
            }
            if (Date.now() - startTime > timeoutMs) {
                throw new Error('Timed out waiting for operation to complete')
            }

            if (status.status !== 'Succeeded') {
                await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
            }
        } while (status.status !== 'Succeeded')
    }

    async uploadPackage(file) {
        console.log('📤 Uploading package...')
        console.log(`Client ID: ${this.mask(this.clientId, 8)}`)

        const { res, body } = await this.fetchJson(`${this.baseUrl}/draft/package`, {
            headers: {
                ...this.headers,
                'Content-Type': 'application/zip'
            },
            duplex: 'half',
            method: 'POST',
            body: file
        })

        console.log(`Upload response status: ${res.status}`)
        console.log('Upload response headers:', Object.fromEntries(res.headers.entries()))

        if (res.status !== 202) {
            if (body) console.log('Error response body:', body)
            if (res.status === 401 || res.status === 403) {
                console.log('\n🔑 API Key might be expired or invalid!')
                console.log('Please check your credentials at: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
            } else if (res.status === 404) {
                console.log('\n❌ Product not found!')
                console.log('Please verify your product ID at: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
                console.log(`Current product ID: ${this.mask(this.productId, 8)}`)
            }

            throw new Error(`Got status ${res.status} when uploading add-on.${body ? ` Error: ${body}` : ''}`)
        }

        const operationId = res.headers.get('location')
        if (!operationId) throw new Error('Failed to get operation ID from response')

        console.log(`Upload operation ID: ${operationId}`)
        return operationId
    }

    async publishSubmission() {
        console.log('🚢 Triggering publish...')
        const { res, body } = await this.fetchJson(this.baseUrl, {
            headers: this.headers,
            method: 'POST'
        })

        console.log(`Publish response status: ${res.status}`)

        if (res.status !== 202) {
            if (body) console.log('Publish error response body:', body)
            if (res.status === 401 || res.status === 403) {
                console.log('\n🔑 API Key might be expired or invalid for publishing!')
                console.log('Please check your credentials at: https://partner.microsoft.com/en-us/dashboard/microsoftedge/publishapi')
            }

            throw new Error(`Got status ${res.status} when publishing add-on.${body ? ` Error: ${body}` : ''}`)
        }

        const operationId = res.headers.get('location')
        if (!operationId) throw new Error('Failed to get operation ID from response')

        console.log(`Publish operation ID: ${operationId}`)
        return operationId
    }

    async ensureReadyForPublish() {
        const currentSubmission = await this.checkSubmissionStatus()
        if (!currentSubmission) return

        if (['InReview', 'InQueue', 'Publishing'].includes(currentSubmission.status)) {
            console.log(`⚠️  Submission is currently ${currentSubmission.status}. Cancelling to proceed with new submission...`)
            const cancelOperationId = await this.cancelSubmission()
            await this.waitForOperation(cancelOperationId, { type: 'cancel', timeoutMs: 5 * 60 * 1000 })
        } else {
            console.log(`ℹ️  Current submission status: ${currentSubmission.status}`)
        }
    }
}

export { EdgeClient }
