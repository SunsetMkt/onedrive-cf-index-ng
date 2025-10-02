import { D1Database } from '@cloudflare/workers-types'

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  const { ONEDRIVE_CF_INDEX_D1 } = process.env as unknown as { ONEDRIVE_CF_INDEX_D1: D1Database }

  // Get current timestamp in seconds
  const now = Math.floor(Date.now() / 1000)

  // Fetch access token and check if it's expired
  const accessTokenResult = await ONEDRIVE_CF_INDEX_D1.prepare(
    'SELECT value, expires_at FROM auth_tokens WHERE key = ?'
  )
    .bind('access_token')
    .first<{ value: string; expires_at: number | null }>()

  // Return null if access token is expired or doesn't exist
  const accessToken =
    accessTokenResult && (accessTokenResult.expires_at === null || accessTokenResult.expires_at > now)
      ? accessTokenResult.value
      : null

  // Fetch refresh token (no expiration check)
  const refreshTokenResult = await ONEDRIVE_CF_INDEX_D1.prepare('SELECT value FROM auth_tokens WHERE key = ?')
    .bind('refresh_token')
    .first<{ value: string }>()

  const refreshToken = refreshTokenResult ? refreshTokenResult.value : null

  return {
    accessToken,
    refreshToken,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  const { ONEDRIVE_CF_INDEX_D1 } = process.env as unknown as { ONEDRIVE_CF_INDEX_D1: D1Database }

  // Calculate expiration timestamp (current time + expiry in seconds)
  const expiresAt = Math.floor(Date.now() / 1000) + accessTokenExpiry

  // Store access token with expiration
  await ONEDRIVE_CF_INDEX_D1.prepare(
    'INSERT INTO auth_tokens (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at'
  )
    .bind('access_token', accessToken, expiresAt)
    .run()

  // Store refresh token without expiration
  await ONEDRIVE_CF_INDEX_D1.prepare(
    'INSERT INTO auth_tokens (key, value, expires_at) VALUES (?, ?, NULL) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
    .bind('refresh_token', refreshToken)
    .run()
}
