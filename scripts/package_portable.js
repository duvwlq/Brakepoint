"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist", "brakepoint-portable");
const electronDistRoot = path.join(projectRoot, "node_modules", "electron", "dist");
const appRoot = path.join(distRoot, "resources", "app");

const appEntries = [
  "package.json",
  "README.md",
  "src",
  "renderer",
  "scripts",
  "brakepoint",
  "fixtures",
];
const powershellExe =
  process.env.SystemRoot &&
  path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

function ensureExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

function cleanDir(targetPath) {
  const script = [
    `if (Test-Path '${targetPath}') { Remove-Item -LiteralPath '${targetPath}' -Recurse -Force }`,
    `New-Item -ItemType Directory -Path '${targetPath}' -Force | Out-Null`,
  ].join("; ");
  const result = spawnSync(powershellExe || "powershell.exe", ["-Command", script], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`PowerShell cleanup failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `PowerShell cleanup failed: ${result.stderr || result.stdout || "unknown error"}`,
    );
  }
}

function copyEntry(name) {
  const from = path.join(projectRoot, name);
  const to = path.join(appRoot, name);
  ensureExists(from, `Required package entry ${name}`);
  const script = `Copy-Item -LiteralPath '${from}' -Destination '${to}' -Recurse -Force`;
  const result = spawnSync(powershellExe || "powershell.exe", ["-Command", script], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`PowerShell entry copy failed for ${name}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `PowerShell entry copy failed for ${name}: ${
        result.stderr || result.stdout || "unknown error"
      }`,
    );
  }
}

function writeLauncherMetadata() {
  const launcherPath = path.join(distRoot, "LAUNCH.txt");
  const lines = [
    "Brakepoint Portable Package",
    "",
    "Run Brakepoint.exe from this folder.",
    "The app payload lives in resources\\app.",
    "Python must still be available on the system or via BRAKEPOINT_PYTHON_PATH.",
    "",
    "Optional fixture overrides:",
    "  BRAKEPOINT_LMU_TELEMETRY_PATH=fixtures\\lmu\\empty",
    "  BRAKEPOINT_LMU_FIXTURE_MODE=no-coordinates",
    "",
  ];
  fs.writeFileSync(launcherPath, lines.join("\n"));
}

function copyWithPowerShell(sourcePattern, destinationDir) {
  const script = [
    `New-Item -ItemType Directory -Path '${destinationDir}' -Force | Out-Null`,
    `Copy-Item -Path '${sourcePattern}' -Destination '${destinationDir}' -Recurse -Force`,
  ].join("; ");
  const result = spawnSync(powershellExe || "powershell.exe", ["-Command", script], {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(`PowerShell spawn failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `PowerShell copy failed: ${result.stderr || result.stdout || "unknown error"}`,
    );
  }
}

function copyElectronRuntime() {
  ensureExists(electronDistRoot, "Electron runtime");
  copyWithPowerShell(path.join(electronDistRoot, "*"), distRoot);
  const exePath = path.join(distRoot, "electron.exe");
  ensureExists(exePath, "electron.exe");
  fs.copyFileSync(exePath, path.join(distRoot, "Brakepoint.exe"));
}

function main() {
  cleanDir(distRoot);
  copyElectronRuntime();
  fs.mkdirSync(appRoot, { recursive: true });
  for (const entry of appEntries) {
    copyEntry(entry);
  }
  writeLauncherMetadata();
  process.stdout.write(`${distRoot}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
