// Interactive widgets for docs/09-unintuitive-problems/index.html.
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
    const sx = vb.width / rect.width;
    const sy = vb.height / rect.height;
    return { x: (evt.clientX - rect.left) * sx + vb.x, y: (evt.clientY - rect.top) * sy + vb.y };
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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
    const svg = document.getElementById("coneSvg");
    const railTop = document.getElementById("coneRailTop");
    const railBot = document.getElementById("coneRailBot");
    const coneShape = document.getElementById("coneShape");
    const cmPlotPath = document.getElementById("coneCmPlotPath");

    const X0 = 20, X1 = 280, Y0 = 150;
    function render() {
      const r1 = +riseSlider.value / 100; // rail incline rise rate
      const r2 = +sinkSlider.value / 100; // sink-into-V rate
      const p = +posSlider.value / 100; // 0..1 fraction along track
      riseVal.textContent = r1.toFixed(2);
      sinkVal.textContent = r2.toFixed(2);
      posVal.textContent = (p * 100).toFixed(0) + "%";

      const trackLen = X1 - X0;
      const x = X0 + p * trackLen;
      const railRise = r1 * p * trackLen * 0.4; // px of visual rail climb
      const sink = r2 * p * trackLen * 0.4; // px the cone sinks between rails
      const netCmY = Y0 - railRise + sink; // smaller y = higher on screen

      railTop.setAttribute("points", `${X0},${Y0} ${X1},${Y0 - r1 * trackLen * 0.4}`);
      const sep0 = 10, sep1 = 10 + r2 * trackLen * 0.5;
      railBot.setAttribute("points", `${X0},${Y0 + sep0} ${X1},${Y0 - r1 * trackLen * 0.4 + sep1}`);

      coneShape.setAttribute("cx", x);
      coneShape.setAttribute("cy", netCmY);

      let d = "";
      for (let i = 0; i <= 20; i++) {
        const pp = i / 20;
        const xx = X0 + pp * trackLen;
        const rr = r1 * pp * trackLen * 0.4;
        const ss = r2 * pp * trackLen * 0.4;
        const yy = Y0 - rr + ss;
        d += (i === 0 ? "M" : "L") + xx + " " + yy + " ";
      }
      cmPlotPath.setAttribute("d", d);

      railRiseVal.textContent = (r1 * trackLen * 0.4 * (p)).toFixed(1) + " px of apparent climb";
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
    const svg = document.getElementById("spoolSvg");
    const string = document.getElementById("spoolString");
    const arrow = document.getElementById("spoolArrow");

    const R = 60, cx = 150, cy = 100;
    function render() {
      const rRatio = +rSlider.value / 100;
      const r = rRatio * R;
      const thetaDeg = +thetaSlider.value;
      const theta = (thetaDeg * Math.PI) / 180;
      rVal.textContent = rRatio.toFixed(2) + " × R";
      thetaVal.textContent = thetaDeg + "°";

      const thetaC = (Math.acos(rRatio) * 180) / Math.PI;
      thetaCVal.textContent = thetaC.toFixed(1) + "°";

      const arm = R * Math.cos(theta) - r; // moment arm about contact point
      armVal.textContent = arm.toFixed(1) + " (in units where R=" + R + ")";

      // tangent point on inner circle, string leaving from the underside
      const nx = -Math.sin(theta), ny = Math.cos(theta);
      const tx = cx + r * nx, ty = cy - r * (-ny) - r; // approx tangent point below center
      const Tx = cx - r * Math.sin(theta);
      const Ty = cy + r * Math.cos(theta);
      const pullLen = 90;
      const ex = Tx + pullLen * Math.cos(theta);
      const ey = Ty - pullLen * Math.sin(theta);
      string.setAttribute("x1", Tx);
      string.setAttribute("y1", Ty);
      string.setAttribute("x2", ex);
      string.setAttribute("y2", ey);
      arrow.setAttribute("cx", ex);
      arrow.setAttribute("cy", ey);

      if (Math.abs(arm) < 0.5) {
        dirVal.textContent = "Right at the critical angle — no net torque, spool just slides.";
        dirVal.className = "verdict-badge";
      } else if (arm > 0) {
        dirVal.textContent = "Spool rolls AWAY from you, toward the pull (θ < θc).";
        dirVal.className = "verdict-badge good";
      } else {
        dirVal.textContent = "Spool rolls TOWARD you, against the pull direction (θ > θc)!";
        dirVal.className = "verdict-badge bad";
      }
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
      { id: "hoop", name: "Hoop", beta: 1, x: 0, color: "#e34948" },
      { id: "cyl", name: "Solid Cylinder", beta: 0.5, x: 0, color: "#2a78d6" },
      { id: "sphereHollow", name: "Hollow Sphere", beta: 2 / 3, x: 0, color: "#eb6834" },
      { id: "sphereSolid", name: "Solid Sphere", beta: 0.4, x: 0, color: "#1baf7a" },
    ];
    let running = false, simTime = 0, lastFrameTime = 0, finishTimes = {};
    const TRACK_PX = 260;

    function frame(now) {
      if (!running) return;
      simTime += Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      const angle = (+angleSlider.value * Math.PI) / 180;
      const L = +lenSlider.value;
      const a0 = G * Math.sin(angle);
      let allDone = true;
      shapes.forEach((s) => {
        if (finishTimes[s.id] !== undefined) return;
        const a = a0 / (1 + s.beta);
        const dist = 0.5 * a * simTime * simTime;
        if (dist >= L) {
          finishTimes[s.id] = Math.sqrt((2 * L) / a);
          s.x = TRACK_PX;
        } else {
          s.x = (dist / L) * TRACK_PX;
          allDone = false;
        }
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
      html += "</table>";
      resultsEl.innerHTML = html;
    }
    function reset() {
      running = false;
      finishTimes = {};
      simTime = 0;
      shapes.forEach((s) => {
        s.x = 0;
        const el = document.getElementById("raceShape-" + s.id);
        if (el) el.setAttribute("cx", 20);
      });
      renderResults();
    }
    goBtn.addEventListener("click", () => {
      reset();
      running = true;
      lastFrameTime = performance.now();
      requestAnimationFrame(frame);
    });
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
    const N = 14;
    const K = 900, M = 0.05; // spring const per segment, mass per node
    const L0 = 4; // natural segment length (px-scale, arbitrary units)
    let y = [], v = [], released = false, t = 0;
    const history = [];

    function setup() {
      y = new Array(N + 1);
      v = new Array(N + 1).fill(0);
      // static equilibrium under gravity while top is fixed: stretch of segment i (from bottom)
      // supports weight of all nodes below it -> tension_i = (N - i)*M*g, stretch = tension/K
      y[0] = 0;
      for (let i = 1; i <= N; i++) {
        const tension = (N - i + 1) * M * G;
        const stretch = tension / K;
        y[i] = y[i - 1] + L0 + stretch * 40;
      }
      released = false;
      t = 0;
      history.length = 0;
      draw();
      statusEl.textContent = "Slinky hangs in equilibrium — click Release.";
    }
    function step(dt) {
      const sub = 0.0008;
      let remaining = dt;
      while (remaining > 0) {
        const h = Math.min(sub, remaining);
        const a = new Array(N + 1).fill(0);
        for (let i = 0; i <= N; i++) a[i] += G;
        for (let i = 0; i < N; i++) {
          const seg = y[i + 1] - y[i];
          const stretch = seg - L0;
          const f = K * stretch; // force pulling nodes together if stretched
          a[i] += f / M;
          a[i + 1] -= f / M;
        }
        for (let i = 1; i <= N; i++) { // node 0 is the (now released) top; if released, it's free too
          v[i] += a[i] * h;
          y[i] += v[i] * h;
        }
        if (released) { v[0] += a[0] * h; y[0] += v[0] * h; }
        remaining -= h;
      }
      t += dt;
    }
    function draw() {
      const scale = 1.4, x0 = 150, yTop = 20;
      let d = "M";
      for (let i = 0; i <= N; i++) {
        const yy = yTop + y[i] * scale;
        d += (i === 0 ? "" : "L") + x0 + " " + yy + " ";
      }
      svg.querySelectorAll(".slinky-node").forEach((n) => n.remove());
      for (let i = 0; i <= N; i++) {
        const yy = yTop + y[i] * scale;
        const c = svgEl("ellipse", { cx: x0, cy: yy, rx: 26, ry: 3.5, class: "slinky-node", fill: "none", stroke: i === 0 ? "#eb6834" : (i === N ? "#e34948" : "var(--muted)"), "stroke-width": i === 0 || i === N ? 2.5 : 1.3 });
        svg.appendChild(c);
      }
      history.push({ t, top: y[0], bottom: y[N] });
      if (history.length > 260) history.shift();
      const maxY = Math.max(1, ...history.map((h) => Math.max(h.top, h.bottom)));
      const maxT = Math.max(0.5, ...history.map((h) => h.t));
      let dTop = "", dBot = "";
      history.forEach((h, i) => {
        const px = 40 + (h.t / maxT) * 440;
        const pyTop = 90 - (h.top / maxY) * 80;
        const pyBot = 90 - (h.bottom / maxY) * 80;
        dTop += (i === 0 ? "M" : "L") + px + " " + pyTop + " ";
        dBot += (i === 0 ? "M" : "L") + px + " " + pyBot + " ";
      });
      topPlotPath.setAttribute("d", dTop);
      plotPath.setAttribute("d", dBot);
    }
    function frame(now, last) {
      if (!released) return;
      const dt = Math.min(0.03, Math.max(0, (now - last) / 1000));
      step(dt);
      draw();
      if (t < 1.2) requestAnimationFrame((n) => frame(n, now));
      else statusEl.textContent = "The bottom coil stayed almost still for a moment before the compression wave reached it and it began to fall.";
    }
    dropBtn.addEventListener("click", () => {
      setup();
      released = true;
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
    const svg = document.getElementById("puzzleSvg");
    const loadEl = document.getElementById("puzzleLoad");
    const ropeLeft = document.getElementById("puzzleRopeLeft");
    const ropeRight = document.getElementById("puzzleRopeRight");
    const pulleyEl = document.getElementById("puzzlePulley");

    const topY = 20, baseY = 180, pulleyR = 10;
    function render() {
      const pull = +pullSlider.value;
      const W = +weightSlider.value;
      pullVal.textContent = pull.toFixed(2) + " m";
      weightVal.textContent = W.toFixed(0) + " N";
      const rise = pull / 2;
      riseVal.textContent = rise.toFixed(2) + " m";
      forceVal.textContent = (W / 2).toFixed(1) + " N";

      const loadY0 = baseY;
      const loadY = clamp(loadY0 - rise * 60, topY + 40, baseY);
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
    const svg = document.getElementById("fountainSvg");
    const arc = document.getElementById("fountainArc");

    function render() {
      const v = +vSlider.value;
      vVal.textContent = v.toFixed(1) + " m/s";
      const h = (v * v) / (2 * G);
      heightVal.textContent = h.toFixed(2) + " m (upper-bound estimate, v²/2g)";
      naiveVal.textContent = "supports weight only — predicts no rise above the rim";
      const mu = 1; // per unit mass-per-length, illustrative
      const extra = mu * v * v;
      extraVal.textContent = extra.toFixed(1) + " × (mass per length) — the widely-cited extra pile-reaction term";

      const rimY = 150, apexY = clamp(rimY - h * 70, 20, rimY);
      arc.setAttribute("d", `M40,${rimY} Q150,${apexY} 260,${rimY}`);
    }
    vSlider.addEventListener("input", render);
    render();
  }

  /* ---- shared time/position lookup for a parametric curve under gravity ---- */
  function buildTimeTable(points) {
    // points: array of {x,y} with y measured downward-positive (drop), x horizontal
    const table = [{ s: 0, t: 0, x: points[0].x, y: points[0].y }];
    let s = 0, tAcc = 0;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i];
      const ds = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const yMid = (p0.y + p1.y) / 2;
      const v = Math.sqrt(Math.max(2 * G * yMid, 0.001));
      const dt = ds / v;
      s += ds; tAcc += dt;
      table.push({ s, t: tAcc, x: p1.x, y: p1.y });
    }
    return table;
  }
  function posAtTime(table, t) {
    if (t <= 0) return table[0];
    if (t >= table[table.length - 1].t) return table[table.length - 1];
    for (let i = 1; i < table.length; i++) {
      if (table[i].t >= t) {
        const a = table[i - 1], b = table[i];
        const f = (t - a.t) / Math.max(b.t - a.t, 1e-9);
        return { x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) };
      }
    }
    return table[table.length - 1];
  }

  /* ============ 7. BRACHISTOCHRONE ============ */
  function initBrachistochrone() {
    const goBtn = document.getElementById("brachGoBtn");
    if (!goBtn) return;
    const resultsEl = document.getElementById("brachResults");
    const svg = document.getElementById("brachSvg");
    const A = { x: 0, y: 0 }, B = { x: 260, y: 130 }; // px units, y is drop
    const PXSCALE = 60; // px per meter for physics calc

    function curvePoints(kind) {
      const N = 120, pts = [];
      if (kind === "line") {
        for (let i = 0; i <= N; i++) { const f = i / N; pts.push({ x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) }); }
      } else if (kind === "parabola") {
        for (let i = 0; i <= N; i++) { const f = i / N; pts.push({ x: A.x + f * (B.x - A.x), y: A.y + f * f * (B.y - A.y) }); }
      } else if (kind === "arc") {
        const r = B.x; // quarter-circle-ish arc from A down-right to B
        for (let i = 0; i <= N; i++) { const f = i / N; const ang = f * (Math.PI / 2); pts.push({ x: r * Math.sin(ang), y: B.y - r * Math.cos(ang) }); }
      } else if (kind === "cycloid") {
        // solve cycloid radius R s.t. curve passes through B: x=R(θ-sinθ), y=R(1-cosθ)
        let R = B.x / Math.PI; // initial guess
        for (let iter = 0; iter < 25; iter++) {
          // binary-search theta for this R such that x(theta)=B.x
          let lo = 0.01, hi = Math.PI * 2;
          for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; (R * (mid - Math.sin(mid)) < B.x ? lo = mid : hi = mid); }
          const theta = (lo + hi) / 2;
          const yAtTheta = R * (1 - Math.cos(theta));
          R *= B.y / Math.max(yAtTheta, 0.001);
        }
        let lo = 0.01, hi = Math.PI * 2;
        for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; (R * (mid - Math.sin(mid)) < B.x ? lo = mid : hi = mid); }
        const thetaMax = (lo + hi) / 2;
        for (let i = 0; i <= N; i++) { const f = i / N; const th = f * thetaMax; pts.push({ x: R * (th - Math.sin(th)), y: R * (1 - Math.cos(th)) }); }
      }
      return pts;
    }
    const kinds = ["line", "arc", "parabola", "cycloid"];
    const colors = { line: "#e34948", arc: "#2a78d6", parabola: "#eb6834", cycloid: "#1baf7a" };
    const curves = {}, tables = {};
    kinds.forEach((k) => {
      curves[k] = curvePoints(k);
      tables[k] = buildTimeTable(curves[k].map((p) => ({ x: p.x, y: p.y / PXSCALE })));
    });

    kinds.forEach((k) => {
      const path = document.getElementById("brachPath-" + k);
      if (path) path.setAttribute("d", "M" + curves[k].map((p) => `${40 + p.x},${20 + p.y}`).join(" L"));
    });

    let running = false, t0 = 0;
    function render() {
      let html = "<table>";
      kinds.forEach((k) => {
        const finalT = tables[k][tables[k].length - 1].t;
        html += `<tr><td class="k"><span class="swatch" style="background:${colors[k]}"></span>${k[0].toUpperCase() + k.slice(1)}</td><td class="v">${finalT.toFixed(3)} s</td></tr>`;
      });
      html += "</table>";
      resultsEl.innerHTML = html;
    }
    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000;
      let anyMoving = false;
      kinds.forEach((k) => {
        const table = tables[k];
        const finalT = table[table.length - 1].t;
        const tt = Math.min(t, finalT);
        if (tt < finalT) anyMoving = true;
        const p = posAtTime(table, tt);
        const el = document.getElementById("brachBead-" + k);
        if (el) { el.setAttribute("cx", 40 + p.x); el.setAttribute("cy", 20 + p.y * PXSCALE); }
      });
      if (anyMoving) requestAnimationFrame(frame);
      else running = false;
    }
    goBtn.addEventListener("click", () => { running = true; t0 = performance.now(); requestAnimationFrame(frame); });
    render();
  }

  /* ============ 8. TAUTOCHRONE ============ */
  function initTautochrone() {
    const goBtn = document.getElementById("tautoGoBtn");
    if (!goBtn) return;
    const periodVal = document.getElementById("tautoPeriodVal");
    const R = 1.3; // meters, arbitrary
    const PXSCALE = 60;
    const thetaMax = Math.PI;
    function cycloidPoint(theta) { return { x: R * (theta - Math.sin(theta)), y: R * (1 - Math.cos(theta)) }; }
    const N = 240;
    const fullCurve = [];
    for (let i = 0; i <= N; i++) fullCurve.push(cycloidPoint((i / N) * thetaMax));
    const svg = document.getElementById("tautoSvg");
    const path = document.getElementById("tautoPath");
    path.setAttribute("d", "M" + fullCurve.map((p) => `${40 + p.x * PXSCALE / R * (60/PXSCALE)},${20 + p.y * PXSCALE}`).join(" L"));
    // simpler: draw using consistent scale
    const drawScale = 90;
    path.setAttribute("d", "M" + fullCurve.map((p) => `${40 + p.x * drawScale},${20 + p.y * drawScale}`).join(" L"));

    const period = 2 * Math.PI * Math.sqrt(R / G);
    periodVal.textContent = (period / 4).toFixed(3) + " s (a quarter period, T/4 with T = 2π√(R/g)), the SAME for every start point";

    const starts = [0.15, 0.4, 0.65, 0.9].map((f) => f * thetaMax);
    const colors = ["#e34948", "#2a78d6", "#eb6834", "#1baf7a"];
    starts.forEach((th0, i) => {
      const startPt = cycloidPoint(th0);
      const el = document.getElementById("tautoBead-" + i);
      if (el) { el.setAttribute("cx", 40 + startPt.x * drawScale); el.setAttribute("cy", 20 + startPt.y * drawScale); el.setAttribute("fill", colors[i]); }
    });

    let running = false, t0 = 0;
    function thetaAtTime(theta0, t) {
      // exact tautochrone solution: phi = arccos(cos(theta0/2 measured from bottom))... use energy-conservation numeric fallback
      // Numerically integrate along the curve from theta0 toward pi (the bottom).
      return null;
    }
    // Precompute per-start time tables via the shared numeric integrator, restricted to [theta0, pi]
    function tableFrom(theta0) {
      const M = 200, pts = [];
      for (let i = 0; i <= M; i++) {
        const th = theta0 + (i / M) * (Math.PI - theta0);
        const p = cycloidPoint(th);
        pts.push({ x: p.x, y: p.y - cycloidPoint(theta0).y }); // y measured as drop from release point
      }
      return buildTimeTable(pts);
    }
    const tables = starts.map(tableFrom);
    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000;
      let anyMoving = false;
      starts.forEach((th0, i) => {
        const table = tables[i];
        const finalT = table[table.length - 1].t;
        const tt = Math.min(t, finalT);
        if (tt < finalT) anyMoving = true;
        const rel = posAtTime(table, tt);
        const base = cycloidPoint(th0);
        const el = document.getElementById("tautoBead-" + i);
        if (el) { el.setAttribute("cx", 40 + (base.x + rel.x) * drawScale); el.setAttribute("cy", 20 + (base.y + rel.y) * drawScale); }
      });
      if (anyMoving) requestAnimationFrame(frame);
      else running = false;
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
      const N = 80;
      let dCat = "", dPara = "";
      let maxDev = 0;
      const yCatAtEdge = a * Math.cosh(halfWidth / a) - a;
      for (let i = 0; i <= N; i++) {
        const x = -halfWidth + (i / N) * 2 * halfWidth;
        const yCat = a * Math.cosh(x / a) - a;
        const yPara = (x * x) / (2 * a);
        maxDev = Math.max(maxDev, Math.abs(yCat - yPara));
        const sx = 150 + x, syCat = 180 - yCat * 0.5, syPara = 180 - yPara * 0.5;
        dCat += (i === 0 ? "M" : "L") + sx + " " + syCat + " ";
        dPara += (i === 0 ? "M" : "L") + sx + " " + syPara + " ";
      }
      catPath.setAttribute("d", dCat);
      paraPath.setAttribute("d", dPara);
      devVal.textContent = maxDev.toFixed(1) + " units at the supports (curves nearly coincide near the bottom)";
    }
    aSlider.addEventListener("input", render);
    render();
  }

  /* ============ 10. TENNIS-RACKET THEOREM ============ */
  function initTennisRacket() {
    const axisButtons = document.querySelectorAll(".racketAxisBtn");
    if (!axisButtons.length) return;
    const svg = document.getElementById("racketSvg");
    const plotPath1 = document.getElementById("racketPlot1");
    const plotPath2 = document.getElementById("racketPlot2");
    const plotPath3 = document.getElementById("racketPlot3");
    const rectEl = document.getElementById("racketRect");
    const statusEl = document.getElementById("racketStatus");
    const I1 = 1, I2 = 2, I3 = 3; // I1 < I2 < I3
    let running = false, w = [0, 0, 0], t = 0, history = [];

    function derivs(w1, w2, w3) {
      return [
        ((I2 - I3) * w2 * w3) / I1,
        ((I3 - I1) * w3 * w1) / I2,
        ((I1 - I2) * w1 * w2) / I3,
      ];
    }
    function reset(axis) {
      running = false;
      t = 0; history = [];
      w = [0.02, 0.02, 0.02];
      w[axis] = 5;
      statusEl.textContent = axis === 1 ? "Spinning about the intermediate axis — watch ω1 and ω3 swap dominance repeatedly (the flip)." : "Spinning about a stable axis — small wobble, no flip.";
    }
    function step(dt) {
      const sub = 0.001;
      let remaining = dt;
      while (remaining > 0) {
        const h = Math.min(sub, remaining);
        const [d1, d2, d3] = derivs(w[0], w[1], w[2]);
        w[0] += d1 * h; w[1] += d2 * h; w[2] += d3 * h;
        remaining -= h;
      }
      t += dt;
    }
    function draw() {
      history.push({ t, w: w.slice() });
      if (history.length > 400) history.shift();
      const maxT = Math.max(1, ...history.map((h) => h.t));
      const maxW = 6;
      [plotPath1, plotPath2, plotPath3].forEach((p, idx) => {
        let d = "";
        history.forEach((h, i) => {
          const px = 40 + (h.t / maxT) * 440;
          const py = 90 - (h.w[idx] / maxW) * 80;
          d += (i === 0 ? "M" : "L") + px + " " + py + " ";
        });
        p.setAttribute("d", d);
      });
      const angle = ((history.length ? history[history.length - 1].w[0] : 0) * t * 20) % 360;
      rectEl.setAttribute("transform", `translate(150,100) rotate(${angle})`);
    }
    function frame(now, last) {
      if (!running) return;
      const dt = Math.min(0.03, Math.max(0, (now - last) / 1000));
      step(dt);
      draw();
      if (t < 12) requestAnimationFrame((n) => frame(n, now));
      else running = false;
    }
    axisButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        axisButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const axis = +btn.dataset.axis;
        reset(axis);
        running = true;
        requestAnimationFrame((n) => frame(n, performance.now()));
      });
    });
    reset(0);
    draw();
  }

  /* ============ 11. GYROSCOPIC PRECESSION ============ */
  function initGyroPrecession() {
    const torqueSlider = document.getElementById("gyroTorqueSlider");
    if (!torqueSlider) return;
    const spinSlider = document.getElementById("gyroSpinSlider");
    const torqueVal = document.getElementById("gyroTorqueVal");
    const spinVal = document.getElementById("gyroSpinVal");
    const omegaVal = document.getElementById("gyroOmegaVal");
    const svg = document.getElementById("gyroSvg");
    const axisLine = document.getElementById("gyroAxisLine");
    let angle = 0, running = true, lastT = performance.now();

    function precessionRate() {
      const tau = +torqueSlider.value;
      const L = +spinSlider.value;
      return tau / L;
    }
    function render() {
      torqueVal.textContent = (+torqueSlider.value).toFixed(2) + " N·m";
      spinVal.textContent = (+spinSlider.value).toFixed(2) + " kg·m²/s";
      const Om = precessionRate();
      omegaVal.textContent = Om.toFixed(3) + " rad/s";
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      angle += precessionRate() * dt;
      const cx = 150, cy = 100, r = 70;
      axisLine.setAttribute("x1", cx); axisLine.setAttribute("y1", cy);
      axisLine.setAttribute("x2", cx + r * Math.cos(angle)); axisLine.setAttribute("y2", cy + r * Math.sin(angle));
      requestAnimationFrame(frame);
    }
    [torqueSlider, spinSlider].forEach((s) => s.addEventListener("input", render));
    render();
    requestAnimationFrame(frame);
  }

  /* ============ 12. BEAD ON A ROTATING HOOP ============ */
  function initRotatingHoop() {
    const omegaSlider = document.getElementById("hoopOmegaSlider");
    if (!omegaSlider) return;
    const omegaVal = document.getElementById("hoopOmegaVal");
    const omegaCVal = document.getElementById("hoopOmegaCVal");
    const eqVal = document.getElementById("hoopEqVal");
    const svg = document.getElementById("hoopSvg");
    const bead = document.getElementById("hoopBead");
    const bead2 = document.getElementById("hoopBead2");
    const bifPath1 = document.getElementById("hoopBifPath1");
    const bifPath2 = document.getElementById("hoopBifPath2");
    const bifMarker = document.getElementById("hoopBifMarker");

    const R = 1.0; // meters
    const omegaC = Math.sqrt(G / R);
    const cx = 90, cy = 100, rPx = 70;

    function render() {
      const Om = +omegaSlider.value / 10;
      omegaVal.textContent = Om.toFixed(2) + " rad/s";
      omegaCVal.textContent = omegaC.toFixed(2) + " rad/s";

      bead2.style.display = "none";
      let theta = 0;
      if (Om <= omegaC) {
        eqVal.textContent = "Only the bottom (θ=0) is stable.";
        theta = 0;
      } else {
        theta = Math.acos(G / (Om * Om * R));
        eqVal.textContent = "Bottom is now unstable; two new stable equilibria at θ = ±" + ((theta * 180) / Math.PI).toFixed(1) + "°";
        bead2.style.display = "";
      }
      const bx = cx + rPx * Math.sin(theta), by = cy - rPx * Math.cos(theta);
      bead.setAttribute("cx", bx); bead.setAttribute("cy", by);
      const bx2 = cx - rPx * Math.sin(theta);
      bead2.setAttribute("cx", bx2); bead2.setAttribute("cy", by);

      // bifurcation diagram: x-axis Omega (0..2*omegaC), y-axis equilibrium theta
      const W = 220, H = 100, x0 = 260, y0 = 20;
      let d1 = "M" + x0 + "," + (y0 + H / 2);
      const omMax = 2 * omegaC;
      for (let i = 0; i <= 60; i++) {
        const om = (i / 60) * omMax;
        const th = om <= omegaC ? 0 : Math.acos(G / (om * om * R));
        const px = x0 + (om / omMax) * W;
        const py = y0 + H / 2 - (th / Math.PI) * H;
        d1 += " L" + px + "," + py;
      }
      let d2 = "M" + x0 + "," + (y0 + H / 2);
      for (let i = 0; i <= 60; i++) {
        const om = (i / 60) * omMax;
        const th = om <= omegaC ? 0 : -Math.acos(G / (om * om * R));
        const px = x0 + (om / omMax) * W;
        const py = y0 + H / 2 - (th / Math.PI) * H;
        d2 += " L" + px + "," + py;
      }
      bifPath1.setAttribute("d", d1);
      bifPath2.setAttribute("d", d2);
      const markerX = x0 + (Om / omMax) * W;
      const markerY = y0 + H / 2 - (theta / Math.PI) * H;
      bifMarker.setAttribute("cx", clamp(markerX, x0, x0 + W));
      bifMarker.setAttribute("cy", markerY);
    }
    omegaSlider.addEventListener("input", render);
    render();
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
  });
})();
