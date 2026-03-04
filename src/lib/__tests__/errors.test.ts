import {
  AppError,
  UpstreamError,
  ConfigError,
  ParseError,
  TimeoutError,
  isAppError,
} from "@/lib/errors";

describe("error classes", () => {
  test("UpstreamError has correct properties", () => {
    const err = new UpstreamError("DeepSeek", 500, "Internal Server Error");
    expect(err.message).toBe("DeepSeek API error: 500 Internal Server Error");
    expect(err.code).toBe("UPSTREAM_ERROR");
    expect(err.statusCode).toBe(502);
    expect(err.name).toBe("UpstreamError");
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  test("ConfigError has correct properties", () => {
    const err = new ConfigError("DEEPSEEK_API_KEY");
    expect(err.message).toBe("DEEPSEEK_API_KEY is not configured");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.statusCode).toBe(502);
  });

  test("ParseError has correct properties", () => {
    const err = new ParseError("Invalid JSON");
    expect(err.message).toBe("Invalid JSON");
    expect(err.code).toBe("PARSE_ERROR");
    expect(err.statusCode).toBe(502);
  });

  test("TimeoutError has correct properties", () => {
    const err = new TimeoutError("DeepL");
    expect(err.message).toBe("DeepL request timed out");
    expect(err.code).toBe("UPSTREAM_TIMEOUT");
    expect(err.statusCode).toBe(504);
  });
});

describe("isAppError", () => {
  test("returns true for AppError subclasses", () => {
    expect(isAppError(new UpstreamError("X", 500, "err"))).toBe(true);
    expect(isAppError(new ConfigError("KEY"))).toBe(true);
    expect(isAppError(new ParseError("bad"))).toBe(true);
    expect(isAppError(new TimeoutError("svc"))).toBe(true);
  });

  test("returns false for plain Error", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
  });

  test("returns false for non-error values", () => {
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});
