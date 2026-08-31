// Interactive widgets for docs/08-oscillations/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
(function () {
  const G = 9.8;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ---------------------------------------------------------------
  // Widget 1 & 2 (Simple Harmonic Motion) -- Spring-Mass + Phase Space
  // (driven by one shared clock so both widgets stay in sync)
  // ---------------------------------------------------------------
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
      const T = (2 * Math.PI) / w;
      const E = 0.5 * k * A * A;
      return { k, m, A, w, T, E };
    }

    function redrawCurves() {
      const { A, w, T } = params();
      const toX = (t) => 40 + (t / (2 * T)) * 440;
      const toY = (x) => 50 - (clamp(x, -A, A) / A) * 35;
      let d = "";
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const t = (2 * T * i) / N;
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(A * Math.cos(w * t)) + " ";
      }
      xtPath.setAttribute("d", d);

      const Aw = A * w;
      const scaleX = 80 / A, scaleY = 80 / Aw;
      let de = "";
      for (let i = 0; i <= 80; i++) {
        const th = (2 * Math.PI * i) / 80;
        const px = PHASE_CX + A * Math.cos(th) * scaleX;
        const py = PHASE_CY + Aw * Math.sin(th) * scaleY;
        de += (i === 0 ? "M" : "L") + px + "," + py + " ";
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

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { k, m, A, w } = params();
      phase += w * dt;
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      const t = phase / w;
      const x = A * Math.cos(w * t);
      const v = -A * w * Math.sin(w * t);
      const ke = 0.5 * m * v * v;
      const pe = 0.5 * k * x * x;
      const total = ke + pe;

      const massX = MASS_X0 + x * PXPM_SPRING;
      mass.setAttribute("x", massX - 15);
      coil.setAttribute("d", "M20,80 L" + (massX - 15) + ",80");

      const barScale = total > 0 ? BAR_MAX / total : 0;
      barKE.setAttribute("y", 60 - ke * barScale); barKE.setAttribute("height", ke * barScale);
      barPE.setAttribute("y", 60 - pe * barScale); barPE.setAttribute("height", pe * barScale);

      const Aw = A * w;
      const scaleX = 80 / A, scaleY = 80 / Aw;
      phaseDot.setAttribute("cx", PHASE_CX + x * scaleX);
      phaseDot.setAttribute("cy", PHASE_CY + v * scaleY);
      phaseXVal.textContent = x.toFixed(3) + " m";
      phaseVVal.textContent = v.toFixed(3) + " m/s";

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 1 (Pendulums) -- Pendulum Timer
  // ---------------------------------------------------------------
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
      const L = parseFloat(lSlider.value);
      const g = parseFloat(gSlider.value);
      return 2 * Math.PI * Math.sqrt(L / g);
    }

    function place(theta) {
      const bx = PIVOT.x + L_PX * Math.sin(theta);
      const by = PIVOT.y + L_PX * Math.cos(theta);
      rod.setAttribute("x2", bx); rod.setAttribute("y2", by);
      bob.setAttribute("cx", bx); bob.setAttribute("cy", by);
    }

    function redrawStatic() {
      tVal.textContent = period().toFixed(2) + " s";
      lVal.textContent = parseFloat(lSlider.value).toFixed(1) + " m";
      gVal.textContent = parseFloat(gSlider.value).toFixed(1) + " m/s²";
    }
    [lSlider, gSlider].forEach((s) => s.addEventListener("input", () => { redrawStatic(); if (!running) place(THETA0); }));
    redrawStatic();
    place(THETA0);

    goBtn.addEventListener("click", () => {
      if (running) {
        running = false;
        goBtn.textContent = "▶ Start swinging";
        return;
      }
      running = true;
      goBtn.textContent = "⏸ Stop";
      countVal.textContent = "0";
      const T = period();
      const start = performance.now();
      let lastCount = 0;
      function frame(now) {
        if (!running) return;
        const t = (now - start) / 1000;
        const theta = THETA0 * Math.cos((2 * Math.PI * t) / T);
        place(theta);
        const count = Math.floor(t / T);
        if (count !== lastCount) { lastCount = count; countVal.textContent = count; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Pendulums) -- When the Small-Angle Approximation Breaks Down
  // ---------------------------------------------------------------
  function initPendulumAngleApprox() {
    const thetaSlider = document.getElementById("pendAngleThetaSlider");
    if (!thetaSlider) return;
    const thetaVal = document.getElementById("pendAngleThetaVal");
    const t0Val = document.getElementById("pendAngleT0Val");
    const tRealVal = document.getElementById("pendAngleTRealVal");
    const errVal = document.getElementById("pendAngleErrVal");

    const L = 1.0;
    const T0 = 2 * Math.PI * Math.sqrt(L / G);

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const thetaRad = (thetaDeg * Math.PI) / 180;
      const TReal = T0 * (1 + (thetaRad * thetaRad) / 16 + (11 * Math.pow(thetaRad, 4)) / 3072);
      const err = ((TReal - T0) / T0) * 100;

      thetaVal.textContent = thetaDeg + "°";
      t0Val.textContent = T0.toFixed(2) + " s";
      tRealVal.textContent = TReal.toFixed(2) + " s";
      errVal.textContent = err.toFixed(2) + "%";
    }
    thetaSlider.addEventListener("input", redraw);
    redraw();
  }

  // Shared damped-oscillator displacement, x(0)=1, v(0)=0.
  function dampedX(t, zeta, wn) {
    if (zeta < 0.999) {
      const wd = wn * Math.sqrt(1 - zeta * zeta);
      return Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
    } else if (zeta > 1.001) {
      const r1 = -zeta * wn + wn * Math.sqrt(zeta * zeta - 1);
      const r2 = -zeta * wn - wn * Math.sqrt(zeta * zeta - 1);
      const C1 = r2 / (r2 - r1);
      const C2 = 1 - C1;
      return C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
    } else {
      return (1 + wn * t) * Math.exp(-wn * t);
    }
  }
  function regimeName(zeta) {
    if (zeta < 0.98) return "Underdamped — oscillates while decaying";
    if (zeta > 1.02) return "Overdamped — slow, no oscillation";
    return "Critically damped — fastest non-oscillating return";
  }

  // Shared steady-state driven-oscillator response (relative amplitude,
  // normalized so a static push would deflect by 1 unit) and phase lag.
  function ampAt(r, zeta) {
    return 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
  }
  function phaseAt(r, zeta) {
    return Math.atan2(2 * zeta * r, 1 - r * r);
  }

  // ---------------------------------------------------------------
  // Widget 1 (Damping) -- Damped-Oscillator Explorer
  // ---------------------------------------------------------------
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
      const N = 150;
      for (let i = 0; i <= N; i++) {
        const t = (T_MAX * i) / N;
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(dampedX(t, zeta, WN)) + " ";
        dTop += (i === 0 ? "M" : "L") + toX(t) + "," + toY(Math.exp(-zeta * WN * t)) + " ";
        dBottom += (i === 0 ? "M" : "L") + toX(t) + "," + toY(-Math.exp(-zeta * WN * t)) + " ";
      }
      xtPath.setAttribute("d", d);
      if (zeta < 0.98) {
        envTop.setAttribute("d", dTop); envTop.setAttribute("opacity", 1);
        envBottom.setAttribute("d", dBottom); envBottom.setAttribute("opacity", 1);
      } else {
        envTop.setAttribute("opacity", 0);
        envBottom.setAttribute("opacity", 0);
      }
    }
    presetRow.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        presetRow.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        zetaSlider.value = btn.dataset.zeta;
        redraw();
      });
    });
    zetaSlider.addEventListener("input", () => {
      presetRow.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      redraw();
    });
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Damping) -- Car Suspension After a Bump
  // ---------------------------------------------------------------
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
      behaviorVal.textContent = zeta < 0.98 ? "Overshoots and bounces before settling" : zeta > 1.02 ? "Sinks back slowly, no bounce" : "Returns to level fastest, no bounce";
    }
    zetaSlider.addEventListener("input", redrawStatic);
    redrawStatic();

    function placeCar(y) {
      car.setAttribute("y", y);
      spring.setAttribute("y1", y + 40);
      damper.setAttribute("y1", y + 40);
    }

    bumpBtn.addEventListener("click", () => {
      if (animating) return;
      const zeta = parseFloat(zetaSlider.value);
      animating = true;
      bumpBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(T_MAX, Math.max(0, (now - start) / 1000));
        const x = dampedX(t, zeta, WN);
        placeCar(CAR_Y0 - x * BUMP_PX);
        if (t >= T_MAX) {
          animating = false;
          bumpBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Driven Oscillations) -- Swing-Pushing Explorer
  // ---------------------------------------------------------------
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
    function phaseAt(r, zeta) {
      return Math.atan2(2 * zeta * r, 1 - r * r);
    }

    function redraw() {
      const r = parseFloat(ratioSlider.value);
      const zeta = parseFloat(zetaSlider.value);
      const amp = ampAt(r, zeta);
      const phaseDeg = (phaseAt(r, zeta) * 180) / Math.PI;

      ratioVal.textContent = r.toFixed(2) + "×";
      zetaVal.textContent = zeta.toFixed(2);
      ampVal.textContent = amp.toFixed(2) + "×";
      phaseVal.textContent = phaseDeg.toFixed(0) + "°";
      descVal.textContent =
        phaseDeg < 45 ? "Push mostly in sync with the motion" : phaseDeg < 135 ? "Quarter-cycle-ish lag — the efficient regime near resonance" : "Push almost opposes the motion — mostly fighting it";

      let ampMax = 0.01;
      for (let i = 0; i <= 200; i++) {
        const rr = (R_MAX * i) / 200;
        ampMax = Math.max(ampMax, Math.min(ampAt(rr, zeta), 8));
      }
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
  }

  // ---------------------------------------------------------------
  // Widget 1 (Resonance) -- Resonance Curve Family
  // ---------------------------------------------------------------
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

    function redraw() {
      const zeta = parseFloat(zetaSlider.value);
      zetaVal.textContent = zeta.toFixed(2);
      const inner = 1 - 2 * zeta * zeta;
      const peakR = inner > 0 ? Math.sqrt(inner) : 0;
      const peakAmp = ampAt(peakR, zeta);
      peakAmpVal.textContent = peakAmp.toFixed(2) + "×";
      peakFreqVal.textContent = peakR.toFixed(3) + "×";
    }
    zetaSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Resonance) -- Why Engineers Fear Resonance
  // ---------------------------------------------------------------
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
      const fn = parseFloat(fnSlider.value);
      const fd = parseFloat(fdSlider.value);
      const mismatch = (Math.abs(fd - fn) / fn) * 100;
      fnVal.textContent = fn.toFixed(1) + " Hz";
      fdVal.textContent = fd.toFixed(1) + " Hz";
      mismatchVal.textContent = mismatch.toFixed(1) + "%";
      riskVal.textContent =
        mismatch < 5 ? "🔴 High — near-perfect resonance match" : mismatch < 20 ? "🟡 Moderate — noticeably amplified response" : "🟢 Low — frequencies well separated";
      barFn.setAttribute("x2", X0 + (fn / F_MAX) * BAR_PX);
      barFd.setAttribute("x2", X0 + (fd / F_MAX) * BAR_PX);
      barFd.setAttribute("stroke", mismatch < 5 ? "#e34948" : mismatch < 20 ? "#eb6834" : "#1baf7a");
    }
    fnSlider.addEventListener("input", redraw);
    fdSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Coupled Oscillators) -- Beats
  // ---------------------------------------------------------------
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

    function redraw() {
      const f1 = parseFloat(f1Slider.value);
      const f2 = parseFloat(f2Slider.value);
      const beatFreq = Math.abs(f1 - f2);
      const beatPeriod = beatFreq > 0.001 ? 1 / beatFreq : Infinity;

      f1Val.textContent = f1.toFixed(1) + " Hz";
      f2Val.textContent = f2.toFixed(1) + " Hz";
      beatVal.textContent = beatFreq.toFixed(1) + " Hz";
      periodVal.textContent = isFinite(beatPeriod) ? beatPeriod.toFixed(2) + " s" : "∞ (identical frequencies)";

      const T_MAX = isFinite(beatPeriod) ? clamp(2 * beatPeriod, 1, 6) : 2;
      const toX = (t) => toX_base + (t / T_MAX) * toX_range;
      const toY = (y) => 70 - clamp(y, -2, 2) * 30;

      let d = "", dTop = "", dBottom = "";
      const N = 400;
      for (let i = 0; i <= N; i++) {
        const t = (T_MAX * i) / N;
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
  }

  // ---------------------------------------------------------------
  // Widget 2 (Coupled Oscillators) -- Double Pendulum Chaos
  // ---------------------------------------------------------------
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

    const PIVOT = { x: 150, y: 30 }, SCALE = 70, T_MAX = 25;
    let animating = false, rafId = null;

    function derivs(th1, th2, w1, w2) {
      const dth = th1 - th2;
      const denom = 3 - Math.cos(2 * dth);
      const a1 = (-G * 3 * Math.sin(th1) - G * Math.sin(th1 - 2 * th2) - 2 * Math.sin(dth) * (w2 * w2 + w1 * w1 * Math.cos(dth))) / denom;
      const a2 = (2 * Math.sin(dth) * (w1 * w1 * 2 + G * 2 * Math.cos(th1) + w2 * w2 * Math.cos(dth))) / denom;
      return [a1, a2];
    }

    function makeState(theta0) {
      return { th1: theta0, th2: theta0, w1: 0, w2: 0 };
    }
    function step(s, dt) {
      const [a1, a2] = derivs(s.th1, s.th2, s.w1, s.w2);
      s.w1 += a1 * dt; s.w2 += a2 * dt;
      s.th1 += s.w1 * dt; s.th2 += s.w2 * dt;
    }
    function tipsOf(s) {
      const x1 = PIVOT.x + SCALE * Math.sin(s.th1), y1 = PIVOT.y + SCALE * Math.cos(s.th1);
      const x2 = x1 + SCALE * Math.sin(s.th2), y2 = y1 + SCALE * Math.cos(s.th2);
      return { x1, y1, x2, y2 };
    }
    function place(s, rod1, rod2, bob1, bob2) {
      const { x1, y1, x2, y2 } = tipsOf(s);
      rod1.setAttribute("x2", x1); rod1.setAttribute("y2", y1);
      rod2.setAttribute("x1", x1); rod2.setAttribute("y1", y1);
      rod2.setAttribute("x2", x2); rod2.setAttribute("y2", y2);
      bob1.setAttribute("cx", x1); bob1.setAttribute("cy", y1);
      bob2.setAttribute("cx", x2); bob2.setAttribute("cy", y2);
      return { x2, y2 };
    }

    function redrawStatic() {
      thetaVal.textContent = thetaSlider.value + "°";
      gapVal.textContent = parseFloat(gapSlider.value).toFixed(2) + "°";
    }
    thetaSlider.addEventListener("input", () => {
      redrawStatic();
      if (!animating) {
        const s = makeState((parseFloat(thetaSlider.value) * Math.PI) / 180);
        place(s, rod1A, rod2A, bob1A, bob2A);
        place(s, rod1B, rod2B, bob1B, bob2B);
      }
    });
    gapSlider.addEventListener("input", redrawStatic);
    redrawStatic();
    {
      const s0 = makeState((parseFloat(thetaSlider.value) * Math.PI) / 180);
      place(s0, rod1A, rod2A, bob1A, bob2A);
      place(s0, rod1B, rod2B, bob1B, bob2B);
    }

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const theta0 = (parseFloat(thetaSlider.value) * Math.PI) / 180;
      const gap = (parseFloat(gapSlider.value) * Math.PI) / 180;
      const stateA = makeState(theta0);
      const stateB = makeState(theta0 + gap);
      const ptsA = [], ptsB = [];

      animating = true;
      goBtn.disabled = true;
      traceA.setAttribute("d", ""); traceB.setAttribute("d", "");
      const SUBSTEP = 0.001;
      let simTime = 0, lastFrame = performance.now();
      function frame(now) {
        let remaining = Math.min(0.04, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        while (remaining > 0) {
          const h = Math.min(SUBSTEP, remaining);
          step(stateA, h);
          step(stateB, h);
          simTime += h;
          remaining -= h;
        }
        const tipA = place(stateA, rod1A, rod2A, bob1A, bob2A);
        const tipB = place(stateB, rod1B, rod2B, bob1B, bob2B);
        ptsA.push(tipA.x2.toFixed(1) + "," + tipA.y2.toFixed(1));
        ptsB.push(tipB.x2.toFixed(1) + "," + tipB.y2.toFixed(1));
        if (ptsA.length > 600) { ptsA.shift(); ptsB.shift(); }
        traceA.setAttribute("d", "M" + ptsA.join(" L"));
        traceB.setAttribute("d", "M" + ptsB.join(" L"));

        tVal.textContent = simTime.toFixed(1) + " s";
        sepVal.textContent = Math.hypot(tipA.x2 - tipB.x2, tipA.y2 - tipB.y2).toFixed(1) + " px";

        if (simTime >= T_MAX) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

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
  });
})();
