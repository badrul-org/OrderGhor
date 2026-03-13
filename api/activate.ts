import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TYPE_MAP: Record<string, string> = { S: 'starter', P: 'pro', B: 'business' };

function computeSignature(secret: string, message: string): string {
  const hmac = createHmac('sha256', secret).update(message).digest();
  const bits = (hmac[0] << 12) | (hmac[1] << 4) | (hmac[2] >> 4);
  return [
    ALPHABET[(bits >> 15) & 0x1F],
    ALPHABET[(bits >> 10) & 0x1F],
    ALPHABET[(bits >> 5) & 0x1F],
    ALPHABET[bits & 0x1F],
  ].join('');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ACTIVATION_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Rate limit delay (prevents brute force)
  await new Promise(resolve => setTimeout(resolve, 500));

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(200).json({ valid: false, error: 'Missing activation code' });
  }

  const trimmed = code.trim().toUpperCase();

  // Validate format: OG-{S|P|B}-{8 chars from safe alphabet}
  const pattern = /^OG-(S|P|B)-([A-HJ-NP-Z2-9]{8})$/;
  const match = trimmed.match(pattern);
  if (!match) {
    return res.status(200).json({ valid: false, error: 'Invalid code format' });
  }

  const typeChar = match[1];
  const payload = match[2];
  const nonce = payload.substring(0, 4);
  const providedSig = payload.substring(4, 8);

  // Verify HMAC signature
  const message = `OG-${typeChar}-${nonce}`;
  const expectedSig = computeSignature(secret, message);

  if (providedSig !== expectedSig) {
    return res.status(200).json({ valid: false, error: 'Invalid activation code' });
  }

  const licenseType = TYPE_MAP[typeChar];
  return res.status(200).json({
    valid: true,
    licenseType,
    code: trimmed,
  });
}
