// Interactive widgets for docs/05-simple-machines/index.html.
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
  // Widget 1 (Mechanical Advantage) -- Force-Distance Tradeoff Explorer
  // ---------------------------------------------------------------
  function initMATradeoff() {
    const svg = document.getElementById("maSvg");
    if (!svg) return;
    const boxLabel = document.getElementById("maBoxLabel");
    const inBar = document.getElementById("maInBar");
    const outBar = document.getElementById("maOutBar");
    const maSlider = document.getElementById("maMASlider");
    const maVal = document.getElementById("maMAVal");
    const fInSlider = document.getElementById("maFInSlider");
    const fInVal = document.getElementById("maFInVal");
    const dInSlider = document.getElementById("maDInSlider");
    const dInVal = document.getElementById("maDInVal");
    const fOutVal = document.getElementById("maFOutVal");
    const dOutVal = document.getElementById("maDOutVal");
    const workVal = document.getElementById("maWorkVal");

    const BAR_MAX = 90, W_REF = 1000;

    function redraw() {
      const ma = parseFloat(maSlider.value);
      const fIn = parseFloat(fInSlider.value);
      const dIn = parseFloat(dInSlider.value);
      const fOut = ma * fIn;
      const dOut = dIn / ma;
      const wIn = fIn * dIn;
      const wOut = fOut * dOut;

      maVal.textContent = ma;
      boxLabel.textContent = "MA = " + ma;
      fInVal.textContent = fIn + " N";
      dInVal.textContent = dIn + " m";
      fOutVal.textContent = fOut.toFixed(0) + " N";
      dOutVal.textContent = dOut.toFixed(2) + " m";
      workVal.textContent = wIn.toFixed(0) + " / " + wOut.toFixed(0) + " J";

      const hIn = clamp((wIn / W_REF) * BAR_MAX, 2, BAR_MAX);
      const hOut = clamp((wOut / W_REF) * BAR_MAX, 2, BAR_MAX);
      inBar.setAttribute("y", 120 - hIn);
      inBar.setAttribute("height", hIn);
      outBar.setAttribute("y", 120 - hOut);
      outBar.setAttribute("height", hOut);
    }
    [maSlider, fInSlider, dInSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Mechanical Advantage) -- Ideal vs. Real Machines
  // ---------------------------------------------------------------
  function initMAEfficiency() {
    const svg = document.getElementById("maEffSvg");
    if (!svg) return;
    const outSlider = document.getElementById("maEffOutSlider");
    const outVal = document.getElementById("maEffOutVal");
    const effSlider = document.getElementById("maEffSlider");
    const effVal = document.getElementById("maEffPctVal");
    const inVal = document.getElementById("maEffInVal");
    const lostVal = document.getElementById("maEffLostVal");
    const idealVal = document.getElementById("maEffIdealVal");

    function redraw() {
      const wOut = parseFloat(outSlider.value);
      const eff = parseFloat(effSlider.value);
      const wIn = wOut / (eff / 100);
      const lost = wIn - wOut;

      outVal.textContent = wOut + " J";
      effVal.textContent = eff + "%";
      inVal.textContent = wIn.toFixed(1) + " J";
      lostVal.textContent = lost.toFixed(1) + " J";
      idealVal.textContent = wOut.toFixed(1) + " J";
    }
    outSlider.addEventListener("input", redraw);
    effSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Levers) -- Lever Class Explorer
  // ---------------------------------------------------------------
  function initLeverClass() {
    const svg = document.getElementById("levSvg");
    if (!svg) return;
    const fulcrum = document.getElementById("levFulcrum");
    const effortArrow = document.getElementById("levEffortArrow");
    const loadArrow = document.getElementById("levLoadArrow");
    const effortLabel = document.getElementById("levEffortLabel");
    const loadLabel = document.getElementById("levLoadLabel");
    const classButtons = Array.from(document.querySelectorAll("#levClassRow button"));
    const fLoadSlider = document.getElementById("levFLoadSlider");
    const fLoadVal = document.getElementById("levFLoadVal");
    const effortArmSlider = document.getElementById("levEffortArmSlider");
    const effortArmVal = document.getElementById("levEffortArmVal");
    const loadArmSlider = document.getElementById("levLoadArmSlider");
    const loadArmVal = document.getElementById("levLoadArmVal");
    const fEffortVal = document.getElementById("levFEffortVal");
    const maVal = document.getElementById("levMAVal");
    const tradeVal = document.getElementById("levTradeVal");

    const BEAM_Y = 80, PXPM = 40;
    let leverClass = "1";

    function redraw() {
      const fLoad = parseFloat(fLoadSlider.value);
      const effortArm = parseFloat(effortArmSlider.value);
      const loadArm = parseFloat(loadArmSlider.value);
      const fEffort = (fLoad * loadArm) / effortArm;
      const ma = effortArm / loadArm;

      fLoadVal.textContent = fLoad + " N";
      effortArmVal.textContent = effortArm.toFixed(1) + " m";
      loadArmVal.textContent = loadArm.toFixed(1) + " m";
      fEffortVal.textContent = fEffort.toFixed(1) + " N";
      maVal.textContent = ma.toFixed(2);
      tradeVal.textContent = ma >= 1 ? "Less force, more effort travel" : "More force, but faster/farther load movement";

      let fulcrumX, effortX, loadX;
      if (leverClass === "1") {
        fulcrumX = 230;
        loadX = clamp(230 - loadArm * PXPM, 45, 415);
        effortX = clamp(230 + effortArm * PXPM, 45, 415);
      } else if (leverClass === "2") {
        fulcrumX = 60;
        loadX = clamp(60 + loadArm * PXPM, 45, 415);
        effortX = clamp(60 + Math.max(effortArm, loadArm + 0.4) * PXPM, 45, 415);
      } else {
        fulcrumX = 60;
        effortX = clamp(60 + effortArm * PXPM, 45, 415);
        loadX = clamp(60 + Math.max(loadArm, effortArm + 0.4) * PXPM, 45, 415);
      }

      fulcrum.setAttribute("d", "M " + fulcrumX + "," + (BEAM_Y + 4) + " L " + (fulcrumX - 12) + "," + (BEAM_Y + 24) + " L " + (fulcrumX + 12) + "," + (BEAM_Y + 24) + " Z");
      effortArrow.setAttribute("x1", effortX); effortArrow.setAttribute("y1", BEAM_Y - 40);
      effortArrow.setAttribute("x2", effortX); effortArrow.setAttribute("y2", BEAM_Y - 4);
      loadArrow.setAttribute("x1", loadX); loadArrow.setAttribute("y1", BEAM_Y - 4);
      loadArrow.setAttribute("x2", loadX); loadArrow.setAttribute("y2", BEAM_Y - 40);
      effortLabel.setAttribute("x", effortX); effortLabel.setAttribute("y", BEAM_Y - 46);
      loadLabel.setAttribute("x", loadX); loadLabel.setAttribute("y", BEAM_Y - 46);
    }
    classButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        classButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        leverClass = btn.dataset.class;
        redraw();
      });
    });
    [fLoadSlider, effortArmSlider, loadArmSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Levers) -- Seesaw Balance
  // ---------------------------------------------------------------
  function initSeesaw() {
    const svg = document.getElementById("seesawSvg");
    if (!svg) return;
    const p1 = document.getElementById("seesawP1");
    const p2 = document.getElementById("seesawP2");
    const m1Slider = document.getElementById("seesawM1Slider");
    const m1Val = document.getElementById("seesawM1Val");
    const m2Slider = document.getElementById("seesawM2Slider");
    const m2Val = document.getElementById("seesawM2Val");
    const tVal = document.getElementById("seesawTVal");
    const verdictVal = document.getElementById("seesawVerdictVal");

    const PIVOT_X = 230, PXPM = 40, Y = 103;

    function recompute() {
      const m1 = parseFloat(m1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const x1 = parseFloat(p1.getAttribute("cx"));
      const x2 = parseFloat(p2.getAttribute("cx"));
      const arm1 = (x1 - PIVOT_X) / PXPM;
      const arm2 = (x2 - PIVOT_X) / PXPM;
      const torque1 = m1 * G * arm1;
      const torque2 = m2 * G * arm2;
      const net = torque1 + torque2;

      m1Val.textContent = m1 + " kg";
      m2Val.textContent = m2 + " kg";
      tVal.textContent = Math.abs(torque1).toFixed(0) + " / " + Math.abs(torque2).toFixed(0) + " N·m";
      verdictVal.textContent = Math.abs(net) < 15 ? "Balanced!" : net > 0 ? "Right side goes down" : "Left side goes down";
    }
    [m1Slider, m2Slider].forEach((s) => s.addEventListener("input", recompute));
    [p1, p2].forEach((p) => {
      makeDraggable(p, svg, (pt) => {
        p.setAttribute("cx", clamp(pt.x, 65, 395));
        recompute();
      });
    });
    recompute();
  }

  // ---------------------------------------------------------------
  // Widget 3 (Levers) -- Wrench Length Comparison
  // ---------------------------------------------------------------
  function initWrench() {
    const svg = document.getElementById("wrenchSvg");
    if (!svg) return;
    const handle = document.getElementById("wrenchHandle");
    const forceArrow = document.getElementById("wrenchForceArrow");
    const tauSlider = document.getElementById("wrenchTauSlider");
    const tauVal = document.getElementById("wrenchTauVal");
    const lSlider = document.getElementById("wrenchLSlider");
    const lVal = document.getElementById("wrenchLVal");
    const fVal = document.getElementById("wrenchFVal");

    const PIVOT_X = 40, PXPM = 300;

    function redraw() {
      const tau = parseFloat(tauSlider.value);
      const L = parseFloat(lSlider.value);
      const f = tau / L;

      tauVal.textContent = tau + " N·m";
      lVal.textContent = L.toFixed(2) + " m";
      fVal.textContent = f.toFixed(0) + " N";

      const handleX = PIVOT_X + L * PXPM;
      handle.setAttribute("x2", handleX);
      forceArrow.setAttribute("x1", handleX);
      forceArrow.setAttribute("y1", 20);
      forceArrow.setAttribute("x2", handleX);
      forceArrow.setAttribute("y2", clamp(50 - f * 0.12, 5, 45));
    }
    tauSlider.addEventListener("input", redraw);
    lSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Pulleys) -- Fixed vs. Movable Pulley
  // ---------------------------------------------------------------
  function initSinglePulley() {
    const svg = document.getElementById("pulSingleSvg");
    if (!svg) return;
    const wheel2 = document.getElementById("pulWheel2");
    const rope = document.getElementById("pulRope");
    const load = document.getElementById("pulLoad");
    const modeButtons = Array.from(document.querySelectorAll("#pulModeToggle button"));
    const loadSlider = document.getElementById("pulLoadSlider");
    const loadVal = document.getElementById("pulLoadVal");
    const hSlider = document.getElementById("pulHSlider");
    const hVal = document.getElementById("pulHVal");
    const fVal = document.getElementById("pulFVal");
    const ropeVal = document.getElementById("pulRopeVal");

    let mode = "fixed";

    function redraw() {
      const loadW = parseFloat(loadSlider.value);
      const h = parseFloat(hSlider.value);
      const ma = mode === "fixed" ? 1 : 2;
      const f = loadW / ma;
      const ropeLen = ma * h;

      loadVal.textContent = loadW + " N";
      hVal.textContent = h + " m";
      fVal.textContent = f.toFixed(0) + " N";
      ropeVal.textContent = ropeLen.toFixed(1) + " m";

      if (mode === "fixed") {
        wheel2.setAttribute("opacity", 0);
        load.setAttribute("y", 150);
        rope.setAttribute("d", "M 60,190 L 60,30 A 14 14 0 0 1 88,30 L 110,150");
      } else {
        wheel2.setAttribute("opacity", 1);
        wheel2.setAttribute("cy", 150);
        load.setAttribute("y", 165);
        rope.setAttribute("d", "M 60,10 L 60,150 A 14 14 0 0 0 88,150 L 88,30 A 14 14 0 0 1 116,30 L 150,120");
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
    loadSlider.addEventListener("input", redraw);
    hSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Pulleys) -- Block and Tackle Builder
  // ---------------------------------------------------------------
  function initBlockTackle() {
    const svg = document.getElementById("pulTackleSvg");
    if (!svg) return;
    const ropesGroup = document.getElementById("pulTackleRopes");
    const nSlider = document.getElementById("pulNSlider");
    const nVal = document.getElementById("pulNVal");
    const loadSlider = document.getElementById("pulTLoadSlider");
    const loadVal = document.getElementById("pulTLoadVal");
    const hSlider = document.getElementById("pulTHSlider");
    const hVal = document.getElementById("pulTHVal");
    const maVal = document.getElementById("pulTMAVal");
    const fVal = document.getElementById("pulTFVal");
    const ropeVal = document.getElementById("pulTRopeVal");

    function redraw() {
      const n = parseInt(nSlider.value, 10);
      const loadW = parseFloat(loadSlider.value);
      const h = parseFloat(hSlider.value);
      const f = loadW / n;
      const ropeLen = n * h;

      nVal.textContent = n;
      loadVal.textContent = loadW + " N";
      hVal.textContent = h + " m";
      maVal.textContent = n;
      fVal.textContent = f.toFixed(1) + " N";
      ropeVal.textContent = ropeLen.toFixed(1) + " m";

      ropesGroup.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const x = 90 + (120 * (i + 0.5)) / n;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x); line.setAttribute("y1", 20);
        line.setAttribute("x2", x); line.setAttribute("y2", 130);
        line.setAttribute("stroke", "var(--muted)");
        line.setAttribute("stroke-width", "2.5");
        ropesGroup.appendChild(line);
      }
    }
    nSlider.addEventListener("input", redraw);
    loadSlider.addEventListener("input", redraw);
    hSlider.addEventListener("input", redraw);
    redraw();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initMATradeoff();
    initMAEfficiency();
    initLeverClass();
    initSeesaw();
    initWrench();
    initSinglePulley();
    initBlockTackle();
    initRampCalc();
    initWedge();
    initScrewMechanics();
    initWheelAxle();
    initGearTrain();
    initBikeGears();
  });

  // ---------------------------------------------------------------
  // Widget 1 (Inclines/Wedges) -- Ramp Force Calculator
  // ---------------------------------------------------------------
  function initRampCalc() {
    const svg = document.getElementById("rampCalcSvg");
    if (!svg) return;
    const fill = document.getElementById("rampCalcFill");
    const block = document.getElementById("rampCalcBlock");
    const wSlider = document.getElementById("rampWSlider");
    const wVal = document.getElementById("rampWVal");
    const hSlider = document.getElementById("rampHSlider");
    const hVal = document.getElementById("rampHVal");
    const thetaSlider = document.getElementById("rampThetaSlider");
    const thetaVal = document.getElementById("rampThetaVal");
    const directFVal = document.getElementById("rampDirectFVal");
    const rampFVal = document.getElementById("rampRampFVal");
    const lenVal = document.getElementById("rampLenVal");
    const maVal = document.getElementById("rampMAVal");

    const BASE = { x: 20, y: 180 }, LEN_PX = 220;

    function redraw() {
      const w = parseFloat(wSlider.value);
      const h = parseFloat(hSlider.value);
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const rampF = w * Math.sin(theta);
      const rampLen = h / Math.sin(theta);
      const ma = 1 / Math.sin(theta);

      wVal.textContent = w + " N";
      hVal.textContent = h.toFixed(1) + " m";
      thetaVal.textContent = thetaDeg + "°";
      directFVal.textContent = w + " N";
      rampFVal.textContent = rampF.toFixed(0) + " N";
      lenVal.textContent = rampLen.toFixed(2) + " m";
      maVal.textContent = ma.toFixed(2);

      const run = LEN_PX * Math.cos(theta), rise = LEN_PX * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      fill.setAttribute("d", "M " + BASE.x + "," + BASE.y + " L " + top.x + "," + top.y + " L " + (BASE.x + run) + "," + BASE.y + " Z");
      const f = 0.5;
      block.setAttribute("transform", "translate(" + (BASE.x + f * run) + "," + (BASE.y - f * rise - 10) + ") rotate(" + -thetaDeg + ") translate(-13,-9)");
    }
    [wSlider, hSlider, thetaSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Inclines/Wedges) -- Wedge Splitting Force
  // ---------------------------------------------------------------
  function initWedge() {
    const svg = document.getElementById("wedgeSvg");
    if (!svg) return;
    const shape = document.getElementById("wedgeShape");
    const leftArrow = document.getElementById("wedgeLeftArrow");
    const rightArrow = document.getElementById("wedgeRightArrow");
    const fSlider = document.getElementById("wedgeFSlider");
    const fVal = document.getElementById("wedgeFVal");
    const phiSlider = document.getElementById("wedgePhiSlider");
    const phiVal = document.getElementById("wedgePhiVal");
    const outVal = document.getElementById("wedgeOutVal");
    const maVal = document.getElementById("wedgeMAVal");

    const APEX = { x: 110, y: 100 }, HEIGHT = 70;

    function redraw() {
      const f = parseFloat(fSlider.value);
      const phiDeg = parseFloat(phiSlider.value);
      const phi = (phiDeg * Math.PI) / 180;
      const out = f / Math.tan(phi);
      const ma = 1 / Math.tan(phi);

      fVal.textContent = f + " N";
      phiVal.textContent = phiDeg + "°";
      outVal.textContent = out.toFixed(0) + " N";
      maVal.textContent = ma.toFixed(2);

      const halfWidth = HEIGHT * Math.tan(phi);
      shape.setAttribute(
        "d",
        "M " + APEX.x + "," + APEX.y + " L " + (APEX.x - halfWidth) + "," + (APEX.y - HEIGHT) + " L " + (APEX.x + halfWidth) + "," + (APEX.y - HEIGHT) + " Z"
      );
      const armLen = clamp(out * 0.15, 15, 70);
      leftArrow.setAttribute("x1", APEX.x); leftArrow.setAttribute("y1", APEX.y - HEIGHT / 2);
      leftArrow.setAttribute("x2", APEX.x - armLen); leftArrow.setAttribute("y2", APEX.y - HEIGHT / 2);
      rightArrow.setAttribute("x1", APEX.x); rightArrow.setAttribute("y1", APEX.y - HEIGHT / 2);
      rightArrow.setAttribute("x2", APEX.x + armLen); rightArrow.setAttribute("y2", APEX.y - HEIGHT / 2);
    }
    fSlider.addEventListener("input", redraw);
    phiSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Screws/Wheel-Axle) -- Screw Mechanics Visualizer
  // ---------------------------------------------------------------
  function initScrewMechanics() {
    const svg = document.getElementById("screwSvg");
    if (!svg) return;
    const threadsGroup = document.getElementById("screwThreads");
    const handle = document.getElementById("screwHandle");
    const rampFill = document.getElementById("screwRampFill");
    const rSlider = document.getElementById("screwRSlider");
    const rVal = document.getElementById("screwRVal");
    const pSlider = document.getElementById("screwPSlider");
    const pVal = document.getElementById("screwPVal");
    const wSlider = document.getElementById("screwWSlider");
    const wVal = document.getElementById("screwWVal");
    const maVal = document.getElementById("screwMAVal");
    const fVal = document.getElementById("screwFVal");
    const angleVal = document.getElementById("screwAngleVal");

    const N_THREADS = 7;
    for (let i = 0; i < N_THREADS; i++) {
      const y = 30 + (i * 120) / (N_THREADS - 1);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", 50); line.setAttribute("y1", y);
      line.setAttribute("x2", 70); line.setAttribute("y2", y + 8);
      line.setAttribute("stroke", "var(--text-primary)");
      line.setAttribute("stroke-width", "2");
      threadsGroup.appendChild(line);
    }

    function redraw() {
      const r = parseFloat(rSlider.value);
      const p = parseFloat(pSlider.value);
      const w = parseFloat(wSlider.value);
      const ma = (2 * Math.PI * r) / p;
      const f = w / ma;
      const angle = (Math.atan(p / (2 * Math.PI * r)) * 180) / Math.PI;

      rVal.textContent = r.toFixed(2) + " m";
      pVal.textContent = p.toFixed(3) + " m";
      wVal.textContent = w + " N";
      maVal.textContent = ma.toFixed(1);
      fVal.textContent = f.toFixed(1) + " N";
      angleVal.textContent = angle.toFixed(2) + "°";

      handle.setAttribute("x2", 60 + clamp(r * 400, 40, 160));

      const rampLen = clamp(2 * Math.PI * r * 60, 100, 200);
      const rampH = clamp(p * 3000, 5, 100);
      rampFill.setAttribute("d", "M 230,130 L " + (230 + rampLen) + "," + (130 - rampH) + " L " + (230 + rampLen) + ",130 Z");
    }
    [rSlider, pSlider, wSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Screws/Wheel-Axle) -- Wheel-and-Axle Simulation
  // ---------------------------------------------------------------
  function initWheelAxle() {
    const svg = document.getElementById("wheelAxleSvg");
    if (!svg) return;
    const wheelOuter = document.getElementById("wheelOuter");
    const wheelAxle = document.getElementById("wheelAxle");
    const effortArrow = document.getElementById("wheelEffortArrow");
    const rSlider = document.getElementById("wheelRSlider");
    const rVal = document.getElementById("wheelRVal");
    const rAxleSlider = document.getElementById("wheelRAxleSlider");
    const rAxleVal = document.getElementById("wheelRAxleVal");
    const fSlider = document.getElementById("wheelFSlider");
    const fVal = document.getElementById("wheelFVal");
    const maVal = document.getElementById("wheelMAVal");
    const fOutVal = document.getElementById("wheelFOutVal");

    const CX = 110, CY = 110, PXPM = 300;

    function redraw() {
      const R = parseFloat(rSlider.value);
      const rAxle = parseFloat(rAxleSlider.value);
      const f = parseFloat(fSlider.value);
      const ma = R / rAxle;
      const fOut = f * ma;

      rVal.textContent = R.toFixed(2) + " m";
      rAxleVal.textContent = rAxle.toFixed(3) + " m";
      fVal.textContent = f + " N";
      maVal.textContent = ma.toFixed(2);
      fOutVal.textContent = fOut.toFixed(1) + " N";

      const rPx = clamp(R * PXPM, 30, 95);
      const rAxlePx = clamp(rAxle * PXPM, 8, rPx - 5);
      wheelOuter.setAttribute("r", rPx);
      wheelAxle.setAttribute("r", rAxlePx);
      effortArrow.setAttribute("x1", CX);
      effortArrow.setAttribute("y1", CY - rPx);
      effortArrow.setAttribute("x2", CX + clamp(f * 0.6, 10, 40));
      effortArrow.setAttribute("y2", CY - rPx);
    }
    [rSlider, rAxleSlider, fSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Gears) -- Gear Train and the Idler Puzzle
  // ---------------------------------------------------------------
  function initGearTrain() {
    const svg = document.getElementById("gearTrainSvg");
    if (!svg) return;
    const groupA = document.getElementById("gearA");
    const groupB = document.getElementById("gearB");
    const groupC = document.getElementById("gearC");
    const idlerBox = document.getElementById("gearIdlerBox");
    const naSlider = document.getElementById("gearNASlider");
    const naVal = document.getElementById("gearNAVal");
    const nbSlider = document.getElementById("gearNBSlider");
    const nbVal = document.getElementById("gearNBVal");
    const ncSlider = document.getElementById("gearNCSlider");
    const ncVal = document.getElementById("gearNCVal");
    const waSlider = document.getElementById("gearWASlider");
    const waVal = document.getElementById("gearWAVal");
    const wcVal = document.getElementById("gearWCVal");
    const ratioVal = document.getElementById("gearRatioVal");
    const dirVal = document.getElementById("gearDirVal");

    const SVGNS = "http://www.w3.org/2000/svg";
    function buildGear(group, cx, cy) {
      const circle = document.createElementNS(SVGNS, "circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy);
      circle.setAttribute("fill", "var(--chip)"); circle.setAttribute("stroke", "var(--text-primary)"); circle.setAttribute("stroke-width", "3");
      const spoke = document.createElementNS(SVGNS, "line");
      spoke.setAttribute("x1", cx); spoke.setAttribute("y1", cy);
      spoke.setAttribute("stroke", "#e34948"); spoke.setAttribute("stroke-width", "3");
      group.appendChild(circle);
      group.appendChild(spoke);
      return { circle, spoke, cx, cy };
    }
    const gA = buildGear(groupA, 80, 90);
    const gB = buildGear(groupB, 230, 90);
    const gC = buildGear(groupC, 380, 90);

    let state = { angleA: 0, angleB: 0, angleC: 0 };
    let last = performance.now();

    function current() {
      const NA = parseFloat(naSlider.value);
      const NB = parseFloat(nbSlider.value);
      const NC = parseFloat(ncSlider.value);
      const wA = parseFloat(waSlider.value);
      const idler = idlerBox.checked;
      const wB = (wA * NA) / NB;
      const wC = idler ? (wB * NB) / NC : (wA * NA) / NC;
      const signC = idler ? 1 : -1;
      return { NA, NB, NC, wA, wB, wC, idler, signC };
    }

    function redraw() {
      const { NA, NB, NC, wA, wC, idler, signC } = current();
      naVal.textContent = NA;
      nbVal.textContent = NB;
      ncVal.textContent = NC;
      waVal.textContent = wA + " RPM";
      wcVal.textContent = wC.toFixed(1) + " RPM";
      ratioVal.textContent = (NA / NC).toFixed(2);
      dirVal.textContent = signC > 0 ? "Same direction as A" : "Opposite direction from A";

      const rA = 8 + NA * 1.8, rB = 8 + NB * 1.8, rC = 8 + NC * 1.8;
      gA.circle.setAttribute("r", rA); gA.spoke.setAttribute("x2", gA.cx + rA);
      gB.circle.setAttribute("r", rB); gB.spoke.setAttribute("x2", gB.cx + rB);
      gC.circle.setAttribute("r", rC); gC.spoke.setAttribute("x2", gC.cx + rC);
      groupB.setAttribute("opacity", idler ? 1 : 0.15);
    }
    [idlerBox, naSlider, nbSlider, ncSlider, waSlider].forEach((el) => el.addEventListener("input", redraw));
    redraw();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { wA, wB, wC, signC } = current();
      state.angleA += wA * 6 * dt;
      state.angleB += -wB * 6 * dt;
      state.angleC += signC * wC * 6 * dt;
      groupA.setAttribute("transform", "rotate(" + state.angleA + " " + gA.cx + " " + gA.cy + ")");
      groupB.setAttribute("transform", "rotate(" + state.angleB + " " + gB.cx + " " + gB.cy + ")");
      groupC.setAttribute("transform", "rotate(" + state.angleC + " " + gC.cx + " " + gC.cy + ")");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------
  // Widget 2 (Gears) -- Bicycle Gears
  // ---------------------------------------------------------------
  function initBikeGears() {
    const svg = document.getElementById("bikeGearSvg");
    if (!svg) return;
    const chainring = document.getElementById("bikeChainring");
    const cog = document.getElementById("bikeCog");
    const frontSlider = document.getElementById("bikeFrontSlider");
    const frontVal = document.getElementById("bikeFrontVal");
    const rearSlider = document.getElementById("bikeRearSlider");
    const rearVal = document.getElementById("bikeRearVal");
    const cadenceSlider = document.getElementById("bikeCadenceSlider");
    const cadenceVal = document.getElementById("bikeCadenceVal");
    const ratioVal = document.getElementById("bikeRatioVal");
    const wheelRPMVal = document.getElementById("bikeWheelRPMVal");
    const speedVal = document.getElementById("bikeSpeedVal");
    const torqueVal = document.getElementById("bikeTorqueVal");

    const WHEEL_R = 0.34;

    function current() {
      const front = parseFloat(frontSlider.value);
      const rear = parseFloat(rearSlider.value);
      const cadence = parseFloat(cadenceSlider.value);
      const ratio = front / rear;
      const wheelRPM = cadence * ratio;
      const speed = ((wheelRPM * 2 * Math.PI * WHEEL_R) / 60);
      const torqueMult = rear / front;
      return { front, rear, cadence, ratio, wheelRPM, speed, torqueMult };
    }

    function redraw() {
      const { front, rear, cadence, ratio, wheelRPM, speed, torqueMult } = current();
      frontVal.textContent = front;
      rearVal.textContent = rear;
      cadenceVal.textContent = cadence + " RPM";
      ratioVal.textContent = ratio.toFixed(2);
      wheelRPMVal.textContent = wheelRPM.toFixed(1) + " RPM";
      speedVal.textContent = speed.toFixed(2) + " m/s";
      torqueVal.textContent = torqueMult.toFixed(2) + "×";
    }
    [frontSlider, rearSlider, cadenceSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();

    let angle = 0, last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const { cadence, wheelRPM } = current();
      angle += cadence * 6 * dt;
      chainring.setAttribute("stroke-dasharray", "6 4");
      chainring.setAttribute("stroke-dashoffset", -angle);
      cog.setAttribute("stroke-dasharray", "4 3");
      cog.setAttribute("stroke-dashoffset", -angle * (wheelRPM / Math.max(cadence, 0.01)));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
