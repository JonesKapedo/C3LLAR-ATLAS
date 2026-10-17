/**
 * At-rest encryption for the cellar record.
 *
 * The passcode never leaves the device: it is stretched with PBKDF2-SHA256 and
 * used as an AES-GCM key. What lands in storage is a salt, an IV and ciphertext.
 * There is no recovery path by design — no server holds a copy.
 */

export interface EncryptedBlob {
  v: 2
  enc: true
  salt: string
  iv: string
  data: string
}

export const HAS_CRYPTO =
  typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'

const ITERATIONS = 210_000

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(passcode: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptValue(passcode: string, value: unknown): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passcode, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(value)),
  )
  return {
    v: 2,
    enc: true,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  }
}

/** Throws if the passcode is wrong — AES-GCM authentication fails first. */
export async function decryptValue<T>(passcode: string, blob: EncryptedBlob): Promise<T> {
  const key = await deriveKey(passcode, fromBase64(blob.salt))
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(blob.iv) },
    key,
    fromBase64(blob.data),
  )
  return JSON.parse(decoder.decode(plain)) as T
}

export function strengthOf(passcode: string): { score: number; label: string } {
  let score = 0
  if (passcode.length >= 8) score += 1
  if (passcode.length >= 14) score += 1
  if (/[a-z]/.test(passcode) && /[A-Z]/.test(passcode)) score += 1
  if (/\d/.test(passcode)) score += 1
  if (/[^\w\s]/.test(passcode)) score += 1
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  return { score, label: labels[Math.min(score, labels.length - 1)] }
}
