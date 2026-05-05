"use strict";

const { PythonBridgeService } = require("./pythonBridgeService");

class BrakepointApiService {
  constructor(options = {}) {
    this.pythonBridge = options.pythonBridge || new PythonBridgeService(options);
  }

  getTelemetryFolderStatus() {
    return this.pythonBridge.run("folder-status");
  }

  listSessions() {
    return this.pythonBridge.run("list-sessions");
  }

  loadSession(sessionId) {
    return this.pythonBridge.run("load-session", [sessionId]);
  }

  loadLapRacingLine(sessionId, lapId) {
    return this.pythonBridge.run("load-lap", [sessionId, lapId]);
  }
}

module.exports = {
  BrakepointApiService,
};
