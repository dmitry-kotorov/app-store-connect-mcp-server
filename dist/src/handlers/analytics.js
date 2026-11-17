import axios from 'axios';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { validateRequired, sanitizeLimit, buildFilterParams, pathId, shapeReport } from '../utils/index.js';
const shapeOptions = (args, extraFilter = {}) => {
    const filter = { ...(args.filter ?? {}) };
    for (const [column, value] of Object.entries(extraFilter)) {
        if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            filter[column] = value;
        }
    }
    return { filter, groupBy: args.groupBy, sum: args.sum, columns: args.columns, limit: args.limit };
};
/** Apple answers a duplicate ONGOING request with 409 "You already have such an entity". */
const isAlreadyExistsError = (error) => axios.isAxiosError(error) &&
    (error.response?.status === 409 ||
        (error.response?.data?.errors ?? []).some((e) => /already have such an entity/i.test(String(e?.detail ?? ''))));
const compactList = (response) => ({
    total: response.meta?.paging?.total,
    data: response.data.map(item => ({ id: item.id, ...(item.attributes ?? {}) })),
});
export class AnalyticsHandlers {
    client;
    config;
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    async createAnalyticsReportRequest(args) {
        const { appId, accessType = "ONE_TIME_SNAPSHOT" } = args;
        validateRequired(args, ['appId']);
        const requestBody = {
            data: {
                type: "analyticsReportRequests",
                attributes: {
                    accessType
                },
                relationships: {
                    app: {
                        data: {
                            id: appId,
                            type: "apps"
                        }
                    }
                }
            }
        };
        try {
            return await this.client.post('/analyticsReportRequests', requestBody);
        }
        catch (error) {
            if (!isAlreadyExistsError(error))
                throw error;
            // Apple's error carries no id; look the existing request up instead.
            const existing = await this.listAnalyticsReportRequests({ appId, accessType });
            if (existing.data.length === 0)
                throw error;
            return { alreadyExisted: true, data: existing.data };
        }
    }
    async listAnalyticsReportRequests(args) {
        const { appId, accessType, limit = 50 } = args;
        validateRequired(args, ['appId']);
        const params = {
            limit: sanitizeLimit(limit, 200),
            'fields[analyticsReportRequests]': 'accessType,stoppedDueToInactivity',
        };
        if (accessType)
            params['filter[accessType]'] = accessType;
        return compactList(await this.client.get(`/apps/${pathId(appId, 'appId')}/analyticsReportRequests`, params));
    }
    async listAnalyticsReports(args) {
        const { reportRequestId, limit = 200, filter } = args;
        validateRequired(args, ['reportRequestId']);
        const params = {
            limit: sanitizeLimit(limit, 200),
            'fields[analyticsReports]': 'name,category',
        };
        Object.assign(params, buildFilterParams(filter));
        return compactList(await this.client.get(`/analyticsReportRequests/${pathId(reportRequestId, 'reportRequestId')}/reports`, params));
    }
    async listAnalyticsReportInstances(args) {
        const { reportId, granularity, processingDate, limit = 200 } = args;
        validateRequired(args, ['reportId']);
        const params = {
            limit: sanitizeLimit(limit, 200),
            'fields[analyticsReportInstances]': 'granularity,processingDate',
            ...buildFilterParams({ granularity, processingDate }),
        };
        return compactList(await this.client.get(`/analyticsReports/${pathId(reportId, 'reportId')}/instances`, params));
    }
    async listAnalyticsReportSegments(args) {
        const { instanceId, limit = 200 } = args;
        validateRequired(args, ['instanceId']);
        // The pre-signed url is ~1 KB of noise per segment and expires; the download
        // tool fetches a fresh one by segment id, so it is left out here.
        return compactList(await this.client.get(`/analyticsReportInstances/${pathId(instanceId, 'instanceId')}/segments`, {
            limit: sanitizeLimit(limit, 200),
            'fields[analyticsReportSegments]': 'checksum,sizeInBytes',
        }));
    }
    async downloadAnalyticsReportSegment(args) {
        const { segmentId, instanceId } = args;
        if (!segmentId === !instanceId) {
            throw new McpError(ErrorCode.InvalidParams, 'Provide exactly one of segmentId or instanceId');
        }
        let urls;
        let title;
        if (segmentId) {
            const segment = await this.client.get(`/analyticsReportSegments/${pathId(segmentId, 'segmentId')}`, { 'fields[analyticsReportSegments]': 'url' });
            urls = [segment.data.attributes.url];
            title = `Segment ${segmentId}`;
        }
        else {
            const segments = await this.client.get(`/analyticsReportInstances/${pathId(instanceId, 'instanceId')}/segments`, { limit: 200, 'fields[analyticsReportSegments]': 'url' });
            urls = segments.data.map(s => s.attributes.url).filter(Boolean);
            title = `Instance ${instanceId} (${urls.length} segment${urls.length === 1 ? '' : 's'})`;
            if (urls.length === 0)
                return `${title}: no segments.`;
        }
        // Segments of one instance share a header; keep the first and append the rows.
        const parts = [];
        for (const url of urls) {
            const text = (await this.client.downloadPresignedUrl(url)).toString('utf8');
            parts.push(parts.length === 0 ? text : text.split(/\r?\n/).slice(1).join('\n'));
        }
        return shapeReport(parts.join('\n'), shapeOptions(args), title);
    }
    async downloadSalesReport(args) {
        const { vendorNumber = this.config?.vendorNumber, reportType = "SALES", reportSubType = "SUMMARY", frequency = "MONTHLY", reportDate, version } = args;
        if (!vendorNumber) {
            throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
        }
        validateRequired({ reportDate }, ['reportDate']);
        const filters = {
            reportDate,
            reportType,
            reportSubType,
            frequency,
            vendorNumber,
            version
        };
        const file = await this.client.getFile('/salesReports', buildFilterParams(filters));
        return shapeReport(file.toString('utf8'), shapeOptions(args, {
            'Apple Identifier': args.appleId,
            'SKU': args.sku,
            'Country Code': args.countryCode,
            'Product Type Identifier': args.productTypeIdentifier,
        }), `${reportType} ${reportSubType} ${frequency} ${reportDate}`);
    }
    async downloadFinanceReport(args) {
        const { vendorNumber = this.config?.vendorNumber, reportDate, regionCode, reportType = 'FINANCIAL' } = args;
        if (!vendorNumber) {
            throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
        }
        validateRequired({ reportDate, regionCode }, ['reportDate', 'regionCode']);
        const filters = {
            reportDate,
            regionCode,
            reportType,
            vendorNumber
        };
        // Finance reports mix a detail table with summary/total lines, so they are
        // returned as text (line-limited) rather than parsed as a single table.
        const lines = (await this.client.getFile('/financeReports', buildFilterParams(filters)))
            .toString('utf8')
            .split(/\r?\n/);
        const limit = Math.min(Math.max(1, Number(args.limit) || 200), 2000);
        const shown = lines.slice(0, limit);
        const note = lines.length > limit
            ? `\n… ${lines.length - limit} more lines (raise limit, max 2000).`
            : '';
        return `${reportType} report ${regionCode} ${reportDate}: ${lines.length} lines\n\n${shown.join('\n')}${note}`;
    }
}
