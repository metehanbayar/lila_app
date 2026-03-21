import crypto from 'crypto';
import { isProduction } from '../config/runtime.js';

const DEFAULT_TOKEN_TTL_HOURS = 168;
const HEADER = {
  alg: 'HS256',
  typ: 'JWT',
};

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function getTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (secret) {
    return secret;
  }

  if (isProduction()) {
    throw new Error('AUTH_TOKEN_SECRET must be set in production.');
  }

  return 'local-dev-auth-token-secret-change-me';
}

function getTokenTtlSeconds() {
  const ttlHours = Number.parseInt(process.env.TOKEN_TTL_HOURS || DEFAULT_TOKEN_TTL_HOURS, 10);
  const safeHours = Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : DEFAULT_TOKEN_TTL_HOURS;
  return safeHours * 60 * 60;
}

function sign(value) {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(value)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function validateAuthTokenConfig() {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (isProduction() && (!secret || secret.length < 32)) {
    throw new Error('AUTH_TOKEN_SECRET must be at least 32 characters in production.');
  }
}

export function issueToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + getTokenTtlSeconds(),
  };

  const encodedHeader = toBase64Url(JSON.stringify(HEADER));
  const encodedPayload = toBase64Url(JSON.stringify(tokenPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing token.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format.');
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);

  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature.');
  }

  const header = JSON.parse(fromBase64Url(encodedHeader));
  if (header.alg !== HEADER.alg || header.typ !== HEADER.typ) {
    throw new Error('Invalid token header.');
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp <= now) {
    throw new Error('Token expired.');
  }

  return payload;
}
