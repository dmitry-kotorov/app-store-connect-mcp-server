// Customer Review types — App Store Connect /v1/apps/{id}/customerReviews

export type CustomerReviewSort =
  | "rating"
  | "-rating"
  | "createdDate"
  | "-createdDate";

export interface CustomerReviewResponseAttributes {
  responseBody?: string;
  lastModifiedDate?: string;
  state?: string;
}

export interface CustomerReviewAttributes {
  rating: number;
  title?: string;
  body?: string;
  reviewerNickname?: string;
  createdDate: string;
  territory?: string;
}

export interface CustomerReview {
  id: string;
  type: "customerReviews";
  attributes: CustomerReviewAttributes;
  relationships?: {
    response?: {
      data?: { id: string; type: "customerReviewResponses" } | null;
    };
  };
}

export interface ListCustomerReviewsRequest {
  /** App Store app id (e.g. "656212466"). Either appId or bundleId is required. */
  appId?: string;
  /** Bundle id (e.g. "com.example.app"); resolved to an appId when appId is omitted. */
  bundleId?: string;
  /** Filter by star rating(s), 1-5. */
  rating?: number[];
  /** Filter by App Store territory code(s), e.g. ["USA", "GBR", "ESP"]. */
  territory?: string[];
  /** Sort order (default "-createdDate"). */
  sort?: CustomerReviewSort;
  /** Page size, max 200 (default 200). */
  limit?: number;
  /** When true, follow pagination and fetch up to maxTotal reviews. */
  allPages?: boolean;
  /** Cap on total reviews fetched when allPages is true (default 500). */
  maxTotal?: number;
  /** Include the developer response for each review (default true). */
  includeResponse?: boolean;
}

export interface ListCustomerReviewsResult {
  data: CustomerReview[];
  included?: Array<{
    id: string;
    type: string;
    attributes: CustomerReviewResponseAttributes;
  }>;
  meta: {
    count: number;
    pagesFetched: number;
    hasMore: boolean;
  };
}
