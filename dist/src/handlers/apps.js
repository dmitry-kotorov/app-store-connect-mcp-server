import { validateRequired, sanitizeLimit } from '../utils/index.js';
export class AppHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listApps(args = {}) {
        const { limit = 100 } = args;
        return this.client.get('/apps', {
            limit: sanitizeLimit(limit)
        });
    }
    async getAppInfo(args) {
        const { appId, include } = args;
        validateRequired(args, ['appId']);
        const params = {};
        if (include?.length) {
            params.include = include.join(',');
        }
        return this.client.get(`/apps/${appId}`, params);
    }
}
