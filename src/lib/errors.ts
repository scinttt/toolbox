export type AppErrorCode =
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "CONFIG_ERROR"
  | "PARSE_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;

  constructor(message: string, code: AppErrorCode, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UpstreamError extends AppError {
  constructor(service: string, status: number, statusText: string) {
    super(`${service} API error: ${status} ${statusText}`, "UPSTREAM_ERROR", 502);
    this.name = "UpstreamError";
  }
}

export class ConfigError extends AppError {
  constructor(envVar: string) {
    super(`${envVar} is not configured`, "CONFIG_ERROR", 502);
    this.name = "ConfigError";
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(message, "PARSE_ERROR", 502);
    this.name = "ParseError";
  }
}

export class TimeoutError extends AppError {
  constructor(service: string) {
    super(`${service} request timed out`, "UPSTREAM_TIMEOUT", 504);
    this.name = "TimeoutError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
