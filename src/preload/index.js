"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const { IPC_CHANNELS } = require("../shared/brakepointApi");

contextBridge.exposeInMainWorld("brakepointApi", {
  getTelemetryFolderStatus: () =>
    ipcRenderer.invoke(IPC_CHANNELS.getTelemetryFolderStatus),
  listSessions: () => ipcRenderer.invoke(IPC_CHANNELS.listSessions),
  loadSession: (sessionId) => ipcRenderer.invoke(IPC_CHANNELS.loadSession, sessionId),
  loadLapRacingLine: (sessionId, lapId) =>
    ipcRenderer.invoke(IPC_CHANNELS.loadLapRacingLine, sessionId, lapId),
});
