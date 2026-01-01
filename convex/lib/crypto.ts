/**
 * Crypto utilities for password hashing and session tokens
 * Uses SubtleCrypto which is available in Convex runtime
 */

// Hash a password with a random salt using SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);

  // Combine salt and password
  const combined = new Uint8Array(salt.length + passwordData.length);
  combined.set(salt);
  combined.set(passwordData, salt.length);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hashArray = new Uint8Array(hashBuffer);

  // Combine salt + hash for storage
  const result = new Uint8Array(salt.length + hashArray.length);
  result.set(salt);
  result.set(hashArray, salt.length);

  // Return as base64
  return btoa(String.fromCharCode(...result));
}

// Verify a password against a stored hash
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const storedBytes = Uint8Array.from(atob(storedHash), (c) =>
      c.charCodeAt(0)
    );
    const salt = storedBytes.slice(0, 16);
    const storedHashPart = storedBytes.slice(16);

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const combined = new Uint8Array(salt.length + passwordData.length);
    combined.set(salt);
    combined.set(passwordData, salt.length);

    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
    const hashArray = new Uint8Array(hashBuffer);

    // Constant-time comparison to prevent timing attacks
    if (hashArray.length !== storedHashPart.length) return false;
    let result = 0;
    for (let i = 0; i < hashArray.length; i++) {
      result |= hashArray[i] ^ storedHashPart[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}

// Generate a cryptographically secure session token
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

// Hash a session token for storage (we don't store raw tokens)
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}
