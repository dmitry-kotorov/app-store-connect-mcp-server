export interface BetaGroup {
  id: string;
  type: string;
  attributes: {
    name: string;
    isInternalGroup: boolean;
    publicLinkEnabled: boolean;
    publicLinkId?: string;
    publicLinkLimit?: number;
    createdDate: string;
  };
}

export interface BetaTester {
  id: string;
  type: string;
  attributes: {
    firstName: string;
    lastName: string;
    email: string;
    inviteType: string;
    betaGroups?: BetaGroup[];
  };
}

export interface ListBetaGroupsResponse {
  data: BetaGroup[];
}

export interface ListBetaTestersResponse {
  data: BetaTester[];
}

export interface AddTesterRequest {
  data: {
    type: "betaTesters";
    attributes: {
      email: string;
      firstName: string;
      lastName: string;
    };
    relationships: {
      betaGroups: {
        data: Array<{
          id: string;
          type: "betaGroups";
        }>;
      };
    };
  };
}

export interface RemoveTesterRequest {
  data: Array<{
    id: string;
    type: "betaTesters";
  }>;
}