import { validateRequired, sanitizeLimit } from '../utils/index.js';
export class AppHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listApps(args = {}) {
        const { limit = 100, bundleId } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (bundleId) {
            params['filter[bundleId]'] = bundleId;
        }
        return this.client.get('/apps', params);
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
    async findAppByBundleId(bundleId) {
        const response = await this.listApps({ bundleId, limit: 1 });
        if (response.data && response.data.length > 0) {
            return response.data[0];
        }
        return null;
    }
}
