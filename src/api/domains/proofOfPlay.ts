import { apiClient } from "../apiClient";
import type { ProofOfPlay, ProofOfPlayFilters, PaginatedResponse } from "../types";

export const proofOfPlayApi = {
  list: (filters?: ProofOfPlayFilters) =>
    apiClient.request<PaginatedResponse<ProofOfPlay>>({
      path: "/v1/proof-of-play",
      method: "GET",
      query: filters,
    }),

  export: (filters?: ProofOfPlayFilters) =>
    apiClient.request<string>({
      path: "/v1/proof-of-play/export",
      method: "GET",
      query: filters,
      headers: { Accept: "text/csv" },
    }),
};
