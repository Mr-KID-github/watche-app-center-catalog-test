# WatcheRobot App.Center Catalog Test

Public test catalog for the WatcheRobot App.Center v2 ecosystem flow.

The catalog is published by GitHub Pages at:

https://mr-kid-github.github.io/watche-app-center-catalog-test/apps.json

Firmware binaries are expected to be uploaded as GitHub Release assets. The
initial Phone Control entry uses an unsigned developer policy plus SHA-256 so
test devices can validate the downloaded image before booting it.

## Layout

- `apps.json`: public App.Center catalog.
- `schemas/app-catalog.schema.json`: JSON Schema for catalog v2.
- `tools/validate-catalog.mjs`: local and CI validation.
- `apps/phone-control/README.md`: release checklist for the first firmware app.

## Validate

```bash
node tools/validate-catalog.mjs apps.json
```

