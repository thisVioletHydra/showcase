import type { IncomingHttpHeaders } from 'node:http';

import { config } from '../config';

import crypto from 'node:crypto';

export function safeEqual(given: string, expected: string): boolean {
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export function signWebhookBody(rawBody: string): string {
  return crypto.createHmac('sha256', config.webhookSecret).update(rawBody).digest('hex');
}

function headerValue(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function isValidWebhookSignature(rawBody: string, headers: IncomingHttpHeaders): boolean {
  const header = headerValue(headers, 'x-webhook-signature');
  if (!header) {
    return false;
  }

  const token = header.startsWith('sha256=') ? header.slice('sha256='.length) : header;
  return safeEqual(token, signWebhookBody(rawBody));
}
