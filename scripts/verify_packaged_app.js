"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const exePath = path.join(projectRoot, "dist", "brakepoint-portable", "Brakepoint.exe");
const powershellExe =
  process.env.SystemRoot &&
  path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

const script = [
  `if (-not (Test-Path '${exePath}')) { Write-Error 'Packaged exe not found.'; exit 1 }`,
  `$p = Start-Process -FilePath '${exePath}' -WorkingDirectory '${path.dirname(exePath)}' -PassThru`,
  "Start-Sleep -Seconds 5",
  "if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) {",
  "  Stop-Process -Id $p.Id -Force",
  `  Write-Output 'Packaged app launch verified: ${exePath}'`,
  "  exit 0",
  "}",
  "Write-Error 'Packaged app exited too early.'",
  "exit 1",
].join("; ");

const result = spawnSync(powershellExe || "powershell.exe", ["-Command", script], {
  cwd: projectRoot,
  encoding: "utf8",
  windowsHide: true,
});

if (result.error) {
  process.stderr.write(`Packaged app verification failed: ${result.error.message}\n`);
  process.exitCode = 1;
} else if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "Packaged app verification failed.\n");
  process.exitCode = 1;
} else {
  process.stdout.write(result.stdout || `Packaged app launch verified: ${exePath}\n`);
}
