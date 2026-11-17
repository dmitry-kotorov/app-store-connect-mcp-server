export type AnalyticsReportCategory =
  | 'APP_USAGE'
  | 'APP_STORE_ENGAGEMENT'
  | 'COMMERCE'
  | 'FRAMEWORK_USAGE'
  | 'PERFORMANCE';

export type AnalyticsGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type AnalyticsAccessType = 'ONGOING' | 'ONE_TIME_SNAPSHOT';

export interface AnalyticsReportRequest {
  data: {
    type: 'analyticsReportRequests';
    attributes: {
      accessType: AnalyticsAccessType;
    };
    relationships: {
      app: {
        data: {
          id: string;
          type: 'apps';
        };
      };
    };
  };
}

export interface AnalyticsReportRequestResponse {
  data: {
    id: string;
    type: 'analyticsReportRequests';
    attributes: {
      accessType: AnalyticsAccessType;
      stoppedDueToInactivity: boolean;
    };
    relationships: {
      app: {
        data: {
          id: string;
          type: 'apps';
        };
      };
      reports: {
        data: Array<{
          id: string;
          type: 'analyticsReports';
        }>;
      };
    };
  };
}

export interface AnalyticsReport {
  id: string;
  type: 'analyticsReports';
  attributes: {
    category: AnalyticsReportCategory;
    name: string;
  };
}

export interface AnalyticsReportInstance {
  id: string;
  type: 'analyticsReportInstances';
  attributes: {
    granularity: AnalyticsGranularity;
    processingDate: string;
  };
}

export interface AnalyticsReportSegment {
  id: string;
  type: 'analyticsReportSegments';
  attributes: {
    checksum: string;
    sizeInBytes: number;
    url?: string;
  };
}

/**
 * Flattened list result for the analytics chain: `{ id, ...attributes }` per item,
 * without links/relationships (a raw list of 194 reports is ~70k characters).
 */
export interface CompactList<T = Record<string, unknown>> {
  total?: number;
  data: Array<{ id: string } & T>;
}

export interface ListAnalyticsReportRequestsResponse {
  data: AnalyticsReportRequestResponse['data'][];
}

export interface ListAnalyticsReportInstancesResponse {
  data: AnalyticsReportInstance[];
}

export interface ListAnalyticsReportsResponse {
  data: AnalyticsReport[];
}

export interface ListAnalyticsReportSegmentsResponse {
  data: AnalyticsReportSegment[];
}

// Sales and Finance Reports Types (enums from the API 4.6 spec)
export type SalesReportType =
  | 'SALES'
  | 'PRE_ORDER'
  | 'NEWSSTAND'
  | 'SUBSCRIPTION'
  | 'SUBSCRIPTION_EVENT'
  | 'SUBSCRIBER'
  | 'SUBSCRIPTION_OFFER_CODE_REDEMPTION'
  | 'INSTALLS'
  | 'FIRST_ANNUAL'
  | 'WIN_BACK_ELIGIBILITY';
export type SalesReportSubType =
  | 'SUMMARY'
  | 'DETAILED'
  | 'SUMMARY_INSTALL_TYPE'
  | 'SUMMARY_TERRITORY'
  | 'SUMMARY_CHANNEL';
export type SalesReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const SALES_REPORT_TYPES: SalesReportType[] = [
  'SALES', 'PRE_ORDER', 'NEWSSTAND', 'SUBSCRIPTION', 'SUBSCRIPTION_EVENT', 'SUBSCRIBER',
  'SUBSCRIPTION_OFFER_CODE_REDEMPTION', 'INSTALLS', 'FIRST_ANNUAL', 'WIN_BACK_ELIGIBILITY',
];
export const SALES_REPORT_SUB_TYPES: SalesReportSubType[] = [
  'SUMMARY', 'DETAILED', 'SUMMARY_INSTALL_TYPE', 'SUMMARY_TERRITORY', 'SUMMARY_CHANNEL',
];

export interface SalesReportFilters {
  reportDate: string;
  reportType: SalesReportType;
  reportSubType: SalesReportSubType;
  frequency: SalesReportFrequency;
  vendorNumber: string;
  version?: string;
}

export type FinanceReportType = 'FINANCIAL' | 'FINANCE_DETAIL';

export interface FinanceReportFilters {
  reportDate: string;
  regionCode: string;
  reportType: FinanceReportType;
  vendorNumber: string;
}
