import { sanitizeLimit, buildFilterParams, buildFieldParams } from '../utils/index.js';
export class DeviceHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listDevices(args = {}) {
        const { limit = 100, sort, filter, fields } = args;
        const params = {
            limit: sanitizeLimit(limit)
        };
        if (sort) {
            params.sort = sort;
        }
        Object.assign(params, buildFilterParams(filter));
        Object.assign(params, buildFieldParams(fields));
        return this.client.get('/devices', params);
    }
}
