// Interactive widgets for docs/07-rotation-and-rolling/index.html.
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
  function vbw(svg) { return (svg.viewBox && svg.viewBox.baseVal.width) || 300; }

  function clientToSvg(svg, evt) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: (evt.clientX - rect.left) * (vb.width / rect.width) + vb.x,
      y: (evt.clientY - rect.top) * (vb.height / rect.height) + vb.y,
    };
  }
  function makeDraggable(handle, svg, onMove) {
    handle.style.cursor = "grab";
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
  function addRunButton(svg, label) {
    if (!svg || !svg.parentNode) return null;
    const btn = document.createElement("button");
    btn.className = "rot-go";
    btn.textContent = label;
    svg.insertAdjacentElement("afterend", btn);
    return btn;
  }

  // ===============================================================
  // Widget 1 (Angular Kinematics) -- Rotating Disk: Same ω, Different v
  // ===============================================================
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
    if (!groupA || !groupB) return;

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
      raSlider.value = clamp(Math.hypot(pt.x - CX, pt.y - CY) / R_PX, 0.1, 1); redrawReadout();
    });
    makeDraggable(groupB.querySelector("circle"), svg, (pt) => {
      rbSlider.value = clamp(Math.hypot(pt.x - CX, pt.y - CY) / R_PX, 0.1, 1); redrawReadout();
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

  // ===============================================================
  // Widget 2 (Angular Kinematics) -- Angular Motion Graph Lab
  // ===============================================================
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
    if (!playBtn) return;

    const T_MAX = 6;
    let animating = false, rafId = null;

    const theta = (t, w0, a) => w0 * t + 0.5 * a * t * t;
    const omega = (t, w0, a) => w0 + a * t;

    function place(t, w0, a) {
      const th = theta(t, w0, a);
      spoke.setAttribute("x2", 70 + 55 * Math.sin(th));
      spoke.setAttribute("y2", 70 - 55 * Math.cos(th));
    }
    function redrawStatic() {
      const w0 = parseFloat(w0Slider.value), a = parseFloat(aSlider.value);
      w0Val.textContent = w0.toFixed(1) + " rad/s";
      aVal.textContent = a.toFixed(1) + " rad/s²";
      tVal.textContent = "0.0 s"; thetaVal.textContent = "0.00 rad"; wVal.textContent = w0.toFixed(2) + " rad/s";
      place(0, w0, a);
      thetaPath.setAttribute("d", "");
      omegaLine.setAttribute("x2", 40); omegaLine.setAttribute("y2", 45);
      const alphaScale = 20 / Math.max(Math.abs(parseFloat(aSlider.min)), Math.abs(parseFloat(aSlider.max)));
      const alphaY = 30 - a * alphaScale;
      alphaLine.setAttribute("y1", alphaY); alphaLine.setAttribute("y2", alphaY);
    }
    [w0Slider, aSlider].forEach((s) => s.addEventListener("input", redrawStatic));
    redrawStatic();

    playBtn.addEventListener("click", () => {
      if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; playBtn.disabled = false; redrawStatic(); return; }
      const w0 = parseFloat(w0Slider.value), a = parseFloat(aSlider.value);
      let thetaMax = 0.01, omegaMax = 0.01;
      for (let i = 0; i <= 60; i++) {
        const t = (T_MAX * i) / 60;
        thetaMax = Math.max(thetaMax, Math.abs(theta(t, w0, a)));
        omegaMax = Math.max(omegaMax, Math.abs(omega(t, w0, a)));
      }
      const toX = (t) => 40 + (t / T_MAX) * 440;
      const toYTheta = (th) => 50 - (clamp(th, -thetaMax, thetaMax) / thetaMax) * 40;
      const toYOmega = (w) => 45 - (clamp(w, -omegaMax, omegaMax) / omegaMax) * 35;

      animating = true; playBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(T_MAX, Math.max(0, (now - start) / 1000));
        const th = theta(t, w0, a), w = omega(t, w0, a);
        tVal.textContent = t.toFixed(1) + " s"; thetaVal.textContent = th.toFixed(2) + " rad"; wVal.textContent = w.toFixed(2) + " rad/s";
        place(t, w0, a);
        let d = "";
        for (let i = 0; i <= 60; i++) {
          const tt = (t * i) / 60;
          d += (i === 0 ? "M" : "L") + toX(tt) + "," + toYTheta(theta(tt, w0, a)) + " ";
        }
        thetaPath.setAttribute("d", d);
        omegaLine.setAttribute("x2", toX(t)); omegaLine.setAttribute("y2", toYOmega(w));
        if (t >= T_MAX) { animating = false; playBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Torque) -- Door Push Explorer  (now swings)
  // ===============================================================
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
    if (!pushPoint) return;

    const HINGE_X = 30, DOOR_Y = 110, PXPM = 100, X_MIN = 45, X_MAX = 270;
    let pushX = 220;

    // Optional swing overlay: a door line from the hinge.
    const swingLine = el("line", { x1: HINGE_X, y1: DOOR_Y, x2: X_MAX, y2: DOOR_Y,
      stroke: "#8a94a6", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.35 });
    svg.insertBefore(swingLine, svg.firstChild.nextSibling || null);
    let animating = false, rafId = null;

    function tau() {
      const f = parseFloat(fSlider.value);
      const theta = (parseFloat(thetaSlider.value) * Math.PI) / 180;
      const r = (pushX - HINGE_X) / PXPM;
      return { f, theta, r, tau: f * r * Math.sin(theta) };
    }
    function redraw() {
      const { f, theta, r, tau: t } = tau();
      fVal.textContent = f + " N";
      thetaVal.textContent = parseFloat(thetaSlider.value) + "°";
      rVal.textContent = r.toFixed(2) + " m";
      tauVal.textContent = t.toFixed(1) + " N·m";
      effectVal.textContent = t > 0.5 ? "Swings open" : "No turning effect (force points along the door)";
      pushPoint.setAttribute("cx", pushX);
      const dirX = Math.cos(theta), dirY = -Math.sin(theta), len = clamp(f * 0.8, 15, 70);
      forceArrow.setAttribute("x1", pushX); forceArrow.setAttribute("y1", DOOR_Y);
      forceArrow.setAttribute("x2", pushX + dirX * len); forceArrow.setAttribute("y2", DOOR_Y + dirY * len);
      if (!animating) swingLine.setAttribute("transform", "");
    }
    fSlider.addEventListener("input", redraw);
    thetaSlider.addEventListener("input", redraw);
    makeDraggable(pushPoint, svg, (pt) => { pushX = clamp(pt.x, X_MIN, X_MAX); redraw(); });
    redraw();

    const runBtn = addRunButton(svg, "Swing the door");
    if (runBtn) runBtn.addEventListener("click", () => {
      if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; redraw(); return; }
      const { tau: t } = tau();
      const maxAngle = clamp(t * 4, 0, 85);
      animating = true;
      const dur = 1.2, start = performance.now();
      function frame(now) {
        const f = clamp((now - start) / 1000 / dur, 0, 1);
        const ang = maxAngle * Math.sin(f * Math.PI / 2);
        swingLine.setAttribute("transform", "rotate(" + (-ang) + " " + HINGE_X + " " + DOOR_Y + ")");
        if (f >= 1) { animating = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Torque) -- Balanced Torques vs. Balanced Forces (couple spins)
  // ===============================================================
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
    if (!f1Slider) return;

    const X1 = 20, X2 = 280, Y = 50, HALF_LEN_M = 1.5, CX = (X1 + X2) / 2;

    // Injected rod that spins in place for a pure couple.
    const rod = el("line", { x1: X1, y1: Y, x2: X2, y2: Y, stroke: "#8a94a6", "stroke-width": 4, opacity: 0.4 });
    svg.insertBefore(rod, svg.firstChild);
    let spin = 0, last = performance.now();

    function state() {
      const f1 = parseFloat(f1Slider.value), f2 = parseFloat(f2Slider.value);
      return { f1, f2, netF: f1 + f2, netT: HALF_LEN_M * (f2 - f1) };
    }
    function redraw() {
      const { f1, f2, netF, netT } = state();
      f1Val.textContent = f1 + " N"; f2Val.textContent = f2 + " N";
      netFVal.textContent = netF + " N"; netTVal.textContent = netT.toFixed(1) + " N·m";
      const forceOk = Math.abs(netF) < 5, torqueOk = Math.abs(netT) < 7.5;
      verdictVal.textContent = forceOk && torqueOk ? "Fully in equilibrium — nothing happens"
        : forceOk && !torqueOk ? "Pure couple — spins in place, no translation"
        : !forceOk && torqueOk ? "Torque balanced, but accelerates sideways without spinning"
        : "Both accelerates sideways and spins";
      f1Arrow.setAttribute("x1", X1); f1Arrow.setAttribute("y1", Y);
      f1Arrow.setAttribute("x2", X1); f1Arrow.setAttribute("y2", Y - clamp(f1, -45, 45));
      f2Arrow.setAttribute("x1", X2); f2Arrow.setAttribute("y1", Y);
      f2Arrow.setAttribute("x2", X2); f2Arrow.setAttribute("y2", Y - clamp(f2, -45, 45));
    }
    f1Slider.addEventListener("input", redraw);
    f2Slider.addEventListener("input", redraw);
    redraw();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const { netT } = state();
      spin += netT * 0.4 * dt; // couple visibly rotates the rod in place
      rod.setAttribute("transform", "rotate(" + ((spin * 180) / Math.PI) + " " + CX + " " + Y + ")");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 1 (Moment of Inertia) -- Shape-and-Inertia Explorer
  // ===============================================================
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
    if (!mSlider) return;

    const BAR_MAX = 110;
    function redraw() {
      const m = parseFloat(mSlider.value), r = parseFloat(rSlider.value);
      const iHoop = m * r * r, iDisk = 0.5 * m * r * r, iSphere = 0.4 * m * r * r, iRod = (m * r * r) / 3;
      mVal.textContent = m + " kg"; rVal.textContent = r.toFixed(2) + " m";
      iHoopVal.textContent = iHoop.toFixed(3) + " kg·m²";
      iDiskVal.textContent = iDisk.toFixed(3) + " kg·m²";
      iSphereVal.textContent = iSphere.toFixed(3) + " kg·m²";
      iRodVal.textContent = iRod.toFixed(3) + " kg·m²";
      const scale = iHoop > 0 ? BAR_MAX / iHoop : 0;
      [[barHoop, iHoop], [barDisk, iDisk], [barSphere, iSphere], [barRod, iRod]].forEach(([bar, val]) => {
        const h = val * scale; bar.setAttribute("y", 120 - h); bar.setAttribute("height", h);
      });
    }
    mSlider.addEventListener("input", redraw);
    rSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // Widget 2 (Moment of Inertia) -- The Spinning Chair
  // ===============================================================
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
    if (!iBodySlider) return;

    const ARMS_OUT_R = 0.7, ARMS_IN_R = 0.15, PXPM = 100;
    function redraw() {
      const iBody = parseFloat(iBodySlider.value);
      const handM = parseFloat(handMSlider.value);
      const r = armsInBox.checked ? ARMS_IN_R : ARMS_OUT_R;
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

  // ===============================================================
  // Widget 1 (Rotational Energy) -- Flywheel Energy Storage
  // ===============================================================
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
    if (!iSlider) return;

    const V_REF = 25;
    let angle = 0, last = performance.now();
    function redrawStatic() {
      const i = parseFloat(iSlider.value), w = parseFloat(wSlider.value);
      const ke = 0.5 * i * w * w, carMass = (2 * ke) / (V_REF * V_REF);
      iVal.textContent = i + " kg·m²"; wVal.textContent = w + " rad/s";
      keVal.textContent = ke.toFixed(0) + " J";
      carVal.textContent = carMass.toFixed(0) + " kg at " + V_REF + " m/s (90 km/h)";
    }
    iSlider.addEventListener("input", redrawStatic);
    wSlider.addEventListener("input", redrawStatic);
    redrawStatic();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      angle += parseFloat(wSlider.value) * dt * 0.2;
      spoke.setAttribute("x2", 70 + 55 * Math.sin(angle));
      spoke.setAttribute("y2", 70 - 55 * Math.cos(angle));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ===============================================================
  // Widget 2 (Rotational Energy) -- Rolling-Race Predictor  (bars now respond)
  // ===============================================================
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

    // Absolute scale anchored to the slider's max height, so raising the
    // height GROWS every bar (the old self-normalized scale left them frozen).
    const hMax = parseFloat(hSlider.max) || 5;
    const vBlockMax = Math.sqrt(2 * G * hMax);
    const scale = BAR_MAX / vBlockMax;

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
      [[barSphere, vSphere], [barDisk, vDisk], [barHoop, vHoop], [barBlock, vBlock]].forEach(([bar, v]) => {
        const hpx = clamp(v * scale, 0, BAR_MAX);
        bar.setAttribute("y", 120 - hpx); bar.setAttribute("height", hpx);
      });
    }
    hSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // Widget 1 (Rolling Without Slipping) -- The Rolling Race, Animated
  //   Fixed: three distinct lanes + rolling spin markers so the ordering
  //   (sphere > disk > hoop) is actually visible.
  // ===============================================================
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
    if (!goBtn) return;

    const BASE = { x: 20, y: 180 }, LEN_PX = 340, RAMP_LEN_M = 3, VIS_R = 12;
    // Each ball rides in its own lane (distinct perpendicular offset).
    const lanes = [
      { ball: ballSphere, off: VIS_R + 2, marker: null },
      { ball: ballDisk, off: VIS_R + 26, marker: null },
      { ball: ballHoop, off: VIS_R + 50, marker: null },
    ];
    // spin markers so rolling is visible (phi = s / R_visual)
    lanes.forEach((L) => {
      if (!L.ball) return;
      L.marker = el("circle", { r: 3, fill: "#fff", stroke: "#33415c", "stroke-width": 1 });
      svg.appendChild(L.marker);
    });
    let animating = false, rafId = null;

    function layout(theta) {
      const run = LEN_PX * Math.cos(theta), rise = LEN_PX * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      rampFill.setAttribute("d", "M " + BASE.x + "," + BASE.y + " L " + top.x + "," + top.y + " L " + (BASE.x + run) + "," + BASE.y + " Z");
    }
    function placeAt(lane, s, theta) {
      if (!lane.ball) return;
      const px = LEN_PX * (s / RAMP_LEN_M);
      const nx = -Math.sin(theta), ny = -Math.cos(theta); // outward normal (up-left)
      const x = BASE.x + px * Math.cos(theta) + nx * lane.off;
      const y = BASE.y - px * Math.sin(theta) + ny * lane.off;
      lane.ball.setAttribute("cx", x); lane.ball.setAttribute("cy", y);
      if (lane.marker) {
        const phi = -px / VIS_R; // rolling: rotate as it advances
        lane.marker.setAttribute("cx", x + (VIS_R - 4) * Math.cos(phi));
        lane.marker.setAttribute("cy", y + (VIS_R - 4) * Math.sin(phi));
      }
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; goBtn.disabled = false;
      const thetaDeg = parseFloat(thetaSlider.value);
      thetaVal.textContent = thetaDeg + "°";
      const theta = (thetaDeg * Math.PI) / 180;
      layout(theta);
      lanes.forEach((L) => placeAt(L, 0, theta));
      sphereVal.textContent = "—"; diskVal.textContent = "—"; hoopVal.textContent = "—";
    }
    thetaSlider.addEventListener("input", reset);
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const theta = (parseFloat(thetaSlider.value) * Math.PI) / 180;
      const gs = G * Math.sin(theta);
      const acc = [gs / 1.4, gs / 1.5, gs / 2.0]; // sphere, disk, hoop
      const done = [false, false, false];
      const readouts = [sphereVal, diskVal, hoopVal];
      animating = true; goBtn.disabled = true;
      let simTime = 0, lastFrame = performance.now();
      function frame(now) {
        simTime += Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        let allDone = true;
        lanes.forEach((L, i) => {
          const s = Math.min(RAMP_LEN_M, 0.5 * acc[i] * simTime * simTime);
          placeAt(L, s, theta);
          if (!done[i] && s >= RAMP_LEN_M) { done[i] = true; readouts[i].textContent = simTime.toFixed(2) + " s"; }
          if (!done[i]) allDone = false;
        });
        if (allDone) { animating = false; goBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Rolling Without Slipping) -- Yo-Yo / Spool Model
  //   Rebuilt: the body now SPINS and the string UNWINDS as it falls.
  // ===============================================================
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
    if (!goBtn) return;

    const CX = 100, Y0 = 60, Y_MAX = 190, PXPM = 2000, BODY_R = 26, AXLE_R = 9;
    let animating = false, rafId = null;

    // Spin marker + axle circle so the spool reads as a spinning disk.
    const axleRing = el("circle", { cx: CX, cy: Y0, r: AXLE_R, fill: "none", stroke: "#8a94a6", "stroke-width": 2 });
    const spinMark = el("circle", { r: 3.5, fill: "#e34948" });
    svg.appendChild(axleRing); svg.appendChild(spinMark);

    function current() {
      const R = parseFloat(rSlider.value), r = parseFloat(axleSlider.value);
      // Uniform-disk yo-yo: a = g / (1 + R^2 / (2 r^2)).
      const a = G / (1 + (0.5 * R * R) / (r * r));
      return { R, r, a };
    }
    function drawAt(y, phi) {
      body.setAttribute("cy", y);
      axleRing.setAttribute("cy", y);
      string.setAttribute("x1", CX + AXLE_R); string.setAttribute("y1", Y0);
      string.setAttribute("x2", CX + AXLE_R); string.setAttribute("y2", y); // string pays off the axle edge
      spinMark.setAttribute("cx", CX + (BODY_R - 5) * Math.cos(phi));
      spinMark.setAttribute("cy", y + (BODY_R - 5) * Math.sin(phi));
    }
    function redraw() {
      const { R, r, a } = current();
      rVal.textContent = R.toFixed(3) + " m";
      axleVal.textContent = r.toFixed(3) + " m";
      aVal.textContent = a.toFixed(2) + " m/s²";
      compareVal.textContent = (G / a).toFixed(0) + "× slower than free fall";
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; goBtn.disabled = false;
      drawAt(Y0, 0);
    }
    rSlider.addEventListener("input", () => { redraw(); reset(); });
    axleSlider.addEventListener("input", () => { redraw(); reset(); });
    redraw(); reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { a } = current();
      animating = true; goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const drop = 0.5 * a * t * t * PXPM;
        const y = Y0 + drop;
        // Rolling on the string: rotation angle = (fallen distance) / axle radius.
        const phi = drop / (AXLE_R);
        if (y >= Y_MAX) { drawAt(Y_MAX, (Y_MAX - Y0) / AXLE_R); animating = false; goBtn.disabled = false; return; }
        drawAt(y, phi);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 3 (Rolling Without Slipping) -- Bowling Ball (now animated)
  // ===============================================================
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

    function state() {
      const v0 = parseFloat(v0Slider.value), w0 = parseFloat(w0Slider.value);
      const vf = (5 / 7) * v0 + (2 / 7) * BALL_R * w0;
      return { v0, w0, vf };
    }
    function redraw() {
      const { v0, w0, vf } = state();
      v0Val.textContent = v0 + " m/s"; w0Val.textContent = w0 + " rad/s";
      vfVal.textContent = vf.toFixed(2) + " m/s"; lostVal.textContent = (v0 - vf).toFixed(2) + " m/s";
      const scale = BAR_MAX / 15;
      const h0 = clamp(v0 * scale, 0, BAR_MAX), hf = clamp(vf * scale, 0, BAR_MAX);
      barV0.setAttribute("y", 80 - h0); barV0.setAttribute("height", h0);
      barVf.setAttribute("y", 80 - hf); barVf.setAttribute("height", hf);
    }
    v0Slider.addEventListener("input", redraw);
    w0Slider.addEventListener("input", redraw);
    redraw();

    // Build a small lane + ball animation next to the bars.
    const container = (barV0 && barV0.closest("svg")) ? barV0.closest("svg").parentNode : null;
    if (!container) return;
    const laneSvg = el("svg", { viewBox: "0 0 320 90", class: "rot-lane-svg" });
    laneSvg.appendChild(el("line", { x1: 0, y1: 70, x2: 320, y2: 70, stroke: "#c7ced6", "stroke-width": 3 }));
    const ball = el("circle", { cx: 30, cy: 52, r: 16, fill: "#2a2a2a" });
    const mark = el("circle", { r: 4, fill: "#e0913a" });
    const phase = el("text", { x: 160, y: 20, "font-size": 12, fill: "#555", "text-anchor": "middle" });
    laneSvg.appendChild(ball); laneSvg.appendChild(mark); laneSvg.appendChild(phase);
    const runBtn = document.createElement("button");
    runBtn.className = "rot-go"; runBtn.textContent = "Roll it down the lane";
    container.appendChild(laneSvg); container.appendChild(runBtn);

    const R_PX = 16, X0 = 30, X1 = 300;
    let animating = false, rafId = null, phi = 0;
    function drawBall(x, spin, txt) {
      ball.setAttribute("cx", x);
      mark.setAttribute("cx", x + (R_PX - 4) * Math.cos(spin));
      mark.setAttribute("cy", 52 + (R_PX - 4) * Math.sin(spin));
      phase.textContent = txt;
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; runBtn.disabled = false; phi = 0; drawBall(X0, 0, "");
    }
    reset();
    [v0Slider, w0Slider].forEach((s) => s.addEventListener("input", reset));

    runBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { v0, w0, vf } = state();
      // Visual scales
      const SKID_T = 1.1, ROLL_T = 1.6, VPX = 26;
      animating = true; runBtn.disabled = true;
      const start = performance.now();
      let x = X0;
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const dt = 1 / 60;
        if (t <= SKID_T) {
          const f = t / SKID_T;
          const v = v0 + (vf - v0) * f;           // translation eases to vf
          const wSurface = (w0 * BALL_R) + ((vf) - (w0 * BALL_R)) * f; // surface speed of spin -> vf
          x = clamp(x + v * VPX * dt, X0, X1);
          phi += (wSurface / R_PX) * VPX * dt * 6; // exaggerate spin visibility
          drawBall(x, phi, "SKIDDING  (v \u2260 R\u03c9  \u2014 kinetic friction acts)");
        } else if (t <= SKID_T + ROLL_T) {
          x = clamp(x + vf * VPX * dt, X0, X1);
          phi += (vf / R_PX) * VPX * dt * 6;
          drawBall(x, phi, "ROLLING  (v = R\u03c9  \u2014 no more slipping)");
          if (x >= X1) { animating = false; runBtn.disabled = false; return; }
        } else { animating = false; runBtn.disabled = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Angular Momentum) -- Figure Skater   (L = I w conserved)
  // ===============================================================
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
    if (!pullBtn) return;

    const ARMS_OUT_R = 0.7, ARMS_IN_R = 0.15, PXPM = 100;
    let animating = false, rafId = null, angle = 0;

    function current() {
      const iBody = parseFloat(iBodySlider.value);
      const handM = parseFloat(handMSlider.value);
      const w0 = parseFloat(w0Slider.value);
      const iOut = iBody + 2 * handM * ARMS_OUT_R * ARMS_OUT_R;
      const iIn = iBody + 2 * handM * ARMS_IN_R * ARMS_IN_R;
      const L = iOut * w0;
      return { iOut, iIn, L, w0, wIn: L / iIn };
    }
    function setArms(r) {
      const px = r * PXPM;
      armLeft.setAttribute("x2", 100 - px); armRight.setAttribute("x2", 100 + px);
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
    redraw(); setArms(ARMS_OUT_R);

    pullBtn.addEventListener("click", () => {
      if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; pullBtn.disabled = false; setArms(ARMS_OUT_R); return; }
      const { w0, wIn } = current();
      animating = true; pullBtn.disabled = true; setArms(ARMS_OUT_R);
      const PULL = 1.0, SPIN = 2.5;
      let last = performance.now(); const start = last;
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const t = (now - start) / 1000;
        if (t <= PULL) {
          setArms(ARMS_OUT_R + (ARMS_IN_R - ARMS_OUT_R) * (t / PULL));
          angle += w0 * dt;
        } else {
          angle += wIn * dt;
          if (t >= PULL + SPIN) { animating = false; pullBtn.disabled = false; return; }
        }
        const deg = (angle * 180) / Math.PI;
        armLeft.setAttribute("transform", "rotate(" + deg + " 100 70)");
        armRight.setAttribute("transform", "rotate(" + deg + " 100 70)");
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Angular Momentum) -- The Bicycle-Wheel Reaction (dL = 2L)
  // ===============================================================
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
    if (!flipBtn) return;

    let flipped = false, animating = false, personAngle = 0, rafId = null;
    function current() {
      const L = parseFloat(lSlider.value);
      const iPerson = parseFloat(iSlider.value);
      const dL = 2 * L;
      return { L, iPerson, dL, w: dL / iPerson };
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
      if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; flipBtn.disabled = false; return; }
      animating = true; flipBtn.disabled = true; flipped = !flipped;
      const targetY = flipped ? 110 : 30, startY = flipped ? 30 : 110;
      const { w } = current();
      const FLIP_T = 0.8, SPIN_T = 2.0;
      let last = performance.now(); const start = last;
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const t = (now - start) / 1000;
        if (t <= FLIP_T) {
          lArrow.setAttribute("y2", startY + (targetY - startY) * (t / FLIP_T));
        } else {
          lArrow.setAttribute("y2", targetY);
          personAngle += w * dt;
          personArm.setAttribute("transform", "rotate(" + ((personAngle * 180) / Math.PI) + " 150 70)");
          if (t >= FLIP_T + SPIN_T) { animating = false; flipBtn.disabled = false; return; }
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // // ===============================================================
  // // Widget 3 (Angular Momentum) -- Gyroscopic Precession (Omega = tau/L)
  // // ===============================================================
  // function initGyroPrecession() {
  //   const svg = document.getElementById("gyroSvg");
  //   if (!svg) return;
  //   const axis = document.getElementById("gyroAxis");
  //   const tip = document.getElementById("gyroTip");
  //   const lSlider = document.getElementById("gyroLSlider");
  //   const lVal = document.getElementById("gyroLVal");
  //   const tauSlider = document.getElementById("gyroTauSlider");
  //   const tauVal = document.getElementById("gyroTauVal");
  //   const omegaVal = document.getElementById("gyroOmegaVal");
  //   const effectVal = document.getElementById("gyroEffectVal");
  //   if (!lSlider) return;

  //   const CX = 100, CY = 100, R_PX = 70;
  //   let angle = 0, last = performance.now();
  //   function current() {
  //     const L = parseFloat(lSlider.value), tau = parseFloat(tauSlider.value);
  //     return { L, tau, omega: tau / L };
  //   }
  //   function redrawStatic() {
  //     const { L, tau, omega } = current();
  //     lVal.textContent = L.toFixed(1) + " kg·m²/s";
  //     tauVal.textContent = tau.toFixed(1) + " N·m";
  //     omegaVal.textContent = omega.toFixed(2) + " rad/s";
  //     effectVal.textContent = omega < 0.3 ? "Slow, steady precession"
  //       : omega < 1 ? "Noticeable precession"
  //       : "Fast wobble (spin too low for clean precession)";
  //   }
  //   lSlider.addEventListener("input", redrawStatic);
  //   tauSlider.addEventListener("input", redrawStatic);
  //   redrawStatic();
  //   function tick(now) {
  //     const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  //     angle += current().omega * dt;
  //     tip.setAttribute("cx", CX + R_PX * Math.sin(angle));
  //     tip.setAttribute("cy", CY - R_PX * Math.cos(angle));
  //     axis.setAttribute("x2", CX + R_PX * Math.sin(angle));
  //     axis.setAttribute("y2", CY - R_PX * Math.cos(angle));
  //     requestAnimationFrame(tick);
  //   }
  //   requestAnimationFrame(tick);
  // }

    // ===============================================================
  // Widget 3 (Angular Momentum) -- Gyroscopic Precession
  //   Now shows L (spin ang. momentum), W (weight), and torque
  //   tau = r x W explicitly.  Precession rate Omega = tau / L, and
  //   crucially tau is PERPENDICULAR to L, so L turns instead of falling.
  // ===============================================================
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
    if (!lSlider) return;

    const CX = 100, CY = 100, R_PX = 70;
    let angle = 0, last = performance.now();

    // --- Arrow marker (shared) ---
    let defs = svg.querySelector("defs");
    if (!defs) { defs = el("defs", {}); svg.insertBefore(defs, svg.firstChild); }
    if (!svg.querySelector("#gyroArrow")) {
      const mk = el("marker", { id: "gyroArrow", markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto" });
      mk.appendChild(el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#555" }));
      defs.appendChild(mk);
    }

    // --- Injected vectors: pivot, support rod, L, weight W, torque tau ---
    const PIVOT = { x: CX - 10, y: CY + 40 };
    const pivotDot = el("circle", { cx: PIVOT.x, cy: PIVOT.y, r: 3, fill: "#33415c" });
    const support = el("line", { x1: PIVOT.x, y1: PIVOT.y + 40, x2: PIVOT.x, y2: PIVOT.y, stroke: "#8a94a6", "stroke-width": 3 });
    const lArrow = el("line", { stroke: "#2a78d6", "stroke-width": 4, "marker-end": "url(#gyroArrow)" });
    const lLabel = el("text", { "font-size": 12, fill: "#2a78d6", "font-weight": "700" });
    lLabel.textContent = "L";
    const wArrow = el("line", { stroke: "#c94b4b", "stroke-width": 3, "marker-end": "url(#gyroArrow)" });
    const wLabel = el("text", { "font-size": 11, fill: "#c94b4b" });
    wLabel.textContent = "W";
    const tauArrow = el("line", { stroke: "#3a9d5a", "stroke-width": 4, "marker-end": "url(#gyroArrow)" });
    const tauLabel = el("text", { "font-size": 12, fill: "#3a9d5a", "font-weight": "700" });
    tauLabel.textContent = "\u03c4 = r\u00d7W";
    [support, pivotDot, lArrow, lLabel, wArrow, wLabel, tauArrow, tauLabel].forEach((n) => svg.appendChild(n));

    // --- Top-down inset: shows L rotating and tau always 90 deg ahead ---
    const IX = 235, IY = 70, IR = 40;
    svg.appendChild(el("circle", { cx: IX, cy: IY, r: IR, fill: "none", stroke: "#e2e6ea", "stroke-width": 1.5, "stroke-dasharray": "4 4" }));
    svg.appendChild(el("text", { x: IX, y: IY - IR - 6, "font-size": 10, fill: "#555", "text-anchor": "middle" })).textContent = "top view";
    const insetL = el("line", { stroke: "#2a78d6", "stroke-width": 3, "marker-end": "url(#gyroArrow)" });
    const insetTau = el("line", { stroke: "#3a9d5a", "stroke-width": 3, "marker-end": "url(#gyroArrow)" });
    svg.appendChild(insetL); svg.appendChild(insetTau);

    function current() {
      const L = parseFloat(lSlider.value), tau = parseFloat(tauSlider.value);
      return { L, tau, omega: tau / L };
    }
    function redrawStatic() {
      const { L, tau, omega } = current();
      lVal.textContent = L.toFixed(1) + " kg·m²/s";
      tauVal.textContent = tau.toFixed(1) + " N·m";
      omegaVal.textContent = omega.toFixed(2) + " rad/s";
      effectVal.textContent = omega < 0.3 ? "Slow, steady precession"
        : omega < 1 ? "Noticeable precession"
        : "Fast wobble (spin too low for clean precession)";
    }
    lSlider.addEventListener("input", redrawStatic);
    tauSlider.addEventListener("input", redrawStatic);
    redrawStatic();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const { L, tau, omega } = current();
      angle += omega * dt;

      // Original spinning-tip visual (kept).
      const tx = CX + R_PX * Math.sin(angle), ty = CY - R_PX * Math.cos(angle);
      tip.setAttribute("cx", tx); tip.setAttribute("cy", ty);
      axis.setAttribute("x2", tx); axis.setAttribute("y2", ty);

      // L points along the (horizontal-projected) spin axis from the pivot.
      const Llen = clamp(28 + L * 3, 28, 60);
      const lx = PIVOT.x + Llen * Math.sin(angle);
      const ly = PIVOT.y - Llen * 0.35 * Math.cos(angle); // slight tilt for 3-D feel
      lArrow.setAttribute("x1", PIVOT.x); lArrow.setAttribute("y1", PIVOT.y);
      lArrow.setAttribute("x2", lx); lArrow.setAttribute("y2", ly);
      lLabel.setAttribute("x", lx + 4); lLabel.setAttribute("y", ly - 4);

      // Weight W hangs straight down from the wheel end.
      wArrow.setAttribute("x1", lx); wArrow.setAttribute("y1", ly);
      wArrow.setAttribute("x2", lx); wArrow.setAttribute("y2", ly + clamp(tau * 3, 12, 34));
      wLabel.setAttribute("x", lx + 5); wLabel.setAttribute("y", ly + 22);

      // Torque tau = r x W is horizontal and 90 deg ahead of L in the
      // precession plane -> this is the vector that MOVES the tip of L.
      const tlen = clamp(18 + tau * 4, 18, 40);
      const tdir = angle + Math.PI / 2;
      tauArrow.setAttribute("x1", lx); tauArrow.setAttribute("y1", ly);
      tauArrow.setAttribute("x2", lx + tlen * Math.cos(tdir));
      tauArrow.setAttribute("y2", ly - tlen * 0.35 * Math.sin(tdir));
      tauLabel.setAttribute("x", lx + tlen * Math.cos(tdir) + 3);
      tauLabel.setAttribute("y", ly - tlen * 0.35 * Math.sin(tdir));

      // Inset (clean top-down): L radial, tau tangential (90 deg ahead).
      const ilx = IX + IR * Math.cos(angle), ily = IY + IR * Math.sin(angle);
      insetL.setAttribute("x1", IX); insetL.setAttribute("y1", IY);
      insetL.setAttribute("x2", ilx); insetL.setAttribute("y2", ily);
      insetTau.setAttribute("x1", ilx); insetTau.setAttribute("y1", ily);
      insetTau.setAttribute("x2", ilx + 16 * Math.cos(angle + Math.PI / 2));
      insetTau.setAttribute("y2", ily + 16 * Math.sin(angle + Math.PI / 2));

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }


  // ===============================================================
  // NEW Widget -- Equal Torque, Different Spin-Up  [#torqueSpinHost]
  //   alpha = tau / I. Hoop, disk, sphere spin at different rates.
  //   Self-builds DOM; no-ops if the host div is absent.
  // ===============================================================
  function initTorqueSpin() {
    const host = document.getElementById("torqueSpinHost");
    if (!host) return;
    host.classList.add("rot-widget");
    host.innerHTML =
      '<div class="rot-controls">' +
      '  <label>Applied torque τ <input type="range" min="0.5" max="8" step="0.5" value="3" data-r="tau"> <span data-o="tau"></span> N·m</label>' +
      '  <label>Mass m <input type="range" min="0.5" max="5" step="0.5" value="2" data-r="m"> <span data-o="m"></span> kg</label>' +
      '  <label>Radius R <input type="range" min="0.1" max="0.5" step="0.05" value="0.25" data-r="R"> <span data-o="R"></span> m</label>' +
      '  <button class="rot-go" data-go>Apply torque</button>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 300 150", class: "rot-svg" });
    const specs = [
      { name: "Hoop", coef: 1.0, cx: 55, color: "#c94b4b" },
      { name: "Disk", coef: 0.5, cx: 150, color: "#2a78d6" },
      { name: "Sphere", coef: 0.4, cx: 245, color: "#3a9d5a" },
    ];
    const gears = specs.map((s) => {
      const g = el("g", {});
      g.appendChild(el("circle", { cx: s.cx, cy: 70, r: 34, fill: "none", stroke: s.color, "stroke-width": 4 }));
      const spoke = el("line", { x1: s.cx, y1: 70, x2: s.cx, y2: 36, stroke: s.color, "stroke-width": 4 });
      g.appendChild(spoke);
      svg.appendChild(g);
      svg.appendChild(el("text", { x: s.cx, y: 128, "font-size": 11, fill: "#555", "text-anchor": "middle" })).textContent = s.name;
      return { spoke, cx: s.cx, coef: s.coef, angle: 0 };
    });
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "rot-readouts";
    readouts.innerHTML =
      '<div>α hoop: <b data-o="ah">—</b></div>' +
      '<div>α disk: <b data-o="ad">—</b></div>' +
      '<div>α sphere: <b data-o="as">—</b></div>' +
      '<div class="rot-verdict">Same torque, same m &amp; R → smaller I spins up faster (sphere wins).</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const tauS = q('[data-r="tau"]'), mS = q('[data-r="m"]'), RS = q('[data-r="R"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    let running = false, rafId = null, last = performance.now();

    function alphas() {
      const tau = parseFloat(tauS.value), m = parseFloat(mS.value), R = parseFloat(RS.value);
      const base = m * R * R;
      return specs.map((s) => tau / (s.coef * base));
    }
    function redraw() {
      out("tau").textContent = tauS.value; out("m").textContent = mS.value; out("R").textContent = parseFloat(RS.value).toFixed(2);
      const a = alphas();
      out("ah").textContent = a[0].toFixed(2) + " rad/s²";
      out("ad").textContent = a[1].toFixed(2) + " rad/s²";
      out("as").textContent = a[2].toFixed(2) + " rad/s²";
    }
    [tauS, mS, RS].forEach((s) => s.addEventListener("input", () => { redraw(); }));
    redraw();

    function draw() {
      gears.forEach((g) => {
        g.spoke.setAttribute("x2", g.cx + 34 * Math.sin(g.angle));
        g.spoke.setAttribute("y2", 70 - 34 * Math.cos(g.angle));
      });
    }
    q("[data-go]").addEventListener("click", () => {
      if (running) { if (rafId) cancelAnimationFrame(rafId); running = false; gears.forEach((g) => g.angle = 0); draw(); return; }
      gears.forEach((g) => g.angle = 0);
      running = true; last = performance.now();
      let w = [0, 0, 0];
      const a = alphas();
      function tick(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        gears.forEach((g, i) => { w[i] += a[i] * dt; g.angle += w[i] * dt; });
        draw();
        if (gears[2].angle > 6 * Math.PI) { running = false; return; } // stop after sphere ~3 turns
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });
  }


    // ===============================================================
  // NEW Widget -- Tennis-Racket / Intermediate-Axis Theorem
  //   [#tennisRacketHost]  Integrates Euler's equations for a torque-free
  //   rigid body:  I1 w1' = (I2-I3) w2 w3, and cyclic.
  //   Spin about min (I1) or max (I3) axis: stable.
  //   Spin about intermediate (I2) axis: unstable -> periodic flips.
  //   Self-builds DOM; no-ops if the host div is absent.
  // ===============================================================
  function initTennisRacket() {
    const host = document.getElementById("tennisRacketHost");
    if (!host) return;
    host.classList.add("rot-widget");
    host.innerHTML =
      '<div class="rot-controls">' +
      '  <label>Spin axis:</label>' +
      '  <div class="rot-presets" data-role="axis">' +
      '    <button data-axis="1">Min (I₁) — stable</button>' +
      '    <button data-axis="2" class="active">Intermediate (I₂) — unstable</button>' +
      '    <button data-axis="3">Max (I₃) — stable</button>' +
      '  </div>' +
      '  <label>Wobble (perturbation) <input type="range" min="0.01" max="0.3" step="0.01" value="0.08" data-r="pert"> <span data-o="pert"></span></label>' +
      '  <button class="rot-go" data-go>Launch spin</button>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 360 200", class: "rot-svg" });
    // Left: orientation box (a "racket": long handle + head plane).
    // We fake 3-D with an axonometric projection of a rectangular body.
    const bodyG = el("g", {});
    svg.appendChild(bodyG);
    // Right: the three angular-velocity components vs time.
    svg.appendChild(el("line", { x1: 210, y1: 100, x2: 350, y2: 100, stroke: "#e2e6ea", "stroke-width": 1 }));
    svg.appendChild(el("text", { x: 280, y: 190, "font-size": 10, fill: "#555", "text-anchor": "middle" })).textContent = "ω₁ (red), ω₂ (blue), ω₃ (green) vs time";
    const p1 = el("path", { fill: "none", stroke: "#c94b4b", "stroke-width": 2 });
    const p2 = el("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 2 });
    const p3 = el("path", { fill: "none", stroke: "#3a9d5a", "stroke-width": 2 });
    svg.appendChild(p1); svg.appendChild(p2); svg.appendChild(p3);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "rot-readouts";
    readouts.innerHTML =
      '<div>Flips so far: <b data-o="flips">0</b></div>' +
      '<div>Status: <b data-o="status">—</b></div>' +
      '<div class="rot-verdict">Euler\u2019s equations for a torque-free body make the intermediate axis unstable: ' +
      'a tiny wobble grows and the body periodically flips 180°, while the min and max axes only wobble a little.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const pertS = q('[data-r="pert"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const axisBtns = Array.from(host.querySelectorAll('[data-role="axis"] button'));
    let axis = 2;

    // Distinct principal moments (long thin racket-like body): I1 < I2 < I3.
    const I1 = 1.0, I2 = 2.0, I3 = 3.0;
    let w = [0, 0, 0], running = false, rafId = null, last = 0;
    let series = [[], [], []], flips = 0, prevSign = 0, orient = 0;

    axisBtns.forEach((b) => b.addEventListener("click", () => {
      axisBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      axis = parseInt(b.dataset.axis, 10);
    }));
    pertS.addEventListener("input", () => { out("pert").textContent = parseFloat(pertS.value).toFixed(2); });
    out("pert").textContent = parseFloat(pertS.value).toFixed(2);

    // Axonometric projection of a point (body-frame) rotated by 'orient'
    // about the current dominant axis — enough to *show* tumbling.
    function drawBody(w1, w2, w3) {
      // Represent the racket as a set of 3 principal axis segments whose
      // apparent lengths track the current angular velocity direction.
      const cx = 100, cy = 100, S = 55;
      // Build an orientation from integrated dominant rotation.
      const c = Math.cos(orient), s = Math.sin(orient);
      // axis vectors in a simple oblique projection
      function proj(v) {
        // v = [x,y,z] body; oblique: screen_x = x + 0.5 z, screen_y = -y + 0.5 z
        return [cx + (v[0] * c - v[1] * s) * S + 0.4 * v[2] * S,
                cy - (v[0] * s + v[1] * c) * S * 0.5 + 0.4 * v[2] * S];
      }
      bodyG.innerHTML = "";
      const axesv = [
        { v: [1, 0, 0], col: "#c94b4b" },  // I1
        { v: [0, 1, 0], col: "#2a78d6" },  // I2
        { v: [0, 0, 1], col: "#3a9d5a" },  // I3
      ];
      // handle + head to look racket-ish
      const hEnd = proj([0, 0, 1.1]);
      bodyG.appendChild(el("line", { x1: cx, y1: cy, x2: hEnd[0], y2: hEnd[1], stroke: "#8a6a3a", "stroke-width": 5, "stroke-linecap": "round" }));
      const head = proj([0, 0, 1.1]);
      bodyG.appendChild(el("ellipse", { cx: head[0], cy: head[1], rx: 22, ry: 12, fill: "none", stroke: "#33415c", "stroke-width": 3,
        transform: "rotate(" + ((orient * 180) / Math.PI) + " " + head[0] + " " + head[1] + ")" }));
      axesv.forEach((a) => {
        const p = proj(a.v);
        bodyG.appendChild(el("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: a.col, "stroke-width": 2.5, opacity: 0.9 }));
      });
    }

    function drawGraph() {
      const toX = (i) => 212 + (i / 240) * 136;
      const toY = (val) => 100 - clamp(val, -1.2, 1.2) * 42;
      function path(arr) {
        let d = "";
        arr.forEach((v, i) => { d += (i === 0 ? "M" : "L") + toX(i) + "," + toY(v) + " "; });
        return d;
      }
      p1.setAttribute("d", path(series[0]));
      p2.setAttribute("d", path(series[1]));
      p3.setAttribute("d", path(series[2]));
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      running = false; w = [0, 0, 0]; series = [[], [], []]; flips = 0; prevSign = 0; orient = 0;
      out("flips").textContent = "0"; out("status").textContent = "—";
      drawBody(0, 0, 0); drawGraph();
    }
    reset();

    q("[data-go]").addEventListener("click", () => {
      if (running) { reset(); return; }
      reset();
      const pert = parseFloat(pertS.value);
      // Dominant spin on chosen axis (~1), tiny perturbations on the others.
      w = [pert, pert, pert];
      w[axis - 1] = 1.0;
      running = true; last = performance.now();
      out("status").textContent = axis === 2 ? "Watch for the flip…" : "Stable — small wobble only";

      function tick(now) {
        let dt = Math.min(0.03, Math.max(0, (now - last) / 1000)); last = now;
        // Integrate Euler's equations (torque-free) with small substeps.
        const SUB = 0.004;
        let rem = dt * 1.2; // slight speed-up for watchability
        while (rem > 0) {
          const h = Math.min(SUB, rem);
          const [w1, w2, w3] = w;
          const dw1 = ((I2 - I3) / I1) * w2 * w3;
          const dw2 = ((I3 - I1) / I2) * w3 * w1;
          const dw3 = ((I1 - I2) / I3) * w1 * w2;
          w[0] += dw1 * h; w[1] += dw2 * h; w[2] += dw3 * h;
          orient += w[axis - 1] * h * 1.2;
          rem -= h;
        }
        // Record dominant-axis component for the flip counter.
        const dom = w[axis - 1];
        const sign = dom >= 0 ? 1 : -1;
        if (prevSign !== 0 && sign !== prevSign && axis === 2) {
          flips++; out("flips").textContent = String(flips);
          out("status").textContent = "Flipped! (intermediate-axis instability)";
        }
        prevSign = sign;

        series[0].push(w[0]); series[1].push(w[1]); series[2].push(w[2]);
        if (series[0].length > 240) series.forEach((s) => s.shift());

        drawBody(w[0], w[1], w[2]);
        drawGraph();
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });
  }

  // ===============================================================
  // NEW Widget -- Spool Paradox  [#spoolParadoxHost]  (guide §9)
  //   String off the underside of the axle, pulled at angle θ.
  //   Critical angle cosθc = r/R:  θ<θc rolls TOWARD you, θ>θc AWAY.
  //   Self-builds DOM; no-ops if the host div is absent.
  // ===============================================================
  function initSpoolParadox() {
    const host = document.getElementById("spoolParadoxHost");
    if (!host) return;
    host.classList.add("rot-widget");
    host.innerHTML =
      '<div class="rot-controls">' +
      '  <label>Pull angle θ <input type="range" min="0" max="85" step="1" value="20" data-r="th"> <span data-o="th"></span>°</label>' +
      '  <label>Radius ratio r/R <input type="range" min="0.15" max="0.9" step="0.05" value="0.4" data-r="ratio"> <span data-o="ratio"></span></label>' +
      '  <button class="rot-go" data-go>Pull the string</button>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 360 200", class: "rot-svg" });
    svg.appendChild(el("line", { x1: 0, y1: 160, x2: 360, y2: 160, stroke: "#c7ced6", "stroke-width": 3 }));
    const spool = el("g", {});
    const outer = el("circle", { cx: 0, cy: 0, r: 46, fill: "#e8edf2", stroke: "#33415c", "stroke-width": 3 });
    const axle = el("circle", { cx: 0, cy: 0, r: 18, fill: "#cdd6df", stroke: "#33415c", "stroke-width": 2 });
    const spoke = el("line", { x1: 0, y1: 0, x2: 0, y2: -46, stroke: "#e34948", "stroke-width": 3 });
    spool.appendChild(outer); spool.appendChild(axle); spool.appendChild(spoke);
    const strng = el("line", { stroke: "#c94b4b", "stroke-width": 2.5 });
    svg.appendChild(strng); svg.appendChild(spool);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "rot-readouts";
    readouts.innerHTML =
      '<div>Critical angle θ<sub>c</sub>: <b data-o="thc">—</b></div>' +
      '<div>Behavior: <b data-o="beh">—</b></div>' +
      '<div class="rot-verdict">Below θ<sub>c</sub> the spool rolls <b>toward</b> your pull (winding up!); ' +
      'above θ<sub>c</sub> it rolls <b>away</b>; at θ<sub>c</sub> the string line hits the contact point and it just slides.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const thS = q('[data-r="th"]'), ratioS = q('[data-r="ratio"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const R_PX = 46, GROUND = 160, START_X = 120;
    let running = false, rafId = null, cx = START_X, rot = 0;

    function state() {
      const thDeg = parseFloat(thS.value), th = (thDeg * Math.PI) / 180;
      const ratio = parseFloat(ratioS.value);
      const thc = Math.acos(ratio) * 180 / Math.PI;
      // Pull to the right at angle th. cos th > ratio -> roll right (toward pull).
      let dir = 0;
      if (Math.abs(Math.cos(th) - ratio) < 0.02) dir = 0;      // slides
      else dir = Math.cos(th) > ratio ? 1 : -1;                 // +1 toward pull (right)
      return { thDeg, th, ratio, thc, dir };
    }
    function draw() {
      spool.setAttribute("transform", "translate(" + cx + "," + (GROUND - R_PX) + ") rotate(" + ((rot * 180) / Math.PI) + ")");
      const s = state();
      const axleR = R_PX * s.ratio;
      // String leaves the underside of the axle, going up-right at angle th.
      const ax = cx, ay = (GROUND - R_PX) + axleR;
      const L = 90;
      strng.setAttribute("x1", ax); strng.setAttribute("y1", ay);
      strng.setAttribute("x2", ax + L * Math.cos(s.th)); strng.setAttribute("y2", ay - L * Math.sin(s.th));
    }
    function redraw() {
      const s = state();
      out("th").textContent = s.thDeg; out("ratio").textContent = s.ratio.toFixed(2);
      out("thc").textContent = s.thc.toFixed(1) + "°";
      out("beh").textContent = s.dir > 0 ? "Rolls toward you (right) — winds up"
        : s.dir < 0 ? "Rolls away from you (left) — unwinds"
        : "Slides without rolling";
    }
    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      running = false; cx = START_X; rot = 0; draw();
    }
    [thS, ratioS].forEach((s) => s.addEventListener("input", () => { redraw(); reset(); }));
    redraw(); reset();

    q("[data-go]").addEventListener("click", () => {
      if (running) { reset(); return; }
      reset();
      const s = state();
      running = true;
      let last = performance.now();
      function tick(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const speed = 70 * s.dir; // px/s
        cx += speed * dt;
        rot += (speed / R_PX) * dt;  // rolling without slipping on the ground
        draw();
        if (cx < 60 || cx > 300) { running = false; return; }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    });
  }

  // ---------------------------------------------------------------
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
    // Optional new widgets (safe no-op until their host div is added):
    initTorqueSpin();
    initTennisRacket();
    initSpoolParadox();
  });
})();
