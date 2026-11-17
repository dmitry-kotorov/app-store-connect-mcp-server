import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { EXPERIMENT_STATES } from '../types/index.js';
import { pathId, sanitizeLimit, validateEnum, validateRequired } from '../utils/index.js';
/**
 * Product Page Optimization tests. Reads use the V2 list under /v1/apps/{id}
 * (the v1 appStoreVersionExperiments API is deprecated); tests created through
 * v1 appear there too, with the same ids.
 */
export class ExperimentHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    async listAppStoreVersionExperiments(args) {
        const { appId, since, limit = 200 } = args;
        validateRequired(args, ['appId']);
        const state = validateEnum(args.state, EXPERIMENT_STATES, 'state');
        const sinceTime = since ? Date.parse(since) : undefined;
        if (since && Number.isNaN(sinceTime)) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid since date: ${since} (use YYYY-MM-DD)`);
        }
        const params = {
            limit: sanitizeLimit(limit, 200),
            include: 'appStoreVersionExperimentTreatments,latestControlVersion',
            'limit[appStoreVersionExperimentTreatments]': 50,
            'fields[appStoreVersionExperiments]': 'name,platform,trafficProportion,state,reviewRequired,startDate,endDate,latestControlVersion,appStoreVersionExperimentTreatments',
            'fields[appStoreVersionExperimentTreatments]': 'name,appIconName,promotedDate',
            'fields[appStoreVersions]': 'versionString',
        };
        // filter[state] is applied below, not sent: checked live on 2026-11-17, Apple's
        // filter[state]=COMPLETED returned nothing for a test that reads back as COMPLETED.
        const response = await this.client.get(`/apps/${pathId(appId, 'appId')}/appStoreVersionExperimentsV2`, params);
        const included = new Map((response.included ?? []).map(r => [`${r.type}/${r.id}`, r]));
        const toOne = (rel) => (rel?.data ? included.get(`${rel.data.type}/${rel.data.id}`) : undefined);
        const experiments = response.data.map(e => {
            const a = e.attributes ?? {};
            const treatments = (e.relationships?.appStoreVersionExperimentTreatments?.data ?? [])
                .map(ref => included.get(`${ref.type}/${ref.id}`))
                .filter((t) => Boolean(t))
                .map(t => ({
                id: t.id,
                name: t.attributes?.name,
                appIconName: t.attributes?.appIconName,
                promotedDate: t.attributes?.promotedDate,
            }));
            return {
                id: e.id,
                name: a.name,
                state: a.state,
                platform: a.platform,
                trafficProportion: a.trafficProportion,
                reviewRequired: a.reviewRequired,
                startDate: a.startDate,
                endDate: a.endDate,
                controlVersion: toOne(e.relationships?.latestControlVersion)?.attributes?.versionString,
                applied: treatments.find(t => t.promotedDate)?.name ?? null,
                treatments,
            };
        });
        // A test counts for `since` if it was still running on or after that date.
        const filtered = experiments
            .filter(e => !state || e.state === state)
            .filter(e => sinceTime === undefined || !e.endDate || Date.parse(e.endDate) >= sinceTime);
        // Apple returns tests in name order; newest first is what a timeline review needs.
        filtered.sort((x, y) => (Date.parse(y.startDate ?? '') || Infinity) - (Date.parse(x.startDate ?? '') || Infinity));
        return { total: filtered.length, data: filtered };
    }
    async listExperimentTreatmentLocalizations(args) {
        const { treatmentId, locale } = args;
        validateRequired(args, ['treatmentId']);
        const params = {
            limit: 200,
            'fields[appStoreVersionExperimentTreatmentLocalizations]': 'locale',
        };
        if (locale)
            params['filter[locale]'] = locale;
        const response = await this.client.get(`/appStoreVersionExperimentTreatments/${pathId(treatmentId, 'treatmentId')}/appStoreVersionExperimentTreatmentLocalizations`, params);
        return {
            total: response.meta?.paging?.total ?? response.data.length,
            data: response.data.map(l => ({ id: l.id, ...(l.attributes ?? {}) })),
        };
    }
}
