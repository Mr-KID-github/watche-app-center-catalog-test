#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const catalogPath = process.argv[2] ?? "apps.json";
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const errors = [];
const ids = new Set();
const maxOtaSlotBytes = 0x400000;

function fail(message) {
  errors.push(message);
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSha256(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value);
}

if (catalog.schemaVersion !== 2) {
  fail("schemaVersion must be 2");
}

if (!Array.isArray(catalog.apps) || catalog.apps.length === 0) {
  fail("apps must be a non-empty array");
}

for (const [index, app] of (catalog.apps ?? []).entries()) {
  const prefix = `apps[${index}]`;
  if (!app || typeof app !== "object") {
    fail(`${prefix} must be an object`);
    continue;
  }

  if (!app.id || typeof app.id !== "string") {
    fail(`${prefix}.id is required`);
  } else if (ids.has(app.id)) {
    fail(`${prefix}.id duplicates ${app.id}`);
  } else {
    ids.add(app.id);
  }

  if (!["firmware-app", "manifest-app", "resource-app"].includes(app.type ?? "manifest-app")) {
    fail(`${prefix}.type is unsupported: ${app.type}`);
  }

  const compat = app.compat;
  if (!compat || typeof compat !== "object") {
    fail(`${prefix}.compat is required`);
  } else {
    if (compat.product !== "WatcheRobot") {
      fail(`${prefix}.compat.product must be WatcheRobot`);
    }
    if (!["esp32s3", "esp32-s3"].includes(compat.chip)) {
      fail(`${prefix}.compat.chip must be esp32s3`);
    }
    if (compat.flashSizeMb !== 16) {
      fail(`${prefix}.compat.flashSizeMb must be 16 for the V1 public catalog`);
    }
    if (!Number.isInteger(compat.otaSlotSize) || compat.otaSlotSize <= 0 || compat.otaSlotSize > maxOtaSlotBytes) {
      fail(`${prefix}.compat.otaSlotSize must be <= 0x400000`);
    }
    if (!compat.minLauncherVersion || typeof compat.minLauncherVersion !== "string") {
      fail(`${prefix}.compat.minLauncherVersion is required`);
    }
  }

  if (app.type === "firmware-app") {
    const firmware = app.firmware;
    if (!firmware || typeof firmware !== "object") {
      fail(`${prefix}.firmware is required for firmware-app`);
      continue;
    }
    if (!isHttpsUrl(firmware.url)) {
      fail(`${prefix}.firmware.url must be HTTPS`);
    }
    if (!isSha256(firmware.sha256)) {
      fail(`${prefix}.firmware.sha256 must be a 64-char hex digest`);
    }
    if (!Number.isInteger(firmware.sizeBytes) || firmware.sizeBytes <= 0 || firmware.sizeBytes > maxOtaSlotBytes) {
      fail(`${prefix}.firmware.sizeBytes must be <= 0x400000`);
    }
    if (!firmware.imageVersion || typeof firmware.imageVersion !== "string") {
      fail(`${prefix}.firmware.imageVersion is required`);
    }
  } else if (!app.packageUrl || !isHttpsUrl(app.packageUrl)) {
    fail(`${prefix}.packageUrl must be HTTPS for ${app.type}`);
  }
}

if (errors.length > 0) {
  console.error(`Catalog validation failed for ${path.resolve(catalogPath)}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Catalog validation passed: ${catalog.apps.length} app(s)`);

