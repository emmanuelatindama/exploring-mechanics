// Interactive widgets for docs/03-energy/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
(function () {
  const G = 9.8;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
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
    handle.addEventListener("pointerup", () => {
      handle.style.cursor = "grab";
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Work) -- Force-Distance Graph: Work as Area
  // ---------------------------------------------------------------
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
        forceAt = F;
        work = F * d;
        yMax = 60;
        lineEnd = F;
      } else {
        const k = parseFloat(kSlider.value);
        forceAt = k * d;
        work = 0.5 * k * d * d;
        yMax = 550;
        lineEnd = k * DOMAIN_MAX;
      }
      dVal.textContent = d + " m";
      forceAtVal.textContent = forceAt.toFixed(1) + " N";
      workVal.textContent = work.toFixed(1) + " J";

      const toX = (x) => 40 + (x / DOMAIN_MAX) * 400;
      const toY = (y) => 170 - (clamp(y, 0, yMax) / yMax) * 160;

      if (mode === "constant") {
        linePath.setAttribute("d", "M" + toX(0) + "," + toY(forceAt) + " L" + toX(DOMAIN_MAX) + "," + toY(forceAt));
        areaPath.setAttribute(
          "d",
          "M" + toX(0) + "," + toY(0) + " L" + toX(d) + "," + toY(0) + " L" + toX(d) + "," + toY(forceAt) + " L" + toX(0) + "," + toY(forceAt) + " Z"
        );
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

  // ---------------------------------------------------------------
  // Widget 2 (Work) -- Pulling Lab: Work-Energy Theorem
  // ---------------------------------------------------------------
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

    const BOX_X0 = 20, ANIM_SECONDS = 2.5;
    let animating = false, rafId = null;

    function current() {
      const F = parseFloat(fSlider.value);
      const d = parseFloat(dSlider.value);
      const m = parseFloat(mSlider.value);
      const mu = parseFloat(muSlider.value);
      const wApplied = F * d;
      const wFriction = -mu * m * G * d;
      const wNet = wApplied + wFriction;
      const vFinal = wNet > 0 ? Math.sqrt((2 * wNet) / m) : 0;
      return { F, d, m, mu, wApplied, wFriction, wNet, vFinal };
    }

    function redraw() {
      const { F, d, m, mu, wApplied, wFriction, wNet, vFinal } = current();
      fVal.textContent = F + " N";
      dVal.textContent = d + " m";
      mVal.textContent = m + " kg";
      muVal.textContent = mu.toFixed(2);
      wAppliedVal.textContent = wApplied.toFixed(1) + " J";
      wFrictionVal.textContent = wFriction.toFixed(1) + " J";
      wNetVal.textContent = wNet.toFixed(1) + " J";
      vFinalVal.textContent = vFinal.toFixed(2) + " m/s";
    }
    [fSlider, dSlider, mSlider, muSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    box.setAttribute("x", BOX_X0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      box.setAttribute("x", BOX_X0);
      const { vFinal, d } = current();
      const pxpm = 380 / Math.max(d, 0.1);

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      const totalT = vFinal > 0 ? (2 * d) / vFinal : ANIM_SECONDS;
      function frame(now) {
        const t = Math.min(totalT, Math.max(0, (now - start) / 1000));
        const frac = totalT > 0 ? t / totalT : 1;
        box.setAttribute("x", BOX_X0 + frac * frac * d * pxpm);
        if (t >= totalT) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 3 (Work) -- Positive, Negative, or Zero?
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // Widget 1 (Kinetic Energy) -- Speed vs. Kinetic Energy Plotter
  // ---------------------------------------------------------------
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
      for (let vv = 0; vv <= V_MAX; vv += 1) {
        d += (vv === 0 ? "M" : "L") + toX(vv) + "," + toY(0.5 * m * vv * vv) + " ";
      }
      curvePath.setAttribute("d", d);
      marker.setAttribute("cx", toX(v));
      marker.setAttribute("cy", toY(ke));
    }
    vSlider.addEventListener("input", redraw);
    mSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Kinetic Energy) -- Kinetic Energy in a Collision
  // ---------------------------------------------------------------
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

    const BALL1_X0 = 60, BALL2_X0 = 220, ANIM_SECONDS = 1.2;
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
    [m1Slider, v1Slider, m2Slider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    ball1.setAttribute("cx", BALL1_X0);
    ball2.setAttribute("cx", BALL2_X0);

    collideBtn.addEventListener("click", () => {
      if (animating) return;
      ball1.setAttribute("cx", BALL1_X0);
      ball2.setAttribute("cx", BALL2_X0);
      const { v1, v1f, v2f } = current();
      const pxpm = 8;

      animating = true;
      collideBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        if (t < 0.5) {
          ball1.setAttribute("cx", BALL1_X0 + v1 * t * pxpm);
        } else {
          const t2 = t - 0.5;
          ball1.setAttribute("cx", BALL2_X0 + v1f * t2 * pxpm);
          ball2.setAttribute("cx", BALL2_X0 + v2f * t2 * pxpm);
        }
        if (t >= ANIM_SECONDS) {
          animating = false;
          collideBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Potential Energy) -- Energy Skate-Park
  // ---------------------------------------------------------------
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
    for (let i = 0; i <= 40; i++) {
      const s = -1 + (2 * i) / 40;
      d += (i === 0 ? "M" : "L") + (CX + s * W_PX) + "," + yScreen(s) + " ";
    }
    bowlPath.setAttribute("d", d);

    let animating = false, rafId = null;

    function setBars(ke, pe, heat, total) {
      keVal.textContent = ke.toFixed(0) + " J";
      peVal.textContent = pe.toFixed(0) + " J";
      heatVal.textContent = heat.toFixed(0) + " J";
      totalVal.textContent = (ke + pe + heat).toFixed(0) + " J";
      const scale = total > 0 ? BAR_MAX / total : 0;
      barKE.setAttribute("y", 100 - ke * scale);
      barKE.setAttribute("height", ke * scale);
      barPE.setAttribute("y", 100 - pe * scale);
      barPE.setAttribute("height", pe * scale);
      barHeat.setAttribute("y", 100 - heat * scale);
      barHeat.setAttribute("height", heat * scale);
    }

    function place(s) {
      ball.setAttribute("cx", CX + s * W_PX);
      ball.setAttribute("cy", yScreen(s));
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      const pct = parseFloat(h0Slider.value);
      const h0 = (pct / 100) * H0_PHYS;
      const s0 = Math.sqrt(h0 / H0_PHYS) * (pct >= 0 ? 1 : -1);
      place(s0);
      const total = M * G * h0;
      setBars(0, total, 0, total);
    }
    h0Slider.addEventListener("input", () => { h0Val.textContent = h0Slider.value + "%"; reset(); });
    reset();

    // Modeling s like a literal coordinate with PE(s) = M*G*H0_PHYS*s^2 (a
    // Hookean potential) makes the restoring dynamics simple harmonic:
    // d^2s/dt^2 = -(2*G*H0_PHYS)*s, optionally damped by friction. This
    // starts moving correctly from rest, unlike deriving speed purely from
    // energy conservation (which has no way to know *which* direction to
    // go, or that it should move at all, right at the release point).
    const OMEGA2 = 2 * G * H0_PHYS;
    goBtn.addEventListener("click", () => {
      if (animating) return;
      const pct = parseFloat(h0Slider.value);
      const h0 = (pct / 100) * H0_PHYS;
      const total0 = M * G * h0;
      let s = Math.sqrt(h0 / H0_PHYS);
      let vs = 0;
      const damping = frictionBox.checked ? 1.0 : 0;
      const maxDuration = 12;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      let last = start;
      const SUBSTEP = 0.005;
      function frame(now) {
        let remaining = Math.min(0.1, Math.max(0, (now - last) / 1000));
        last = now;
        const elapsed = (now - start) / 1000;

        while (remaining > 0) {
          const h = Math.min(SUBSTEP, remaining);
          const a = -OMEGA2 * s - damping * vs;
          vs += a * h;
          s = clamp(s + vs * h, -1, 1);
          remaining -= h;
        }

        const ke = 0.5 * M * vs * vs;
        const pe = M * G * hPhys(s);
        const heat = Math.max(0, total0 - ke - pe);
        setBars(ke, pe, heat, total0);
        place(s);

        if (elapsed >= maxDuration || (damping > 0 && Math.abs(vs) < 0.01 && Math.abs(s) < 0.02)) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Potential Energy) -- Spring-Launch Simulation
  // ---------------------------------------------------------------
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

    const RAMP_BASE = { x: 90, y: 180 }, RAMP_TOP = { x: 290, y: 40 }, BALL_X0 = 40;
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
      const rampLen = Math.hypot(RAMP_TOP.x - RAMP_BASE.x, RAMP_TOP.y - RAMP_BASE.y);
      const rampHeightM = 3;
      const fracMax = Math.min(1, h / rampHeightM);

      animating = true;
      goBtn.disabled = true;
      const ANIM_SECONDS = 1.5;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        const frac = (t / ANIM_SECONDS) * fracMax;
        ball.setAttribute("cx", RAMP_BASE.x + frac * (RAMP_TOP.x - RAMP_BASE.x));
        ball.setAttribute("cy", RAMP_BASE.y + frac * (RAMP_TOP.y - RAMP_BASE.y));
        if (t >= ANIM_SECONDS) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 3 (Potential Energy) -- Pendulum Energy Explorer
  // ---------------------------------------------------------------
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

    const PIVOT = { x: 130, y: 20 }, L_PX = 150;
    let animating = false, rafId = null;

    function current() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const L = parseFloat(lSlider.value);
      const h = L * (1 - Math.cos(theta));
      const v = Math.sqrt(2 * G * h);
      return { thetaDeg, theta, L, h, v };
    }

    function place(theta) {
      const bx = PIVOT.x + L_PX * Math.sin(theta);
      const by = PIVOT.y + L_PX * Math.cos(theta);
      rod.setAttribute("x2", bx);
      rod.setAttribute("y2", by);
      bob.setAttribute("cx", bx);
      bob.setAttribute("cy", by);
    }

    function redraw() {
      const { thetaDeg, theta, L, h, v } = current();
      thetaVal.textContent = thetaDeg + "°";
      lVal.textContent = L.toFixed(1) + " m";
      hVal.textContent = h.toFixed(2) + " m";
      vVal.textContent = v.toFixed(2) + " m/s";
      place(theta);
    }
    thetaSlider.addEventListener("input", redraw);
    lSlider.addEventListener("input", redraw);
    redraw();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const { theta } = current();
      animating = true;
      goBtn.disabled = true;
      const PERIOD = 1.8;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const swing = theta * Math.cos((2 * Math.PI * t) / PERIOD);
        place(swing);
        if (t >= PERIOD * 2) {
          place(theta);
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Conservation) -- Energy-Accounting Tracker
  // ---------------------------------------------------------------
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
        const v0 = parseFloat(v0Slider.value);
        const mu = parseFloat(muSlider.value);
        const a = mu * G;
        const tStop = v0 / a;
        const e0 = 0.5 * M * v0 * v0;
        const N = 60;
        for (let i = 0; i <= N; i++) {
          const t = (tStop * i) / N;
          const v = Math.max(0, v0 - a * t);
          const ke = 0.5 * M * v * v;
          series.t.push(t); series.ke.push(ke); series.pe.push(0); series.heat.push(e0 - ke);
        }
      } else {
        const y0 = parseFloat(y0Slider.value);
        const b = parseFloat(bSlider.value);
        const e0 = M * G * y0;
        let y = y0, v = 0, t = 0;
        const dt = 0.02;
        while (y > 0 && t < 30) {
          const ke = 0.5 * M * v * v;
          const pe = M * G * Math.max(0, y);
          series.t.push(t); series.ke.push(ke); series.pe.push(pe); series.heat.push(e0 - ke - pe);
          const a = G - b * v * v;
          v += a * dt;
          y -= v * dt;
          t += dt;
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
      function pathFor(arr) {
        let d = "";
        series.t.forEach((t, i) => { d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(arr[i]) + " "; });
        return d;
      }
      kePath.setAttribute("d", pathFor(series.ke));
      pePath.setAttribute("d", pathFor(series.pe));
      heatPath.setAttribute("d", pathFor(series.heat));
      return { toX, tMax };
    }
    let { toX, tMax } = drawCurves();

    function showAt(frac) {
      const idx = Math.min(series.t.length - 1, Math.round(frac * (series.t.length - 1)));
      const x = toX(series.t[idx]);
      markerLine.setAttribute("x1", x);
      markerLine.setAttribute("x2", x);
      keVal.textContent = series.ke[idx].toFixed(1) + " J";
      peVal.textContent = series.pe[idx].toFixed(1) + " J";
      heatVal.textContent = series.heat[idx].toFixed(1) + " J";
      totalVal.textContent = (series.ke[idx] + series.pe[idx] + series.heat[idx]).toFixed(1) + " J";
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      playBtn.disabled = false;
      series = computeSeries();
      const drawn = drawCurves();
      toX = drawn.toX; tMax = drawn.tMax;
      showAt(0);
    }

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
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
      animating = true;
      playBtn.disabled = true;
      const ANIM_SECONDS = 3;
      const start = performance.now();
      function frame(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / 1000 / ANIM_SECONDS));
        showAt(frac);
        if (frac >= 1) {
          animating = false;
          playBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initWorkGraph();
    initPullingLab();
    initAngleWork();
    initKEPlotter();
    initKECollision();
    initSkatePark();
    initSpringLaunch();
    initPendulumEnergy();
    initEnergyAccounting();
    initStairPower();
    initBikePower();
    initMachineEfficiency();
  });

  // ---------------------------------------------------------------
  // Widget 1 (Power) -- Stair-Climbing Power Estimate
  // ---------------------------------------------------------------
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
      const m = parseFloat(mSlider.value);
      const h = parseFloat(hSlider.value);
      const t = parseFloat(tSlider.value);
      const w = m * G * h;
      const p = w / t;
      return { m, h, t, w, p };
    }

    function redraw() {
      const { m, h, t, w, p } = current();
      mVal.textContent = m + " kg";
      hVal.textContent = h + " m";
      tVal.textContent = t + " s";
      wVal.textContent = w.toFixed(0) + " J";
      pVal.textContent = p.toFixed(0) + " W";
      hpVal.textContent = (p / 746).toFixed(2) + " hp";
      bulbVal.textContent = (p / 60).toFixed(1);
    }
    [mSlider, hSlider, tSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    dot.setAttribute("cx", X0);
    dot.setAttribute("cy", Y0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const { t } = current();
      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / 1000 / t));
        dot.setAttribute("cx", X0 + (X1 - X0) * frac);
        dot.setAttribute("cy", Y0 + (Y1 - Y0) * frac);
        if (frac >= 1) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Power) -- Bicycle Power Calculator
  // ---------------------------------------------------------------
  function initBikePower() {
    const svg = document.getElementById("pwrBikeSvg");
    if (!svg) return;
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

    const CRR = 0.005, K_DRAG = 0.054;

    function redraw() {
      const v = parseFloat(vSlider.value);
      const slopeDeg = parseFloat(slopeSlider.value);
      const m = parseFloat(mSlider.value);
      const slope = (slopeDeg * Math.PI) / 180;

      const gravP = m * G * Math.sin(slope) * v;
      const rollP = CRR * m * G * v;
      const dragP = K_DRAG * v * v * v;
      const totalP = gravP + rollP + dragP;

      vVal.textContent = v + " m/s";
      slopeVal.textContent = slopeDeg + "°";
      mVal.textContent = m + " kg";
      gravPVal.textContent = gravP.toFixed(1) + " W";
      rollPVal.textContent = rollP.toFixed(1) + " W";
      dragPVal.textContent = dragP.toFixed(1) + " W";
      totalPVal.textContent = totalP.toFixed(1) + " W";
    }
    [vSlider, slopeSlider, mSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 3 (Power) -- Machine-Efficiency Explorer
  // ---------------------------------------------------------------
  function initMachineEfficiency() {
    const svg = document.getElementById("pwrEffSvg");
    if (!svg) return;
    const inSlider = document.getElementById("pwrEffInSlider");
    const inVal = document.getElementById("pwrEffInVal");
    const effSlider = document.getElementById("pwrEffSlider");
    const effVal = document.getElementById("pwrEffPctVal");
    const outVal = document.getElementById("pwrEffOutVal");
    const lostVal = document.getElementById("pwrEffLostVal");

    function redraw() {
      const pin = parseFloat(inSlider.value);
      const eff = parseFloat(effSlider.value);
      const pout = pin * (eff / 100);
      const plost = pin - pout;

      inVal.textContent = pin + " W";
      effVal.textContent = eff + "%";
      outVal.textContent = pout.toFixed(0) + " W";
      lostVal.textContent = plost.toFixed(0) + " W";
    }
    inSlider.addEventListener("input", redraw);
    effSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Roller Coaster) -- Hill-to-Hill Speed via Energy Conservation
  // ---------------------------------------------------------------
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

    const BREAKS = [[0, 30], [20, 5], [35, 22], [55, 8], [75, 18], [100, 3]];
    const H1 = BREAKS[0][1];
    const X0 = 20, X1 = 440, Y_BOTTOM = 160, Y_TOP = 20, H_MAX = 30;
    const toX = (pct) => X0 + (X1 * pct) / 100;
    const toY = (h) => Y_BOTTOM - (h / H_MAX) * (Y_BOTTOM - Y_TOP);

    function hAt(pct) {
      for (let i = 0; i < BREAKS.length - 1; i++) {
        const [p0, h0] = BREAKS[i], [p1, h1] = BREAKS[i + 1];
        if (pct >= p0 && pct <= p1) {
          const f = (pct - p0) / (p1 - p0);
          return h0 + (h1 - h0) * f;
        }
      }
      return BREAKS[BREAKS.length - 1][1];
    }

    let d = "";
    for (let i = 0; i <= 100; i++) {
      d += (i === 0 ? "M" : "L") + toX(i) + "," + toY(hAt(i)) + " ";
    }
    trackPath.setAttribute("d", d);

    function updateFromPct(pct) {
      posSlider.value = pct;
      posVal.textContent = pct.toFixed(0) + "%";
      const h = hAt(pct);
      probe.setAttribute("cx", toX(pct));
      probe.setAttribute("cy", toY(h));
      const drop = H1 - h;
      const v = Math.sqrt(Math.max(0, 2 * G * drop));
      dropVal.textContent = drop.toFixed(1) + " m";
      vVal.textContent = v.toFixed(1) + " m/s";
      verdictVal.textContent =
        drop <= 0.05 ? "At the tallest point — momentarily at rest" : "Speed depends only on drop below the first hill";
    }
    posSlider.addEventListener("input", () => updateFromPct(parseFloat(posSlider.value)));
    makeDraggable(probe, svg, (pt) => updateFromPct(clamp(((pt.x - X0) / X1) * 100, 0, 100)));
    updateFromPct(0);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Roller Coaster) -- Apparent Weight and G-Forces
  // ---------------------------------------------------------------
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
      const v = parseFloat(vSlider.value);
      const r = parseFloat(rSlider.value);
      const cent = (v * v) / r;
      const g = mode === "crest" ? 1 - cent / G : 1 + cent / G;

      vVal.textContent = v + " m/s";
      rVal.textContent = r + " m";
      centVal.textContent = cent.toFixed(2) + " m/s²";
      gVal.textContent = g.toFixed(2) + " G";
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
        btn.classList.add("active");
        mode = btn.dataset.mode;
        redraw();
      });
    });
    vSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 3 (Roller Coaster) -- Minimum Height to Complete a Loop
  // ---------------------------------------------------------------
  function initCoasterLoop() {
    const svg = document.getElementById("rcLoopSvg");
    if (!svg) return;
    const loopCircle = document.getElementById("rcLoopCircle");
    const hillLine = document.getElementById("rcLoopHillLine");
    const rSlider = document.getElementById("rcLoopRSlider");
    const rVal = document.getElementById("rcLoopRVal");
    const vVal = document.getElementById("rcLoopVVal");
    const hVal = document.getElementById("rcLoopHVal");

    const GROUND_Y = 200, CX = 110, R_PX_SCALE = 3;

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
    }
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCoasterSpeed();
    initCoasterGForce();
    initCoasterLoop();
  });
})();
