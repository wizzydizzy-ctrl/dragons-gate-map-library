# Dragons Gate HUD Map Library

Community-created maps for the Dragons Gate Player and Staff HUDs.

Maps are listed by GitHub publisher and preserve the in-game character name that created them. Importing a map creates an editable local stash. If someone changes and republishes it, their copy is stored under their own GitHub name and retains `derived_from` attribution; it cannot replace the original publisher's file.

Use **Map Settings → Map Library** in Mudlet to browse, select, download, verify, and review maps without leaving the HUD. HUD commands and contribution instructions are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

The optional [Cloudflare submission service](worker/README.md) supports a future one-button HUD publishing flow. It validates contributions and opens reviewable pull requests without distributing a GitHub credential to players.

No map file is executable. Repository checks reject unknown formats, unsafe travel commands, invalid room IDs, duplicate coordinates, broken links, oversized maps, and publisher-path mismatches.
