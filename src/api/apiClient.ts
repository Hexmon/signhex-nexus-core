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
const envBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || undefined;
const inferredHttps =
  typeof window !== "undefined" && window.location.protocol === "https:" ? window.location.origin : undefined;
const baseURL = envBase || inferredHttps || "http://localhost:3000";
const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

const sanitizeMessage = (message: unknown) => {
  if (typeof message === "string") return message;
  return "Request failed. Please try again.";
};

export class ApiClient {
  private authTokenProvider: TokenProvider = () => undefined;
  private apiKeyProvider: TokenProvider = () => undefined;
  private csrfTokenProvider: TokenProvider = () => undefined;
  private inflightGetRequests = new Map<string, Promise<unknown>>();

  setAuthTokenProvider(getToken: TokenProvider) {
    this.authTokenProvider = getToken;
  }

  setApiKeyProvider(getKey: TokenProvider) {
    this.apiKeyProvider = getKey;
  }

  setCsrfTokenProvider(getToken: TokenProvider) {
    this.csrfTokenProvider = getToken;
  }

  async request<TResponse, TBody = unknown>(
    options: ApiRequestOptions<TBody>,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const queryString = this.buildQuery(options.query);
    const url = `${baseURL}${options.path}${queryString}`;
    const method = options.method ?? "GET";
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

    const csrfToken = this.csrfTokenProvider();
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (isStateChanging && csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    // Prevent caching sensitive responses
    headers["Cache-Control"] = "no-store";

    const requestKey = method === "GET" ? `${method}:${url}` : undefined;

    if (requestKey && this.inflightGetRequests.has(requestKey)) {
      return this.inflightGetRequests.get(requestKey) as Promise<TResponse>;
    }

    const executeRequest = async () => {
      try {
        const response = await fetch(url, {
          method,
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
          // Handle expired/invalid sessions centrally.
          if (typeof window !== "undefined" && error.status === 401 && !options.path.includes("/auth/login")) {
            try {
              sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, window.location.pathname + window.location.search);
            } catch {
              // ignore storage errors
            }
            window.location.replace("/login");
          }

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
    };

    const requestPromise = executeRequest();

    if (requestKey) {
      this.inflightGetRequests.set(requestKey, requestPromise);
    }

    try {
      return await requestPromise;
    } finally {
      if (requestKey) {
        this.inflightGetRequests.delete(requestKey);
      }
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
