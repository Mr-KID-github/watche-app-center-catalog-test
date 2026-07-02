# Phone Control Firmware App

Release checklist for the first WatcheRobot `firmware-app`.

1. Build the ESP32-S3 Phone Control firmware app variant.
2. Confirm the generated `.bin` is no larger than `0x400000` bytes.
3. Calculate SHA-256 for the exact release asset.
4. Upload the binary to a GitHub Release such as `phone-control-v0.1.0`.
5. Update `apps.json` with the real `url`, `sha256`, `sizeBytes`, and `imageVersion`.
6. Run `node tools/validate-catalog.mjs apps.json`.

V1 uses the existing `ota_0` / `ota_1` slots. Installing a new firmware app
overwrites the inactive slot that previously held the installed firmware app.

