import { ASC_V2_BASE } from '../services/index.js';
import { PURCHASE_VERSION_STATES, } from '../types/index.js';
import { validateRequired, validateEnum, sanitizeLimit, pathId } from '../utils/index.js';
/**
 * In-App Purchases & subscriptions, built on the version-based resources Apple
 * introduced in July 2026. Localizations and images are reached only through a
 * version (inAppPurchaseVersions / subscriptionVersions / subscriptionGroupVersions);
 * the parent-level v1 localization/image/submission resources are deprecated and
 * are deliberately never included or traversed here.
 *
 * Version resources have no collection GET, so all reads go via relationship
 * traversal from the parent.
 */
export class PurchaseHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listInAppPurchases(args) {
        validateRequired(args, ['appId']);
        const { appId, state, inAppPurchaseType, productId, includeVersions = true, limit = 100 } = args;
        const params = { limit: sanitizeLimit(limit, 200) };
        if (state?.length)
            params['filter[state]'] = state.join(',');
        if (inAppPurchaseType?.length)
            params['filter[inAppPurchaseType]'] = inAppPurchaseType.join(',');
        if (productId?.length)
            params['filter[productId]'] = productId.join(',');
        if (includeVersions) {
            params['include'] = 'versions';
            params['limit[versions]'] = 50;
        }
        return this.client.get(`/apps/${pathId(appId, 'appId')}/inAppPurchasesV2`, params);
    }
    async listSubscriptionGroups(args) {
        validateRequired(args, ['appId']);
        const { appId, includeSubscriptions = true, includeVersions = true, limit = 100 } = args;
        const params = { limit: sanitizeLimit(limit, 200) };
        const include = [];
        if (includeSubscriptions) {
            include.push('subscriptions');
            params['limit[subscriptions]'] = 50;
        }
        if (includeVersions) {
            include.push('versions');
            params['limit[versions]'] = 50;
        }
        if (include.length)
            params['include'] = include.join(',');
        return this.client.get(`/apps/${pathId(appId, 'appId')}/subscriptionGroups`, params);
    }
    async listSubscriptions(args) {
        validateRequired(args, ['subscriptionGroupId']);
        const { subscriptionGroupId, state, productId, includeVersions = true, limit = 100 } = args;
        const params = { limit: sanitizeLimit(limit, 200) };
        if (state?.length)
            params['filter[state]'] = state.join(',');
        if (productId?.length)
            params['filter[productId]'] = productId.join(',');
        if (includeVersions) {
            params['include'] = 'versions';
            params['limit[versions]'] = 50;
        }
        return this.client.get(`/subscriptionGroups/${pathId(subscriptionGroupId, 'subscriptionGroupId')}/subscriptions`, params);
    }
    async listInAppPurchaseVersions(args) {
        validateRequired(args, ['inAppPurchaseId']);
        return this.client.get(`${ASC_V2_BASE}/inAppPurchases/${pathId(args.inAppPurchaseId, 'inAppPurchaseId')}/versions`, this.versionListParams(args));
    }
    async listSubscriptionVersions(args) {
        validateRequired(args, ['subscriptionId']);
        return this.client.get(`/subscriptions/${pathId(args.subscriptionId, 'subscriptionId')}/versions`, this.versionListParams(args));
    }
    async listSubscriptionGroupVersions(args) {
        validateRequired(args, ['subscriptionGroupId']);
        return this.client.get(`/subscriptionGroups/${pathId(args.subscriptionGroupId, 'subscriptionGroupId')}/versions`, this.versionListParams(args));
    }
    /** Create a new editable version of an IAP (e.g. to change metadata of an approved product). */
    async createInAppPurchaseVersion(args) {
        validateRequired(args, ['inAppPurchaseId']);
        return this.client.post('/inAppPurchaseVersions', {
            data: {
                type: 'inAppPurchaseVersions',
                relationships: {
                    inAppPurchase: { data: { type: 'inAppPurchases', id: args.inAppPurchaseId } },
                },
            },
        });
    }
    async createSubscriptionVersion(args) {
        validateRequired(args, ['subscriptionId']);
        return this.client.post('/subscriptionVersions', {
            data: {
                type: 'subscriptionVersions',
                relationships: {
                    subscription: { data: { type: 'subscriptions', id: args.subscriptionId } },
                },
            },
        });
    }
    async createSubscriptionGroupVersion(args) {
        validateRequired(args, ['subscriptionGroupId']);
        return this.client.post('/subscriptionGroupVersions', {
            data: {
                type: 'subscriptionGroupVersions',
                relationships: {
                    subscriptionGroup: { data: { type: 'subscriptionGroups', id: args.subscriptionGroupId } },
                },
            },
        });
    }
    versionListParams(args) {
        const { state, includeLocalizations = false, limit = 100 } = args;
        const params = { limit: sanitizeLimit(limit, 200) };
        const validState = validateEnum(state, PURCHASE_VERSION_STATES, 'state');
        if (validState)
            params['filter[state]'] = validState;
        if (includeLocalizations) {
            params['include'] = 'localizations';
            params['limit[localizations]'] = 50;
        }
        return params;
    }
}
