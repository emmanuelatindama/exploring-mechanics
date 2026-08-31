// Interactive widgets for docs/07-rotation-and-rolling/index.html.
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
  // Widget 1 (Angular Kinematics) -- Rotating Disk: Same ω, Different v
  // ---------------------------------------------------------------
  function initRotatingDisk() {
    const svg = document.getElementById("diskSvg");
    if (!svg) return;
    const groupA = document.getElementById("diskMarkerA");
    const groupB = document.getElementById("diskMarkerB");
    const wSlider = document.getElementById("diskWSlider");
    const wVal = document.getElementById("diskWVal");
    const raSlider = document.getElementById("diskRASlider");
    const raVal = document.getElementById("diskRAVal");
    const rbSlider = document.getElementById("diskRBSlider");
    const rbVal = document.getElementById("diskRBVal");
    const vAVal = document.getElementById("diskVAVal");
    const vBVal = document.getElementById("diskVBVal");

    const CX = 150, CY = 150, R_PX = 120;
    let angle = 0, last = performance.now();

    function place(group, r) {
      const circle = group.querySelector("circle");
      const line = group.querySelector("line");
      const x = CX + r * R_PX * Math.cos(angle), y = CY - r * R_PX * Math.sin(angle);
      circle.setAttribute("cx", x); circle.setAttribute("cy", y);
      const dirX = -Math.sin(angle), dirY = -Math.cos(angle);
      const w = parseFloat(wSlider.value);
      const len = clamp(r * w * 12, 8, 60);
      line.setAttribute("x1", x); line.setAttribute("y1", y);
      line.setAttribute("x2", x + dirX * len); line.setAttribute("y2", y + dirY * len);
    }

    function redrawReadout() {
      const w = parseFloat(wSlider.value);
      const rA = parseFloat(raSlider.value);
      const rB = parseFloat(rbSlider.value);
      wVal.textContent = w.toFixed(1) + " rad/s";
      raVal.textContent = rA.toFixed(2);
      rbVal.textContent = rB.toFixed(2);
      vAVal.textContent = (rA * w).toFixed(2) + " (units)";
      vBVal.textContent = (rB * w).toFixed(2) + " (units)";
    }
    [wSlider, raSlider, rbSlider].forEach((s) => s.addEventListener("input", redrawReadout));
    redrawReadout();

    makeDraggable(groupA.querySelector("circle"), svg, (pt) => {
      const r = clamp(Math.hypot(pt.x - CX, pt.y - CY) / R_PX, 0.1, 1);
      raSlider.value = r;
      redrawReadout();
    });
    makeDraggable(groupB.querySelector("circle"), svg, (pt) => {
      const r = clamp(Math.hypot(pt.x - CX, pt.y - CY) / R_PX, 0.1, 1);
      rbSlider.value = r;
      redrawReadout();
    });

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      angle += parseFloat(wSlider.value) * dt;
      place(groupA, parseFloat(raSlider.value));
      place(groupB, parseFloat(rbSlider.value));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Angular Kinematics) -- Angular Motion Graph Lab
  // ---------------------------------------------------------------
  function initAngularMotionGraph() {
    const svg = document.getElementById("amDiskSvg");
    if (!svg) return;
    const spoke = document.getElementById("amSpoke");
    const thetaPath = document.getElementById("amThetaPath");
    const omegaLine = document.getElementById("amOmegaLine");
    const alphaLine = document.getElementById("amAlphaLine");
    const w0Slider = document.getElementById("amW0Slider");
    const w0Val = document.getElementById("amW0Val");
    const aSlider = document.getElementById("amASlider");
    const aVal = document.getElementById("amAVal");
    const playBtn = document.getElementById("amPlayBtn");
    const tVal = document.getElementById("amTVal");
    const thetaVal = document.getElementById("amThetaVal");
    const wVal = document.getElementById("amWVal");

    const T_MAX = 6;
    let animating = false, rafId = null;

    function theta(t, w0, a) { return w0 * t + 0.5 * a * t * t; }
    function omega(t, w0, a) { return w0 + a * t; }

    function place(t, w0, a) {
      const th = theta(t, w0, a);
      spoke.setAttribute("x2", 70 + 55 * Math.sin(th));
      spoke.setAttribute("y2", 70 - 55 * Math.cos(th));
    }

    function redrawStatic() {
      const w0 = parseFloat(w0Slider.value);
      const a = parseFloat(aSlider.value);
      w0Val.textContent = w0.toFixed(1) + " rad/s";
      aVal.textContent = a.toFixed(1) + " rad/s²";
      tVal.textContent = "0.0 s";
      thetaVal.textContent = "0.00 rad";
      wVal.textContent = w0.toFixed(2) + " rad/s";
      place(0, w0, a);
      thetaPath.setAttribute("d", "");
      omegaLine.setAttribute("x2", 40); omegaLine.setAttribute("y2", 45);
      const alphaScale = 20 / Math.max(Math.abs(parseFloat(aSlider.min)), Math.abs(parseFloat(aSlider.max)));
      const alphaY = 30 - a * alphaScale;
      alphaLine.setAttribute("y1", alphaY);
      alphaLine.setAttribute("y2", alphaY);
    }
    [w0Slider, aSlider].forEach((s) => s.addEventListener("input", redrawStatic));
    redrawStatic();

    playBtn.addEventListener("click", () => {
      if (animating) return;
      const w0 = parseFloat(w0Slider.value);
      const a = parseFloat(aSlider.value);

      let thetaMax = 0.01, omegaMax = 0.01;
      for (let i = 0; i <= 60; i++) {
        const t = (T_MAX * i) / 60;
        thetaMax = Math.max(thetaMax, Math.abs(theta(t, w0, a)));
        omegaMax = Math.max(omegaMax, Math.abs(omega(t, w0, a)));
      }
      const toX = (t) => 40 + (t / T_MAX) * 440;
      const toYTheta = (th) => 50 - (clamp(th, -thetaMax, thetaMax) / thetaMax) * 40;
      const toYOmega = (w) => 45 - (clamp(w, -omegaMax, omegaMax) / omegaMax) * 35;

      animating = true;
      playBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(T_MAX, Math.max(0, (now - start) / 1000));
        const th = theta(t, w0, a);
        const w = omega(t, w0, a);
        tVal.textContent = t.toFixed(1) + " s";
        thetaVal.textContent = th.toFixed(2) + " rad";
        wVal.textContent = w.toFixed(2) + " rad/s";
        place(t, w0, a);

        let d = "";
        for (let i = 0; i <= 60; i++) {
          const tt = (t * i) / 60;
          d += (i === 0 ? "M" : "L") + toX(tt) + "," + toYTheta(theta(tt, w0, a)) + " ";
        }
        thetaPath.setAttribute("d", d);
        omegaLine.setAttribute("x2", toX(t));
        omegaLine.setAttribute("y2", toYOmega(w));

        if (t >= T_MAX) {
          animating = false;
          playBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Torque) -- Door Push Explorer
  // ---------------------------------------------------------------
  function initDoorPush() {
    const svg = document.getElementById("doorSvg");
    if (!svg) return;
    const pushPoint = document.getElementById("doorPushPoint");
    const forceArrow = document.getElementById("doorForceArrow");
    const fSlider = document.getElementById("doorFSlider");
    const fVal = document.getElementById("doorFVal");
    const thetaSlider = document.getElementById("doorThetaSlider");
    const thetaVal = document.getElementById("doorThetaVal");
    const rVal = document.getElementById("doorRVal");
    const tauVal = document.getElementById("doorTauVal");
    const effectVal = document.getElementById("doorEffectVal");

    const HINGE_X = 30, DOOR_Y = 110, PXPM = 100, X_MIN = 45, X_MAX = 270;
    let pushX = 220;

    function redraw() {
      const f = parseFloat(fSlider.value);
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const r = (pushX - HINGE_X) / PXPM;
      const tau = f * r * Math.sin(theta);

      fVal.textContent = f + " N";
      thetaVal.textContent = thetaDeg + "°";
      rVal.textContent = r.toFixed(2) + " m";
      tauVal.textContent = tau.toFixed(1) + " N·m";
      effectVal.textContent = tau > 0.5 ? "Swings open" : "No turning effect (force points along the door)";

      pushPoint.setAttribute("cx", pushX);
      const dirX = Math.cos(theta), dirY = -Math.sin(theta);
      const len = clamp(f * 0.8, 15, 70);
      forceArrow.setAttribute("x1", pushX); forceArrow.setAttribute("y1", DOOR_Y);
      forceArrow.setAttribute("x2", pushX + dirX * len); forceArrow.setAttribute("y2", DOOR_Y + dirY * len);
    }
    fSlider.addEventListener("input", redraw);
    thetaSlider.addEventListener("input", redraw);
    makeDraggable(pushPoint, svg, (pt) => {
      pushX = clamp(pt.x, X_MIN, X_MAX);
      redraw();
    });
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Torque) -- Balanced Torques vs. Balanced Forces
  // ---------------------------------------------------------------
  function initTorqueBalance() {
    const svg = document.getElementById("torqueBalanceSvg");
    if (!svg) return;
    const f1Arrow = document.getElementById("tbF1Arrow");
    const f2Arrow = document.getElementById("tbF2Arrow");
    const f1Slider = document.getElementById("tbF1Slider");
    const f1Val = document.getElementById("tbF1Val");
    const f2Slider = document.getElementById("tbF2Slider");
    const f2Val = document.getElementById("tbF2Val");
    const netFVal = document.getElementById("tbNetFVal");
    const netTVal = document.getElementById("tbNetTVal");
    const verdictVal = document.getElementById("tbVerdictVal");

    const X1 = 20, X2 = 280, Y = 50, HALF_LEN_M = 1.5;

    function redraw() {
      const f1 = parseFloat(f1Slider.value);
      const f2 = parseFloat(f2Slider.value);
      const netF = f1 + f2;
      const netT = HALF_LEN_M * (f2 - f1);

      f1Val.textContent = f1 + " N";
      f2Val.textContent = f2 + " N";
      netFVal.textContent = netF + " N";
      netTVal.textContent = netT.toFixed(1) + " N·m";

      const forceOk = Math.abs(netF) < 5;
      const torqueOk = Math.abs(netT) < 7.5;
      verdictVal.textContent = forceOk && torqueOk
        ? "Fully in equilibrium — nothing happens"
        : forceOk && !torqueOk
        ? "Pure couple — spins in place, no translation"
        : !forceOk && torqueOk
        ? "Torque balanced, but accelerates sideways without spinning"
        : "Both accelerates sideways and spins";

      f1Arrow.setAttribute("x1", X1); f1Arrow.setAttribute("y1", Y);
      f1Arrow.setAttribute("x2", X1); f1Arrow.setAttribute("y2", Y - clamp(f1, -45, 45));
      f2Arrow.setAttribute("x1", X2); f2Arrow.setAttribute("y1", Y);
      f2Arrow.setAttribute("x2", X2); f2Arrow.setAttribute("y2", Y - clamp(f2, -45, 45));
    }
    f1Slider.addEventListener("input", redraw);
    f2Slider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Moment of Inertia) -- Shape-and-Inertia Explorer
  // ---------------------------------------------------------------
  function initShapeInertia() {
    const svg = document.getElementById("shapeBarSvg");
    if (!svg) return;
    const barHoop = document.getElementById("shapeBarHoop");
    const barDisk = document.getElementById("shapeBarDisk");
    const barSphere = document.getElementById("shapeBarSphere");
    const barRod = document.getElementById("shapeBarRod");
    const mSlider = document.getElementById("shapeMSlider");
    const mVal = document.getElementById("shapeMVal");
    const rSlider = document.getElementById("shapeRSlider");
    const rVal = document.getElementById("shapeRVal");
    const iHoopVal = document.getElementById("shapeIHoopVal");
    const iDiskVal = document.getElementById("shapeIDiskVal");
    const iSphereVal = document.getElementById("shapeISphereVal");
    const iRodVal = document.getElementById("shapeIRodVal");

    const BAR_MAX = 110;

    function redraw() {
      const m = parseFloat(mSlider.value);
      const r = parseFloat(rSlider.value);
      const iHoop = m * r * r;
      const iDisk = 0.5 * m * r * r;
      const iSphere = 0.4 * m * r * r;
      const iRod = (m * r * r) / 3;

      mVal.textContent = m + " kg";
      rVal.textContent = r.toFixed(2) + " m";
      iHoopVal.textContent = iHoop.toFixed(3) + " kg·m²";
      iDiskVal.textContent = iDisk.toFixed(3) + " kg·m²";
      iSphereVal.textContent = iSphere.toFixed(3) + " kg·m²";
      iRodVal.textContent = iRod.toFixed(3) + " kg·m²";

      const scale = iHoop > 0 ? BAR_MAX / iHoop : 0;
      [[barHoop, iHoop], [barDisk, iDisk], [barSphere, iSphere], [barRod, iRod]].forEach(([bar, val]) => {
        const h = val * scale;
        bar.setAttribute("y", 120 - h);
        bar.setAttribute("height", h);
      });
    }
    mSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Moment of Inertia) -- The Spinning Chair
  // ---------------------------------------------------------------
  function initSpinningChair() {
    const svg = document.getElementById("chairSvg");
    if (!svg) return;
    const armLeft = document.getElementById("chairArmLeft");
    const armRight = document.getElementById("chairArmRight");
    const handLeft = document.getElementById("chairHandLeft");
    const handRight = document.getElementById("chairHandRight");
    const iBodySlider = document.getElementById("chairIBodySlider");
    const iBodyVal = document.getElementById("chairIBodyVal");
    const handMSlider = document.getElementById("chairHandMSlider");
    const handMVal = document.getElementById("chairHandMVal");
    const armsInBox = document.getElementById("chairArmsIn");
    const rVal = document.getElementById("chairRVal");
    const iTotalVal = document.getElementById("chairITotalVal");

    const ARMS_OUT_R = 0.7, ARMS_IN_R = 0.15, PXPM = 100;

    function redraw() {
      const iBody = parseFloat(iBodySlider.value);
      const handM = parseFloat(handMSlider.value);
      const armsIn = armsInBox.checked;
      const r = armsIn ? ARMS_IN_R : ARMS_OUT_R;
      const iTotal = iBody + 2 * handM * r * r;

      iBodyVal.textContent = iBody.toFixed(1) + " kg·m²";
      handMVal.textContent = handM + " kg";
      rVal.textContent = r.toFixed(2) + " m";
      iTotalVal.textContent = iTotal.toFixed(2) + " kg·m²";

      const px = r * PXPM;
      armLeft.setAttribute("x2", 100 - px); handLeft.setAttribute("cx", 100 - px);
      armRight.setAttribute("x2", 100 + px); handRight.setAttribute("cx", 100 + px);
    }
    iBodySlider.addEventListener("input", redraw);
    handMSlider.addEventListener("input", redraw);
    armsInBox.addEventListener("change", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Rotational Energy) -- Flywheel Energy Storage
  // ---------------------------------------------------------------
  function initFlywheel() {
    const svg = document.getElementById("flywheelSvg");
    if (!svg) return;
    const spoke = document.getElementById("flywheelSpoke");
    const iSlider = document.getElementById("flyISlider");
    const iVal = document.getElementById("flyIVal");
    const wSlider = document.getElementById("flyWSlider");
    const wVal = document.getElementById("flyWVal");
    const keVal = document.getElementById("flyKEVal");
    const carVal = document.getElementById("flyCarVal");

    const V_REF = 25;
    let angle = 0, last = performance.now();

    function redrawStatic() {
      const i = parseFloat(iSlider.value);
      const w = parseFloat(wSlider.value);
      const ke = 0.5 * i * w * w;
      const carMass = (2 * ke) / (V_REF * V_REF);
      iVal.textContent = i + " kg·m²";
      wVal.textContent = w + " rad/s";
      keVal.textContent = ke.toFixed(0) + " J";
      carVal.textContent = carMass.toFixed(0) + " kg at " + V_REF + " m/s (90 km/h)";
    }
    iSlider.addEventListener("input", redrawStatic);
    wSlider.addEventListener("input", redrawStatic);
    redrawStatic();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      angle += parseFloat(wSlider.value) * dt * 0.2;
      spoke.setAttribute("x2", 70 + 55 * Math.sin(angle));
      spoke.setAttribute("y2", 70 - 55 * Math.cos(angle));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Rotational Energy) -- Rolling-Race Predictor
  // ---------------------------------------------------------------
  function initRollingRace() {
    const hSlider = document.getElementById("raceHSlider");
    if (!hSlider) return;
    const hVal = document.getElementById("raceHVal");
    const sphereVal = document.getElementById("raceSphereVal");
    const diskVal = document.getElementById("raceDiskVal");
    const hoopVal = document.getElementById("raceHoopVal");
    const blockVal = document.getElementById("raceBlockVal");
    const barSphere = document.getElementById("raceBarSphere");
    const barDisk = document.getElementById("raceBarDisk");
    const barHoop = document.getElementById("raceBarHoop");
    const barBlock = document.getElementById("raceBarBlock");
    const BAR_MAX = 100;

    function redraw() {
      const h = parseFloat(hSlider.value);
      hVal.textContent = h.toFixed(1) + " m";
      const vSphere = Math.sqrt((10 * G * h) / 7);
      const vDisk = Math.sqrt((4 * G * h) / 3);
      const vHoop = Math.sqrt(G * h);
      const vBlock = Math.sqrt(2 * G * h);
      sphereVal.textContent = vSphere.toFixed(2) + " m/s";
      diskVal.textContent = vDisk.toFixed(2) + " m/s";
      hoopVal.textContent = vHoop.toFixed(2) + " m/s";
      blockVal.textContent = vBlock.toFixed(2) + " m/s";

      const scale = BAR_MAX / vBlock;
      [[barSphere, vSphere], [barDisk, vDisk], [barHoop, vHoop], [barBlock, vBlock]].forEach(([bar, v]) => {
        const hpx = v * scale;
        bar.setAttribute("y", 120 - hpx);
        bar.setAttribute("height", hpx);
      });
    }
    hSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Rolling Without Slipping) -- The Rolling Race, Animated
  // ---------------------------------------------------------------
  function initRollingRaceSim() {
    const svg = document.getElementById("raceSimSvg");
    if (!svg) return;
    const rampFill = document.getElementById("raceRampFill");
    const ballSphere = document.getElementById("raceSphereBall");
    const ballDisk = document.getElementById("raceDiskBall");
    const ballHoop = document.getElementById("raceHoopBall");
    const thetaSlider = document.getElementById("raceSimThetaSlider");
    const thetaVal = document.getElementById("raceSimThetaVal");
    const goBtn = document.getElementById("raceSimGoBtn");
    const sphereVal = document.getElementById("raceSimSphereVal");
    const diskVal = document.getElementById("raceSimDiskVal");
    const hoopVal = document.getElementById("raceSimHoopVal");

    const BASE = { x: 20, y: 180 }, LEN_PX = 340, RAMP_LEN_M = 3;
    let animating = false, rafId = null;

    function layout(theta) {
      const run = LEN_PX * Math.cos(theta), rise = LEN_PX * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      rampFill.setAttribute("d", "M " + BASE.x + "," + BASE.y + " L " + top.x + "," + top.y + " L " + (BASE.x + run) + "," + BASE.y + " Z");
      return { top, run, rise };
    }
    function placeAt(ball, s, theta) {
      const frac = s / RAMP_LEN_M;
      const px = LEN_PX * frac;
      const x = BASE.x + px * Math.cos(theta) - 14 * Math.sin(theta);
      const y = BASE.y - px * Math.sin(theta) - 14 * Math.cos(theta);
      ball.setAttribute("cx", x); ball.setAttribute("cy", y);
    }

    function reset() {
      const thetaDeg = parseFloat(thetaSlider.value);
      thetaVal.textContent = thetaDeg + "°";
      const theta = (thetaDeg * Math.PI) / 180;
      layout(theta);
      placeAt(ballSphere, 0, theta);
      placeAt(ballDisk, 0, theta);
      placeAt(ballHoop, 0, theta);
      sphereVal.textContent = "—"; diskVal.textContent = "—"; hoopVal.textContent = "—";
    }
    thetaSlider.addEventListener("input", reset);
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      reset();
      const aSphere = (G * Math.sin(theta)) / 1.4;
      const aDisk = (G * Math.sin(theta)) / 1.5;
      const aHoop = (G * Math.sin(theta)) / 2.0;
      let doneSphere = false, doneDisk = false, doneHoop = false;

      animating = true;
      goBtn.disabled = true;
      let simTime = 0, lastFrameTime = performance.now();
      function frame(now) {
        // Advance simulated time in small capped steps rather than using
        // (now - start) directly -- if the tab is backgrounded and rAF
        // stalls for a while, a single large real-time gap could otherwise
        // jump simTime past several finish thresholds in one frame,
        // recording identical (wrong) finish times for all three shapes.
        simTime += Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
        lastFrameTime = now;
        const t = simTime;
        const sSphere = Math.min(RAMP_LEN_M, 0.5 * aSphere * t * t);
        const sDisk = Math.min(RAMP_LEN_M, 0.5 * aDisk * t * t);
        const sHoop = Math.min(RAMP_LEN_M, 0.5 * aHoop * t * t);
        placeAt(ballSphere, sSphere, theta);
        placeAt(ballDisk, sDisk, theta);
        placeAt(ballHoop, sHoop, theta);

        if (!doneSphere && sSphere >= RAMP_LEN_M) { doneSphere = true; sphereVal.textContent = t.toFixed(2) + " s"; }
        if (!doneDisk && sDisk >= RAMP_LEN_M) { doneDisk = true; diskVal.textContent = t.toFixed(2) + " s"; }
        if (!doneHoop && sHoop >= RAMP_LEN_M) { doneHoop = true; hoopVal.textContent = t.toFixed(2) + " s"; }

        if (doneSphere && doneDisk && doneHoop) {
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
  // Widget 2 (Rolling Without Slipping) -- Yo-Yo / Spool Model
  // ---------------------------------------------------------------
  function initYoyo() {
    const svg = document.getElementById("yoyoSvg");
    if (!svg) return;
    const string = document.getElementById("yoyoString");
    const body = document.getElementById("yoyoBody");
    const rSlider = document.getElementById("yoyoRSlider");
    const rVal = document.getElementById("yoyoRVal");
    const axleSlider = document.getElementById("yoyoAxleSlider");
    const axleVal = document.getElementById("yoyoAxleVal");
    const goBtn = document.getElementById("yoyoGoBtn");
    const aVal = document.getElementById("yoyoAVal");
    const compareVal = document.getElementById("yoyoCompareVal");

    const Y0 = 60, Y_MAX = 190, PXPM = 2000;
    let animating = false, rafId = null;

    function current() {
      const R = parseFloat(rSlider.value);
      const r = parseFloat(axleSlider.value);
      const a = G / (1 + (0.5 * R * R) / (r * r));
      return { R, r, a };
    }

    function redraw() {
      const { R, r, a } = current();
      rVal.textContent = R.toFixed(3) + " m";
      axleVal.textContent = r.toFixed(3) + " m";
      aVal.textContent = a.toFixed(2) + " m/s²";
      compareVal.textContent = (G / a).toFixed(0) + "× slower";
    }
    rSlider.addEventListener("input", redraw);
    axleSlider.addEventListener("input", redraw);
    redraw();
    body.setAttribute("cy", Y0);
    string.setAttribute("y2", Y0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const { a } = current();
      body.setAttribute("cy", Y0);
      string.setAttribute("y2", Y0);

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const y = Y0 + 0.5 * a * t * t * PXPM;
        if (y >= Y_MAX) {
          body.setAttribute("cy", Y_MAX); string.setAttribute("y2", Y_MAX);
          animating = false;
          goBtn.disabled = false;
          return;
        }
        body.setAttribute("cy", y); string.setAttribute("y2", y);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 3 (Rolling Without Slipping) -- Bowling Ball
  // ---------------------------------------------------------------
  function initBowling() {
    const v0Slider = document.getElementById("bowlV0Slider");
    if (!v0Slider) return;
    const v0Val = document.getElementById("bowlV0Val");
    const w0Slider = document.getElementById("bowlW0Slider");
    const w0Val = document.getElementById("bowlW0Val");
    const vfVal = document.getElementById("bowlVfVal");
    const lostVal = document.getElementById("bowlLostVal");
    const barV0 = document.getElementById("bowlBarV0");
    const barVf = document.getElementById("bowlBarVf");

    const BALL_R = 0.108, BAR_MAX = 60;

    function redraw() {
      const v0 = parseFloat(v0Slider.value);
      const w0 = parseFloat(w0Slider.value);
      const vf = (5 / 7) * v0 + (2 / 7) * BALL_R * w0;
      v0Val.textContent = v0 + " m/s";
      w0Val.textContent = w0 + " rad/s";
      vfVal.textContent = vf.toFixed(2) + " m/s";
      lostVal.textContent = (v0 - vf).toFixed(2) + " m/s";

      const scale = BAR_MAX / 15;
      const h0 = clamp(v0 * scale, 0, BAR_MAX);
      const hf = clamp(vf * scale, 0, BAR_MAX);
      barV0.setAttribute("y", 80 - h0); barV0.setAttribute("height", h0);
      barVf.setAttribute("y", 80 - hf); barVf.setAttribute("height", hf);
    }
    v0Slider.addEventListener("input", redraw);
    w0Slider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Angular Momentum) -- Figure Skater
  // ---------------------------------------------------------------
  function initSkaterMomentum() {
    const svg = document.getElementById("skaterSvg");
    if (!svg) return;
    const armLeft = document.getElementById("skaterArmLeft");
    const armRight = document.getElementById("skaterArmRight");
    const iBodySlider = document.getElementById("skaterIBodySlider");
    const iBodyVal = document.getElementById("skaterIBodyVal");
    const handMSlider = document.getElementById("skaterHandMSlider");
    const handMVal = document.getElementById("skaterHandMVal");
    const w0Slider = document.getElementById("skaterW0Slider");
    const w0Val = document.getElementById("skaterW0Val");
    const pullBtn = document.getElementById("skaterPullBtn");
    const iVal = document.getElementById("skaterIVal");
    const lVal = document.getElementById("skaterLVal");
    const wInVal = document.getElementById("skaterWInVal");

    const ARMS_OUT_R = 0.7, ARMS_IN_R = 0.15, PXPM = 100;
    let animating = false, rafId = null, angle = 0;

    function current() {
      const iBody = parseFloat(iBodySlider.value);
      const handM = parseFloat(handMSlider.value);
      const w0 = parseFloat(w0Slider.value);
      const iOut = iBody + 2 * handM * ARMS_OUT_R * ARMS_OUT_R;
      const iIn = iBody + 2 * handM * ARMS_IN_R * ARMS_IN_R;
      const L = iOut * w0;
      const wIn = L / iIn;
      return { iOut, iIn, L, w0, wIn };
    }

    function setArms(r) {
      const px = r * PXPM;
      armLeft.setAttribute("x2", 100 - px);
      armRight.setAttribute("x2", 100 + px);
    }

    function redraw() {
      const { iOut, iIn, L, wIn } = current();
      iBodyVal.textContent = iBodySlider.value + " kg·m²";
      handMVal.textContent = handMSlider.value + " kg";
      w0Val.textContent = parseFloat(w0Slider.value).toFixed(1) + " rad/s";
      iVal.textContent = iOut.toFixed(2) + " / " + iIn.toFixed(2) + " kg·m²";
      lVal.textContent = L.toFixed(2) + " kg·m²/s";
      wInVal.textContent = wIn.toFixed(2) + " rad/s";
    }
    [iBodySlider, handMSlider, w0Slider].forEach((s) => s.addEventListener("input", () => { redraw(); setArms(ARMS_OUT_R); }));
    redraw();
    setArms(ARMS_OUT_R);

    pullBtn.addEventListener("click", () => {
      if (animating) return;
      const { w0, wIn } = current();
      animating = true;
      pullBtn.disabled = true;
      setArms(ARMS_OUT_R);
      const PULL_DURATION = 1.0, SPIN_DURATION = 2.5;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= PULL_DURATION) {
          const f = t / PULL_DURATION;
          setArms(ARMS_OUT_R + (ARMS_IN_R - ARMS_OUT_R) * f);
          angle += w0 * 0.05;
        } else {
          const t2 = t - PULL_DURATION;
          angle += wIn * 0.05;
          if (t2 >= SPIN_DURATION) {
            animating = false;
            pullBtn.disabled = false;
            return;
          }
        }
        armLeft.setAttribute("transform", "rotate(" + (angle * 180) / Math.PI + " 100 70)");
        armRight.setAttribute("transform", "rotate(" + (angle * 180) / Math.PI + " 100 70)");
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Angular Momentum) -- The Bicycle-Wheel Reaction
  // ---------------------------------------------------------------
  function initBicycleWheelReaction() {
    const lSlider = document.getElementById("bikeWheelLSlider");
    if (!lSlider) return;
    const lVal = document.getElementById("bikeWheelLVal");
    const iSlider = document.getElementById("bikeWheelISlider");
    const iVal = document.getElementById("bikeWheelIVal");
    const dLVal = document.getElementById("bikeWheelDLVal");
    const wVal = document.getElementById("bikeWheelWVal");
    const lArrow = document.getElementById("bikeWheelLArrow");
    const personArm = document.getElementById("bikeWheelPersonArm");
    const flipBtn = document.getElementById("bikeWheelFlipBtn");

    let flipped = false, animating = false, personAngle = 0;

    function current() {
      const L = parseFloat(lSlider.value);
      const iPerson = parseFloat(iSlider.value);
      const dL = 2 * L;
      const w = dL / iPerson;
      return { L, iPerson, dL, w };
    }

    function redraw() {
      const { L, iPerson, dL, w } = current();
      lVal.textContent = L.toFixed(1) + " kg·m²/s";
      iVal.textContent = iPerson.toFixed(1) + " kg·m²";
      dLVal.textContent = dL.toFixed(1) + " kg·m²/s";
      wVal.textContent = w.toFixed(2) + " rad/s";
    }
    lSlider.addEventListener("input", redraw);
    iSlider.addEventListener("input", redraw);
    redraw();

    flipBtn.addEventListener("click", () => {
      if (animating) return;
      animating = true;
      flipBtn.disabled = true;
      flipped = !flipped;
      const targetY = flipped ? 110 : 30;
      const startY = flipped ? 30 : 110;
      const { w } = current();
      const FLIP_T = 0.8, SPIN_T = 2.0;
      const start = performance.now();
      function frame(now) {
        const t = (now - start) / 1000;
        if (t <= FLIP_T) {
          const f = t / FLIP_T;
          lArrow.setAttribute("y2", startY + (targetY - startY) * f);
        } else {
          lArrow.setAttribute("y2", targetY);
          const t2 = t - FLIP_T;
          personAngle += w * 0.03;
          personArm.setAttribute("transform", "rotate(" + (personAngle * 180) / Math.PI + " 150 70)");
          if (t2 >= SPIN_T) {
            animating = false;
            flipBtn.disabled = false;
            return;
          }
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 3 (Angular Momentum) -- Gyroscopic Precession
  // ---------------------------------------------------------------
  function initGyroPrecession() {
    const svg = document.getElementById("gyroSvg");
    if (!svg) return;
    const axis = document.getElementById("gyroAxis");
    const tip = document.getElementById("gyroTip");
    const lSlider = document.getElementById("gyroLSlider");
    const lVal = document.getElementById("gyroLVal");
    const tauSlider = document.getElementById("gyroTauSlider");
    const tauVal = document.getElementById("gyroTauVal");
    const omegaVal = document.getElementById("gyroOmegaVal");
    const effectVal = document.getElementById("gyroEffectVal");

    const CX = 100, CY = 100, R_PX = 70;
    let angle = 0, last = performance.now();

    function current() {
      const L = parseFloat(lSlider.value);
      const tau = parseFloat(tauSlider.value);
      return { L, tau, omega: tau / L };
    }

    function redrawStatic() {
      const { L, tau, omega } = current();
      lVal.textContent = L.toFixed(1) + " kg·m²/s";
      tauVal.textContent = tau.toFixed(1) + " N·m";
      omegaVal.textContent = omega.toFixed(2) + " rad/s";
      effectVal.textContent = omega < 0.3 ? "Slow, steady precession" : omega < 1 ? "Noticeable precession" : "Fast wobble (spin too low for clean precession)";
    }
    lSlider.addEventListener("input", redrawStatic);
    tauSlider.addEventListener("input", redrawStatic);
    redrawStatic();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { omega } = current();
      angle += omega * dt;
      tip.setAttribute("cx", CX + R_PX * Math.sin(angle));
      tip.setAttribute("cy", CY - R_PX * Math.cos(angle));
      axis.setAttribute("x2", CX + R_PX * Math.sin(angle));
      axis.setAttribute("y2", CY - R_PX * Math.cos(angle));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initRotatingDisk();
    initAngularMotionGraph();
    initDoorPush();
    initTorqueBalance();
    initShapeInertia();
    initSpinningChair();
    initFlywheel();
    initRollingRace();
    initRollingRaceSim();
    initYoyo();
    initBowling();
    initSkaterMomentum();
    initBicycleWheelReaction();
    initGyroPrecession();
  });
})();
