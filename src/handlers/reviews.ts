import { AppStoreConnectClient } from '../services/index.js';
import {
  ListCustomerReviewsRequest,
  ListCustomerReviewsResult,
} from '../types/index.js';
import { sanitizeLimit } from '../utils/index.js';
import { AppHandlers } from './apps.js';

export class ReviewHandlers {
  private appHandlers: AppHandlers;

  constructor(private client: AppStoreConnectClient) {
    this.appHandlers = new AppHandlers(client);
  }

  /**
   * List public App Store customer reviews for an app.
   * Supports rating/territory filters and full pagination (allPages) so the
   * complete review history can be pulled per locale/territory.
   */
  async listCustomerReviews(args: ListCustomerReviewsRequest): Promise<ListCustomerReviewsResult> {
    const {
      appId,
      bundleId,
      rating,
      territory,
      sort = '-createdDate',
      limit = 200,
      allPages = false,
      maxTotal = 500,
      includeResponse = true,
    } = args;

    if (!appId && !bundleId) {
      throw new Error('Either appId or bundleId must be provided');
    }

    let finalAppId = appId;
    if (!appId && bundleId) {
      const app = await this.appHandlers.findAppByBundleId(bundleId);
      if (!app) {
        throw new Error(`No app found with bundle ID: ${bundleId}`);
      }
      finalAppId = app.id;
    }

    const baseParams: Record<string, any> = {
      limit: sanitizeLimit(limit, 200),
      sort,
      'fields[customerReviews]':
        'rating,title,body,reviewerNickname,createdDate,territory',
    };

    if (rating?.length) {
      baseParams['filter[rating]'] = rating.join(',');
    }
    if (territory?.length) {
      baseParams['filter[territory]'] = territory.join(',');
    }
    if (includeResponse) {
      baseParams['include'] = 'response';
      baseParams['fields[customerReviewResponses]'] =
        'responseBody,lastModifiedDate,state';
    }

    const data: any[] = [];
    const included: any[] = [];
    let cursor: string | undefined;
    let pagesFetched = 0;
    let nextCursor: string | undefined;

    do {
      const params = { ...baseParams };
      if (cursor) params['cursor'] = cursor;

      const resp = await this.client.get<any>(
        `/apps/${finalAppId}/customerReviews`,
        params,
      );

      if (Array.isArray(resp?.data)) data.push(...resp.data);
      if (Array.isArray(resp?.included)) included.push(...resp.included);
      pagesFetched++;

      nextCursor = this.extractCursor(resp?.links?.next);
      cursor = nextCursor;

      if (!allPages) break;
      if (data.length >= maxTotal) break;
      if (pagesFetched >= 100) break; // hard safety cap
    } while (cursor);

    const trimmed = allPages ? data.slice(0, maxTotal) : data;

    return {
      data: trimmed,
      included: included.length ? included : undefined,
      meta: {
        count: trimmed.length,
        pagesFetched,
        hasMore: Boolean(nextCursor) || trimmed.length < data.length,
      },
    };
  }

  private extractCursor(nextUrl?: string): string | undefined {
    if (!nextUrl) return undefined;
    try {
      return new URL(nextUrl).searchParams.get('cursor') ?? undefined;
    } catch {
      const m = nextUrl.match(/[?&]cursor=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : undefined;
    }
  }
}
