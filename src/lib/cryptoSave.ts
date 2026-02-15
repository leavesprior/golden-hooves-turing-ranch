/**
 * Client-side encryption for game saves using Web Crypto API
 *
 * Uses PBKDF2 (100k iterations) + AES-256-GCM for secure local storage.
 * All encrypted data is base64-encoded for easy JSON serialization.
 */

// Convert ArrayBuffer to base64 string
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string to Uint8Array
function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive AES-256-GCM key from passphrase using PBKDF2
 *
 * @param passphrase - User's encryption passphrase
 * @param salt - Random salt (16 bytes)
 * @returns CryptoKey suitable for AES-GCM encryption
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  // Convert passphrase to key material
  const encoder = new TextEncoder();
  const encoded = encoder.encode(passphrase);
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoded.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-256-GCM key using PBKDF2 with 100k iterations
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt game state object
 *
 * @param data - Game state object (will be JSON.stringified)
 * @param passphrase - User's encryption passphrase
 * @returns Object with base64-encoded ciphertext, salt, and IV
 */
export async function encryptSave(
  data: object,
  passphrase: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  // Generate random salt (16 bytes) and IV (12 bytes for GCM)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key
  const key = await deriveKey(passphrase, salt);

  // Convert data to bytes
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  // Encrypt using AES-256-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer
    },
    key,
    plaintext.buffer as ArrayBuffer
  );

  // Return all components as base64 strings
  return {
    ciphertext: toBase64(ciphertext),
    salt: toBase64(salt.buffer as ArrayBuffer),
    iv: toBase64(iv.buffer as ArrayBuffer)
  };
}

/**
 * Decrypt game state object
 *
 * @param encrypted - Object with base64-encoded ciphertext, salt, and IV
 * @param passphrase - User's encryption passphrase
 * @returns Decrypted game state object
 * @throws Error if decryption fails (wrong passphrase or corrupted data)
 */
export async function decryptSave(
  encrypted: { ciphertext: string; salt: string; iv: string },
  passphrase: string
): Promise<object> {
  // Decode base64 components
  const salt = fromBase64(encrypted.salt);
  const iv = fromBase64(encrypted.iv);
  const ciphertext = fromBase64(encrypted.ciphertext);

  // Derive decryption key
  const key = await deriveKey(passphrase, salt);

  try {
    // Decrypt using AES-256-GCM
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer
      },
      key,
      ciphertext.buffer as ArrayBuffer
    );

    // Convert bytes back to object
    const decoder = new TextDecoder();
    const json = decoder.decode(plaintext);
    return JSON.parse(json);
  } catch (error) {
    // Decryption failure (wrong passphrase or corrupted data)
    throw new Error('Decryption failed. Invalid passphrase or corrupted data.');
  }
}
