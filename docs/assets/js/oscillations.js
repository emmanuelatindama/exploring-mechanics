// Interactive widgets for docs/08-oscillations/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
// Drop-in replacement: preserves all existing element IDs and coordinate
// conventions, so it works with the current index.html unchanged.
(function () {
  const G = 9.8;
  const NS = "http://www.w3.org/2000/svg";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // Inject a collapsible differential-equation block after an element.
  // Guarded so re-running init doesn't duplicate it.
  function addEquation(anchor, id, html) {
    if (!anchor || !anchor.parentNode || document.getElementById(id)) return;
    const box = document.createElement("details");
    box.className = "osc-eq";
    box.id = id;
    box.innerHTML = "<summary>Show the differential equation (for the math enthusiasts)</summary><div class='osc-eq-body'>" + html + "</div>";
    anchor.insertAdjacentElement("afterend", box);
  }
  function addCompanion(anchor, id, viewBox) {
    if (!anchor || !anchor.parentNode) return null;
    let svg = document.getElementById(id);
    if (svg) return svg;
    svg = el("svg", { id: id, viewBox: viewBox, class: "osc-companion" });
    anchor.insertAdjacentElement("afterend", svg);
    return svg;
  }

  // ===============================================================
  // Widget 1 & 2 (SHM) -- Spring-Mass + Phase Space
  // ===============================================================
  function initSHM() {
    const springSvg = document.getElementById("springSvg");
    if (!springSvg) return;
    const coil = document.getElementById("springCoil");
    const mass = document.getElementById("springMass");
    const xtPath = document.getElementById("springXtPath");
    const barKE = document.getElementById("springBarKE");
    const barPE = document.getElementById("springBarPE");
    const kSlider = document.getElementById("springKSlider");
    const kVal = document.getElementById("springKVal");
    const mSlider = document.getElementById("springMSlider");
    const mVal = document.getElementById("springMVal");
    const aSlider = document.getElementById("springASlider");
    const aVal = document.getElementById("springAVal");
    const wVal = document.getElementById("springWVal");
    const tVal = document.getElementById("springTVal");
    const eVal = document.getElementById("springEVal");
    const phaseEllipse = document.getElementById("phaseEllipse");
    const phaseDot = document.getElementById("phaseDot");
    const phaseXVal = document.getElementById("phaseXVal");
    const phaseVVal = document.getElementById("phaseVVal");

    const MASS_X0 = 150, PXPM_SPRING = 400, BAR_MAX = 55;
    const PHASE_CX = 110, PHASE_CY = 110;
    let phase = 0;

    function params() {
      const k = parseFloat(kSlider.value);
      const m = parseFloat(mSlider.value);
      const A = parseFloat(aSlider.value);
      const w = Math.sqrt(k / m);
      return { k, m, A, w, T: (2 * Math.PI) / w, E: 0.5 * k * A * A };
    }
    function redrawCurves() {
      const { A, w, T } = params();
      const toX = (t) => 40 + (t / (2 * T)) * 440;
      const toY = (x) => 50 - (clamp(x, -A, A) / A) * 35;
      let d = "";
      for (let i = 0; i <= 120; i++) {
        const t = (2 * T * i) / 120;
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(A * Math.cos(w * t)) + " ";
      }
      xtPath.setAttribute("d", d);
      const Aw = A * w, scaleX = 80 / A, scaleY = 80 / Aw;
      let de = "";
      for (let i = 0; i <= 80; i++) {
        const th = (2 * Math.PI * i) / 80;
        de += (i === 0 ? "M" : "L") + (PHASE_CX + A * Math.cos(th) * scaleX) + "," + (PHASE_CY + Aw * Math.sin(th) * scaleY) + " ";
      }
      phaseEllipse.setAttribute("d", de + "Z");
    }
    function redrawStatic() {
      const { k, m, A, w, T, E } = params();
      kVal.textContent = k + " N/m";
      mVal.textContent = m.toFixed(1) + " kg";
      aVal.textContent = A.toFixed(2) + " m";
      wVal.textContent = w.toFixed(2) + " rad/s";
      tVal.textContent = T.toFixed(2) + " s";
      eVal.textContent = E.toFixed(2) + " J";
      redrawCurves();
    }
    [kSlider, mSlider, aSlider].forEach((s) => s.addEventListener("input", redrawStatic));
    redrawStatic();

    addEquation(springSvg, "springEq",
      "Newton's law with a Hooke restoring force gives" +
      "<div class='osc-formula'>m&nbsp;&xdot;&xdot; = &minus;k&nbsp;x&nbsp;&nbsp;&rArr;&nbsp;&nbsp;&xdot;&xdot; + &omega;<sub>n</sub><sup>2</sup> x = 0,&nbsp;&nbsp;&omega;<sub>n</sub> = &radic;(k/m)</div>" +
      "Solution: x(t) = A&nbsp;cos(&omega;<sub>n</sub>t + &phi;), so the period T = 2&pi;&radic;(m/k) is amplitude-independent.");

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { k, m, A, w } = params();
      phase += w * dt;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      const t = phase / w;
      const x = A * Math.cos(w * t), v = -A * w * Math.sin(w * t);
      const ke = 0.5 * m * v * v, pe = 0.5 * k * x * x, total = ke + pe;
      const massX = MASS_X0 + x * PXPM_SPRING;
      mass.setAttribute("x", massX - 15);
      coil.setAttribute("d", "M20,80 L" + (massX - 15) + ",80");
      const barScale = total > 0 ? BAR_MAX / total : 0;
      barKE.setAttribute("y", 60 - ke * barScale); barKE.setAttribute("height", ke * barScale);
      barPE.setAttribute("y", 60 - pe * barScale); barPE.setAttribute("height", pe * barScale);
      const Aw = A * w, scaleX = 80 / A, scaleY = 80 / Aw;
      phaseDot.setAttribute("cx", PHASE_CX + x * scaleX);
      phaseDot.setAttribute("cy", PHASE_CY + v * scaleY);
      phaseXVal.textContent = x.toFixed(3) + " m";
      phaseVVal.textContent = v.toFixed(3) + " m/s";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 1 (Pendulums) -- Pendulum Timer
  // ===============================================================
  function initPendulumTimer() {
    const svg = document.getElementById("pendTimerSvg");
    if (!svg) return;
    const rod = document.getElementById("pendTimerRod");
    const bob = document.getElementById("pendTimerBob");
    const lSlider = document.getElementById("pendTimerLSlider");
    const lVal = document.getElementById("pendTimerLVal");
    const gSlider = document.getElementById("pendTimerGSlider");
    const gVal = document.getElementById("pendTimerGVal");
    const goBtn = document.getElementById("pendTimerGoBtn");
    const tVal = document.getElementById("pendTimerTVal");
    const countVal = document.getElementById("pendTimerCountVal");

    const PIVOT = { x: 100, y: 20 }, L_PX = 160, THETA0 = (15 * Math.PI) / 180;
    let running = false, rafId = null;

    function period() {
      return 2 * Math.PI * Math.sqrt(parseFloat(lSlider.value) / parseFloat(gSlider.value));
    }
    function place(theta) {
      const bx = PIVOT.x + L_PX * Math.sin(theta), by = PIVOT.y + L_PX * Math.cos(theta);
      rod.setAttribute("x2", bx); rod.setAttribute("y2", by);
      bob.setAttribute("cx", bx); bob.setAttribute("cy", by);
    }
    function redrawStatic() {
      tVal.textContent = period().toFixed(2) + " s";
      lVal.textContent = parseFloat(lSlider.value).toFixed(1) + " m";
      gVal.textContent = parseFloat(gSlider.value).toFixed(1) + " m/s²";
    }
    [lSlider, gSlider].forEach((s) => s.addEventListener("input", () => { redrawStatic(); if (!running) place(THETA0); }));
    redrawStatic(); place(THETA0);

    addEquation(svg, "pendTimerEq",
      "The pendulum obeys the <em>nonlinear</em> equation" +
      "<div class='osc-formula'>&theta;&xdot;&xdot; + (g/L) sin&theta; = 0</div>" +
      "For small &theta;, sin&theta; &asymp; &theta;, giving SHM with T = 2&pi;&radic;(L/g). " +
      "The large-angle correction appears in the next widget.");

    goBtn.addEventListener("click", () => {
      if (running) { running = false; goBtn.textContent = "▶ Start swinging"; return; }
      running = true; goBtn.textContent = "⏸ Stop"; countVal.textContent = "0";
      const T = period(), start = performance.now();
      let lastCount = 0;
      function frame(now) {
        if (!running) return;
        const t = (now - start) / 1000;
        place(THETA0 * Math.cos((2 * Math.PI * t) / T));
        const count = Math.floor(t / T);
        if (count !== lastCount) { lastCount = count; countVal.textContent = count; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Pendulums) -- Small-Angle Approximation (numeric)
  // ===============================================================
  function initPendulumAngleApprox() {
    const thetaSlider = document.getElementById("pendAngleThetaSlider");
    if (!thetaSlider) return;
    const thetaVal = document.getElementById("pendAngleThetaVal");
    const t0Val = document.getElementById("pendAngleT0Val");
    const tRealVal = document.getElementById("pendAngleTRealVal");
    const errVal = document.getElementById("pendAngleErrVal");
    const L = 1.0, T0 = 2 * Math.PI * Math.sqrt(L / G);

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const th = (thetaDeg * Math.PI) / 180;
      const TReal = T0 * (1 + (th * th) / 16 + (11 * Math.pow(th, 4)) / 3072);
      thetaVal.textContent = thetaDeg + "°";
      t0Val.textContent = T0.toFixed(2) + " s";
      tRealVal.textContent = TReal.toFixed(2) + " s";
      errVal.textContent = (((TReal - T0) / T0) * 100).toFixed(2) + "%";
    }
    thetaSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---- Shared damped / driven closed forms ----
  function dampedX(t, zeta, wn) {
    if (zeta < 0.999) {
      const wd = wn * Math.sqrt(1 - zeta * zeta);
      return Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
    } else if (zeta > 1.001) {
      const r1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
      const r2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
      const C1 = r2 / (r2 - r1);
      return C1 * Math.exp(r1 * t) + (1 - C1) * Math.exp(r2 * t);
    }
    return (1 + wn * t) * Math.exp(-wn * t);
  }
  function regimeName(zeta) {
    if (zeta < 0.98) return "Underdamped — oscillates while decaying";
    if (zeta > 1.02) return "Overdamped — slow, no oscillation";
    return "Critically damped — fastest non-oscillating return";
  }
  const ampAt = (r, zeta) => 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
  const phaseAt = (r, zeta) => Math.atan2(2 * zeta * r, 1 - r * r);

  // ===============================================================
  // Widget 1 (Damping) -- Damped-Oscillator Explorer  (+ ODE)
  // ===============================================================
  function initDampedOscillator() {
    const svg = document.getElementById("dampXtSvg");
    if (!svg) return;
    const xtPath = document.getElementById("dampXtPath");
    const envTop = document.getElementById("dampEnvelopeTop");
    const envBottom = document.getElementById("dampEnvelopeBottom");
    const presetRow = document.getElementById("dampPresetRow");
    const zetaSlider = document.getElementById("dampZetaSlider");
    const zetaVal = document.getElementById("dampZetaVal");
    const wnVal = document.getElementById("dampWnVal");
    const regimeVal = document.getElementById("dampRegimeVal");

    const M = 1, K = 40, WN = Math.sqrt(K / M), T_MAX = 3;
    const toX = (t) => 40 + (t / T_MAX) * 440;
    const toY = (x) => 70 - clamp(x, -1, 1) * 55;

    function redraw() {
      const zeta = parseFloat(zetaSlider.value);
      zetaVal.textContent = zeta.toFixed(2);
      wnVal.textContent = WN.toFixed(2) + " rad/s";
      regimeVal.textContent = regimeName(zeta);
      let d = "", dTop = "", dBottom = "";
      for (let i = 0; i <= 150; i++) {
        const t = (T_MAX * i) / 150;
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(dampedX(t, zeta, WN)) + " ";
        dTop += (i === 0 ? "M" : "L") + toX(t) + "," + toY(Math.exp(-zeta * WN * t)) + " ";
        dBottom += (i === 0 ? "M" : "L") + toX(t) + "," + toY(-Math.exp(-zeta * WN * t)) + " ";
      }
      xtPath.setAttribute("d", d);
      if (zeta < 0.98) {
        envTop.setAttribute("d", dTop); envTop.setAttribute("opacity", 1);
        envBottom.setAttribute("d", dBottom); envBottom.setAttribute("opacity", 1);
      } else { envTop.setAttribute("opacity", 0); envBottom.setAttribute("opacity", 0); }
    }
    presetRow.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        presetRow.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        zetaSlider.value = btn.dataset.zeta; redraw();
      });
    });
    zetaSlider.addEventListener("input", () => {
      presetRow.querySelectorAll("button").forEach((b) => b.classList.remove("active")); redraw();
    });
    redraw();

    addEquation(svg, "dampEq",
      "A mass on a spring with a velocity-proportional damper (force &minus;c&xdot;) obeys" +
      "<div class='osc-formula'>m&xdot;&xdot; + c&xdot; + k&nbsp;x = 0&nbsp;&nbsp;&rArr;&nbsp;&nbsp;&xdot;&xdot; + 2&zeta;&omega;<sub>n</sub>&xdot; + &omega;<sub>n</sub><sup>2</sup>x = 0</div>" +
      "with &omega;<sub>n</sub> = &radic;(k/m) and damping ratio &zeta; = c / (2&radic;(mk)). The character of the roots " +
      "s = &minus;&zeta;&omega;<sub>n</sub> &plusmn; &omega;<sub>n</sub>&radic;(&zeta;<sup>2</sup>&minus;1) sets the regime:" +
      "<ul class='osc-list'>" +
      "<li><b>&zeta; &lt; 1</b> (underdamped): x = e<sup>&minus;&zeta;&omega;<sub>n</sub>t</sup>[cos&omega;<sub>d</sub>t + (&zeta;/&radic;(1&minus;&zeta;<sup>2</sup>))sin&omega;<sub>d</sub>t], &nbsp;&omega;<sub>d</sub>=&omega;<sub>n</sub>&radic;(1&minus;&zeta;<sup>2</sup>)</li>" +
      "<li><b>&zeta; = 1</b> (critical): x = (1 + &omega;<sub>n</sub>t)e<sup>&minus;&omega;<sub>n</sub>t</sup></li>" +
      "<li><b>&zeta; &gt; 1</b> (overdamped): x = C<sub>1</sub>e<sup>s<sub>1</sub>t</sup> + C<sub>2</sub>e<sup>s<sub>2</sub>t</sup></li></ul>");
  }

  // ===============================================================
  // Widget 2 (Damping) -- Car Suspension After a Bump
  // ===============================================================
  function initSuspension() {
    const svg = document.getElementById("suspensionSvg");
    if (!svg) return;
    const car = document.getElementById("suspensionCar");
    const spring = document.getElementById("suspensionSpring");
    const damper = document.getElementById("suspensionDamper");
    const zetaSlider = document.getElementById("suspZetaSlider");
    const zetaVal = document.getElementById("suspZetaVal");
    const bumpBtn = document.getElementById("suspBumpBtn");
    const behaviorVal = document.getElementById("suspBehaviorVal");

    const WN = Math.sqrt(40), CAR_Y0 = 40, BUMP_PX = 25, T_MAX = 3;
    let animating = false, rafId = null;

    function redrawStatic() {
      const zeta = parseFloat(zetaSlider.value);
      zetaVal.textContent = "ζ = " + zeta.toFixed(2);
      behaviorVal.textContent = zeta < 0.98 ? "Overshoots and bounces before settling"
        : zeta > 1.02 ? "Sinks back slowly, no bounce" : "Returns to level fastest, no bounce";
    }
    zetaSlider.addEventListener("input", redrawStatic);
    redrawStatic();

    function placeCar(y) {
      car.setAttribute("y", y);
      spring.setAttribute("y1", y + 40);
      damper.setAttribute("y1", y + 40);
    }
    bumpBtn.addEventListener("click", () => {
      if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; bumpBtn.disabled = false; placeCar(CAR_Y0); return; }
      const zeta = parseFloat(zetaSlider.value);
      animating = true; bumpBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(T_MAX, Math.max(0, (now - start) / 1000));
        placeCar(CAR_Y0 - dampedX(t, zeta, WN) * BUMP_PX);
        if (t >= T_MAX) { animating = false; bumpBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Driven) -- Swing-Pushing Explorer  (+ live oscillator + ODE)
  // ===============================================================
  function initDrivenOscillator() {
    const svg = document.getElementById("drivenAmpSvg");
    if (!svg) return;
    const path = document.getElementById("drivenAmpPath");
    const marker = document.getElementById("drivenAmpMarker");
    const ratioSlider = document.getElementById("drivenRatioSlider");
    const ratioVal = document.getElementById("drivenRatioVal");
    const zetaSlider = document.getElementById("drivenZetaSlider");
    const zetaVal = document.getElementById("drivenZetaVal");
    const ampVal = document.getElementById("drivenAmpVal");
    const phaseVal = document.getElementById("drivenPhaseVal");
    const descVal = document.getElementById("drivenDescVal");

    const R_MAX = 2.5;
    const toX = (r) => 40 + (r / R_MAX) * 440;

    function redraw() {
      const r = parseFloat(ratioSlider.value), zeta = parseFloat(zetaSlider.value);
      const amp = ampAt(r, zeta), phaseDeg = (phaseAt(r, zeta) * 180) / Math.PI;
      ratioVal.textContent = r.toFixed(2) + "×";
      zetaVal.textContent = zeta.toFixed(2);
      ampVal.textContent = amp.toFixed(2) + "×";
      phaseVal.textContent = phaseDeg.toFixed(0) + "°";
      descVal.textContent = phaseDeg < 45 ? "Push mostly in sync with the motion"
        : phaseDeg < 135 ? "Quarter-cycle-ish lag — the efficient regime near resonance"
        : "Push almost opposes the motion — mostly fighting it";
      let ampMax = 0.01;
      for (let i = 0; i <= 200; i++) ampMax = Math.max(ampMax, Math.min(ampAt((R_MAX * i) / 200, zeta), 8));
      const toY = (a) => 110 - (clamp(a, 0, 8) / ampMax) * 95;
      let d = "";
      for (let i = 0; i <= 200; i++) {
        const rr = (R_MAX * i) / 200;
        d += (i === 0 ? "M" : "L") + toX(rr) + "," + toY(Math.min(ampAt(rr, zeta), 8)) + " ";
      }
      path.setAttribute("d", d);
      marker.setAttribute("cx", toX(r));
      marker.setAttribute("cy", toY(Math.min(amp, 8)));
    }
    ratioSlider.addEventListener("input", redraw);
    zetaSlider.addEventListener("input", redraw);
    redraw();

    addEquation(svg, "drivenEq",
      "A sinusoidally driven, damped oscillator obeys" +
      "<div class='osc-formula'>&xdot;&xdot; + 2&zeta;&omega;<sub>n</sub>&xdot; + &omega;<sub>n</sub><sup>2</sup>x = &omega;<sub>n</sub><sup>2</sup>F<sub>0</sub>cos(&omega;t)</div>" +
      "The steady-state solution x = X cos(&omega;t &minus; &phi;) has, with r = &omega;/&omega;<sub>n</sub>," +
      "<div class='osc-formula'>X / F<sub>0</sub> = 1 / &radic;((1&minus;r<sup>2</sup>)<sup>2</sup> + (2&zeta;r)<sup>2</sup>),&nbsp;&nbsp; tan&phi; = 2&zeta;r / (1&minus;r<sup>2</sup>)</div>");

    // --- Injected live time-domain oscillator (integrated) ---
    const comp = addCompanion(svg, "drivenTimeSvg", "0 0 480 120");
    if (comp) {
      comp.innerHTML = "";
      comp.appendChild(el("line", { x1: 30, y1: 60, x2: 470, y2: 60, stroke: "#e2e6ea", "stroke-width": 1 }));
      comp.appendChild(el("text", { x: 30, y: 16, "font-size": 11, fill: "#555" })).textContent = "live response (transient → steady state)";
      const driver = el("line", { x1: 45, y1: 60, x2: 45, y2: 60, stroke: "#c94b4b", "stroke-width": 3, "stroke-linecap": "round" });
      const wall = el("rect", { x: 30, y: 40, width: 6, height: 40, fill: "#9aa5b1" });
      const trace = el("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 2 });
      const massDot = el("circle", { r: 8, cy: 60, fill: "#2a78d6" });
      comp.appendChild(trace); comp.appendChild(wall); comp.appendChild(driver); comp.appendChild(massDot);

      const WN = 3;
      let x = 0, v = 0, t = 0, pts = [], last = performance.now();
      function tick(now) {
        const zeta = parseFloat(zetaSlider.value);
        const r = parseFloat(ratioSlider.value);
        const w = r * WN, F0 = 1;
        let rem = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
        const SUB = 0.002;
        while (rem > 0) {
          const h = Math.min(SUB, rem);
          const a = -2 * zeta * WN * v - WN * WN * x + WN * WN * F0 * Math.cos(w * t);
          v += a * h; x += v * h; t += h; rem -= h;
        }
        const cx = 220 + clamp(x, -4, 4) * 40;
        massDot.setAttribute("cx", cx);
        driver.setAttribute("x2", 45 + Math.cos(w * t) * 10);
        pts.push((470 - (t % 6) / 6 * 0).toFixed(1)); // keep array bounded cheaply
        // scrolling trace of x(t)
        const tw = 440, x0 = 30;
        const hist = massDot._h || (massDot._h = []);
        hist.push(clamp(x, -4, 4));
        if (hist.length > tw) hist.shift();
        let d = "";
        for (let i = 0; i < hist.length; i++) d += (i === 0 ? "M" : "L") + (x0 + i) + "," + (60 - hist[i] * 12) + " ";
        trace.setAttribute("d", d);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  // ===============================================================
  // Widget 1 (Resonance) -- Resonance Curve Family  (+ sweep + bouncing mass)
  // ===============================================================
  function initResonanceCurves() {
    const svg = document.getElementById("resCurveSvg");
    if (!svg) return;
    const curve1 = document.getElementById("resCurve1");
    const curve2 = document.getElementById("resCurve2");
    const curve3 = document.getElementById("resCurve3");
    const curve4 = document.getElementById("resCurve4");
    const zetaSlider = document.getElementById("resZetaSlider");
    const zetaVal = document.getElementById("resZetaVal");
    const peakAmpVal = document.getElementById("resPeakAmpVal");
    const peakFreqVal = document.getElementById("resPeakFreqVal");

    const R_MAX = 2.5, AMP_MAX = 10;
    const toX = (r) => 40 + (r / R_MAX) * 440;
    const toY = (a) => 140 - (clamp(a, 0, AMP_MAX) / AMP_MAX) * 125;

    function curveD(zeta) {
      let d = "";
      for (let i = 0; i <= 200; i++) {
        const r = (R_MAX * i) / 200;
        d += (i === 0 ? "M" : "L") + toX(r) + "," + toY(ampAt(r, zeta)) + " ";
      }
      return d;
    }
    curve1.setAttribute("d", curveD(0.05));
    curve2.setAttribute("d", curveD(0.15));
    curve3.setAttribute("d", curveD(0.4));
    curve4.setAttribute("d", curveD(1.0));

    // Injected sweeping marker + bouncing mass.
    const sweep = el("circle", { r: 5, fill: "#e34948" });
    const bounceTrack = el("line", { x1: 455, y1: 20, x2: 455, y2: 140, stroke: "#e2e6ea", "stroke-width": 1 });
    const bounceMass = el("rect", { x: 448, width: 14, height: 14, rx: 2, fill: "#2a78d6" });
    svg.appendChild(bounceTrack); svg.appendChild(sweep); svg.appendChild(bounceMass);

    function redraw() {
      const zeta = parseFloat(zetaSlider.value);
      zetaVal.textContent = zeta.toFixed(2);
      const inner = 1 - 2 * zeta * zeta;
      const peakR = inner > 0 ? Math.sqrt(inner) : 0;
      peakAmpVal.textContent = ampAt(peakR, zeta).toFixed(2) + "×";
      peakFreqVal.textContent = peakR.toFixed(3) + "×";
    }
    zetaSlider.addEventListener("input", redraw);
    redraw();

    addEquation(svg, "resEq",
      "Same driven equation as before. The steady amplitude X(r) peaks not exactly at r = 1 but at" +
      "<div class='osc-formula'>r<sub>peak</sub> = &radic;(1 &minus; 2&zeta;<sup>2</sup>),&nbsp;&nbsp;X<sub>peak</sub>/F<sub>0</sub> = 1 / (2&zeta;&radic;(1&minus;&zeta;<sup>2</sup>))</div>" +
      "As &zeta; &rarr; 0 the peak sharpens and blows up — that unbounded response is resonance.");

    let last = performance.now(), r = 0;
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const zeta = parseFloat(zetaSlider.value);
      r += 0.35 * dt; if (r > R_MAX) r = 0;
      sweep.setAttribute("cx", toX(r)); sweep.setAttribute("cy", toY(ampAt(r, zeta)));
      const amp = Math.min(ampAt(r, zeta), AMP_MAX);
      const y = 80 + Math.sin(now / 120) * amp * 5;
      bounceMass.setAttribute("y", clamp(y, 20, 126));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 2 (Resonance) -- Why Engineers Fear Resonance
  // ===============================================================
  function initBridgeResonance() {
    const fnSlider = document.getElementById("bridgeFnSlider");
    if (!fnSlider) return;
    const fnVal = document.getElementById("bridgeFnVal");
    const fdSlider = document.getElementById("bridgeFdSlider");
    const fdVal = document.getElementById("bridgeFdVal");
    const mismatchVal = document.getElementById("bridgeMismatchVal");
    const riskVal = document.getElementById("bridgeRiskVal");
    const barFn = document.getElementById("bridgeBarFn");
    const barFd = document.getElementById("bridgeBarFd");
    const F_MAX = 3, X0 = 20, BAR_PX = 190;

    function redraw() {
      const fn = parseFloat(fnSlider.value), fd = parseFloat(fdSlider.value);
      const mismatch = (Math.abs(fd - fn) / fn) * 100;
      fnVal.textContent = fn.toFixed(1) + " Hz";
      fdVal.textContent = fd.toFixed(1) + " Hz";
      mismatchVal.textContent = mismatch.toFixed(1) + "%";
      riskVal.textContent = mismatch < 5 ? "🔴 High — near-perfect resonance match"
        : mismatch < 20 ? "🟡 Moderate — noticeably amplified response" : "🟢 Low — frequencies well separated";
      barFn.setAttribute("x2", X0 + (fn / F_MAX) * BAR_PX);
      barFd.setAttribute("x2", X0 + (fd / F_MAX) * BAR_PX);
      barFd.setAttribute("stroke", mismatch < 5 ? "#e34948" : mismatch < 20 ? "#eb6834" : "#1baf7a");
    }
    fnSlider.addEventListener("input", redraw);
    fdSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // Widget 1 (Coupled) -- Beats  (+ scrubbing playhead)
  // ===============================================================
  function initBeats() {
    const svg = document.getElementById("beatsSvg");
    if (!svg) return;
    const wave = document.getElementById("beatsWave");
    const envTop = document.getElementById("beatsEnvTop");
    const envBottom = document.getElementById("beatsEnvBottom");
    const f1Slider = document.getElementById("beatsF1Slider");
    const f1Val = document.getElementById("beatsF1Val");
    const f2Slider = document.getElementById("beatsF2Slider");
    const f2Val = document.getElementById("beatsF2Val");
    const beatVal = document.getElementById("beatsBeatVal");
    const periodVal = document.getElementById("beatsPeriodVal");

    const toX_base = 10, toX_range = 480;
    let curT_MAX = 2;
    const toY = (y) => 70 - clamp(y, -2, 2) * 30;

    function redraw() {
      const f1 = parseFloat(f1Slider.value), f2 = parseFloat(f2Slider.value);
      const beatFreq = Math.abs(f1 - f2);
      const beatPeriod = beatFreq > 0.001 ? 1 / beatFreq : Infinity;
      f1Val.textContent = f1.toFixed(1) + " Hz";
      f2Val.textContent = f2.toFixed(1) + " Hz";
      beatVal.textContent = beatFreq.toFixed(1) + " Hz";
      periodVal.textContent = isFinite(beatPeriod) ? beatPeriod.toFixed(2) + " s" : "∞ (identical frequencies)";
      curT_MAX = isFinite(beatPeriod) ? clamp(2 * beatPeriod, 1, 6) : 2;
      const toX = (t) => toX_base + (t / curT_MAX) * toX_range;
      let d = "", dTop = "", dBottom = "";
      for (let i = 0; i <= 400; i++) {
        const t = (curT_MAX * i) / 400;
        const y = Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t);
        const env = 2 * Math.cos(2 * Math.PI * ((f1 - f2) / 2) * t);
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(y) + " ";
        dTop += (i === 0 ? "M" : "L") + toX(t) + "," + toY(env) + " ";
        dBottom += (i === 0 ? "M" : "L") + toX(t) + "," + toY(-env) + " ";
      }
      wave.setAttribute("d", d);
      envTop.setAttribute("d", dTop);
      envBottom.setAttribute("d", dBottom);
    }
    f1Slider.addEventListener("input", redraw);
    f2Slider.addEventListener("input", redraw);
    redraw();

    addEquation(svg, "beatsEq",
      "Adding two equal-amplitude tones and applying a sum-to-product identity:" +
      "<div class='osc-formula'>sin(2&pi;f<sub>1</sub>t) + sin(2&pi;f<sub>2</sub>t) = 2&nbsp;cos(2&pi;&middot;(f<sub>1</sub>&minus;f<sub>2</sub>)/2&nbsp;t)&nbsp;cos(2&pi;&middot;(f<sub>1</sub>+f<sub>2</sub>)/2&nbsp;t)</div>" +
      "A fast carrier at the average frequency, modulated by a slow envelope — you hear the amplitude swell at the beat frequency |f<sub>1</sub>&minus;f<sub>2</sub>|.");

    // Injected scrubbing playhead + dot on the wave.
    const playhead = el("line", { y1: 8, y2: 132, stroke: "#e34948", "stroke-width": 1.5, opacity: 0.7 });
    const dot = el("circle", { r: 4, fill: "#e34948" });
    svg.appendChild(playhead); svg.appendChild(dot);
    let last = performance.now(), t = 0;
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      t += dt; if (t > curT_MAX) t = 0;
      const f1 = parseFloat(f1Slider.value), f2 = parseFloat(f2Slider.value);
      const x = toX_base + (t / curT_MAX) * toX_range;
      const y = Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t);
      playhead.setAttribute("x1", x); playhead.setAttribute("x2", x);
      dot.setAttribute("cx", x); dot.setAttribute("cy", toY(y));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 2 (Coupled) -- Double Pendulum Chaos  (RK4, long run, toggle)
  // ===============================================================
  function initDoublePendulum() {
    const svg = document.getElementById("doublePendSvg");
    if (!svg) return;
    const traceA = document.getElementById("dpTraceA");
    const traceB = document.getElementById("dpTraceB");
    const rod1A = document.getElementById("dpRod1A"), rod2A = document.getElementById("dpRod2A");
    const bob1A = document.getElementById("dpBob1A"), bob2A = document.getElementById("dpBob2A");
    const rod1B = document.getElementById("dpRod1B"), rod2B = document.getElementById("dpRod2B");
    const bob1B = document.getElementById("dpBob1B"), bob2B = document.getElementById("dpBob2B");
    const thetaSlider = document.getElementById("dpThetaSlider");
    const thetaVal = document.getElementById("dpThetaVal");
    const gapSlider = document.getElementById("dpGapSlider");
    const gapVal = document.getElementById("dpGapVal");
    const goBtn = document.getElementById("dpGoBtn");
    const tVal = document.getElementById("dpTVal");
    const sepVal = document.getElementById("dpSepVal");

    const PIVOT = { x: 150, y: 30 }, SCALE = 70, T_MAX = 120;
    let running = false, rafId = null;

    // f(state) = [w1, w2, a1, a2] for equal masses & lengths (=1, g=G).
    function deriv(s) {
      const [th1, th2, w1, w2] = s;
      const dth = th1 - th2, denom = 3 - Math.cos(2 * dth);
      const a1 = (-G * 3 * Math.sin(th1) - G * Math.sin(th1 - 2 * th2) - 2 * Math.sin(dth) * (w2 * w2 + w1 * w1 * Math.cos(dth))) / denom;
      const a2 = (2 * Math.sin(dth) * (w1 * w1 * 2 + G * 2 * Math.cos(th1) + w2 * w2 * Math.cos(dth))) / denom;
      return [w1, w2, a1, a2];
    }
    function rk4(s, h) {
      const add = (a, b, f) => a.map((v, i) => v + b[i] * f);
      const k1 = deriv(s);
      const k2 = deriv(add(s, k1, h / 2));
      const k3 = deriv(add(s, k2, h / 2));
      const k4 = deriv(add(s, k3, h));
      return s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }
    const tips = (s) => {
      const x1 = PIVOT.x + SCALE * Math.sin(s[0]), y1 = PIVOT.y + SCALE * Math.cos(s[0]);
      return { x1, y1, x2: x1 + SCALE * Math.sin(s[1]), y2: y1 + SCALE * Math.cos(s[1]) };
    };
    function place(s, r1, r2, b1, b2) {
      const p = tips(s);
      r1.setAttribute("x2", p.x1); r1.setAttribute("y2", p.y1);
      r2.setAttribute("x1", p.x1); r2.setAttribute("y1", p.y1);
      r2.setAttribute("x2", p.x2); r2.setAttribute("y2", p.y2);
      b1.setAttribute("cx", p.x1); b1.setAttribute("cy", p.y1);
      b2.setAttribute("cx", p.x2); b2.setAttribute("cy", p.y2);
      return p;
    }
    const makeState = (t0) => [t0, t0, 0, 0];

    function redrawStatic() {
      thetaVal.textContent = thetaSlider.value + "°";
      gapVal.textContent = parseFloat(gapSlider.value).toFixed(2) + "°";
    }
    function resetView() {
      const s0 = makeState((parseFloat(thetaSlider.value) * Math.PI) / 180);
      place(s0, rod1A, rod2A, bob1A, bob2A);
      place(s0, rod1B, rod2B, bob1B, bob2B);
      traceA.setAttribute("d", ""); traceB.setAttribute("d", "");
      tVal.textContent = "0.0 s"; sepVal.textContent = "0.0 px";
    }
    thetaSlider.addEventListener("input", () => { redrawStatic(); if (!running) resetView(); });
    gapSlider.addEventListener("input", () => { redrawStatic(); if (!running) resetView(); });
    redrawStatic(); resetView();

    addEquation(svg, "dpEq",
      "For two equal rods (m, L) the Lagrangian yields two coupled second-order ODEs. With &Delta;=&theta;<sub>1</sub>&minus;&theta;<sub>2</sub>:" +
      "<div class='osc-formula'>&theta;&xdot;&xdot;<sub>1</sub> = [ &minus;3g&nbsp;sin&theta;<sub>1</sub> &minus; g&nbsp;sin(&theta;<sub>1</sub>&minus;2&theta;<sub>2</sub>) &minus; 2sin&Delta;(&omega;<sub>2</sub><sup>2</sup> + &omega;<sub>1</sub><sup>2</sup>cos&Delta;) ] / (3 &minus; cos2&Delta;)</div>" +
      "<div class='osc-formula'>&theta;&xdot;&xdot;<sub>2</sub> = [ 2sin&Delta;(2&omega;<sub>1</sub><sup>2</sup> + 2g&nbsp;cos&theta;<sub>1</sub> + &omega;<sub>2</sub><sup>2</sup>cos&Delta;) ] / (3 &minus; cos2&Delta;)</div>" +
      "There is no closed-form solution — this is integrated numerically (RK4). Two starts differing by a hair diverge exponentially: that is deterministic chaos.");

    goBtn.addEventListener("click", () => {
      if (running) { running = false; if (rafId) cancelAnimationFrame(rafId); goBtn.textContent = "▶ Run"; goBtn.disabled = false; return; }
      const theta0 = (parseFloat(thetaSlider.value) * Math.PI) / 180;
      const gap = (parseFloat(gapSlider.value) * Math.PI) / 180;
      let sA = makeState(theta0), sB = makeState(theta0 + gap);
      const ptsA = [], ptsB = [];
      running = true; goBtn.textContent = "⏸ Stop";
      traceA.setAttribute("d", ""); traceB.setAttribute("d", "");
      const SUB = 0.0015;
      let simTime = 0, lastFrame = performance.now();
      function frame(now) {
        if (!running) return;
        let rem = Math.min(0.04, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        while (rem > 0) { const h = Math.min(SUB, rem); sA = rk4(sA, h); sB = rk4(sB, h); simTime += h; rem -= h; }
        const pA = place(sA, rod1A, rod2A, bob1A, bob2A);
        const pB = place(sB, rod1B, rod2B, bob1B, bob2B);
        ptsA.push(pA.x2.toFixed(1) + "," + pA.y2.toFixed(1));
        ptsB.push(pB.x2.toFixed(1) + "," + pB.y2.toFixed(1));
        if (ptsA.length > 900) { ptsA.shift(); ptsB.shift(); }
        traceA.setAttribute("d", "M" + ptsA.join(" L"));
        traceB.setAttribute("d", "M" + ptsB.join(" L"));
        tVal.textContent = simTime.toFixed(1) + " s";
        sepVal.textContent = Math.hypot(pA.x2 - pB.x2, pA.y2 - pB.y2).toFixed(1) + " px";
        if (simTime >= T_MAX) { running = false; goBtn.textContent = "▶ Run"; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // NEW Widget -- Small-Angle vs Exact Pendulum  [#smallAngleHost]
  //   Sinusoidal small-angle model vs RK4 nonlinear pendulum, drifting apart.
  // ===============================================================
  function initSmallAngleCompare() {
    const host = document.getElementById("smallAngleHost");
    if (!host) return;
    host.classList.add("osc-widget");
    host.innerHTML =
      '<div class="osc-controls">' +
      '  <label>Amplitude θ₀ <input type="range" min="5" max="170" step="5" value="120" data-r="th"> <span data-o="th"></span>°</label>' +
      '  <button class="osc-go" data-go>Run / Stop</button>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 300 200", class: "osc-svg" });
    const PIVOT = { x: 150, y: 30 }, L = 130;
    svg.appendChild(el("line", { x1: 60, y1: 30, x2: 240, y2: 30, stroke: "#9aa5b1", "stroke-width": 4 }));
    const rodExact = el("line", { x1: PIVOT.x, y1: PIVOT.y, stroke: "#c94b4b", "stroke-width": 3 });
    const bobExact = el("circle", { r: 12, fill: "#c94b4b" });
    const rodApprox = el("line", { x1: PIVOT.x, y1: PIVOT.y, stroke: "#2a78d6", "stroke-width": 3, opacity: 0.7 });
    const bobApprox = el("circle", { r: 12, fill: "#2a78d6", opacity: 0.7 });
    svg.appendChild(rodApprox); svg.appendChild(rodExact); svg.appendChild(bobApprox); svg.appendChild(bobExact);
    const legend = el("text", { x: 10, y: 195, "font-size": 11, fill: "#555" });
    legend.textContent = "red = exact  ·  blue = small-angle (SHM)";
    svg.appendChild(legend);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "osc-readouts";
    readouts.innerHTML =
      '<div>T₀ (small-angle): <b data-o="t0">—</b></div>' +
      '<div>T (exact): <b data-o="treal">—</b></div>' +
      '<div>Period error: <b data-o="err">—</b></div>' +
      '<div class="osc-verdict">The exact pendulum swings slower at large amplitude, so the two drift out of step — the small-angle model is only good for θ₀ ≲ 20°.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const thS = q('[data-r="th"]'), out = (n) => host.querySelector('[data-o="' + n + '"]');
    const Lp = 1.0, wn = Math.sqrt(G / Lp), T0 = 2 * Math.PI / wn;
    let running = false, rafId = null, th = 0, w = 0, t = 0, last = 0;

    function place(rod, bob, angle) {
      const bx = PIVOT.x + L * Math.sin(angle), by = PIVOT.y + L * Math.cos(angle);
      rod.setAttribute("x2", bx); rod.setAttribute("y2", by);
      bob.setAttribute("cx", bx); bob.setAttribute("cy", by);
    }
    function stats() {
      const th0 = (parseFloat(thS.value) * Math.PI) / 180;
      const TReal = T0 * (1 + th0 * th0 / 16 + 11 * Math.pow(th0, 4) / 3072);
      out("th").textContent = parseFloat(thS.value);
      out("t0").textContent = T0.toFixed(2) + " s";
      out("treal").textContent = TReal.toFixed(2) + " s";
      out("err").textContent = (((TReal - T0) / T0) * 100).toFixed(1) + "%";
      return th0;
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId); running = false;
      const th0 = stats(); th = th0; w = 0; t = 0;
      place(rodExact, bobExact, th0); place(rodApprox, bobApprox, th0);
    }
    thS.addEventListener("input", reset);
    reset();

    q("[data-go]").addEventListener("click", () => {
      if (running) { reset(); return; }
      const th0 = stats(); th = th0; w = 0; t = 0;
      running = true; last = performance.now();
      function tick(now) {
        if (!running) return;
        let rem = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
        const SUB = 0.002;
        while (rem > 0) {
          const h = Math.min(SUB, rem);
          const a = -wn * wn * Math.sin(th); // exact nonlinear
          w += a * h; th += w * h; t += h; rem -= h;
        }
        place(rodExact, bobExact, th);
        place(rodApprox, bobApprox, th0 * Math.cos(wn * t)); // small-angle SHM
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });
  }

  // ===============================================================
  // NEW Widget -- Coupled Pendulums / Normal Modes  [#coupledHost]
  //   Two pendulums coupled by a spring; energy sloshes (beats between
  //   symmetric and antisymmetric normal modes).
  // ===============================================================
  function initCoupledPendulums() {
    const host = document.getElementById("coupledHost");
    if (!host) return;
    host.classList.add("osc-widget");
    host.innerHTML =
      '<div class="osc-controls">' +
      '  <label>Coupling k <input type="range" min="0" max="3" step="0.1" value="1" data-r="k"> <span data-o="k"></span></label>' +
      '  <div class="osc-presets" data-role="mode">' +
      '    <button data-mode="beat" class="active">One pushed (beats)</button>' +
      '    <button data-mode="sym">Symmetric mode</button>' +
      '    <button data-mode="anti">Antisymmetric mode</button>' +
      '  </div>' +
      '  <button class="osc-go" data-go>Run / Stop</button>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 300 200", class: "osc-svg" });
    svg.appendChild(el("line", { x1: 30, y1: 26, x2: 270, y2: 26, stroke: "#9aa5b1", "stroke-width": 4 }));
    const P1 = { x: 110, y: 26 }, P2 = { x: 190, y: 26 }, L = 130;
    const rod1 = el("line", { x1: P1.x, y1: P1.y, stroke: "#33415c", "stroke-width": 2 });
    const rod2 = el("line", { x1: P2.x, y1: P2.y, stroke: "#33415c", "stroke-width": 2 });
    const spring = el("line", { stroke: "#3a9d5a", "stroke-width": 2, "stroke-dasharray": "4 3" });
    const bob1 = el("circle", { r: 13, fill: "#c94b4b" });
    const bob2 = el("circle", { r: 13, fill: "#2a78d6" });
    svg.appendChild(spring); svg.appendChild(rod1); svg.appendChild(rod2); svg.appendChild(bob1); svg.appendChild(bob2);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "osc-readouts";
    readouts.innerHTML =
      '<div>Mode freqs: <b data-o="modes">—</b></div>' +
      '<div class="osc-verdict">Two identical pendulums linked by a spring have two normal modes — swinging together (ω₋=√(g/L)) and against each other (ω₊=√(g/L+2k/m)). Any other start is a superposition, so energy beats back and forth.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const kS = q('[data-r="k"]'), out = (n) => host.querySelector('[data-o="' + n + '"]');
    const modeBtns = Array.from(host.querySelectorAll('[data-role="mode"] button'));
    let mode = "beat";
    modeBtns.forEach((b) => b.addEventListener("click", () => {
      modeBtns.forEach((x) => x.classList.remove("active")); b.classList.add("active");
      mode = b.dataset.mode; reset();
    }));

    const wg2 = G / 1.3; // g/L base
    let th1 = 0, th2 = 0, w1 = 0, w2 = 0, running = false, rafId = null, last = 0;

    function place() {
      const b1x = P1.x + L * Math.sin(th1), b1y = P1.y + L * Math.cos(th1);
      const b2x = P2.x + L * Math.sin(th2), b2y = P2.y + L * Math.cos(th2);
      rod1.setAttribute("x2", b1x); rod1.setAttribute("y2", b1y);
      rod2.setAttribute("x2", b2x); rod2.setAttribute("y2", b2y);
      bob1.setAttribute("cx", b1x); bob1.setAttribute("cy", b1y);
      bob2.setAttribute("cx", b2x); bob2.setAttribute("cy", b2y);
      spring.setAttribute("x1", b1x); spring.setAttribute("y1", b1y);
      spring.setAttribute("x2", b2x); spring.setAttribute("y2", b2y);
    }
    function stats() {
      const k = parseFloat(kS.value);
      out("k").textContent = k.toFixed(1);
      const wsym = Math.sqrt(wg2), wanti = Math.sqrt(wg2 + 2 * k);
      out("modes").textContent = "ω₋=" + wsym.toFixed(2) + ", ω₊=" + wanti.toFixed(2) + " rad/s";
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId); running = false;
      const A = 0.4;
      if (mode === "sym") { th1 = A; th2 = A; }
      else if (mode === "anti") { th1 = A; th2 = -A; }
      else { th1 = A; th2 = 0; }
      w1 = 0; w2 = 0; stats(); place();
    }
    kS.addEventListener("input", () => { stats(); if (!running) reset(); });
    reset();

    q("[data-go]").addEventListener("click", () => {
      if (running) { reset(); return; }
      running = true; last = performance.now();
      function tick(now) {
        if (!running) return;
        const k = parseFloat(kS.value);
        let rem = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
        const SUB = 0.002;
        while (rem > 0) {
          const h = Math.min(SUB, rem);
          const a1 = -wg2 * th1 - k * (th1 - th2);
          const a2 = -wg2 * th2 - k * (th2 - th1);
          w1 += a1 * h; w2 += a2 * h; th1 += w1 * h; th2 += w2 * h; rem -= h;
        }
        place();
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });
  }

  // ===============================================================
  // NEW Widget -- Lissajous Figures  [#lissajousHost]
  //   Perpendicular SHMs: x=sin(a t + δ), y=sin(b t).
  // ===============================================================
  function initLissajous() {
    const host = document.getElementById("lissajousHost");
    if (!host) return;
    host.classList.add("osc-widget");
    host.innerHTML =
      '<div class="osc-controls">' +
      '  <label>Freq ratio a:b <input type="range" min="1" max="5" step="1" value="3" data-r="a"> : ' +
      '    <input type="range" min="1" max="5" step="1" value="2" data-r="b"> <span data-o="ab"></span></label>' +
      '  <label>Phase δ <input type="range" min="0" max="180" step="5" value="90" data-r="d"> <span data-o="d"></span>°</label>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 200 200", class: "osc-svg", style: "max-height:220px" });
    svg.appendChild(el("rect", { x: 10, y: 10, width: 180, height: 180, fill: "none", stroke: "#e2e6ea" }));
    const curve = el("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 2 });
    const dot = el("circle", { r: 4, fill: "#e34948" });
    svg.appendChild(curve); svg.appendChild(dot);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "osc-readouts";
    readouts.innerHTML =
      '<div class="osc-verdict">Two perpendicular SHMs, x = sin(a·t + δ), y = sin(b·t). Rational frequency ratios trace closed Lissajous figures — the basis of the classic oscilloscope patterns.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const aS = q('[data-r="a"]'), bS = q('[data-r="b"]'), dS = q('[data-r="d"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const CX = 100, CY = 100, R = 80;

    function drawCurve() {
      const a = parseFloat(aS.value), b = parseFloat(bS.value), d = (parseFloat(dS.value) * Math.PI) / 180;
      out("ab").textContent = a + ":" + b;
      out("d").textContent = parseFloat(dS.value);
      let path = "";
      for (let i = 0; i <= 400; i++) {
        const t = (2 * Math.PI * i) / 400;
        const x = CX + R * Math.sin(a * t + d), y = CY + R * Math.sin(b * t);
        path += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
      }
      curve.setAttribute("d", path);
    }
    [aS, bS, dS].forEach((s) => s.addEventListener("input", drawCurve));
    drawCurve();

    let last = performance.now(), t = 0;
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      t += dt * 1.2; if (t > 2 * Math.PI) t -= 2 * Math.PI;
      const a = parseFloat(aS.value), b = parseFloat(bS.value), d = (parseFloat(dS.value) * Math.PI) / 180;
      dot.setAttribute("cx", CX + R * Math.sin(a * t + d));
      dot.setAttribute("cy", CY + R * Math.sin(b * t));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initSHM();
    initPendulumTimer();
    initPendulumAngleApprox();
    initDampedOscillator();
    initSuspension();
    initDrivenOscillator();
    initResonanceCurves();
    initBridgeResonance();
    initBeats();
    initDoublePendulum();
    // New widgets (safe no-op until their host div is added):
    initSmallAngleCompare();
    initCoupledPendulums();
    initLissajous();
  });
})();
