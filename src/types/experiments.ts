/** Product Page Optimization test states (AppStoreVersionExperimentV2.state, API 4.6). */
export const EXPERIMENT_STATES = [
  'PREPARE_FOR_SUBMISSION', 'READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW',
  'ACCEPTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'STOPPED',
] as const;
export type ExperimentState = typeof EXPERIMENT_STATES[number];

export interface ExperimentTreatmentSummary {
  id: string;
  name?: string;
  appIconName?: string | null;
  /** Set when the treatment was applied to the product page. */
  promotedDate?: string | null;
}

export interface ExperimentSummary {
  id: string;
  name?: string;
  state?: ExperimentState;
  platform?: string;
  /** Percentage of traffic sent to the treatments. */
  trafficProportion?: number;
  reviewRequired?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  /** versionString of the latest control (original product page) version. */
  controlVersion?: string;
  /** Name of the treatment that was applied, if any. */
  applied: string | null;
  treatments: ExperimentTreatmentSummary[];
}
