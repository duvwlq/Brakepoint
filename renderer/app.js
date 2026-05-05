"use strict";

const api = window.brakepointApi;

const state = {
  source: { status: "loading" },
  sessions: { status: "loading", items: [] },
  selectedSessionId: null,
  detail: { status: "idle" },
  selectedLapId: null,
  lapTelemetry: { status: "idle" },
  interaction: {
    activeDistanceM: null,
    activeSource: null,
    activePoint: null,
  },
  panelState: {
    sidebarCollapsed: false,
    lapListCollapsed: false,
    summaryCollapsed: false,
  },
  showJson: false,
};

const els = {
  sourceStatus: document.getElementById("source-status"),
  sessionList: document.getElementById("session-list"),
  sessionDetail: document.getElementById("session-detail"),
  lapList: document.getElementById("lap-list"),
  lapPanel: document.querySelector(".lap-panel"),
  lapPanelCompact: document.getElementById("lap-panel-compact"),
  lapSummary: document.getElementById("lap-summary"),
  summaryPanelCompact: document.getElementById("lap-summary-compact"),
  appShell: document.querySelector(".app-shell"),
  analysisGrid: document.querySelector(".analysis-grid"),
  sidebar: document.querySelector(".sidebar"),
  sessionPanel: document.querySelector(".session-panel"),
  debugPanel: document.querySelector(".debug-panel"),
  jsonDebug: document.getElementById("json-debug"),
  jsonToggle: document.getElementById("json-toggle"),
  refreshButton: document.getElementById("refresh-button"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  lapPanelToggle: document.getElementById("lap-panel-toggle"),
  summaryPanelToggle: document.getElementById("summary-panel-toggle"),
  topKicker: document.getElementById("top-kicker"),
  topTitle: document.getElementById("top-title"),
  topStatus: document.getElementById("top-status"),
  canvasPanel: document.querySelector(".placeholder-panel"),
  graphPanel: document.querySelector("#graph-panel .graph-cards"),
};

const racingCanvas = window.BrakepointCanvas.createRacingLineCanvas(els.canvasPanel, {
  onHoverDistance: handleHoverDistance,
  onClearHover: handleClearHover,
});
const telemetryGraphs = window.BrakepointTelemetryGraphs.createTelemetryGraphs(els.graphPanel, {
  onHoverDistance: handleHoverDistance,
  onClearHover: handleClearHover,
});

function assertApi() {
  if (!api) {
    setTopStatus("Preload API missing", true);
    els.sourceStatus.innerHTML =
      '<strong>Bridge unavailable</strong><span class="error-text">window.brakepointApi is missing.</span>';
    return false;
  }
  return true;
}

async function init() {
  if (!assertApi()) return;
  bindEvents();
  await refreshAll();
}

function bindEvents() {
  els.refreshButton.addEventListener("click", refreshAll);
  els.sidebarToggle.addEventListener("click", () => togglePanel("sidebarCollapsed"));
  els.lapPanelToggle.addEventListener("click", () => togglePanel("lapListCollapsed"));
  els.summaryPanelToggle.addEventListener("click", () => togglePanel("summaryCollapsed"));
  els.jsonToggle.addEventListener("click", () => {
    state.showJson = !state.showJson;
    renderLapTelemetry();
  });
}

async function refreshAll() {
  state.selectedSessionId = null;
  state.selectedLapId = null;
  state.detail = { status: "idle" };
  state.lapTelemetry = { status: "idle" };
  resetInteraction();
  setTopStatus("Loading");
  await Promise.all([loadSourceStatus(), loadSessions()]);
  render();
}

async function loadSourceStatus() {
  state.source = { status: "loading" };
  renderSourceStatus();
  const result = await api.getTelemetryFolderStatus();
  if (result.ok) {
    state.source = { status: result.data.exists ? "ready" : "missing", data: result.data };
  } else {
    state.source = { status: "error", error: result.error };
  }
  renderSourceStatus();
}

async function loadSessions() {
  state.sessions = { status: "loading", items: [] };
  renderSessionList();
  const result = await api.listSessions();
  if (result.ok) {
    state.sessions = { status: "ready", items: result.data };
    setTopStatus("Ready");
  } else {
    state.sessions = { status: "error", error: result.error, items: [] };
    setTopStatus(result.error.code, true);
  }
  renderSessionList();
}

async function selectSession(sessionId) {
  state.selectedSessionId = sessionId;
  state.selectedLapId = null;
  state.detail = { status: "loading", sessionId };
  state.lapTelemetry = { status: "idle" };
  resetInteraction();
  setTopStatus("Loading session");
  render();
  const result = await api.loadSession(sessionId);
  if (result.ok) {
    state.detail = { status: "ready", data: result.data };
    els.topTitle.textContent = formatSessionTitle(result.data.session);
    if (els.topKicker) {
      els.topKicker.textContent = "Phase 1 · Single Lap Viewer";
    }
    setTopStatus("Session loaded");
  } else {
    state.detail = { status: "error", error: result.error };
    setTopStatus(result.error.code, true);
  }
  render();
}

async function selectLap(lap) {
  if (!lap.isValid || !state.selectedSessionId) return;
  state.selectedLapId = lap.lapId;
  state.lapTelemetry = { status: "loading", lapId: lap.lapId };
  state.showJson = false;
  resetInteraction();
  setTopStatus("Loading lap");
  renderLapList();
  renderLapTelemetry();
  const result = await api.loadLapRacingLine(state.selectedSessionId, lap.lapId);
  if (result.ok) {
    state.lapTelemetry = { status: "ready", data: result.data };
    if (els.topKicker) {
      els.topKicker.textContent = "Phase 1 · Actual Lap Analysis";
    }
    setTopStatus("Lap loaded");
  } else {
    state.lapTelemetry = { status: "error", error: result.error };
    setTopStatus(result.error.code, true);
  }
  renderLapTelemetry();
}

function render() {
  renderSourceStatus();
  renderSessionList();
  renderSessionDetail();
  renderLapList();
  renderLapTelemetry();
  renderPanelStates();
}

function renderSourceStatus() {
  const source = state.source;
  els.sourceStatus.classList.remove("critical");
  if (source.status === "loading") {
    els.sourceStatus.innerHTML = "<strong>Telemetry source</strong>Checking LMU telemetry folder...";
    return;
  }
  if (source.status === "error") {
    els.sourceStatus.classList.add("critical");
    els.sourceStatus.innerHTML = `<strong>Telemetry source error</strong><span class="error-text">${escapeHtml(source.error.message)}</span>`;
    return;
  }
  const data = source.data;
  if (source.status === "missing") {
    els.sourceStatus.classList.add("critical");
    els.sourceStatus.innerHTML = `
      <strong>Telemetry folder not found</strong>
      <div>${escapeHtml(data.path || "-")}</div>
      <div>Check your LMU telemetry recording settings.</div>
    `;
    return;
  }
  els.sourceStatus.innerHTML = `
    <strong>Telemetry folder found</strong>
    <div>${escapeHtml(data.path || "-")}</div>
    <div>${data.fileCount || 0} .duckdb files</div>
  `;
}

function renderSessionList() {
  if (state.sessions.status === "loading") {
    els.sessionList.innerHTML = '<div class="empty-state">Loading sessions...</div>';
    renderSessionPanelState();
    return;
  }
  if (state.sessions.status === "error") {
    els.sessionList.innerHTML = `<div class="empty-state error-text">${escapeHtml(state.sessions.error.message)}</div>`;
    renderSessionPanelState();
    return;
  }
  if (!state.sessions.items.length) {
    els.sessionList.innerHTML = '<div class="empty-state">No LMU telemetry sessions found. Drive a session in LMU with telemetry recording enabled.</div>';
    renderSessionPanelState();
    return;
  }
  els.sessionList.innerHTML = "";
  const groupedSessions = groupSessionsByTrackAndLayout(state.sessions.items);
  for (const trackGroup of groupedSessions) {
    const trackSection = document.createElement("section");
    trackSection.className = "session-track-group";
    trackSection.innerHTML = `
      <div class="session-track-header">
        <strong>${escapeHtml(trackGroup.trackLabel)}</strong>
        <span>${trackGroup.sessions.length} sessions</span>
      </div>
    `;

    for (const layoutGroup of trackGroup.layouts) {
      const showLayoutLabel =
        trackGroup.layouts.length > 1 ||
        (layoutGroup.layoutLabel && layoutGroup.layoutLabel !== trackGroup.trackLabel);
      if (showLayoutLabel) {
        const layoutLabel = document.createElement("div");
        layoutLabel.className = "session-layout-label";
        layoutLabel.textContent = layoutGroup.layoutLabel;
        trackSection.appendChild(layoutLabel);
      }

      for (const session of layoutGroup.sessions) {
        trackSection.appendChild(renderSessionCard(session));
      }
    }

    els.sessionList.appendChild(trackSection);
  }
  renderSessionPanelState();
}

function renderSessionCard(session) {
  const button = document.createElement("button");
  const isError = session.status === "error";
  button.className = `session-card ${session.sessionId === state.selectedSessionId ? "active" : ""} ${isError ? "error" : ""}`;
  button.type = "button";
  button.disabled = false;
  const sessionStatusLabel = isError ? "Session read issue" : session.status || "unknown";
  const sessionMetaLine = isError
    ? "This session could not be read fully. Try another recording."
    : formatCar(session);
  button.innerHTML = `
    <div class="session-title">${escapeHtml(formatSessionTitle(session))}</div>
    <div class="session-meta">${escapeHtml(formatDate(session.modifiedAt))}</div>
    <div class="session-meta">${escapeHtml(sessionMetaLine)}</div>
    <div class="session-tags">
      <span class="badge">${escapeHtml(session.sessionType || "unknown")}</span>
      <span class="badge ${isError ? "invalid" : ""}">${escapeHtml(sessionStatusLabel)}</span>
    </div>
  `;
  button.addEventListener("click", () => selectSession(session.sessionId));
  return button;
}

function renderSessionDetail() {
  const detail = state.detail;
  if (detail.status === "idle") {
    els.sessionDetail.className = "empty-state";
    els.sessionDetail.textContent = "Select a session to inspect telemetry details.";
    return;
  }
  if (detail.status === "loading") {
    els.sessionDetail.className = "empty-state";
    els.sessionDetail.textContent = "Loading session details...";
    return;
  }
  if (detail.status === "error") {
    els.sessionDetail.className = "empty-state error-text";
    els.sessionDetail.textContent = `Session data could not be loaded. ${detail.error.message}`;
    return;
  }
  const session = detail.data.session;
  const laps = detail.data.laps;
  const valid = laps.filter((lap) => lap.isValid);
  const best = laps.find((lap) => lap.isBest);
  els.sessionDetail.className = "";
  els.sessionDetail.innerHTML = `
    <h2>${escapeHtml(formatSessionTitle(session))}</h2>
    <div class="muted">${escapeHtml(formatCar(session))}</div>
    <div class="metric-grid">
      <div class="metric"><label>Session</label><strong>${escapeHtml(session.sessionType || "unknown")}</strong></div>
      <div class="metric"><label>Laps</label><strong>${laps.length}</strong></div>
      <div class="metric"><label>Valid</label><strong>${valid.length}</strong></div>
      <div class="metric"><label>Best</label><strong>${escapeHtml(best ? formatLapTime(best.lapTimeMs) : "-")}</strong></div>
      <div class="metric"><label>Status</label><strong>${escapeHtml(session.status || "-")}</strong></div>
      <div class="metric"><label>Warnings</label><strong>${session.warnings?.length || 0}</strong></div>
    </div>
    ${renderSessionWarnings(session.warnings || [])}
  `;
}

function renderLapList() {
  const detail = state.detail;
  if (detail.status !== "ready") {
    els.lapList.className = "lap-list empty-state";
    els.lapList.textContent = "Select a session to view laps.";
    renderLapPanelState();
    return;
  }
  els.lapList.className = "lap-list";
  els.lapList.innerHTML = "";
  for (const lap of detail.data.laps) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lap-row ${lap.lapId === state.selectedLapId ? "active" : ""}`;
    button.disabled = !lap.isValid;
    const status = lap.isBest
      ? '<span class="badge best">Best</span>'
      : lap.isValid
        ? '<span class="badge">Valid</span>'
        : '<span class="badge invalid">Invalid</span>';
    const lapReason = lap.isValid
      ? lap.validityReason || lap.lapKind || "Ready to analyse"
      : formatInvalidLapReason(lap);
    button.innerHTML = `
      <strong>#${lap.lapNumber}</strong>
      <span>${escapeHtml(formatLapTime(lap.lapTimeMs))}<br><span class="muted">${escapeHtml(lapReason)}</span></span>
      ${status}
    `;
    button.addEventListener("click", () => selectLap(lap));
    els.lapList.appendChild(button);
  }
  renderLapPanelState();
}

function renderLapTelemetry() {
  const telemetry = state.lapTelemetry;
  els.jsonToggle.disabled = telemetry.status !== "ready";
  if (telemetry.status === "idle") {
    racingCanvas.setData(null);
    racingCanvas.setInteraction(state.interaction);
    telemetryGraphs.setData(null);
    telemetryGraphs.setInteraction(state.interaction);
    els.lapSummary.className = "empty-state";
    els.lapSummary.textContent = "Select a valid lap to inspect telemetry details.";
    els.jsonDebug.classList.add("hidden");
    renderSummaryPanelState();
    return;
  }
  if (telemetry.status === "loading") {
    racingCanvas.setData(null);
    racingCanvas.setInteraction(state.interaction);
    telemetryGraphs.setData(null);
    telemetryGraphs.setInteraction(state.interaction);
    els.lapSummary.className = "empty-state";
    els.lapSummary.textContent = "Loading lap telemetry...";
    els.jsonDebug.classList.add("hidden");
    renderSummaryPanelState();
    return;
  }
  if (telemetry.status === "error") {
    racingCanvas.setData(null);
    racingCanvas.setInteraction(state.interaction);
    telemetryGraphs.setData(null);
    telemetryGraphs.setInteraction(state.interaction);
    els.lapSummary.className = "empty-state error-text";
    els.lapSummary.textContent = formatLapLoadError(telemetry.error);
    els.jsonDebug.classList.add("hidden");
    renderSummaryPanelState();
    return;
  }

  const data = telemetry.data;
  racingCanvas.setData(data);
  racingCanvas.setInteraction(state.interaction);
  telemetryGraphs.setData(data);
  telemetryGraphs.setInteraction(state.interaction);

  els.lapSummary.className = "";
  const modeTone =
    data.mode === "distance-graph-only"
      ? "invalid"
      : String(data.coordinateStatus?.confidence || "").toLowerCase() === "low"
        ? "invalid"
        : "primary";
  const graphPoints = getGraphPoints(data);
  els.lapSummary.innerHTML = `
    <div class="lap-summary-header">
      <span class="badge ${modeTone}">${escapeHtml(formatModeLabel(data))}</span>
      <span class="muted">${escapeHtml(formatCoordinateMeta(data.coordinateStatus))}</span>
    </div>
    ${renderLapWarnings(data)}
    <div class="lap-summary-grid">
      <div class="metric"><label>Coordinates</label><strong>${escapeHtml(data.coordinateStatus.source)}</strong></div>
      <div class="metric"><label>Confidence</label><strong>${escapeHtml(data.coordinateStatus.confidence)}</strong></div>
      <div class="metric"><label>Distance</label><strong>${data.sync.hasDistance ? "Yes" : "No"}</strong></div>
      <div class="metric"><label>Mapping</label><strong>${escapeHtml(data.coordinateStatus.renderMapping || "-")}</strong></div>
      <div class="metric"><label>Line points</label><strong>${Array.isArray(data.racingLine) ? data.racingLine.length : 0}</strong></div>
      <div class="metric"><label>Graph points</label><strong>${graphPoints.length}</strong></div>
      <div class="metric"><label>Warnings</label><strong>${Array.isArray(data.warnings) ? data.warnings.length : 0}</strong></div>
      <div class="metric"><label>Lap</label><strong>#${data.lap.lapNumber}</strong></div>
    </div>
    <div id="active-telemetry" class="active-telemetry"></div>
  `;
  renderActiveTelemetrySummary(data);
  els.jsonDebug.textContent = JSON.stringify(data, null, 2);
  els.jsonDebug.classList.toggle("hidden", !state.showJson);
  els.jsonToggle.textContent = state.showJson ? "Hide Dev JSON" : "Dev JSON";
  renderSummaryPanelState();
}

function togglePanel(key) {
  state.panelState[key] = !state.panelState[key];
  renderPanelStates();
}

function renderPanelStates() {
  renderSessionPanelState();
  renderLapPanelState();
  renderSummaryPanelState();
  els.analysisGrid.classList.toggle(
    "right-column-compact",
    state.panelState.lapListCollapsed && state.panelState.summaryCollapsed,
  );
}

function renderSessionPanelState() {
  const collapsed = state.panelState.sidebarCollapsed;
  els.appShell.classList.toggle("sidebar-collapsed", collapsed);
  els.sidebar.classList.toggle("collapsed", collapsed);
  els.sidebarToggle.textContent = collapsed ? "Expand" : "Collapse";
  els.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
}

function renderLapPanelState() {
  const collapsed = state.panelState.lapListCollapsed;
  els.lapPanel.classList.toggle("collapsed", collapsed);
  els.lapList.classList.toggle("hidden", collapsed);
  els.lapPanelCompact.classList.toggle("hidden", !collapsed);
  els.lapPanelToggle.textContent = collapsed ? "Expand" : "Collapse";
  els.lapPanelToggle.setAttribute("aria-expanded", String(!collapsed));
  els.lapPanelCompact.innerHTML = renderLapPanelCompactSummary();
}

function renderSummaryPanelState() {
  const collapsed = state.panelState.summaryCollapsed;
  const canShowJson = state.showJson && !collapsed;
  els.debugPanel.classList.toggle("collapsed", collapsed);
  els.lapSummary.classList.toggle("hidden", collapsed);
  els.jsonDebug.classList.toggle("hidden", !canShowJson);
  els.summaryPanelCompact.classList.toggle("hidden", !collapsed);
  els.summaryPanelToggle.textContent = collapsed ? "Expand" : "Collapse";
  els.summaryPanelToggle.setAttribute("aria-expanded", String(!collapsed));
  els.summaryPanelCompact.innerHTML = renderSummaryCompact();
}

function renderLapPanelCompactSummary() {
  const detail = state.detail;
  if (detail.status !== "ready") {
    return '<span>No session selected</span>';
  }
  const laps = detail.data.laps || [];
  const validCount = laps.filter((lap) => lap.isValid).length;
  const selected = laps.find((lap) => lap.lapId === state.selectedLapId);
  return `
    <span>${laps.length} laps · ${validCount} valid</span>
    <span>${escapeHtml(selected ? `Selected #${selected.lapNumber}` : "No lap selected")}</span>
  `;
}

function renderSummaryCompact() {
  const telemetry = state.lapTelemetry;
  if (telemetry.status !== "ready") {
    return '<span>No lap data loaded</span>';
  }
  const data = telemetry.data;
  const warningCount = Array.isArray(data.warnings) ? data.warnings.length : 0;
  const modeLabel = formatModeLabel(data);
  return `
    <span>${escapeHtml(modeLabel)}</span>
    <span>${escapeHtml(`#${data.lap.lapNumber}`)}</span>
    <span>${warningCount > 0 ? `${warningCount} warnings` : "No warnings"}</span>
  `;
}

function handleHoverDistance(distanceM, source) {
  const data = state.lapTelemetry.status === "ready" ? state.lapTelemetry.data : null;
  if (!data || !Number.isFinite(distanceM)) {
    return;
  }
  state.interaction = {
    activeDistanceM: distanceM,
    activeSource: source,
    activePoint: resolveActivePoint(data, distanceM),
  };
  racingCanvas.setInteraction(state.interaction);
  telemetryGraphs.setInteraction(state.interaction);
  renderActiveTelemetrySummary(data);
}

function handleClearHover() {
  const data = state.lapTelemetry.status === "ready" ? state.lapTelemetry.data : null;
  resetInteraction();
  racingCanvas.setInteraction(state.interaction);
  telemetryGraphs.setInteraction(state.interaction);
  if (data) {
    renderActiveTelemetrySummary(data);
  }
}

function renderActiveTelemetrySummary(data) {
  const mount = document.getElementById("active-telemetry");
  if (!mount) {
    return;
  }
  const activePoint = state.interaction.activePoint;
  if (!activePoint || !Number.isFinite(state.interaction.activeDistanceM)) {
    mount.innerHTML = `
      <div class="active-telemetry-empty">
        Hover the canvas or a graph to inspect distance, speed, brake, and throttle together.
      </div>
    `;
    return;
  }
  mount.innerHTML = `
    <div class="active-telemetry-header">
      <span class="badge">${escapeHtml(formatActiveSource(state.interaction.activeSource))}</span>
      <span class="muted">Shared distance hover</span>
    </div>
    <div class="active-telemetry-grid">
      <div class="metric"><label>Distance</label><strong>${escapeHtml(formatDistance(activePoint.distanceM))}</strong></div>
      <div class="metric"><label>Speed</label><strong>${escapeHtml(formatSpeed(activePoint.speedKph))}</strong></div>
      <div class="metric"><label>Brake</label><strong>${escapeHtml(formatPercent(activePoint.brake01))}</strong></div>
      <div class="metric"><label>Throttle</label><strong>${escapeHtml(formatPercent(activePoint.throttle01))}</strong></div>
      ${Number.isFinite(activePoint.gear) ? `<div class="metric"><label>Gear</label><strong>${escapeHtml(formatGear(activePoint.gear))}</strong></div>` : ""}
      ${Number.isFinite(activePoint.rpm) ? `<div class="metric"><label>RPM</label><strong>${escapeHtml(formatRpm(activePoint.rpm))}</strong></div>` : ""}
    </div>
  `;
}

function resolveActivePoint(data, distanceM) {
  const graphPoint = findNearestByDistance(getGraphPoints(data), distanceM);
  const racingPoint = findNearestByDistance(data.racingLine || [], distanceM);
  const point = graphPoint || racingPoint;
  if (!point) {
    return null;
  }
  return {
    distanceM: point.distanceM,
    speedKph: numberOr(point.speedKph, racingPoint?.speedKph),
    brake01: numberOr(point.brake01, point.brake, racingPoint?.brake01, racingPoint?.brake),
    throttle01: numberOr(
      point.throttle01,
      point.throttle,
      racingPoint?.throttle01,
      racingPoint?.throttle,
    ),
    gear: numberOr(point.gear),
    rpm: numberOr(point.rpm),
  };
}

function getGraphPoints(data) {
  if (!data) {
    return [];
  }
  if (Array.isArray(data.graphPoints) && data.graphPoints.length) {
    return window.BrakepointTelemetryGraphs.normalizeGraphPoints(data.graphPoints);
  }
  return window.BrakepointTelemetryGraphs.buildGraphPointsFromLegacyGraphs(data.graphs);
}

function findNearestByDistance(points, distanceM) {
  if (!Array.isArray(points) || !points.length || !Number.isFinite(distanceM)) {
    return null;
  }
  let nearest = null;
  let bestDelta = Infinity;
  for (const point of points) {
    const pointDistance = Number(point.distanceM);
    if (!Number.isFinite(pointDistance)) {
      continue;
    }
    const delta = Math.abs(pointDistance - distanceM);
    if (delta < bestDelta) {
      bestDelta = delta;
      nearest = point;
    }
  }
  return nearest;
}

function numberOr(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return undefined;
}

function resetInteraction() {
  state.interaction = {
    activeDistanceM: null,
    activeSource: null,
    activePoint: null,
  };
}

function setTopStatus(text, isError = false) {
  els.topStatus.textContent = text;
  els.topStatus.classList.toggle("error-text", isError);
  els.topStatus.classList.toggle("danger", isError);
  els.topStatus.classList.toggle("primary", !isError);
}

function formatSessionTitle(session) {
  const track = session.track?.displayName || "Unknown Track";
  const layout = session.track?.layoutName;
  return layout && layout !== track ? `${track} - ${layout}` : track;
}

function groupSessionsByTrackAndLayout(sessions) {
  const trackGroups = new Map();
  for (const session of sessions) {
    const trackLabel = formatTrackLabel(session);
    const layoutLabel = formatLayoutLabel(session, trackLabel);
    if (!trackGroups.has(trackLabel)) {
      trackGroups.set(trackLabel, {
        trackLabel,
        sessions: [],
        layoutMap: new Map(),
      });
    }
    const trackGroup = trackGroups.get(trackLabel);
    trackGroup.sessions.push(session);
    if (!trackGroup.layoutMap.has(layoutLabel)) {
      trackGroup.layoutMap.set(layoutLabel, {
        layoutLabel,
        sessions: [],
      });
    }
    trackGroup.layoutMap.get(layoutLabel).sessions.push(session);
  }

  return Array.from(trackGroups.values()).map((trackGroup) => ({
    trackLabel: trackGroup.trackLabel,
    sessions: trackGroup.sessions,
    layouts: Array.from(trackGroup.layoutMap.values()),
  }));
}

function formatTrackLabel(session) {
  return session.track?.displayName || session.trackName || "Unknown Track";
}

function formatLayoutLabel(session, trackLabel) {
  const layout = session.track?.layoutName || session.trackLayout || "";
  if (!layout) {
    return "Unknown Layout";
  }
  return layout === trackLabel ? "Default Layout" : layout;
}

function formatCar(session) {
  const car = session.car?.displayName || "Unknown Car";
  const carClass = session.car?.carClass;
  return carClass ? `${car} - ${carClass}` : car;
}

function formatLapTime(ms) {
  if (!ms || ms <= 0) return "-";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatModeLabel(data) {
  if (data.mode === "distance-graph-only") {
    return "Distance Graph Only";
  }
  if (String(data.coordinateStatus?.confidence || "").toLowerCase() === "low") {
    return "Approximate Lap Line";
  }
  return "Actual Lap Line";
}

function formatCoordinateMeta(coordinateStatus) {
  if (coordinateStatus?.source === "gps-lat-lon") {
    return "Telemetry Coordinates · GPS Projected / Projected Meter";
  }
  return `${coordinateStatus?.renderMapping || "none"} / ${coordinateStatus?.coordinateUnit || "unknown"}`;
}

function renderSessionWarnings(warnings) {
  if (!Array.isArray(warnings) || !warnings.length) {
    return "";
  }
  return `
    <div class="warning-stack">
      ${warnings.map((warning) => `<div class="warning-banner">${escapeHtml(formatWarningMessage(warning))}</div>`).join("")}
    </div>
  `;
}

function renderLapWarnings(data) {
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  const items = [];
  if (data.mode === "distance-graph-only") {
    items.push("Coordinate data is missing. Showing distance-based graphs only.");
  }
  for (const warning of warnings) {
    items.push(formatWarningMessage(warning));
  }
  if (!items.length) {
    return "";
  }
  return `
    <div class="warning-stack">
      ${items.map((message) => `<div class="warning-banner">${escapeHtml(message)}</div>`).join("")}
    </div>
  `;
}

function formatWarningMessage(warning) {
  const code = warning?.code || "";
  switch (code) {
    case "NO_COORDINATES":
      return "Coordinate data is missing. Showing distance-based graphs only.";
    case "PARTIAL_CHANNELS":
      return "Some telemetry channels are missing. Available data is still shown.";
    case "LOW_CONFIDENCE_COORDINATES":
      return "Coordinate confidence is low. Treat this racing line as approximate.";
    default:
      return warning?.message || "Some telemetry data is incomplete. Available data is still shown.";
  }
}

function formatInvalidLapReason(lap) {
  if (lap?.lapTimeMs <= 0) {
    return "This lap is invalid because lap time is missing or zero.";
  }
  return lap?.validityReason || "This lap is invalid and cannot be analysed.";
}

function formatLapLoadError(error) {
  switch (error?.code) {
    case "LAP_INVALID":
      return "This lap is invalid because lap time is missing or zero.";
    case "MISSING_DISTANCE":
      return "Distance data is missing, so this lap cannot be analysed.";
    default:
      return error?.message || "Lap analysis could not be loaded.";
  }
}

function formatActiveSource(source) {
  switch (source) {
    case "canvas":
      return "Canvas";
    case "speed":
      return "Speed";
    case "brake":
      return "Brake";
    case "throttle":
      return "Throttle";
    case "gear":
      return "Gear";
    case "rpm":
      return "RPM";
    default:
      return "Hover";
  }
}

function formatDistance(distanceM) {
  return `${Math.round(distanceM || 0)} m`;
}

function formatGear(gear) {
  return `G${Math.round(gear || 0)}`;
}

function formatRpm(rpm) {
  return `${Math.round(rpm || 0)} rpm`;
}

function formatSpeed(value) {
  return Number.isFinite(value) ? `${Math.round(value)} km/h` : "-";
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
