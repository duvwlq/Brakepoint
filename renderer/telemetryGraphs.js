"use strict";

(function attachTelemetryGraphs(global) {
  const COLORS = {
    speed: "#6D92B8",
    brake: "#E5484D",
    throttle: "#3B82F6",
    gear: "#425466",
    rpm: "#A2A83A",
    steering: "#5E7CE2",
    comparison: "rgba(25, 31, 40, 0.4)",
    comparisonFill: "rgba(25, 31, 40, 0.04)",
    grid: "rgba(25, 31, 40, 0.08)",
    muted: "rgba(107, 114, 128, 0.9)",
    axis: "rgba(25, 31, 40, 0.12)",
    cursor: "#3182F6",
    cursorGlow: "rgba(49, 130, 246, 0.18)",
    cursorCore: "#FFFFFF",
  };

  const CORE_SERIES = [
    { key: "speedKph", id: "speed", label: "Speed", unit: "km/h", color: COLORS.speed, fixedRange: null },
    { key: "brake01", id: "brake", label: "Brake", unit: "0..1", color: COLORS.brake, fixedRange: [0, 1] },
    { key: "throttle01", id: "throttle", label: "Throttle", unit: "0..1", color: COLORS.throttle, fixedRange: [0, 1] },
  ];

  const ADVANCED_SERIES = [
    { key: "gear", id: "gear", label: "Gear", unit: "gear", color: COLORS.gear, fixedRange: null, renderMode: "step" },
    { key: "rpm", id: "rpm", label: "RPM", unit: "rpm", color: COLORS.rpm, fixedRange: null },
    { key: "steering01", id: "steering", label: "Steering", unit: "0..1", color: COLORS.steering, fixedRange: [0, 1] },
  ];

  function createTelemetryGraphs(container, options = {}) {
    const state = {
      data: null,
      interaction: { activeDistanceM: null, activeSource: null, activePoint: null },
      pointsBySeries: new Map(),
      advancedExpanded: false,
      onHoverDistance: options.onHoverDistance,
      onClearHover: options.onClearHover,
    };

    function setData(data) {
      state.data = data;
      render();
    }

    function setInteraction(interaction) {
      state.interaction = interaction || { activeDistanceM: null, activeSource: null, activePoint: null };
      render();
    }

    function render() {
      const data = state.data;
      const graphPoints = getGraphPoints(data);
      const comparisonGraphPoints = getComparisonGraphPoints(data);
      state.pointsBySeries.clear();
      const advancedAvailability = getAdvancedAvailability(graphPoints);

      container.innerHTML = `
        <div class="graph-layout">
          <div class="graph-stack">
            ${CORE_SERIES.map((series) => renderSeriesCard(series, graphPoints, comparisonGraphPoints, state)).join("")}
          </div>
          ${renderAdvancedSection(advancedAvailability, graphPoints, comparisonGraphPoints, state)}
        </div>
      `;
      bindGraphEvents(graphPoints);
      bindAdvancedToggle();
    }

    function bindGraphEvents(graphPoints) {
      for (const series of [...CORE_SERIES, ...ADVANCED_SERIES]) {
        const svg = container.querySelector(`svg[data-series="${series.id}"]`);
        if (!svg) continue;
        svg.addEventListener("mousemove", (event) => {
          const rect = svg.getBoundingClientRect();
          const ratio = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
          const maxDistance = graphPoints.length ? graphPoints[graphPoints.length - 1].distanceM || 0 : 0;
          const hoveredDistance = ratio * maxDistance;
          if (typeof state.onHoverDistance === "function") {
            state.onHoverDistance(hoveredDistance, series.id);
          }
        });
        svg.addEventListener("mouseleave", () => {
          if (typeof state.onClearHover === "function") {
            state.onClearHover(series.id);
          }
        });
      }
    }

    function bindAdvancedToggle() {
      const toggle = container.querySelector("[data-advanced-toggle]");
      if (!toggle) return;
      toggle.addEventListener("click", () => {
        state.advancedExpanded = !state.advancedExpanded;
        render();
      });
    }

    render();

    return {
      setData,
      setInteraction,
      render,
    };
  }

  function renderAdvancedSection(advancedAvailability, graphPoints, comparisonGraphPoints, state) {
    const { availableSeries, unavailableSeries } = advancedAvailability;
    if (!availableSeries.length && !unavailableSeries.length) {
      return "";
    }
    const expanded = state.advancedExpanded;
    const availabilityLabel = `${availableSeries.length} available`;
    const unavailableLabel = unavailableSeries.length
      ? `<span class="advanced-graphs-missing">${unavailableSeries.map((series) => `${series.label} unavailable`).join(" • ")}</span>`
      : "";
    return `
      <section class="advanced-graphs ${expanded ? "expanded" : "collapsed"}">
        <div class="advanced-graphs-header">
          <div class="advanced-graphs-copy">
            <strong>Advanced Graphs</strong>
            <span>${availabilityLabel}</span>
            ${unavailableLabel}
          </div>
          <button type="button" class="ghost-button advanced-graphs-toggle" data-advanced-toggle aria-expanded="${expanded}">
            ${expanded ? "Collapse" : "Expand"}
          </button>
        </div>
        ${expanded ? `<div class="advanced-graphs-stack">${availableSeries.map((series) => renderSeriesCard(series, graphPoints, comparisonGraphPoints, state, "advanced")).join("")}</div>` : ""}
      </section>
    `;
  }

  function renderSeriesCard(series, graphPoints, comparisonGraphPoints, state, tone = "core") {
    const header = `
      <div class="graph-card-header">
        <div>
          <strong>${series.label}</strong>
          <span>${series.unit}</span>
        </div>
        <span class="graph-axis-label">Distance axis</span>
      </div>
    `;

    if (!state.data) {
      return `
        <section class="graph-panel ${series.id} ${tone}">
          ${header}
          <div class="graph-empty">Select a valid lap to view ${series.label.toLowerCase()}.</div>
        </section>
      `;
    }

    if (!graphPoints.length) {
      return `
        <section class="graph-panel ${series.id} ${tone}">
          ${header}
          <div class="graph-empty">Distance-based graph data is unavailable for this lap.</div>
        </section>
      `;
    }

    const samples = graphPoints.filter((point) => Number.isFinite(point[series.key]));
    state.pointsBySeries.set(series.id, samples);
    if (!samples.length) {
      return `
        <section class="graph-panel ${series.id} ${tone}">
          ${header}
          <div class="graph-empty">${series.label} unavailable</div>
        </section>
      `;
    }

    const comparisonSamples = comparisonGraphPoints.filter((point) => Number.isFinite(point[series.key]));
    const chart = buildChart(
      series,
      samples,
      comparisonSamples,
      graphPoints,
      state.interaction.activeDistanceM,
    );
    const comparisonLegend = chart.secondaryLinePath
      ? '<span class="graph-comparison-note">Best lap overlay</span>'
      : "";

    return `
      <section class="graph-panel ${series.id} ${tone}">
        ${header}
        <div class="graph-meta">
          <span>${escapeText(chart.rangeLabel)}</span>
          <span>${escapeText(chart.distanceLabel)}</span>
        </div>
        ${comparisonLegend}
        <svg class="telemetry-chart" data-series="${series.id}" viewBox="0 0 640 144" preserveAspectRatio="none" aria-label="${series.label} graph">
          ${renderGrid(chart)}
          ${chart.secondaryFillPath ? `<path class="graph-line graph-line-secondary-fill" d="${chart.secondaryFillPath}" fill="${COLORS.comparisonFill}"></path>` : ""}
          <path class="graph-fill" d="${chart.fillPath}" fill="${chart.fillColor}"></path>
          ${chart.secondaryLinePath ? `<path class="graph-line graph-line-secondary" d="${chart.secondaryLinePath}" stroke="${COLORS.comparison}"></path>` : ""}
          <path class="graph-line" d="${chart.linePath}" stroke="${series.color}"></path>
          ${renderCursor(chart)}
          ${renderAxisLabels(chart)}
        </svg>
      </section>
    `;
  }

  function buildChart(series, samples, comparisonSamples, graphPoints, activeDistanceM) {
    const width = 640;
    const height = 144;
    const padding = { top: 10, right: 12, bottom: 22, left: 12 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const maxDistance = Math.max(...graphPoints.map((point) => point.distanceM || 0), 0);
    const distanceSafe = maxDistance > 0 ? maxDistance : 1;

    const domainSamples = comparisonSamples.length ? samples.concat(comparisonSamples) : samples;
    let minValue = Math.min(...domainSamples.map((point) => point[series.key]));
    let maxValue = Math.max(...domainSamples.map((point) => point[series.key]));
    if (series.fixedRange) {
      [minValue, maxValue] = series.fixedRange;
    } else if (minValue === maxValue) {
      minValue -= 1;
      maxValue += 1;
    } else {
      const paddingValue = (maxValue - minValue) * 0.12;
      minValue = Math.max(0, minValue - paddingValue);
      maxValue += paddingValue;
    }

    const scaleX = (distanceM) => padding.left + (distanceM / distanceSafe) * innerWidth;
    const scaleY = (value) => {
      const ratio = (value - minValue) / Math.max(maxValue - minValue, 0.0001);
      return padding.top + innerHeight - ratio * innerHeight;
    };

    const points = samples.map((point) => ({
      sample: point,
      x: scaleX(point.distanceM || 0),
      y: scaleY(point[series.key]),
    }));
    const comparisonPoints = comparisonSamples.map((point) => ({
      sample: point,
      x: scaleX(point.distanceM || 0),
      y: scaleY(point[series.key]),
    }));
    const linePath = buildPath(points, series.renderMode || "line");
    const secondaryLinePath = comparisonPoints.length ? buildPath(comparisonPoints, series.renderMode || "line") : "";
    const baselineY = height - padding.bottom;
    const fillPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
    const secondaryFillPath = comparisonPoints.length
      ? `${secondaryLinePath} L ${comparisonPoints[comparisonPoints.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${comparisonPoints[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : "";
    const activeSample = Number.isFinite(activeDistanceM) ? findNearestByDistance(samples, activeDistanceM) : null;
    const activeComparisonSample = Number.isFinite(activeDistanceM)
      ? findNearestByDistance(comparisonSamples, activeDistanceM)
      : null;
    const activeCursor = activeSample
      ? { x: scaleX(activeSample.distanceM), y: scaleY(activeSample[series.key]), value: activeSample[series.key] }
      : null;
    const comparisonCursor = activeComparisonSample
      ? { x: scaleX(activeComparisonSample.distanceM), y: scaleY(activeComparisonSample[series.key]), value: activeComparisonSample[series.key] }
      : null;

    return {
      width,
      height,
      padding,
      linePath,
      secondaryLinePath,
      fillPath,
      secondaryFillPath,
      fillColor: `${series.color}22`,
      rangeLabel: `${formatAxisValue(series, minValue)} to ${formatAxisValue(series, maxValue)}`,
      distanceLabel: `0m to ${Math.round(maxDistance)}m`,
      labels: [
        { x: padding.left, y: height - 6, text: "0m", anchor: "start" },
        { x: width - padding.right, y: height - 6, text: `${Math.round(maxDistance)}m`, anchor: "end" },
        { x: padding.left, y: padding.top + 10, text: formatAxisValue(series, maxValue), anchor: "start" },
        { x: padding.left, y: baselineY + 12, text: formatAxisValue(series, minValue), anchor: "start" },
      ],
      gridLines: [0.25, 0.5, 0.75].map((ratio) => padding.top + innerHeight * ratio),
      baselineY,
      activeCursor,
      comparisonCursor,
    };
  }

  function buildPath(points, renderMode) {
    if (!points.length) return "";
    if (renderMode === "step") {
      const commands = [];
      points.forEach((point, index) => {
        if (index === 0) {
          commands.push(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
          return;
        }
        const previous = points[index - 1];
        commands.push(`L ${point.x.toFixed(2)} ${previous.y.toFixed(2)}`);
        commands.push(`L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
      });
      return commands.join(" ");
    }
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");
  }

  function renderGrid(chart) {
    const horizontal = chart.gridLines
      .map(
        (y) =>
          `<line x1="${chart.padding.left}" y1="${y.toFixed(2)}" x2="${(chart.width - chart.padding.right).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${COLORS.grid}" stroke-width="1"></line>`,
      )
      .join("");
    return `
      <line x1="${chart.padding.left}" y1="${chart.baselineY}" x2="${chart.width - chart.padding.right}" y2="${chart.baselineY}" stroke="${COLORS.axis}" stroke-width="1"></line>
      ${horizontal}
    `;
  }

  function renderCursor(chart) {
    if (!chart.activeCursor) {
      return chart.comparisonCursor ? renderComparisonCursor(chart.comparisonCursor) : "";
    }
    return `
      <line x1="${chart.activeCursor.x.toFixed(2)}" y1="${chart.padding.top}" x2="${chart.activeCursor.x.toFixed(2)}" y2="${chart.baselineY}" stroke="${COLORS.cursorGlow}" stroke-width="7"></line>
      <line x1="${chart.activeCursor.x.toFixed(2)}" y1="${chart.padding.top}" x2="${chart.activeCursor.x.toFixed(2)}" y2="${chart.baselineY}" stroke="${COLORS.cursor}" stroke-width="2"></line>
      <circle cx="${chart.activeCursor.x.toFixed(2)}" cy="${chart.activeCursor.y.toFixed(2)}" r="6" fill="${COLORS.cursor}"></circle>
      <circle cx="${chart.activeCursor.x.toFixed(2)}" cy="${chart.activeCursor.y.toFixed(2)}" r="2.6" fill="${COLORS.cursorCore}"></circle>
      ${chart.comparisonCursor ? renderComparisonCursor(chart.comparisonCursor) : ""}
    `;
  }

  function renderComparisonCursor(cursor) {
    return `
      <circle cx="${cursor.x.toFixed(2)}" cy="${cursor.y.toFixed(2)}" r="4.8" fill="rgba(243, 246, 248, 0.16)"></circle>
      <circle cx="${cursor.x.toFixed(2)}" cy="${cursor.y.toFixed(2)}" r="2.8" fill="${COLORS.cursorCore}"></circle>
      <circle cx="${cursor.x.toFixed(2)}" cy="${cursor.y.toFixed(2)}" r="4.8" fill="none" stroke="rgba(243, 246, 248, 0.84)" stroke-width="1.5"></circle>
    `;
  }

  function renderAxisLabels(chart) {
    return chart.labels
      .map(
        (label) =>
          `<text x="${label.x}" y="${label.y}" fill="${COLORS.muted}" font-size="10" text-anchor="${label.anchor}">${escapeText(label.text)}</text>`,
      )
      .join("");
  }

  function getGraphPoints(data) {
    if (!data) return [];
    if (Array.isArray(data.graphPoints) && data.graphPoints.length) {
      return normalizeGraphPoints(data.graphPoints);
    }
    return buildGraphPointsFromLegacyGraphs(data.graphs);
  }

  function getComparisonGraphPoints(data) {
    if (!data?.comparisonEnabled) {
      return [];
    }
    const comparison = data.comparison;
    if (!comparison || comparison.status !== "available" || !comparison.bestLap) {
      return [];
    }
    if (Array.isArray(comparison.bestLap.graphPoints) && comparison.bestLap.graphPoints.length) {
      return normalizeGraphPoints(comparison.bestLap.graphPoints);
    }
    return [];
  }

  function buildGraphPointsFromLegacyGraphs(graphs) {
    if (!graphs || !Array.isArray(graphs.distance)) {
      return [];
    }
    return normalizeGraphPoints(
      graphs.distance.map((distanceM, index) => ({
        distanceM,
        speedKph: Array.isArray(graphs.speedKph) ? graphs.speedKph[index] : undefined,
        brake01: Array.isArray(graphs.brake01) ? graphs.brake01[index] : undefined,
        throttle01: Array.isArray(graphs.throttle01) ? graphs.throttle01[index] : undefined,
      })),
    );
  }

  function normalizeGraphPoints(points) {
    return points
      .map((point) => ({
        distanceM: finiteNumber(point.distanceM),
        speedKph: finiteNumber(point.speedKph),
        brake01: finiteNumber(point.brake01),
        throttle01: finiteNumber(point.throttle01),
        steering01: finiteNumber(point.steering01),
        gear: finiteInteger(point.gear),
        rpm: finiteNumber(point.rpm),
      }))
      .filter((point) => Number.isFinite(point.distanceM))
      .sort((left, right) => left.distanceM - right.distanceM);
  }

  function getAdvancedAvailability(graphPoints) {
    const availableSeries = [];
    const unavailableSeries = [];
    ADVANCED_SERIES.forEach((series) => {
      if (graphPoints.some((point) => Number.isFinite(point[series.key]))) {
        availableSeries.push(series);
      } else {
        unavailableSeries.push(series);
      }
    });
    return { availableSeries, unavailableSeries };
  }

  function findNearestByDistance(points, distanceM) {
    if (!points.length || !Number.isFinite(distanceM)) {
      return null;
    }
    let nearest = null;
    let bestDelta = Infinity;
    for (const point of points) {
      const delta = Math.abs(point.distanceM - distanceM);
      if (delta < bestDelta) {
        bestDelta = delta;
        nearest = point;
      }
    }
    return nearest;
  }

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  function finiteInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : undefined;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatAxisValue(series, value) {
    if (series.key === "speedKph") {
      return `${Math.round(value)} km/h`;
    }
    if (series.key === "gear") {
      return `G${Math.round(value)}`;
    }
    if (series.key === "rpm") {
      return `${Math.round(value)} rpm`;
    }
    return `${Math.round(value * 100)}%`;
  }

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  global.BrakepointTelemetryGraphs = {
    createTelemetryGraphs,
    normalizeGraphPoints,
    buildGraphPointsFromLegacyGraphs,
  };
})(window);
