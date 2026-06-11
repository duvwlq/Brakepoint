"use strict";

const api = window.brakepointApi;

const state = {
  view: "sessions",
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
  sessionFilters: {
    status: "all",
    sessionType: "all",
  },
  sessionsScrollTop: 0,
  comparisonEnabled: false,
  showJson: false,
};

const els = {
  sourceStatus: document.getElementById("source-status"),
  navSessions: document.getElementById("nav-sessions"),
  navAnalysis: document.getElementById("nav-analysis"),
  sessionsSelectionSummary: document.getElementById("sessions-selection-summary"),
  sessionsBrowseSummary: document.getElementById("sessions-browse-summary"),
  sessionFilters: document.getElementById("session-filters"),
  sessionList: document.getElementById("session-list"),
  sessionsView: document.getElementById("sessions-view"),
  analysisView: document.getElementById("analysis-view"),
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
  topbarBack: document.getElementById("topbar-back"),
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
  els.navSessions.addEventListener("click", () => setView("sessions"));
  els.navAnalysis.addEventListener("click", () => setView("lap-analysis"));
  els.topbarBack.addEventListener("click", () => setView("sessions"));
  els.sessionsSelectionSummary.addEventListener("click", handleSessionsSummaryClick);
  els.sidebarToggle.addEventListener("click", () => togglePanel("sidebarCollapsed"));
  els.lapPanelToggle.addEventListener("click", () => togglePanel("lapListCollapsed"));
  els.summaryPanelToggle.addEventListener("click", () => togglePanel("summaryCollapsed"));
  els.sessionFilters.addEventListener("click", handleSessionFilterClick);
  els.sessionList.addEventListener("scroll", handleSessionListScroll);
  els.lapSummary.addEventListener("click", handleLapSummaryClick);
  els.jsonToggle.addEventListener("click", () => {
    state.showJson = !state.showJson;
    renderLapTelemetry();
  });
}

async function refreshAll() {
  state.view = "sessions";
  state.selectedSessionId = null;
  state.selectedLapId = null;
  state.detail = { status: "idle" };
  state.lapTelemetry = { status: "idle" };
  state.comparisonEnabled = false;
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
  state.view = "lap-analysis";
  state.selectedLapId = null;
  state.detail = { status: "loading", sessionId };
  state.lapTelemetry = { status: "idle" };
  state.comparisonEnabled = false;
  resetInteraction();
  setTopStatus("Loading session");
  render();
  const result = await api.loadSession(sessionId);
  if (result.ok) {
    state.detail = { status: "ready", data: result.data };
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
  state.comparisonEnabled = false;
  state.showJson = false;
  resetInteraction();
  setTopStatus("Loading lap");
  renderLapList();
  renderLapTelemetry();
  const result = await api.loadLapRacingLine(state.selectedSessionId, lap.lapId);
  if (result.ok) {
    state.lapTelemetry = { status: "ready", data: result.data };
    setTopStatus("Lap loaded");
  } else {
    state.lapTelemetry = { status: "error", error: result.error };
    setTopStatus(result.error.code, true);
  }
  renderLapTelemetry();
}

function render() {
  renderViewState();
  renderSourceStatus();
  renderSessionsSelectionSummary();
  renderSessionsBrowseSummary();
  renderSessionList();
  renderSessionDetail();
  renderLapList();
  renderLapTelemetry();
  renderPanelStates();
}

function setView(view) {
  state.view = view;
  render();
}

function renderViewState() {
  const isSessionsView = state.view === "sessions";
  els.sessionsView.classList.toggle("hidden", !isSessionsView);
  els.analysisView.classList.toggle("hidden", isSessionsView);
  els.navSessions.classList.toggle("active", isSessionsView);
  els.navAnalysis.classList.toggle("active", !isSessionsView);
  els.navAnalysis.disabled = !state.selectedSessionId;
  els.navAnalysis.setAttribute("aria-disabled", String(!state.selectedSessionId));
  renderTopbar();
}

function renderTopbar() {
  if (state.view === "sessions") {
    els.topKicker.textContent = "Phase 1.2 · Sessions";
    els.topTitle.textContent = "Browse LMU Sessions";
    els.topbarBack.classList.add("hidden");
    if (state.sessions.status === "ready") {
      setTopStatus(`${state.sessions.items.length} sessions`);
    } else if (state.sessions.status === "loading") {
      setTopStatus("Loading");
    }
    return;
  }

  els.topKicker.textContent = "Phase 1.2 · Lap Analysis";
  els.topbarBack.classList.remove("hidden");
  if (state.detail.status === "ready") {
    els.topTitle.textContent = formatSessionTitle(state.detail.data.session);
  } else if (state.detail.status === "loading") {
    els.topTitle.textContent = "Loading session...";
  } else {
    els.topTitle.textContent = "Lap Analysis";
  }
}

function renderSessionsSelectionSummary() {
  const hasSelection = Boolean(state.selectedSessionId);
  els.sessionsSelectionSummary.classList.toggle("hidden", !hasSelection);
  if (!hasSelection) {
    els.sessionsSelectionSummary.innerHTML = "";
    return;
  }

  const selectedSession = state.sessions.items.find((session) => session.sessionId === state.selectedSessionId);
  const title = selectedSession ? formatSessionTitle(selectedSession) : "Selected session";
  const statusLabel = selectedSession?.status || "unknown";
  const detailLabel =
    state.detail.status === "ready"
      ? `${state.detail.data.laps.length} laps ready for analysis`
      : state.detail.status === "loading"
        ? "Loading selected session..."
        : "Return to Lap Analysis";

  els.sessionsSelectionSummary.innerHTML = `
    <div class="sessions-selection-copy">
      <div class="panel-kicker">Selected Session</div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detailLabel)}</span>
    </div>
    <div class="sessions-selection-actions">
      <span class="badge">${escapeHtml(statusLabel)}</span>
      <button type="button" class="ghost-button" data-action="open-analysis">Open Analysis</button>
    </div>
  `;
}

function renderSessionsBrowseSummary() {
  if (state.sessions.status !== "ready" || !state.sessions.items.length) {
    els.sessionsBrowseSummary.classList.add("hidden");
    els.sessionsBrowseSummary.innerHTML = "";
    return;
  }

  const filteredSessions = applySessionFilters(state.sessions.items);
  const counts = countSessionStates(filteredSessions);
  const activeFilters = [];
  if (state.sessionFilters.status !== "all") {
    activeFilters.push(`Status: ${formatFilterLabel("status", state.sessionFilters.status)}`);
  }
  if (state.sessionFilters.sessionType !== "all") {
    activeFilters.push(`Session: ${formatFilterLabel("sessionType", state.sessionFilters.sessionType)}`);
  }

  els.sessionsBrowseSummary.classList.remove("hidden");
  els.sessionsBrowseSummary.innerHTML = `
    <div class="sessions-browse-stat">
      <span class="label">Showing</span>
      <strong>${filteredSessions.length}</strong>
    </div>
    <div class="sessions-browse-stat">
      <span class="label">Ready</span>
      <strong>${counts.ready}</strong>
    </div>
    <div class="sessions-browse-stat">
      <span class="label">Partial</span>
      <strong>${counts.partial}</strong>
    </div>
    <div class="sessions-browse-stat">
      <span class="label">Read issue</span>
      <strong>${counts.error}</strong>
    </div>
    <div class="sessions-browse-hint">
      ${escapeHtml(activeFilters.length ? activeFilters.join(" · ") : "Track-grouped browsing with lightweight filters")}
    </div>
  `;
}

function handleSessionsSummaryClick(event) {
  const button = event.target.closest("[data-action='open-analysis']");
  if (!button || !state.selectedSessionId) {
    return;
  }
  setView("lap-analysis");
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
    els.sourceStatus.innerHTML = `<strong>Telemetry source unavailable</strong><span class="error-text">${escapeHtml(source.error.message)}</span>`;
    return;
  }
  const data = source.data;
  if (source.status === "missing") {
    els.sourceStatus.classList.add("critical");
    els.sourceStatus.innerHTML = `
      <strong>Telemetry folder unavailable</strong>
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
  renderSessionFilters();
  if (state.sessions.status === "loading") {
    els.sessionList.innerHTML = '<div class="empty-state">Loading sessions...</div>';
    renderSessionPanelState();
    return;
  }
  if (state.sessions.status === "error") {
    els.sessionList.innerHTML = `<div class="empty-state error-text">Session list unavailable. ${escapeHtml(state.sessions.error.message)}</div>`;
    renderSessionPanelState();
    return;
  }
  if (!state.sessions.items.length) {
    els.sessionList.innerHTML = '<div class="empty-state">No telemetry sessions found. Drive in LMU with telemetry recording enabled.</div>';
    renderSessionPanelState();
    return;
  }
  const filteredSessions = applySessionFilters(state.sessions.items);
  if (!filteredSessions.length) {
    els.sessionList.innerHTML = '<div class="empty-state">No sessions match the current filters.</div>';
    renderSessionPanelState();
    return;
  }
  els.sessionList.innerHTML = "";
  const header = document.createElement("div");
  header.className = "session-results-header";
  header.innerHTML = `
    <span>Session</span>
    <span>Type</span>
    <span>Car</span>
    <span>Recorded</span>
    <span>State</span>
  `;
  els.sessionList.appendChild(header);
  const groupedSessions = groupSessionsByTrackAndLayout(filteredSessions);
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
  restoreSessionsBrowseContext();
}

function renderSessionFilters() {
  if (state.sessions.status !== "ready" || !state.sessions.items.length) {
    els.sessionFilters.innerHTML = "";
    els.sessionFilters.classList.add("hidden");
    return;
  }

  const statusOptions = buildFilterOptions(state.sessions.items, "status", [
    "ready",
    "partial",
    "error",
    "recording",
  ]);
  const sessionTypeOptions = buildFilterOptions(state.sessions.items, "sessionType", [
    "race",
    "qualifying",
    "practice",
    "test-day",
    "unknown",
  ]);

  els.sessionFilters.classList.remove("hidden");
  els.sessionFilters.innerHTML = `
    <div class="filter-group">
      <span class="filter-label">Status</span>
      <div class="filter-chip-row">
        ${renderFilterChip("status", "all", "All", state.sessionFilters.status === "all")}
        ${statusOptions.map((option) => renderFilterChip("status", option.value, option.label, state.sessionFilters.status === option.value)).join("")}
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Session</span>
      <div class="filter-chip-row">
        ${renderFilterChip("sessionType", "all", "All", state.sessionFilters.sessionType === "all")}
        ${sessionTypeOptions.map((option) => renderFilterChip("sessionType", option.value, option.label, state.sessionFilters.sessionType === option.value)).join("")}
      </div>
    </div>
  `;
}

function handleSessionFilterClick(event) {
  const button = event.target.closest("[data-filter-kind]");
  if (!button) {
    return;
  }
  const kind = button.dataset.filterKind;
  const value = button.dataset.filterValue;
  if (!kind || !value || !(kind in state.sessionFilters)) {
    return;
  }
  state.sessionFilters[kind] = value;
  renderSessionsBrowseSummary();
  renderSessionList();
}

function handleLapSummaryClick(event) {
  const button = event.target.closest("[data-action='toggle-comparison']");
  if (!button || state.lapTelemetry.status !== "ready") {
    return;
  }
  const comparison = state.lapTelemetry.data?.comparison;
  if (!comparison || comparison.status !== "available") {
    return;
  }
  state.comparisonEnabled = !state.comparisonEnabled;
  renderLapTelemetry();
}

function handleSessionListScroll() {
  if (state.view !== "sessions") {
    return;
  }
  state.sessionsScrollTop = els.sessionList.scrollTop;
}

function restoreSessionsBrowseContext() {
  if (state.view !== "sessions") {
    return;
  }
  requestAnimationFrame(() => {
    els.sessionList.scrollTop = state.sessionsScrollTop;
    const selectedSessionId = state.selectedSessionId || "";
    if (!selectedSessionId) {
      return;
    }
    const selectedRow = els.sessionList.querySelector(`[data-session-id="${CSS.escape(selectedSessionId)}"]`);
    if (!selectedRow) {
      return;
    }
    const listRect = els.sessionList.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    const isAbove = rowRect.top < listRect.top;
    const isBelow = rowRect.bottom > listRect.bottom;
    if (state.sessionsScrollTop === 0 && (isAbove || isBelow)) {
      selectedRow.scrollIntoView({ block: "nearest" });
    }
  });
}

function renderFilterChip(kind, value, label, isActive) {
  return `<button type="button" class="filter-chip ${isActive ? "active" : ""}" data-filter-kind="${escapeHtml(kind)}" data-filter-value="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
}

function renderSessionCard(session) {
  const button = document.createElement("button");
  const isError = session.status === "error";
  const isSelected = session.sessionId === state.selectedSessionId;
  button.className = `session-card session-row ${isSelected ? "active" : ""} ${isError ? "error" : ""}`;
  button.type = "button";
  button.dataset.sessionId = session.sessionId;
  button.disabled = isError;
  button.setAttribute("aria-disabled", String(isError));
  const sessionStatusLabel = isError ? "Session read issue" : session.status || "unknown";
  const sessionMetaLine = isError
    ? "Analysis unavailable for this recording"
    : formatLayoutMeta(session);
  const actionLabel = isError ? "Read issue" : isSelected ? "Selected" : "Open Analysis";
  button.innerHTML = `
    <div class="session-row-main">
      <strong class="session-title">${escapeHtml(formatSessionTitle(session))}</strong>
      <span class="session-meta">${escapeHtml(sessionMetaLine)}</span>
    </div>
    <div class="session-row-cell">
      <span class="session-row-value">${escapeHtml(session.sessionType || "unknown")}</span>
    </div>
    <div class="session-row-cell">
      <span class="session-row-value">${escapeHtml(formatCar(session))}</span>
    </div>
    <div class="session-row-cell">
      <span class="session-row-value">${escapeHtml(formatDate(session.modifiedAt))}</span>
    </div>
    <div class="session-row-state">
      <span class="badge ${isError ? "invalid" : ""}">${escapeHtml(sessionStatusLabel)}</span>
      <span class="session-row-action">${escapeHtml(actionLabel)}</span>
    </div>
  `;
  if (!isError) {
    button.addEventListener("click", () => selectSession(session.sessionId));
  }
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
    els.sessionDetail.textContent = `Session details unavailable. ${detail.error.message}`;
    return;
  }
  const session = detail.data.session;
  const laps = detail.data.laps;
  const valid = laps.filter((lap) => lap.isValid);
  const best = laps.find((lap) => lap.isBest);
  const selectedLap = laps.find((lap) => lap.lapId === state.selectedLapId);
  els.sessionDetail.className = "";
  els.sessionDetail.innerHTML = `
    <div class="analysis-context-banner">
      <div class="analysis-context-copy">
        <span class="badge">Opened from Sessions</span>
        <strong>${escapeHtml(formatSessionTitle(session))}</strong>
        <span>${escapeHtml(formatDate(session.modifiedAt) || "Recording time unavailable")}</span>
      </div>
      <div class="analysis-context-meta">
        <span>${escapeHtml(selectedLap ? `Lap #${selectedLap.lapNumber}` : "No lap selected")}</span>
        <span>${escapeHtml(session.status || "unknown")}</span>
      </div>
    </div>
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
    const isInvalid = !lap.isValid;
    button.className = `lap-row ${lap.lapId === state.selectedLapId ? "active" : ""} ${isInvalid ? "invalid-disabled" : ""}`;
    button.disabled = false;
    button.setAttribute("aria-disabled", String(isInvalid));
    if (isInvalid) {
      button.title = formatInvalidLapReason(lap);
    }
    const status = lap.isBest
      ? '<span class="badge best">Best</span>'
      : lap.isValid
        ? '<span class="badge">Valid</span>'
        : '<span class="badge invalid">Invalid</span>';
    const lapReason = lap.isValid
      ? lap.validityReason || lap.lapKind || "Ready to analyse"
      : formatInvalidLapReason(lap);
    button.innerHTML = `
      <div class="lap-index">
        <strong>#${lap.lapNumber}</strong>
      </div>
      <div class="lap-copy">
        <span class="lap-time">${escapeHtml(formatLapTime(lap.lapTimeMs))}</span>
        <span class="lap-reason ${isInvalid ? "invalid" : "muted"}">${escapeHtml(lapReason)}</span>
      </div>
      ${status}
    `;
    button.addEventListener("click", () => selectLap(lap));
    els.lapList.appendChild(button);
  }
  renderLapPanelState();
}

function renderLapTelemetry() {
  const telemetry = state.lapTelemetry;
  renderTopbar();
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
  const renderData = getRenderableLapTelemetry(data);
  racingCanvas.setData(renderData);
  racingCanvas.setInteraction(state.interaction);
  telemetryGraphs.setData(renderData);
  telemetryGraphs.setInteraction(state.interaction);

  els.lapSummary.className = "";
  const modeTone =
    data.mode === "distance-graph-only"
      ? "warning"
      : String(data.coordinateStatus?.confidence || "").toLowerCase() === "low"
        ? "warning"
        : "primary";
  const graphPoints = getGraphPoints(data);
  els.lapSummary.innerHTML = `
    <div class="lap-summary-header">
      <span class="badge ${modeTone}">${escapeHtml(formatModeLabel(data))}</span>
      <span class="muted">${escapeHtml(formatCoordinateMeta(data.coordinateStatus))}</span>
    </div>
    ${renderComparisonSummary(data)}
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
  const comparison = data.comparison;
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
      ${Number.isFinite(activePoint.steering01) ? `<div class="metric"><label>Steering</label><strong>${escapeHtml(formatPercent(activePoint.steering01))}</strong></div>` : ""}
      ${Number.isFinite(activePoint.gear) ? `<div class="metric"><label>Gear</label><strong>${escapeHtml(formatGear(activePoint.gear))}</strong></div>` : ""}
      ${Number.isFinite(activePoint.rpm) ? `<div class="metric"><label>RPM</label><strong>${escapeHtml(formatRpm(activePoint.rpm))}</strong></div>` : ""}
      ${comparison?.status === "available" && state.comparisonEnabled ? `<div class="metric"><label>Best Lap</label><strong>${escapeHtml(`#${comparison.bestLap.lap.lapNumber}`)}</strong></div>` : ""}
    </div>
  `;
}

function getRenderableLapTelemetry(data) {
  return {
    ...data,
    comparisonEnabled: Boolean(state.comparisonEnabled && data?.comparison?.status === "available"),
  };
}

function renderComparisonSummary(data) {
  const comparison = data.comparison;
  if (!comparison) {
    return "";
  }
  if (comparison.status !== "available" || !comparison.bestLap) {
    return `
      <div class="comparison-summary unavailable">
        <div class="comparison-summary-copy">
          <span class="badge">Best lap comparison</span>
          <span class="muted">${escapeHtml(comparison.reason || "Best lap comparison unavailable")}</span>
        </div>
      </div>
    `;
  }

  const buttonLabel = state.comparisonEnabled ? "Hide Best Lap" : "Show Best Lap";
  return `
    <div class="comparison-summary">
      <div class="comparison-summary-copy">
        <span class="badge primary">Best lap comparison</span>
        <span class="muted">${escapeHtml(`Best #${comparison.bestLap.lap.lapNumber} • ${formatLapTime(comparison.bestLap.lap.lapTimeMs)}`)}</span>
      </div>
      <button type="button" class="ghost-button comparison-toggle" data-action="toggle-comparison" aria-pressed="${state.comparisonEnabled}">
        ${escapeHtml(buttonLabel)}
      </button>
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
    steering01: numberOr(point.steering01, point.steering, racingPoint?.steering01, racingPoint?.steering),
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

function buildFilterOptions(items, key, orderedValues) {
  const available = new Set(
    items
      .map((item) => normalizeFilterValue(item[key]))
      .filter((value) => value !== "all"),
  );
  return orderedValues
    .filter((value) => available.has(value))
    .map((value) => ({ value, label: formatFilterLabel(key, value) }));
}

function applySessionFilters(items) {
  return items.filter((session) => {
    const status = normalizeFilterValue(session.status);
    const sessionType = normalizeFilterValue(session.sessionType);
    const statusMatches =
      state.sessionFilters.status === "all" || status === state.sessionFilters.status;
    const typeMatches =
      state.sessionFilters.sessionType === "all" ||
      sessionType === state.sessionFilters.sessionType;
    return statusMatches && typeMatches;
  });
}

function formatTrackLabel(session) {
  return session.track?.displayName || session.trackName || "Unknown Track";
}

function countSessionStates(items) {
  return items.reduce(
    (counts, session) => {
      const status = normalizeFilterValue(session.status);
      if (status in counts) {
        counts[status] += 1;
      }
      return counts;
    },
    { ready: 0, partial: 0, error: 0 },
  );
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

function formatLayoutMeta(session) {
  const layout = session.track?.layoutName || session.trackLayout || "";
  if (!layout) {
    return "Layout unavailable";
  }
  return layout;
}

function normalizeFilterValue(value) {
  const text = String(value || "").trim().toLowerCase();
  return text || "unknown";
}

function formatFilterLabel(kind, value) {
  if (kind === "status") {
    return value === "error" ? "Read issue" : capitalizeFilterLabel(value);
  }
  return value === "test-day" ? "Test day" : capitalizeFilterLabel(value);
}

function capitalizeFilterLabel(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    items.push("Coordinate data is unavailable. Showing distance-based graphs only.");
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
      return "Coordinate data is unavailable. Showing distance-based graphs only.";
    case "PARTIAL_CHANNELS":
      return "Some telemetry channels are missing. Available data is still shown.";
    case "LOW_CONFIDENCE_COORDINATES":
      return "Coordinate confidence is low. Treat this racing line as approximate.";
    case "LAP_BOUNDARY_AMBIGUOUS":
      return "Lap boundary is incomplete. Available session data is still shown.";
    default:
      return warning?.message || "Some telemetry data is incomplete. Available data is still shown.";
  }
}

function formatInvalidLapReason(lap) {
  if (lap?.lapTimeMs <= 0) {
    return "Lap time unavailable";
  }
  if (lap?.validityReason) {
    if (lap.validityReason.includes("missing or zero")) {
      return "Lap time unavailable";
    }
    return lap.validityReason;
  }
  return "Cannot analyse this lap";
}

function formatLapLoadError(error) {
  switch (error?.code) {
    case "LAP_INVALID":
      return "Lap analysis unavailable. Lap time is missing.";
    case "MISSING_DISTANCE":
      return "Lap analysis unavailable. Distance data is missing.";
    default:
      return error?.message || "Lap analysis unavailable.";
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
    case "steering":
      return "Steering";
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
