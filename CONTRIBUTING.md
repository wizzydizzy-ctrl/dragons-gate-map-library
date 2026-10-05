# Contributing a map

Applies to DGHUD v0.3.89.

## Submit through the HUD

You do not need a GitHub account to share a map.

1. Open **OPTIONS → MAP SETTINGS → MAP LIBRARY**, or enter `dghud map library`.
2. Under **MY MAPS**, select the collection you want to submit.
3. Click **SHARE SELECTED MAP**. The HUD switches to that collection if necessary and submits it for owner review.
4. Read the status message. A successful submission is awaiting review; it becomes available for download after validation, approval, and merge.

The HUD uses your current in-game character name as creator and generates the publisher label and map filename automatically. There is no separate GitHub sign-in or name-entry step. Map creator attribution is included in the submission.

Downloaded collections are editable. To submit an improved version, use your editable copy, select the original entry in **SHARED LIBRARY**, and choose **UPLOAD MY VERSION**. The copy must retain its link to that library entry. Your submission is a separate version for review and does not replace the original creator's public file.

## Keep a private backup

- **MY MAPS → BACKUP** creates another local collection, which you can select later with **USE**.
- `dghud map export <map-name> <publisher>` also saves a local JSON file. Use a lowercase map name starting with a letter or number and containing only letters, numbers, `_`, or `-`; use a publisher label containing letters, numbers, or hyphens. The publisher label does not have to be a GitHub account. `dghud map folder` opens the export folder.

These backup actions do not upload a map or request public listing. Use a **SHARE** action when you intend to contribute.

## Review before sharing

Check map names, room placement, connections, and special-travel commands. Maps contain room data and creator attribution; do not add secrets or private information to map names or commands.

Room IDs are the permanent numeric IDs supplied by Dragons Gate GMCP. When combining maps with **ADD TO CURRENT MAP**, **CURRENT MAP WINS** keeps your overlapping rooms, **DOWNLOADED MAP WINS** uses the incoming rooms, and **SKIP COLLISIONS** skips overlapping areas. **CREATE COMBINED MAP** creates a separate collection. **DOWNLOAD AS NEW** keeps maps separate; **REPLACE CURRENT** intentionally replaces the active collection after a warning and automatic backup.

## Optional manual contribution

Experienced contributors can still open a pull request:

1. Export a map and place its JSON at `maps/<publisher>/<map-name>.json`. The folder and filename must match the exported publisher and slug.
2. Preserve any existing `derived_from` attribution when preparing a revision, and contribute it under your own publisher label.
3. Run `python3 tools/validate_maps.py` from the repository root. This validates maps and regenerates both `catalog.json` and `catalog-v2.json`.
4. Include the map JSON and both updated catalogs in the pull request. Passing checks and owner approval are required before merge and public download listing.

See the [DGHUD how-to guide](https://github.com/wizzydizzy-ctrl/dragons-gate-player-hud/blob/main/docs/DGHUD_GUIDE.md) and [automapper and map library guide](https://github.com/wizzydizzy-ctrl/dragons-gate-player-hud/blob/main/docs/AUTOMAPPER_AND_MAP_LIBRARY.md) for the full map workflow.
