"use strict";

const BRIDGE_ERROR = {
  PYTHON_NOT_FOUND: "PYTHON_NOT_FOUND",
  PYTHON_SCRIPT_FAILED: "PYTHON_SCRIPT_FAILED",
  PYTHON_JSON_PARSE_FAILED: "PYTHON_JSON_PARSE_FAILED",
  PYTHON_TIMEOUT: "PYTHON_TIMEOUT",
};

const IPC_CHANNELS = {
  getTelemetryFolderStatus: "brakepoint:getTelemetryFolderStatus",
  listSessions: "brakepoint:listSessions",
  loadSession: "brakepoint:loadSession",
  loadLapRacingLine: "brakepoint:loadLapRacingLine",
};

function ok(data) {
  return { ok: true, data };
}

function err(code, message, detail) {
  const error = { code, message };
  if (detail) error.detail = detail;
  return { ok: false, error };
}

module.exports = {
  BRIDGE_ERROR,
  IPC_CHANNELS,
  ok,
  err,
};
