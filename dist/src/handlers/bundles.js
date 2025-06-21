import { validateRequired, sanitizeLimit, buildFilterParams, buildFieldParams } from '../utils/index.js';
export class BundleHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async createBundleId(args) {
        const { identifier, name, platform, seedId } = args;
        validateRequired(args, ['identifier', 'name', 'platform']);
        const requestBody = {
            data: {
                type: "bundleIds",
                attributes: {
                    identifier,
                    name,
                    platform,
                    seedId
                }
            }
        };
        return this.client.post('/bundleIds', requestBody);
    }
    async listBundleIds(args = {}) {
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
        return this.client.get('/bundleIds', params);
    }
    async getBundleIdInfo(args) {
        const { bundleIdId, include, fields } = args;
        validateRequired(args, ['bundleIdId']);
        const params = {};
        Object.assign(params, buildFieldParams(fields));
        if (include?.length) {
            params.include = include.join(',');
        }
        return this.client.get(`/bundleIds/${bundleIdId}`, params);
    }
    async enableBundleCapability(args) {
        const { bundleIdId, capabilityType, settings } = args;
        validateRequired(args, ['bundleIdId', 'capabilityType']);
        const requestBody = {
            data: {
                type: "bundleIdCapabilities",
                attributes: {
                    capabilityType,
                    settings
                },
                relationships: {
                    bundleId: {
                        data: {
                            id: bundleIdId,
                            type: "bundleIds"
                        }
                    }
                }
            }
        };
        return this.client.post('/bundleIdCapabilities', requestBody);
    }
    async disableBundleCapability(args) {
        const { capabilityId } = args;
        validateRequired(args, ['capabilityId']);
        await this.client.delete(`/bundleIdCapabilities/${capabilityId}`);
        return {
            success: true,
            message: "Capability disabled successfully"
        };
    }
}
