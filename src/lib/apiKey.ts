import { apiKeyRepository } from './repositories/apiKeyRepository';
import { randomBytes } from 'crypto';

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate an API key from a request
 * Returns the API key object if valid, null otherwise
 */
export async function validateApiKey(key: string | null) {
  if (!key) {
    return null;
  }

  try {
    const apiKey = await apiKeyRepository.findActiveByKey(key);
    
    if (!apiKey) {
      return null;
    }

    // Update last used timestamp (async, don't await)
    apiKeyRepository.updateLastUsed(key).catch(err => {
      console.error('Error updating API key last used:', err);
    });

    return apiKey;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Extract API key from request headers
 * Supports both 'Authorization: Bearer <key>' and 'X-API-Key: <key>' formats
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // Check X-API-Key header first
  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check Authorization header
  const authHeader = headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Middleware helper to validate API key from request
 */
export async function validateApiKeyFromRequest(request: Request) {
  const key = extractApiKeyFromHeaders(request.headers);
  return validateApiKey(key);
}
