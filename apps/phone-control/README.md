# Phone Control Firmware App

Phone Control is the first `firmware-app` used to validate the WatcheRobot
App.Center public catalog flow.

It turns an existing phone-control capability into an installable firmware app:
the launcher installs it into the inactive OTA slot, reboots into it, and the app
can return the device to the launcher.

## User Value

Phone Control is a good first catalog app because it is easy to understand:

- users know immediately what it does;
- it demonstrates BLE control without requiring a desktop client;
- it proves that App.Center can install real firmware, not just show a list;
- it exercises the most important lifecycle path: install, boot, use, return.

## Current Release

```text
Catalog id:      phone-control
Type:            firmware-app
Release tag:     phone-control-v0.1.1
Asset:           phone-control-esp32s3.bin
Image version:   V2.4.1
Size:            3439904 bytes
SHA-256:         766dda89331b34e161a47807a52691653d702c26273266dc600df5bb7e457fab
Signature:       unsigned-dev
```

Release asset:

```text
https://github.com/Mr-KID-github/watche-app-center-catalog-test/releases/download/phone-control-v0.1.1/phone-control-esp32s3.bin
```

Repository mirrors:

```text
https://cdn.jsdelivr.net/gh/Mr-KID-github/watche-app-center-catalog-test@main/dist/phone-control/0.1.1/phone-control-esp32s3.bin
https://raw.githubusercontent.com/Mr-KID-github/watche-app-center-catalog-test/main/dist/phone-control/0.1.1/phone-control-esp32s3.bin
```

Domestic mirrors can be added later by syncing this repository to a public Gitee
repository and appending the Gitee raw/release asset URL to `firmware.mirrors`.
No device-side credential or Gitee password is required because each downloaded
file is verified by the catalog SHA-256.

## Compatibility

```text
Product:              WatcheRobot
Chip:                 esp32s3
Flash size:           16MB
Maximum OTA slot:     0x400000 bytes
Minimum launcher:     0.0.0
```

## Build Expectations

The firmware image must be built as the Phone Control firmware-app variant.

The build must define:

```text
WATCHER_PHONE_CONTROL_FIRMWARE_APP=1
```

The final binary must fit in one OTA app slot:

```text
sizeBytes <= 0x400000
```

## Release Flow

1. Build the Phone Control firmware-app variant.
2. Confirm the binary size is under `0x400000`.
3. Confirm the embedded ESP image version.
4. Calculate SHA-256 from the exact `.bin` file.
5. Upload the binary as a GitHub Release asset.
6. Optional: copy the same binary to `dist/phone-control/<version>/` so
   repository-based mirrors can serve it.
7. Update the `phone-control` entry in `apps.json`, including `firmware.mirrors`
   when alternate public sources are available.
8. Run:

   ```bash
   node tools/validate-catalog.mjs apps.json
   ```

9. Confirm the public catalog URL returns the same metadata.
10. Install from a real WatcheRobot device.

## Device Acceptance

A release is not accepted until these checks pass on real hardware:

- App.Center lists Phone Control from the public catalog.
- Installation downloads the Release asset over HTTPS.
- The device rejects wrong SHA-256, wrong size, and incompatible metadata.
- Successful install reboots into Phone Control.
- BLE phone control works.
- Exiting the app returns to the WatcheRobot launcher.
- Failed installs show a clear reason instead of silently returning.

## V1 Limitation

Phone Control currently uses the existing `ota_0` / `ota_1` dual-slot layout.
That means WatcheRobot can keep the launcher and one installed firmware app, but
it cannot retain multiple firmware apps at the same time.

Installing another `firmware-app` will overwrite the inactive OTA slot that held
Phone Control.

## Production Notes

This test release uses:

```text
signature.algorithm = unsigned-dev
```

Production Phone Control releases should require signed firmware with a trusted
publisher key, and the catalog entry should record release provenance so devices
can distinguish official builds from developer tests.
