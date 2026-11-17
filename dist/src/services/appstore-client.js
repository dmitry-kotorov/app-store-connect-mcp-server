import axios from 'axios';
import { gunzipSync } from 'zlib';
import { AuthService } from './auth.js';
/**
 * Absolute base for v2 resources (e.g. /v2/inAppPurchases). The axios baseURL is
 * pinned to /v1, so a relative "/v2/..." would resolve to "/v1/v2/..."; axios
 * ignores baseURL for absolute URLs, so v2 calls must use this prefix.
 */
export const ASC_V2_BASE = 'https://api.appstoreconnect.apple.com/v2';
export class AppStoreConnectClient {
    axiosInstance;
    authService;
    constructor(config) {
        this.authService = new AuthService(config);
        this.authService.validateConfig();
        this.axiosInstance = axios.create({
            baseURL: 'https://api.appstoreconnect.apple.com/v1',
        });
    }
    async request(method, url, data, params) {
        const token = await this.authService.generateToken();
        const response = await this.axiosInstance.request({
            method,
            url,
            data,
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    async get(url, params) {
        return this.request('GET', url, undefined, params);
    }
    async post(url, data) {
        return this.request('POST', url, data);
    }
    async put(url, data) {
        return this.request('PUT', url, data);
    }
    async delete(url, data) {
        return this.request('DELETE', url, data);
    }
    async patch(url, data) {
        return this.request('PATCH', url, data);
    }
    /**
     * GET an API resource whose body is a file (sales/finance reports are served as
     * application/a-gzip). Returns the body unpacked. On failure Apple's JSON error
     * body also arrives as bytes, so it is decoded back into an object before the
     * error is rethrown — the central handler in index.ts reads errors[].detail.
     */
    async getFile(url, params) {
        const token = await this.authService.generateToken();
        try {
            const response = await this.axiosInstance.get(url, {
                params,
                responseType: 'arraybuffer',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return gunzipIfNeeded(Buffer.from(response.data));
        }
        catch (error) {
            decodeBinaryErrorBody(error);
            throw error;
        }
    }
    /**
     * Download a pre-signed URL returned by the API (analytics report segments live
     * on S3). The URL carries its own signature, so no Authorization header is sent:
     * the API token must never leave api.appstoreconnect.apple.com.
     */
    async downloadPresignedUrl(url, maxBytes = 100 * 1024 * 1024) {
        if (!/^https:\/\//i.test(url)) {
            throw new Error(`Refusing to download a non-HTTPS URL: ${url}`);
        }
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                maxContentLength: maxBytes,
            });
            return gunzipIfNeeded(Buffer.from(response.data));
        }
        catch (error) {
            decodeBinaryErrorBody(error);
            throw error;
        }
    }
}
export function gunzipIfNeeded(buf) {
    return buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf) : buf;
}
function decodeBinaryErrorBody(error) {
    if (!axios.isAxiosError(error) || !error.response)
        return;
    const body = error.response.data;
    if (!(body instanceof ArrayBuffer) && !Buffer.isBuffer(body))
        return;
    const text = gunzipIfNeeded(Buffer.from(body)).toString('utf8');
    try {
        error.response.data = JSON.parse(text);
    }
    catch {
        error.response.data = { errors: [{ detail: text.slice(0, 500) }] };
    }
}
