// Interactive widgets for docs/04-momentum/index.html.
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
  // Widget 1 (Momentum) -- Two-Cart Collision Lab
  // ---------------------------------------------------------------
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

    const A_X0 = 80, B_X0 = 320, CENTER = 200, PXPS = 6, T_BEFORE = 1.2, T_AFTER = 1.2;
    let animating = false, rafId = null;

    function current() {
      const mA = parseFloat(maSlider.value);
      const vA = parseFloat(vaSlider.value);
      const mB = parseFloat(mbSlider.value);
      const vB = parseFloat(vbSlider.value);
      const pBefore = mA * vA + mB * vB;
      const vf = pBefore / (mA + mB);
      const pAfter = (mA + mB) * vf;
      return { mA, vA, mB, vB, pBefore, vf, pAfter };
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
    [maSlider, vaSlider, mbSlider, vbSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    cartA.setAttribute("x", A_X0 - 20);
    cartB.setAttribute("x", B_X0 - 20);
    cartA.setAttribute("opacity", 1);
    cartB.setAttribute("opacity", 1);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      cartA.setAttribute("x", A_X0 - 20);
      cartB.setAttribute("x", B_X0 - 20);
      cartA.setAttribute("opacity", 1);
      cartB.setAttribute("opacity", 1);
      const { vA, vB, vf } = current();

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= T_BEFORE) {
          cartA.setAttribute("x", A_X0 - 20 + vA * t * PXPS);
          cartB.setAttribute("x", B_X0 - 20 + vB * t * PXPS);
        } else {
          const t2 = t - T_BEFORE;
          cartB.setAttribute("opacity", 0);
          cartA.setAttribute("x", CENTER - 20 + vf * t2 * PXPS);
        }
        if (t >= T_BEFORE + T_AFTER) {
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
  // Widget 2 (Momentum) -- Recoil: Firing a Cannon
  // ---------------------------------------------------------------
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

    const CANNON_X0 = 200, SHELL_X0 = 258, ANIM_SECONDS = 1.5, PXPS = 1.2;
    let animating = false, rafId = null;

    function current() {
      const M = parseFloat(mSlider.value);
      const m = parseFloat(shellMSlider.value);
      const vShell = parseFloat(shellVSlider.value);
      const shellP = m * vShell;
      const recoilV = -shellP / M;
      const total = M * recoilV + m * vShell;
      return { M, m, vShell, shellP, recoilV, total };
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
    [mSlider, shellMSlider, shellVSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    cannonBody.setAttribute("x", CANNON_X0);
    shell.setAttribute("cx", SHELL_X0);
    shell.setAttribute("opacity", 1);

    fireBtn.addEventListener("click", () => {
      if (animating) return;
      cannonBody.setAttribute("x", CANNON_X0);
      shell.setAttribute("cx", SHELL_X0);
      shell.setAttribute("opacity", 1);
      const { recoilV } = current();

      animating = true;
      fireBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        cannonBody.setAttribute("x", CANNON_X0 + recoilV * t * PXPS);
        const shellX = SHELL_X0 + parseFloat(shellVSlider.value) * t * PXPS * 0.3;
        shell.setAttribute("cx", shellX);
        if (shellX > 450) shell.setAttribute("opacity", 0);
        if (t >= ANIM_SECONDS) {
          animating = false;
          fireBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Impulse) -- Force-Time Graph Explorer
  // ---------------------------------------------------------------
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

    const T_MAX = 1, F_MAX_REF = 20000;
    const toX = (t) => 40 + (t / T_MAX) * 400;

    function redraw() {
      const m = parseFloat(mSlider.value);
      const dv = parseFloat(dvSlider.value);
      const dt = parseFloat(dtSlider.value);
      const j = m * dv;
      const f = j / dt;

      mVal.textContent = m + " kg";
      dvVal.textContent = dv + " m/s";
      dtVal.textContent = dt.toFixed(2) + " s";
      jVal.textContent = j.toFixed(0) + " kg·m/s";
      fVal.textContent = f.toFixed(0) + " N";

      const yMax = Math.max(f * 1.1, F_MAX_REF * 0.02);
      const toY = (force) => 150 - (clamp(force, 0, yMax) / yMax) * 140;
      linePath.setAttribute("d", "M" + toX(0) + "," + toY(f) + " L" + toX(dt) + "," + toY(f));
      areaPath.setAttribute(
        "d",
        "M" + toX(0) + "," + toY(0) + " L" + toX(dt) + "," + toY(0) + " L" + toX(dt) + "," + toY(f) + " L" + toX(0) + "," + toY(f) + " Z"
      );
    }
    [mSlider, dvSlider, dtSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Impulse) -- Same Stop, Different Time
  // ---------------------------------------------------------------
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
    const BAR_MAX_H = 100, F_REF = 20000;

    function redraw() {
      const m = parseFloat(mSlider.value);
      const dv = parseFloat(dvSlider.value);
      const j = m * dv;
      const f = j / dt;

      mVal.textContent = m + " kg";
      dvVal.textContent = dv + " m/s";
      dtVal.textContent = dt.toFixed(3) + " s";
      jVal.textContent = j.toFixed(1) + " kg·m/s";
      fVal.textContent = f.toFixed(0) + " N";

      const h = clamp((f / F_REF) * BAR_MAX_H, 2, BAR_MAX_H);
      bar.setAttribute("y", 120 - h);
      bar.setAttribute("height", h);
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

  // ---------------------------------------------------------------
  // Widget 1 (Collisions) -- Collision Laboratory (variable elasticity)
  // ---------------------------------------------------------------
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

    const A_X0 = 100, B_X0 = 300, CENTER = 200, PXPS = 6, T_BEFORE = 1.0, T_AFTER = 1.2;
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

    function redraw() {
      const { e, m1, v1, m2, v2, v1f, v2f, pBefore, pAfter, keBefore, keAfter } = current();
      eVal.textContent = e.toFixed(2) + (e >= 0.99 ? " (elastic)" : e <= 0.01 ? " (perfectly inelastic)" : "");
      m1Val.textContent = m1 + " kg";
      v1Val.textContent = v1 + " m/s";
      m2Val.textContent = m2 + " kg";
      v2Val.textContent = v2 + " m/s";
      pVal.textContent = pBefore.toFixed(1) + " / " + pAfter.toFixed(1);
      vAfterVal.textContent = v1f.toFixed(1) + " / " + v2f.toFixed(1) + " m/s";
      keVal.textContent = keBefore.toFixed(1) + " / " + keAfter.toFixed(1) + " J";
    }
    [eSlider, m1Slider, v1Slider, m2Slider, v2Slider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    ballA.setAttribute("cx", A_X0);
    ballB.setAttribute("cx", B_X0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      ballA.setAttribute("cx", A_X0);
      ballB.setAttribute("cx", B_X0);
      const { v1, v2, v1f, v2f } = current();

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= T_BEFORE) {
          ballA.setAttribute("cx", A_X0 + v1 * t * PXPS);
          ballB.setAttribute("cx", B_X0 + v2 * t * PXPS);
        } else {
          const t2 = t - T_BEFORE;
          ballA.setAttribute("cx", CENTER - 20 + v1f * t2 * PXPS);
          ballB.setAttribute("cx", CENTER + 20 + v2f * t2 * PXPS);
        }
        if (t >= T_BEFORE + T_AFTER) {
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
  // Widget 2 (Collisions) -- Newton's Cradle
  // ---------------------------------------------------------------
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
    for (let i = 0; i < N; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", "16");
      c.setAttribute("fill", "#2a78d6");
      c.setAttribute("stroke", "white");
      c.setAttribute("stroke-width", "2");
      c.setAttribute("cx", X0 + i * DX);
      c.setAttribute("cy", Y_REST);
      group.appendChild(c);
      balls.push(c);
    }

    let animating = false, rafId = null;

    function reset() {
      const k = parseInt(kSlider.value, 10);
      outVal.textContent = k;
      for (let i = 0; i < N; i++) {
        if (i < k) {
          balls[i].setAttribute("cx", X0 + i * DX - PULL);
          balls[i].setAttribute("cy", Y_REST - LIFT);
        } else {
          balls[i].setAttribute("cx", X0 + i * DX);
          balls[i].setAttribute("cy", Y_REST);
        }
      }
    }
    kSlider.addEventListener("input", reset);
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const k = parseInt(kSlider.value, 10);
      const T1 = 0.4, T2 = 0.4, T3 = 0.4;
      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        for (let i = 0; i < k; i++) {
          if (t <= T1) {
            const f = t / T1;
            balls[i].setAttribute("cx", X0 + i * DX - PULL * (1 - f));
            balls[i].setAttribute("cy", Y_REST - LIFT * (1 - f));
          } else {
            balls[i].setAttribute("cx", X0 + i * DX);
            balls[i].setAttribute("cy", Y_REST);
          }
        }
        for (let j = N - k; j < N; j++) {
          if (t <= T1) {
            balls[j].setAttribute("cx", X0 + j * DX);
            balls[j].setAttribute("cy", Y_REST);
          } else if (t <= T1 + T2) {
            const f = (t - T1) / T2;
            balls[j].setAttribute("cx", X0 + j * DX + PULL * f);
            balls[j].setAttribute("cy", Y_REST - LIFT * f);
          } else if (t <= T1 + T2 + T3) {
            const f = (t - T1 - T2) / T3;
            balls[j].setAttribute("cx", X0 + j * DX + PULL * (1 - f));
            balls[j].setAttribute("cy", Y_REST - LIFT * (1 - f));
          } else {
            balls[j].setAttribute("cx", X0 + j * DX);
            balls[j].setAttribute("cy", Y_REST);
          }
        }
        if (t >= T1 + T2 + T3) {
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
  // Widget 3 (Collisions) -- Billiard Balls: 2D Momentum
  // ---------------------------------------------------------------
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
    let animating = false, rafId = null;

    function current() {
      const b = parseFloat(bSlider.value);
      const sinT = clamp(b / CONTACT_R, -1, 1);
      const theta = Math.asin(sinT);
      const cosT = Math.cos(theta);
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
      cue.setAttribute("cx", CUE_X0);
      cue.setAttribute("cy", Y0);
      target.setAttribute("cx", TARGET_X0);
      target.setAttribute("cy", Y0);
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
      if (animating) return;
      reset();
      const { targetSpeed, targetDir, cueSpeed, cueDir } = current();
      const T_APPROACH = 0.8, T_SPLIT = 1.0;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= T_APPROACH) {
          const f = t / T_APPROACH;
          cue.setAttribute("cx", CUE_X0 + (TARGET_X0 - CUE_X0 - CONTACT_R) * f);
        } else {
          const t2 = t - T_APPROACH;
          const cx0 = CUE_X0 + (TARGET_X0 - CUE_X0 - CONTACT_R);
          cue.setAttribute("cx", cx0 + cueDir.x * cueSpeed * t2 * PXPU);
          cue.setAttribute("cy", Y0 + cueDir.y * cueSpeed * t2 * PXPU);
          target.setAttribute("cx", TARGET_X0 + targetDir.x * targetSpeed * t2 * PXPU);
          target.setAttribute("cy", Y0 + targetDir.y * targetSpeed * t2 * PXPU);
          cuePath.setAttribute("x2", cue.getAttribute("cx"));
          cuePath.setAttribute("y2", cue.getAttribute("cy"));
          targetPath.setAttribute("x2", target.getAttribute("cx"));
          targetPath.setAttribute("y2", target.getAttribute("cy"));
        }
        if (t >= T_APPROACH + T_SPLIT) {
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
  // Widget 1 (Center of Mass) -- Center-of-Mass Visualizer
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // Widget 2 (Center of Mass) -- Explosions and the Center of Mass
  // ---------------------------------------------------------------
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

    function pos(t) {
      return { x: X0 + vx0 * t * PXPM, y: Y0 - (vy0 * t - 0.5 * G * t * t) * PXPM };
    }

    let d = "";
    for (let i = 0; i <= 40; i++) {
      const t = (T_TOTAL * i) / 40;
      const p = pos(t);
      d += (i === 0 ? "M" : "L") + p.x + "," + p.y + " ";
    }
    ghostPath.setAttribute("d", d);

    dvSlider.addEventListener("input", () => { dvVal.textContent = dvSlider.value + " m/s"; });
    dvVal.textContent = dvSlider.value + " m/s";

    let animating = false, rafId = null;

    function resetVisual() {
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
      if (animating) return;
      resetVisual();
      const dv = parseFloat(dvSlider.value);
      const explodePos = pos(T_EXPLODE);
      const vAx = vx0 + dv, vAy = vy0 - G * T_EXPLODE - dv * 0.6;
      const vBx = vx0 - dv, vBy = vy0 - G * T_EXPLODE + dv * 0.6;

      animating = true;
      goBtn.disabled = true;
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
        if (t >= T_TOTAL) {
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
  // Widget 1 (Ballistic Pendulum) -- Ballistic Pendulum Calculator
  // ---------------------------------------------------------------
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
    [vSlider, mSlider, bigMSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
    place(0);
    bullet.setAttribute("cx", 20);
    bullet.setAttribute("cy", 185);
    bullet.setAttribute("opacity", 1);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      place(0);
      bullet.setAttribute("cx", 20);
      bullet.setAttribute("cy", 185);
      bullet.setAttribute("opacity", 1);
      const { h } = current();
      const theta = Math.acos(clamp(1 - h / L_PHYS, -1, 1));
      const T1 = 0.5, T2 = 1.0;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000);
        if (t <= T1) {
          const f = t / T1;
          bullet.setAttribute("cx", 20 + (130 - 20) * f);
        } else if (t <= T1 + T2) {
          bullet.setAttribute("opacity", 0);
          const f = (t - T1) / T2;
          place(theta * Math.sin((Math.PI / 2) * f));
        } else {
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
  });
})();
