# Publishing a map

1. Choose a lowercase map name containing only letters, numbers, `_`, or `-`.
2. In Mudlet, run `dghud map export <map-name> <github-name>`.
3. Run `dghud map folder` to reveal the generated JSON file. Exporting creates a local file; it does not upload it.
4. Fork this repository and upload the file at `maps/<github-name>/<map-name>.json`. The folder and filename must exactly match the publisher and map name used during export.
5. Run `python3 tools/validate_maps.py` from the repository root so `catalog.json` includes the map.
6. Commit both the map JSON and updated `catalog.json`, then open a pull request. Automated checks validate room IDs, coordinates, exits, provenance, and the catalog before the map can be merged and downloaded in the HUD.

Imported maps are editable local stashes. Publish changes under your own GitHub folder. Keep the generated `derived_from` object so the original map remains credited.

Room IDs are the canonical numeric IDs supplied by Dragons Gate GMCP. Mudlet can have only one active room per numeric ID, so the HUD previews conflicts and asks whether to keep the local room, use the imported room, or skip its entire area.
