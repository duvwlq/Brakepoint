"use strict";

(function attachRacingLineCanvas(global) {
  const COLORS = {
    background: "#F9FBFD",
    baseStrong: "#1FC9C2",
    baseGlow: "rgba(31, 201, 194, 0.1)",
    brake: "#E5484D",
    primary: "#3182F6",
    lowConfidence: "#8B95A1",
    throttle: "rgba(59, 130, 246, 0.22)",
    subtleGrid: "rgba(25, 31, 40, 0.05)",
  };

  function createRacingLineCanvas(container, options = {}) {
    container.innerHTML = `
      <canvas class="racing-canvas"></canvas>
      <div class="canvas-tooltip hidden"></div>
      <div class="canvas-fallback hidden"></div>
      <div class="canvas-mode-badge hidden"></div>
      <div class="canvas-context hidden"></div>
      <div class="canvas-controls hidden">
        <button type="button" class="canvas-control-button" data-action="fit">Fit</button>
        <button type="button" class="canvas-control-button" data-action="reset">Reset</button>
        <span class="canvas-zoom-readout">100%</span>
      </div>
      <div class="canvas-legend">
        <span><i class="legend-base"></i>Actual lap line</span>
        <span class="legend-best hidden"><i class="legend-best-line"></i>Best lap</span>
        <span><i class="legend-brake"></i>Brake tick</span>
        <span><i class="legend-throttle"></i>Throttle marker</span>
        <span><i class="legend-start"></i>Start</span>
      </div>
    `;

    const canvas = container.querySelector("canvas");
    const tooltip = container.querySelector(".canvas-tooltip");
    const fallback = container.querySelector(".canvas-fallback");
    const modeBadge = container.querySelector(".canvas-mode-badge");
    const context = container.querySelector(".canvas-context");
    const controls = container.querySelector(".canvas-controls");
    const zoomReadout = container.querySelector(".canvas-zoom-readout");
    const bestLegend = container.querySelector(".legend-best");
    const state = {
      data: null,
      interaction: { activeDistanceM: null, activeSource: null, activePoint: null },
      projectedPoints: [],
      projectedBestPoints: [],
      bounds: null,
      baseTransform: null,
      initialBaseTransform: null,
      padding: options.padding || 22,
      onHoverDistance: options.onHoverDistance,
      onClearHover: options.onClearHover,
      viewport: createViewportState(),
      drag: {
        active: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0,
      },
    };

    controls.addEventListener("click", handleControlClick);

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }

    function setData(data) {
      const didChange = state.data !== data;
      state.data = data;
      if (didChange) {
        resetViewport();
      }
      render();
    }

    function setInteraction(interaction) {
      state.interaction = interaction || { activeDistanceM: null, activeSource: null, activePoint: null };
      render();
    }

    function render() {
      const ctx = canvas.getContext("2d");
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
      drawBackground(ctx, width, height);

      fallback.classList.add("hidden");
      tooltip.classList.add("hidden");
      modeBadge.classList.add("hidden");
      context.classList.add("hidden");
      controls.classList.add("hidden");
      container.classList.remove("is-pannable", "is-panning");

      const data = state.data;
      if (!data) {
        state.projectedBestPoints = [];
        bestLegend.classList.add("hidden");
        updateControls();
        drawEmpty(ctx, width, height, "Select a valid lap to view the racing line.");
        return;
      }

      if (data.mode !== "real-racing-line" || !Array.isArray(data.racingLine) || data.racingLine.length === 0) {
        resetViewport();
        state.projectedBestPoints = [];
        bestLegend.classList.add("hidden");
        updateControls();
        fallback.classList.remove("hidden");
        fallback.innerHTML = `
          <strong>Coordinate Data Missing</strong>
          <span>Coordinate data is missing. Showing distance-based graphs only.</span>
          <span>Brakepoint does not draw a fake track surface when coordinates are unavailable.</span>
        `;
        drawEmpty(ctx, width, height, "No racing line coordinates");
        return;
      }

      const points = normalizePoints(data.racingLine);
      const bestPoints = getBestLapPoints(data);
      const bounds = computeBounds(points.concat(bestPoints));
      if (!bounds) {
        state.projectedBestPoints = [];
        bestLegend.classList.add("hidden");
        updateControls();
        drawEmpty(ctx, width, height, "Unable to compute racing line bounds.");
        return;
      }

      applyFitTransform(bounds, width, height);
      container.classList.add("is-pannable");
      if (state.drag.active) {
        container.classList.add("is-panning");
      }
      state.projectedPoints = points.map((point) => ({
        ...point,
        screen: projectPoint(point, state.baseTransform, state.viewport),
      }));
      state.projectedBestPoints = bestPoints.map((point) => ({
        ...point,
        screen: projectPoint(point, state.baseTransform, state.viewport),
      }));
      bestLegend.classList.toggle("hidden", !state.projectedBestPoints.length);

      updateBadge(modeBadge, data);
      updateContext(context, data, state.projectedPoints);
      updateControls();
      drawDistanceMarkers(ctx, state.projectedPoints);
      drawBestLapOverlay(ctx, state.projectedBestPoints);
      drawRacingLine(ctx, state.projectedPoints, data.coordinateStatus);
      drawDirectionMarkers(ctx, state.projectedPoints);
      drawStartEndMarkers(ctx, state.projectedPoints);

      const activeBestPoint = findNearestByDistance(state.projectedBestPoints, state.interaction.activeDistanceM);
      if (activeBestPoint) {
        drawBestLapHover(ctx, activeBestPoint);
      }
      const activeRenderedPoint = findNearestByDistance(state.projectedPoints, state.interaction.activeDistanceM);
      if (activeRenderedPoint) {
        drawHover(ctx, activeRenderedPoint);
        positionTooltip(
          tooltip,
          activeRenderedPoint,
          state.interaction.activePoint || activeRenderedPoint,
          width,
          height,
        );
      }
    }

    function handleControlClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }
      const action = button.dataset.action;
      if (action === "fit") {
        fitViewport();
      } else if (action === "reset") {
        resetViewportToFit();
      }
    }

    function handleMove(event) {
      if (!state.projectedPoints.length || typeof state.onHoverDistance !== "function") {
        return;
      }
      if (state.drag.active) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const nearest = findNearestPoint(state.projectedPoints, mouseX, mouseY);
      if (nearest) {
        state.onHoverDistance(nearest.distanceM, "canvas");
      }
    }

    function handleWheel(event) {
      if (!state.projectedPoints.length) {
        return;
      }
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomViewportAt(mouseX, mouseY, factor);
    }

    function handlePointerDown(event) {
      if (!state.projectedPoints.length || event.button !== 0) {
        return;
      }
      state.drag.active = true;
      state.drag.pointerId = event.pointerId;
      state.drag.startX = event.clientX;
      state.drag.startY = event.clientY;
      state.drag.startOffsetX = state.viewport.offsetX;
      state.drag.startOffsetY = state.viewport.offsetY;
      state.viewport.isUserAdjusted = true;
      container.classList.add("is-panning");
      canvas.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!state.drag.active || state.drag.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - state.drag.startX;
      const deltaY = event.clientY - state.drag.startY;
      state.viewport.offsetX = state.drag.startOffsetX + deltaX;
      state.viewport.offsetY = state.drag.startOffsetY + deltaY;
      render();
    }

    function handlePointerUp(event) {
      if (!state.drag.active || state.drag.pointerId !== event.pointerId) {
        return;
      }
      state.drag.active = false;
      state.drag.pointerId = null;
      container.classList.remove("is-panning");
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      handleMove(event);
    }

    function handleLeave() {
      if (state.drag.active) {
        return;
      }
      if (typeof state.onClearHover === "function") {
        state.onClearHover("canvas");
      }
    }

    function applyFitTransform(bounds, width, height) {
      state.bounds = bounds;
      state.baseTransform = createTransform(bounds, width, height, state.padding);
      if (!state.initialBaseTransform || !state.viewport.isUserAdjusted) {
        state.initialBaseTransform = cloneTransform(state.baseTransform);
      }
    }

    function fitViewport() {
      if (!state.bounds) {
        return;
      }
      state.baseTransform = createTransform(state.bounds, canvas.clientWidth, canvas.clientHeight, state.padding);
      state.initialBaseTransform = cloneTransform(state.baseTransform);
      state.viewport = createViewportState();
      render();
    }

    function resetViewportToFit() {
      if (state.initialBaseTransform) {
        state.baseTransform = cloneTransform(state.initialBaseTransform);
      }
      resetViewport();
      render();
    }

    function resetViewport() {
      state.viewport = createViewportState();
      state.drag.active = false;
      state.drag.pointerId = null;
    }

    function zoomViewportAt(mouseX, mouseY, factor) {
      const nextScale = clamp(state.viewport.scale * factor, 0.65, 5);
      if (Math.abs(nextScale - state.viewport.scale) < 0.001) {
        return;
      }
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const localX = mouseX - centerX;
      const localY = mouseY - centerY;
      const ratio = nextScale / state.viewport.scale;
      state.viewport.offsetX = localX - (localX - state.viewport.offsetX) * ratio;
      state.viewport.offsetY = localY - (localY - state.viewport.offsetY) * ratio;
      state.viewport.scale = nextScale;
      state.viewport.isUserAdjusted = true;
      render();
    }

    function updateControls() {
      const visible = Boolean(state.projectedPoints.length && state.data?.mode === "real-racing-line");
      controls.classList.toggle("hidden", !visible);
      if (!visible) {
        return;
      }
      zoomReadout.textContent = `${Math.round(state.viewport.scale * 100)}%`;
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("lostpointercapture", handlePointerUp);
    canvas.addEventListener("mouseleave", handleLeave);
    window.addEventListener("resize", resize);
    resize();

    return {
      setData,
      setInteraction,
      render,
      resize,
    };
  }

  function normalizePoints(points) {
    return points
      .map((point) => ({
        distanceM: numberOr(point.distanceM, point.distance),
        x: numberOr(point.x),
        y: numberOr(point.y),
        speedKph: numberOr(point.speedKph),
        brake01: numberOr(point.brake01, point.brake),
        throttle01: numberOr(point.throttle01, point.throttle),
      }))
      .filter((point) => Number.isFinite(point.distanceM) && Number.isFinite(point.x) && Number.isFinite(point.y));
  }

  function numberOr(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  function computeBounds(points) {
    if (!points.length) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return null;
    return { minX, maxX, minY, maxY, width, height };
  }

  function createTransform(bounds, canvasWidth, canvasHeight, padding) {
    const drawableWidth = Math.max(1, canvasWidth - padding * 2);
    const drawableHeight = Math.max(1, canvasHeight - padding * 2);
    const scale = Math.min(drawableWidth / bounds.width, drawableHeight / bounds.height);
    const usedWidth = bounds.width * scale;
    const usedHeight = bounds.height * scale;
    return {
      bounds,
      scale,
      offsetX: padding + (drawableWidth - usedWidth) / 2,
      offsetY: padding + (drawableHeight - usedHeight) / 2,
      canvasWidth,
      canvasHeight,
    };
  }

  function projectPoint(point, transform, viewport = createViewportState()) {
    const basePoint = {
      x: transform.offsetX + (point.x - transform.bounds.minX) * transform.scale,
      y: transform.canvasHeight - transform.offsetY - (point.y - transform.bounds.minY) * transform.scale,
    };
    return applyViewport(basePoint, transform, viewport);
  }

  function applyViewport(basePoint, transform, viewport) {
    const centerX = transform.canvasWidth / 2;
    const centerY = transform.canvasHeight / 2;
    return {
      x: centerX + (basePoint.x - centerX) * viewport.scale + viewport.offsetX,
      y: centerY + (basePoint.y - centerY) * viewport.scale + viewport.offsetY,
    };
  }

  function drawBackground(ctx, width, height) {
    const gradient = ctx.createRadialGradient(width * 0.52, height * 0.44, 12, width * 0.52, height * 0.44, width * 0.78);
    gradient.addColorStop(0, "rgba(31, 201, 194, 0.06)");
    gradient.addColorStop(0.55, "rgba(49, 130, 246, 0.05)");
    gradient.addColorStop(1, "rgba(247, 248, 250, 0)");
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = COLORS.subtleGrid;
    ctx.lineWidth = 1;
    for (let x = 54; x < width; x += 88) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 42; y < height; y += 76) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawEmpty(ctx, width, height, message) {
    ctx.save();
    ctx.fillStyle = "rgba(107, 114, 128, 0.72)";
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(message, width / 2, height / 2);
    ctx.restore();
  }

  function drawRacingLine(ctx, points, coordinateStatus) {
    if (points.length < 2) return;
    const lowConfidence =
      coordinateStatus && ["low", "none"].includes(String(coordinateStatus.confidence || "").toLowerCase());

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (lowConfidence) {
      ctx.beginPath();
      ctx.moveTo(points[0].screen.x, points[0].screen.y);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].screen.x, points[i].screen.y);
      }
      ctx.strokeStyle = "rgba(139, 149, 161, 0.94)";
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
      return;
    }

    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      const throttle = Math.max(previous.throttle01 || 0, current.throttle01 || 0);
      if (throttle < 0.24) continue;
      ctx.beginPath();
      ctx.moveTo(previous.screen.x, previous.screen.y);
      ctx.lineTo(current.screen.x, current.screen.y);
      ctx.strokeStyle = `rgba(59, 130, 246, ${Math.min(0.06 + throttle * 0.12, 0.16)})`;
      ctx.lineWidth = 2.8 + throttle * 1.1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(points[0].screen.x, points[0].screen.y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].screen.x, points[i].screen.y);
    }
    ctx.strokeStyle = COLORS.baseGlow;
    ctx.lineWidth = 3.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[0].screen.x, points[0].screen.y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].screen.x, points[i].screen.y);
    }
    ctx.strokeStyle = COLORS.baseStrong;
    ctx.lineWidth = 3.05;
    ctx.stroke();

    let lastBrakeTickDistance = -Infinity;
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      const brake = Math.max(previous.brake01 || 0, current.brake01 || 0);
      if (brake < 0.12 || current.distanceM - lastBrakeTickDistance < 45) continue;
      drawBrakeTick(ctx, previous, current, brake);
      lastBrakeTickDistance = current.distanceM;
    }

    ctx.restore();
  }

  function drawBestLapOverlay(ctx, points) {
    if (points.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(points[0].screen.x, points[0].screen.y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].screen.x, points[i].screen.y);
    }
    ctx.strokeStyle = "rgba(25, 31, 40, 0.36)";
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < points.length; i += Math.max(10, Math.floor(points.length / 42))) {
      const point = points[i];
      ctx.beginPath();
      ctx.arc(point.screen.x, point.screen.y, 1.75, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(25, 31, 40, 0.4)";
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBrakeTick(ctx, a, b, intensity) {
    const dx = b.screen.x - a.screen.x;
    const dy = b.screen.y - a.screen.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return;
    const nx = -dy / length;
    const ny = dx / length;
    const midX = (a.screen.x + b.screen.x) * 0.5;
    const midY = (a.screen.y + b.screen.y) * 0.5;
    const tick = 4 + intensity * 7;
    ctx.beginPath();
    ctx.moveTo(midX - nx * tick * 0.5, midY - ny * tick * 0.5);
    ctx.lineTo(midX + nx * tick, midY + ny * tick);
    ctx.strokeStyle = `rgba(229, 72, 77, ${Math.min(0.45 + intensity * 0.45, 0.92)})`;
    ctx.lineWidth = 1.5 + intensity * 1.2;
    ctx.stroke();
  }

  function drawStartEndMarkers(ctx, points) {
    const start = points[0];
    const end = points[points.length - 1];
    ctx.save();

    ctx.beginPath();
    ctx.arc(start.screen.x, start.screen.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.baseStrong;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.stroke();

    ctx.fillStyle = "rgba(25, 31, 40, 0.82)";
    ctx.font = "11px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("START", start.screen.x + 10, start.screen.y - 10);

    ctx.beginPath();
    ctx.arc(end.screen.x, end.screen.y, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(end.screen.x, end.screen.y, 8.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(25, 31, 40, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawDirectionMarkers(ctx, points) {
    if (points.length < 6) return;
    const anchors = [0.24, 0.54, 0.82].map((ratio) =>
      Math.min(points.length - 3, Math.max(2, Math.floor(points.length * ratio))),
    );
    ctx.save();
    for (const index of anchors) {
      drawDirectionArrow(ctx, points[index - 1].screen, points[index].screen, points[index + 1].screen);
    }
    ctx.restore();
  }

  function drawDirectionArrow(ctx, a, b, c) {
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.001) return;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const tipX = b.x + ux * 7;
    const tipY = b.y + uy * 7;
    const leftX = b.x - ux * 4 + nx * 4;
    const leftY = b.y - uy * 4 + ny * 4;
    const rightX = b.x - ux * 4 - nx * 4;
    const rightY = b.y - uy * 4 - ny * 4;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
      ctx.fillStyle = "rgba(139, 149, 161, 0.8)";
    ctx.fill();
  }

  function drawDistanceMarkers(ctx, points) {
    if (points.length < 2) return;
    const maxDistance = points[points.length - 1].distanceM || 0;
    const step = maxDistance > 5500 ? 1000 : 500;
    if (step <= 0) return;
    ctx.save();
    let nextMark = step;
    let lastLabelX = -Infinity;
    for (let i = 1; i < points.length && nextMark < maxDistance; i += 1) {
      const point = points[i];
      if (point.distanceM < nextMark) continue;
      if (point.screen.x - lastLabelX < 44) {
        nextMark += step;
        continue;
      }
      ctx.beginPath();
      ctx.arc(point.screen.x, point.screen.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(107, 114, 128, 0.5)";
      ctx.fill();
      ctx.fillStyle = "rgba(25, 31, 40, 0.72)";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${Math.round(nextMark)}m`, point.screen.x, point.screen.y - 10);
      lastLabelX = point.screen.x;
      nextMark += step;
    }
    ctx.restore();
  }

  function findNearestPoint(points, x, y) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const point of points) {
      const dx = point.screen.x - x;
      const dy = point.screen.y - y;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = point;
      }
    }
    return nearest;
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

  function drawHover(ctx, point) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.screen.x, point.screen.y, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
    ctx.shadowColor = "rgba(49, 130, 246, 0.22)";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.primary;
    ctx.stroke();
    ctx.restore();
  }

  function drawBestLapHover(ctx, point) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.screen.x, point.screen.y, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(49, 130, 246, 0.1)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(25, 31, 40, 0.38)";
    ctx.stroke();
    ctx.restore();
  }

  function getBestLapPoints(data) {
    if (!data?.comparisonEnabled) {
      return [];
    }
    const comparison = data.comparison;
    if (!comparison || comparison.status !== "available" || !comparison.bestLap) {
      return [];
    }
    if (comparison.bestLap.mode !== "real-racing-line") {
      return [];
    }
    if (!Array.isArray(comparison.bestLap.racingLine)) {
      return [];
    }
    return normalizePoints(comparison.bestLap.racingLine);
  }

  function positionTooltip(tooltip, screenPoint, telemetryPoint, width, height) {
    tooltip.classList.remove("hidden");
    tooltip.innerHTML = `
      <strong>${formatMeters(telemetryPoint.distanceM)}</strong>
      <span>${formatSpeed(telemetryPoint.speedKph)}</span>
      <span>Brake ${formatPercent(telemetryPoint.brake01)}</span>
      <span>Throttle ${formatPercent(telemetryPoint.throttle01)}</span>
    `;
    const x = Math.min(width - 172, Math.max(12, screenPoint.screen.x + 14));
    const y = Math.min(height - 104, Math.max(12, screenPoint.screen.y - 52));
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  }

  function updateBadge(element, data) {
    const confidence = String(data.coordinateStatus?.confidence || "none").toLowerCase();
    const tone = confidence === "low" || confidence === "none" ? "warning" : "primary";
    element.className = `canvas-mode-badge ${tone}`;
    element.innerHTML = `
      <strong>${formatModeLabel(data.mode, confidence)}</strong>
      <span>${escapeText(formatCoordinateLabel(data.coordinateStatus))}</span>
    `;
    element.classList.remove("hidden");
  }

  function updateContext(element, data, points) {
    const totalDistance = points.length ? points[points.length - 1].distanceM : 0;
    element.innerHTML = `
      <span>${Math.round(totalDistance || 0)} m</span>
      <span>${escapeText(formatUnitLabel(data.coordinateStatus?.coordinateUnit || "unknown"))}</span>
      <span>${escapeText(data.coordinateStatus?.confidence || "none")} confidence</span>
    `;
    element.classList.remove("hidden");
  }

  function formatModeLabel(mode, confidence) {
    if (mode === "distance-graph-only") return "Distance Graph Only";
    if (confidence === "low") return "Approximate Lap Line";
    return "Actual Lap Line";
  }

  function formatCoordinateLabel(coordinateStatus) {
    if (coordinateStatus?.source === "gps-lat-lon") {
      return `Telemetry Coordinates · ${formatUnitLabel(coordinateStatus?.coordinateUnit || "projected-meter")}`;
    }
    return "Telemetry Coordinates Unavailable";
  }

  function formatUnitLabel(unit) {
    if (unit === "projected-meter") {
      return "GPS Projected / Projected Meter";
    }
    return unit || "unknown";
  }

  function formatMeters(value) {
    return `${Math.round(value || 0)} m`;
  }

  function formatSpeed(value) {
    return Number.isFinite(value) ? `${Math.round(value)} km/h` : "-";
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "-";
  }

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createViewportState() {
    return {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      isUserAdjusted: false,
    };
  }

  function cloneTransform(transform) {
    return transform ? { ...transform, bounds: { ...transform.bounds } } : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  global.BrakepointCanvas = {
    createRacingLineCanvas,
    computeBounds,
    createTransform,
    projectPoint,
    findNearestPoint,
  };
})(window);
