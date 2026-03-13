#!/usr/bin/env node
import { createHmac, randomBytes } from 'node:crypto';

// Safe alphabet: no 0/O/1/I confusion (32 chars)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TYPE_MAP = { S: 'starter', P: 'pro', B: 'business' };

function generateNonce(length = 4) {
  const bytes = randomBytes(length);
  return Array.from(bytes).map(b => ALPHABET[b % 32]).join('');
}

function computeSignature(secret, message) {
  const hmac = createHmac('sha256', secret).update(message).digest();
  // Take first 20 bits from HMAC, split into four 5-bit groups, map to alphabet
  const bits = (hmac[0] << 12) | (hmac[1] << 4) | (hmac[2] >> 4);
  return [
    ALPHABET[(bits >> 15) & 0x1F],
    ALPHABET[(bits >> 10) & 0x1F],
    ALPHABET[(bits >> 5) & 0x1F],
    ALPHABET[bits & 0x1F],
  ].join('');
}

function generateCode(secret, type) {
  if (!TYPE_MAP[type]) throw new Error(`Invalid type: ${type}. Use S (starter), P (pro), or B (business)`);
  const nonce = generateNonce(4);
  const prefix = `OG-${type}-${nonce}`;
  const sig = computeSignature(secret, prefix);
  return `${prefix}${sig}`;
}

// --- CLI ---
const secret = process.env.ACTIVATION_SECRET;
if (!secret) {
  console.error('Error: Set ACTIVATION_SECRET environment variable');
  console.error('Example: ACTIVATION_SECRET=your-secret node scripts/generate-codes.mjs P 5');
  process.exit(1);
}

const type = (process.argv[2] || 'P').toUpperCase();
const count = parseInt(process.argv[3]) || 1;

if (!TYPE_MAP[type]) {
  console.error(`Invalid type: ${type}`);
  console.error('Valid types: S (starter), P (pro), B (business)');
  process.exit(1);
}

console.log(`\nGenerating ${count} ${TYPE_MAP[type]} code(s):\n`);
for (let i = 0; i < count; i++) {
  console.log(`  ${generateCode(secret, type)}`);
}
console.log('');
