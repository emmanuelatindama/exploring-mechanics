// Interactive widgets for docs/00-toolkit/index.html. Five independent
// mini-apps (scaling, vectors, coordinates, reference frames, free-body
// diagrams), each self-contained. No dependencies -- plain SVG + pointer
// events.
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    return el;
  }

  function clientToSvg(svg, evt) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const sx = vb.width / rect.width;
    const sy = vb.height / rect.height;
    return { x: (evt.clientX - rect.left) * sx + vb.x, y: (evt.clientY - rect.top) * sy + vb.y };
  }

  function buildCartesianGrid(group, size, step) {
    for (let i = 0; i <= size; i += step) {
      group.appendChild(svgEl("line", { x1: i, y1: 0, x2: i, y2: size, class: "svg-grid" }));
      group.appendChild(svgEl("line", { x1: 0, y1: i, x2: size, y2: i, class: "svg-grid" }));
    }
  }

  function buildPolarGrid(group, cx, cy, maxR, ringStep) {
    for (let r = ringStep; r <= maxR; r += ringStep) {
      group.appendChild(svgEl("circle", { cx, cy, r, class: "svg-grid", fill: "none" }));
    }
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      group.appendChild(
        svgEl("line", {
          x1: cx, y1: cy,
          x2: cx + maxR * Math.cos(rad), y2: cy - maxR * Math.sin(rad),
          class: "svg-grid",
        })
      );
    }
  }

  function arcPath(cx, cy, r, thetaDeg) {
    const toPt = (deg) => {
      const rad = (deg * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
    };
    const p0 = toPt(0);
    const p1 = toPt(thetaDeg);
    const largeArc = Math.abs(thetaDeg) > 180 ? 1 : 0;
    const sweep = thetaDeg >= 0 ? 0 : 1;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p1.x} ${p1.y}`;
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

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // -- shared world<->screen mapping for the 400x400 widgets ------------
  const SCALE = 20, ORIGIN = 200, LIMIT = 9.4;
  const toScreen = (x, y) => ({ sx: ORIGIN + x * SCALE, sy: ORIGIN - y * SCALE });
  const toWorld = (sx, sy) => ({ x: (sx - ORIGIN) / SCALE, y: (ORIGIN - sy) / SCALE });

  /* ===================== 1. SCALING EXPLORER ===================== */
  function initScaling() {
    const slider = document.getElementById("scaleSlider");
    const kVal = document.getElementById("kVal");
    const cubeBig = document.getElementById("cubeBig");
    const cubeBigLabel = document.getElementById("cubeBigLabel");
    const barL = document.getElementById("barL"), barA = document.getElementById("barA"), barV = document.getElementById("barV");
    const barLVal = document.getElementById("barLVal"), barAVal = document.getElementById("barAVal"), barVVal = document.getElementById("barVVal");
    const rL = document.getElementById("rL"), rA = document.getElementById("rA"), rV = document.getElementById("rV");
    const sentence = document.getElementById("scaleSentence");
    if (!slider) return;

    const BASE = 40, BOTTOM = 230, LEFT = 110, PXPER = 150 / 27;

    function render() {
      const k = parseFloat(slider.value);
      kVal.textContent = k.toFixed(2) + "×";

      const side = BASE * k;
      cubeBig.setAttribute("width", side);
      cubeBig.setAttribute("height", side);
      cubeBig.setAttribute("y", BOTTOM - side);
      cubeBigLabel.setAttribute("x", LEFT + side / 2);
      cubeBigLabel.setAttribute("y", Math.max(15, BOTTOM - side - 5));
      cubeBigLabel.textContent = "side = " + k.toFixed(2);

      const k2 = k * k, k3 = k * k * k;
      const hL = k * PXPER, hA = k2 * PXPER, hV = k3 * PXPER;
      barL.setAttribute("y", 230 - hL); barL.setAttribute("height", hL);
      barA.setAttribute("y", 230 - hA); barA.setAttribute("height", hA);
      barV.setAttribute("y", 230 - hV); barV.setAttribute("height", hV);
      barLVal.setAttribute("y", Math.max(15, 230 - hL - 8));
      barAVal.setAttribute("y", Math.max(15, 230 - hA - 8));
      barVVal.setAttribute("y", Math.max(15, 230 - hV - 8));
      barLVal.textContent = "×" + k.toFixed(2);
      barAVal.textContent = "×" + k2.toFixed(2);
      barVVal.textContent = "×" + k3.toFixed(2);

      rL.textContent = "k = " + k.toFixed(2);
      rA.textContent = "k² = " + k2.toFixed(2);
      rV.textContent = "k³ = " + k3.toFixed(2);

      if (Math.abs(k - 1) < 0.01) {
        sentence.textContent = "At k = 1.0, both objects are identical: everything scales together.";
      } else if (k > 1) {
        sentence.innerHTML =
          `At k = ${k.toFixed(2)}, length grows ${k.toFixed(2)}×, surface area grows ${k2.toFixed(2)}×, ` +
          `but volume (so weight, for the same density) grows ${k3.toFixed(2)}×. The bones and muscles that ` +
          `support that weight scale roughly with cross-sectional <strong>area</strong>, not volume — which is ` +
          `why elephants have proportionally much thicker legs than mice, and why you can't just scale up a mouse.`;
      } else {
        sentence.innerHTML =
          `At k = ${k.toFixed(2)}, shrinking the object lets surface-area effects (friction, drag, heat loss) ` +
          `dominate over volume effects (weight, momentum) — this is why insects can survive falls that would ` +
          `kill a mammal, and why small robots can be relatively far stronger for their weight.`;
      }
    }

    slider.addEventListener("input", render);
    render();
  }

  /* ===================== 2. VECTOR PLAYGROUND ===================== */
  function initVectors() {
    const svg = document.getElementById("vecSvg");
    if (!svg) return;
    const grid = document.getElementById("vecGrid");
    buildCartesianGrid(grid, 400, 40);

    const handleA = document.getElementById("handleA");
    const vecA = document.getElementById("vecA");
    const projAx = document.getElementById("projAx");
    const projAy = document.getElementById("projAy");
    const toggleB = document.getElementById("toggleB");
    const groupB = document.getElementById("groupB");
    const handleB = document.getElementById("handleB");
    const vecB = document.getElementById("vecB");
    const vecR = document.getElementById("vecR");
    const lineTailAtoR = document.getElementById("lineTailAtoR");
    const rowB = document.getElementById("rowB"), rowR = document.getElementById("rowR");
    const aVal = document.getElementById("aVal"), aMag = document.getElementById("aMag");
    const bVal = document.getElementById("bVal"), rVal = document.getElementById("rVal");
    const resetBtn = document.getElementById("resetVec");

    let A = { x: 4, y: 4 };
    let B = { x: 2, y: 3 };

    function fmt(v) {
      const mag = Math.hypot(v.x, v.y);
      let ang = (Math.atan2(v.y, v.x) * 180) / Math.PI;
      if (ang < 0) ang += 360;
      return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})  |  ${mag.toFixed(1)} @ ${ang.toFixed(0)}°`;
    }

    function render() {
      const sA = toScreen(A.x, A.y);
      vecA.setAttribute("x2", sA.sx); vecA.setAttribute("y2", sA.sy);
      handleA.setAttribute("cx", sA.sx); handleA.setAttribute("cy", sA.sy);
      projAx.setAttribute("x1", sA.sx); projAx.setAttribute("y1", sA.sy);
      projAx.setAttribute("x2", sA.sx); projAx.setAttribute("y2", 200);
      projAy.setAttribute("x1", sA.sx); projAy.setAttribute("y1", sA.sy);
      projAy.setAttribute("x2", 200); projAy.setAttribute("y2", sA.sy);
      aVal.textContent = fmt(A);

      if (toggleB.checked) {
        groupB.style.display = "";
        rowB.style.display = ""; rowR.style.display = "";
        const sB = toScreen(B.x, B.y);
        vecB.setAttribute("x2", sB.sx); vecB.setAttribute("y2", sB.sy);
        handleB.setAttribute("cx", sB.sx); handleB.setAttribute("cy", sB.sy);
        const R = { x: A.x + B.x, y: A.y + B.y };
        const sR = toScreen(R.x, R.y);
        vecR.setAttribute("x2", sR.sx); vecR.setAttribute("y2", sR.sy);
        lineTailAtoR.setAttribute("x1", sA.sx); lineTailAtoR.setAttribute("y1", sA.sy);
        lineTailAtoR.setAttribute("x2", sR.sx); lineTailAtoR.setAttribute("y2", sR.sy);
        bVal.textContent = fmt(B);
        rVal.textContent = fmt(R);
      } else {
        groupB.style.display = "none";
        rowB.style.display = "none"; rowR.style.display = "none";
      }
    }

    makeDraggable(handleA, svg, (pt) => {
      const w = toWorld(pt.x, pt.y);
      A = { x: clamp(w.x, -LIMIT, LIMIT), y: clamp(w.y, -LIMIT, LIMIT) };
      render();
    });
    makeDraggable(handleB, svg, (pt) => {
      const w = toWorld(pt.x, pt.y);
      B = { x: clamp(w.x, -LIMIT, LIMIT), y: clamp(w.y, -LIMIT, LIMIT) };
      render();
    });
    toggleB.addEventListener("change", render);
    resetBtn.addEventListener("click", () => {
      A = { x: 4, y: 4 }; B = { x: 2, y: 3 };
      render();
    });

    render();
  }

  /* ===================== 3. COORDINATE SYSTEMS ===================== */
  function initCoordinates() {
    const svg = document.getElementById("coordSvg");
    if (!svg) return;
    buildCartesianGrid(document.getElementById("cartGrid"), 400, 40);
    buildPolarGrid(document.getElementById("polarGrid"), 200, 200, 190, 40);

    const handleP = document.getElementById("handleP");
    const vecP = document.getElementById("vecP");
    const cProjX = document.getElementById("cProjX"), cProjY = document.getElementById("cProjY");
    const thetaArc = document.getElementById("thetaArc"), thetaLabel = document.getElementById("thetaLabel");
    const togglePolar = document.getElementById("togglePolar");
    const cartGrid = document.getElementById("cartGrid"), polarGrid = document.getElementById("polarGrid");
    const xyVal = document.getElementById("xyVal"), rtVal = document.getElementById("rtVal");
    const resetBtn = document.getElementById("resetCoord");

    let P = { x: 4, y: 3 };

    function render() {
      const s = toScreen(P.x, P.y);
      vecP.setAttribute("x2", s.sx); vecP.setAttribute("y2", s.sy);
      handleP.setAttribute("cx", s.sx); handleP.setAttribute("cy", s.sy);
      cProjX.setAttribute("x1", s.sx); cProjX.setAttribute("y1", s.sy);
      cProjX.setAttribute("x2", s.sx); cProjX.setAttribute("y2", 200);
      cProjY.setAttribute("x1", s.sx); cProjY.setAttribute("y1", s.sy);
      cProjY.setAttribute("x2", 200); cProjY.setAttribute("y2", s.sy);

      const r = Math.hypot(P.x, P.y);
      const thetaRaw = (Math.atan2(P.y, P.x) * 180) / Math.PI;
      let thetaDisplay = thetaRaw < 0 ? thetaRaw + 360 : thetaRaw;

      thetaArc.setAttribute("d", arcPath(200, 200, 30, thetaRaw));
      const midRad = ((thetaRaw / 2) * Math.PI) / 180;
      thetaLabel.setAttribute("x", 200 + 44 * Math.cos(midRad));
      thetaLabel.setAttribute("y", 200 - 44 * Math.sin(midRad));

      xyVal.textContent = `(${P.x.toFixed(1)}, ${P.y.toFixed(1)})`;
      rtVal.textContent = `${r.toFixed(1)}, ${thetaDisplay.toFixed(0)}°`;
    }

    makeDraggable(handleP, svg, (pt) => {
      const w = toWorld(pt.x, pt.y);
      P = { x: clamp(w.x, -LIMIT, LIMIT), y: clamp(w.y, -LIMIT, LIMIT) };
      render();
    });
    togglePolar.addEventListener("change", () => {
      cartGrid.style.display = togglePolar.checked ? "none" : "";
      polarGrid.style.display = togglePolar.checked ? "" : "none";
    });
    resetBtn.addEventListener("click", () => { P = { x: 4, y: 3 }; render(); });

    render();
  }

  /* ===================== 4. REFERENCE FRAMES ===================== */
  function initFrames() {
    const uSlider = document.getElementById("uSlider"), wSlider = document.getElementById("wSlider");
    if (!uSlider) return;
    const uVal = document.getElementById("uVal"), wVal = document.getElementById("wVal");
    const groundVel = document.getElementById("groundVel"), frameVel = document.getElementById("frameVel");
    const walkerGround = document.getElementById("walkerGround"), walkerFrame = document.getElementById("walkerFrame");
    const beltPattern = document.getElementById("beltPattern");
    const playPause = document.getElementById("playPause");

    const TRACK_X = 8, TRACK_W = 444, PXPER_MS = 26;
    let posGround = 0, posFrame = 0, patternOffset = 0;
    let running = true, lastT = null;

    function wrap(v, m) { return ((v % m) + m) % m; }

    function updateReadout() {
      const u = parseFloat(uSlider.value), w = parseFloat(wSlider.value);
      uVal.textContent = u.toFixed(1) + " m/s";
      wVal.textContent = w.toFixed(1) + " m/s";
      groundVel.textContent = `u + w = ${(u + w).toFixed(1)} m/s`;
      frameVel.textContent = `w = ${w.toFixed(1)} m/s`;
    }

    function step(t) {
      if (lastT === null) lastT = t;
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      if (running) {
        const u = parseFloat(uSlider.value), w = parseFloat(wSlider.value);
        posGround = wrap(posGround + (u + w) * PXPER_MS * dt, TRACK_W);
        posFrame = wrap(posFrame + w * PXPER_MS * dt, TRACK_W);
        patternOffset = wrap(patternOffset + u * PXPER_MS * dt, 40);
        walkerGround.setAttribute("cx", TRACK_X + posGround);
        walkerFrame.setAttribute("cx", TRACK_X + posFrame);
        beltPattern.setAttribute("patternTransform", `translate(${patternOffset},0)`);
      }
      requestAnimationFrame(step);
    }

    uSlider.addEventListener("input", updateReadout);
    wSlider.addEventListener("input", updateReadout);
    playPause.addEventListener("click", () => {
      running = !running;
      playPause.textContent = running ? "Pause" : "Play";
    });

    updateReadout();
    requestAnimationFrame(step);
  }

  /* ===================== 5. FREE-BODY DIAGRAM BUILDER ===================== */
  function initFBD() {
    const cbWeight = document.getElementById("cbWeight");
    if (!cbWeight) return;
    const cbNormal = document.getElementById("cbNormal"), cbApplied = document.getElementById("cbApplied"), cbFriction = document.getElementById("cbFriction");
    const fAppSlider = document.getElementById("fAppSlider"), thAppSlider = document.getElementById("thAppSlider"), fFrSlider = document.getElementById("fFrSlider");
    const fAppVal = document.getElementById("fAppVal"), thAppVal = document.getElementById("thAppVal"), fFrVal = document.getElementById("fFrVal");
    const vecWeight = document.getElementById("vecWeight"), labelWeight = document.getElementById("labelWeight");
    const vecNormal = document.getElementById("vecNormal"), labelNormal = document.getElementById("labelNormal");
    const vecApplied = document.getElementById("vecApplied"), labelApplied = document.getElementById("labelApplied");
    const vecFriction = document.getElementById("vecFriction"), labelFriction = document.getElementById("labelFriction");
    const vecNet = document.getElementById("vecNet"), labelNet = document.getElementById("labelNet");
    const netVal = document.getElementById("netVal"), netMag = document.getElementById("netMag");
    const verdict = document.getElementById("fbdVerdict");
    const hatching = document.getElementById("hatching");

    for (let x = 20; x <= 380; x += 24) {
      hatching.appendChild(svgEl("line", { x1: x, y1: 300, x2: x - 8, y2: 312, class: "svg-grid" }));
    }

    const CX = 200, CY = 270, PXPER_N = 1.4, W_FIXED = 50;

    function setVec(line, label, active, fx, fy, text) {
      const mag = Math.hypot(fx, fy);
      if (!active || mag < 0.5) {
        line.style.opacity = 0;
        label.textContent = "";
        return;
      }
      line.style.opacity = 1;
      const tx = CX + fx * PXPER_N, ty = CY - fy * PXPER_N;
      line.setAttribute("x2", tx); line.setAttribute("y2", ty);
      label.setAttribute("x", tx + (fx >= 0 ? 6 : -6));
      label.setAttribute("y", ty + (fy >= 0 ? -6 : 14));
      if (fx < 0) label.setAttribute("text-anchor", "end");
      else label.removeAttribute("text-anchor");
      label.textContent = text;
    }

    function render() {
      const weightOn = cbWeight.checked, normalOn = cbNormal.checked, appliedOn = cbApplied.checked, frictionOn = cbFriction.checked;
      const Fapp = parseFloat(fAppSlider.value), thApp = (parseFloat(thAppSlider.value) * Math.PI) / 180;
      const Ffr = parseFloat(fFrSlider.value);
      fAppVal.textContent = Fapp + " N";
      thAppVal.textContent = thAppSlider.value + "°";
      fFrVal.textContent = Ffr + " N";

      const Wy = weightOn ? -W_FIXED : 0;
      const Ax = appliedOn ? Fapp * Math.cos(thApp) : 0;
      const Ay = appliedOn ? Fapp * Math.sin(thApp) : 0;
      const downward = (weightOn ? W_FIXED : 0) - Ay;
      const N = normalOn ? Math.max(0, downward) : 0;
      const frDir = Ax > 0 ? -1 : 1;
      const Ffx = frictionOn ? frDir * Ffr : 0;

      setVec(vecWeight, labelWeight, weightOn, 0, Wy, `W = ${W_FIXED} N`);
      setVec(vecNormal, labelNormal, normalOn, 0, N, `N = ${N.toFixed(0)} N`);
      setVec(vecApplied, labelApplied, appliedOn, Ax, Ay, `F = ${Fapp} N`);
      setVec(vecFriction, labelFriction, frictionOn, Ffx, 0, `f = ${Ffr} N`);

      const NetX = Ax + Ffx;
      const NetY = Wy + Ay + N;
      setVec(vecNet, labelNet, true, NetX, NetY, "Net");
      netVal.textContent = `(${NetX.toFixed(1)}, ${NetY.toFixed(1)}) N`;
      const mag = Math.hypot(NetX, NetY);
      netMag.textContent = `${mag.toFixed(1)} N`;
      verdict.textContent =
        mag > 0.5
          ? `Net force ≠ 0 (${mag.toFixed(1)} N) → the box accelerates.`
          : "Net force ≈ 0 → the box stays in equilibrium.";
    }

    [cbWeight, cbNormal, cbApplied, cbFriction].forEach((el) => el.addEventListener("change", render));
    [fAppSlider, thAppSlider, fFrSlider].forEach((el) => el.addEventListener("input", render));
    render();
  }

  /* ===================== TABS ===================== */
  function initTabs() {
    const buttons = Array.from(document.querySelectorAll("#tabbar button"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
        const panel = document.getElementById("panel-" + btn.dataset.target);
        if (panel) panel.classList.add("active");
        history.replaceState(null, "", "#" + btn.dataset.target);
      });
    });
    const initial = window.location.hash.replace("#", "");
    const match = buttons.find((b) => b.dataset.target === initial);
    if (match) match.click();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initScaling();
    initVectors();
    initCoordinates();
    initFrames();
    initFBD();
  });
})();
