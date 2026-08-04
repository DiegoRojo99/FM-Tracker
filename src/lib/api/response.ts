import { NextResponse } from 'next/server';

export type ApiErrorPayload = {
  error: string;
  details?: unknown;
};

export type ApiSuccessPayload<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function success<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function apiError(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      ...(details !== undefined ? { details } : {}),
    } as ApiErrorPayload,
    { status }
  );
}

export function badRequest(message: string, details?: unknown) {
  return apiError(message, 400, details);
}

export function unauthorized(message = 'Unauthorized', details?: unknown) {
  return apiError(message, 401, details);
}

export function forbidden(message = 'Forbidden', details?: unknown) {
  return apiError(message, 403, details);
}

export function notFound(message = 'Not found', details?: unknown) {
  return apiError(message, 404, details);
}

export function conflict(message = 'Conflict', details?: unknown) {
  return apiError(message, 409, details);
}
