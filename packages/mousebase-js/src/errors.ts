export class MouseBaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = "unknown", statusCode: number = 0) {
    super(message);
    this.name = "MouseBaseError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class MissingApiKeyError extends MouseBaseError {
  constructor() {
    super("MOUSEBASE_API_KEY is not set. Provide it via constructor or set the MOUSEBASE_API_KEY environment variable.", "missing_api_key", 0);
    this.name = "MissingApiKeyError";
  }
}

export class AuthenticationError extends MouseBaseError {
  constructor(message: string = "Invalid or expired API key") {
    super(message, "authentication_error", 401);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends MouseBaseError {
  constructor(message: string = "Invalid request") {
    super(message, "validation_error", 422);
    this.name = "ValidationError";
  }
}

export class ConflictError extends MouseBaseError {
  constructor(message: string = "Resource conflict") {
    super(message, "conflict", 409);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends MouseBaseError {
  constructor(message: string = "Too many requests") {
    super(message, "rate_limit_error", 429);
    this.name = "RateLimitError";
  }
}

export class InternalError extends MouseBaseError {
  constructor(message: string = "Internal server error") {
    super(message, "internal_error", 500);
    this.name = "InternalError";
  }
}

export function translateError(status: number, body: any): MouseBaseError {
  const message = body?.detail || body?.message || "Request failed";
  switch (status) {
    case 401:
      return new AuthenticationError(message);
    case 409:
      return new ConflictError(message);
    case 422:
    case 400:
      return new ValidationError(message);
    case 429:
      return new RateLimitError(message);
    case 500:
    case 502:
    case 503:
      return new InternalError(message);
    default:
      return new MouseBaseError(message, "request_error", status);
  }
}
