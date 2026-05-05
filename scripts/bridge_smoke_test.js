"use strict";

const { BrakepointApiService } = require("../src/main/services/brakepointApiService");

async function main() {
  const api = new BrakepointApiService();
  const folder = await api.getTelemetryFolderStatus();
  console.log("folder-status:", summarize(folder));
  if (!folder.ok) process.exitCode = 1;

  const sessions = await api.listSessions();
  console.log("list-sessions:", summarizeSessions(sessions));
  if (!sessions.ok) {
    process.exitCode = 1;
    return;
  }

  const firstReady = sessions.data.find((session) => session.status === "ready");
  if (!firstReady) {
    console.log("load-session: skipped, no ready session");
    return;
  }

  const detail = await api.loadSession(firstReady.sessionId);
  console.log("load-session:", summarizeSessionDetail(detail));
  if (!detail.ok) {
    process.exitCode = 1;
    return;
  }

  const firstValidLap = detail.data.laps.find((lap) => lap.isValid);
  if (!firstValidLap) {
    console.log("load-lap: skipped, no valid lap");
    return;
  }

  const lap = await api.loadLapRacingLine(firstReady.sessionId, firstValidLap.lapId);
  console.log("load-lap:", summarizeLap(lap));
  if (!lap.ok) process.exitCode = 1;

  const invalidLap = detail.data.laps.find((candidate) => !candidate.isValid);
  if (invalidLap) {
    const invalidResult = await api.loadLapRacingLine(firstReady.sessionId, invalidLap.lapId);
    console.log("load-invalid-lap:", summarizeInvalidLap(invalidResult));
    if (invalidResult.ok || invalidResult.error.code !== "LAP_INVALID") {
      process.exitCode = 1;
    }
  }
}

function summarize(result) {
  if (!result.ok) return result.error;
  return result.data;
}

function summarizeSessions(result) {
  if (!result.ok) return result.error;
  return {
    count: result.data.length,
    firstReady: result.data.find((session) => session.status === "ready")?.sessionId || null,
  };
}

function summarizeSessionDetail(result) {
  if (!result.ok) return result.error;
  return {
    sessionId: result.data.session.sessionId,
    laps: result.data.laps.length,
    validLaps: result.data.laps.filter((lap) => lap.isValid).length,
    bestLapId: result.data.laps.find((lap) => lap.isBest)?.lapId || null,
  };
}

function summarizeLap(result) {
  if (!result.ok) return result.error;
  return {
    mode: result.data.mode,
    racingLinePoints: result.data.racingLine.length,
    graphPoints: result.data.graphPoints.length,
    warnings: result.data.warnings.map((warning) => warning.code),
  };
}

function summarizeInvalidLap(result) {
  if (result.ok) return { unexpectedOk: true };
  return {
    code: result.error.code,
    message: result.error.message,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
