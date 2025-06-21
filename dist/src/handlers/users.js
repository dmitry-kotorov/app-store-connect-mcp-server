import { sanitizeLimit, buildFilterParams } from '../utils/index.js';
export class UserHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listUsers(args = {}) {
        const { limit = 100, sort, filter, include } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        Object.assign(params, buildFilterParams(filter));
        if (Array.isArray(include) && include.length > 0) {
            params.include = include.join(',');
        }
        return this.client.get('/users', params);
    }
}
