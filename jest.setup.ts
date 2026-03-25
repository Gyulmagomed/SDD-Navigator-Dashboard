/**
 * Глобальная настройка тестов: fetch-полифилл, MSW lifecycle, базовый API URL.
 */
import "whatwg-fetch";
import "@testing-library/jest-dom";
import { server } from "@/__tests__/mocks/server";
import { setAccessTokenProvider } from "@/lib/api/client";

process.env.NEXT_PUBLIC_API_URL = "http://localhost";
setAccessTokenProvider(async () => null);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
