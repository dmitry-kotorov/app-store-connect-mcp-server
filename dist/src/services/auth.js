import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
export class AuthService {
    config;
    constructor(config) {
        this.config = config;
    }
    async generateToken() {
        const privateKey = await fs.readFile(this.config.privateKeyPath, 'utf-8');
        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '20m', // App Store Connect tokens can be valid for up to 20 minutes
            audience: 'appstoreconnect-v1',
            keyid: this.config.keyId,
            issuer: this.config.issuerId,
        });
        return token;
    }
    validateConfig() {
        if (!this.config.keyId || !this.config.issuerId || !this.config.privateKeyPath) {
            throw new Error("Missing required environment variables. Please set: " +
                "APP_STORE_CONNECT_KEY_ID, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_P8_PATH");
        }
    }
}
