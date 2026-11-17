import axios from 'axios';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { AppStoreConnectClient } from '../services/index.js';
import {
  AnalyticsReportRequest,
  AnalyticsReportRequestResponse,
  ListAnalyticsReportRequestsResponse,
  CompactList,
  ListAnalyticsReportsResponse,
  ListAnalyticsReportInstancesResponse,
  ListAnalyticsReportSegmentsResponse,
  AnalyticsAccessType,
  AnalyticsReportCategory,
  AnalyticsGranularity,
  SalesReportType,
  SalesReportSubType,
  SalesReportFrequency,
  SalesReportFilters,
  FinanceReportFilters,
  FinanceReportType
} from '../types/index.js';
import {
  validateRequired,
  sanitizeLimit,
  buildFilterParams,
  pathId,
  shapeReport,
  ReportShapeOptions
} from '../utils/index.js';

/** Report-shaping arguments shared by the sales report and segment download tools. */
type ShapeArgs = Pick<ReportShapeOptions, 'filter' | 'groupBy' | 'sum' | 'columns' | 'limit'>;

const shapeOptions = (args: ShapeArgs, extraFilter: Record<string, string | string[] | undefined> = {}): ReportShapeOptions => {
  const filter: Record<string, string | string[]> = { ...(args.filter ?? {}) };
  for (const [column, value] of Object.entries(extraFilter)) {
    if (value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      filter[column] = value;
    }
  }
  return { filter, groupBy: args.groupBy, sum: args.sum, columns: args.columns, limit: args.limit };
};

/** Apple answers a duplicate ONGOING request with 409 "You already have such an entity". */
const isAlreadyExistsError = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  (error.response?.status === 409 ||
    ((error.response?.data as any)?.errors ?? []).some((e: any) =>
      /already have such an entity/i.test(String(e?.detail ?? ''))));

const compactList = (response: { data: Array<{ id: string; attributes?: Record<string, unknown> }>; meta?: any }): CompactList => ({
  total: response.meta?.paging?.total,
  data: response.data.map(item => ({ id: item.id, ...(item.attributes ?? {}) })),
});

export class AnalyticsHandlers {
  constructor(private client: AppStoreConnectClient, private config?: { vendorNumber?: string }) {}

  async createAnalyticsReportRequest(args: {
    appId: string;
    accessType?: AnalyticsAccessType;
  }): Promise<AnalyticsReportRequestResponse | { alreadyExisted: true; data: CompactList['data'] }> {
    const { appId, accessType = "ONE_TIME_SNAPSHOT" } = args;

    validateRequired(args, ['appId']);

    const requestBody: AnalyticsReportRequest = {
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
      return await this.client.post<AnalyticsReportRequestResponse>('/analyticsReportRequests', requestBody);
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
      // Apple's error carries no id; look the existing request up instead.
      const existing = await this.listAnalyticsReportRequests({ appId, accessType });
      if (existing.data.length === 0) throw error;
      return { alreadyExisted: true, data: existing.data };
    }
  }

  async listAnalyticsReportRequests(args: {
    appId: string;
    accessType?: AnalyticsAccessType;
    limit?: number;
  }): Promise<CompactList> {
    const { appId, accessType, limit = 50 } = args;

    validateRequired(args, ['appId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit, 200),
      'fields[analyticsReportRequests]': 'accessType,stoppedDueToInactivity',
    };
    if (accessType) params['filter[accessType]'] = accessType;

    return compactList(await this.client.get<ListAnalyticsReportRequestsResponse>(
      `/apps/${pathId(appId, 'appId')}/analyticsReportRequests`,
      params
    ));
  }

  async listAnalyticsReports(args: {
    reportRequestId: string;
    limit?: number;
    filter?: {
      category?: AnalyticsReportCategory;
      name?: string;
    };
  }): Promise<CompactList> {
    const { reportRequestId, limit = 200, filter } = args;

    validateRequired(args, ['reportRequestId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit, 200),
      'fields[analyticsReports]': 'name,category',
    };

    Object.assign(params, buildFilterParams(filter));

    return compactList(await this.client.get<ListAnalyticsReportsResponse>(`/analyticsReportRequests/${pathId(reportRequestId, 'reportRequestId')}/reports`, params));
  }

  async listAnalyticsReportInstances(args: {
    reportId: string;
    granularity?: AnalyticsGranularity;
    processingDate?: string | string[];
    limit?: number;
  }): Promise<CompactList> {
    const { reportId, granularity, processingDate, limit = 200 } = args;

    validateRequired(args, ['reportId']);

    const params: Record<string, any> = {
      limit: sanitizeLimit(limit, 200),
      'fields[analyticsReportInstances]': 'granularity,processingDate',
      ...buildFilterParams({ granularity, processingDate }),
    };

    return compactList(await this.client.get<ListAnalyticsReportInstancesResponse>(
      `/analyticsReports/${pathId(reportId, 'reportId')}/instances`,
      params
    ));
  }

  async listAnalyticsReportSegments(args: {
    instanceId: string;
    limit?: number;
  }): Promise<CompactList> {
    const { instanceId, limit = 200 } = args;

    validateRequired(args, ['instanceId']);

    // The pre-signed url is ~1 KB of noise per segment and expires; the download
    // tool fetches a fresh one by segment id, so it is left out here.
    return compactList(await this.client.get<ListAnalyticsReportSegmentsResponse>(
      `/analyticsReportInstances/${pathId(instanceId, 'instanceId')}/segments`,
      {
        limit: sanitizeLimit(limit, 200),
        'fields[analyticsReportSegments]': 'checksum,sizeInBytes',
      }
    ));
  }

  async downloadAnalyticsReportSegment(args: ShapeArgs & {
    segmentId?: string;
    instanceId?: string;
  }): Promise<string> {
    const { segmentId, instanceId } = args;

    if (!segmentId === !instanceId) {
      throw new McpError(ErrorCode.InvalidParams, 'Provide exactly one of segmentId or instanceId');
    }

    let urls: string[];
    let title: string;
    if (segmentId) {
      const segment = await this.client.get<{ data: { attributes: { url: string } } }>(
        `/analyticsReportSegments/${pathId(segmentId, 'segmentId')}`,
        { 'fields[analyticsReportSegments]': 'url' }
      );
      urls = [segment.data.attributes.url];
      title = `Segment ${segmentId}`;
    } else {
      const segments = await this.client.get<ListAnalyticsReportSegmentsResponse>(
        `/analyticsReportInstances/${pathId(instanceId, 'instanceId')}/segments`,
        { limit: 200, 'fields[analyticsReportSegments]': 'url' }
      );
      urls = segments.data.map(s => s.attributes.url!).filter(Boolean);
      title = `Instance ${instanceId} (${urls.length} segment${urls.length === 1 ? '' : 's'})`;
      if (urls.length === 0) return `${title}: no segments.`;
    }

    // Segments of one instance share a header; keep the first and append the rows.
    const parts: string[] = [];
    for (const url of urls) {
      const text = (await this.client.downloadPresignedUrl(url)).toString('utf8');
      parts.push(parts.length === 0 ? text : text.split(/\r?\n/).slice(1).join('\n'));
    }

    return shapeReport(parts.join('\n'), shapeOptions(args), title);
  }

  async downloadSalesReport(args: ShapeArgs & {
    vendorNumber?: string;
    reportType?: SalesReportType;
    reportSubType?: SalesReportSubType;
    frequency?: SalesReportFrequency;
    reportDate: string;
    version?: string;
    appleId?: string;
    sku?: string;
    countryCode?: string | string[];
    productTypeIdentifier?: string | string[];
  }): Promise<string> {
    const {
      vendorNumber = this.config?.vendorNumber,
      reportType = "SALES",
      reportSubType = "SUMMARY",
      frequency = "MONTHLY",
      reportDate,
      version
    } = args;

    if (!vendorNumber) {
      throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
    }

    validateRequired({ reportDate }, ['reportDate']);

    const filters: SalesReportFilters = {
      reportDate,
      reportType,
      reportSubType,
      frequency,
      vendorNumber,
      version
    };

    const file = await this.client.getFile('/salesReports', buildFilterParams(filters));

    return shapeReport(
      file.toString('utf8'),
      shapeOptions(args, {
        'Apple Identifier': args.appleId,
        'SKU': args.sku,
        'Country Code': args.countryCode,
        'Product Type Identifier': args.productTypeIdentifier,
      }),
      `${reportType} ${reportSubType} ${frequency} ${reportDate}`
    );
  }

  async downloadFinanceReport(args: {
    vendorNumber?: string;
    reportDate: string;
    regionCode: string;
    reportType?: FinanceReportType;
    limit?: number;
  }): Promise<string> {
    const { vendorNumber = this.config?.vendorNumber, reportDate, regionCode, reportType = 'FINANCIAL' } = args;

    if (!vendorNumber) {
      throw new Error('Vendor number is required. Please provide it as an argument or set APP_STORE_CONNECT_VENDOR_NUMBER environment variable.');
    }

    validateRequired({ reportDate, regionCode }, ['reportDate', 'regionCode']);

    const filters: FinanceReportFilters = {
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
