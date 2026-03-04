import { TimeoutError } from "@/lib/errors";

export function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  serviceName: string
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new TimeoutError(serviceName);
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
}
