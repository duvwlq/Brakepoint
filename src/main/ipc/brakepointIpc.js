"use strict";

const { IPC_CHANNELS, err } = require("../../shared/brakepointApi");

function registerBrakepointIpc(ipcMain, apiService) {
  ipcMain.handle(IPC_CHANNELS.getTelemetryFolderStatus, () =>
    apiService.getTelemetryFolderStatus(),
  );

  ipcMain.handle(IPC_CHANNELS.listSessions, () => apiService.listSessions());

  ipcMain.handle(IPC_CHANNELS.loadSession, (_event, sessionId) => {
    if (!sessionId) {
      return err("SESSION_NOT_FOUND", "sessionId is required.");
    }
    return apiService.loadSession(sessionId);
  });

  ipcMain.handle(IPC_CHANNELS.loadLapRacingLine, (_event, sessionId, lapId) => {
    if (!sessionId) {
      return err("SESSION_NOT_FOUND", "sessionId is required.");
    }
    if (!lapId) {
      return err("LAP_NOT_FOUND", "lapId is required.");
    }
    return apiService.loadLapRacingLine(sessionId, lapId);
  });
}

module.exports = {
  registerBrakepointIpc,
};
