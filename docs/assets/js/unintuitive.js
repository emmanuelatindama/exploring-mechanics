// Interactive widgets for docs/09-unintuitive-problems/index.html.
// Drop-in replacement: preserves all existing element IDs; curve widgets now
// auto-fit their SVG viewBox so nothing is clipped.
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const G = 9.8;

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    return el;
  }
  function clientToSvg(svg, evt) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { x: (evt.clientX - rect.left) * (vb.width / rect.width) + vb.x,
             y: (evt.clientY - rect.top) * (vb.height / rect.height) + vb.y };
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Fit a set of point-arrays (physics coords) into an SVG's viewBox with padding.
  function fitMap(svg, ptsArrays, pad) {
    const vb = svg.viewBox.baseVal;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    ptsArrays.forEach((a) => a.forEach((p) => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }));
    const w = vb.width - 2 * pad, h = vb.height - 2 * pad;
    const s = Math.min(w / Math.max(maxX - minX, 1e-6), h / Math.max(maxY - minY, 1e-6));
    const offX = vb.x + pad + (w - s * (maxX - minX)) / 2 - s * minX;
    const offY = vb.y + pad + (h - s * (maxY - minY)) / 2 - s * minY;
    return { toX: (x) => offX + s * x, toY: (y) => offY + s * y, s };
  }

  // Injected control row (speed / friction sliders) placed after an anchor.
  function controlRow(anchor, id) {
    if (!anchor || document.getElementById(id)) return document.getElementById(id);
    const div = document.createElement("div");
    div.id = id; div.className = "uni-controls";
    anchor.insertAdjacentElement("afterend", div);
    return div;
  }

  /* ============ 1. DOUBLE CONE ROLLING UPHILL ============ */
  function initDoubleCone() {
    const riseSlider = document.getElementById("coneRiseSlider");
    const sinkSlider = document.getElementById("coneSinkSlider");
    const posSlider = document.getElementById("conePosSlider");
    if (!riseSlider) return;
    const riseVal = document.getElementById("coneRiseVal");
    const sinkVal = document.getElementById("coneSinkVal");
    const posVal = document.getElementById("conePosVal");
    const railRiseVal = document.getElementById("coneRailRiseVal");
    const cmHeightVal = document.getElementById("coneCmHeightVal");
    const verdict = document.getElementById("coneVerdict");
    const railTop = document.getElementById("coneRailTop");
    const railBot = document.getElementById("coneRailBot");
    const coneShape = document.getElementById("coneShape");
    const cmPlotPath = document.getElementById("coneCmPlotPath");
    const X0 = 20, X1 = 280, Y0 = 150;
    function render() {
      const r1 = +riseSlider.value / 100, r2 = +sinkSlider.value / 100, p = +posSlider.value / 100;
      riseVal.textContent = r1.toFixed(2);
      sinkVal.textContent = r2.toFixed(2);
      posVal.textContent = (p * 100).toFixed(0) + "%";
      const trackLen = X1 - X0, x = X0 + p * trackLen;
      const railRise = r1 * p * trackLen * 0.4, sink = r2 * p * trackLen * 0.4;
      railTop.setAttribute("points", `${X0},${Y0} ${X1},${Y0 - r1 * trackLen * 0.4}`);
      const sep0 = 10, sep1 = 10 + r2 * trackLen * 0.5;
      railBot.setAttribute("points", `${X0},${Y0 + sep0} ${X1},${Y0 - r1 * trackLen * 0.4 + sep1}`);
      coneShape.setAttribute("cx", x);
      coneShape.setAttribute("cy", Y0 - railRise + sink);
      let d = "";
      for (let i = 0; i <= 20; i++) {
        const pp = i / 20, xx = X0 + pp * trackLen;
        d += (i === 0 ? "M" : "L") + xx + " " + (Y0 - r1 * pp * trackLen * 0.4 + r2 * pp * trackLen * 0.4) + " ";
      }
      cmPlotPath.setAttribute("d", d);
      railRiseVal.textContent = (r1 * trackLen * 0.4 * p).toFixed(1) + " px of apparent climb";
      const netDrop = sink - railRise;
      cmHeightVal.textContent = (-netDrop).toFixed(1) + " px net height change";
      if (netDrop > 0) {
        verdict.textContent = "Net result: the true center of mass has actually DESCENDED, even though the cone looks like it climbed the rails.";
        verdict.className = "verdict-badge bad";
      } else {
        verdict.textContent = "With these rates the center of mass is still rising — increase the sink rate above the rise rate to reproduce the paradox.";
        verdict.className = "verdict-badge good";
      }
    }
    [riseSlider, sinkSlider, posSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 2. SPOOL / YO-YO PARADOX ============ */
  function initSpool() {
    const rSlider = document.getElementById("spoolRSlider");
    const thetaSlider = document.getElementById("spoolThetaSlider");
    if (!rSlider) return;
    const rVal = document.getElementById("spoolRVal");
    const thetaVal = document.getElementById("spoolThetaVal");
    const thetaCVal = document.getElementById("spoolThetaCVal");
    const armVal = document.getElementById("spoolArmVal");
    const dirVal = document.getElementById("spoolDirVal");
    const string = document.getElementById("spoolString");
    const arrow = document.getElementById("spoolArrow");
    const R = 60, cx = 150, cy = 100;
    function render() {
      const rRatio = +rSlider.value / 100, r = rRatio * R;
      const thetaDeg = +thetaSlider.value, theta = (thetaDeg * Math.PI) / 180;
      rVal.textContent = rRatio.toFixed(2) + " × R";
      thetaVal.textContent = thetaDeg + "°";
      thetaCVal.textContent = ((Math.acos(rRatio) * 180) / Math.PI).toFixed(1) + "°";
      const arm = R * Math.cos(theta) - r;
      armVal.textContent = arm.toFixed(1) + " (in units where R=" + R + ")";
      const Tx = cx - r * Math.sin(theta), Ty = cy + r * Math.cos(theta), pullLen = 90;
      string.setAttribute("x1", Tx); string.setAttribute("y1", Ty);
      string.setAttribute("x2", Tx + pullLen * Math.cos(theta));
      string.setAttribute("y2", Ty - pullLen * Math.sin(theta));
      arrow.setAttribute("cx", Tx + pullLen * Math.cos(theta));
      arrow.setAttribute("cy", Ty - pullLen * Math.sin(theta));
      if (Math.abs(arm) < 0.5) { dirVal.textContent = "Right at the critical angle — no net torque, spool just slides."; dirVal.className = "verdict-badge"; }
      else if (arm > 0) { dirVal.textContent = "Spool rolls AWAY from you, toward the pull (θ < θc)."; dirVal.className = "verdict-badge good"; }
      else { dirVal.textContent = "Spool rolls TOWARD you, against the pull direction (θ > θc)!"; dirVal.className = "verdict-badge bad"; }
    }
    [rSlider, thetaSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 3. ROLLING RACE ============ */
  function initRaceUnintuitive() {
    const angleSlider = document.getElementById("raceAngleSlider");
    const lenSlider = document.getElementById("raceLenSlider");
    const goBtn = document.getElementById("raceGoBtn");
    if (!angleSlider) return;
    const angleVal = document.getElementById("raceAngleVal");
    const lenVal = document.getElementById("raceLenVal");
    const resultsEl = document.getElementById("raceResults");
    const shapes = [
      { id: "hoop", name: "Hoop", beta: 1, x: 0 },
      { id: "cyl", name: "Solid Cylinder", beta: 0.5, x: 0 },
      { id: "sphereHollow", name: "Hollow Sphere", beta: 2 / 3, x: 0 },
      { id: "sphereSolid", name: "Solid Sphere", beta: 0.4, x: 0 },
    ];
    let running = false, simTime = 0, lastFrameTime = 0, finishTimes = {};
    const TRACK_PX = 260;
    function frame(now) {
      if (!running) return;
      simTime += Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      const angle = (+angleSlider.value * Math.PI) / 180, L = +lenSlider.value, a0 = G * Math.sin(angle);
      let allDone = true;
      shapes.forEach((s) => {
        if (finishTimes[s.id] !== undefined) return;
        const a = a0 / (1 + s.beta), dist = 0.5 * a * simTime * simTime;
        if (dist >= L) { finishTimes[s.id] = Math.sqrt((2 * L) / a); s.x = TRACK_PX; }
        else { s.x = (dist / L) * TRACK_PX; allDone = false; }
        const el = document.getElementById("raceShape-" + s.id);
        if (el) el.setAttribute("cx", 20 + s.x);
      });
      renderResults();
      if (allDone) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function renderResults() {
      let html = "<table>";
      shapes.slice().sort((a, b) => (finishTimes[a.id] || 99) - (finishTimes[b.id] || 99)).forEach((s) => {
        html += `<tr><td class="k">${s.name} (β=${s.beta.toFixed(2)})</td><td class="v">${finishTimes[s.id] !== undefined ? finishTimes[s.id].toFixed(2) + " s" : "racing…"}</td></tr>`;
      });
      resultsEl.innerHTML = html + "</table>";
    }
    function reset() {
      running = false; finishTimes = {}; simTime = 0;
      shapes.forEach((s) => { s.x = 0; const el = document.getElementById("raceShape-" + s.id); if (el) el.setAttribute("cx", 20); });
      renderResults();
    }
    goBtn.addEventListener("click", () => { reset(); running = true; lastFrameTime = performance.now(); requestAnimationFrame(frame); });
    angleSlider.addEventListener("input", () => { angleVal.textContent = angleSlider.value + "°"; reset(); });
    lenSlider.addEventListener("input", () => { lenVal.textContent = lenSlider.value + " m"; reset(); });
    angleVal.textContent = angleSlider.value + "°";
    lenVal.textContent = lenSlider.value + " m";
    reset();
  }

  /* ============ 4. FALLING SLINKY ============ */
  function initSlinky() {
    const dropBtn = document.getElementById("slinkyDropBtn");
    if (!dropBtn) return;
    const svg = document.getElementById("slinkySvg");
    const plotPath = document.getElementById("slinkyPlotPath");
    const topPlotPath = document.getElementById("slinkyTopPlotPath");
    const statusEl = document.getElementById("slinkyStatus");
    const N = 14, K = 900, M = 0.05, L0 = 4;
    let y = [], v = [], released = false, t = 0;
    const history = [];
    function setup() {
      y = new Array(N + 1); v = new Array(N + 1).fill(0); y[0] = 0;
      for (let i = 1; i <= N; i++) { y[i] = y[i - 1] + L0 + ((N - i + 1) * M * G / K) * 40; }
      released = false; t = 0; history.length = 0; draw();
      statusEl.textContent = "Slinky hangs in equilibrium — click Release.";
    }
    function step(dt) {
      let remaining = dt;
      while (remaining > 0) {
        const h = Math.min(0.0008, remaining);
        const a = new Array(N + 1).fill(G);
        for (let i = 0; i < N; i++) { const f = K * ((y[i + 1] - y[i]) - L0); a[i] += f / M; a[i + 1] -= f / M; }
        for (let i = 1; i <= N; i++) { v[i] += a[i] * h; y[i] += v[i] * h; }
        if (released) { v[0] += a[0] * h; y[0] += v[0] * h; }
        remaining -= h;
      }
      t += dt;
    }
    function draw() {
      const scale = 1.4, x0 = 150, yTop = 20;
      svg.querySelectorAll(".slinky-node").forEach((n) => n.remove());
      for (let i = 0; i <= N; i++) {
        svg.appendChild(svgEl("ellipse", { cx: x0, cy: yTop + y[i] * scale, rx: 26, ry: 3.5, class: "slinky-node", fill: "none",
          stroke: i === 0 ? "#eb6834" : (i === N ? "#e34948" : "var(--muted)"), "stroke-width": i === 0 || i === N ? 2.5 : 1.3 }));
      }
      history.push({ t, top: y[0], bottom: y[N] });
      if (history.length > 260) history.shift();
      const maxY = Math.max(1, ...history.map((h) => Math.max(h.top, h.bottom)));
      const maxT = Math.max(0.5, ...history.map((h) => h.t));
      let dTop = "", dBot = "";
      history.forEach((h, i) => {
        const px = 40 + (h.t / maxT) * 440;
        dTop += (i === 0 ? "M" : "L") + px + " " + (90 - (h.top / maxY) * 80) + " ";
        dBot += (i === 0 ? "M" : "L") + px + " " + (90 - (h.bottom / maxY) * 80) + " ";
      });
      topPlotPath.setAttribute("d", dTop); plotPath.setAttribute("d", dBot);
    }
    function frame(now, last) {
      if (!released) return;
      step(Math.min(0.03, Math.max(0, (now - last) / 1000)));
      draw();
      if (t < 1.2) requestAnimationFrame((n) => frame(n, now));
      else statusEl.textContent = "The bottom coil stayed almost still for a moment before the compression wave reached it and it began to fall.";
    }
    dropBtn.addEventListener("click", () => {
      setup(); released = true;
      statusEl.textContent = "Released — watch the bottom coil (red) vs. the top (orange).";
      requestAnimationFrame((n) => frame(n, performance.now()));
    });
    setup();
  }

  /* ============ 5. MOVABLE-PULLEY DISTANCE PUZZLE ============ */
  function initPulleyPuzzle() {
    const pullSlider = document.getElementById("puzzlePullSlider");
    if (!pullSlider) return;
    const pullVal = document.getElementById("puzzlePullVal");
    const riseVal = document.getElementById("puzzleRiseVal");
    const forceVal = document.getElementById("puzzleForceVal");
    const weightSlider = document.getElementById("puzzleWeightSlider");
    const weightVal = document.getElementById("puzzleWeightVal");
    const loadEl = document.getElementById("puzzleLoad");
    const ropeLeft = document.getElementById("puzzleRopeLeft");
    const ropeRight = document.getElementById("puzzleRopeRight");
    const pulleyEl = document.getElementById("puzzlePulley");
    const topY = 20, baseY = 180;
    function render() {
      const pull = +pullSlider.value, W = +weightSlider.value, rise = pull / 2;
      pullVal.textContent = pull.toFixed(2) + " m";
      weightVal.textContent = W.toFixed(0) + " N";
      riseVal.textContent = rise.toFixed(2) + " m";
      forceVal.textContent = (W / 2).toFixed(1) + " N";
      const loadY = clamp(baseY - rise * 60, topY + 40, baseY);
      pulleyEl.setAttribute("cy", loadY - 6);
      loadEl.setAttribute("y", loadY);
      ropeLeft.setAttribute("x1", 90); ropeLeft.setAttribute("y1", topY);
      ropeLeft.setAttribute("x2", 150); ropeLeft.setAttribute("y2", loadY - 6);
      ropeRight.setAttribute("x1", 210); ropeRight.setAttribute("y1", topY);
      ropeRight.setAttribute("x2", 150); ropeRight.setAttribute("y2", loadY - 6);
    }
    [pullSlider, weightSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 6. CHAIN FOUNTAIN ============ */
  function initChainFountain() {
    const vSlider = document.getElementById("fountainVSlider");
    if (!vSlider) return;
    const vVal = document.getElementById("fountainVVal");
    const heightVal = document.getElementById("fountainHeightVal");
    const naiveVal = document.getElementById("fountainNaiveVal");
    const extraVal = document.getElementById("fountainExtraVal");
    const arc = document.getElementById("fountainArc");
    function render() {
      const v = +vSlider.value, h = (v * v) / (2 * G);
      vVal.textContent = v.toFixed(1) + " m/s";
      heightVal.textContent = h.toFixed(2) + " m (upper-bound estimate, v²/2g)";
      naiveVal.textContent = "supports weight only — predicts no rise above the rim";
      extraVal.textContent = (v * v).toFixed(1) + " × (mass per length) — the widely-cited extra pile-reaction term";
      const rimY = 150, apexY = clamp(rimY - h * 70, 20, rimY);
      arc.setAttribute("d", `M40,${rimY} Q150,${apexY} 260,${rimY}`);
    }
    vSlider.addEventListener("input", render);
    render();
  }

  /* ---- time table for a bead sliding on a curve, with optional friction ----
     points: {x,y} in metres, y = drop below the release point (positive down),
     x = horizontal position. With kinetic friction coefficient mu, energy gives
     v = sqrt( 2 g (dropFromStart - mu * horizontalTravel) ), stalling if <= 0. */
  function buildTimeTable(points, mu) {
    mu = mu || 0;
    const x0 = points[0].x, y0 = points[0].y;
    const table = [{ s: 0, t: 0, x: points[0].x, y: points[0].y, stalled: false }];
    let s = 0, tAcc = 0;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i];
      const ds = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const dropMid = ((p0.y + p1.y) / 2) - y0;
      const horizMid = Math.abs(((p0.x + p1.x) / 2) - x0);
      const v2 = 2 * G * (dropMid - mu * horizMid);
      if (v2 <= 0.0001) { // bead stalls; stop the table here
        table.push({ s, t: Infinity, x: p1.x, y: p1.y, stalled: true });
        break;
      }
      const dt = ds / Math.sqrt(v2);
      s += ds; tAcc += dt;
      table.push({ s, t: tAcc, x: p1.x, y: p1.y, stalled: false });
    }
    return table;
  }
  function posAtTime(table, t) {
    if (t <= 0) return table[0];
    const lastFinite = table.filter((r) => isFinite(r.t));
    const end = lastFinite[lastFinite.length - 1];
    if (t >= end.t) return end;
    for (let i = 1; i < table.length; i++) {
      if (isFinite(table[i].t) && table[i].t >= t) {
        const a = table[i - 1], b = table[i];
        const f = (t - a.t) / Math.max(b.t - a.t, 1e-9);
        return { x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) };
      }
    }
    return end;
  }

  /* ============ 7. BRACHISTOCHRONE (fitted, friction, speed) ============ */
  function initBrachistochrone() {
    const goBtn = document.getElementById("brachGoBtn");
    if (!goBtn) return;
    const resultsEl = document.getElementById("brachResults");
    const svg = document.getElementById("brachSvg");
    // Physics geometry in metres: A at origin, B down-right.
    const WX = 2.0, HY = 1.2;

    function curvePoints(kind) {
      const N = 160, pts = [];
      if (kind === "line") {
        for (let i = 0; i <= N; i++) { const f = i / N; pts.push({ x: f * WX, y: f * HY }); }
      } else if (kind === "parabola") {
        for (let i = 0; i <= N; i++) { const f = i / N; pts.push({ x: f * WX, y: f * f * HY }); }
      } else if (kind === "arc") {
        // Circular arc tangent to the vertical at A, passing through B.
        const r = (WX * WX + HY * HY) / (2 * WX);
        const phiB = Math.acos(clamp(1 - WX / r, -1, 1));
        for (let i = 0; i <= N; i++) { const phi = (i / N) * phiB; pts.push({ x: r * (1 - Math.cos(phi)), y: r * Math.sin(phi) }); }
      } else { // cycloid through B
        let R = WX / Math.PI;
        for (let iter = 0; iter < 30; iter++) {
          let lo = 0.01, hi = 2 * Math.PI;
          for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (R * (m - Math.sin(m)) < WX ? lo = m : hi = m); }
          const th = (lo + hi) / 2;
          R *= HY / Math.max(R * (1 - Math.cos(th)), 1e-4);
        }
        let lo = 0.01, hi = 2 * Math.PI;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (R * (m - Math.sin(m)) < WX ? lo = m : hi = m); }
        const thetaMax = (lo + hi) / 2;
        for (let i = 0; i <= N; i++) { const th = (i / N) * thetaMax; pts.push({ x: R * (th - Math.sin(th)), y: R * (1 - Math.cos(th)) }); }
      }
      return pts;
    }
    const kinds = ["line", "arc", "parabola", "cycloid"];
    const colors = { line: "#e34948", arc: "#2a78d6", parabola: "#eb6834", cycloid: "#1baf7a" };
    const curves = {};
    kinds.forEach((k) => (curves[k] = curvePoints(k)));
    const map = fitMap(svg, kinds.map((k) => curves[k]), 22);

    kinds.forEach((k) => {
      const path = document.getElementById("brachPath-" + k);
      if (path) path.setAttribute("d", "M" + curves[k].map((p) => `${map.toX(p.x)},${map.toY(p.y)}`).join(" L"));
    });

    // Injected friction + speed controls.
    const ctl = controlRow(goBtn, "brachCtl");
    ctl.innerHTML =
      '<label>Friction μ <input type="range" id="brachMu" min="0" max="0.4" step="0.01" value="0"> <span id="brachMuVal">0.00</span></label>' +
      '<label>Speed <input type="range" id="brachSpeed" min="0.5" max="4" step="0.5" value="2"> <span id="brachSpeedVal">2×</span></label>';
    const muS = document.getElementById("brachMu"), muV = document.getElementById("brachMuVal");
    const spS = document.getElementById("brachSpeed"), spV = document.getElementById("brachSpeedVal");

    let tables = {};
    function rebuild() {
      const mu = +muS.value;
      muV.textContent = mu.toFixed(2);
      spV.textContent = (+spS.value).toFixed(1) + "×";
      kinds.forEach((k) => (tables[k] = buildTimeTable(curves[k], mu)));
      render();
    }
    function render() {
      let html = "<table>";
      kinds.slice().sort((a, b) => {
        const ta = tables[a][tables[a].length - 1], tb = tables[b][tables[b].length - 1];
        return (isFinite(ta.t) ? ta.t : 1e9) - (isFinite(tb.t) ? tb.t : 1e9);
      }).forEach((k) => {
        const end = tables[k][tables[k].length - 1];
        const label = end.stalled ? "stalls (friction)" : end.t.toFixed(3) + " s";
        html += `<tr><td class="k"><span class="swatch" style="background:${colors[k]}"></span>${k[0].toUpperCase() + k.slice(1)}</td><td class="v">${label}</td></tr>`;
      });
      resultsEl.innerHTML = html + "</table>";
    }
    muS.addEventListener("input", rebuild);
    spS.addEventListener("input", () => { spV.textContent = (+spS.value).toFixed(1) + "×"; });
    rebuild();

    let running = false, t0 = 0;
    function frame(now) {
      if (!running) return;
      const t = ((now - t0) / 1000) * (+spS.value);
      let anyMoving = false;
      kinds.forEach((k) => {
        const table = tables[k], end = table[table.length - 1];
        const finalT = isFinite(end.t) ? end.t : 1e9;
        const tt = Math.min(t, finalT);
        if (t < finalT && isFinite(finalT)) anyMoving = true;
        const p = posAtTime(table, tt);
        const el = document.getElementById("brachBead-" + k);
        if (el) { el.setAttribute("cx", map.toX(p.x)); el.setAttribute("cy", map.toY(p.y)); }
      });
      if (anyMoving) requestAnimationFrame(frame); else running = false;
    }
    goBtn.addEventListener("click", () => { running = true; t0 = performance.now(); requestAnimationFrame(frame); });
  }

  /* ============ 8. TAUTOCHRONE (fitted, speed) ============ */
  function initTautochrone() {
    const goBtn = document.getElementById("tautoGoBtn");
    if (!goBtn) return;
    const periodVal = document.getElementById("tautoPeriodVal");
    const svg = document.getElementById("tautoSvg");
    const path = document.getElementById("tautoPath");
    const R = 1.0, thetaMax = Math.PI;
    const cyc = (th) => ({ x: R * (th - Math.sin(th)), y: R * (1 - Math.cos(th)) });

    const N = 240, fullCurve = [];
    for (let i = 0; i <= N; i++) fullCurve.push(cyc((i / N) * thetaMax));
    const map = fitMap(svg, [fullCurve], 22);
    path.setAttribute("d", "M" + fullCurve.map((p) => `${map.toX(p.x)},${map.toY(p.y)}`).join(" L"));

    periodVal.textContent = (Math.PI * Math.sqrt(R / G)).toFixed(3) +
      " s (a quarter period, T/4 with T = 4π√(R/g)) — the SAME for every start point";

    const starts = [0.12, 0.38, 0.64, 0.9].map((f) => f * thetaMax);
    const colors = ["#e34948", "#2a78d6", "#eb6834", "#1baf7a"];
    function tableFrom(theta0) {
      const M = 220, pts = [];
      const base = cyc(theta0);
      for (let i = 0; i <= M; i++) {
        const th = theta0 + (i / M) * (Math.PI - theta0);
        const p = cyc(th);
        pts.push({ x: p.x, y: p.y - base.y }); // drop from release
      }
      return buildTimeTable(pts, 0);
    }
    const tables = starts.map(tableFrom);
    starts.forEach((th0, i) => {
      const p = cyc(th0), el = document.getElementById("tautoBead-" + i);
      if (el) { el.setAttribute("cx", map.toX(p.x)); el.setAttribute("cy", map.toY(p.y)); el.setAttribute("fill", colors[i]); }
    });

    // Injected speed control.
    const ctl = controlRow(goBtn, "tautoCtl");
    ctl.innerHTML = '<label>Speed <input type="range" id="tautoSpeed" min="0.5" max="4" step="0.5" value="2"> <span id="tautoSpeedVal">2×</span></label>';
    const spS = document.getElementById("tautoSpeed"), spV = document.getElementById("tautoSpeedVal");
    spS.addEventListener("input", () => { spV.textContent = (+spS.value).toFixed(1) + "×"; });

    let running = false, t0 = 0;
    function frame(now) {
      if (!running) return;
      const t = ((now - t0) / 1000) * (+spS.value);
      let anyMoving = false;
      starts.forEach((th0, i) => {
        const table = tables[i], finalT = table[table.length - 1].t;
        const tt = Math.min(t, finalT);
        if (tt < finalT) anyMoving = true;
        const rel = posAtTime(table, tt), base = cyc(th0);
        const el = document.getElementById("tautoBead-" + i);
        if (el) { el.setAttribute("cx", map.toX(base.x + rel.x)); el.setAttribute("cy", map.toY(base.y + rel.y)); }
      });
      if (anyMoving) requestAnimationFrame(frame); else running = false;
    }
    goBtn.addEventListener("click", () => { running = true; t0 = performance.now(); requestAnimationFrame(frame); });
  }

  /* ============ 9. CATENARY VS PARABOLA ============ */
  function initCatenary() {
    const aSlider = document.getElementById("catASlider");
    if (!aSlider) return;
    const aVal = document.getElementById("catAVal");
    const devVal = document.getElementById("catDevVal");
    const catPath = document.getElementById("catCatenaryPath");
    const paraPath = document.getElementById("catParabolaPath");
    const halfWidth = 150;
    function render() {
      const a = +aSlider.value;
      aVal.textContent = a.toFixed(0);
      let dCat = "", dPara = "", maxDev = 0;
      for (let i = 0; i <= 80; i++) {
        const x = -halfWidth + (i / 80) * 2 * halfWidth;
        const yCat = a * Math.cosh(x / a) - a, yPara = (x * x) / (2 * a);
        maxDev = Math.max(maxDev, Math.abs(yCat - yPara));
        dCat += (i === 0 ? "M" : "L") + (150 + x) + " " + (180 - yCat * 0.5) + " ";
        dPara += (i === 0 ? "M" : "L") + (150 + x) + " " + (180 - yPara * 0.5) + " ";
      }
      catPath.setAttribute("d", dCat); paraPath.setAttribute("d", dPara);
      devVal.textContent = maxDev.toFixed(1) + " units at the supports (curves nearly coincide near the bottom)";
    }
    aSlider.addEventListener("input", render);
    render();
  }

  /* ============ 10. TENNIS-RACKET THEOREM (rebuilt to fit) ============ */
  function initTennisRacket() {
    const axisButtons = document.querySelectorAll(".racketAxisBtn");
    if (!axisButtons.length) return;
    const svg = document.getElementById("racketSvg");
    const statusEl = document.getElementById("racketStatus");
    const I1 = 1, I2 = 2, I3 = 3;
    let running = false, w = [0, 0, 0], t = 0, history = [], orient = 0, rafId = null;

    // Rebuild SVG content sized from its own viewBox so nothing is clipped.
    const vb = svg.viewBox.baseVal;
    svg.innerHTML = "";
    // Left half: tumbling racket. Right half: omega graph.
    const half = vb.width * 0.42;
    const bodyCX = vb.x + half * 0.5, bodyCY = vb.y + vb.height * 0.5;
    const gx0 = vb.x + half + 10, gx1 = vb.x + vb.width - 10;
    const gy0 = vb.y + 16, gy1 = vb.y + vb.height - 16, gyMid = (gy0 + gy1) / 2;
    svg.appendChild(svgEl("line", { x1: gx0, y1: gyMid, x2: gx1, y2: gyMid, stroke: "#e2e6ea", "stroke-width": 1 }));
    const legend = svgEl("text", { x: gx0, y: gy0 + 2, "font-size": 10, fill: "#555" });
    legend.textContent = "ω₁ red · ω₂ blue · ω₃ green";
    svg.appendChild(legend);
    const plot1 = svgEl("path", { fill: "none", stroke: "#e34948", "stroke-width": 2 });
    const plot2 = svgEl("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 2 });
    const plot3 = svgEl("path", { fill: "none", stroke: "#1baf7a", "stroke-width": 2 });
    svg.appendChild(plot1); svg.appendChild(plot2); svg.appendChild(plot3);
    // Racket body group (centered; rotates in place).
    const bodyG = svgEl("g", {});
    const handle = svgEl("rect", { x: -4, y: 0, width: 8, height: 44, rx: 3, fill: "#8a6a3a" });
    const head = svgEl("ellipse", { cx: 0, cy: -14, rx: 20, ry: 28, fill: "none", stroke: "#33415c", "stroke-width": 3 });
    const a1 = svgEl("line", { x1: 0, y1: 0, x2: 34, y2: 0, stroke: "#e34948", "stroke-width": 2.5 });
    const a3 = svgEl("line", { x1: 0, y1: 0, x2: 0, y2: -34, stroke: "#1baf7a", "stroke-width": 2.5 });
    bodyG.appendChild(handle); bodyG.appendChild(head); bodyG.appendChild(a1); bodyG.appendChild(a3);
    svg.appendChild(bodyG);

    function derivs(w1, w2, w3) {
      return [((I2 - I3) * w2 * w3) / I1, ((I3 - I1) * w3 * w1) / I2, ((I1 - I2) * w1 * w2) / I3];
    }
    function reset(axis) {
      running = false; if (rafId) cancelAnimationFrame(rafId);
      t = 0; history = []; orient = 0;
      w = [0.05, 0.05, 0.05]; w[axis] = 5;
      statusEl.textContent = axis === 1
        ? "Spinning about the intermediate axis — watch ω₁ and ω₃ swap dominance repeatedly (the flip)."
        : "Spinning about a stable axis — small wobble, no flip.";
      draw();
    }
    function step(dt) {
      let rem = dt;
      while (rem > 0) {
        const h = Math.min(0.001, rem);
        const [d1, d2, d3] = derivs(w[0], w[1], w[2]);
        w[0] += d1 * h; w[1] += d2 * h; w[2] += d3 * h;
        orient += w[1] * h * 40; // visible tumble driven by dominant/intermediate spin
        rem -= h;
      }
      t += dt;
    }
    function draw() {
      history.push({ t, w: w.slice() });
      if (history.length > 500) history.shift();
      const maxT = Math.max(1, ...history.map((h) => h.t)), maxW = 6;
      [plot1, plot2, plot3].forEach((p, idx) => {
        let d = "";
        history.forEach((h, i) => {
          const px = gx0 + (h.t / maxT) * (gx1 - gx0);
          const py = gyMid - (h.w[idx] / maxW) * ((gy1 - gy0) / 2);
          d += (i === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1) + " ";
        });
        p.setAttribute("d", d);
      });
      bodyG.setAttribute("transform", `translate(${bodyCX},${bodyCY}) rotate(${orient % 360})`);
    }
    function frame(now, last) {
      if (!running) return;
      step(Math.min(0.03, Math.max(0, (now - last) / 1000)));
      draw();
      if (t < 16) rafId = requestAnimationFrame((n) => frame(n, now)); else running = false;
    }
    axisButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        axisButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        reset(+btn.dataset.axis);
        running = true;
        rafId = requestAnimationFrame((n) => frame(n, performance.now()));
      });
    });
    reset(1); // default to the intermediate axis so the flip is the first thing seen
  }

  /* ============ 11. GYROSCOPIC PRECESSION ============ */
  function initGyroPrecession() {
    const torqueSlider = document.getElementById("gyroTorqueSlider");
    if (!torqueSlider) return;
    const spinSlider = document.getElementById("gyroSpinSlider");
    const torqueVal = document.getElementById("gyroTorqueVal");
    const spinVal = document.getElementById("gyroSpinVal");
    const omegaVal = document.getElementById("gyroOmegaVal");
    const axisLine = document.getElementById("gyroAxisLine");
    let angle = 0, lastT = performance.now();
    const rate = () => +torqueSlider.value / +spinSlider.value;
    function render() {
      torqueVal.textContent = (+torqueSlider.value).toFixed(2) + " N·m";
      spinVal.textContent = (+spinSlider.value).toFixed(2) + " kg·m²/s";
      omegaVal.textContent = rate().toFixed(3) + " rad/s";
    }
    function frame(now) {
      angle += rate() * Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const cx = 150, cy = 100, r = 70;
      axisLine.setAttribute("x1", cx); axisLine.setAttribute("y1", cy);
      axisLine.setAttribute("x2", cx + r * Math.cos(angle)); axisLine.setAttribute("y2", cy + r * Math.sin(angle));
      requestAnimationFrame(frame);
    }
    [torqueSlider, spinSlider].forEach((s) => s.addEventListener("input", render));
    render(); requestAnimationFrame(frame);
  }

  /* ============ 12. BEAD ON A ROTATING HOOP ============ */
  function initRotatingHoop() {
    const omegaSlider = document.getElementById("hoopOmegaSlider");
    if (!omegaSlider) return;
    const omegaVal = document.getElementById("hoopOmegaVal");
    const omegaCVal = document.getElementById("hoopOmegaCVal");
    const eqVal = document.getElementById("hoopEqVal");
    const bead = document.getElementById("hoopBead");
    const bead2 = document.getElementById("hoopBead2");
    const bifPath1 = document.getElementById("hoopBifPath1");
    const bifPath2 = document.getElementById("hoopBifPath2");
    const bifMarker = document.getElementById("hoopBifMarker");
    const R = 1.0, omegaC = Math.sqrt(G / R), cx = 90, cy = 100, rPx = 70;
    function render() {
      const Om = +omegaSlider.value / 10;
      omegaVal.textContent = Om.toFixed(2) + " rad/s";
      omegaCVal.textContent = omegaC.toFixed(2) + " rad/s";
      bead2.style.display = "none";
      let theta = 0;
      if (Om <= omegaC) { eqVal.textContent = "Only the bottom (θ=0) is stable."; theta = 0; }
      else { theta = Math.acos(G / (Om * Om * R)); eqVal.textContent = "Bottom is now unstable; two new stable equilibria at θ = ±" + ((theta * 180) / Math.PI).toFixed(1) + "°"; bead2.style.display = ""; }
      bead.setAttribute("cx", cx + rPx * Math.sin(theta)); bead.setAttribute("cy", cy - rPx * Math.cos(theta));
      bead2.setAttribute("cx", cx - rPx * Math.sin(theta)); bead2.setAttribute("cy", cy - rPx * Math.cos(theta));
      const W = 220, H = 100, x0 = 260, y0 = 20, omMax = 2 * omegaC;
      const build = (sign) => {
        let d = "M" + x0 + "," + (y0 + H / 2);
        for (let i = 0; i <= 60; i++) {
          const om = (i / 60) * omMax, th = om <= omegaC ? 0 : sign * Math.acos(G / (om * om * R));
          d += " L" + (x0 + (om / omMax) * W) + "," + (y0 + H / 2 - (th / Math.PI) * H);
        }
        return d;
      };
      bifPath1.setAttribute("d", build(1)); bifPath2.setAttribute("d", build(-1));
      bifMarker.setAttribute("cx", clamp(x0 + (Om / omMax) * W, x0, x0 + W));
      bifMarker.setAttribute("cy", y0 + H / 2 - (theta / Math.PI) * H);
    }
    omegaSlider.addEventListener("input", render);
    render();
  }

  /* ============ NEW A. BRACHISTOCHRONE EXPLORER  [#brachExplorerHost] ============
     Drag the control point to morph a quadratic Bézier ramp and read the descent
     time; "Snap to cycloid" shows the true optimum to beat. */
  function initBrachExplorer() {
    const host = document.getElementById("brachExplorerHost");
    if (!host) return;
    host.classList.add("uni-widget");
    host.innerHTML =
      '<div class="uni-controls">' +
      '  <button class="uni-go" data-snap>Snap to cycloid</button>' +
      '  <button class="uni-go" data-go>Drop bead</button>' +
      '  <span class="uni-hint">drag the orange point</span>' +
      '</div>';
    const svg = svgEl("svg", { viewBox: "0 0 320 200", class: "uni-svg" });
    const A = { x: 30, y: 30 }, B = { x: 290, y: 170 };
    let ctrl = { x: 90, y: 165 };
    const guide = svgEl("path", { fill: "none", stroke: "#c7ced6", "stroke-width": 1, "stroke-dasharray": "4 4" });
    const curve = svgEl("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 3 });
    const cyc = svgEl("path", { fill: "none", stroke: "#1baf7a", "stroke-width": 1.5, "stroke-dasharray": "3 4", opacity: 0.7 });
    const pA = svgEl("circle", { cx: A.x, cy: A.y, r: 5, fill: "#33415c" });
    const pB = svgEl("circle", { cx: B.x, cy: B.y, r: 5, fill: "#33415c" });
    const handle = svgEl("circle", { cx: ctrl.x, cy: ctrl.y, r: 8, fill: "#eb6834", cursor: "grab" });
    const bead = svgEl("circle", { cx: A.x, cy: A.y, r: 6, fill: "#e34948" });
    [guide, cyc, curve, pA, pB, bead, handle].forEach((n) => svg.appendChild(n));
    host.appendChild(svg);
    const readout = document.createElement("div");
    readout.className = "uni-readouts";
    readout.innerHTML = '<div>Descent time: <b data-o="t">—</b></div><div>Optimal (cycloid): <b data-o="opt">—</b></div>';
    host.appendChild(readout);

    const q = (s) => host.querySelector(s);
    const bez = (f) => ({ x: (1 - f) * (1 - f) * A.x + 2 * (1 - f) * f * ctrl.x + f * f * B.x,
                          y: (1 - f) * (1 - f) * A.y + 2 * (1 - f) * f * ctrl.y + f * f * B.y });
    const PXPM = 60;
    function tableForCurve() {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const p = bez(i / 120); pts.push({ x: (p.x - A.x) / PXPM, y: (p.y - A.y) / PXPM }); }
      return buildTimeTable(pts, 0);
    }
    // cycloid reference through A,B (drop = B.y-A.y, width = B.x-A.x)
    const WX = (B.x - A.x) / PXPM, HY = (B.y - A.y) / PXPM;
    function cycloidTable() {
      let R = WX / Math.PI;
      for (let it = 0; it < 30; it++) {
        let lo = 0.01, hi = 2 * Math.PI;
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (R * (m - Math.sin(m)) < WX ? lo = m : hi = m); }
        const th = (lo + hi) / 2; R *= HY / Math.max(R * (1 - Math.cos(th)), 1e-4);
      }
      let lo = 0.01, hi = 2 * Math.PI;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (R * (m - Math.sin(m)) < WX ? lo = m : hi = m); }
      const thMax = (lo + hi) / 2, pts = [], scr = [];
      for (let i = 0; i <= 120; i++) { const th = (i / 120) * thMax; const x = R * (th - Math.sin(th)), y = R * (1 - Math.cos(th)); pts.push({ x, y }); scr.push({ x: A.x + x * PXPM, y: A.y + y * PXPM }); }
      return { table: buildTimeTable(pts, 0), scr };
    }
    const cycRef = cycloidTable();
    cyc.setAttribute("d", "M" + cycRef.scr.map((p) => `${p.x},${p.y}`).join(" L"));

    let table = null;
    function redraw() {
      guide.setAttribute("d", `M${A.x},${A.y} L${ctrl.x},${ctrl.y} L${B.x},${B.y}`);
      let d = "M" + A.x + "," + A.y;
      for (let i = 1; i <= 60; i++) { const p = bez(i / 60); d += " L" + p.x.toFixed(1) + "," + p.y.toFixed(1); }
      curve.setAttribute("d", d);
      handle.setAttribute("cx", ctrl.x); handle.setAttribute("cy", ctrl.y);
      table = tableForCurve();
      const end = table[table.length - 1];
      q('[data-o="t"]').textContent = end.stalled ? "—" : end.t.toFixed(3) + " s";
      q('[data-o="opt"]').textContent = cycRef.table[cycRef.table.length - 1].t.toFixed(3) + " s";
    }
    handle.addEventListener("pointerdown", (e) => { handle.setPointerCapture(e.pointerId); handle.style.cursor = "grabbing"; });
    handle.addEventListener("pointermove", (e) => {
      if (e.buttons !== 1) return;
      const p = clientToSvg(svg, e);
      ctrl.x = clamp(p.x, 10, 310); ctrl.y = clamp(p.y, 10, 195);
      redraw();
    });
    handle.addEventListener("pointerup", () => (handle.style.cursor = "grab"));
    q("[data-snap]").addEventListener("click", () => {
      // put the control point near the cycloid's low mid to approximate it
      const mid = cycRef.scr[Math.floor(cycRef.scr.length * 0.35)];
      ctrl.x = mid.x; ctrl.y = Math.min(195, mid.y + 15); redraw();
    });
    redraw();

    let running = false, t0 = 0;
    function frame(now) {
      if (!running) return;
      const t = ((now - t0) / 1000) * 1.5;
      const end = table[table.length - 1], finalT = isFinite(end.t) ? end.t : 1e9;
      const p = posAtTime(table, Math.min(t, finalT));
      bead.setAttribute("cx", A.x + p.x * PXPM); bead.setAttribute("cy", A.y + p.y * PXPM);
      if (t < finalT) requestAnimationFrame(frame); else running = false;
    }
    q("[data-go]").addEventListener("click", () => { running = true; t0 = performance.now(); requestAnimationFrame(frame); });
  }

  /* ============ NEW B. TAUTOCHRONE CLOCK  [#tautoClockHost] ============
     Two beads released from different heights on a cycloid, looping forever,
     always reaching the bottom together. */
  function initTautoClock() {
    const host = document.getElementById("tautoClockHost");
    if (!host) return;
    host.classList.add("uni-widget");
    host.innerHTML = '<div class="uni-controls"><button class="uni-go" data-go>Run / Stop</button>' +
      '<span class="uni-hint">both beads meet at the bottom every quarter-period, regardless of start height</span></div>';
    const svg = svgEl("svg", { viewBox: "0 0 320 180", class: "uni-svg" });
    const R = 1.0, thetaMax = Math.PI;
    const cyc = (th) => ({ x: R * (th - Math.sin(th)), y: R * (1 - Math.cos(th)) });
    const N = 200, curve = [];
    for (let i = 0; i <= N; i++) curve.push(cyc((i / N) * thetaMax));
    const map = fitMap(svg, [curve], 20);
    svg.appendChild(svgEl("path", { d: "M" + curve.map((p) => `${map.toX(p.x)},${map.toY(p.y)}`).join(" L"), fill: "none", stroke: "#33415c", "stroke-width": 2 }));
    // Exact SHM in the arc-length coordinate: s(t)=s0*cos(ω t), ω=√(g/(4R)).
    const omega = Math.sqrt(G / (4 * R));
    // arc length from bottom (theta=pi) to theta: s = 4R cos(theta/2). Use s to place.
    const starts = [0.25, 0.6, 0.95].map((f) => f * thetaMax);
    const colors = ["#e34948", "#2a78d6", "#1baf7a"];
    const beads = starts.map((th0, i) => {
      const b = svgEl("circle", { r: 6, fill: colors[i] });
      svg.appendChild(b); return b;
    });
    host.appendChild(svg);
    // s measured from bottom; s0 for each start:
    const s0 = starts.map((th0) => 4 * R * Math.cos(th0 / 2)); // >0
    function thetaFromS(s) { return 2 * Math.acos(clamp(s / (4 * R), -1, 1)); }
    function place(t) {
      starts.forEach((_, i) => {
        const s = s0[i] * Math.cos(omega * t);
        const th = thetaFromS(Math.abs(s));
        const p = cyc(th);
        beads[i].setAttribute("cx", map.toX(p.x));
        beads[i].setAttribute("cy", map.toY(p.y));
      });
    }
    place(0);
    let running = false, t0 = 0, rafId = null;
    function frame(now) { if (!running) return; place(((now - t0) / 1000) * 1.5); rafId = requestAnimationFrame(frame); }
    host.querySelector("[data-go]").addEventListener("click", () => {
      running = !running;
      if (running) { t0 = performance.now(); rafId = requestAnimationFrame(frame); }
      else if (rafId) cancelAnimationFrame(rafId);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDoubleCone();
    initSpool();
    initRaceUnintuitive();
    initSlinky();
    initPulleyPuzzle();
    initChainFountain();
    initBrachistochrone();
    initTautochrone();
    initCatenary();
    initTennisRacket();
    initGyroPrecession();
    initRotatingHoop();
    initBrachExplorer();   // new (no-op without host)
    initTautoClock();      // new (no-op without host)
  });
})();
