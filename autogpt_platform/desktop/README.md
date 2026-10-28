# AutoGPT Desktop

A Tauri v2 + React app. Today it holds the design-system gallery and a Settings screen with in-app updates.

## Development

```bash
pnpm install
pnpm tauri dev     # desktop app with hot reload
pnpm dev           # browser-only preview at http://localhost:1420 (no updater)
pnpm build         # type-check and build the frontend
```

`bundle.createUpdaterArtifacts` is on, so a local `pnpm tauri build` needs the updater signing key in
`TAURI_SIGNING_PRIVATE_KEY` (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`). To build without it, turn the
updater artifacts off for that build:

```bash
pnpm tauri build --config '{"bundle":{"createUpdaterArtifacts":false}}'
```

## Releases

Every push to `desktop/scaffold` that touches `autogpt_platform/desktop/**` runs
[`.github/workflows/desktop-release.yml`](../../.github/workflows/desktop-release.yml). It can also be started by
hand from the Actions tab (**Desktop Release → Run workflow**). The job:

1. sets the version to `0.1.<run number>` in `tauri.conf.json`, `Cargo.toml` and `package.json`;
2. builds a universal macOS app (Apple Silicon and Intel) with `tauri-apps/tauri-action`;
3. signs the updater bundle with the `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repo secrets;
4. publishes the GitHub Release `desktop-v0.1.<run number>` with the `.dmg`, the updater bundle
   (`.app.tar.gz` + `.sig`) and `latest.json`. The release notes list the commits since the previous release.

## Installing the first build

The app is not notarized by Apple, so macOS needs to be told once that it's OK to open.

1. Open the [latest release](https://github.com/Abhi1992002/autogpt-desktop-v2/releases/latest) and download
   `AutoGPT Desktop_<version>_universal.dmg`.
2. Open the `.dmg` and drag **AutoGPT Desktop** into **Applications**.
3. In **Applications**, **right-click** (or Control-click) **AutoGPT Desktop** and pick **Open**, then **Open** again
   in the warning. A plain double-click only offers "Move to Trash" the first time.
   - On macOS 15 (Sequoia) and later the right-click route may still be blocked. Then try to open the app once,
     go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway**.
   - If macOS says the app "is damaged and can't be opened", clear the download quarantine flag and open it again:
     `xattr -dr com.apple.quarantine "/Applications/AutoGPT Desktop.app"`

You only do this once. Updates installed from inside the app open normally.

## How updates work

- The app reads
  [`releases/latest/download/latest.json`](https://github.com/Abhi1992002/autogpt-desktop-v2/releases/latest/download/latest.json)
  when it starts and every 30 minutes after that. GitHub serves this file from the newest published release, which
  is always the newest desktop build.
- When a newer version is listed, a dialog shows **Update available vX → vY** with the release notes.
  **Update & restart** downloads it, installs it and relaunches the app. **Later** hides the dialog for that version
  until the next launch.
- **Settings** (the button at the top of the gallery) shows the current version and has **Check for updates**.
  When an update is found you can download it there while a progress bar shows how far it got, then click
  **Restart to update**.
- Before installing, the updater checks the download's signature against the public key in
  `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`). Only builds signed with the matching private key from
  the repo secrets are installed.

Because the app finds updates through GitHub's "latest release", other releases published in this repository
would hide the desktop builds. Keep desktop releases as the newest non-draft, non-prerelease release.
