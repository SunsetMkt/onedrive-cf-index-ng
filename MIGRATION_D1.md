# Migration Guide: Cloudflare KV to D1

This guide explains how to migrate from Cloudflare KV to Cloudflare D1 for storing OAuth tokens.

## What Changed

Previously, this application used Cloudflare KV (Key-Value store) to store OAuth tokens. We've now migrated to Cloudflare D1 (SQL database) for better reliability and features.

## For New Deployments

### 1. Create a D1 Database

```bash
# Create a new D1 database
wrangler d1 create onedrive-cf-index-db

# Note the database ID from the output
```

### 2. Initialize the Database Schema

```bash
# Run the schema file to create the necessary tables
wrangler d1 execute onedrive-cf-index-db --file=./schema.sql
```

### 3. Update Your Wrangler Configuration

If deploying with Cloudflare Pages, add D1 binding in your `wrangler.toml` or Pages settings:

```toml
[[d1_databases]]
binding = "ONEDRIVE_CF_INDEX_D1"
database_name = "onedrive-cf-index-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

Or in Cloudflare Pages dashboard:
- Go to Settings > Functions
- Add D1 database binding:
  - Variable name: `ONEDRIVE_CF_INDEX_D1`
  - D1 database: Select your created database

### 4. For Docker Deployments

When running locally with Docker, you need to:

1. Create a local D1 database for development:
```bash
wrangler d1 create onedrive-cf-index-db --local
wrangler d1 execute onedrive-cf-index-db --local --file=./schema.sql
```

2. The Dockerfile has been updated to use `--d1=ONEDRIVE_CF_INDEX_D1` instead of `--kv=ONEDRIVE_CF_INDEX_KV`

## For Existing Deployments (Migration)

If you're upgrading from KV to D1:

### 1. Create and Initialize D1 Database

Follow steps 1-2 from "New Deployments" above.

### 2. Migrate Existing Data (Optional)

If you want to preserve existing OAuth tokens:

```bash
# Get existing tokens from KV
wrangler kv:key get --namespace-id=YOUR_KV_NAMESPACE_ID "access_token" > access_token.txt
wrangler kv:key get --namespace-id=YOUR_KV_NAMESPACE_ID "refresh_token" > refresh_token.txt

# Insert into D1 (you'll need to write a simple script or use SQL directly)
# Note: You may need to re-authenticate as access tokens have expiration
```

### 3. Update Bindings

Update your Cloudflare Pages settings to use D1 binding instead of KV binding.

### 4. Re-authenticate

After migration, you may need to go through the OAuth flow again at `/onedrive-oauth/step-1` to generate fresh tokens.

## Differences Between KV and D1

| Feature | KV | D1 |
|---------|----|----|
| Storage Type | Key-Value | SQL Database |
| TTL Support | Native | Manual (handled in code) |
| Query Capability | Key lookup only | Full SQL queries |
| Consistency | Eventual | Immediate |

## Troubleshooting

### "No access token" Error

This usually means:
1. D1 database is not properly bound
2. Database hasn't been initialized with schema
3. OAuth tokens haven't been set up yet

Solution: Complete the OAuth flow at `/onedrive-oauth/step-1`

### Database Binding Not Found

Make sure:
1. D1 database is created
2. Binding name is exactly `ONEDRIVE_CF_INDEX_D1`
3. Database is bound in Pages settings or wrangler.toml

## Local Development

For local development with wrangler:

```bash
# Start local dev with D1
wrangler pages dev .vercel/output/static --d1=ONEDRIVE_CF_INDEX_D1 --compatibility-flag=nodejs_compat
```

## Support

For issues or questions, please visit:
- [GitHub Repository](https://github.com/lyc8503/onedrive-cf-index-ng)
- [Documentation Wiki](https://github.com/lyc8503/onedrive-cf-index-ng/wiki)
