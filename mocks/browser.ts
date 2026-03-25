import { setupWorker } from "msw";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<void> | null = null;

/**
 * Starts the MSW worker exactly once per page load (safe with React Strict Mode).
 * No-ops on the server.
 */
export function startMswWorker(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  startPromise ??= worker
    .start({
      onUnhandledRequest: "bypass",
      quiet: true,
    })
    .then(() => undefined);
  return startPromise;
}
