type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiRequestOptions<TBody = unknown> {
  path: string;
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  useApiKey?: boolean;
}

export interface ApiErrorShape {
  status: number;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(payload: ApiErrorShape) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.details = payload.details;
  }
}

type TokenProvider = () => string | undefined | null;

const DEFAULT_TIMEOUT_MS = 15_000;
const baseURL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:3000";

const sanitizeMessage = (message: unknown) => {
  if (typeof message === "string") return message;
  return "Request failed. Please try again.";
};

export class ApiClient {
  private authTokenProvider: TokenProvider = () => undefined;
  private apiKeyProvider: TokenProvider = () => undefined;

  setAuthTokenProvider(getToken: TokenProvider) {
    this.authTokenProvider = getToken;
  }

  setApiKeyProvider(getKey: TokenProvider) {
    this.apiKeyProvider = getKey;
  }

  async request<TResponse, TBody = unknown>(
    options: ApiRequestOptions<TBody>,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const queryString = this.buildQuery(options.query);
    const url = `${baseURL}${options.path}${queryString}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    };

    const authToken = this.authTokenProvider();
    const apiKey = options.useApiKey ? this.apiKeyProvider() : undefined;

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    // Prevent caching sensitive responses
    headers["Cache-Control"] = "no-store";

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal ?? controller.signal,
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new ApiError({
          status: response.status,
          message:
            (isJson && typeof payload?.error === "string" && payload.error) ||
            sanitizeMessage(payload),
          details: isJson ? payload : undefined,
        });
      }

      return payload as TResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError({
          status: 408,
          message: "Request timed out. Please retry.",
        });
      }

      const message = error instanceof Error ? error.message : "Network error";
      throw new ApiError({ status: 500, message: sanitizeMessage(message) });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildQuery(
    query: ApiRequestOptions["query"],
  ): string {
    if (!query) return "";
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.append(key, String(value));
    });

    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }
}

export const apiClient = new ApiClient();
