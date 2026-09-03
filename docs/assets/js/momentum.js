// Interactive widgets for docs/04-momentum/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
// Drop-in replacement: all existing element IDs and coordinate conventions
// are preserved, so it works with the current index.html unchanged.
(function () {
  const G = 9.8;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const NS = "http://www.w3.org/2000/svg";

  function vbw(svg) { return (svg.viewBox && svg.viewBox.baseVal.width) || 400; }
  function vbh(svg) { return (svg.viewBox && svg.viewBox.baseVal.height) || 200; }

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

  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ===============================================================
  // Widget 1 (Momentum) -- Two-Cart Collision Lab (perfectly inelastic)
  // ===============================================================
  function initCartCollision() {
    const svg = document.getElementById("mCartSvg");
    if (!svg) return;
    const cartA = document.getElementById("mCartA");
    const cartB = document.getElementById("mCartB");
    const maSlider = document.getElementById("mMASlider");
    const maVal = document.getElementById("mMAVal");
    const vaSlider = document.getElementById("mVASlider");
    const vaVal = document.getElementById("mVAVal");
    const mbSlider = document.getElementById("mMBSlider");
    const mbVal = document.getElementById("mMBVal");
    const vbSlider = document.getElementById("mVBSlider");
    const vbVal = document.getElementById("mVBVal");
    const goBtn = document.getElementById("mGoBtn");
    const pBeforeVal = document.getElementById("mPBeforeVal");
    const vfVal = document.getElementById("mVFVal");
    const pAfterVal = document.getElementById("mPAfterVal");

    const A_X0 = 80, B_X0 = 320, HALF = 20, TOUCH = 40, PXPS = 6, MAXT = 3.2;
    const W = vbw(svg);
    let animating = false, rafId = null;

    function current() {
      const mA = parseFloat(maSlider.value);
      const vA = parseFloat(vaSlider.value);
      const mB = parseFloat(mbSlider.value);
      const vB = parseFloat(vbSlider.value);
      const pBefore = mA * vA + mB * vB;
      const vf = pBefore / (mA + mB);
      return { mA, vA, mB, vB, pBefore, vf, pAfter: (mA + mB) * vf };
    }

    function place(aC, bC) {
      cartA.setAttribute("x", aC - HALF);
      cartB.setAttribute("x", bC - HALF);
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      cartA.setAttribute("opacity", 1);
      cartB.setAttribute("opacity", 1);
      place(A_X0, B_X0);
    }

    function redraw() {
      const { mA, vA, mB, vB, pBefore, vf, pAfter } = current();
      maVal.textContent = mA + " kg";
      vaVal.textContent = vA + " m/s";
      mbVal.textContent = mB + " kg";
      vbVal.textContent = vB + " m/s";
      pBeforeVal.textContent = pBefore.toFixed(1) + " kg·m/s";
      vfVal.textContent = vf.toFixed(2) + " m/s";
      pAfterVal.textContent = pAfter.toFixed(1) + " kg·m/s";
    }
    [maSlider, vaSlider, mbSlider, vbSlider].forEach((s) =>
      s.addEventListener("input", () => { redraw(); reset(); }));
    redraw();
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { vA, vB, vf } = current();

      // Geometric collision instant: leading edges meet when centre gap = TOUCH.
      const closing = (vA - vB) * PXPS;             // px/s the centres approach
      const tColl = closing > 1e-6 ? ((B_X0 - A_X0) - TOUCH) / closing : Infinity;
      const aColl = A_X0 + vA * (isFinite(tColl) ? tColl : 0) * PXPS;
      const bColl = aColl + TOUCH;

      animating = true;
      goBtn.disabled = false; // click again to stop/reset
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        let aC, bC;
        if (t < tColl) {
          aC = A_X0 + vA * t * PXPS;
          bC = B_X0 + vB * t * PXPS;
        } else {
          const dt2 = t - tColl;
          aC = aColl + vf * dt2 * PXPS;   // stuck together, both visible
          bC = bColl + vf * dt2 * PXPS;
        }
        place(aC, bC);
        const lead = Math.max(aC, bC), trail = Math.min(aC, bC);
        if (t >= MAXT || lead > W + 60 || trail < -60) {
          animating = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Momentum) -- Recoil: Firing a Cannon
  // ===============================================================
  function initCannonRecoil() {
    const svg = document.getElementById("mCannonSvg");
    if (!svg) return;
    const cannonBody = document.getElementById("mCannonBody");
    const shell = document.getElementById("mShell");
    const mSlider = document.getElementById("mCannonMSlider");
    const mVal = document.getElementById("mCannonMVal");
    const shellMSlider = document.getElementById("mShellMSlider");
    const shellMVal = document.getElementById("mShellMVal");
    const shellVSlider = document.getElementById("mShellVSlider");
    const shellVVal = document.getElementById("mShellVVal");
    const fireBtn = document.getElementById("mFireBtn");
    const shellPVal = document.getElementById("mShellPVal");
    const recoilVVal = document.getElementById("mRecoilVVal");
    const totalVal = document.getElementById("mTotalVal");

    const CANNON_X0 = 200, SHELL_X0 = 258, MAXT = 2.6;
    const SHELL_PX = 0.55, RECOIL_VIS = 3.5, TAU = 0.5; // recoil exaggerated for visibility
    const W = vbw(svg);
    let animating = false, rafId = null;

    function current() {
      const M = parseFloat(mSlider.value);
      const m = parseFloat(shellMSlider.value);
      const vShell = parseFloat(shellVSlider.value);
      const shellP = m * vShell;
      const recoilV = -shellP / M;
      return { M, m, vShell, shellP, recoilV, total: M * recoilV + m * vShell };
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      fireBtn.disabled = false;
      cannonBody.setAttribute("x", CANNON_X0);
      shell.setAttribute("cx", SHELL_X0);
      shell.setAttribute("opacity", 1);
    }

    function redraw() {
      const { M, m, vShell, shellP, recoilV, total } = current();
      mVal.textContent = M + " kg";
      shellMVal.textContent = m + " kg";
      shellVVal.textContent = vShell + " m/s";
      shellPVal.textContent = shellP.toFixed(0) + " kg·m/s";
      recoilVVal.textContent = recoilV.toFixed(2) + " m/s";
      totalVal.textContent = total.toFixed(1) + " kg·m/s";
    }
    [mSlider, shellMSlider, shellVSlider].forEach((s) =>
      s.addEventListener("input", () => { redraw(); reset(); }));
    redraw();
    reset();

    fireBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { recoilV, vShell } = current();

      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        // Cannon: recoils, then friction brings it smoothly to rest.
        const cannonDisp = recoilV * RECOIL_VIS * TAU * (1 - Math.exp(-t / TAU));
        cannonBody.setAttribute("x", CANNON_X0 + cannonDisp);
        // Shell: flies forward and fades as it leaves the frame.
        const shellX = SHELL_X0 + vShell * t * SHELL_PX;
        shell.setAttribute("cx", shellX);
        if (shellX > W * 0.82) {
          shell.setAttribute("opacity", clamp(1 - (shellX - W * 0.82) / (W * 0.18), 0, 1));
        }
        if (t >= MAXT) { animating = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Impulse) -- Force-Time Graph Explorer
  // ===============================================================
  function initImpulseGraph() {
    const svg = document.getElementById("impGraphSvg");
    if (!svg) return;
    const areaPath = document.getElementById("impAreaPath");
    const linePath = document.getElementById("impLinePath");
    const mSlider = document.getElementById("impMSlider");
    const mVal = document.getElementById("impMVal");
    const dvSlider = document.getElementById("impDvSlider");
    const dvVal = document.getElementById("impDvVal");
    const dtSlider = document.getElementById("impDtSlider");
    const dtVal = document.getElementById("impDtVal");
    const jVal = document.getElementById("impJVal");
    const fVal = document.getElementById("impFVal");

    const T_MAX = 1;
    const toX = (t) => 40 + (clamp(t, 0, T_MAX) / T_MAX) * 400;

    function redraw() {
      const m = parseFloat(mSlider.value);
      const dv = parseFloat(dvSlider.value);
      const dt = parseFloat(dtSlider.value);
      const j = m * dv;
      const f = dt > 0 ? j / dt : 0;

      mVal.textContent = m + " kg";
      dvVal.textContent = dv + " m/s";
      dtVal.textContent = dt.toFixed(2) + " s";
      jVal.textContent = j.toFixed(0) + " kg·m/s";
      fVal.textContent = f.toFixed(0) + " N";

      // Adaptive scale: the force bar always fills the plot so every
      // slider change is clearly visible (this was the "dead" bug).
      const yMax = Math.max(f * 1.15, 1);
      const toY = (force) => 150 - (clamp(force, 0, yMax) / yMax) * 140;
      linePath.setAttribute("d", "M" + toX(0) + "," + toY(f) + " L" + toX(dt) + "," + toY(f));
      areaPath.setAttribute("d",
        "M" + toX(0) + "," + toY(0) +
        " L" + toX(dt) + "," + toY(0) +
        " L" + toX(dt) + "," + toY(f) +
        " L" + toX(0) + "," + toY(f) + " Z");
    }
    [mSlider, dvSlider, dtSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ===============================================================
  // Widget 2 (Impulse) -- Same Stop, Different Time (safety bar)
  // ===============================================================
  function initSafetyBar() {
    const svg = document.getElementById("impBarSvg");
    if (!svg) return;
    const bar = document.getElementById("impForceBar");
    const mSlider = document.getElementById("impSMSlider");
    const mVal = document.getElementById("impSMVal");
    const dvSlider = document.getElementById("impSDvSlider");
    const dvVal = document.getElementById("impSDvVal");
    const dtVal = document.getElementById("impSDtVal");
    const jVal = document.getElementById("impSJVal");
    const fVal = document.getElementById("impSFVal");
    const presetButtons = Array.from(document.querySelectorAll("#impPresetRow button"));

    let dt = 0.002;
    const BAR_MAX_H = 100, F_REF = 200000;

    function redraw() {
      const m = parseFloat(mSlider.value);
      const dv = parseFloat(dvSlider.value);
      const j = m * dv;
      const f = dt > 0 ? j / dt : 0;

      mVal.textContent = m + " kg";
      dvVal.textContent = dv + " m/s";
      dtVal.textContent = dt.toFixed(3) + " s";
      jVal.textContent = j.toFixed(1) + " kg·m/s";
      fVal.textContent = f.toFixed(0) + " N";

      // Log-ish scaling so the huge dynamic range (2 ms vs 0.5 s) stays legible.
      const h = clamp((Math.log10(1 + f) / Math.log10(1 + F_REF)) * BAR_MAX_H, 2, BAR_MAX_H);
      bar.setAttribute("y", 120 - h);
      bar.setAttribute("height", h);
      bar.setAttribute("fill", f > 40000 ? "#d64545" : f > 8000 ? "#e0913a" : "#3a9d5a");
    }
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        dt = parseFloat(btn.dataset.dt);
        redraw();
      });
    });
    mSlider.addEventListener("input", redraw);
    dvSlider.addEventListener("input", redraw);
    redraw();
  }

  // ===============================================================
  // Widget 1 (Collisions) -- Collision Laboratory (variable elasticity)
  // ===============================================================
  function initCollisionLab() {
    const svg = document.getElementById("colCartSvg");
    if (!svg) return;
    const ballA = document.getElementById("colBallA");
    const ballB = document.getElementById("colBallB");
    const eSlider = document.getElementById("colESlider");
    const eVal = document.getElementById("colEVal");
    const m1Slider = document.getElementById("colM1Slider");
    const m1Val = document.getElementById("colM1Val");
    const v1Slider = document.getElementById("colV1Slider");
    const v1Val = document.getElementById("colV1Val");
    const m2Slider = document.getElementById("colM2Slider");
    const m2Val = document.getElementById("colM2Val");
    const v2Slider = document.getElementById("colV2Slider");
    const v2Val = document.getElementById("colV2Val");
    const goBtn = document.getElementById("colGoBtn");
    const pVal = document.getElementById("colPVal");
    const vAfterVal = document.getElementById("colVAfterVal");
    const keVal = document.getElementById("colKEVal");

    const A_X0 = 100, B_X0 = 300, R = 20, PXPS = 6, MAXT = 3.0;
    const W = vbw(svg);
    let animating = false, rafId = null;

    function current() {
      const e = parseFloat(eSlider.value);
      const m1 = parseFloat(m1Slider.value);
      const v1 = parseFloat(v1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const v2 = parseFloat(v2Slider.value);
      const v1f = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      const v2f = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      const pBefore = m1 * v1 + m2 * v2;
      const pAfter = m1 * v1f + m2 * v2f;
      const keBefore = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      const keAfter = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;
      return { e, m1, v1, m2, v2, v1f, v2f, pBefore, pAfter, keBefore, keAfter };
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      ballA.setAttribute("cx", A_X0);
      ballB.setAttribute("cx", B_X0);
    }

    function redraw() {
      const s = current();
      eVal.textContent = s.e.toFixed(2) +
        (s.e >= 0.99 ? " (elastic)" : s.e <= 0.01 ? " (perfectly inelastic)" : "");
      m1Val.textContent = s.m1 + " kg";
      v1Val.textContent = s.v1 + " m/s";
      m2Val.textContent = s.m2 + " kg";
      v2Val.textContent = s.v2 + " m/s";
      pVal.textContent = s.pBefore.toFixed(1) + " / " + s.pAfter.toFixed(1);
      vAfterVal.textContent = s.v1f.toFixed(1) + " / " + s.v2f.toFixed(1) + " m/s";
      keVal.textContent = s.keBefore.toFixed(1) + " / " + s.keAfter.toFixed(1) + " J";
    }
    [eSlider, m1Slider, v1Slider, m2Slider, v2Slider].forEach((s) =>
      s.addEventListener("input", () => { redraw(); reset(); }));
    redraw();
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { v1, v2, v1f, v2f, e } = current();

      // Collision instant: centres approach until they touch (gap = 2R).
      const closing = (v1 - v2) * PXPS;
      const tColl = closing > 1e-6 ? ((B_X0 - A_X0) - 2 * R) / closing : Infinity;
      const aColl = A_X0 + v1 * (isFinite(tColl) ? tColl : 0) * PXPS;
      const bColl = aColl + 2 * R;
      const stuck = e <= 0.01;

      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        let aC, bC;
        if (t < tColl) {
          aC = A_X0 + v1 * t * PXPS;
          bC = B_X0 + v2 * t * PXPS;
        } else {
          const dt2 = t - tColl;
          aC = aColl + v1f * dt2 * PXPS;
          bC = bColl + v2f * dt2 * PXPS;
          if (stuck) bC = Math.max(bC, aC + 2 * R); // keep both visible when they stick
        }
        ballA.setAttribute("cx", aC);
        ballB.setAttribute("cx", bC);
        const lead = Math.max(aC, bC), trail = Math.min(aC, bC);
        if (t >= MAXT || lead > W + 60 || trail < -60) { animating = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 2 (Collisions) -- Newton's Cradle (continuous, alternating)
  // ===============================================================
  function initCradle() {
    const svg = document.getElementById("cradleSvg");
    if (!svg) return;
    const group = document.getElementById("cradleBalls");
    const kSlider = document.getElementById("cradleKSlider");
    const kVal = document.getElementById("cradleKVal");
    const goBtn = document.getElementById("cradleGoBtn");
    const outVal = document.getElementById("cradleOutVal");

    const N = 5, X0 = 40, DX = 45, Y_REST = 100, PULL = 30, LIFT = 20;
    const balls = [];
    while (group.firstChild) group.removeChild(group.firstChild);
    for (let i = 0; i < N; i++) {
      const c = svgEl("circle", {
        r: 16, fill: "#2a78d6", stroke: "white", "stroke-width": 2,
        cx: X0 + i * DX, cy: Y_REST,
      });
      group.appendChild(c);
      balls.push(c);
    }

    let animating = false, rafId = null;

    function activeK() { return clamp(parseInt(kSlider.value, 10), 1, Math.floor(N / 2)); }

    function draw(leftDisp, rightDisp) {
      const k = activeK();
      for (let i = 0; i < N; i++) {
        let d = 0;
        if (i < k) d = leftDisp;
        else if (i >= N - k) d = rightDisp;
        balls[i].setAttribute("cx", X0 + i * DX + d * PULL);
        balls[i].setAttribute("cy", Y_REST - Math.abs(d) * LIFT);
      }
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      kVal.textContent = activeK();
      outVal.textContent = activeK();
      draw(-1, 0); // preview: left group lifted, ready to release
    }
    kSlider.addEventListener("input", reset);
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      const halfT = 0.5, damp = 0.05;
      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        const amp = Math.exp(-damp * t);
        let leftDisp = 0, rightDisp = 0;
        if (t < halfT) {
          // Release: lifted left group swings down into the rest line.
          leftDisp = -Math.cos((t / halfT) * (Math.PI / 2));
        } else {
          const tt = t - halfT;
          const cyc = Math.floor(tt / halfT);
          const hump = Math.sin(((tt % halfT) / halfT) * Math.PI);
          if (cyc % 2 === 0) rightDisp = hump;   // energy exits on the right
          else leftDisp = -hump;                  // ...then back on the left
        }
        draw(leftDisp * amp, rightDisp * amp);
        if (amp < 0.04 || t > 14) { reset(); return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 3 (Collisions) -- Billiard Balls: 2D Momentum
  // ===============================================================
  function initBilliards() {
    const svg = document.getElementById("billiardSvg");
    if (!svg) return;
    const cue = document.getElementById("billCue");
    const target = document.getElementById("billTarget");
    const cuePath = document.getElementById("billCuePath");
    const targetPath = document.getElementById("billTargetPath");
    const bSlider = document.getElementById("billBSlider");
    const bVal = document.getElementById("billBVal");
    const goBtn = document.getElementById("billGoBtn");
    const cueVVal = document.getElementById("billCueVVal");
    const targetVVal = document.getElementById("billTargetVVal");
    const angleVal = document.getElementById("billAngleVal");

    const CUE_X0 = 40, TARGET_X0 = 180, Y0 = 100, CONTACT_R = 28, V = 10, PXPU = 4;
    const W = vbw(svg), H = vbh(svg);
    let animating = false, rafId = null;

    function current() {
      const b = parseFloat(bSlider.value);
      const sinT = clamp(b / CONTACT_R, -1, 1);
      const cosT = Math.cos(Math.asin(sinT));
      const targetSpeed = V * cosT;
      const targetDir = { x: cosT, y: sinT };
      const cueSpeed = V * Math.abs(sinT);
      const s = sinT >= 0 ? 1 : -1;
      const cueDir = { x: s * sinT, y: -s * cosT };
      let angle = null;
      if (cueSpeed > 0.01 && targetSpeed > 0.01) {
        const dot = targetDir.x * cueDir.x + targetDir.y * cueDir.y;
        angle = (Math.acos(clamp(dot, -1, 1)) * 180) / Math.PI;
      }
      return { b, targetSpeed, targetDir, cueSpeed, cueDir, angle };
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      cue.setAttribute("cx", CUE_X0); cue.setAttribute("cy", Y0);
      target.setAttribute("cx", TARGET_X0); target.setAttribute("cy", Y0);
      cuePath.setAttribute("x1", CUE_X0); cuePath.setAttribute("y1", Y0);
      cuePath.setAttribute("x2", CUE_X0); cuePath.setAttribute("y2", Y0);
      targetPath.setAttribute("x1", TARGET_X0); targetPath.setAttribute("y1", Y0);
      targetPath.setAttribute("x2", TARGET_X0); targetPath.setAttribute("y2", Y0);
    }

    function redraw() {
      const { b, targetSpeed, cueSpeed, angle } = current();
      bVal.textContent = b + " units";
      cueVVal.textContent = cueSpeed.toFixed(2) + " units/s";
      targetVVal.textContent = targetSpeed.toFixed(2) + " units/s";
      angleVal.textContent = angle === null ? "— (direct hit)" : angle.toFixed(1) + "°";
    }
    bSlider.addEventListener("input", () => { redraw(); reset(); });
    redraw();
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { targetSpeed, targetDir, cueSpeed, cueDir } = current();
      const T_APPROACH = 0.8, MAXT = 4.0;
      const cx0 = CUE_X0 + (TARGET_X0 - CUE_X0 - CONTACT_R);

      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        let cx, cy = Y0, tx = TARGET_X0, ty = Y0;
        if (t <= T_APPROACH) {
          cx = CUE_X0 + (TARGET_X0 - CUE_X0 - CONTACT_R) * (t / T_APPROACH);
        } else {
          const t2 = t - T_APPROACH;
          cx = cx0 + cueDir.x * cueSpeed * t2 * PXPU;
          cy = Y0 + cueDir.y * cueSpeed * t2 * PXPU;
          tx = TARGET_X0 + targetDir.x * targetSpeed * t2 * PXPU;
          ty = Y0 + targetDir.y * targetSpeed * t2 * PXPU;
        }
        cue.setAttribute("cx", cx); cue.setAttribute("cy", cy);
        target.setAttribute("cx", tx); target.setAttribute("cy", ty);
        cuePath.setAttribute("x2", cx); cuePath.setAttribute("y2", cy);
        targetPath.setAttribute("x2", tx); targetPath.setAttribute("y2", ty);

        const off = (x, y) => x < -30 || x > W + 30 || y < -30 || y > H + 30;
        const settled = t > T_APPROACH && (off(cx, cy) || cueSpeed < 0.01) &&
                        (off(tx, ty) || targetSpeed < 0.01);
        if (t >= MAXT || settled) { animating = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Center of Mass) -- Center-of-Mass Visualizer
  // ===============================================================
  function initCOMVisualizer() {
    const svg = document.getElementById("comSvg");
    if (!svg) return;
    const p1 = document.getElementById("comP1");
    const p2 = document.getElementById("comP2");
    const p3 = document.getElementById("comP3");
    const star = document.getElementById("comStar");
    const m1Slider = document.getElementById("comM1Slider");
    const m1Val = document.getElementById("comM1Val");
    const m2Slider = document.getElementById("comM2Slider");
    const m2Val = document.getElementById("comM2Val");
    const m3Slider = document.getElementById("comM3Slider");
    const m3Val = document.getElementById("comM3Val");
    const posVal = document.getElementById("comPosVal");
    const totalMVal = document.getElementById("comTotalMVal");

    function recompute() {
      const m1 = parseFloat(m1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const m3 = parseFloat(m3Slider.value);
      const x1 = parseFloat(p1.getAttribute("cx")), y1 = parseFloat(p1.getAttribute("cy"));
      const x2 = parseFloat(p2.getAttribute("cx")), y2 = parseFloat(p2.getAttribute("cy"));
      const x3 = parseFloat(p3.getAttribute("cx")), y3 = parseFloat(p3.getAttribute("cy"));
      const totalM = m1 + m2 + m3;
      const xcom = (m1 * x1 + m2 * x2 + m3 * x3) / totalM;
      const ycom = (m1 * y1 + m2 * y2 + m3 * y3) / totalM;

      m1Val.textContent = m1 + " kg";
      m2Val.textContent = m2 + " kg";
      m3Val.textContent = m3 + " kg";
      totalMVal.textContent = totalM + " kg";
      posVal.textContent = "(" + ((xcom - 150) / 30).toFixed(2) + ", " + ((150 - ycom) / 30).toFixed(2) + ") m";
      star.setAttribute("x", xcom);
      star.setAttribute("y", ycom);
    }
    [m1Slider, m2Slider, m3Slider].forEach((s) => s.addEventListener("input", recompute));
    [p1, p2, p3].forEach((p) => {
      makeDraggable(p, svg, (pt) => {
        p.setAttribute("cx", clamp(pt.x, 25, 275));
        p.setAttribute("cy", clamp(pt.y, 25, 275));
        recompute();
      });
    });
    recompute();
  }

  // ===============================================================
  // Widget 2 (Center of Mass) -- Explosions and the Center of Mass
  // ===============================================================
  function initCOMExplosion() {
    const svg = document.getElementById("comExplodeSvg");
    if (!svg) return;
    const ghostPath = document.getElementById("comGhostPath");
    const ghost = document.getElementById("comGhost");
    const shell = document.getElementById("comShell");
    const fragA = document.getElementById("comFragA");
    const fragB = document.getElementById("comFragB");
    const dvSlider = document.getElementById("comDvSlider");
    const dvVal = document.getElementById("comDvVal");
    const goBtn = document.getElementById("comExplodeBtn");
    const ghostPosVal = document.getElementById("comGhostPosVal");
    const midPosVal = document.getElementById("comMidPosVal");
    const matchVal = document.getElementById("comMatchVal");

    const X0 = 30, Y0 = 200, V0 = 22, ANGLE = 55, PXPM = 8;
    const rad = (ANGLE * Math.PI) / 180;
    const vx0 = V0 * Math.cos(rad), vy0 = V0 * Math.sin(rad);
    const T_TOTAL = (2 * vy0) / G;
    const T_EXPLODE = T_TOTAL * 0.45;

    const pos = (t) => ({ x: X0 + vx0 * t * PXPM, y: Y0 - (vy0 * t - 0.5 * G * t * t) * PXPM });

    let d = "";
    for (let i = 0; i <= 40; i++) {
      const p = pos((T_TOTAL * i) / 40);
      d += (i === 0 ? "M" : "L") + p.x + "," + p.y + " ";
    }
    ghostPath.setAttribute("d", d);

    dvSlider.addEventListener("input", () => { dvVal.textContent = dvSlider.value + " m/s"; });
    dvVal.textContent = dvSlider.value + " m/s";

    let animating = false, rafId = null;

    function resetVisual() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      shell.setAttribute("cx", X0); shell.setAttribute("cy", Y0); shell.setAttribute("opacity", 1);
      fragA.setAttribute("opacity", 0);
      fragB.setAttribute("opacity", 0);
      ghost.setAttribute("cx", X0); ghost.setAttribute("cy", Y0);
      ghostPosVal.textContent = "—";
      midPosVal.textContent = "—";
      matchVal.textContent = "—";
    }
    resetVisual();

    goBtn.addEventListener("click", () => {
      if (animating) { resetVisual(); return; }
      resetVisual();
      const dv = parseFloat(dvSlider.value);
      const explodePos = pos(T_EXPLODE);
      const vAx = vx0 + dv, vAy = vy0 - G * T_EXPLODE - dv * 0.6;
      const vBx = vx0 - dv, vBy = vy0 - G * T_EXPLODE + dv * 0.6;

      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(T_TOTAL, Math.max(0, (now - start) / 1000));
        const g = pos(t);
        ghost.setAttribute("cx", g.x);
        ghost.setAttribute("cy", g.y);

        if (t <= T_EXPLODE) {
          shell.setAttribute("cx", g.x);
          shell.setAttribute("cy", g.y);
        } else {
          shell.setAttribute("opacity", 0);
          fragA.setAttribute("opacity", 1);
          fragB.setAttribute("opacity", 1);
          const t2 = t - T_EXPLODE;
          const ax = explodePos.x + vAx * t2 * PXPM;
          const ay = explodePos.y - (vAy * t2 - 0.5 * G * t2 * t2) * PXPM;
          const bx = explodePos.x + vBx * t2 * PXPM;
          const by = explodePos.y - (vBy * t2 - 0.5 * G * t2 * t2) * PXPM;
          fragA.setAttribute("cx", ax); fragA.setAttribute("cy", ay);
          fragB.setAttribute("cx", bx); fragB.setAttribute("cy", by);

          const midX = (ax + bx) / 2, midY = (ay + by) / 2;
          ghostPosVal.textContent = "(" + g.x.toFixed(0) + ", " + g.y.toFixed(0) + ")";
          midPosVal.textContent = "(" + midX.toFixed(0) + ", " + midY.toFixed(0) + ")";
          matchVal.textContent = Math.hypot(midX - g.x, midY - g.y) < 1 ? "✓ Exact match" : "✓ Match (rounding)";
        }
        if (t >= T_TOTAL) { animating = false; return; }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // Widget 1 (Ballistic Pendulum) -- Ballistic Pendulum Calculator
  // ===============================================================
  function initBallisticPendulum() {
    const svg = document.getElementById("bpSvg");
    if (!svg) return;
    const rod = document.getElementById("bpRod");
    const block = document.getElementById("bpBlock");
    const bullet = document.getElementById("bpBullet");
    const arc = document.getElementById("bpArc");
    const vSlider = document.getElementById("bpVSlider");
    const vVal = document.getElementById("bpVVal");
    const mSlider = document.getElementById("bpMSlider");
    const mVal = document.getElementById("bpMVal");
    const bigMSlider = document.getElementById("bpBigMSlider");
    const bigMVal = document.getElementById("bpBigMVal");
    const goBtn = document.getElementById("bpGoBtn");
    const vAfterVal = document.getElementById("bpVAfterVal");
    const hVal = document.getElementById("bpHVal");
    const inferredVal = document.getElementById("bpInferredVal");

    const PIVOT = { x: 150, y: 20 }, L_PX = 150, L_PHYS = 1;
    const OMEGA = Math.sqrt(G / L_PHYS), GAMMA = 0.35;
    let animating = false, rafId = null;

    function current() {
      const v = parseFloat(vSlider.value);
      const m = parseFloat(mSlider.value);
      const M = parseFloat(bigMSlider.value);
      const V = (m * v) / (m + M);
      const h = (V * V) / (2 * G);
      const inferredV = ((m + M) / m) * Math.sqrt(2 * G * h);
      return { v, m, M, V, h, inferredV };
    }

    function place(theta) {
      const bx = PIVOT.x + L_PX * Math.sin(theta);
      const by = PIVOT.y + L_PX * Math.cos(theta);
      rod.setAttribute("x2", bx);
      rod.setAttribute("y2", by);
      block.setAttribute("x", bx - 20);
      block.setAttribute("y", by);
      bullet.setAttribute("cx", bx - 20);
      bullet.setAttribute("cy", by + 15);
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      place(0);
      bullet.setAttribute("cx", 20);
      bullet.setAttribute("cy", 185);
      bullet.setAttribute("opacity", 1);
    }

    function redraw() {
      const { v, m, M, V, h, inferredV } = current();
      vVal.textContent = v + " m/s";
      mVal.textContent = m.toFixed(3) + " kg";
      bigMVal.textContent = M.toFixed(1) + " kg";
      vAfterVal.textContent = V.toFixed(3) + " m/s";
      hVal.textContent = h.toFixed(3) + " m";
      inferredVal.textContent = inferredV.toFixed(1) + " m/s";

      const theta = Math.acos(clamp(1 - h / L_PHYS, -1, 1));
      let d = "M" + PIVOT.x + "," + (PIVOT.y + L_PX) + " ";
      for (let i = 0; i <= 20; i++) {
        const th = (theta * i) / 20;
        d += "L" + (PIVOT.x + L_PX * Math.sin(th)) + "," + (PIVOT.y + L_PX * Math.cos(th)) + " ";
      }
      arc.setAttribute("d", d);
    }
    [vSlider, mSlider, bigMSlider].forEach((s) =>
      s.addEventListener("input", () => { redraw(); reset(); }));
    redraw();
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const { h } = current();
      const theta = Math.acos(clamp(1 - h / L_PHYS, -1, 1));
      const T1 = 0.5, MAXT = 7;

      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= T1) {
          bullet.setAttribute("cx", 20 + (130 - 20) * (t / T1));
        } else {
          bullet.setAttribute("opacity", 0);
          const tt = t - T1;
          // Embedded bullet+block leaves the bottom with speed, rises to
          // theta, and swings back -- a lightly damped oscillation to rest.
          const angle = theta * Math.sin(OMEGA * tt) * Math.exp(-GAMMA * tt);
          place(angle);
          if (Math.exp(-GAMMA * tt) < 0.02 || t >= MAXT) {
            place(0);
            animating = false;
            return;
          }
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // NEW Widget (Impulse) -- Hard vs. Soft Catch  [host: #impCatchHost]
  // Self-builds its DOM; no-ops if the host div is absent.
  // ===============================================================
  function initHardSoftCatch() {
    const host = document.getElementById("impCatchHost");
    if (!host) return;
    host.classList.add("mech-widget");
    host.innerHTML =
      '<div class="mech-controls">' +
      '  <label>Mass <input type="range" min="0.1" max="2" step="0.1" value="0.5" data-r="m"> <span data-o="m"></span> kg</label>' +
      '  <label>Impact speed <input type="range" min="2" max="20" step="1" value="12" data-r="v"> <span data-o="v"></span> m/s</label>' +
      '  <label>Stopping distance <input type="range" min="0.01" max="0.5" step="0.01" value="0.05" data-r="d"> <span data-o="d"></span> m</label>' +
      '  <div class="mech-presets">' +
      '    <button data-d="0.01">Rigid wall</button>' +
      '    <button data-d="0.08">Cupped hands</button>' +
      '    <button data-d="0.35">Airbag</button>' +
      '  </div>' +
      '  <button class="mech-go" data-go>Catch</button>' +
      '</div>';

    const svg = svgEl("svg", { viewBox: "0 0 320 140", class: "mech-svg" });
    const pad = svgEl("rect", { x: 250, y: 30, width: 18, height: 80, rx: 4, fill: "#b8c2cc" });
    const padFace = 250;
    const ball = svgEl("circle", { cx: 30, cy: 70, r: 12, fill: "#d64545" });
    const track = svgEl("line", { x1: 20, y1: 70, x2: 268, y2: 70, stroke: "#e2e6ea", "stroke-width": 2 });
    svg.appendChild(track); svg.appendChild(pad); svg.appendChild(ball);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "mech-readouts";
    readouts.innerHTML =
      '<div>Contact time Δt: <b data-o="dt">—</b></div>' +
      '<div>Average force: <b data-o="f">—</b></div>' +
      '<div>Impulse J = mΔv: <b data-o="j">—</b></div>' +
      '<div class="mech-verdict" data-o="verdict">—</div>';
    host.appendChild(readouts);

    const q = (sel) => host.querySelector(sel);
    const mS = q('[data-r="m"]'), vS = q('[data-r="v"]'), dS = q('[data-r="d"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    let animating = false, rafId = null;

    function state() {
      const m = parseFloat(mS.value), v = parseFloat(vS.value), d = parseFloat(dS.value);
      const a = (v * v) / (2 * d);   // constant deceleration to rest over distance d
      const dt = v / a;              // = 2d/v
      const F = m * a;               // = J/dt
      const J = m * v;
      return { m, v, d, a, dt, F, J };
    }

    function redraw() {
      const s = state();
      out("m").textContent = s.m.toFixed(1);
      out("v").textContent = s.v.toFixed(0);
      out("d").textContent = s.d.toFixed(2);
      out("dt").textContent = (s.dt * 1000).toFixed(1) + " ms";
      out("f").textContent = s.F.toFixed(0) + " N";
      out("j").textContent = s.J.toFixed(1) + " kg·m/s";
      out("verdict").textContent =
        s.F > 3000 ? "Bone-breaking — a rigid, near-instant stop" :
        s.F > 600 ? "A sharp, jarring impact" :
        "Gentle — the long stop keeps force low";
      const dPx = clamp(s.d * 300, 8, 150);
      ball.setAttribute("cx", padFace - 12 - dPx);
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      redraw();
    }
    [mS, vS, dS].forEach((s) => s.addEventListener("input", reset));
    host.querySelectorAll(".mech-presets button").forEach((btn) => {
      btn.addEventListener("click", () => {
        host.querySelectorAll(".mech-presets button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        dS.value = btn.dataset.d;
        reset();
      });
    });
    redraw();

    q("[data-go]").addEventListener("click", () => {
      if (animating) { reset(); return; }
      const s = state();
      const dPx = clamp(s.d * 300, 8, 150);
      const startX = padFace - 12 - dPx;
      const approachX = 30;
      // Phase 1: constant-speed approach; Phase 2: decelerate over dPx into pad.
      const approachDist = startX - approachX;
      const tApproach = approachDist / (s.v * 12); // px scale
      ball.setAttribute("cx", approachX);
      animating = true;
      const start = performance.now();
      function frame(now) {
        const t = (now - start) / 1000;
        let x;
        if (t < tApproach) {
          x = approachX + s.v * 12 * t;
        } else {
          const tau = clamp(t - tApproach, 0, s.dt);
          const frac = 1 - (1 - tau / s.dt) * (1 - tau / s.dt); // ease to stop
          x = startX + dPx * frac;
          if (tau >= s.dt) { ball.setAttribute("cx", startX + dPx); animating = false; return; }
        }
        ball.setAttribute("cx", x);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ===============================================================
  // NEW Widget (Collisions) -- Bowling-Pin Scatter  [host: #bowlHost]
  // Qualitative multi-object momentum demo; self-builds its DOM.
  // ===============================================================
  function initBowlingPins() {
    const host = document.getElementById("bowlHost");
    if (!host) return;
    host.classList.add("mech-widget");
    host.innerHTML =
      '<div class="mech-controls">' +
      '  <label>Ball speed <input type="range" min="4" max="16" step="1" value="10" data-r="v"> <span data-o="v"></span> m/s</label>' +
      '  <label>Aim offset <input type="range" min="-14" max="14" step="1" value="0" data-r="b"> <span data-o="b"></span></label>' +
      '  <button class="mech-go" data-go>Roll</button>' +
      '</div>';

    const svg = svgEl("svg", { viewBox: "0 0 360 180", class: "mech-svg" });
    svg.appendChild(svgEl("rect", { x: 0, y: 30, width: 360, height: 120, fill: "#f4efe4" }));
    const ball = svgEl("circle", { cx: 24, cy: 90, r: 12, fill: "#2a2a2a" });
    // Triangle of pins
    const layout = [[250, 90], [285, 72], [285, 108], [320, 54], [320, 90], [320, 126]];
    const pins = layout.map(([x, y]) =>
      svgEl("circle", { cx: x, cy: y, r: 7, fill: "#f5f5f5", stroke: "#c94b4b", "stroke-width": 2 }));
    pins.forEach((p) => svg.appendChild(p));
    svg.appendChild(ball);
    host.appendChild(svg);

    const q = (sel) => host.querySelector(sel);
    const vS = q('[data-r="v"]'), bS = q('[data-r="b"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    let animating = false, rafId = null;

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      ball.setAttribute("cx", 24); ball.setAttribute("cy", 90); ball.setAttribute("opacity", 1);
      layout.forEach(([x, y], i) => {
        pins[i].setAttribute("cx", x); pins[i].setAttribute("cy", y); pins[i].setAttribute("opacity", 1);
      });
      out("v").textContent = vS.value;
      out("b").textContent = bS.value;
    }
    [vS, bS].forEach((s) => s.addEventListener("input", reset));
    reset();

    q("[data-go]").addEventListener("click", () => {
      if (animating) { reset(); return; }
      reset();
      const v = parseFloat(vS.value), b = parseFloat(bS.value);
      const hitX = 250, ballY0 = 90 + b;
      ball.setAttribute("cy", ballY0);
      // Scatter velocities: forward-biased, spread by aim offset (momentum roughly forward).
      const vel = layout.map(([x, y]) => {
        const dx = (x - hitX) + 40;
        const dy = (y - ballY0) + (Math.random() - 0.5) * 20;
        const n = Math.hypot(dx, dy) || 1;
        const sp = (0.4 + Math.random() * 0.5) * v;
        return { vx: (dx / n) * sp, vy: (dy / n) * sp };
      });

      animating = true;
      const start = performance.now();
      const CONTACT = (hitX - 24) / (v * 22);
      function frame(now) {
        const t = (now - start) / 1000;
        if (t < CONTACT) {
          ball.setAttribute("cx", 24 + v * 22 * t);
        } else {
          const t2 = t - CONTACT;
          ball.setAttribute("cx", hitX + v * 6 * t2); // ball slows, keeps rolling
          ball.setAttribute("opacity", clamp(1 - t2 * 0.4, 0.2, 1));
          layout.forEach(([x, y], i) => {
            pins[i].setAttribute("cx", x + vel[i].vx * 22 * t2);
            pins[i].setAttribute("cy", clamp(y + vel[i].vy * 22 * t2, 34, 146));
            pins[i].setAttribute("opacity", clamp(1 - t2 * 0.25, 0, 1));
          });
          if (t2 > 3.5) { animating = false; return; }
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initCartCollision();
    initCannonRecoil();
    initImpulseGraph();
    initSafetyBar();
    initCollisionLab();
    initCradle();
    initBilliards();
    initCOMVisualizer();
    initCOMExplosion();
    initBallisticPendulum();
    // Optional new widgets (safe no-op until their host div is added):
    initHardSoftCatch();
    initBowlingPins();
  });
})();
