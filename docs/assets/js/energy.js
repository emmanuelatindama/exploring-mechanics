// Interactive widgets for docs/03-energy/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained and
// bails out safely if its DOM anchor is missing (so partial HTML never errors).
(function () {
  const G = 9.8;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function num(el, attr, fallback) {
    const v = el && parseFloat(el.getAttribute(attr));
    return Number.isFinite(v) ? v : fallback;
  }
  function clientToSvg(svg, evt) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const sx = vb.width / rect.width;
    const sy = vb.height / rect.height;
    return { x: (evt.clientX - rect.left) * sx + vb.x, y: (evt.clientY - rect.top) * sy + vb.y };
  }
  function makeDraggable(handle, svg, onMove) {
    handle.addEventListener("pointerdown", (e) => {
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = "grabbing";
    });
    handle.addEventListener("pointermove", (e) => {
      if (e.buttons !== 1) return;
      onMove(clientToSvg(svg, e));
    });
    handle.addEventListener("pointerup", () => { handle.style.cursor = "grab"; });
  }

  // ===============================================================
  // WORK — Widget 1: Force-Distance Graph (unchanged: physics OK)
  // ===============================================================
  function initWorkGraph() {
    const svg = document.getElementById("wkGraphSvg");
    if (!svg) return;
    const areaPath = document.getElementById("wkAreaPath");
    const linePath = document.getElementById("wkLinePath");
    const fRow = document.getElementById("wkFRow");
    const kRow = document.getElementById("wkKRow");
    const fSlider = document.getElementById("wkFSlider");
    const fVal = document.getElementById("wkFVal");
    const kSlider = document.getElementById("wkKSlider");
    const kVal = document.getElementById("wkKVal");
    const dSlider = document.getElementById("wkDSlider");
    const dVal = document.getElementById("wkDVal");
    const forceAtVal = document.getElementById("wkForceAtVal");
    const workVal = document.getElementById("wkWorkVal");
    const modeButtons = Array.from(document.querySelectorAll("#wkModeToggle button"));
    const DOMAIN_MAX = 10;
    let mode = "constant";

    function redraw() {
      const d = parseFloat(dSlider.value);
      let forceAt, work, yMax, lineEnd;
      if (mode === "constant") {
        const F = parseFloat(fSlider.value);
        forceAt = F; work = F * d; yMax = 60; lineEnd = F;
      } else {
        const k = parseFloat(kSlider.value);
        forceAt = k * d; work = 0.5 * k * d * d; yMax = 550; lineEnd = k * DOMAIN_MAX;
      }
      dVal.textContent = d + " m";
      forceAtVal.textContent = forceAt.toFixed(1) + " N";
      workVal.textContent = work.toFixed(1) + " J";
      const toX = (x) => 40 + (x / DOMAIN_MAX) * 400;
      const toY = (y) => 170 - (clamp(y, 0, yMax) / yMax) * 160;
      if (mode === "constant") {
        linePath.setAttribute("d", "M" + toX(0) + "," + toY(forceAt) + " L" + toX(DOMAIN_MAX) + "," + toY(forceAt));
        areaPath.setAttribute("d", "M" + toX(0) + "," + toY(0) + " L" + toX(d) + "," + toY(0) + " L" + toX(d) + "," + toY(forceAt) + " L" + toX(0) + "," + toY(forceAt) + " Z");
      } else {
        linePath.setAttribute("d", "M" + toX(0) + "," + toY(0) + " L" + toX(DOMAIN_MAX) + "," + toY(lineEnd));
        areaPath.setAttribute("d", "M" + toX(0) + "," + toY(0) + " L" + toX(d) + "," + toY(0) + " L" + toX(d) + "," + toY(forceAt) + " Z");
      }
    }
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        fRow.style.display = mode === "constant" ? "" : "none";
        kRow.style.display = mode === "spring" ? "" : "none";
        redraw();
      });
    });
    fSlider.addEventListener("input", () => { fVal.textContent = fSlider.value + " N"; redraw(); });
    kSlider.addEventListener("input", () => { kVal.textContent = kSlider.value + " N/m"; redraw(); });
    dSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // WORK — Widget 2: Pulling Lab  (FIXED: coast to a smooth stop)
  // ===============================================================
  function initPullingLab() {
    const svg = document.getElementById("wkPullSvg");
    if (!svg) return;
    const box = document.getElementById("wkPullBox");
    const fSlider = document.getElementById("wkPullFSlider");
    const fVal = document.getElementById("wkPullFVal");
    const dSlider = document.getElementById("wkPullDSlider");
    const dVal = document.getElementById("wkPullDVal");
    const mSlider = document.getElementById("wkPullMSlider");
    const mVal = document.getElementById("wkPullMVal");
    const muSlider = document.getElementById("wkPullMuSlider");
    const muVal = document.getElementById("wkPullMuVal");
    const goBtn = document.getElementById("wkPullGoBtn");
    const wAppliedVal = document.getElementById("wkWAppliedVal");
    const wFrictionVal = document.getElementById("wkWFrictionVal");
    const wNetVal = document.getElementById("wkWNetVal");
    const vFinalVal = document.getElementById("wkVFinalVal");
    const coastVal = document.getElementById("wkCoastVal");   // optional
    const noteEl = document.getElementById("wkPullNote");     // optional

    const BOX_X0 = 20, AVAIL_PX = 380, SIM_SPEED = 1.4;
    let animating = false, rafId = null;

    function current() {
      const F = parseFloat(fSlider.value);
      const d = parseFloat(dSlider.value);
      const m = parseFloat(mSlider.value);
      const mu = parseFloat(muSlider.value);
      const fFric = mu * m * G;
      const netForce = F - fFric;               // during the pull
      const wApplied = F * d;
      const wFriction = -fFric * d;
      const wNet = wApplied + wFriction;
      const moves = netForce > 1e-6;
      const a1 = moves ? netForce / m : 0;       // acceleration while pulling
      const vFinal = moves ? Math.sqrt(2 * a1 * d) : 0;
      const a2 = mu > 0 ? mu * G : 0;            // deceleration after force removed
      const coastDist = moves ? (a2 > 0 ? (vFinal * vFinal) / (2 * a2) : Infinity) : 0;
      return { F, d, m, mu, fFric, netForce, wApplied, wFriction, wNet, moves, a1, vFinal, a2, coastDist };
    }

    function redraw() {
      const c = current();
      fVal.textContent = c.F + " N";
      dVal.textContent = c.d + " m";
      mVal.textContent = c.m + " kg";
      muVal.textContent = c.mu.toFixed(2);
      wAppliedVal.textContent = c.wApplied.toFixed(1) + " J";
      wFrictionVal.textContent = c.wFriction.toFixed(1) + " J";
      wNetVal.textContent = c.wNet.toFixed(1) + " J";
      vFinalVal.textContent = c.vFinal.toFixed(2) + " m/s";
      if (coastVal) coastVal.textContent = c.moves ? (isFinite(c.coastDist) ? c.coastDist.toFixed(2) + " m" : "∞ (frictionless)") : "0 m";
      if (noteEl) {
        noteEl.textContent = c.moves
          ? "The pull accelerates the box over " + c.d + " m, then it coasts and friction brings it to rest."
          : "Applied force ≤ friction — the box stays put (no net work).";
      }
    }
    [fSlider, dSlider, mSlider, muSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    box.setAttribute("x", BOX_X0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const c = current();
      box.setAttribute("x", BOX_X0);
      if (!c.moves) { redraw(); return; }

      const displayDist = isFinite(c.coastDist) ? c.d + c.coastDist : c.d * 2;
      const scale = AVAIL_PX / Math.max(displayDist, c.d, 1);
      const t1 = c.vFinal / c.a1;                        // pulling phase duration
      const t2 = c.a2 > 0 ? c.vFinal / c.a2 : Infinity;  // coasting phase duration
      const tEnd = c.a2 > 0 ? t1 + t2 : Infinity;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const tp = ((now - start) / 1000) * SIM_SPEED;
        let x;
        if (tp <= t1) {
          x = 0.5 * c.a1 * tp * tp;                       // accelerating
        } else if (c.a2 > 0 && tp <= tEnd) {
          const td = tp - t1;
          x = c.d + c.vFinal * td - 0.5 * c.a2 * td * td; // decelerating (coast)
        } else if (c.a2 > 0) {
          x = c.d + c.coastDist;                          // stopped
        } else {
          x = c.d + c.vFinal * (tp - t1);                 // frictionless glide
        }
        const xpx = BOX_X0 + x * scale;
        box.setAttribute("x", xpx);
        const done = (c.a2 > 0 && tp >= tEnd) || xpx > BOX_X0 + AVAIL_PX;
        if (done) { animating = false; goBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // WORK — Widget 3: Positive/Negative/Zero (unchanged: physics OK)
  // ===============================================================
  function initAngleWork() {
    const svg = document.getElementById("wkAngleSvg");
    if (!svg) return;
    const forceArrow = document.getElementById("wkAngleForce");
    const arc = document.getElementById("wkAngleArc");
    const thetaSlider = document.getElementById("wkAngleThetaSlider");
    const thetaVal = document.getElementById("wkAngleThetaVal");
    const cosVal = document.getElementById("wkAngleCosVal");
    const wVal = document.getElementById("wkAngleWVal");
    const signVal = document.getElementById("wkAngleSignVal");
    const ORIGIN = { x: 30, y: 120 }, LEN = 60, F = 20, D = 3;

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const cosTheta = Math.cos(theta);
      const w = F * D * cosTheta;
      thetaVal.textContent = thetaDeg + "°";
      cosVal.textContent = cosTheta.toFixed(3);
      wVal.textContent = w.toFixed(1) + " J";
      signVal.textContent = w > 0.05 ? "Positive" : w < -0.05 ? "Negative" : "Zero";
      const fx = ORIGIN.x + LEN * Math.cos(theta);
      const fy = ORIGIN.y - LEN * Math.sin(theta);
      forceArrow.setAttribute("x2", fx);
      forceArrow.setAttribute("y2", fy);
      const r = 28;
      const arcEnd = { x: ORIGIN.x + r * Math.cos(theta), y: ORIGIN.y - r * Math.sin(theta) };
      const large = thetaDeg > 180 ? 1 : 0;
      arc.setAttribute("d", "M" + (ORIGIN.x + r) + "," + ORIGIN.y + " A " + r + " " + r + " 0 " + large + " 1 " + arcEnd.x + "," + arcEnd.y);
    }
    thetaSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // KINETIC ENERGY — Widget 1: KE Plotter (unchanged: physics OK)
  // ===============================================================
  function initKEPlotter() {
    const svg = document.getElementById("keGraphSvg");
    if (!svg) return;
    const curvePath = document.getElementById("keCurvePath");
    const marker = document.getElementById("keMarker");
    const vSlider = document.getElementById("keVSlider");
    const vVal = document.getElementById("keVVal");
    const mSlider = document.getElementById("keMSlider");
    const mVal = document.getElementById("keMVal");
    const keVal = document.getElementById("keKEVal");
    const doubleVal = document.getElementById("keDoubleVal");
    const V_MAX = 40;
    const toX = (v) => 40 + (v / V_MAX) * 400;

    function redraw() {
      const v = parseFloat(vSlider.value);
      const m = parseFloat(mSlider.value);
      const ke = 0.5 * m * v * v;
      const keDouble = 0.5 * m * (2 * v) * (2 * v);
      const keMax = 0.5 * m * V_MAX * V_MAX;
      const toY = (k) => 170 - (k / keMax) * 160;
      vVal.textContent = v + " m/s";
      mVal.textContent = m + " kg";
      keVal.textContent = ke.toFixed(0) + " J";
      doubleVal.textContent = keDouble.toFixed(0) + " J (4×)";
      let d = "";
      for (let vv = 0; vv <= V_MAX; vv += 1) d += (vv === 0 ? "M" : "L") + toX(vv) + "," + toY(0.5 * m * vv * vv) + " ";
      curvePath.setAttribute("d", d);
      marker.setAttribute("cx", toX(v));
      marker.setAttribute("cy", toY(ke));
    }
    vSlider.addEventListener("input", redraw);
    mSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // KINETIC ENERGY — Widget 2: Collision  (FIXED: no vanishing ball)
  // ===============================================================
  function initKECollision() {
    const svg = document.getElementById("keCollideSvg");
    if (!svg) return;
    const ball1 = document.getElementById("keBall1");
    const ball2 = document.getElementById("keBall2");
    const m1Slider = document.getElementById("keM1Slider");
    const m1Val = document.getElementById("keM1Val");
    const v1Slider = document.getElementById("keV1Slider");
    const v1Val = document.getElementById("keV1Val");
    const m2Slider = document.getElementById("keM2Slider");
    const m2Val = document.getElementById("keM2Val");
    const collideBtn = document.getElementById("keCollideBtn");
    const keBeforeVal = document.getElementById("keKEBeforeVal");
    const keAfterVal = document.getElementById("keKEAfterVal");
    const keLostVal = document.getElementById("keKELostVal");
    const modeButtons = Array.from(document.querySelectorAll("#keCollideToggle button"));

    const BALL1_X0 = 60, BALL2_X0 = 220, PXPM = 8, SIM_SPEED = 1.0, MAX_T = 6;
    const R1 = num(ball1, "r", 18), R2 = num(ball2, "r", 18);
    const W = (svg.viewBox && svg.viewBox.baseVal.width) || 320;
    let mode = "inelastic", animating = false, rafId = null;

    function current() {
      const m1 = parseFloat(m1Slider.value);
      const v1 = parseFloat(v1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const keBefore = 0.5 * m1 * v1 * v1;
      let v1f, v2f, keAfter;
      if (mode === "inelastic") {
        const vf = (m1 * v1) / (m1 + m2);
        v1f = vf; v2f = vf;
        keAfter = 0.5 * (m1 + m2) * vf * vf;
      } else {
        v1f = ((m1 - m2) / (m1 + m2)) * v1;
        v2f = ((2 * m1) / (m1 + m2)) * v1;
        keAfter = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;
      }
      return { m1, v1, m2, v1f, v2f, keBefore, keAfter };
    }

    function redraw() {
      const { m1, v1, m2, keBefore, keAfter } = current();
      m1Val.textContent = m1 + " kg";
      v1Val.textContent = v1 + " m/s";
      m2Val.textContent = m2 + " kg";
      keBeforeVal.textContent = keBefore.toFixed(1) + " J";
      keAfterVal.textContent = keAfter.toFixed(1) + " J";
      keLostVal.textContent = keBefore > 0 ? (((keBefore - keAfter) / keBefore) * 100).toFixed(1) + "%" : "0%";
    }
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        redraw();
      });
    });
    [m1Slider, v1Slider, m2Slider].forEach((s) => s.addEventListener("input", () => {
      if (!animating) { ball1.setAttribute("cx", BALL1_X0); ball2.setAttribute("cx", BALL2_X0); }
      redraw();
    }));
    redraw();
    ball1.setAttribute("cx", BALL1_X0);
    ball2.setAttribute("cx", BALL2_X0);

    collideBtn.addEventListener("click", () => {
      if (animating) return;
      const { v1, v1f, v2f } = current();
      if (v1 <= 0) { redraw(); return; }

      let cx1 = BALL1_X0, cx2 = BALL2_X0;
      let phase = "pre";
      animating = true;
      collideBtn.disabled = true;
      const start = performance.now();
      let last = start;

      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000) * SIM_SPEED;
        last = now;
        const elapsed = (now - start) / 1000;

        if (phase === "pre") {
          cx1 += v1 * PXPM * dt;
          if (cx2 - cx1 <= R1 + R2) {         // contact detected
            cx1 = cx2 - (R1 + R2);            // snap to exact contact (no overlap/teleport)
            phase = "post";
          }
        } else {
          cx1 += v1f * PXPM * dt;
          cx2 += v2f * PXPM * dt;
          if (mode === "inelastic") cx1 = cx2 - (R1 + R2); // move together, stay visible
        }
        ball1.setAttribute("cx", cx1);
        ball2.setAttribute("cx", cx2);

        const outOfView = cx2 > W - R2 || cx1 < R1 || cx1 > W - R1;
        if (elapsed > MAX_T || (phase === "post" && outOfView)) {
          animating = false; collideBtn.disabled = false; return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // POTENTIAL ENERGY — Widget 1: Skate-Park (unchanged: physics OK)
  // ===============================================================
  function initSkatePark() {
    const svg = document.getElementById("epBowlSvg");
    if (!svg) return;
    const bowlPath = document.getElementById("epBowlPath");
    const ball = document.getElementById("epBall");
    const barKE = document.getElementById("epBarKE");
    const barPE = document.getElementById("epBarPE");
    const barHeat = document.getElementById("epBarHeat");
    const h0Slider = document.getElementById("epH0Slider");
    const h0Val = document.getElementById("epH0Val");
    const frictionBox = document.getElementById("epFriction");
    const goBtn = document.getElementById("epGoBtn");
    const keVal = document.getElementById("epKEVal");
    const peVal = document.getElementById("epPEVal");
    const heatVal = document.getElementById("epHeatVal");
    const totalVal = document.getElementById("epTotalVal");

    const CX = 230, CY = 190, W_PX = 200, H0_PX = 170, H0_PHYS = 6, M = 2, BAR_MAX = 90;
    const hPhys = (s) => H0_PHYS * s * s;
    const yScreen = (s) => CY - H0_PX * s * s;
    let d = "";
    for (let i = 0; i <= 40; i++) { const s = -1 + (2 * i) / 40; d += (i === 0 ? "M" : "L") + (CX + s * W_PX) + "," + yScreen(s) + " "; }
    bowlPath.setAttribute("d", d);
    let animating = false, rafId = null;

    function setBars(ke, pe, heat, total) {
      keVal.textContent = ke.toFixed(0) + " J";
      peVal.textContent = pe.toFixed(0) + " J";
      heatVal.textContent = heat.toFixed(0) + " J";
      totalVal.textContent = (ke + pe + heat).toFixed(0) + " J";
      const scale = total > 0 ? BAR_MAX / total : 0;
      barKE.setAttribute("y", 100 - ke * scale); barKE.setAttribute("height", ke * scale);
      barPE.setAttribute("y", 100 - pe * scale); barPE.setAttribute("height", pe * scale);
      barHeat.setAttribute("y", 100 - heat * scale); barHeat.setAttribute("height", heat * scale);
    }
    function place(s) { ball.setAttribute("cx", CX + s * W_PX); ball.setAttribute("cy", yScreen(s)); }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; goBtn.disabled = false;
      const pct = parseFloat(h0Slider.value);
      const h0 = (pct / 100) * H0_PHYS;
      const s0 = Math.sqrt(h0 / H0_PHYS) * (pct >= 0 ? 1 : -1);
      place(s0);
      const total = M * G * h0;
      setBars(0, total, 0, total);
    }
    h0Slider.addEventListener("input", () => { h0Val.textContent = h0Slider.value + "%"; reset(); });
    reset();

    const OMEGA2 = 2 * G * H0_PHYS;
    goBtn.addEventListener("click", () => {
      if (animating) return;
      const pct = parseFloat(h0Slider.value);
      const h0 = (pct / 100) * H0_PHYS;
      const total0 = M * G * h0;
      let s = Math.sqrt(h0 / H0_PHYS), vs = 0;
      const damping = frictionBox.checked ? 1.0 : 0;
      const maxDuration = 12;
      animating = true; goBtn.disabled = true;
      const start = performance.now(); let last = start; const SUBSTEP = 0.005;
      function frame(now) {
        let remaining = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
        const elapsed = (now - start) / 1000;
        while (remaining > 0) {
          const h = Math.min(SUBSTEP, remaining);
          const a = -OMEGA2 * s - damping * vs;
          vs += a * h; s = clamp(s + vs * h, -1, 1); remaining -= h;
        }
        const ke = 0.5 * M * vs * vs;
        const pe = M * G * hPhys(s);
        const heat = Math.max(0, total0 - ke - pe);
        setBars(ke, pe, heat, total0); place(s);
        if (elapsed >= maxDuration || (damping > 0 && Math.abs(vs) < 0.01 && Math.abs(s) < 0.02)) {
          animating = false; goBtn.disabled = false; return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // POTENTIAL ENERGY — Widget 2: Spring-Launch (unchanged: physics OK)
  // ===============================================================
  function initSpringLaunch() {
    const svg = document.getElementById("slSvg");
    if (!svg) return;
    const rampFill = document.getElementById("slRampFill");
    const spring = document.getElementById("slSpring");
    const ball = document.getElementById("slBall");
    const kSlider = document.getElementById("slKSlider");
    const kVal = document.getElementById("slKVal");
    const xSlider = document.getElementById("slXSlider");
    const xVal = document.getElementById("slXVal");
    const mSlider = document.getElementById("slMSlider");
    const mVal = document.getElementById("slMVal");
    const goBtn = document.getElementById("slGoBtn");
    const peVal = document.getElementById("slPEVal");
    const vVal = document.getElementById("slVVal");
    const hVal = document.getElementById("slHVal");

    const RAMP_BASE = { x: 90, y: 180 }, RAMP_TOP = { x: 290, y: 40 };
    rampFill.setAttribute("d", "M" + RAMP_BASE.x + "," + RAMP_BASE.y + " L" + RAMP_TOP.x + "," + RAMP_TOP.y + " L" + RAMP_TOP.x + "," + RAMP_BASE.y + " Z");
    let animating = false, rafId = null;

    function current() {
      const k = parseFloat(kSlider.value);
      const x = parseFloat(xSlider.value);
      const m = parseFloat(mSlider.value);
      const pe = 0.5 * k * x * x;
      const v = Math.sqrt((k * x * x) / m);
      const h = pe / (m * G);
      return { k, x, m, pe, v, h };
    }
    function redraw() {
      const { k, x, m, pe, v, h } = current();
      kVal.textContent = k + " N/m";
      xVal.textContent = x.toFixed(2) + " m";
      mVal.textContent = m.toFixed(1) + " kg";
      peVal.textContent = pe.toFixed(1) + " J";
      vVal.textContent = v.toFixed(2) + " m/s";
      hVal.textContent = h.toFixed(2) + " m";
      const coils = 6, springLen = 30 + x * 60;
      let sd = "M" + (RAMP_BASE.x - 60) + "," + RAMP_BASE.y;
      for (let i = 1; i <= coils; i++) {
        const cx = RAMP_BASE.x - 60 + (springLen / coils) * i;
        const cy = RAMP_BASE.y + (i % 2 === 0 ? -8 : 8);
        sd += " L" + cx + "," + cy;
      }
      spring.setAttribute("d", sd);
      ball.setAttribute("cx", RAMP_BASE.x - 60 + springLen + 9);
      ball.setAttribute("cy", RAMP_BASE.y);
    }
    [kSlider, xSlider, mSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      redraw();
      const { h } = current();
      const rampHeightM = 3;
      const fracMax = Math.min(1, h / rampHeightM);
      animating = true; goBtn.disabled = true;
      const ANIM_SECONDS = 1.5; const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        // ease-out so it visibly decelerates approaching its max height
        const p = 1 - Math.pow(1 - t / ANIM_SECONDS, 2);
        const frac = p * fracMax;
        ball.setAttribute("cx", RAMP_BASE.x + frac * (RAMP_TOP.x - RAMP_BASE.x));
        ball.setAttribute("cy", RAMP_BASE.y + frac * (RAMP_TOP.y - RAMP_BASE.y));
        if (t >= ANIM_SECONDS) { animating = false; goBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // POTENTIAL ENERGY — Widget 3: Pendulum  (FIXED: real ODE + energy)
  // ===============================================================
  function initPendulumEnergy() {
    const svg = document.getElementById("penSvg");
    if (!svg) return;
    const rod = document.getElementById("penRod");
    const bob = document.getElementById("penBob");
    const thetaSlider = document.getElementById("penThetaSlider");
    const thetaVal = document.getElementById("penThetaVal");
    const lSlider = document.getElementById("penLSlider");
    const lVal = document.getElementById("penLVal");
    const goBtn = document.getElementById("penGoBtn");
    const hVal = document.getElementById("penHVal");
    const vVal = document.getElementById("penVVal");
    const keBar = document.getElementById("penKEBar");   // optional
    const peBar = document.getElementById("penPEBar");   // optional
    const keVal = document.getElementById("penKEVal");   // optional (per-kg J)
    const peVal = document.getElementById("penPEVal");   // optional (per-kg J)

    const PIVOT = { x: 130, y: 20 }, L_PX = 150, BAR_MAX = 90;
    let animating = false, rafId = null;

    function params() {
      const theta0 = (parseFloat(thetaSlider.value) * Math.PI) / 180;
      const L = parseFloat(lSlider.value);
      return { theta0, L };
    }
    function place(theta) {
      const bx = PIVOT.x + L_PX * Math.sin(theta);
      const by = PIVOT.y + L_PX * Math.cos(theta);
      rod.setAttribute("x2", bx); rod.setAttribute("y2", by);
      bob.setAttribute("cx", bx); bob.setAttribute("cy", by);
    }
    function showEnergy(L, theta0, theta, omega) {
      const hMax = L * (1 - Math.cos(theta0));
      const h = L * (1 - Math.cos(theta));
      const v = Math.abs(omega) * L;                 // bob speed = L·|ω|
      hVal.textContent = h.toFixed(2) + " m";
      vVal.textContent = v.toFixed(2) + " m/s";
      const kePerKg = G * (hMax - h);                // = ½v²
      const pePerKg = G * h;
      const total = G * hMax || 1;
      if (keVal) keVal.textContent = kePerKg.toFixed(2) + " J/kg";
      if (peVal) peVal.textContent = pePerKg.toFixed(2) + " J/kg";
      if (keBar) { const hh = (kePerKg / total) * BAR_MAX; keBar.setAttribute("height", hh); keBar.setAttribute("y", 100 - hh); }
      if (peBar) { const hh = (pePerKg / total) * BAR_MAX; peBar.setAttribute("height", hh); peBar.setAttribute("y", 100 - hh); }
    }
    function redrawStatic() {
      const { theta0, L } = params();
      thetaVal.textContent = parseFloat(thetaSlider.value) + "°";
      lVal.textContent = L.toFixed(1) + " m";
      place(theta0);
      showEnergy(L, theta0, theta0, 0);
    }
    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; goBtn.textContent = "Swing"; redrawStatic();
    }
    thetaSlider.addEventListener("input", () => { if (!animating) redrawStatic(); });
    lSlider.addEventListener("input", () => { if (!animating) redrawStatic(); });
    redrawStatic();

    goBtn.addEventListener("click", () => {
      if (animating) { stop(); return; }        // toggle stop
      const { theta0, L } = params();
      let theta = theta0, omega = 0;             // released from rest
      animating = true; goBtn.textContent = "Stop";
      const start = performance.now(); let last = start; const SUBSTEP = 0.004;
      function frame(now) {
        let remaining = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
        while (remaining > 0) {                  // exact large-angle pendulum ODE
          const dt = Math.min(SUBSTEP, remaining);
          const alpha = -(G / L) * Math.sin(theta);   // θ¨ = -(g/L) sinθ
          omega += alpha * dt;                        // semi-implicit Euler (energy-stable)
          theta += omega * dt;
          remaining -= dt;
        }
        place(theta);
        showEnergy(L, theta0, theta, omega);
        rafId = requestAnimationFrame(frame);     // ideal pendulum: swings indefinitely
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // CONSERVATION — Energy Accounting (unchanged: physics OK)
  // ===============================================================
  function initEnergyAccounting() {
    const svg = document.getElementById("eaGraphSvg");
    if (!svg) return;
    const kePath = document.getElementById("eaKEPath");
    const pePath = document.getElementById("eaPEPath");
    const heatPath = document.getElementById("eaHeatPath");
    const markerLine = document.getElementById("eaMarkerLine");
    const brakingControls = document.getElementById("eaBrakingControls");
    const fallingControls = document.getElementById("eaFallingControls");
    const v0Slider = document.getElementById("eaV0Slider");
    const v0Val = document.getElementById("eaV0Val");
    const muSlider = document.getElementById("eaMuSlider");
    const muVal = document.getElementById("eaMuVal");
    const y0Slider = document.getElementById("eaY0Slider");
    const y0Val = document.getElementById("eaY0Val");
    const bSlider = document.getElementById("eaBSlider");
    const bVal = document.getElementById("eaBVal");
    const playBtn = document.getElementById("eaPlayBtn");
    const keVal = document.getElementById("eaKEVal");
    const peVal = document.getElementById("eaPEVal");
    const heatVal = document.getElementById("eaHeatVal");
    const totalVal = document.getElementById("eaTotalVal");
    const modeButtons = Array.from(document.querySelectorAll("#eaModeToggle button"));
    const M = 5;
    let mode = "braking", animating = false, rafId = null;

    function computeSeries() {
      const series = { t: [], ke: [], pe: [], heat: [] };
      if (mode === "braking") {
        const v0 = parseFloat(v0Slider.value), mu = parseFloat(muSlider.value);
        const a = mu * G, tStop = v0 / a, e0 = 0.5 * M * v0 * v0, N = 60;
        for (let i = 0; i <= N; i++) {
          const t = (tStop * i) / N, v = Math.max(0, v0 - a * t), ke = 0.5 * M * v * v;
          series.t.push(t); series.ke.push(ke); series.pe.push(0); series.heat.push(e0 - ke);
        }
      } else {
        const y0 = parseFloat(y0Slider.value), b = parseFloat(bSlider.value), e0 = M * G * y0;
        let y = y0, v = 0, t = 0; const dt = 0.02;
        while (y > 0 && t < 30) {
          const ke = 0.5 * M * v * v, pe = M * G * Math.max(0, y);
          series.t.push(t); series.ke.push(ke); series.pe.push(pe); series.heat.push(e0 - ke - pe);
          const a = G - b * v * v; v += a * dt; y -= v * dt; t += dt;
        }
      }
      return series;
    }
    let series = computeSeries();
    function drawCurves() {
      const tMax = series.t[series.t.length - 1] || 1;
      const e0 = series.ke[0] + series.pe[0] + series.heat[0];
      const yMax = Math.max(e0, 1);
      const toX = (t) => 40 + (t / tMax) * 400;
      const toY = (e) => 170 - (clamp(e, 0, yMax) / yMax) * 160;
      function pathFor(arr) { let d = ""; series.t.forEach((t, i) => { d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(arr[i]) + " "; }); return d; }
      kePath.setAttribute("d", pathFor(series.ke));
      pePath.setAttribute("d", pathFor(series.pe));
      heatPath.setAttribute("d", pathFor(series.heat));
      return { toX, tMax };
    }
    let { toX } = drawCurves();
    function showAt(frac) {
      const idx = Math.min(series.t.length - 1, Math.round(frac * (series.t.length - 1)));
      const x = toX(series.t[idx]);
      markerLine.setAttribute("x1", x); markerLine.setAttribute("x2", x);
      keVal.textContent = series.ke[idx].toFixed(1) + " J";
      peVal.textContent = series.pe[idx].toFixed(1) + " J";
      heatVal.textContent = series.heat[idx].toFixed(1) + " J";
      totalVal.textContent = (series.ke[idx] + series.pe[idx] + series.heat[idx]).toFixed(1) + " J";
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; playBtn.disabled = false;
      series = computeSeries(); const drawn = drawCurves(); toX = drawn.toX; showAt(0);
    }
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active"); mode = btn.dataset.mode;
        brakingControls.style.display = mode === "braking" ? "" : "none";
        fallingControls.style.display = mode === "falling" ? "" : "none";
        reset();
      });
    });
    [v0Slider, muSlider, y0Slider, bSlider].forEach((s) => s.addEventListener("input", reset));
    v0Slider.addEventListener("input", () => { v0Val.textContent = v0Slider.value + " m/s"; });
    muSlider.addEventListener("input", () => { muVal.textContent = parseFloat(muSlider.value).toFixed(2); });
    y0Slider.addEventListener("input", () => { y0Val.textContent = y0Slider.value + " m"; });
    bSlider.addEventListener("input", () => { bVal.textContent = parseFloat(bSlider.value).toFixed(3); });
    reset();
    playBtn.addEventListener("click", () => {
      if (animating) return;
      animating = true; playBtn.disabled = true;
      const ANIM_SECONDS = 3; const start = performance.now();
      function frame(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / 1000 / ANIM_SECONDS));
        showAt(frac);
        if (frac >= 1) { animating = false; playBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // POWER — Widget 1: Stair-Climbing (unchanged: physics OK)
  // ===============================================================
  function initStairPower() {
    const svg = document.getElementById("pwrStairSvg");
    if (!svg) return;
    const stairPath = document.getElementById("pwrStairPath");
    const dot = document.getElementById("pwrStairDot");
    const mSlider = document.getElementById("pwrMSlider");
    const mVal = document.getElementById("pwrMVal");
    const hSlider = document.getElementById("pwrHSlider");
    const hVal = document.getElementById("pwrHVal");
    const tSlider = document.getElementById("pwrTSlider");
    const tVal = document.getElementById("pwrTVal");
    const goBtn = document.getElementById("pwrGoBtn");
    const wVal = document.getElementById("pwrWVal");
    const pVal = document.getElementById("pwrPVal");
    const hpVal = document.getElementById("pwrHPVal");
    const bulbVal = document.getElementById("pwrBulbVal");
    const STEPS = 6, X0 = 20, Y0 = 140, X1 = 180, Y1 = 20;
    let d = "M" + X0 + "," + Y0;
    for (let i = 1; i <= STEPS; i++) {
      const x = X0 + ((X1 - X0) * i) / STEPS;
      const yPrev = Y0 + ((Y1 - Y0) * (i - 1)) / STEPS;
      const y = Y0 + ((Y1 - Y0) * i) / STEPS;
      d += " L" + x + "," + yPrev + " L" + x + "," + y;
    }
    stairPath.setAttribute("d", d);
    let animating = false, rafId = null;
    function current() {
      const m = parseFloat(mSlider.value), h = parseFloat(hSlider.value), t = parseFloat(tSlider.value);
      const w = m * G * h, p = w / t;
      return { m, h, t, w, p };
    }
    function redraw() {
      const { m, h, t, w, p } = current();
      mVal.textContent = m + " kg"; hVal.textContent = h + " m"; tVal.textContent = t + " s";
      wVal.textContent = w.toFixed(0) + " J"; pVal.textContent = p.toFixed(0) + " W";
      hpVal.textContent = (p / 746).toFixed(2) + " hp"; bulbVal.textContent = (p / 60).toFixed(1);
    }
    [mSlider, hSlider, tSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw(); dot.setAttribute("cx", X0); dot.setAttribute("cy", Y0);
    goBtn.addEventListener("click", () => {
      if (animating) return;
      const { t } = current();
      animating = true; goBtn.disabled = true; const start = performance.now();
      function frame(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / 1000 / t));
        dot.setAttribute("cx", X0 + (X1 - X0) * frac);
        dot.setAttribute("cy", Y0 + (Y1 - Y0) * frac);
        if (frac >= 1) { animating = false; goBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // POWER — Widget 2: Bicycle Power (unchanged: physics OK)
  // ===============================================================
  function initBikePower() {
    const svg = document.getElementById("pwrBikeSvg");
    if (!svg) return;
    const wheel = document.getElementById("pwrBikeWheel");
    const barGrav = document.getElementById("pwrBikeBarGrav");
    const barRoll = document.getElementById("pwrBikeBarRoll");
    const barDrag = document.getElementById("pwrBikeBarDrag");
    const vSlider = document.getElementById("pwrVSlider");
    const vVal = document.getElementById("pwrVVal");
    const slopeSlider = document.getElementById("pwrSlopeSlider");
    const slopeVal = document.getElementById("pwrSlopeVal");
    const mSlider = document.getElementById("pwrBikeMSlider");
    const mVal = document.getElementById("pwrBikeMVal");
    const gravPVal = document.getElementById("pwrGravPVal");
    const rollPVal = document.getElementById("pwrRollPVal");
    const dragPVal = document.getElementById("pwrDragPVal");
    const totalPVal = document.getElementById("pwrTotalPVal");
    const CRR = 0.005, K_DRAG = 0.054, BAR_MAX_H = 85, BAR_BASE_Y = 105;
    function setBar(bar, val, scale) {
      const h = clamp(Math.abs(val) * scale, 0, BAR_MAX_H);
      bar.setAttribute("height", h); bar.setAttribute("y", BAR_BASE_Y - h);
    }
    function redraw() {
      const v = parseFloat(vSlider.value);
      const slopeDeg = parseFloat(slopeSlider.value);
      const m = parseFloat(mSlider.value);
      const slope = (slopeDeg * Math.PI) / 180;
      const gravP = m * G * Math.sin(slope) * v;
      const rollP = CRR * m * G * v;
      const dragP = K_DRAG * v * v * v;
      const totalP = gravP + rollP + dragP;
      vVal.textContent = v + " m/s"; slopeVal.textContent = slopeDeg + "°"; mVal.textContent = m + " kg";
      gravPVal.textContent = gravP.toFixed(1) + " W"; rollPVal.textContent = rollP.toFixed(1) + " W";
      dragPVal.textContent = dragP.toFixed(1) + " W"; totalPVal.textContent = totalP.toFixed(1) + " W";
      const scale = BAR_MAX_H / Math.max(totalP, 1);
      setBar(barGrav, gravP, scale); setBar(barRoll, rollP, scale); setBar(barDrag, dragP, scale);
      wheel.style.animationDuration = v > 0.05 ? Math.max(0.1, 2 / v) + "s" : "999s";
    }
    [vSlider, slopeSlider, mSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ===============================================================
  // POWER — Widget 3: Machine-Efficiency (unchanged: physics OK)
  // ===============================================================
  function initMachineEfficiency() {
    const svg = document.getElementById("pwrEffSvg");
    if (!svg) return;
    const inArrow = document.getElementById("pwrEffInArrow");
    const outArrow = document.getElementById("pwrEffOutArrow");
    const heatArrow = document.getElementById("pwrEffHeatArrow");
    const inSlider = document.getElementById("pwrEffInSlider");
    const inVal = document.getElementById("pwrEffInVal");
    const effSlider = document.getElementById("pwrEffSlider");
    const effVal = document.getElementById("pwrEffPctVal");
    const outVal = document.getElementById("pwrEffOutVal");
    const lostVal = document.getElementById("pwrEffLostVal");
    function redraw() {
      const pin = parseFloat(inSlider.value);
      const eff = parseFloat(effSlider.value);
      const pout = pin * (eff / 100), plost = pin - pout;
      inVal.textContent = pin + " W"; effVal.textContent = eff + "%";
      outVal.textContent = pout.toFixed(0) + " W"; lostVal.textContent = plost.toFixed(0) + " W";
      const scale = 6 / Math.sqrt(Math.max(pin, 1));
      inArrow.setAttribute("stroke-width", clamp(2 + Math.sqrt(pin) * scale, 2, 10));
      outArrow.setAttribute("stroke-width", clamp(2 + Math.sqrt(pout) * scale, 2, 10));
      heatArrow.setAttribute("stroke-width", clamp(1 + Math.sqrt(plost) * scale, 1, 10));
      heatArrow.setAttribute("y2", 96 + clamp(Math.sqrt(plost) * scale, 0, 14));
    }
    inSlider.addEventListener("input", redraw);
    effSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // ROLLER COASTER — Widget 1: Hill-to-Hill Speed (ENHANCED: ride)
  // ===============================================================
  function initCoasterSpeed() {
    const svg = document.getElementById("rcTrackSvg");
    if (!svg) return;
    const trackPath = document.getElementById("rcTrackPath");
    const probe = document.getElementById("rcProbe");
    const posSlider = document.getElementById("rcPosSlider");
    const posVal = document.getElementById("rcPosVal");
    const dropVal = document.getElementById("rcDropVal");
    const vVal = document.getElementById("rcVVal");
    const verdictVal = document.getElementById("rcVerdictVal");
    const rideBtn = document.getElementById("rcRideBtn");   // optional

    const BREAKS = [[0, 30], [20, 5], [35, 22], [55, 8], [75, 18], [100, 3]];
    const H1 = BREAKS[0][1];
    const X0 = 20, X1 = 440, Y_BOTTOM = 160, Y_TOP = 20, H_MAX = 30;
    const toX = (pct) => X0 + (X1 * pct) / 100;
    const toY = (h) => Y_BOTTOM - (h / H_MAX) * (Y_BOTTOM - Y_TOP);
    function hAt(pct) {
      for (let i = 0; i < BREAKS.length - 1; i++) {
        const [p0, h0] = BREAKS[i], [p1, h1] = BREAKS[i + 1];
        if (pct >= p0 && pct <= p1) { const f = (pct - p0) / (p1 - p0); return h0 + (h1 - h0) * f; }
      }
      return BREAKS[BREAKS.length - 1][1];
    }
    let d = "";
    for (let i = 0; i <= 100; i++) d += (i === 0 ? "M" : "L") + toX(i) + "," + toY(hAt(i)) + " ";
    trackPath.setAttribute("d", d);

    function speedAt(pct) {
      const drop = H1 - hAt(pct);
      // small launch (chain-lift) so it leaves the crest: v = sqrt(2g·drop + v0^2)
      return Math.sqrt(Math.max(0, 2 * G * drop) + 0.5);
    }
    function updateFromPct(pct) {
      posSlider.value = pct;
      posVal.textContent = pct.toFixed(0) + "%";
      const h = hAt(pct);
      probe.setAttribute("cx", toX(pct)); probe.setAttribute("cy", toY(h));
      const drop = H1 - h;
      const v = Math.sqrt(Math.max(0, 2 * G * drop));
      dropVal.textContent = drop.toFixed(1) + " m";
      vVal.textContent = v.toFixed(1) + " m/s";
      verdictVal.textContent = drop <= 0.05
        ? "At the tallest point — momentarily at rest"
        : "Speed depends only on drop below the first hill";
    }
    posSlider.addEventListener("input", () => updateFromPct(parseFloat(posSlider.value)));
    makeDraggable(probe, svg, (pt) => updateFromPct(clamp(((pt.x - X0) / X1) * 100, 0, 100)));
    updateFromPct(0);

    if (rideBtn) {
      let animating = false, rafId = null;
      rideBtn.addEventListener("click", () => {
        if (animating) return;
        let pct = 0; animating = true; rideBtn.disabled = true;
        let last = performance.now();
        function frame(now) {
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          pct += speedAt(pct) * 0.9 * dt;   // pos-rate ∝ speed (visual scaling)
          if (pct >= 100) { updateFromPct(100); animating = false; rideBtn.disabled = false; return; }
          updateFromPct(pct);
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      });
    }
  }

  // ===============================================================
  // ROLLER COASTER — Widget 2: Apparent Weight (unchanged: OK)
  // ===============================================================
  function initCoasterGForce() {
    const svg = document.getElementById("rcGSvg");
    if (!svg) return;
    const trackPath = document.getElementById("rcGTrackPath");
    const car = document.getElementById("rcGCar");
    const arrow = document.getElementById("rcGArrow");
    const vSlider = document.getElementById("rcGVSlider");
    const vVal = document.getElementById("rcGVVal");
    const rSlider = document.getElementById("rcGRSlider");
    const rVal = document.getElementById("rcGRVal");
    const centVal = document.getElementById("rcGCentVal");
    const gVal = document.getElementById("rcGVal");
    const feelVal = document.getElementById("rcGFeelVal");
    const modeButtons = Array.from(document.querySelectorAll("#rcGModeToggle button"));
    let mode = "crest";
    function feel(g) {
      if (g < 0) return "Would fly off the seat without restraints";
      if (g < 0.3) return "Near weightlessness";
      if (g < 0.8) return "Noticeably lighter than normal";
      if (g <= 1.2) return "About normal";
      if (g <= 2.5) return "Noticeably heavier — a fun, strong push";
      if (g <= 4) return "Intense — near the upper range real coasters use, briefly";
      return "Beyond typical safe design limits for a sustained load";
    }
    function redraw() {
      const v = parseFloat(vSlider.value), r = parseFloat(rSlider.value);
      const cent = (v * v) / r;
      const g = mode === "crest" ? 1 - cent / G : 1 + cent / G;
      vVal.textContent = v + " m/s"; rVal.textContent = r + " m";
      centVal.textContent = cent.toFixed(2) + " m/s²"; gVal.textContent = g.toFixed(2) + " G";
      feelVal.textContent = feel(g);
      if (mode === "crest") {
        trackPath.setAttribute("d", "M 20,90 Q 130,10 240,90");
        car.setAttribute("cx", 130); car.setAttribute("cy", 33);
        arrow.setAttribute("x1", 130); arrow.setAttribute("y1", 33);
        arrow.setAttribute("x2", 130); arrow.setAttribute("y2", 33 - clamp((1 - g) * 20, -40, 40));
      } else {
        trackPath.setAttribute("d", "M 20,50 Q 130,130 240,50");
        car.setAttribute("cx", 130); car.setAttribute("cy", 108);
        arrow.setAttribute("x1", 130); arrow.setAttribute("y1", 108);
        arrow.setAttribute("x2", 130); arrow.setAttribute("y2", 108 + clamp((g - 1) * 15, -40, 40));
      }
    }
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active"); mode = btn.dataset.mode; redraw();
      });
    });
    vSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // ROLLER COASTER — Widget 3: Loop  (ENHANCED: car circulates loop)
  // ===============================================================
  function initCoasterLoop() {
    const svg = document.getElementById("rcLoopSvg");
    if (!svg) return;
    const loopCircle = document.getElementById("rcLoopCircle");
    const hillLine = document.getElementById("rcLoopHillLine");
    const rSlider = document.getElementById("rcLoopRSlider");
    const rVal = document.getElementById("rcLoopRVal");
    const vVal = document.getElementById("rcLoopVVal");
    const hVal = document.getElementById("rcLoopHVal");
    const car = document.getElementById("rcLoopCar");        // optional
    const rideBtn = document.getElementById("rcLoopRideBtn"); // optional

    const GROUND_Y = 200, CX = 110, R_PX_SCALE = 3;
    let geom = { cx: CX, cy: GROUND_Y, rPx: 40, r: 10 };
    function redraw() {
      const r = parseFloat(rSlider.value);
      const vTop = Math.sqrt(G * r);
      const h = 2.5 * r;
      rVal.textContent = r + " m";
      vVal.textContent = vTop.toFixed(2) + " m/s";
      hVal.textContent = h.toFixed(1) + " m";
      const rPx = clamp(r * R_PX_SCALE, 20, 80);
      loopCircle.setAttribute("cx", CX);
      loopCircle.setAttribute("cy", GROUND_Y - rPx);
      loopCircle.setAttribute("r", rPx);
      const hillPx = clamp(h * R_PX_SCALE * 0.4, 20, 170);
      hillLine.setAttribute("x2", CX - rPx - 20);
      hillLine.setAttribute("y2", GROUND_Y - hillPx);
      geom = { cx: CX, cy: GROUND_Y - rPx, rPx, r };
    }
    rSlider.addEventListener("input", redraw);
    redraw();

    if (car) {
      let animating = false, rafId = null;
      function placeCar(phi) {                 // phi from bottom, CCW
        car.setAttribute("cx", geom.cx + geom.rPx * Math.sin(phi));
        car.setAttribute("cy", geom.cy + geom.rPx * Math.cos(phi));
      }
      placeCar(0);
      function ride() {
        if (animating) return;
        const r = parseFloat(rSlider.value);
        const hRelease = 2.5 * r;              // minimum height to just clear the loop
        let phi = 0, last = performance.now();
        animating = true; if (rideBtn) rideBtn.disabled = true;
        function frame(now) {
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          // energy: v(phi)^2 = 2g[hRelease - r(1 - cos? )]; height in loop = r(1 - cos(phi_from_top))
          const heightInLoop = r * (1 - Math.cos(Math.PI - phi)); // 0 at bottom, 2r at top
          const v = Math.sqrt(Math.max(0.1, 2 * G * (hRelease - heightInLoop)));
          phi += (v / r) * 0.35 * dt * 60 * (1 / 60); // dφ/dt = v/r (visual scale)
          placeCar(phi);
          if (phi >= 2 * Math.PI) { placeCar(0); animating = false; if (rideBtn) rideBtn.disabled = false; return; }
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      }
      if (rideBtn) rideBtn.addEventListener("click", ride); else ride();
      rSlider.addEventListener("input", () => { if (!animating) placeCar(0); });
    }
  }

  // ===============================================================
  // NEW TAB — Roller-Coaster Full Ride & Energy (guarded)
  // Required IDs: rcFullSvg, rcFullTrack, rcFullCar,
  //   rcFullBarKE / rcFullBarPE / rcFullBarHeat,
  //   rcFullKEVal / rcFullPEVal / rcFullHeatVal / rcFullTotalVal,
  //   rcFullMuSlider, rcFullMuVal, rcFullPlayBtn, rcFullResetBtn, rcFullStatus
  // ===============================================================
  function initCoasterFullRide() {
    const svg = document.getElementById("rcFullSvg");
    if (!svg) return;
    const trackPath = document.getElementById("rcFullTrack");
    const car = document.getElementById("rcFullCar");
    const barKE = document.getElementById("rcFullBarKE");
    const barPE = document.getElementById("rcFullBarPE");
    const barHeat = document.getElementById("rcFullBarHeat");
    const keVal = document.getElementById("rcFullKEVal");
    const peVal = document.getElementById("rcFullPEVal");
    const heatVal = document.getElementById("rcFullHeatVal");
    const totalVal = document.getElementById("rcFullTotalVal");
    const muSlider = document.getElementById("rcFullMuSlider");
    const muVal = document.getElementById("rcFullMuVal");
    const playBtn = document.getElementById("rcFullPlayBtn");
    const resetBtn = document.getElementById("rcFullResetBtn");
    const statusEl = document.getElementById("rcFullStatus");

    // Track profile in metres (x, height). First hill is the highest.
    const PROFILE = [[0, 30], [30, 6], [55, 20], [80, 4], [110, 14], [140, 0]];
    const vb = svg.viewBox.baseVal;
    const W = vb.width || 480, H = vb.height || 220;
    const PAD = 24, BAR_MAX = 95, BAR_BASE_Y = 110, M = 500; // mass cancels; used for J readouts
    const xs = PROFILE.map((p) => p[0]), ys = PROFILE.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const toPX = (xm) => PAD + ((xm - minX) / (maxX - minX)) * (W - 2 * PAD);
    const toPY = (ym) => (H - PAD) - (ym / maxY) * (H - 2 * PAD);

    // Dense samples with cumulative arc length (metres).
    const N = 600, samp = [];
    for (let i = 0; i <= N; i++) {
      const xm = minX + ((maxX - minX) * i) / N;
      // piecewise-linear height
      let ym = ys[ys.length - 1];
      for (let k = 0; k < PROFILE.length - 1; k++) {
        const [x0, h0] = PROFILE[k], [x1, h1] = PROFILE[k + 1];
        if (xm >= x0 && xm <= x1) { ym = h0 + (h1 - h0) * ((xm - x0) / (x1 - x0)); break; }
      }
      samp.push({ xm, ym });
    }
    let cum = [0];
    for (let i = 1; i <= N; i++) {
      const dx = samp[i].xm - samp[i - 1].xm, dy = samp[i].ym - samp[i - 1].ym;
      cum.push(cum[i - 1] + Math.hypot(dx, dy));
    }
    const totalLen = cum[N];
    let dpath = "";
    for (let i = 0; i <= N; i += 4) dpath += (i === 0 ? "M" : "L") + toPX(samp[i].xm).toFixed(1) + "," + toPY(samp[i].ym).toFixed(1) + " ";
    trackPath.setAttribute("d", dpath);

    const H0 = PROFILE[0][1];        // release height
    const e0 = G * H0;               // energy per unit mass
    let animating = false, rafId = null;

    function stateAtS(s) {           // interpolate height & local slope cos
      s = clamp(s, 0, totalLen);
      let i = 1; while (i < N && cum[i] < s) i++;
      const f = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      const xm = samp[i - 1].xm + (samp[i].xm - samp[i - 1].xm) * f;
      const ym = samp[i - 1].ym + (samp[i].ym - samp[i - 1].ym) * f;
      const dx = samp[i].xm - samp[i - 1].xm, dy = samp[i].ym - samp[i - 1].ym;
      const ds = Math.hypot(dx, dy) || 1e-6;
      return { xm, ym, cosT: Math.abs(dx) / ds };
    }
    function setBars(ke, pe, heat) {
      keVal.textContent = (ke * M).toFixed(0) + " J";
      peVal.textContent = (pe * M).toFixed(0) + " J";
      heatVal.textContent = (heat * M).toFixed(0) + " J";
      totalVal.textContent = ((ke + pe + heat) * M).toFixed(0) + " J";
      const sc = BAR_MAX / e0;
      barKE.setAttribute("height", clamp(ke * sc, 0, BAR_MAX)); barKE.setAttribute("y", BAR_BASE_Y - clamp(ke * sc, 0, BAR_MAX));
      barPE.setAttribute("height", clamp(pe * sc, 0, BAR_MAX)); barPE.setAttribute("y", BAR_BASE_Y - clamp(pe * sc, 0, BAR_MAX));
      barHeat.setAttribute("height", clamp(heat * sc, 0, BAR_MAX)); barHeat.setAttribute("y", BAR_BASE_Y - clamp(heat * sc, 0, BAR_MAX));
    }
    function placeCar(st) { car.setAttribute("cx", toPX(st.xm)); car.setAttribute("cy", toPY(st.ym) - 6); }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; playBtn.disabled = false;
      const st = stateAtS(0);
      placeCar(st);
      setBars(0, G * st.ym, 0);
      if (statusEl) statusEl.textContent = "Released from rest at the highest hill.";
    }
    muSlider.addEventListener("input", () => { muVal.textContent = parseFloat(muSlider.value).toFixed(3); reset(); });
    if (resetBtn) resetBtn.addEventListener("click", reset);
    reset();

    playBtn.addEventListener("click", () => {
      if (animating) return;
      const mu = parseFloat(muSlider.value);
      // Start a hair past the exact crest: at s=0 the car is at rest (v=0),
      // and since this model derives v purely from the *current* energy
      // state (v = sqrt(2·KE)), v=0 would make every subsequent ds=0 too --
      // a permanent deadlock at the starting line. A tiny nudge is enough
      // for gravity to take over from there.
      let s = 0.05, heat = 0, last = performance.now();
      animating = true; playBtn.disabled = true;
      if (statusEl) statusEl.textContent = "Riding…";
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000) * 1.2; last = now;
        const st = stateAtS(s);
        const ke = e0 - G * st.ym - heat;          // energy bookkeeping (per unit mass)
        if (ke <= 0.02 && s > 1) {                 // stalled on a hill
          setBars(0, G * st.ym, heat); placeCar(st);
          if (statusEl) statusEl.textContent = "Stalled — friction removed enough energy that the car can't climb further.";
          animating = false; playBtn.disabled = false; return;
        }
        const v = Math.sqrt(Math.max(0, 2 * ke));
        const ds = v * dt * 6;                     // arc-length step (visual scale)
        heat += mu * G * st.cosT * ds;             // friction dissipation along slope
        s += ds;
        const stNow = stateAtS(s);
        setBars(Math.max(0, e0 - G * stNow.ym - heat), G * stNow.ym, heat);
        placeCar(stNow);
        if (s >= totalLen) {
          if (statusEl) statusEl.textContent = mu > 0 ? "Reached the end — some energy is now heat." : "Reached the end — mechanical energy conserved.";
          animating = false; playBtn.disabled = false; return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Single init entry point
  // ===============================================================
  document.addEventListener("DOMContentLoaded", () => {
    // Work
    initWorkGraph();
    initPullingLab();
    initAngleWork();
    // Kinetic energy
    initKEPlotter();
    initKECollision();
    // Potential energy
    initSkatePark();
    initSpringLaunch();
    initPendulumEnergy();
    // Conservation
    initEnergyAccounting();
    // Power
    initStairPower();
    initBikePower();
    initMachineEfficiency();
    // Roller coaster
    initCoasterSpeed();
    initCoasterGForce();
    initCoasterLoop();
    initCoasterFullRide(); // new tab (activates only if its HTML is present)
  });
})();
