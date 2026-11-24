/** Error codes from TRD §6.2. New codes must be added to the TRD table too. */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CASE_ALREADY_OPEN: 'CASE_ALREADY_OPEN',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  CONCURRENT_UPDATE: 'CONCURRENT_UPDATE',
  AMOUNT_EXCEEDS_TRANSACTION: 'AMOUNT_EXCEEDS_TRANSACTION',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CASE_ALREADY_OPEN: 409,
  INVALID_TRANSITION: 409,
  CONCURRENT_UPDATE: 409,
  AMOUNT_EXCEEDS_TRANSACTION: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  traceId: string;
  fields?: Record<string, string>;
}

/** Base class for every domain error. The handler maps it to `{ code, message, traceId }`. */
export class AppError extends Error {
  readonly httpStatus: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = new.target.name;
    this.httpStatus = STATUS_BY_CODE[code];
  }
}

export class ValidationError extends AppError {
  constructor(fields: Record<string, string>) {
    super(ErrorCode.VALIDATION_FAILED, 'Request validation failed', fields);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(ErrorCode.UNAUTHENTICATED, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(ErrorCode.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(ErrorCode.NOT_FOUND, `${resource} ${id} not found`);
  }
}

export class CaseAlreadyOpenError extends AppError {
  constructor(transactionId: number) {
    super(ErrorCode.CASE_ALREADY_OPEN, `An open case already exists for transaction ${transactionId}`);
  }
}

export class InvalidTransitionError extends AppError {
  constructor(caseId: number, from: string, to: string) {
    super(ErrorCode.INVALID_TRANSITION, `Case ${caseId} cannot move from ${from} to ${to}`);
  }
}

export class ConcurrentUpdateError extends AppError {
  constructor(caseId: number) {
    super(ErrorCode.CONCURRENT_UPDATE, `Case ${caseId} was updated by someone else`);
  }
}

export class AmountExceedsTransactionError extends AppError {
  constructor(amount: string, limit: string) {
    super(
      ErrorCode.AMOUNT_EXCEEDS_TRANSACTION,
      `Refund amount ${amount} exceeds the transaction amount ${limit}`,
    );
  }
}

export class RateLimitedError extends AppError {
  constructor() {
    super(ErrorCode.RATE_LIMITED, 'Too many attempts. Try again in a minute.');
  }
}
