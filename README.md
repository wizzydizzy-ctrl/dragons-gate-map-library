# Dragons Gate HUD Map Library

Community-created maps for the Dragons Gate HUDs.

Applies to DGHUD v0.3.89.

Open **OPTIONS → MAP SETTINGS → MAP LIBRARY** in Mudlet, or enter `dghud map library`. Use **MY MAPS** for your saved local map collections and **SHARED LIBRARY → FIND SHARED MAPS** to browse community maps. No GitHub account is required to download or submit maps through the HUD.

For complete instructions, see the [DGHUD how-to guide](https://github.com/wizzydizzy-ctrl/dragons-gate-player-hud/blob/main/docs/DGHUD_GUIDE.md) and [automapper and map library guide](https://github.com/wizzydizzy-ctrl/dragons-gate-player-hud/blob/main/docs/AUTOMAPPER_AND_MAP_LIBRARY.md). See [CONTRIBUTING.md](CONTRIBUTING.md) for sharing and backup instructions.

## Downloading maps

Select a shared map, then choose the action that fits your needs:

- **DOWNLOAD AS NEW** saves a separate editable collection and makes it active. Your previous collection remains available under **MY MAPS**.
- **ADD TO CURRENT MAP** previews a combination of your active **Current Map** and the selected **Downloaded Map**. Choose **CURRENT MAP WINS** or **DOWNLOADED MAP WINS** for overlapping room numbers, or **SKIP COLLISIONS** to skip overlapping areas. Click **CREATE COMBINED MAP** to create a new editable collection; the original collections remain available.
- **REPLACE CURRENT** intentionally replaces the active collection after a warning click and an automatic local backup.
- **UPDATE MY COPY** replaces a previously downloaded collection with the selected map's current library version, keeping an automatic backup. Duplicate a copy first if you want to keep editing it separately.

Each collection is a saved map you can switch to with **MY MAPS → USE**. Downloading a new collection does not merge it into your previous map. Room numbers are permanent game identifiers, so review overlap choices when combining maps.

## Sharing and review

Choose **MY MAPS → SHARE SELECTED MAP** to submit a map for owner review. The HUD records the current in-game character name as creator and generates the publisher label and map filename. These labels do not require a GitHub identity.

The [submission service](worker/README.md) validates the upload and opens a reviewable pull request. Submission success means it was received for review; the map appears in the public download catalog only after validation, approval, and merge. A submitted revision is a separate contribution and does not overwrite the original creator's library file.

**MY MAPS → BACKUP** saves a private local collection. The `dghud map export` command saves a local JSON file. Neither action submits anything to the community library.

Map files contain JSON map data. The HUD checks the catalog, downloaded file size and checksum, map structure, and publisher identity before installation. Repository checks validate format, room IDs, coordinates, links, size limits, and publisher paths. Maps can contain special-travel commands used for walking, so review those commands when editing or contributing a map.
