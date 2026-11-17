export interface AppStoreConnectConfig {
  keyId: string;
  issuerId: string;
  privateKeyPath: string;
  vendorNumber?: string; // Optional vendor number for sales and finance reports
}

export interface BaseApiResponse<T> {
  data: T;
  links?: {
    self?: string;
    first?: string;
    next?: string;
    prev?: string;
  };
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
}

/**
 * Flattened list result: `{ id, ...attributes }` per item, without links and
 * relationships, which make up most of a raw JSON:API payload (a raw list of
 * 194 analytics reports is ~70k characters). Rendered one item per line by
 * formatCompact in index.ts.
 */
export interface CompactList<T = Record<string, unknown>> {
  total?: number;
  data: Array<{ id: string } & T>;
}

export interface ApiError {
  id: string;
  status: string;
  code: string;
  title: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
}

export interface ApiErrorResponse {
  errors: ApiError[];
}