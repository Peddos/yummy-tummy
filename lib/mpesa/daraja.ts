/**
 * M-Pesa Daraja API Integration
 * Handles STK Push, B2C payments, and transaction queries
 */

interface MpesaConfig {
    consumerKey: string
    consumerSecret: string
    shortcode: string // This is the Paybill or Till Number
    storeNumber?: string // Required for Buy Goods
    passkey: string
    callbackUrl: string
    environment: 'sandbox' | 'production'
    transactionType: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline'
}

interface STKPushRequest {
    phoneNumber: string
    amount: number
    accountReference: string
    transactionDesc: string
}

interface STKPushResponse {
    MerchantRequestID: string
    CheckoutRequestID: string
    ResponseCode: string
    ResponseDescription: string
    CustomerMessage: string
}

interface B2CRequest {
    phoneNumber: string
    amount: number
    remarks: string
    occasion: string
}

class DarajaAPI {
    private config: MpesaConfig
    private accessToken: string | null = null
    private tokenExpiry: number = 0

    constructor() {
        this.config = {
            consumerKey: process.env.MPESA_CONSUMER_KEY!,
            consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
            shortcode: process.env.MPESA_SHORTCODE!,
            storeNumber: process.env.MPESA_STORE_NUMBER,
            passkey: process.env.MPESA_PASSKEY!,
            callbackUrl: process.env.MPESA_CALLBACK_URL!,
            environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
            transactionType: (process.env.MPESA_TRANSACTION_TYPE as 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline') || 'CustomerPayBillOnline',
        }

        this.validateConfig()
    }

    private validateConfig() {
        const required = ['consumerKey', 'consumerSecret', 'shortcode', 'passkey', 'callbackUrl']
        for (const key of required) {
            if (!this.config[key as keyof MpesaConfig]) {
                throw new Error(`Missing M-Pesa configuration: ${key}`)
            }
        }

        if (this.config.transactionType === 'CustomerBuyGoodsOnline' && !this.config.storeNumber) {
            throw new Error('Missing M-Pesa configuration: storeNumber is required for Buy Goods')
        }
    }

    private getBaseUrl(): string {
        return this.config.environment === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke'
            : 'https://api.safaricom.co.ke'
    }

    /**
     * Get OAuth access token
     */
    async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken
        }

        const auth = Buffer.from(
            `${this.config.consumerKey}:${this.config.consumerSecret}`
        ).toString('base64')

        const response = await fetch(
            `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        )

        if (!response.ok) {
            throw new Error('Failed to get M-Pesa access token')
        }

        const data = await response.json()
        this.accessToken = data.access_token as string
        // Token expires in 3600 seconds, cache for 3500 to be safe
        this.tokenExpiry = Date.now() + 3500 * 1000

        return this.accessToken
    }

    /**
     * Generate password for STK Push
     */
    private generatePassword(): string {
        const timestamp = this.getTimestamp()
        const shortCode = this.config.transactionType === 'CustomerBuyGoodsOnline'
            ? this.config.storeNumber!
            : this.config.shortcode

        const password = Buffer.from(
            `${shortCode}${this.config.passkey}${timestamp}`
        ).toString('base64')
        return password
    }

    /**
     * Get current timestamp in format YYYYMMDDHHMMSS
     */
    private getTimestamp(): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        return `${year}${month}${day}${hours}${minutes}${seconds}`
    }

    /**
     * Format phone number for M-Pesa (254XXXXXXXXX)
     */
    private formatPhoneNumber(phone: string): string {
        let cleaned = phone.replace(/\D/g, '')

        if (cleaned.startsWith('0')) {
            cleaned = '254' + cleaned.substring(1)
        } else if (!cleaned.startsWith('254')) {
            cleaned = '254' + cleaned
        }

        return cleaned
    }

    /**
     * Initiate STK Push (Lipa Na M-Pesa Online)
     */
    async stkPush(request: STKPushRequest): Promise<STKPushResponse> {
        const accessToken = await this.getAccessToken()
        const timestamp = this.getTimestamp()
        const password = this.generatePassword()

        const isBuyGoods = this.config.transactionType === 'CustomerBuyGoodsOnline'

        const payload = {
            BusinessShortCode: isBuyGoods ? this.config.storeNumber! : this.config.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: this.config.transactionType,
            Amount: Math.round(request.amount),
            PartyA: this.formatPhoneNumber(request.phoneNumber),
            PartyB: this.config.shortcode, // Till Number for Buy Goods, Paybill for Paybill
            PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
            CallBackURL: this.config.callbackUrl,
            AccountReference: request.accountReference,
            TransactionDesc: request.transactionDesc,
        }

        const response = await fetch(
            `${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`STK Push failed: ${error.errorMessage || 'Unknown error'}`)
        }

        return await response.json()
    }

    /**
     * Query STK Push transaction status
     */
    async querySTKPush(checkoutRequestId: string): Promise<any> {
        const accessToken = await this.getAccessToken()
        const timestamp = this.getTimestamp()
        const password = this.generatePassword()

        const payload = {
            BusinessShortCode: this.config.shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
        }

        const response = await fetch(
            `${this.getBaseUrl()}/mpesa/stkpushquery/v1/query`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            throw new Error('Failed to query STK Push status')
        }

        return await response.json()
    }

    /**
     * B2C Payment (Business to Customer)
     * Used for vendor and rider payouts
     */
    async b2cPayment(request: B2CRequest): Promise<any> {
        const accessToken = await this.getAccessToken()

        const payload = {
            InitiatorName: 'apiuser', // Your initiator name from Daraja
            SecurityCredential: this.getSecurityCredential(),
            CommandID: 'BusinessPayment',
            Amount: Math.round(request.amount),
            PartyA: this.config.shortcode,
            PartyB: this.formatPhoneNumber(request.phoneNumber),
            Remarks: request.remarks,
            QueueTimeOutURL: `${this.config.callbackUrl}/timeout`,
            ResultURL: `${this.config.callbackUrl}/b2c`,
            Occasion: request.occasion,
        }

        const response = await fetch(
            `${this.getBaseUrl()}/mpesa/b2c/v1/paymentrequest`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`B2C Payment failed: ${error.errorMessage || 'Unknown error'}`)
        }

        return await response.json()
    }

    /**
     * Get security credential for B2C
     * In production, this should encrypt the initiator password with Safaricom's public key
     */
    private getSecurityCredential(): string {
        // For sandbox, use the test credential
        // In production, encrypt your initiator password
        return process.env.MPESA_SECURITY_CREDENTIAL || 'Safaricom999!*!'
    }

    /**
     * Verify callback authenticity
     */
    verifyCallback(body: any): boolean {
        // Add your callback verification logic here
        // You might want to check IP whitelist, signature, etc.
        return true
    }
}

// Export singleton instance
export const mpesa = new DarajaAPI()

// Export types
export type { STKPushRequest, STKPushResponse, B2CRequest }
