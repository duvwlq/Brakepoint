"use strict";

const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { BrakepointApiService } = require("./services/brakepointApiService");
const { registerBrakepointIpc } = require("./ipc/brakepointIpc");

const apiService = new BrakepointApiService();
registerBrakepointIpc(ipcMain, apiService);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    backgroundColor: "#0B0F14",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "../../renderer/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
