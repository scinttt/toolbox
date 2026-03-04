import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { TimeoutError } from "@/lib/errors";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fetchWithTimeout", () => {
  test("returns response when fetch succeeds within timeout", async () => {
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchWithTimeout(
      "https://example.com",
      { method: "GET" },
      5000,
      "TestService"
    );

    expect(result).toBe(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Verify signal was passed
    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.signal).toBeInstanceOf(AbortSignal);
  });

  test("passes through fetch options", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await fetchWithTimeout(
      "https://example.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "test",
      },
      5000,
      "TestService"
    );

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://example.com");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).toBe("test");
  });

  test("re-throws non-abort errors as-is", async () => {
    const networkError = new Error("Network failure");
    mockFetch.mockRejectedValueOnce(networkError);

    await expect(
      fetchWithTimeout("https://example.com", {}, 5000, "TestService")
    ).rejects.toThrow("Network failure");
  });

  test("throws TimeoutError when fetch is aborted", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    mockFetch.mockRejectedValueOnce(abortError);

    try {
      await fetchWithTimeout("https://example.com", {}, 5000, "TestService");
      fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError);
      expect((err as TimeoutError).message).toBe("TestService request timed out");
    }
  });
});
