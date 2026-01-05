import { apiClient } from "../apiClient";
import { endpoints } from "../endpoints";
import type { ProofOfPlay, ProofOfPlayFilters, PaginatedResponse } from "../types";

export const proofOfPlayApi = {
  list: (filters?: ProofOfPlayFilters) =>
    apiClient.request<PaginatedResponse<ProofOfPlay>>({
      path: endpoints.proofOfPlay.base,
      method: "GET",
      query: filters,
    }),

  export: (filters?: ProofOfPlayFilters) =>
    apiClient.request<string>({
      path: endpoints.proofOfPlay.export,
      method: "GET",
      query: filters,
      headers: { Accept: "text/csv" },
    }),
};
