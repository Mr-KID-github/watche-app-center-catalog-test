# WatcheRobot App.Center Catalog Test

This repository is the public test catalog for the WatcheRobot App.Center
ecosystem.

App.Center lets a WatcheRobot device discover apps from a public catalog,
download a compatible package over HTTPS, verify it, install it, and launch it.
The same catalog can also be used by the desktop App.Center to browse apps and
ask an online device to install one.

> Status: developer test catalog. The current catalog is intended for V1
> firmware-app validation, not production distribution.

## Catalog URL

Device and desktop clients read:

```text
https://mr-kid-github.github.io/watche-app-center-catalog-test/apps.json
```

The catalog file is static JSON published by GitHub Pages. Firmware binaries are
hosted as GitHub Release assets and can also list public HTTPS mirrors in
`firmware.mirrors`.

## Why This Exists

WatcheRobot users should not need a desktop client just to try an app. A device
with Wi-Fi can open App.Center, see community apps, install one, and return to
the launcher when finished.

For developers, this repository is the shared contract:

- `apps.json` tells devices what apps exist and whether they are compatible.
- GitHub Releases host immutable firmware binaries.
- Repository/CDN mirrors give devices alternate public download paths when the
  primary source is slow or blocked.
- `sha256`, `sizeBytes`, and `imageVersion` let the device reject the wrong
  file before booting it.
- CI validation keeps broken catalog entries out of the public feed.

## Current V1 Rules

V1 focuses on proving the ecosystem loop with `firmware-app`.

- Supported app types: `firmware-app`, `manifest-app`, `resource-app`.
- Active test app: `phone-control`.
- Target product: `WatcheRobot`.
- Target chip: `esp32s3`.
- Target flash: `16MB`.
- Max firmware image size: `0x400000` bytes.
- Download URLs must be HTTPS.
- `firmware.mirrors` is optional, but every mirror must be HTTPS and must serve
  the exact same binary verified by `firmware.sha256`.
- V1 dev releases may use `unsigned-dev + sha256`.
- Production releases should move to `ecdsa-p256-sha256` with trusted key
  allowlist enforcement.
- The current device partition table keeps the existing `ota_0` / `ota_1`
  layout, so only one installed firmware app is retained at a time. Installing a
  new firmware app overwrites the inactive OTA slot that held the previous
  firmware app.

## User Experience

For a normal technology enthusiast, the desired flow is:

1. Connect WatcheRobot to Wi-Fi.
2. Open App.Center on the device.
3. Browse the public catalog.
4. Choose an app such as Phone Control.
5. The device downloads and verifies the firmware.
6. The device reboots into the app.
7. Leaving the app returns to the WatcheRobot launcher.

The desktop App.Center uses the same catalog, but it does not upload large
firmware binaries in V1. It sends an install command to the device, and the
device downloads the firmware itself.

## Repository Layout

```text
.
├── apps.json
├── apps/
│   └── phone-control/
│       └── README.md
├── schemas/
│   └── app-catalog.schema.json
├── tools/
│   └── validate-catalog.mjs
└── .github/
    └── workflows/
        ├── pages.yml
        └── validate.yml
```

## Catalog Entry Shape

Minimal `firmware-app` entry:

```json
{
  "id": "phone-control",
  "name": "Phone Control",
  "description": "BLE phone control firmware app for WatcheRobot.",
  "type": "firmware-app",
  "version": "0.1.0-dev",
  "publisher": "WatcheRobot",
  "compat": {
    "product": "WatcheRobot",
    "chip": "esp32s3",
    "flashSizeMb": 16,
    "otaSlotSize": 4194304,
    "minLauncherVersion": "0.0.0"
  },
  "firmware": {
    "url": "https://github.com/Mr-KID-github/watche-app-center-catalog-test/releases/download/phone-control-v0.1.0/phone-control-esp32s3.bin",
    "mirrors": [
      "https://cdn.jsdelivr.net/gh/Mr-KID-github/watche-app-center-catalog-test@main/dist/phone-control/0.1.0/phone-control-esp32s3.bin",
      "https://raw.githubusercontent.com/Mr-KID-github/watche-app-center-catalog-test/main/dist/phone-control/0.1.0/phone-control-esp32s3.bin"
    ],
    "sha256": "623097c8e56693c158c240b33b21ca9b586b003c5714329675b43e8b4f15956b",
    "sizeBytes": 3400368,
    "imageVersion": "1.1",
    "signature": {
      "algorithm": "unsigned-dev"
    }
  }
}
```

Important details:

- `id` is stable. Do not rename it after users install the app.
- `version` is the catalog-facing app release version.
- `firmware.imageVersion` must match the ESP firmware image version embedded in
  the `.bin`.
- `firmware.sha256` must be calculated from the exact uploaded Release asset.
- `firmware.sizeBytes` must be no larger than `compat.otaSlotSize`.
- `firmware.mirrors` should only contain public HTTPS URLs for the same binary.
- `minLauncherVersion` should be raised when an app depends on newer launcher or
  installer behavior.

## Release Checklist

Use this flow for every firmware app release.

1. Build the firmware-app variant.
2. Confirm the generated `.bin` is no larger than `0x400000`.
3. Read the ESP image version from the build output.
4. Calculate SHA-256 for the exact `.bin`.
5. Create a GitHub Release and upload the binary asset.
6. Optional: publish the same binary to repository/CDN mirrors.
7. Update `apps.json` with the Release URL, `mirrors`, `sha256`, `sizeBytes`,
   and `imageVersion`.
8. Run catalog validation.
9. Open the public `apps.json` URL and confirm it returns the new metadata.
10. Install from a real WatcheRobot device before promoting the release.

Example validation command:

```bash
node tools/validate-catalog.mjs apps.json
```

Example Release asset URL pattern:

```text
https://github.com/Mr-KID-github/watche-app-center-catalog-test/releases/download/<tag>/<asset-name>.bin
```

## Quality Bar

An app should not be added to this catalog unless it passes these checks:

- The app has a clear user-facing purpose.
- The app boots on real WatcheRobot hardware.
- Installation failure messages are understandable.
- The app can return to the launcher.
- The binary fits in the OTA slot.
- The catalog entry passes validation.
- The Release asset is downloadable over HTTPS.
- Every mirror, if present, is downloadable over HTTPS.
- The published `sha256` matches the downloaded asset.

## Security Model

This test catalog currently accepts `unsigned-dev` firmware entries with a
required SHA-256 digest. SHA-256 protects against accidental corruption and
wrong files, but it is not a publisher trust model by itself.

Before production distribution, the catalog should require signed firmware:

- `signature.algorithm = "ecdsa-p256-sha256"`
- trusted publisher key allowlist on device
- release provenance recorded in the catalog
- rollback and bad-release handling policy

## References

- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site):
  static catalog publishing from a branch or GitHub Actions.
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases):
  versioned downloadable software releases and binary assets.
- [GitHub Release assets API](https://docs.github.com/en/rest/releases/assets):
  release assets expose browser download URLs and asset digests.
- [ESP-IDF OTA](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/ota.html):
  OTA app slots, OTA data, image validation, and rollback behavior.
- [F-Droid metadata guidance](https://f-droid.org/docs/All_About_Descriptions_Graphics_and_Screenshots/):
  app metadata should stay close to the app owner and flow into the public
  repository.
- [F-Droid build metadata reference](https://f-droid.org/en/docs/Build_Metadata_Reference/):
  examples of catalog metadata fields such as source code, issue tracker,
  changelog, binaries, and builds.
