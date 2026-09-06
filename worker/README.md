# Cloudflare map submission service

This Worker provides the HUD with a one-button community submission path without exposing a GitHub credential to Mudlet users.

`POST /v1/maps` accepts the exported map JSON, optionally wrapped as `{ "publisher": "name", "slug": "map-name", "map": {...} }`. It validates and normalizes the same safety-critical fields as `tools/validate_maps.py`, marks the contribution unverified, creates a unique branch, atomically commits the map and regenerated catalog, and opens a pull request for owner review. It never pushes to `main` and never merges a pull request.

## Deployment

1. Create a fine-grained GitHub token restricted to this repository with **Contents: read/write** and **Pull requests: read/write**. Do not place it in source control or a HUD package.
2. Authenticate Wrangler with `npx wrangler login`.
3. Store the token using `npx wrangler secret put GITHUB_TOKEN`.
4. Deploy using `npx wrangler deploy`.
5. In Cloudflare, add a rate-limiting rule for `POST /v1/maps` and retain GitHub pull-request review as the moderation boundary.
6. Configure the Player and Staff HUD publish button to POST its local export to the deployed `/v1/maps` URL and show the returned pull-request URL/status.

Run `npm test` before deployment. Use `GET /health` for uptime checks.

## Security model

- End users need no GitHub account and receive no repository credential.
- Submissions cannot overwrite an existing publisher/slug; collisions receive a unique suffix.
- The server rewrites provenance as unverified and records a submission ID.
- Invalid, oversized, structurally unsafe, or broken maps are rejected before GitHub writes occur.
- Every accepted submission still requires review and passing repository Actions before merge.
