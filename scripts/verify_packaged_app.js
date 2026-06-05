"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const exePath = path.join(projectRoot, "dist", "brakepoint-portable", "Brakepoint.exe");
const powershellExe =
  process.env.SystemRoot &&
  path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");

function psSingleQuoted(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

const exePathLiteral = psSingleQuoted(exePath);
const exeDirLiteral = psSingleQuoted(path.dirname(exePath));

const script = [
  `$exePath = ${exePathLiteral}`,
  `if (-not (Test-Path -LiteralPath $exePath)) { Write-Error 'Packaged exe not found.'; exit 1 }`,
  `Start-Process -FilePath $exePath -WorkingDirectory ${exeDirLiteral} | Out-Null`,
  "Start-Sleep -Seconds 5",
  "$processes = @(Get-Process -Name Brakepoint -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exePath })",
  "if ($processes.Count -gt 0) {",
  "  $processes | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }",
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
