// Interactive widgets for docs/06-circular-motion/index.html.
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

  // ===============================================================
  // Widget 1 (Uniform Circular Motion) -- Ball on a String
  // ===============================================================
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
      return { r, v, m, a: (v * v) / r, f: (m * v * v) / r, w: v / r };
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
      flyPos = { x: bx, y: by };
      flyVel = { x: -Math.sin(angle) * v * PXPM, y: -Math.cos(angle) * v * PXPM };
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
        const dirX = -Math.sin(angle), dirY = -Math.cos(angle), vLen = 35;
        vArrow.setAttribute("x1", bx); vArrow.setAttribute("y1", by);
        vArrow.setAttribute("x2", bx + dirX * vLen); vArrow.setAttribute("y2", by + dirY * vLen);
        const inX = -Math.cos(angle), inY = Math.sin(angle), fLen = 30;
        fArrow.setAttribute("x1", bx); fArrow.setAttribute("y1", by);
        fArrow.setAttribute("x2", bx + inX * fLen); fArrow.setAttribute("y2", by + inY * fLen);
      } else {
        const t = (now - flyStart) / 1000;
        const bx = flyPos.x + flyVel.x * t, by = flyPos.y + flyVel.y * t;
        ball.setAttribute("cx", bx); ball.setAttribute("cy", by);
        const mag = Math.hypot(flyVel.x, flyVel.y) || 1;
        vArrow.setAttribute("x1", bx); vArrow.setAttribute("y1", by);
        vArrow.setAttribute("x2", bx + (flyVel.x / mag) * 35);
        vArrow.setAttribute("y2", by + (flyVel.y / mag) * 35);
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

  // ===============================================================
  // Widget 2 (Uniform Circular Motion) -- Centripetal vs. "Centrifugal"
  // ===============================================================
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
      const sign = mode === "inertial" ? 1 : -1, len = 40;
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

  // ===============================================================
  // Widget 1 (Banked Curves) -- Ideal Banking Angle Calculator
  // ===============================================================
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

      const f = 0.5, bx = BASE.x + f * run, by = BASE.y - f * rise;
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

  // ===============================================================
  // Widget 2 (Banked Curves) -- Safe Speed Range on a Frictional Bank
  // ===============================================================
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

  // ===============================================================
  // Widget 1 (Vertical Circles) -- Loop-the-Loop  (orientation fixed)
  // ===============================================================
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
      return { vBottom, r, m, vTop: vTopSq > 0 ? Math.sqrt(vTopSq) : null, vMin: Math.sqrt(5 * G * r) };
    }

    function updateStaticReadout() {
      const { r, m, vTop, vMin } = staticInfo();
      vVal.textContent = vSlider.value + " m/s";
      rVal.textContent = r + " m";
      mVal.textContent = m + " kg";
      vTopVal.textContent = vTop === null ? "— (never gets there)" : vTop.toFixed(1) + " m/s";
      vMinVal.textContent = vMin.toFixed(1) + " m/s";
      circle.setAttribute("r", clamp(r * PXPM, 25, 90));
      circle.setAttribute("cy", CY);
      phi = 0; stuck = false;
    }
    [vSlider, rSlider, mSlider].forEach((s) => s.addEventListener("input", updateStaticReadout));
    updateStaticReadout();

    function tick(now) {
      const dt = Math.min(0.03, Math.max(0, (now - last) / 1000));
      last = now;
      const { vBottom, r, m } = staticInfo();
      const rPx = clamp(r * PXPM, 25, 90);
      circle.setAttribute("r", rPx);

      // phi = 0 at the BOTTOM of the loop (h = 0).
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

      // Bottom at CY + rPx (screen y-down); top at CY - rPx.
      const carCx = CX + rPx * Math.sin(phi);
      const carCy = CY + rPx * Math.cos(phi);
      car.setAttribute("cx", carCx); car.setAttribute("cy", carCy);
      nVal.textContent = N.toFixed(0) + " N";

      // Inward (toward centre) unit = -(sinφ, cosφ) in screen coords.
      const inX = -Math.sin(phi), inY = -Math.cos(phi);
      const len = clamp(Math.abs(N) * 0.05, 8, 40);
      const dir = N >= 0 ? 1 : -1;
      nArrow.setAttribute("x1", carCx); nArrow.setAttribute("y1", carCy);
      nArrow.setAttribute("x2", carCx + dir * inX * len);
      nArrow.setAttribute("y2", carCy + dir * inY * len);

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 2 (Vertical Circles) -- Bucket of Water  (now animated)
  // ===============================================================
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

    // Water + droplets are created dynamically so the existing HTML needs
    // no new elements.
    const water = el("path", { id: "bucketWater", fill: "#3aa0e0", opacity: 0.9 });
    const drops = el("g", { id: "bucketDrops" });
    shape.parentNode.insertBefore(water, shape.nextSibling);
    shape.parentNode.appendChild(drops);
    const dropEls = [];
    for (let i = 0; i < 5; i++) {
      const d = el("circle", { r: 3, fill: "#3aa0e0", opacity: 0 });
      drops.appendChild(d); dropEls.push(d);
    }

    let phi = 0, last = performance.now();

    function params() {
      const v = parseFloat(vSlider.value);
      const r = parseFloat(rSlider.value);
      return { v, r, rPx: clamp(r * PXPM, 20, 90), vMin: Math.sqrt(G * r) };
    }

    function redrawReadout() {
      const { v, r, vMin } = params();
      vVal.textContent = v + " m/s";
      rVal.textContent = r.toFixed(1) + " m";
      vMinVal.textContent = vMin.toFixed(2) + " m/s";
      verdictVal.textContent = v >= vMin ? "Water stays in (all the way around)" : "Water spills out near the top";
    }
    vSlider.addEventListener("input", redrawReadout);
    rSlider.addEventListener("input", redrawReadout);
    redrawReadout();

    function tick(now) {
      const dt = Math.min(0.03, Math.max(0, (now - last) / 1000));
      last = now;
      const { v, rPx, vMin } = params();
      const omega = clamp(v / Math.max(0.1, rPx / PXPM) * 0.5, 0.6, 4);
      phi += omega * dt;

      // Radial unit (pivot -> bucket) and tangent, screen coords (y-down).
      const rhat = { x: Math.sin(phi), y: Math.cos(phi) };
      const that = { x: Math.cos(phi), y: -Math.sin(phi) };
      const bx = PIVOT.x + rhat.x * rPx, by = PIVOT.y + rhat.y * rPx;

      string.setAttribute("x1", PIVOT.x); string.setAttribute("y1", PIVOT.y);
      string.setAttribute("x2", bx); string.setAttribute("y2", by);

      // Bucket trapezoid: mouth faces the pivot (-rhat), bottom faces out (+rhat).
      const hHalf = 12, wMouth = 15, wBot = 11;
      const P = (a, b) => (a).toFixed(1) + "," + (b).toFixed(1);
      const mL = { x: bx - rhat.x * hHalf + that.x * wMouth, y: by - rhat.y * hHalf + that.y * wMouth };
      const mR = { x: bx - rhat.x * hHalf - that.x * wMouth, y: by - rhat.y * hHalf - that.y * wMouth };
      const bR = { x: bx + rhat.x * hHalf - that.x * wBot, y: by + rhat.y * hHalf - that.y * wBot };
      const bL = { x: bx + rhat.x * hHalf + that.x * wBot, y: by + rhat.y * hHalf + that.y * wBot };
      shape.setAttribute("d", "M " + P(mL.x, mL.y) + " L " + P(mR.x, mR.y) + " L " + P(bR.x, bR.y) + " L " + P(bL.x, bL.y) + " Z");

      const holds = v >= vMin;
      const abovePivot = by < PIVOT.y; // bucket in the top region
      if (holds || !abovePivot) {
        // Water sits against the outer (bottom) wall.
        dropEls.forEach((d) => d.setAttribute("opacity", 0));
        const wl = { x: bx + rhat.x * (hHalf - 3) + that.x * (wBot - 1), y: by + rhat.y * (hHalf - 3) + that.y * (wBot - 1) };
        const wr = { x: bx + rhat.x * (hHalf - 3) - that.x * (wBot - 1), y: by + rhat.y * (hHalf - 3) - that.y * (wBot - 1) };
        const il = { x: bx + rhat.x * 2 + that.x * (wMouth - 3), y: by + rhat.y * 2 + that.y * (wMouth - 3) };
        const ir = { x: bx + rhat.x * 2 - that.x * (wMouth - 3), y: by + rhat.y * 2 - that.y * (wMouth - 3) };
        water.setAttribute("opacity", 0.9);
        water.setAttribute("d", "M " + P(il.x, il.y) + " L " + P(ir.x, ir.y) + " L " + P(wr.x, wr.y) + " L " + P(wl.x, wl.y) + " Z");
      } else {
        // Too slow at the top -> water falls straight down under gravity.
        water.setAttribute("opacity", 0);
        dropEls.forEach((d, i) => {
          d.setAttribute("opacity", 0.85);
          const fall = ((phi * 40) + i * 14) % 90;
          d.setAttribute("cx", bx + (i - 2) * 4);
          d.setAttribute("cy", by + 6 + fall);
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 1 (Gravitation) -- Inverse-Square Law Explorer
  // ===============================================================
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

    const GRAV_CONST = 6.674e-11, EARTH_R = 6.371e6, R_MAX = 5;
    const toX = (r) => 40 + (r / R_MAX) * 400;
    const force = (m1, m2, rE) => (GRAV_CONST * m1 * m2) / Math.pow(rE * EARTH_R, 2);

    function redraw() {
      const m1 = Math.pow(10, parseFloat(m1Slider.value));
      const m2 = Math.pow(10, parseFloat(m2Slider.value));
      const r = parseFloat(rSlider.value);
      const f = force(m1, m2, r), fHalf = force(m1, m2, r * 2);

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

  // ===============================================================
  // Widget 2 (Gravitation) -- Continuous Free Fall (ISS altitude)
  // ===============================================================
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
    const orbitEl = document.getElementById("issOrbit");
    const EARTH_R_KM = 6371;
    let angle = 0, last = performance.now();

    function redraw() {
      const h = parseFloat(hSlider.value);
      const gAlt = G * Math.pow(EARTH_R_KM / (EARTH_R_KM + h), 2);
      hVal.textContent = h + " km";
      g0Val.textContent = G.toFixed(2) + " m/s²";
      gVal.textContent = gAlt.toFixed(2) + " m/s²";
      pctVal.textContent = ((gAlt / G) * 100).toFixed(1) + "%";
      if (orbitEl) orbitEl.setAttribute("r", clamp(70 + (h / 2000) * 60, 70, 130));
    }
    hSlider.addEventListener("input", redraw);
    redraw();

    // Give the satellite a gentle orbit so the panel is visibly alive.
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      angle += 0.7 * dt;
      const orbitR = orbitEl ? parseFloat(orbitEl.getAttribute("r")) : 90;
      sat.setAttribute("cx", 130 + orbitR * Math.cos(angle));
      sat.setAttribute("cy", 130 - orbitR * Math.sin(angle));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    if (orbitsLink) {
      orbitsLink.addEventListener("click", (e) => {
        e.preventDefault();
        const btn = document.querySelector('#tabbar button[data-target="orbits"]');
        if (btn) btn.click();
      });
    }
  }

  // ===============================================================
  // Widget 1 (Orbits) -- Orbit Simulator
  // ===============================================================
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
    let running = false, rafId = null, relX, relY, velX, velY, points, last;

    function classify(vFrac, vCirc, vEsc) {
      if (Math.abs(vFrac - 1) < 0.02) return "Circular";
      if (vFrac < 1) return "Elliptical (launch point is the farthest point, apoapsis)";
      if (vFrac < vEsc / vCirc - 0.02) return "Elliptical (launch point is the closest point, periapsis)";
      if (Math.abs(vFrac - vEsc / vCirc) < 0.03) return "Parabolic — exactly escapes, asymptotically";
      return "Hyperbolic — escapes and never returns";
    }

    function updateStatic() {
      const vCirc = Math.sqrt(GM / R0), vEsc = Math.sqrt((2 * GM) / R0);
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
        velX += -invR3 * relX * h; velY += -invR3 * relY * h;
        relX += velX * h; relY += velY * h;
        remaining -= h;
      }
      const rMag = Math.hypot(relX, relY);
      sat.setAttribute("cx", CX + relX); sat.setAttribute("cy", CY + relY);
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
      const vCirc = Math.sqrt(GM / R0), vFrac = parseFloat(vSlider.value);
      relX = R0; relY = 0; velX = 0; velY = -vFrac * vCirc;
      points = []; running = true; goBtn.disabled = true;
      last = performance.now();
      updateStatic();
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Orbits) -- Escape Velocity Explorer
  // ===============================================================
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
      const gm = parseFloat(btn.dataset.gm), r = parseFloat(btn.dataset.r);
      const vCirc = Math.sqrt(gm / r) / 1000, vEsc = Math.sqrt((2 * gm) / r) / 1000;
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

  // ===============================================================
  // Widget 3 (Orbits) -- Kepler's Third Law
  // ===============================================================
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
      rVal.textContent = r.toFixed(2) + " AU";
      tVal.textContent = T.toFixed(2) + " years";
      ratioVal.textContent = ((T * T) / (r * r * r)).toFixed(3);
      const logR = Math.log10(r);
      marker.setAttribute("cx", toX(logR));
      marker.setAttribute("cy", toY(1.5 * logR));
    }
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // NEW Widget (Banked Curves) -- Animated Banked Track  [#bankTrackHost]
  // Top-down car circling + live cross-section. Green = safe, red = skids.
  // Self-builds its DOM; no-ops if the host div is absent.
  // ===============================================================
  function initBankTrack() {
    const host = document.getElementById("bankTrackHost");
    if (!host) return;
    host.classList.add("cm-widget");
    host.innerHTML =
      '<div class="cm-controls">' +
      '  <label>Speed <input type="range" min="5" max="45" step="1" value="20" data-r="v"> <span data-o="v"></span> m/s</label>' +
      '  <label>Radius <input type="range" min="30" max="200" step="5" value="80" data-r="r"> <span data-o="r"></span> m</label>' +
      '  <label>Bank angle <input type="range" min="0" max="45" step="1" value="20" data-r="th"> <span data-o="th"></span>°</label>' +
      '  <label>Friction μ <input type="range" min="0" max="1" step="0.05" value="0.3" data-r="mu"> <span data-o="mu"></span></label>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 320 220", class: "cm-svg" });
    // Left: top-down track
    const trackOuter = el("ellipse", { cx: 90, cy: 110, rx: 74, ry: 60, fill: "none", stroke: "#c7ced6", "stroke-width": 22 });
    const trackLine = el("ellipse", { cx: 90, cy: 110, rx: 74, ry: 60, fill: "none", stroke: "#8a94a6", "stroke-width": 1.5, "stroke-dasharray": "5 6" });
    const carDot = el("circle", { r: 8, fill: "#3a9d5a", stroke: "#1c5f36", "stroke-width": 2 });
    const topLbl = el("text", { x: 90, y: 200, "font-size": 11, fill: "#555", "text-anchor": "middle" });
    topLbl.textContent = "top-down view";
    // Right: cross-section
    const csBase = el("line", { x1: 200, y1: 150, x2: 312, y2: 150, stroke: "#c7ced6", "stroke-width": 2 });
    const road = el("path", { fill: "#dfe4ea", stroke: "#8a94a6", "stroke-width": 2 });
    const csCar = el("rect", { width: 26, height: 16, rx: 3, fill: "#3a9d5a", stroke: "#1c5f36", "stroke-width": 2 });
    const nA = el("line", { stroke: "#2a78d6", "stroke-width": 3, "marker-end": "url(#cmArrow)" });
    const gA = el("line", { stroke: "#c94b4b", "stroke-width": 3, "marker-end": "url(#cmArrow)" });
    const csLbl = el("text", { x: 256, y: 205, "font-size": 11, fill: "#555", "text-anchor": "middle" });
    csLbl.textContent = "cross-section";
    // arrow marker
    const defs = el("defs", {});
    const mk = el("marker", { id: "cmArrow", markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto" });
    mk.appendChild(el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#555" }));
    defs.appendChild(mk);
    svg.appendChild(defs);
    [trackOuter, trackLine, carDot, topLbl, csBase, road, csCar, nA, gA, csLbl].forEach((n) => svg.appendChild(n));
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "cm-readouts";
    readouts.innerHTML =
      '<div>Design speed: <b data-o="vd">—</b></div>' +
      '<div>Safe range: <b data-o="range">—</b></div>' +
      '<div class="cm-verdict" data-o="verdict">—</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const vS = q('[data-r="v"]'), rS = q('[data-r="r"]'), thS = q('[data-r="th"]'), muS = q('[data-r="mu"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    let angle = 0, drift = 0, last = performance.now();

    function state() {
      const v = parseFloat(vS.value), r = parseFloat(rS.value);
      const th = (parseFloat(thS.value) * Math.PI) / 180, mu = parseFloat(muS.value);
      const tanT = Math.tan(th);
      const vDesign = Math.sqrt(r * G * tanT);
      const vMin = tanT - mu <= 0 ? 0 : Math.sqrt((r * G * (tanT - mu)) / (1 + mu * tanT));
      const maxDenom = 1 - mu * tanT;
      const vMax = maxDenom <= 0 ? Infinity : Math.sqrt((r * G * (tanT + mu)) / maxDenom);
      return { v, r, th, mu, vDesign, vMin, vMax, safe: v >= vMin && v <= vMax };
    }

    function readouts_update() {
      const s = state();
      out("v").textContent = s.v; out("r").textContent = s.r;
      out("th").textContent = thS.value; out("mu").textContent = parseFloat(muS.value).toFixed(2);
      out("vd").textContent = s.vDesign.toFixed(1) + " m/s";
      out("range").textContent = s.vMin.toFixed(1) + " – " + (isFinite(s.vMax) ? s.vMax.toFixed(1) + " m/s" : "∞");
      out("verdict").textContent = s.safe ? "✓ Holds the curve"
        : (s.v < s.vMin ? "✗ Too slow — slides DOWN the bank" : "✗ Too fast — skids UP and off the bank");
    }
    [vS, rS, thS, muS].forEach((sl) => sl.addEventListener("input", () => { drift = 0; readouts_update(); }));
    readouts_update();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const s = state();
      const color = s.safe ? "#3a9d5a" : "#c94b4b";
      const stroke = s.safe ? "#1c5f36" : "#7a1f1f";

      // Top-down: car circles; if unsafe it drifts radially off the lane.
      angle += clamp(s.v / s.r, 0.15, 1.2) * dt * 2;
      if (!s.safe) drift = clamp(drift + (s.v < s.vMin ? -1 : 1) * 12 * dt, -26, 26);
      else drift *= 0.9;
      const rx = 74 + drift, ry = 60 + drift * 0.8;
      carDot.setAttribute("cx", 90 + rx * Math.cos(angle));
      carDot.setAttribute("cy", 110 + ry * Math.sin(angle));
      carDot.setAttribute("fill", color); carDot.setAttribute("stroke", stroke);

      // Cross-section: banked road + tilted car with N and g arrows.
      const thDeg = parseFloat(thS.value);
      const bx = 210, by = 150, run = 96 * Math.cos(s.th), rise = 96 * Math.sin(s.th);
      road.setAttribute("d", "M " + bx + "," + by + " L " + (bx + run) + "," + (by - rise) + " L " + (bx + run) + "," + by + " Z");
      const f = 0.5, cx = bx + f * run, cy = by - f * rise;
      const uOut = { x: -Math.sin(s.th), y: -Math.cos(s.th) };
      const carCx = cx + uOut.x * 9, carCy = cy + uOut.y * 9;
      csCar.setAttribute("transform", "translate(" + carCx + "," + carCy + ") rotate(" + (-thDeg) + ") translate(-13,-8)");
      csCar.setAttribute("fill", color); csCar.setAttribute("stroke", stroke);
      nA.setAttribute("x1", carCx); nA.setAttribute("y1", carCy);
      nA.setAttribute("x2", carCx + uOut.x * 34); nA.setAttribute("y2", carCy + uOut.y * 34);
      gA.setAttribute("x1", carCx); gA.setAttribute("y1", carCy);
      gA.setAttribute("x2", carCx); gA.setAttribute("y2", carCy + 28);

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // NEW Widget (Circular Motion) -- Conical Pendulum  [#conicalHost]
  // r = L sinθ, v = √(rg tanθ), T = 2π√(L cosθ / g). Self-builds DOM.
  // ===============================================================
  function initConicalPendulum() {
    const host = document.getElementById("conicalHost");
    if (!host) return;
    host.classList.add("cm-widget");
    host.innerHTML =
      '<div class="cm-controls">' +
      '  <label>String length L <input type="range" min="0.5" max="2" step="0.1" value="1" data-r="L"> <span data-o="L"></span> m</label>' +
      '  <label>Cone angle θ <input type="range" min="10" max="80" step="1" value="35" data-r="th"> <span data-o="th"></span>°</label>' +
      '  <label>Mass <input type="range" min="0.1" max="2" step="0.1" value="0.5" data-r="m"> <span data-o="m"></span> kg</label>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 300 220", class: "cm-svg" });
    const PIVOT = { x: 150, y: 30 };
    svg.appendChild(el("rect", { x: 60, y: 22, width: 180, height: 8, rx: 2, fill: "#9aa5b1" }));
    const pathEllipse = el("ellipse", { fill: "none", stroke: "#8a94a6", "stroke-width": 1.5, "stroke-dasharray": "5 6" });
    const string = el("line", { x1: PIVOT.x, y1: PIVOT.y, stroke: "#33415c", "stroke-width": 2 });
    const bob = el("circle", { r: 11, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    svg.appendChild(pathEllipse); svg.appendChild(string); svg.appendChild(bob);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "cm-readouts";
    readouts.innerHTML =
      '<div>Circle radius r: <b data-o="r">—</b></div>' +
      '<div>Speed v: <b data-o="v">—</b></div>' +
      '<div>Period T: <b data-o="T">—</b></div>' +
      '<div>String tension: <b data-o="F">—</b></div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const LS = q('[data-r="L"]'), thS = q('[data-r="th"]'), mS = q('[data-r="m"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const PXPM = 80;
    let psi = 0, last = performance.now();

    function state() {
      const L = parseFloat(LS.value), th = (parseFloat(thS.value) * Math.PI) / 180, m = parseFloat(mS.value);
      const r = L * Math.sin(th);
      const v = Math.sqrt(r * G * Math.tan(th));
      const omega = Math.sqrt(G / (L * Math.cos(th)));
      const T = (2 * Math.PI) / omega;
      const tension = (m * G) / Math.cos(th);
      return { L, th, m, r, v, omega, T, tension };
    }

    function update() {
      const s = state();
      out("L").textContent = s.L.toFixed(1); out("th").textContent = thS.value; out("m").textContent = s.m.toFixed(1);
      out("r").textContent = s.r.toFixed(2) + " m";
      out("v").textContent = s.v.toFixed(2) + " m/s";
      out("T").textContent = s.T.toFixed(2) + " s";
      out("F").textContent = s.tension.toFixed(2) + " N";
    }
    [LS, thS, mS].forEach((sl) => sl.addEventListener("input", update));
    update();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const s = state();
      psi += s.omega * dt;
      const rPx = s.r * PXPM;
      const dropPx = s.L * Math.cos(s.th) * PXPM;
      const cx = PIVOT.x + rPx * Math.cos(psi);        // side view: horizontal sweep
      const cy = PIVOT.y + dropPx;                      // constant height plane
      const depth = Math.sin(psi);                      // fake perspective via size
      pathEllipse.setAttribute("cx", PIVOT.x); pathEllipse.setAttribute("cy", cy);
      pathEllipse.setAttribute("rx", rPx); pathEllipse.setAttribute("ry", rPx * 0.28);
      const cyPersp = cy - depth * rPx * 0.28;
      string.setAttribute("x2", cx); string.setAttribute("y2", cyPersp);
      bob.setAttribute("cx", cx); bob.setAttribute("cy", cyPersp);
      bob.setAttribute("r", 9 + depth * 3);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

    // ===============================================================
  // NEW Widget (Uniform Circular Motion) -- Rotating-Frame Split-Screen
  // [host: #rotFrameHost]  Same orbit, two observers. Self-builds DOM.
  //   Ground frame:  one real centripetal force (inward).
  //   Rotating frame: centripetal (inward) + centrifugal (outward) cancel.
  // ===============================================================
  function initRotatingFrame() {
    const host = document.getElementById("rotFrameHost");
    if (!host) return;
    host.classList.add("cm-widget");
    host.innerHTML =
      '<div class="cm-controls">' +
      '  <label>Spin rate ω <input type="range" min="0.3" max="2.5" step="0.1" value="1.2" data-r="w"> <span data-o="w"></span> rad/s</label>' +
      '  <label><input type="checkbox" data-r="show" checked> Show force arrows</label>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 360 220", class: "cm-svg" });

    // arrow marker
    const defs = el("defs", {});
    const mk = el("marker", { id: "rfArrow", markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto" });
    mk.appendChild(el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#555" }));
    defs.appendChild(mk);
    svg.appendChild(defs);

    // Divider + titles
    svg.appendChild(el("line", { x1: 180, y1: 12, x2: 180, y2: 208, stroke: "#e2e6ea", "stroke-width": 2 }));
    const tL = el("text", { x: 90, y: 22, "font-size": 11, fill: "#555", "text-anchor": "middle" });
    tL.textContent = "Ground frame (inertial)";
    const tR = el("text", { x: 270, y: 22, "font-size": 11, fill: "#555", "text-anchor": "middle" });
    tR.textContent = "Rotating frame (co-rotating)";
    svg.appendChild(tL); svg.appendChild(tR);

    const LCX = 90, RCX = 270, CY = 120, R = 68;

    // Left panel: orbit path + moving ball
    svg.appendChild(el("circle", { cx: LCX, cy: CY, r: R, fill: "none", stroke: "#8a94a6", "stroke-width": 1.5, "stroke-dasharray": "5 6" }));
    svg.appendChild(el("circle", { cx: LCX, cy: CY, r: 3, fill: "#33415c" })); // centre
    const ballL = el("circle", { r: 10, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    const cpL = el("line", { stroke: "#c94b4b", "stroke-width": 3, "marker-end": "url(#rfArrow)" });
    const cpLbl = el("text", { "font-size": 10, fill: "#c94b4b", "text-anchor": "middle" });
    cpLbl.textContent = "centripetal";
    svg.appendChild(cpL); svg.appendChild(ballL); svg.appendChild(cpLbl);

    // Right panel: spinning background (spokes) + stationary ball at fixed spot
    const spokes = el("g", {});
    for (let i = 0; i < 6; i++) {
      spokes.appendChild(el("line", { x1: RCX, y1: CY, x2: RCX + R, y2: CY,
        stroke: "#dfe4ea", "stroke-width": 2, transform: "rotate(" + (i * 60) + " " + RCX + " " + CY + ")" }));
    }
    svg.appendChild(spokes);
    svg.appendChild(el("circle", { cx: RCX, cy: CY, r: R, fill: "none", stroke: "#8a94a6", "stroke-width": 1.5, "stroke-dasharray": "5 6" }));
    svg.appendChild(el("circle", { cx: RCX, cy: CY, r: 3, fill: "#33415c" }));
    const ballR = el("circle", { cx: RCX + R, cy: CY, r: 10, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    const cpR = el("line", { x1: RCX + R, y1: CY, x2: RCX + R - 34, y2: CY, stroke: "#c94b4b", "stroke-width": 3, "marker-end": "url(#rfArrow)" });
    const cfR = el("line", { x1: RCX + R, y1: CY, x2: RCX + R + 34, y2: CY, stroke: "#e0913a", "stroke-width": 3, "marker-end": "url(#rfArrow)" });
    const cpRLbl = el("text", { x: RCX + R - 20, y: CY - 10, "font-size": 10, fill: "#c94b4b", "text-anchor": "middle" });
    cpRLbl.textContent = "centripetal";
    const cfRLbl = el("text", { x: RCX + R + 24, y: CY + 20, "font-size": 10, fill: "#e0913a", "text-anchor": "middle" });
    cfRLbl.textContent = "centrifugal";
    const netLbl = el("text", { x: RCX, y: 204, "font-size": 11, fill: "#3a9d5a", "text-anchor": "middle", "font-weight": "600" });
    netLbl.textContent = "net force = 0  →  ball appears at rest";
    svg.appendChild(cpR); svg.appendChild(cfR); svg.appendChild(ballR);
    svg.appendChild(cpRLbl); svg.appendChild(cfRLbl); svg.appendChild(netLbl);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "cm-readouts";
    readouts.innerHTML =
      '<div class="cm-verdict">Same ball, same instant — only the <b>observer</b> differs. ' +
      'The centrifugal force exists <b>only</b> in the rotating frame, as a bookkeeping term ' +
      'that makes Newton\u2019s laws work for a non-inertial observer.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const wS = q('[data-r="w"]'), showBox = q('[data-r="show"]');
    const out = q('[data-o="w"]');
    let angle = 0, last = performance.now();

    function applyVisibility() {
      const vis = showBox.checked ? 1 : 0;
      [cpL, cpLbl, cpR, cfR, cpRLbl, cfRLbl].forEach((n) => n.setAttribute("opacity", vis));
    }
    wS.addEventListener("input", () => { out.textContent = parseFloat(wS.value).toFixed(1); });
    showBox.addEventListener("change", applyVisibility);
    out.textContent = parseFloat(wS.value).toFixed(1);
    applyVisibility();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const w = parseFloat(wS.value);
      angle += w * dt;

      // Left: ball orbits; centripetal arrow points inward.
      const bx = LCX + R * Math.cos(angle), by = CY - R * Math.sin(angle);
      ballL.setAttribute("cx", bx); ballL.setAttribute("cy", by);
      const inX = (LCX - bx), inY = (CY - by);
      const mag = Math.hypot(inX, inY) || 1;
      cpL.setAttribute("x1", bx); cpL.setAttribute("y1", by);
      cpL.setAttribute("x2", bx + (inX / mag) * 34); cpL.setAttribute("y2", by + (inY / mag) * 34);
      cpLbl.setAttribute("x", bx + (inX / mag) * 46); cpLbl.setAttribute("y", by + (inY / mag) * 46);

      // Right: ball fixed; background spokes rotate the OTHER way (-angle),
      // showing the frame itself is spinning while the ball sits still.
      spokes.setAttribute("transform", "rotate(" + (-(angle * 180) / Math.PI) + " " + RCX + " " + CY + ")");

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
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
    // Optional new widgets (safe no-op until their host div is added):
    initBankTrack();
    initConicalPendulum();
    initRotatingFrame();
  });
})();
