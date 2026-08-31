// Interactive widgets for docs/06-circular-motion/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
(function () {
  const G = 9.8;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ---------------------------------------------------------------
  // Widget 1 (Uniform Circular Motion) -- Ball on a String
  // ---------------------------------------------------------------
  function initBallOnString() {
    const svg = document.getElementById("ucmSvg");
    if (!svg) return;
    const orbit = document.getElementById("ucmOrbit");
    const string = document.getElementById("ucmString");
    const ball = document.getElementById("ucmBall");
    const vArrow = document.getElementById("ucmVArrow");
    const fArrow = document.getElementById("ucmFArrow");
    const rSlider = document.getElementById("ucmRSlider");
    const rVal = document.getElementById("ucmRVal");
    const vSlider = document.getElementById("ucmVSlider");
    const vVal = document.getElementById("ucmVVal");
    const mSlider = document.getElementById("ucmMSlider");
    const mVal = document.getElementById("ucmMVal");
    const cutBtn = document.getElementById("ucmCutBtn");
    const aVal = document.getElementById("ucmAVal");
    const fVal = document.getElementById("ucmFVal");
    const wVal = document.getElementById("ucmWVal");

    const CX = 150, CY = 150, PXPM = 100;
    let angle = 0, mode = "circular", flyStart = 0, flyPos = { x: 0, y: 0 }, flyVel = { x: 0, y: 0 };

    function current() {
      const r = parseFloat(rSlider.value);
      const v = parseFloat(vSlider.value);
      const m = parseFloat(mSlider.value);
      const a = (v * v) / r;
      const f = m * a;
      const w = v / r;
      return { r, v, m, a, f, w };
    }

    function redrawReadout() {
      const { r, v, m, a, f, w } = current();
      rVal.textContent = r.toFixed(1) + " m";
      vVal.textContent = v + " m/s";
      mVal.textContent = m.toFixed(2) + " kg";
      aVal.textContent = a.toFixed(2) + " m/s²";
      fVal.textContent = f.toFixed(2) + " N";
      wVal.textContent = w.toFixed(2) + " rad/s";
      orbit.setAttribute("r", r * PXPM);
    }
    [rSlider, vSlider, mSlider].forEach((s) => s.addEventListener("input", redrawReadout));
    redrawReadout();

    cutBtn.addEventListener("click", () => {
      if (mode !== "circular") return;
      const { v } = current();
      const rPx = parseFloat(orbit.getAttribute("r"));
      const bx = CX + rPx * Math.cos(angle), by = CY - rPx * Math.sin(angle);
      const dirX = -Math.sin(angle), dirY = -Math.cos(angle);
      flyPos = { x: bx, y: by };
      flyVel = { x: dirX * v * PXPM, y: dirY * v * PXPM };
      mode = "flying";
      flyStart = performance.now();
      cutBtn.disabled = true;
      string.setAttribute("opacity", 0);
      fArrow.setAttribute("opacity", 0);
    });

    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { r, w } = current();
      const rPx = r * PXPM;

      if (mode === "circular") {
        angle += w * dt;
        const bx = CX + rPx * Math.cos(angle), by = CY - rPx * Math.sin(angle);
        ball.setAttribute("cx", bx); ball.setAttribute("cy", by);
        string.setAttribute("x2", bx); string.setAttribute("y2", by);
        const dirX = -Math.sin(angle), dirY = -Math.cos(angle);
        const vLen = 35;
        vArrow.setAttribute("x1", bx); vArrow.setAttribute("y1", by);
        vArrow.setAttribute("x2", bx + dirX * vLen); vArrow.setAttribute("y2", by + dirY * vLen);
        const inX = -Math.cos(angle), inY = Math.sin(angle);
        const fLen = 30;
        fArrow.setAttribute("x1", bx); fArrow.setAttribute("y1", by);
        fArrow.setAttribute("x2", bx + inX * fLen); fArrow.setAttribute("y2", by + inY * fLen);
      } else {
        const t = (now - flyStart) / 1000;
        const bx = flyPos.x + flyVel.x * t, by = flyPos.y + flyVel.y * t;
        ball.setAttribute("cx", bx); ball.setAttribute("cy", by);
        vArrow.setAttribute("x1", bx); vArrow.setAttribute("y1", by);
        vArrow.setAttribute("x2", bx + (flyVel.x / (Math.hypot(flyVel.x, flyVel.y) || 1)) * 35);
        vArrow.setAttribute("y2", by + (flyVel.y / (Math.hypot(flyVel.x, flyVel.y) || 1)) * 35);
        if (t >= 1.2) {
          mode = "circular";
          angle = Math.atan2(-(flyPos.y - CY), flyPos.x - CX);
          cutBtn.disabled = false;
          string.setAttribute("opacity", 1);
          fArrow.setAttribute("opacity", 1);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Uniform Circular Motion) -- Centripetal vs. "Centrifugal"
  // ---------------------------------------------------------------
  function initCentrifugalCompare() {
    const svg = document.getElementById("ccSvg");
    if (!svg) return;
    const ball = document.getElementById("ccBall");
    const arrow = document.getElementById("ccArrow");
    const label = document.getElementById("ccLabel");
    const modeButtons = Array.from(document.querySelectorAll("#ccModeToggle button"));
    const forceNameVal = document.getElementById("ccForceNameVal");
    const dirVal = document.getElementById("ccDirVal");
    const sourceVal = document.getElementById("ccSourceVal");

    const CX = 130, CY = 130, R_PX = 100;
    let mode = "inertial", angle = 0, last = performance.now();

    function updateText() {
      if (mode === "inertial") {
        forceNameVal.textContent = "Centripetal (real)";
        dirVal.textContent = "Toward the center";
        sourceVal.textContent = "Friction against the platform, or a rail/harness";
      } else {
        forceNameVal.textContent = '"Centrifugal" (fictitious)';
        dirVal.textContent = "Away from the center";
        sourceVal.textContent = "Nothing — it's an artifact of watching from inside the spin";
      }
    }
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        updateText();
      });
    });
    updateText();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      angle += 1.2 * dt;
      const bx = CX + R_PX * Math.cos(angle), by = CY - R_PX * Math.sin(angle);
      ball.setAttribute("cx", bx); ball.setAttribute("cy", by);

      const inX = -Math.cos(angle), inY = Math.sin(angle);
      const sign = mode === "inertial" ? 1 : -1;
      const len = 40;
      arrow.setAttribute("x1", bx); arrow.setAttribute("y1", by);
      arrow.setAttribute("x2", bx + sign * inX * len);
      arrow.setAttribute("y2", by + sign * inY * len);
      label.setAttribute("x", bx + sign * inX * (len + 20));
      label.setAttribute("y", by + sign * inY * (len + 20));
      label.textContent = mode === "inertial" ? "real force" : "apparent";

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 1 (Banked Curves) -- Ideal Banking Angle Calculator
  // ---------------------------------------------------------------
  function initBankingCalc() {
    const svg = document.getElementById("bankSvg");
    if (!svg) return;
    const roadFill = document.getElementById("bankRoadFill");
    const car = document.getElementById("bankCar");
    const nArrow = document.getElementById("bankNArrow");
    const gArrow = document.getElementById("bankGArrow");
    const vSlider = document.getElementById("bankVSlider");
    const vVal = document.getElementById("bankVVal");
    const rSlider = document.getElementById("bankRSlider");
    const rVal = document.getElementById("bankRVal");
    const thetaVal = document.getElementById("bankThetaVal");
    const frictionVal = document.getElementById("bankFrictionVal");

    const BASE = { x: 20, y: 140 }, LEN = 200;

    function redraw() {
      const v = parseFloat(vSlider.value);
      const r = parseFloat(rSlider.value);
      const theta = Math.atan((v * v) / (r * G));
      const thetaDeg = (theta * 180) / Math.PI;

      vVal.textContent = v + " m/s";
      rVal.textContent = r + " m";
      thetaVal.textContent = thetaDeg.toFixed(1) + "°";
      frictionVal.textContent = "None (exactly balanced by the bank)";

      const run = LEN * Math.cos(theta), rise = LEN * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      roadFill.setAttribute("d", "M " + BASE.x + "," + BASE.y + " L " + top.x + "," + top.y + " L " + (BASE.x + run) + "," + BASE.y + " Z");

      const f = 0.5;
      const bx = BASE.x + f * run, by = BASE.y - f * rise;
      const uOut = { x: -Math.sin(theta), y: -Math.cos(theta) };
      const carCx = bx + uOut.x * 12, carCy = by + uOut.y * 12;
      car.setAttribute("transform", "translate(" + carCx + "," + carCy + ") rotate(" + -thetaDeg + ") translate(-13,-8)");

      nArrow.setAttribute("x1", carCx); nArrow.setAttribute("y1", carCy);
      nArrow.setAttribute("x2", carCx + uOut.x * 45); nArrow.setAttribute("y2", carCy + uOut.y * 45);
      gArrow.setAttribute("x1", carCx); gArrow.setAttribute("y1", carCy);
      gArrow.setAttribute("x2", carCx); gArrow.setAttribute("y2", carCy + 35);
    }
    vSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Banked Curves) -- Safe Speed Range on a Frictional Bank
  // ---------------------------------------------------------------
  function initBankingRange() {
    const svg = document.getElementById("bankRangeSvg");
    if (!svg) return;
    const bar = document.getElementById("bankRangeBar");
    const designDot = document.getElementById("bankRangeDesign");
    const thetaSlider = document.getElementById("bankR2ThetaSlider");
    const thetaVal = document.getElementById("bankR2ThetaVal");
    const rSlider = document.getElementById("bankR2RSlider");
    const rVal = document.getElementById("bankR2RVal");
    const muSlider = document.getElementById("bankR2MuSlider");
    const muVal = document.getElementById("bankR2MuVal");
    const vMinVal = document.getElementById("bankVMinVal");
    const vDesignVal = document.getElementById("bankVDesignVal");
    const vMaxVal = document.getElementById("bankVMaxVal");

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const r = parseFloat(rSlider.value);
      const mu = parseFloat(muSlider.value);
      const tanT = Math.tan(theta);
      const vDesign = Math.sqrt(r * G * tanT);

      const minNumer = tanT - mu;
      const vMin = minNumer <= 0 ? 0 : Math.sqrt((r * G * minNumer) / (1 + mu * tanT));
      const maxDenom = 1 - mu * tanT;
      const vMax = maxDenom <= 0 ? Infinity : Math.sqrt((r * G * (tanT + mu)) / maxDenom);

      thetaVal.textContent = thetaDeg + "°";
      rVal.textContent = r + " m";
      muVal.textContent = mu.toFixed(2);
      vMinVal.textContent = vMin.toFixed(1) + " m/s";
      vDesignVal.textContent = vDesign.toFixed(1) + " m/s";
      vMaxVal.textContent = maxDenom <= 0 ? "No upper limit (friction alone can hold any speed)" : vMax.toFixed(1) + " m/s";

      const scaleMax = maxDenom <= 0 ? vDesign * 2.5 : vMax * 1.15;
      const toX = (v) => 30 + (clamp(v, 0, scaleMax) / scaleMax) * 200;
      bar.setAttribute("x1", toX(vMin));
      bar.setAttribute("x2", maxDenom <= 0 ? 230 : toX(vMax));
      designDot.setAttribute("cx", toX(vDesign));
    }
    [thetaSlider, rSlider, muSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Vertical Circles) -- Loop-the-Loop
  // ---------------------------------------------------------------
  function initLoopTheLoop() {
    const svg = document.getElementById("loopSvg");
    if (!svg) return;
    const circle = document.getElementById("loopCircle");
    const car = document.getElementById("loopCar");
    const nArrow = document.getElementById("loopNArrow");
    const vSlider = document.getElementById("loopVSlider");
    const vVal = document.getElementById("loopVVal");
    const rSlider = document.getElementById("loopRSlider");
    const rVal = document.getElementById("loopRVal");
    const mSlider = document.getElementById("loopMSlider");
    const mVal = document.getElementById("loopMVal");
    const vTopVal = document.getElementById("loopVTopVal");
    const vMinVal = document.getElementById("loopVMinVal");
    const nVal = document.getElementById("loopNVal");
    const verdictVal = document.getElementById("loopVerdictVal");

    const CX = 150, CY = 140, PXPM = 6;
    let phi = 0, stuck = false, last = performance.now();

    function staticInfo() {
      const vBottom = parseFloat(vSlider.value);
      const r = parseFloat(rSlider.value);
      const m = parseFloat(mSlider.value);
      const vTopSq = vBottom * vBottom - 4 * G * r;
      const vTop = vTopSq > 0 ? Math.sqrt(vTopSq) : null;
      const vMin = Math.sqrt(5 * G * r);
      return { vBottom, r, m, vTop, vMin };
    }

    function updateStaticReadout() {
      const { r, m, vTop, vMin } = staticInfo();
      vVal.textContent = vSlider.value + " m/s";
      rVal.textContent = r + " m";
      mVal.textContent = m + " kg";
      vTopVal.textContent = vTop === null ? "— (never gets there)" : vTop.toFixed(1) + " m/s";
      vMinVal.textContent = vMin.toFixed(1) + " m/s";
      const rPx = clamp(r * PXPM, 25, 90);
      circle.setAttribute("r", rPx);
      circle.setAttribute("cy", CY);
      phi = 0;
      stuck = false;
    }
    [vSlider, rSlider, mSlider].forEach((s) => s.addEventListener("input", updateStaticReadout));
    updateStaticReadout();

    function tick(now) {
      const dt = Math.min(0.03, Math.max(0, (now - last) / 1000));
      last = now;
      const { vBottom, r, m } = staticInfo();
      const rPx = clamp(r * PXPM, 25, 90);
      circle.setAttribute("r", rPx);

      const h = r * (1 - Math.cos(phi));
      const vSq = Math.max(0, vBottom * vBottom - 2 * G * h);
      const N = (m * vSq) / r + m * G * Math.cos(phi);

      if (!stuck) {
        if (phi > 0.05 && phi < Math.PI + 0.05 && N < 0) {
          stuck = true;
          verdictVal.textContent = "Loses contact! Falls away from the track before reaching this point.";
        } else {
          const v = Math.sqrt(vSq);
          phi += (v / r) * dt;
          if (phi >= 2 * Math.PI) {
            phi -= 2 * Math.PI;
            verdictVal.textContent = "Completes the loop, over and over (frictionless)!";
          } else if (phi > 0.05) {
            verdictVal.textContent = "In progress…";
          }
        }
      }

      const carCx = CX + rPx * Math.sin(phi);
      const carCy = CY - rPx * Math.cos(phi);
      car.setAttribute("cx", carCx); car.setAttribute("cy", carCy);
      nVal.textContent = N.toFixed(0) + " N";

      const inX = -Math.sin(phi), inY = Math.cos(phi);
      const len = clamp(Math.abs(N) * 0.05, 8, 40);
      const dir = N >= 0 ? 1 : -1;
      nArrow.setAttribute("x1", carCx); nArrow.setAttribute("y1", carCy);
      nArrow.setAttribute("x2", carCx + dir * inX * len);
      nArrow.setAttribute("y2", carCy + dir * inY * len);

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Vertical Circles) -- Bucket of Water
  // ---------------------------------------------------------------
  function initBucketWater() {
    const svg = document.getElementById("bucketSvg");
    if (!svg) return;
    const string = document.getElementById("bucketString");
    const shape = document.getElementById("bucketShape");
    const vSlider = document.getElementById("bucketVSlider");
    const vVal = document.getElementById("bucketVVal");
    const rSlider = document.getElementById("bucketRSlider");
    const rVal = document.getElementById("bucketRVal");
    const vMinVal = document.getElementById("bucketVMinVal");
    const verdictVal = document.getElementById("bucketVerdictVal");

    const PIVOT = { x: 100, y: 30 }, PXPM = 60;

    function redraw() {
      const v = parseFloat(vSlider.value);
      const r = parseFloat(rSlider.value);
      const vMin = Math.sqrt(G * r);
      const stays = v >= vMin;

      vVal.textContent = v + " m/s";
      rVal.textContent = r.toFixed(1) + " m";
      vMinVal.textContent = vMin.toFixed(2) + " m/s";
      verdictVal.textContent = stays ? "Water stays in" : "Water spills out";

      const rPx = clamp(r * PXPM, 20, 90);
      const bucketY = PIVOT.y + rPx;
      string.setAttribute("y2", bucketY);
      const w = 16, h = 20;
      shape.setAttribute(
        "d",
        stays
          ? "M " + (PIVOT.x - w) + "," + bucketY + " L " + (PIVOT.x + w) + "," + bucketY + " L " + (PIVOT.x + w - 4) + "," + (bucketY + h) + " L " + (PIVOT.x - w + 4) + "," + (bucketY + h) + " Z"
          : "M " + (PIVOT.x - w) + "," + (bucketY + h) + " L " + (PIVOT.x + w) + "," + (bucketY + h) + " L " + (PIVOT.x + w - 4) + "," + bucketY + " L " + (PIVOT.x - w + 4) + "," + bucketY + " Z"
      );
    }
    vSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Gravitation) -- Inverse-Square Law Explorer
  // ---------------------------------------------------------------
  function initGravityGraph() {
    const svg = document.getElementById("gravGraphSvg");
    if (!svg) return;
    const curvePath = document.getElementById("gravCurvePath");
    const marker = document.getElementById("gravMarker");
    const m1Slider = document.getElementById("gravM1Slider");
    const m1Val = document.getElementById("gravM1Val");
    const m2Slider = document.getElementById("gravM2Slider");
    const m2Val = document.getElementById("gravM2Val");
    const rSlider = document.getElementById("gravRSlider");
    const rVal = document.getElementById("gravRVal");
    const fVal = document.getElementById("gravFVal");
    const fHalfVal = document.getElementById("gravFHalfVal");

    const GRAV_CONST = 6.674e-11, EARTH_R = 6.371e6;
    const R_MAX = 5;
    const toX = (r) => 40 + (r / R_MAX) * 400;

    function force(m1, m2, rEarthRadii) {
      const rMeters = rEarthRadii * EARTH_R;
      return (GRAV_CONST * m1 * m2) / (rMeters * rMeters);
    }

    function redraw() {
      const m1 = Math.pow(10, parseFloat(m1Slider.value));
      const m2 = Math.pow(10, parseFloat(m2Slider.value));
      const r = parseFloat(rSlider.value);
      const f = force(m1, m2, r);
      const fHalf = force(m1, m2, r * 2);

      m1Val.textContent = m1.toExponential(2) + " kg" + (Math.abs(m1 - 5.97e24) / 5.97e24 < 0.05 ? " (Earth)" : "");
      m2Val.textContent = m2 < 1000 ? m2.toFixed(1) + " kg" : m2.toExponential(2) + " kg";
      rVal.textContent = r.toFixed(2) + " R⊕";
      fVal.textContent = f.toExponential(2) + " N";
      fHalfVal.textContent = fHalf.toExponential(2) + " N";

      const fMax = force(m1, m2, 1);
      const toY = (rr) => 150 - (clamp(force(m1, m2, rr) / fMax, 0, 1) * 140);
      let d = "";
      for (let i = 0; i <= 100; i++) {
        const rr = 1 + (R_MAX - 1) * (i / 100);
        d += (i === 0 ? "M" : "L") + toX(rr) + "," + toY(rr) + " ";
      }
      curvePath.setAttribute("d", d);
      marker.setAttribute("cx", toX(r));
      marker.setAttribute("cy", toY(r));
    }
    [m1Slider, m2Slider, rSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Gravitation) -- Continuous Free Fall (ISS altitude)
  // ---------------------------------------------------------------
  function initISSGravity() {
    const svg = document.getElementById("issSvg");
    if (!svg) return;
    const sat = document.getElementById("issSat");
    const hSlider = document.getElementById("issHSlider");
    const hVal = document.getElementById("issHVal");
    const g0Val = document.getElementById("issG0Val");
    const gVal = document.getElementById("issGVal");
    const pctVal = document.getElementById("issPctVal");
    const orbitsLink = document.getElementById("gravOrbitsLink");

    const EARTH_R_KM = 6371;

    function redraw() {
      const h = parseFloat(hSlider.value);
      const g0 = G;
      const gAlt = g0 * Math.pow(EARTH_R_KM / (EARTH_R_KM + h), 2);

      hVal.textContent = h + " km";
      g0Val.textContent = g0.toFixed(2) + " m/s²";
      gVal.textContent = gAlt.toFixed(2) + " m/s²";
      pctVal.textContent = ((gAlt / g0) * 100).toFixed(1) + "%";

      const orbitR = clamp(70 + (h / 2000) * 60, 70, 130);
      sat.setAttribute("cx", 130 + orbitR);
      sat.setAttribute("cy", 130);
      document.getElementById("issOrbit").setAttribute("r", orbitR);
    }
    hSlider.addEventListener("input", redraw);
    redraw();

    if (orbitsLink) {
      orbitsLink.addEventListener("click", (e) => {
        e.preventDefault();
        const btn = document.querySelector('#tabbar button[data-target="orbits"]');
        if (btn) btn.click();
      });
    }
  }

  // ---------------------------------------------------------------
  // Widget 1 (Orbits) -- Orbit Simulator
  // ---------------------------------------------------------------
  function initOrbitSimulator() {
    const svg = document.getElementById("orbitSvg");
    if (!svg) return;
    const trace = document.getElementById("orbitTrace");
    const sat = document.getElementById("orbitSat");
    const vSlider = document.getElementById("orbitVSlider");
    const vVal = document.getElementById("orbitVVal");
    const goBtn = document.getElementById("orbitGoBtn");
    const vCircVal = document.getElementById("orbitVCircVal");
    const vEscVal = document.getElementById("orbitVEscVal");
    const typeVal = document.getElementById("orbitTypeVal");

    const CX = 200, CY = 200, GM = 800000, R0 = 130, ESCAPE_R = 195;
    let running = false, rafId = null;
    let relX, relY, velX, velY, points, last;

    function classify(vFrac, vCirc, vEsc) {
      if (Math.abs(vFrac - 1) < 0.02) return "Circular";
      if (vFrac < 1) return "Elliptical (launch point is the farthest point, apoapsis)";
      if (vFrac < vEsc / vCirc - 0.02) return "Elliptical (launch point is the closest point, periapsis)";
      if (Math.abs(vFrac - vEsc / vCirc) < 0.03) return "Parabolic — exactly escapes, asymptotically";
      return "Hyperbolic — escapes and never returns";
    }

    function updateStatic() {
      const vCirc = Math.sqrt(GM / R0);
      const vEsc = Math.sqrt((2 * GM) / R0);
      const vFrac = parseFloat(vSlider.value);
      vVal.textContent = vFrac.toFixed(2) + "×";
      vCircVal.textContent = vCirc.toFixed(1) + " units/s";
      vEscVal.textContent = vEsc.toFixed(1) + " units/s";
      typeVal.textContent = classify(vFrac, vCirc, vEsc);
    }
    vSlider.addEventListener("input", updateStatic);
    updateStatic();

    function frame(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const SUBSTEP = 0.02;
      let remaining = dt;
      while (remaining > 0 && running) {
        const h = Math.min(SUBSTEP, remaining);
        const rMag = Math.hypot(relX, relY);
        const invR3 = GM / (rMag * rMag * rMag);
        const ax = -invR3 * relX, ay = -invR3 * relY;
        velX += ax * h; velY += ay * h;
        relX += velX * h; relY += velY * h;
        remaining -= h;
      }
      const rMag = Math.hypot(relX, relY);
      sat.setAttribute("cx", CX + relX);
      sat.setAttribute("cy", CY + relY);
      points.push((CX + relX).toFixed(1) + "," + (CY + relY).toFixed(1));
      if (points.length > 1500) points.shift();
      trace.setAttribute("d", "M" + points.join(" L"));

      if (rMag > ESCAPE_R * 3) {
        running = false;
        typeVal.textContent += " — has now left the visible area";
        goBtn.disabled = false;
        return;
      }
      rafId = requestAnimationFrame(frame);
    }

    goBtn.addEventListener("click", () => {
      if (running) return;
      const vCirc = Math.sqrt(GM / R0);
      const vFrac = parseFloat(vSlider.value);
      relX = R0; relY = 0;
      velX = 0; velY = -vFrac * vCirc;
      points = [];
      running = true;
      goBtn.disabled = true;
      last = performance.now();
      updateStatic();
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Orbits) -- Escape Velocity Explorer
  // ---------------------------------------------------------------
  function initEscapeVelocity() {
    const row = document.getElementById("escPresetRow");
    if (!row) return;
    const vCircVal = document.getElementById("escVCircVal");
    const vEscVal = document.getElementById("escVEscVal");
    const barCirc = document.getElementById("escBarCirc");
    const barEsc = document.getElementById("escBarEsc");
    const buttons = Array.from(row.querySelectorAll("button"));

    const V_MAX = 65, X0 = 20, BAR_PX = 190;

    function redraw(btn) {
      const gm = parseFloat(btn.dataset.gm);
      const r = parseFloat(btn.dataset.r);
      const vCirc = Math.sqrt(gm / r) / 1000;
      const vEsc = Math.sqrt((2 * gm) / r) / 1000;
      vCircVal.textContent = vCirc.toFixed(2) + " km/s";
      vEscVal.textContent = vEsc.toFixed(2) + " km/s";
      barCirc.setAttribute("x2", X0 + clamp((vCirc / V_MAX) * BAR_PX, 0, BAR_PX));
      barEsc.setAttribute("x2", X0 + clamp((vEsc / V_MAX) * BAR_PX, 0, BAR_PX));
    }
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        redraw(btn);
      });
    });
    redraw(buttons[0]);
  }

  // ---------------------------------------------------------------
  // Widget 3 (Orbits) -- Kepler's Third Law
  // ---------------------------------------------------------------
  function initKeplerLaw() {
    const rSlider = document.getElementById("keplerRSlider");
    if (!rSlider) return;
    const rVal = document.getElementById("keplerRVal");
    const tVal = document.getElementById("keplerTVal");
    const ratioVal = document.getElementById("keplerRatioVal");
    const linePath = document.getElementById("keplerLinePath");
    const marker = document.getElementById("keplerMarker");

    const R_MIN = 0.3, R_MAX = 30;
    const logMin = Math.log10(R_MIN), logMax = Math.log10(R_MAX);
    const TLOG_MIN = 1.5 * logMin, TLOG_MAX = 1.5 * logMax;
    const toX = (logR) => 40 + ((logR - logMin) / (logMax - logMin)) * 400;
    const toY = (logT) => 150 - ((logT - TLOG_MIN) / (TLOG_MAX - TLOG_MIN)) * 140;

    let d = "";
    for (let i = 0; i <= 40; i++) {
      const logR = logMin + ((logMax - logMin) * i) / 40;
      d += (i === 0 ? "M" : "L") + toX(logR) + "," + toY(1.5 * logR) + " ";
    }
    linePath.setAttribute("d", d);

    function redraw() {
      const r = parseFloat(rSlider.value);
      const T = Math.pow(r, 1.5);
      const ratio = (T * T) / (r * r * r);
      rVal.textContent = r.toFixed(2) + " AU";
      tVal.textContent = T.toFixed(2) + " years";
      ratioVal.textContent = ratio.toFixed(3);
      const logR = Math.log10(r);
      marker.setAttribute("cx", toX(logR));
      marker.setAttribute("cy", toY(1.5 * logR));
    }
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBallOnString();
    initCentrifugalCompare();
    initBankingCalc();
    initBankingRange();
    initLoopTheLoop();
    initBucketWater();
    initGravityGraph();
    initISSGravity();
    initOrbitSimulator();
    initEscapeVelocity();
    initKeplerLaw();
  });
})();
