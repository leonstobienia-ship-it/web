import type { IncomingMessage, ServerResponse } from 'node:http';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400'
};

export const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...corsHeaders
  });
  res.end(JSON.stringify(payload));
};

export const sendNoContent = (res: ServerResponse): void => {
  res.writeHead(204, corsHeaders);
  res.end();
};

export const sendError = (
  res: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void => {
  sendJson(res, statusCode, {
    status: 'error',
    code,
    message,
    ...(details === undefined ? {} : { details })
  });
};

export const methodNotAllowed = (res: ServerResponse, allowed: string[]): void => {
  res.writeHead(405, {
    allow: allowed.join(', '),
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...corsHeaders
  });
  res.end(JSON.stringify({ status: 'method_not_allowed', allowed }));
};

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError;

export const readJsonBody = async <T extends Record<string, unknown>>(req: IncomingMessage): Promise<T> => {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  const maxBytes = 1024 * 1024;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    receivedBytes += buffer.byteLength;
    if (receivedBytes > maxBytes) {
      throw new HttpError(413, 'payload_too_large', 'Corpo da requisicao excede 1MB.');
    }
    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawBody) {
    return {} as T;
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HttpError(400, 'invalid_json', 'Corpo JSON deve ser um objeto.');
    }
    return parsed as T;
  } catch (error) {
    if (isHttpError(error)) {
      throw error;
    }
    throw new HttpError(400, 'invalid_json', 'Corpo JSON invalido.');
  }
};
