"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { BRIDGE_ERROR, err } = require("../../shared/brakepointApi");

const DEFAULT_TIMEOUTS = {
  "folder-status": 5_000,
  "list-sessions": 15_000,
  "load-session": 15_000,
  "load-lap": 30_000,
};

class PythonBridgeService {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || path.resolve(__dirname, "../../..");
    this.pythonCandidates = options.pythonCandidates || this.defaultPythonCandidates();
    this.scriptPath =
      options.scriptPath ||
      path.join(this.projectRoot, "scripts", "brakepoint_lmu.py");
  }

  defaultPythonCandidates() {
    const candidates = [];
    if (process.env.BRAKEPOINT_PYTHON_PATH) {
      candidates.push({ command: process.env.BRAKEPOINT_PYTHON_PATH, args: [] });
    }
    candidates.push({
      command: path.join(this.projectRoot, ".venv", "Scripts", "python.exe"),
      args: [],
    });
    candidates.push({
      command: path.join(this.projectRoot, "venv", "Scripts", "python.exe"),
      args: [],
    });
    candidates.push({ command: "python", args: [] });
    candidates.push({ command: "py", args: ["-3"] });
    return candidates;
  }

  async run(command, args = [], options = {}) {
    if (!fs.existsSync(this.scriptPath)) {
      return err(
        BRIDGE_ERROR.PYTHON_SCRIPT_FAILED,
        "Brakepoint Python CLI script was not found.",
        this.scriptPath,
      );
    }

    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUTS[command] || 15_000;
    const candidates = [...this.pythonCandidates];
    let lastError = "";

    for (const candidate of candidates) {
      if (path.isAbsolute(candidate.command) && !fs.existsSync(candidate.command)) {
        lastError = `${candidate.command}: not found`;
        continue;
      }
      const result = await this.tryRunCandidate(candidate, command, args, timeoutMs);
      if (result.kind === "spawn-error") {
        lastError = result.detail;
        continue;
      }
      return result.payload;
    }

    return err(
      BRIDGE_ERROR.PYTHON_NOT_FOUND,
      "Python executable was not found.",
      lastError || "Set BRAKEPOINT_PYTHON_PATH or create .venv\\Scripts\\python.exe.",
    );
  }

  tryRunCandidate(candidate, command, args, timeoutMs) {
    return new Promise((resolve) => {
      const spawnArgs = [
        ...candidate.args,
        this.scriptPath,
        command,
        ...args.map((value) => String(value)),
      ];
      let stdout = "";
      let stderr = "";
      let settled = false;
      let child;
      try {
        child = spawn(candidate.command, spawnArgs, {
          cwd: this.projectRoot,
          env: process.env,
          windowsHide: true,
        });
      } catch (error) {
        resolve({ kind: "spawn-error", detail: `${candidate.command}: ${error.message}` });
        return;
      }

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill();
        resolve({
          kind: "result",
          payload: err(
            BRIDGE_ERROR.PYTHON_TIMEOUT,
            "Python adapter timed out.",
            `${command} exceeded ${timeoutMs}ms`,
          ),
        });
      }, timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ kind: "spawn-error", detail: `${candidate.command}: ${error.message}` });
      });
      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const parsed = this.parseStdout(stdout, command, stderr);
        if (!parsed.ok) {
          resolve({ kind: "result", payload: parsed.payload });
          return;
        }
        if (parsed.payload && parsed.payload.ok === false) {
          resolve({ kind: "result", payload: parsed.payload });
          return;
        }
        if (code !== 0) {
          resolve({
            kind: "result",
            payload: err(
              BRIDGE_ERROR.PYTHON_SCRIPT_FAILED,
              "Python adapter exited with a non-zero status.",
              stderr || `Exit code ${code}`,
            ),
          });
          return;
        }
        resolve({ kind: "result", payload: parsed.payload });
      });
    });
  }

  parseStdout(stdout, command, stderr) {
    const text = stdout.trim();
    if (!text) {
      return {
        ok: false,
        payload: err(
          BRIDGE_ERROR.PYTHON_JSON_PARSE_FAILED,
          "Python adapter returned empty stdout.",
          stderr || command,
        ),
      };
    }
    try {
      return { ok: true, payload: JSON.parse(text) };
    } catch (error) {
      return {
        ok: false,
        payload: err(
          BRIDGE_ERROR.PYTHON_JSON_PARSE_FAILED,
          "Python adapter stdout was not valid JSON.",
          `${error.message}\nstdout: ${text.slice(0, 500)}\nstderr: ${stderr.slice(0, 500)}`,
        ),
      };
    }
  }
}

module.exports = {
  PythonBridgeService,
};
