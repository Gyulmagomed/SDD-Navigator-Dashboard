import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

export class ApiClientError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type TokenProvider = () => Promise<string | null>;

let accessTokenProvider: TokenProvider = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    const maybeToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    return maybeToken ?? null;
  } catch {
    return null;
  }
};

export const setAccessTokenProvider = (provider: TokenProvider): void => {
  accessTokenProvider = provider;
};

const isServerError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  return typeof status === "number" && status >= 500;
};

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeError = (error: AxiosError): ApiClientError => {
  const status = error.response?.status;
  const payload = error.response?.data as
    | { message?: string; code?: string; details?: unknown }
    | undefined;

  return new ApiClientError(
    payload?.message ?? error.message ?? "Unknown API error",
    status,
    payload?.code,
    payload?.details,
  );
};

export const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 10_000,
  });

  instance.interceptors.request.use(async (config) => {
    const token = await accessTokenProvider();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const requestConfig = error.config as RetryableRequestConfig | undefined;

      if (requestConfig && isServerError(error)) {
        requestConfig._retryCount = requestConfig._retryCount ?? 0;

        if (requestConfig._retryCount < 3) {
          const delayMs = 300 * 2 ** requestConfig._retryCount;
          requestConfig._retryCount += 1;
          await wait(delayMs);
          return instance(requestConfig);
        }
      }

      throw normalizeError(error);
    },
  );

  return instance;
};

export const apiClient = createApiClient();
