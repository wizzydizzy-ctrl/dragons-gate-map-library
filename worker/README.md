# Cloudflare map submission service

This Worker provides the HUD with a one-button community submission path without exposing a GitHub credential to Mudlet users.

`POST /v1/maps` accepts the exported map JSON, optionally wrapped as `{ "publisher": "name", "slug": "map-name", "map": {...} }`. It checks format, schema, metadata, collection limits, positive unique room IDs, duplicate coordinates within partitions, supported directional exits and their destinations, and special-exit destinations and command lengths. These submission checks are narrower than `tools/validate_maps.py`; repository validation and owner review remain required. It marks the contribution unverified, creates a unique branch, atomically commits the map and regenerated catalog, and opens a pull request for owner review. It never pushes to `main` and never merges a pull request.

## Deployment

1. Create a fine-grained GitHub token restricted to this repository with **Contents: read/write** and **Pull requests: read/write**. Do not place it in source control or a HUD package.
2. Authenticate Wrangler with `npx wrangler login`.
3. Store the token using `npx wrangler secret put GITHUB_TOKEN`.
4. Deploy using `npx wrangler deploy`.
5. In Cloudflare, add a rate-limiting rule for `POST /v1/maps` and retain GitHub pull-request review as the moderation boundary.
6. Current DGHUD builds already provide **Map Library → SHARE SELECTED MAP**. When changing this service's deployment, update the configured HUD submission URL to the deployed `/v1/maps` endpoint and verify an upload reaches owner review before it is publicly listed. End users should follow the [map contribution guide](../CONTRIBUTING.md); they do not need Wrangler or a GitHub account.

Run `npm test` before deployment. Use `GET /health` for uptime checks.

## Security model

- End users need no GitHub account and receive no repository credential.
- Submissions cannot overwrite an existing publisher/slug; collisions receive a unique suffix.
- The server rewrites provenance as unverified and records a submission ID.
- Maps failing the submission checks above are rejected before GitHub writes occur. Coordinate types, allowed special-command verbs, privacy, and route accuracy still need repository checks or owner review; acceptance by the service is not approval for publication.
- Every accepted submission still requires review and passing repository Actions before merge.
