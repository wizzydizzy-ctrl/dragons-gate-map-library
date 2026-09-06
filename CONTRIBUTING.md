# Publishing a map

1. In Mudlet, run `dghud map export <map-name> <github-name>`.
2. Run `dghud map folder` to reveal the generated JSON file.
3. Fork this repository and place the file at `maps/<github-name>/<map-name>.json`.
4. Open a pull request. Automated checks validate the map and require the folder publisher to match `provenance.publisher` and the filename to match `provenance.slug`.

Imported maps are editable local stashes. Publish changes under your own GitHub folder. Keep the generated `derived_from` object so the original map remains credited.

Room IDs are the canonical numeric IDs supplied by Dragons Gate GMCP. Mudlet can have only one active room per numeric ID, so the HUD previews conflicts and asks whether to keep the local room, use the imported room, or skip its entire area.
