import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import {
  ApiClientError,
  createApiClient,
  setAccessTokenProvider,
} from "@/lib/api/client";

const createConfig = (): InternalAxiosRequestConfig => ({
  headers: AxiosHeaders.from({}),
  method: "get",
  url: "/specifications",
});

describe("api client", () => {
  it("adds bearer token through request interceptor", async () => {
    setAccessTokenProvider(async () => "token-123");
    const client = createApiClient();

    client.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBe("Bearer token-123");
      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    await client.get("/specifications");
  });

  it("retries 5xx responses up to 3 times", async () => {
    setAccessTokenProvider(async () => null);
    const client = createApiClient();
    let attempts = 0;

    client.defaults.adapter = async (config) => {
      attempts += 1;

      if (attempts < 3) {
        throw new AxiosError(
          "Server error",
          "ERR_BAD_RESPONSE",
          config,
          {},
          {
            data: { message: "Temporary error" },
            status: 500,
            statusText: "Internal Server Error",
            headers: {},
            config,
          },
        );
      }

      return {
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };

    const result = await client.get("/specifications");
    expect(result.data).toEqual({ ok: true });
    expect(attempts).toBe(3);
  });

  it("normalizes client errors into ApiClientError", async () => {
    setAccessTokenProvider(async () => null);
    const client = createApiClient();

    client.defaults.adapter = async (config) => {
      throw new AxiosError(
        "Bad request",
        "ERR_BAD_REQUEST",
        config,
        {},
        {
          data: { message: "Invalid input", code: "INVALID_DATA" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config,
        },
      );
    };

    await expect(client.request({ ...createConfig() })).rejects.toBeInstanceOf(ApiClientError);
    await expect(client.request({ ...createConfig() })).rejects.toMatchObject({
      message: "Invalid input",
      status: 400,
      code: "INVALID_DATA",
    });
  });
});
