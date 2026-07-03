#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const validatorPath = path.join(repoRoot, "tools", "validate-catalog.mjs");

function validCatalog(overrides = {}) {
  const firmware = {
    url: "https://example.com/phone-control.bin",
    sha256: "623097c8e56693c158c240b33b21ca9b586b003c5714329675b43e8b4f15956b",
    sizeBytes: 3400368,
    imageVersion: "V2.4.1",
    signature: {
      algorithm: "unsigned-dev",
    },
    ...(overrides.firmware ?? {}),
  };

  const app = {
    id: "phone-control",
    name: "Phone Control",
    description: "BLE phone control firmware app for WatcheRobot.",
    type: "firmware-app",
    version: "0.1.0-dev",
    compat: {
      product: "WatcheRobot",
      chip: "esp32s3",
      flashSizeMb: 16,
      otaSlotSize: 0x400000,
      minLauncherVersion: "0.0.0",
    },
    firmware,
    ...(overrides.app ?? {}),
  };

  return {
    schemaVersion: 2,
    catalogId: "watche-app-center-catalog-test",
    apps: [app],
    ...(overrides.catalog ?? {}),
  };
}

function runValidator(catalog) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "watche-catalog-test-"));
  const catalogPath = path.join(tempDir, "apps.json");
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

  const result = spawnSync(process.execPath, [validatorPath, catalogPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  fs.rmSync(tempDir, { force: true, recursive: true });
  return result;
}

test("accepts firmware mirrors when every source is unique HTTPS", () => {
  const result = runValidator(
    validCatalog({
      firmware: {
        mirrors: [
          "https://cdn.jsdelivr.net/gh/Mr-KID-github/watche-app-center-catalog-test@main/dist/phone-control/0.1.0/phone-control-esp32s3.bin",
          "https://raw.githubusercontent.com/Mr-KID-github/watche-app-center-catalog-test/main/dist/phone-control/0.1.0/phone-control-esp32s3.bin",
        ],
      },
    }),
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Catalog validation passed/);
});

test("rejects firmware mirror URLs that are not HTTPS", () => {
  const result = runValidator(
    validCatalog({
      firmware: {
        mirrors: ["http://example.com/phone-control.bin"],
      },
    }),
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /firmware\.mirrors\[0\] must be HTTPS/);
});

test("rejects firmware mirrors that duplicate another source", () => {
  const url = "https://example.com/phone-control.bin";
  const result = runValidator(
    validCatalog({
      firmware: {
        url,
        mirrors: [url],
      },
    }),
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicates another firmware URL/);
});
