-- Cloudflare D1 Database Schema for OneDrive CF Index NG
-- This schema is used to store OAuth tokens for OneDrive API access

CREATE TABLE IF NOT EXISTS auth_tokens (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER
);

-- Create an index on expires_at for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_expires_at ON auth_tokens(expires_at);

-- Insert default rows (will be updated during OAuth flow)
-- Note: These will be populated when the user completes OAuth authentication
