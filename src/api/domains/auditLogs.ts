import { apiClient } from "../apiClient";
import type { AuditLog, PaginatedResponse, PaginationParams } from "../types";

export const auditLogsApi = {
  list: (
    params?: PaginationParams & {
      user_id?: string;
      resource_type?: string;
      action?: string;
      start_date?: string;
      end_date?: string;
    },
  ) =>
    apiClient.request<PaginatedResponse<AuditLog>>({
      path: "/audit-logs",
      method: "GET",
      query: params,
    }),

  getById: (auditLogId: string) =>
    apiClient.request<AuditLog>({
      path: `/audit-logs/${auditLogId}`,
      method: "GET",
    }),
};
