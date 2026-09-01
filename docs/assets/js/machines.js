// Interactive widgets for docs/05-simple-machines/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
// Drop-in replacement: preserves all existing element IDs and coordinate
// conventions, so it works with the current index.html unchanged.
(function () {
  const G = 9.8;
  const NS = "http://www.w3.org/2000/svg";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function vbw(svg) { return (svg.viewBox && svg.viewBox.baseVal.width) || 300; }
  function vbh(svg) { return (svg.viewBox && svg.viewBox.baseVal.height) || 220; }

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

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // Inject a run/reset button just after an SVG (used by the animated widgets).
  function addRunButton(svg, label) {
    const host = svg.parentNode;
    if (!host) return null;
    const btn = document.createElement("button");
    btn.className = "mech-go";
    btn.textContent = label;
    svg.insertAdjacentElement("afterend", btn);
    return btn;
  }

  // ===============================================================
  // Widget 1 (Mechanical Advantage) -- Force-Distance Tradeoff Explorer
  // ===============================================================
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
      const fOut = ma * fIn, dOut = dIn / ma;
      const wIn = fIn * dIn, wOut = fOut * dOut;

      maVal.textContent = ma;
      boxLabel.textContent = "MA = " + ma;
      fInVal.textContent = fIn + " N";
      dInVal.textContent = dIn + " m";
      fOutVal.textContent = fOut.toFixed(0) + " N";
      dOutVal.textContent = dOut.toFixed(2) + " m";
      workVal.textContent = wIn.toFixed(0) + " / " + wOut.toFixed(0) + " J";

      const hIn = clamp((wIn / W_REF) * BAR_MAX, 2, BAR_MAX);
      const hOut = clamp((wOut / W_REF) * BAR_MAX, 2, BAR_MAX);
      inBar.setAttribute("y", 120 - hIn); inBar.setAttribute("height", hIn);
      outBar.setAttribute("y", 120 - hOut); outBar.setAttribute("height", hOut);
    }
    [maSlider, fInSlider, dInSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ===============================================================
  // Widget 2 (Mechanical Advantage) -- Ideal vs. Real Machines
  // ===============================================================
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

  // // ===============================================================
  // // Widget 1 (Levers) -- Lever Class Explorer
  // // ===============================================================
  // function initLeverClass() {
  //   const svg = document.getElementById("levSvg");
  //   if (!svg) return;
  //   const fulcrum = document.getElementById("levFulcrum");
  //   const effortArrow = document.getElementById("levEffortArrow");
  //   const loadArrow = document.getElementById("levLoadArrow");
  //   const effortLabel = document.getElementById("levEffortLabel");
  //   const loadLabel = document.getElementById("levLoadLabel");
  //   const classButtons = Array.from(document.querySelectorAll("#levClassRow button"));
  //   const fLoadSlider = document.getElementById("levFLoadSlider");
  //   const fLoadVal = document.getElementById("levFLoadVal");
  //   const effortArmSlider = document.getElementById("levEffortArmSlider");
  //   const effortArmVal = document.getElementById("levEffortArmVal");
  //   const loadArmSlider = document.getElementById("levLoadArmSlider");
  //   const loadArmVal = document.getElementById("levLoadArmVal");
  //   const fEffortVal = document.getElementById("levFEffortVal");
  //   const maVal = document.getElementById("levMAVal");
  //   const tradeVal = document.getElementById("levTradeVal");

  //   const BEAM_Y = 80, PXPM = 40;
  //   let leverClass = "1";

  //   function redraw() {
  //     const fLoad = parseFloat(fLoadSlider.value);
  //     let effortArm = parseFloat(effortArmSlider.value);
  //     let loadArm = parseFloat(loadArmSlider.value);
  //     const fEffort = (fLoad * loadArm) / effortArm;
  //     const ma = effortArm / loadArm;

  //     fLoadVal.textContent = fLoad + " N";
  //     effortArmVal.textContent = effortArm.toFixed(1) + " m";
  //     loadArmVal.textContent = loadArm.toFixed(1) + " m";
  //     fEffortVal.textContent = fEffort.toFixed(1) + " N";
  //     maVal.textContent = ma.toFixed(2);
  //     tradeVal.textContent = ma >= 1
  //       ? "Less force, more effort travel"
  //       : "More force, but faster/farther load movement";

  //     let fulcrumX, effortX, loadX;
  //     if (leverClass === "1") {
  //       fulcrumX = 230;
  //       loadX = clamp(230 - loadArm * PXPM, 45, 415);
  //       effortX = clamp(230 + effortArm * PXPM, 45, 415);
  //     } else if (leverClass === "2") {
  //       // Class 2: load sits BETWEEN fulcrum and effort  -> effortArm > loadArm.
  //       fulcrumX = 60;
  //       loadX = clamp(60 + loadArm * PXPM, 45, 415);
  //       effortX = clamp(60 + Math.max(effortArm, loadArm + 0.4) * PXPM, 45, 415);
  //     } else {
  //       // Class 3: effort BETWEEN fulcrum and load  -> loadArm > effortArm.
  //       fulcrumX = 60;
  //       effortX = clamp(60 + effortArm * PXPM, 45, 415);
  //       loadX = clamp(60 + Math.max(loadArm, effortArm + 0.4) * PXPM, 45, 415);
  //     }

  //     fulcrum.setAttribute("d",
  //       "M " + fulcrumX + "," + (BEAM_Y + 4) +
  //       " L " + (fulcrumX - 12) + "," + (BEAM_Y + 24) +
  //       " L " + (fulcrumX + 12) + "," + (BEAM_Y + 24) + " Z");
  //     effortArrow.setAttribute("x1", effortX); effortArrow.setAttribute("y1", BEAM_Y - 40);
  //     effortArrow.setAttribute("x2", effortX); effortArrow.setAttribute("y2", BEAM_Y - 4);
  //     loadArrow.setAttribute("x1", loadX); loadArrow.setAttribute("y1", BEAM_Y - 4);
  //     loadArrow.setAttribute("x2", loadX); loadArrow.setAttribute("y2", BEAM_Y - 40);
  //     effortLabel.setAttribute("x", effortX); effortLabel.setAttribute("y", BEAM_Y - 46);
  //     loadLabel.setAttribute("x", loadX); loadLabel.setAttribute("y", BEAM_Y - 46);
  //   }
  //   classButtons.forEach((btn) => {
  //     btn.addEventListener("click", () => {
  //       classButtons.forEach((b) => b.classList.remove("active"));
  //       btn.classList.add("active");
  //       leverClass = btn.dataset.class;
  //       redraw();
  //     });
  //   });
  //   [fLoadSlider, effortArmSlider, loadArmSlider].forEach((s) => s.addEventListener("input", redraw));
  //   redraw();
  // }

    // ===============================================================
  // Widget 1 (Levers) -- Lever Class Explorer (now animated)
  // ===============================================================
  function initLeverClass() {
    const svg = document.getElementById("levSvg");
    if (!svg) return;
    const fulcrum = document.getElementById("levFulcrum");
    const effortArrow = document.getElementById("levEffortArrow");
    const loadArrow = document.getElementById("levLoadArrow");
    const effortLabel = document.getElementById("levEffortLabel");
    const loadLabel = document.getElementById("levLoadLabel");
    const beam = document.getElementById("levBeam"); // optional beam line/rect
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
    if (!fLoadSlider || !effortArmSlider || !loadArmSlider) return;

    const BEAM_Y = 80, PXPM = 40;
    let leverClass = "1";
    let animating = false, rafId = null, press = 0; // press: 0..1 push fraction

    function geom() {
      const effortArm = parseFloat(effortArmSlider.value);
      const loadArm = parseFloat(loadArmSlider.value);
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
      return { fulcrumX, effortX, loadX, effortArm, loadArm };
    }

    function redraw() {
      const fLoad = parseFloat(fLoadSlider.value);
      const g = geom();
      const fEffort = (fLoad * g.loadArm) / g.effortArm;
      const ma = g.effortArm / g.loadArm;

      if (fLoadVal) fLoadVal.textContent = fLoad + " N";
      if (effortArmVal) effortArmVal.textContent = g.effortArm.toFixed(1) + " m";
      if (loadArmVal) loadArmVal.textContent = g.loadArm.toFixed(1) + " m";
      if (fEffortVal) fEffortVal.textContent = fEffort.toFixed(1) + " N";
      if (maVal) maVal.textContent = ma.toFixed(2);
      if (tradeVal) tradeVal.textContent = ma >= 1
        ? "Less force, more effort travel"
        : "More force, but faster/farther load movement";

      // Press animation: effort side dips by 'push', load side rises by push*MA
      // (equal-and-opposite rotation about the fulcrum => distance ratio = MA).
      const effortDip = press * 18;
      const loadRise = press * 18 * ma;

      if (fulcrum) fulcrum.setAttribute("d",
        "M " + g.fulcrumX + "," + (BEAM_Y + 4) +
        " L " + (g.fulcrumX - 12) + "," + (BEAM_Y + 24) +
        " L " + (g.fulcrumX + 12) + "," + (BEAM_Y + 24) + " Z");

      if (effortArrow) {
        effortArrow.setAttribute("x1", g.effortX); effortArrow.setAttribute("y1", BEAM_Y - 40 + effortDip);
        effortArrow.setAttribute("x2", g.effortX); effortArrow.setAttribute("y2", BEAM_Y - 4 + effortDip);
      }
      if (loadArrow) {
        loadArrow.setAttribute("x1", g.loadX); loadArrow.setAttribute("y1", BEAM_Y - 4 - loadRise);
        loadArrow.setAttribute("x2", g.loadX); loadArrow.setAttribute("y2", BEAM_Y - 40 - loadRise);
      }
      if (effortLabel) { effortLabel.setAttribute("x", g.effortX); effortLabel.setAttribute("y", BEAM_Y - 46 + effortDip); }
      if (loadLabel) { loadLabel.setAttribute("x", g.loadX); loadLabel.setAttribute("y", BEAM_Y - 46 - loadRise); }

      // Optional physical beam tilt if a #levBeam element exists.
      if (beam) {
        const tilt = clamp((loadRise - effortDip) * 0.05, -14, 14);
        beam.setAttribute("transform", "rotate(" + tilt + " " + g.fulcrumX + " " + BEAM_Y + ")");
      }
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

    const runBtn = addRunButton(svg, "Press the effort");
    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (animating) { if (rafId) cancelAnimationFrame(rafId); animating = false; press = 0; redraw(); return; }
        animating = true;
        const dur = 1.2, start = performance.now();
        function frame(now) {
          const t = clamp((now - start) / 1000 / dur, 0, 1);
          press = Math.sin(t * Math.PI); // push down then release
          redraw();
          if (t >= 1) { animating = false; press = 0; redraw(); return; }
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      });
    }
  }


  // ===============================================================
  // Widget 2 (Levers) -- Seesaw Balance
  // ===============================================================
  function initSeesaw() {
    const svg = document.getElementById("seesawSvg");
    if (!svg) return;
    const p1 = document.getElementById("seesawP1");
    const p2 = document.getElementById("seesawP2");
    const beam = document.getElementById("seesawBeam"); // optional
    const m1Slider = document.getElementById("seesawM1Slider");
    const m1Val = document.getElementById("seesawM1Val");
    const m2Slider = document.getElementById("seesawM2Slider");
    const m2Val = document.getElementById("seesawM2Val");
    const tVal = document.getElementById("seesawTVal");
    const verdictVal = document.getElementById("seesawVerdictVal");

    const PIVOT_X = 230, PXPM = 40;

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
      verdictVal.textContent = Math.abs(net) < 15
        ? "Balanced!" : net > 0 ? "Right side goes down" : "Left side goes down";

      // Optional visual tilt if a beam element exists.
      if (beam) {
        const tilt = clamp(net / 200, -12, 12);
        beam.setAttribute("transform", "rotate(" + tilt + " " + PIVOT_X + " 100)");
      }
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

  // ===============================================================
  // Widget 3 (Levers) -- Wrench Length Comparison
  // ===============================================================
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

  // ===============================================================
  // Widget 1 (Pulleys) -- Fixed vs. Movable Pulley  (rebuilt + animated)
  // ===============================================================
  function initSinglePulley() {
    const svg = document.getElementById("pulSingleSvg");
    if (!svg) return;
    const modeButtons = Array.from(document.querySelectorAll("#pulModeToggle button"));
    const loadSlider = document.getElementById("pulLoadSlider");
    const loadVal = document.getElementById("pulLoadVal");
    const hSlider = document.getElementById("pulHSlider");
    const hVal = document.getElementById("pulHVal");
    const fVal = document.getElementById("pulFVal");
    const ropeVal = document.getElementById("pulRopeVal");

    const W = vbw(svg), H = vbh(svg);
    const CEIL = 24, WHEEL_R = 15;
    const GROUND = H - 12;
    let mode = "fixed";
    let animating = false, rafId = null, raise = 0; // raise = px the load is currently lifted

    // Rebuild the whole diagram so geometry is guaranteed consistent.
    svg.innerHTML = "";
    const beam = el("rect", { x: 12, y: CEIL - 8, width: W - 24, height: 8, rx: 2, fill: "#9aa5b1" });
    const hatch = el("path", { stroke: "#c7ced6", "stroke-width": 1.5, d: "" });
    let hd = "";
    for (let x = 16; x < W - 16; x += 12) hd += "M" + x + "," + (CEIL - 8) + " L" + (x + 8) + "," + (CEIL - 16) + " ";
    hatch.setAttribute("d", hd);
    const wheel1 = el("circle", { id: "pulWheel1", r: WHEEL_R, fill: "#e8edf2", stroke: "#33415c", "stroke-width": 3 });
    const wheel2 = el("circle", { id: "pulWheel2", r: WHEEL_R, fill: "#e8edf2", stroke: "#33415c", "stroke-width": 3, opacity: 0 });
    const rope = el("path", { id: "pulRope", fill: "none", stroke: "#c94b4b", "stroke-width": 3 });
    const load = el("rect", { id: "pulLoad", width: 46, height: 34, rx: 4, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    const hand = el("circle", { id: "pulHand", r: 7, fill: "#f0a202", stroke: "#a06b00", "stroke-width": 2 });
    const handLbl = el("text", { id: "pulHandLbl", "font-size": 11, fill: "#555", "text-anchor": "middle" });
    svg.appendChild(beam); svg.appendChild(hatch);
    svg.appendChild(rope); svg.appendChild(wheel1); svg.appendChild(wheel2);
    svg.appendChild(load); svg.appendChild(hand); svg.appendChild(handLbl);

    const midX = W / 2;

    function draw() {
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
        // One ceiling-mounted wheel. Pull one side down, load rises the same.
        wheel2.setAttribute("opacity", 0);
        const wx = midX, wy = CEIL + WHEEL_R;
        wheel1.setAttribute("cx", wx); wheel1.setAttribute("cy", wy);
        const loadX = wx + WHEEL_R;
        const handX = wx - WHEEL_R;
        const loadTopRest = GROUND - 34 - 90;         // resting height of load top
        const loadTop = loadTopRest - raise;          // load rises with 'raise'
        load.setAttribute("x", loadX - 23);
        load.setAttribute("y", loadTop);
        const handRest = GROUND - 40;
        const handY = handRest + raise;               // hand pulls DOWN by 'raise'
        hand.setAttribute("cx", handX); hand.setAttribute("cy", handY);
        handLbl.setAttribute("x", handX); handLbl.setAttribute("y", handY + 20);
        handLbl.textContent = "pull " + f.toFixed(0) + " N";
        rope.setAttribute("d",
          "M " + handX + "," + handY +
          " L " + handX + "," + wy +
          " A " + WHEEL_R + " " + WHEEL_R + " 0 0 1 " + loadX + "," + wy +
          " L " + loadX + "," + loadTop);
      } else {
        // Movable pulley: rope anchored to ceiling (left), down under the
        // movable wheel that carries the load, back up to the hand (right).
        // Two strands support the load  ->  MA = 2, pull twice the distance.
        const anchorX = midX - 34;
        const handX = midX + 34;
        const wheelRest = GROUND - WHEEL_R - 70;
        const wy = wheelRest - raise;                 // movable wheel rises with load
        wheel1.setAttribute("opacity", 0);            // no fixed wheel here
        wheel2.setAttribute("opacity", 1);
        wheel2.setAttribute("cx", midX); wheel2.setAttribute("cy", wy);
        load.setAttribute("x", midX - 23);
        load.setAttribute("y", wy + WHEEL_R + 6);
        const handRest = GROUND - 40;
        const handY = handRest - 2 * raise;           // free end travels 2x
        hand.setAttribute("cx", handX); hand.setAttribute("cy", handY);
        handLbl.setAttribute("x", handX); handLbl.setAttribute("y", handY - 12);
        handLbl.textContent = "pull " + f.toFixed(0) + " N";
        rope.setAttribute("d",
          "M " + anchorX + "," + CEIL +
          " L " + (midX - WHEEL_R) + "," + wy +
          " A " + WHEEL_R + " " + WHEEL_R + " 0 0 0 " + (midX + WHEEL_R) + "," + wy +
          " L " + handX + "," + handY);
      }
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      raise = 0;
      draw();
    }

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        reset();
      });
    });
    loadSlider.addEventListener("input", draw);
    hSlider.addEventListener("input", draw);

    const runBtn = addRunButton(svg, "Lift the load");
    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (animating) { reset(); return; }
        raise = 0;
        animating = true;
        const target = 70, dur = 1.6;
        const start = performance.now();
        function frame(now) {
          const t = (now - start) / 1000;
          const f = clamp(t / dur, 0, 1);
          raise = target * (1 - Math.cos(f * Math.PI)) / 2; // ease in/out
          draw();
          if (f >= 1) { animating = false; return; }
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      });
    }
    reset();
  }

  // ===============================================================
  // Widget 2 (Pulleys) -- Block and Tackle Builder (animated lift)
  // ===============================================================
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
    const block = document.getElementById("pulTackleBlock"); // optional movable block

    let animating = false, rafId = null, raise = 0;

    function draw() {
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
      const topY = 20, botY = 130 - raise;
      for (let i = 0; i < n; i++) {
        const x = 90 + (120 * (i + 0.5)) / n;
        const line = el("line", {
          x1: x, y1: topY, x2: x, y2: botY,
          stroke: "var(--muted)", "stroke-width": 2.5,
        });
        ropesGroup.appendChild(line);
      }
      if (block) block.setAttribute("transform", "translate(0," + (-raise) + ")");
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; raise = 0; draw();
    }
    [nSlider, loadSlider, hSlider].forEach((s) => s.addEventListener("input", draw));

    const runBtn = addRunButton(svg, "Lift the load");
    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (animating) { reset(); return; }
        raise = 0; animating = true;
        const target = 60, dur = 1.6, start = performance.now();
        function frame(now) {
          const f = clamp((now - start) / 1000 / dur, 0, 1);
          raise = target * (1 - Math.cos(f * Math.PI)) / 2;
          draw();
          if (f >= 1) { animating = false; return; }
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      });
    }
    reset();
  }

  // ===============================================================
  // Widget 1 (Inclines/Wedges) -- Ramp Force Calculator (block slides up)
  // ===============================================================
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
    let animating = false, rafId = null, frac = 0.5;

    function geom() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      return { thetaDeg, theta, run: LEN_PX * Math.cos(theta), rise: LEN_PX * Math.sin(theta) };
    }

    function draw() {
      const w = parseFloat(wSlider.value);
      const h = parseFloat(hSlider.value);
      const { thetaDeg, theta, run, rise } = geom();
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

      const top = { x: BASE.x + run, y: BASE.y - rise };
      fill.setAttribute("d", "M " + BASE.x + "," + BASE.y + " L " + top.x + "," + top.y + " L " + (BASE.x + run) + "," + BASE.y + " Z");
      block.setAttribute("transform",
        "translate(" + (BASE.x + frac * run) + "," + (BASE.y - frac * rise - 10) + ") rotate(" + -thetaDeg + ") translate(-13,-9)");
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; frac = 0.5; draw();
    }
    [wSlider, hSlider, thetaSlider].forEach((s) => s.addEventListener("input", draw));

    const runBtn = addRunButton(svg, "Push up the ramp");
    if (runBtn) {
      runBtn.addEventListener("click", () => {
        if (animating) { reset(); return; }
        animating = true; const dur = 1.8, start = performance.now();
        function frame(now) {
          const f = clamp((now - start) / 1000 / dur, 0, 1);
          frac = 0.08 + 0.9 * f;
          draw();
          if (f >= 1) { animating = false; return; }
          rafId = requestAnimationFrame(frame);
        }
        rafId = requestAnimationFrame(frame);
      });
    }
    reset();
  }

  // ===============================================================
  // Widget 2 (Inclines/Wedges) -- Wedge Splitting Force
  // ===============================================================
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
      shape.setAttribute("d",
        "M " + APEX.x + "," + APEX.y +
        " L " + (APEX.x - halfWidth) + "," + (APEX.y - HEIGHT) +
        " L " + (APEX.x + halfWidth) + "," + (APEX.y - HEIGHT) + " Z");
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

  // ===============================================================
  // Widget 1 (Screws/Wheel-Axle) -- Screw Mechanics Visualizer
  // ===============================================================
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
    threadsGroup.innerHTML = "";
    for (let i = 0; i < N_THREADS; i++) {
      const y = 30 + (i * 120) / (N_THREADS - 1);
      threadsGroup.appendChild(el("line", {
        x1: 50, y1: y, x2: 70, y2: y + 8,
        stroke: "var(--text-primary)", "stroke-width": 2,
      }));
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

  // ===============================================================
  // Widget 2 (Screws/Wheel-Axle) -- Wheel-and-Axle (turns when driven)
  // ===============================================================
  function initWheelAxle() {
    const svg = document.getElementById("wheelAxleSvg");
    if (!svg) return;
    const wheelOuter = document.getElementById("wheelOuter");
    const wheelAxle = document.getElementById("wheelAxle");
    const effortArrow = document.getElementById("wheelEffortArrow");
    const spoke = document.getElementById("wheelSpoke"); // optional
    const rSlider = document.getElementById("wheelRSlider");
    const rVal = document.getElementById("wheelRVal");
    const rAxleSlider = document.getElementById("wheelRAxleSlider");
    const rAxleVal = document.getElementById("wheelRAxleVal");
    const fSlider = document.getElementById("wheelFSlider");
    const fVal = document.getElementById("wheelFVal");
    const maVal = document.getElementById("wheelMAVal");
    const fOutVal = document.getElementById("wheelFOutVal");

    const CX = 110, CY = 110, PXPM = 300;
    let angle = 0, spinning = false, rafId = null, last = performance.now();

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
      if (spoke) {
        spoke.setAttribute("x1", CX); spoke.setAttribute("y1", CY);
        spoke.setAttribute("x2", CX + rPx); spoke.setAttribute("y2", CY);
      }
    }
    [rSlider, rAxleSlider, fSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();

    const runBtn = addRunButton(svg, "Turn the wheel");
    if (runBtn && spoke) {
      runBtn.addEventListener("click", () => {
        if (spinning) { spinning = false; runBtn.textContent = "Turn the wheel"; return; }
        spinning = true; runBtn.textContent = "Stop";
        last = performance.now();
        function tick(now) {
          if (!spinning) return;
          const dt = Math.min(0.05, (now - last) / 1000); last = now;
          angle += 60 * dt; // deg/s
          const g = svg;
          spoke.setAttribute("transform", "rotate(" + angle + " " + CX + " " + CY + ")");
          rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);
      });
    }
  }

  // // ===============================================================
  // // Widget 1 (Gears) -- Gear Train and the Idler Puzzle
  // // ===============================================================
  // function initGearTrain() {
  //   const svg = document.getElementById("gearTrainSvg");
  //   if (!svg) return;
  //   const groupA = document.getElementById("gearA");
  //   const groupB = document.getElementById("gearB");
  //   const groupC = document.getElementById("gearC");
  //   const idlerBox = document.getElementById("gearIdlerBox");
  //   const naSlider = document.getElementById("gearNASlider");
  //   const naVal = document.getElementById("gearNAVal");
  //   const nbSlider = document.getElementById("gearNBSlider");
  //   const nbVal = document.getElementById("gearNBVal");
  //   const ncSlider = document.getElementById("gearNCSlider");
  //   const ncVal = document.getElementById("gearNCVal");
  //   const waSlider = document.getElementById("gearWASlider");
  //   const waVal = document.getElementById("gearWAVal");
  //   const wcVal = document.getElementById("gearWCVal");
  //   const ratioVal = document.getElementById("gearRatioVal");
  //   const dirVal = document.getElementById("gearDirVal");

  //   function buildGear(group, cx, cy) {
  //     group.innerHTML = "";
  //     const circle = el("circle", { cx, cy, fill: "var(--chip)", stroke: "var(--text-primary)", "stroke-width": 3 });
  //     const sp = el("line", { x1: cx, y1: cy, stroke: "#e34948", "stroke-width": 3 });
  //     group.appendChild(circle); group.appendChild(sp);
  //     return { circle, spoke: sp, cx, cy };
  //   }
  //   const gA = buildGear(groupA, 80, 90);
  //   const gB = buildGear(groupB, 230, 90);
  //   const gC = buildGear(groupC, 380, 90);

  //   let state = { angleA: 0, angleB: 0, angleC: 0 };
  //   let last = performance.now(), rafId = null;

  //   function current() {
  //     const NA = parseFloat(naSlider.value);
  //     const NB = parseFloat(nbSlider.value);
  //     const NC = parseFloat(ncSlider.value);
  //     const wA = parseFloat(waSlider.value);
  //     const idler = idlerBox.checked;
  //     const wB = (wA * NA) / NB;
  //     const wC = idler ? (wB * NB) / NC : (wA * NA) / NC;
  //     const signC = idler ? 1 : -1; // idler -> A & C same direction
  //     return { NA, NB, NC, wA, wB, wC, idler, signC };
  //   }

  //   function redraw() {
  //     const { NA, NB, NC, wA, wC, idler, signC } = current();
  //     naVal.textContent = NA;
  //     nbVal.textContent = NB;
  //     ncVal.textContent = NC;
  //     waVal.textContent = wA + " RPM";
  //     wcVal.textContent = wC.toFixed(1) + " RPM";
  //     ratioVal.textContent = (NA / NC).toFixed(2);
  //     dirVal.textContent = signC > 0 ? "Same direction as A" : "Opposite direction from A";

  //     const rA = 8 + NA * 1.8, rB = 8 + NB * 1.8, rC = 8 + NC * 1.8;

  //     // When the idler is present, B sits between A and C.
  //     // When removed, slide A and C together so they mesh directly.
  //     let cxA = 80, cxC = 380;
  //     if (!idler) { cxA = 175; cxC = 175 + rA + rC + 2; }
  //     gA.cx = cxA; gC.cx = cxC;
  //     gA.circle.setAttribute("cx", cxA); gA.spoke.setAttribute("x1", cxA);
  //     gC.circle.setAttribute("cx", cxC); gC.spoke.setAttribute("x1", cxC);

  //     gA.circle.setAttribute("r", rA); gA.spoke.setAttribute("x2", cxA + rA);
  //     gB.circle.setAttribute("r", rB); gB.spoke.setAttribute("x2", gB.cx + rB);
  //     gC.circle.setAttribute("r", rC); gC.spoke.setAttribute("x2", cxC + rC);
  //     groupB.setAttribute("opacity", idler ? 1 : 0);
  //   }
  //   [idlerBox, naSlider, nbSlider, ncSlider, waSlider].forEach((e) => e.addEventListener("input", redraw));
  //   redraw();

  //   function tick(now) {
  //     const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  //     last = now;
  //     const { wA, wB, wC, signC } = current();
  //     state.angleA += wA * 6 * dt;
  //     state.angleB += -wB * 6 * dt;
  //     state.angleC += signC * wC * 6 * dt;
  //     groupA.setAttribute("transform", "rotate(" + state.angleA + " " + gA.cx + " " + gA.cy + ")");
  //     groupB.setAttribute("transform", "rotate(" + state.angleB + " " + gB.cx + " " + gB.cy + ")");
  //     groupC.setAttribute("transform", "rotate(" + state.angleC + " " + gC.cx + " " + gC.cy + ")");
  //     rafId = requestAnimationFrame(tick);
  //   }
  //   rafId = requestAnimationFrame(tick);
  // }
    // ===============================================================
  // Widget 1 (Gears) -- Gear Train with meshing TEETH (idler puzzle)
  // ===============================================================
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
    if (!groupA || !groupB || !groupC) return;

    const W = vbw(svg), CY = 90;
    const MODULE = 1.5;   // pitch-radius px per tooth (same module => teeth mesh)
    const TOOTH_H = 4.5;  // addendum / dedendum height

    // Trapezoidal teeth around the origin; a tooth TOP is centred on angle 0.
    function teethPath(N, pitchR) {
      const rTop = pitchR + TOOTH_H, rBot = pitchR - TOOTH_H;
      const step = (2 * Math.PI) / N;
      let d = "";
      for (let i = 0; i < N; i++) {
        const a = i * step;
        const pts = [
          [a - step * 0.19, rBot],
          [a - step * 0.13, rTop],
          [a + step * 0.13, rTop],
          [a + step * 0.19, rBot],
        ];
        pts.forEach(([ang, r], k) => {
          const x = (r * Math.cos(ang)).toFixed(2), y = (r * Math.sin(ang)).toFixed(2);
          d += (i === 0 && k === 0 ? "M" : "L") + x + "," + y + " ";
        });
      }
      return d + "Z";
    }

    function buildGear(group, color) {
      group.innerHTML = "";
      const body = el("path", { fill: "var(--chip)", stroke: "var(--text-primary)", "stroke-width": 2, "vector-effect": "non-scaling-stroke" });
      const hub = el("circle", { r: 5, fill: "var(--text-primary)" });
      const mark = el("line", { x1: 0, y1: 0, stroke: color, "stroke-width": 3 });
      group.appendChild(body); group.appendChild(hub); group.appendChild(mark);
      return { body, hub, mark };
    }
    const gA = buildGear(groupA, "#e34948");
    const gB = buildGear(groupB, "#2a78d6");
    const gC = buildGear(groupC, "#3a9d5a");

    let s = 0, last = performance.now(), rafId = null, geo = null;

    function current() {
      const NA = parseFloat(naSlider.value);
      const NB = parseFloat(nbSlider.value);
      const NC = parseFloat(ncSlider.value);
      const wA = parseFloat(waSlider.value);
      const idler = idlerBox.checked;
      const wB = (wA * NA) / NB;
      const wC = idler ? (wB * NB) / NC : (wA * NA) / NC;
      const signC = idler ? 1 : -1;   // idler -> A & C same direction
      return { NA, NB, NC, wA, wB, wC, idler, signC };
    }

    function layout(c) {
      const rA = c.NA * MODULE, rB = c.NB * MODULE, rC = c.NC * MODULE;
      const m = 14;
      let xA, xB, xC;
      if (c.idler) {
        xA = m + rA; xB = xA + rA + rB; xC = xB + rB + rC;
      } else {
        xA = m + rA; xB = -999; xC = xA + rA + rC; // A meshes C directly
      }
      const totalRight = xC + rC + m;
      const off = Math.max(0, (W - totalRight) / 2);
      return { rA, rB, rC, xA: xA + off, xB: xB + off, xC: xC + off };
    }

    function redraw() {
      const c = current();
      naVal.textContent = c.NA;
      nbVal.textContent = c.NB;
      ncVal.textContent = c.NC;
      waVal.textContent = c.wA + " RPM";
      wcVal.textContent = c.wC.toFixed(1) + " RPM";
      ratioVal.textContent = (c.NA / c.NC).toFixed(2);
      dirVal.textContent = c.signC > 0 ? "Same direction as A" : "Opposite direction from A";

      geo = layout(c);
      gA.body.setAttribute("d", teethPath(c.NA, geo.rA));
      gB.body.setAttribute("d", teethPath(c.NB, geo.rB));
      gC.body.setAttribute("d", teethPath(c.NC, geo.rC));
      gA.mark.setAttribute("x2", geo.rA);
      gB.mark.setAttribute("x2", geo.rB);
      gC.mark.setAttribute("x2", geo.rC);
      groupB.setAttribute("opacity", c.idler ? 1 : 0);
    }
    [idlerBox, naSlider, nbSlider, ncSlider, waSlider].forEach((e) => e && e.addEventListener("input", redraw));
    redraw();

    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const c = current();
      if (!geo) { rafId = requestAnimationFrame(tick); return; }

      // s = teeth that have rolled through the mesh (common to the whole train,
      // because meshing gears pass teeth at the same rate). Each gear's angle
      // is then s*(360/N); driven gears get a half-tooth offset so a tooth
      // drops into the neighbour's gap.
      s += (c.wA / 60) * c.NA * dt;
      const angA = s * (360 / c.NA);
      const angB = -s * (360 / c.NB) + 180 / c.NB;
      const angC = c.signC * s * (360 / c.NC) + 180 / c.NC;

      groupA.setAttribute("transform", "translate(" + geo.xA + "," + CY + ") rotate(" + angA + ")");
      groupB.setAttribute("transform", "translate(" + geo.xB + "," + CY + ") rotate(" + angB + ")");
      groupC.setAttribute("transform", "translate(" + geo.xC + "," + CY + ") rotate(" + angC + ")");
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }


  // ===============================================================
  // Widget 2 (Gears) -- Bicycle Gears
  // ===============================================================
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
      const speed = (wheelRPM * 2 * Math.PI * WHEEL_R) / 60;
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

  // ===============================================================
  // NEW Widget (Pulleys) -- Atwood's Machine  [host: #atwoodHost]
  // Two masses over an ideal pulley; a = (m2-m1)g/(m1+m2), T = 2 m1 m2 g/(m1+m2).
  // Self-builds its DOM; no-ops if the host div is absent.
  // ===============================================================
  function initAtwood() {
    const host = document.getElementById("atwoodHost");
    if (!host) return;
    host.classList.add("mech-widget");
    host.innerHTML =
      '<div class="mech-controls">' +
      '  <label>Mass 1 (left) <input type="range" min="0.5" max="10" step="0.5" value="3" data-r="m1"> <span data-o="m1"></span> kg</label>' +
      '  <label>Mass 2 (right) <input type="range" min="0.5" max="10" step="0.5" value="5" data-r="m2"> <span data-o="m2"></span> kg</label>' +
      '  <button class="mech-go" data-go>Release</button>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 300 220", class: "mech-svg" });
    svg.appendChild(el("rect", { x: 20, y: 14, width: 260, height: 8, rx: 2, fill: "#9aa5b1" }));
    const wheel = el("circle", { cx: 150, cy: 40, r: 16, fill: "#e8edf2", stroke: "#33415c", "stroke-width": 3 });
    const rope = el("path", { fill: "none", stroke: "#c94b4b", "stroke-width": 3 });
    const box1 = el("rect", { width: 40, height: 30, rx: 4, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    const box2 = el("rect", { width: 40, height: 30, rx: 4, fill: "#c94b4b", stroke: "#8f1c1c", "stroke-width": 2 });
    svg.appendChild(rope); svg.appendChild(wheel); svg.appendChild(box1); svg.appendChild(box2);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "mech-readouts";
    readouts.innerHTML =
      '<div>Acceleration: <b data-o="a">—</b></div>' +
      '<div>Rope tension: <b data-o="t">—</b></div>' +
      '<div class="mech-verdict" data-o="verdict">—</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const m1S = q('[data-r="m1"]'), m2S = q('[data-r="m2"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const LX = 90, RX = 210, TOP = 40, R = 16, REST = 90, RANGE = 70;
    let animating = false, rafId = null, y1 = REST; // y1 = drop of mass 1 from rest

    function state() {
      const m1 = parseFloat(m1S.value), m2 = parseFloat(m2S.value);
      const a = ((m2 - m1) * G) / (m1 + m2);   // + means mass 2 falls
      const T = (2 * m1 * m2 * G) / (m1 + m2);
      return { m1, m2, a, T };
    }

    function draw(disp) {
      // disp > 0  => mass 2 descends, mass 1 rises
      const s = state();
      out("m1").textContent = s.m1;
      out("m2").textContent = s.m2;
      out("a").textContent = s.a.toFixed(2) + " m/s²";
      out("t").textContent = s.T.toFixed(1) + " N";
      out("verdict").textContent =
        Math.abs(s.m1 - s.m2) < 1e-6 ? "Balanced — no acceleration"
          : (s.m2 > s.m1 ? "Heavier mass 2 accelerates down" : "Heavier mass 1 accelerates down");
      const y1c = REST - disp, y2c = REST + disp;
      box1.setAttribute("x", LX - 20); box1.setAttribute("y", y1c);
      box2.setAttribute("x", RX - 20); box2.setAttribute("y", y2c);
      rope.setAttribute("d",
        "M " + LX + "," + y1c +
        " L " + LX + "," + TOP +
        " A " + R + " " + R + " 0 0 1 " + RX + "," + TOP +
        " L " + RX + "," + y2c);
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false; draw(0);
    }
    [m1S, m2S].forEach((s) => s.addEventListener("input", reset));
    reset();

    q("[data-go]").addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const s = state();
      if (Math.abs(s.a) < 1e-4) return;
      animating = true;
      const dir = Math.sign(s.a);          // +1: mass2 down
      const start = performance.now();
      const scale = 12;                    // px per metre (visual)
      function frame(now) {
        const t = (now - start) / 1000;
        let disp = dir * 0.5 * Math.abs(s.a) * t * t * scale;
        if (Math.abs(disp) >= RANGE) { disp = dir * RANGE; draw(disp); animating = false; return; }
        draw(disp);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // NEW Widget (Pulleys) -- Movable-Pulley Distance Puzzle
  // [host: #pulleyDistanceHost]  (guide §9)
  // Pull the rope; the load rises only half as far -> work is conserved.
  // ===============================================================
  function initPulleyDistancePuzzle() {
    const host = document.getElementById("pulleyDistanceHost");
    if (!host) return;
    host.classList.add("mech-widget");
    host.innerHTML =
      '<div class="mech-controls">' +
      '  <label>Rope pulled <input type="range" min="0" max="1" step="0.01" value="0" data-r="pull"> <span data-o="pull"></span> m</label>' +
      '  <label>Load weight <input type="range" min="20" max="200" step="10" value="100" data-r="w"> <span data-o="w"></span> N</label>' +
      '</div>';

    const svg = el("svg", { viewBox: "0 0 300 220", class: "mech-svg" });
    svg.appendChild(el("rect", { x: 20, y: 14, width: 260, height: 8, rx: 2, fill: "#9aa5b1" }));
    const wheel = el("circle", { r: 15, fill: "#e8edf2", stroke: "#33415c", "stroke-width": 3 });
    const rope = el("path", { fill: "none", stroke: "#c94b4b", "stroke-width": 3 });
    const load = el("rect", { width: 46, height: 34, rx: 4, fill: "#2a78d6", stroke: "#1c4f8f", "stroke-width": 2 });
    const hand = el("circle", { r: 7, fill: "#f0a202", stroke: "#a06b00", "stroke-width": 2 });
    svg.appendChild(rope); svg.appendChild(wheel); svg.appendChild(load); svg.appendChild(hand);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "mech-readouts";
    readouts.innerHTML =
      '<div>Rope pulled: <b data-o="in">—</b></div>' +
      '<div>Load rises: <b data-o="rise">—</b></div>' +
      '<div>Effort force: <b data-o="f">—</b></div>' +
      '<div>Input work: <b data-o="win">—</b></div>' +
      '<div>Output work: <b data-o="wout">—</b></div>' +
      '<div class="mech-verdict" data-o="verdict">Work in = work out (ideal machine)</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const pullS = q('[data-r="pull"]'), wS = q('[data-r="w"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const MID = 150, CEIL = 22, anchorX = MID - 34, handX = MID + 34;
    const REST = 150, MAXPULL_PX = 60;

    function redraw() {
      const pull = parseFloat(pullS.value);     // 0..1 m
      const w = parseFloat(wS.value);
      const rise = pull / 2;                     // movable pulley: half distance
      const f = w / 2;                           // half force
      const win = f * pull, wout = w * rise;

      out("pull").textContent = pull.toFixed(2);
      out("w").textContent = w;
      out("in").textContent = pull.toFixed(2) + " m";
      out("rise").textContent = rise.toFixed(2) + " m";
      out("f").textContent = f.toFixed(0) + " N";
      out("win").textContent = win.toFixed(1) + " J";
      out("wout").textContent = wout.toFixed(1) + " J";

      const pullPx = pull * MAXPULL_PX;
      const wheelY = REST - pullPx / 2;          // load rises half
      const handY = (REST - 40) - pullPx;        // free end travels full
      wheel.setAttribute("cx", MID); wheel.setAttribute("cy", wheelY);
      load.setAttribute("x", MID - 23); load.setAttribute("y", wheelY + 15 + 6);
      hand.setAttribute("cx", handX); hand.setAttribute("cy", handY);
      rope.setAttribute("d",
        "M " + anchorX + "," + CEIL +
        " L " + (MID - 15) + "," + wheelY +
        " A 15 15 0 0 0 " + (MID + 15) + "," + wheelY +
        " L " + handX + "," + handY);
    }
    [pullS, wS].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
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
    // Optional new widgets (safe no-op until their host div is added):
    initAtwood();
    initPulleyDistancePuzzle();
  });
})();
