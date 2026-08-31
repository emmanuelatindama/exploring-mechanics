// docs/01-kinematics/index.html widgets: constant velocity, constant
// acceleration, free fall, projectile motion, and relative motion.
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    return el;
  }
  const D2R = Math.PI / 180;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function clientToSvg(svg, evt) {
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const sx = vb.width / rect.width, sy = vb.height / rect.height;
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
    handle.addEventListener("pointerup", () => { handle.style.cursor = "grab"; });
  }

  /* ---- shared projectile math (no drag): used by widgets 1, 2, 3, 4 ---- */
  function computeIdealTrajectory(v0, thDeg, y0, g, numPoints) {
    numPoints = numPoints || 50;
    const th = thDeg * D2R;
    const vx = v0 * Math.cos(th);
    const vy0 = v0 * Math.sin(th);
    const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * y0)) / g;
    const H = y0 + (vy0 * vy0) / (2 * g);
    const R = vx * T;
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * T;
      points.push({ t, x: vx * t, y: y0 + vy0 * t - 0.5 * g * t * t });
    }
    return { points, T, R, H, vx, vy0 };
  }

  function integrateDrag(v0, thDeg, y0, g, b, dt) {
    dt = dt || 0.02;
    const th = thDeg * D2R;
    let vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
    let x = 0, y = y0, t = 0;
    const points = [{ t, x, y }];
    for (let i = 0; i < 2000; i++) {
      const v = Math.hypot(vx, vy);
      const ax = -b * v * vx, ay = -g - b * v * vy;
      vx += ax * dt; vy += ay * dt;
      const nx = x + vx * dt, ny = y + vy * dt;
      t += dt;
      if (ny < 0) {
        const frac = y / (y - ny);
        points.push({ t, x: x + (nx - x) * frac, y: 0 });
        return { points, T: t, R: x + (nx - x) * frac };
      }
      x = nx; y = ny;
      points.push({ t, x, y });
    }
    return { points, T: t, R: x };
  }

  function pathD(points, toX, toY) {
    if (!points.length) return "";
    let d = "M " + toX(points[0].x) + " " + toY(points[0].y);
    for (let i = 1; i < points.length; i++) d += " L " + toX(points[i].x) + " " + toY(points[i].y);
    return d;
  }

  /* ===================== WIDGET 1: EXPLORER ===================== */
  function initExplorer() {
    const v0Slider = document.getElementById("v0Slider");
    if (!v0Slider) return;
    const thSlider = document.getElementById("thSlider"), y0Slider = document.getElementById("y0Slider"), gSlider = document.getElementById("gSlider");
    const v0Val = document.getElementById("v0Val"), thVal = document.getElementById("thVal"), y0Val = document.getElementById("y0Val"), gVal = document.getElementById("gVal");
    const wallToggle = document.getElementById("explorerWallToggle");
    const dragToggle = document.getElementById("dragToggle"), dragRow = document.getElementById("dragRow"), dragSlider = document.getElementById("dragSlider"), dragVal = document.getElementById("dragVal");
    const playBtn = document.getElementById("explorerPlay");
    const rangeVal = document.getElementById("rangeVal"), heightVal = document.getElementById("heightVal"), flightVal = document.getElementById("flightVal");
    const dragRangeRow = document.getElementById("dragRangeRow"), dragRangeVal = document.getElementById("dragRangeVal");
    const pathIdeal = document.getElementById("explorerPathIdeal"), pathDrag = document.getElementById("explorerPathDrag");
    const ball = document.getElementById("explorerBall");
    const wallGroup = document.getElementById("explorerWall"), wallRect = document.getElementById("explorerWallRect");
    const verdict = document.getElementById("explorerVerdict");
    const hatch = document.getElementById("explorerGroundHatch");
    const presetRow = document.getElementById("presetRow");

    for (let x = 45; x <= 495; x += 20) hatch.appendChild(svgEl("line", { x1: x, y1: 220, x2: x - 7, y2: 232, class: "svg-grid" }));

    const MARGIN_L = 40, DOMAIN_X = 50, DOMAIN_Y = 26, GROUND = 220, TOP = 20;
    const PXM_X = (470 - MARGIN_L) / DOMAIN_X, PXM_Y = (GROUND - TOP) / DOMAIN_Y;
    const toX = (xm) => MARGIN_L + xm * PXM_X;
    const toY = (ym) => GROUND - ym * PXM_Y;
    const WALL_X = 9, WALL_H = 2;

    let currentPoints = null, animating = false;

    function render() {
      const v0 = +v0Slider.value, th = +thSlider.value, y0 = +y0Slider.value, g = +gSlider.value;
      v0Val.textContent = v0 + " m/s"; thVal.textContent = th + "°"; y0Val.textContent = y0.toFixed(1) + " m"; gVal.textContent = g.toFixed(1) + " m/s²";

      const ideal = computeIdealTrajectory(v0, th, y0, g);
      currentPoints = ideal.points;
      pathIdeal.setAttribute("d", pathD(ideal.points, toX, toY));
      rangeVal.textContent = ideal.R.toFixed(1) + " m";
      heightVal.textContent = ideal.H.toFixed(1) + " m";
      flightVal.textContent = ideal.T.toFixed(2) + " s";

      if (!animating) {
        ball.setAttribute("cx", toX(0)); ball.setAttribute("cy", toY(y0));
      }

      if (wallToggle.checked) {
        wallGroup.style.display = "";
        const wx = toX(WALL_X);
        wallRect.setAttribute("x", wx - 3); wallRect.setAttribute("width", 6);
        wallRect.setAttribute("y", toY(WALL_H)); wallRect.setAttribute("height", GROUND - toY(WALL_H));
        const tAtWall = ideal.vx > 0 ? WALL_X / ideal.vx : Infinity;
        if (tAtWall > ideal.T) {
          verdict.textContent = "Falls short of the wall"; verdict.setAttribute("fill", "#898781");
        } else {
          const yAtWall = y0 + ideal.vy0 * tAtWall - 0.5 * g * tAtWall * tAtWall;
          if (yAtWall >= WALL_H) { verdict.textContent = "Cleared the wall! ✓"; verdict.setAttribute("fill", "#1baf7a"); }
          else { verdict.textContent = "Blocked by the wall ✕"; verdict.setAttribute("fill", "#e34948"); }
        }
      } else {
        wallGroup.style.display = "none";
        verdict.textContent = "";
      }

      if (dragToggle.checked) {
        const b = +dragSlider.value;
        dragVal.textContent = b.toFixed(3);
        const drag = integrateDrag(v0, th, y0, g, b);
        pathDrag.style.display = ""; pathDrag.setAttribute("d", pathD(drag.points, toX, toY));
        dragRangeRow.style.display = ""; dragRangeVal.textContent = drag.R.toFixed(1) + " m";
      } else {
        pathDrag.style.display = "none"; dragRangeRow.style.display = "none";
      }
    }

    function animate() {
      if (!currentPoints || animating) return;
      animating = true;
      const start = performance.now(), duration = 1400;
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const idx = Math.floor(frac * (currentPoints.length - 1));
        const p = currentPoints[idx];
        ball.setAttribute("cx", toX(p.x)); ball.setAttribute("cy", toY(p.y));
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    }

    [v0Slider, thSlider, y0Slider, gSlider, dragSlider].forEach((el) => el.addEventListener("input", render));
    wallToggle.addEventListener("change", render);
    dragToggle.addEventListener("change", () => { dragRow.style.display = dragToggle.checked ? "" : "none"; render(); });
    playBtn.addEventListener("click", animate);

    const presets = {
      basketball: { v0: 7, th: 52, y0: 2.0, g: 9.8, wall: false },
      soccer: { v0: 25, th: 18, y0: 0.3, g: 9.8, wall: false },
      fountain: { v0: 5, th: 75, y0: 0.3, g: 9.8, wall: false },
      wall: { v0: 15, th: 40, y0: 0, g: 9.8, wall: true },
      catapult: { v0: 18, th: 35, y0: 1.0, g: 9.8, wall: false },
    };
    presetRow.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-preset]");
      if (!btn) return;
      Array.from(presetRow.children).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const p = presets[btn.dataset.preset];
      v0Slider.value = p.v0; thSlider.value = p.th; y0Slider.value = p.y0; gSlider.value = p.g;
      wallToggle.checked = !!p.wall;
      render();
    });

    render();
  }

  /* ===================== WIDGET 2: TARGET CHALLENGE ===================== */
  function initTargetChallenge() {
    const v0Slider = document.getElementById("tV0Slider");
    if (!v0Slider) return;
    const thSlider = document.getElementById("tThSlider");
    const v0Val = document.getElementById("tV0Val"), thVal = document.getElementById("tThVal");
    const launchBtn = document.getElementById("targetLaunch"), newBtn = document.getElementById("targetNew");
    const distVal = document.getElementById("targetDist"), predVal = document.getElementById("targetPredicted"), resultVal = document.getElementById("targetResult");
    const preview = document.getElementById("targetPreview"), solid = document.getElementById("targetPath");
    const ball = document.getElementById("targetBall");
    const mark = document.getElementById("targetMark");

    const MARGIN_L = 20, DOMAIN_X = 48, DOMAIN_Y = 24, GROUND = 220, TOP = 20, G = 9.8;
    const PXM_X = (440 - MARGIN_L) / DOMAIN_X, PXM_Y = (GROUND - TOP) / DOMAIN_Y;
    const toX = (xm) => MARGIN_L + xm * PXM_X;
    const toY = (ym) => GROUND - ym * PXM_Y;

    let targetX = 25, currentPoints = null, animating = false;

    function render() {
      const v0 = +v0Slider.value, th = +thSlider.value;
      v0Val.textContent = v0 + " m/s"; thVal.textContent = th + "°";
      const ideal = computeIdealTrajectory(v0, th, 0, G);
      currentPoints = ideal.points;
      preview.setAttribute("d", pathD(ideal.points, toX, toY));
      distVal.textContent = targetX.toFixed(1) + " m";
      predVal.textContent = ideal.R.toFixed(1) + " m";
      const miss = Math.abs(ideal.R - targetX);
      resultVal.innerHTML = miss < 0.4
        ? '<span class="verdict-badge good">🎯 Hit!</span>'
        : `<span class="verdict-badge bad">Miss by ${miss.toFixed(1)} m</span>`;
      if (!animating) { ball.setAttribute("cx", toX(0)); ball.setAttribute("cy", toY(0)); }
    }

    function placeTarget() {
      mark.querySelector("line").setAttribute("x1", toX(targetX));
      mark.querySelector("line").setAttribute("x2", toX(targetX));
      mark.querySelector("circle").setAttribute("cx", toX(targetX));
    }

    launchBtn.addEventListener("click", () => {
      if (!currentPoints || animating) return;
      animating = true; solid.style.display = ""; solid.setAttribute("d", preview.getAttribute("d"));
      const start = performance.now(), duration = 1200;
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const idx = Math.floor(frac * (currentPoints.length - 1));
        const p = currentPoints[idx];
        ball.setAttribute("cx", toX(p.x)); ball.setAttribute("cy", toY(p.y));
        if (frac < 1) requestAnimationFrame(step);
        else { animating = false; }
      }
      requestAnimationFrame(step);
    });

    newBtn.addEventListener("click", () => {
      targetX = Math.round(15 + Math.random() * 30);
      placeTarget(); solid.style.display = "none"; render();
    });

    [v0Slider, thSlider].forEach((el) => el.addEventListener("input", render));
    placeTarget();
    render();
  }

  /* ===================== WIDGET 3: INTERCEPTION LAB ===================== */
  function initInterceptionLab() {
    const toggle = document.getElementById("interceptModeToggle");
    if (!toggle) return;
    const carsMode = document.getElementById("interceptCarsMode"), throwMode = document.getElementById("interceptThrowMode");

    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn) return;
      Array.from(toggle.children).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.mode;
      carsMode.style.display = mode === "cars" ? "" : "none";
      throwMode.style.display = mode === "throw" ? "" : "none";
    });

    /* ---- Mode A: two vehicles ---- */
    (function () {
      const aY0Slider = document.getElementById("aY0Slider"), aSpeedSlider = document.getElementById("aSpeedSlider");
      const bX0Slider = document.getElementById("bX0Slider"), bHeadSlider = document.getElementById("bHeadSlider"), bSpeedSlider = document.getElementById("bSpeedSlider");
      const aPosVal = document.getElementById("aPosVal"), aSpeedVal = document.getElementById("aSpeedVal");
      const bPosVal = document.getElementById("bPosVal"), bHeadVal = document.getElementById("bHeadVal"), bSpeedVal = document.getElementById("bSpeedVal");
      const runBtn = document.getElementById("carsPlay");
      const closestVal = document.getElementById("carsClosest"), closestTVal = document.getElementById("carsClosestT"), verdictVal = document.getElementById("carsVerdict");
      const pathA = document.getElementById("carsPathA"), pathB = document.getElementById("carsPathB");
      const carA = document.getElementById("carA"), carB = document.getElementById("carB"), mark = document.getElementById("carsClosestMark");
      const gridG = document.getElementById("carsGrid");

      const PXM = 5, CX = 230, CY = 230;
      const toX = (xm) => CX + xm * PXM, toY = (ym) => CY - ym * PXM;
      for (let i = -40; i <= 40; i += 10) {
        gridG.appendChild(svgEl("line", { x1: toX(i), y1: 10, x2: toX(i), y2: 450, class: "svg-grid" }));
        gridG.appendChild(svgEl("line", { x1: 10, y1: toY(i), x2: 450, y2: toY(i), class: "svg-grid" }));
      }

      const POS_A0 = { x: -30 };
      let animating = false, lastComputed = null;

      function compute() {
        const aY0 = +aY0Slider.value, aSpeed = +aSpeedSlider.value;
        const bX0 = +bX0Slider.value, bHead = +bHeadSlider.value, bSpeed = +bSpeedSlider.value;
        aPosVal.textContent = `(-30, ${aY0}) m`; aSpeedVal.textContent = aSpeed + " m/s";
        bPosVal.textContent = `(${bX0}, -30) m`; bHeadVal.textContent = bHead + "°"; bSpeedVal.textContent = bSpeed + " m/s";

        const posA0 = { x: POS_A0.x, y: aY0 };
        const velA = { x: aSpeed, y: 0 };
        const posB0 = { x: bX0, y: -30 };
        const headRad = bHead * D2R;
        const velB = { x: bSpeed * Math.cos(headRad), y: bSpeed * Math.sin(headRad) };
        const dp = { x: posB0.x - posA0.x, y: posB0.y - posA0.y };
        const dv = { x: velB.x - velA.x, y: velB.y - velA.y };
        const dvSq = dv.x * dv.x + dv.y * dv.y;
        let tStar = dvSq < 1e-6 ? 0 : -(dp.x * dv.x + dp.y * dv.y) / dvSq;
        tStar = Math.max(0, tStar);
        const rAtStar = { x: dp.x + dv.x * tStar, y: dp.y + dv.y * tStar };
        const minSep = Math.hypot(rAtStar.x, rAtStar.y);

        return { posA0, velA, posB0, velB, tStar, minSep };
      }

      function render() {
        const c = compute();
        lastComputed = c;
        const tMax = Math.max(c.tStar * 1.4, 4);
        const aEnd = { x: c.posA0.x + c.velA.x * tMax, y: c.posA0.y + c.velA.y * tMax };
        const bEnd = { x: c.posB0.x + c.velB.x * tMax, y: c.posB0.y + c.velB.y * tMax };
        pathA.setAttribute("d", `M ${toX(c.posA0.x)} ${toY(c.posA0.y)} L ${toX(aEnd.x)} ${toY(aEnd.y)}`);
        pathB.setAttribute("d", `M ${toX(c.posB0.x)} ${toY(c.posB0.y)} L ${toX(bEnd.x)} ${toY(bEnd.y)}`);

        closestVal.textContent = c.minSep.toFixed(1) + " m";
        closestTVal.textContent = c.tStar.toFixed(1) + " s";
        const collision = c.minSep < 3;
        verdictVal.innerHTML = collision
          ? '<span class="verdict-badge bad">Collision course!</span>'
          : '<span class="verdict-badge good">Passes safely</span>';

        if (c.tStar <= tMax) {
          const aAt = { x: c.posA0.x + c.velA.x * c.tStar, y: c.posA0.y + c.velA.y * c.tStar };
          const bAt = { x: c.posB0.x + c.velB.x * c.tStar, y: c.posB0.y + c.velB.y * c.tStar };
          mark.style.display = "";
          mark.setAttribute("cx", toX((aAt.x + bAt.x) / 2));
          mark.setAttribute("cy", toY((aAt.y + bAt.y) / 2));
        } else mark.style.display = "none";

        if (!animating) {
          carA.setAttribute("transform", `translate(${toX(c.posA0.x)},${toY(c.posA0.y)})`);
          carB.setAttribute("transform", `translate(${toX(c.posB0.x)},${toY(c.posB0.y)})`);
        }
      }

      runBtn.addEventListener("click", () => {
        if (animating || !lastComputed) return;
        animating = true;
        const c = lastComputed;
        const tMax = Math.max(c.tStar * 1.4, 4);
        const start = performance.now(), duration = 2200;
        function step(now) {
          const frac = Math.max(0, Math.min(1, (now - start) / duration));
          const t = frac * tMax;
          const aAt = { x: c.posA0.x + c.velA.x * t, y: c.posA0.y + c.velA.y * t };
          const bAt = { x: c.posB0.x + c.velB.x * t, y: c.posB0.y + c.velB.y * t };
          const angA = Math.atan2(-c.velA.y, c.velA.x) * (180 / Math.PI);
          const angB = Math.atan2(-c.velB.y, c.velB.x) * (180 / Math.PI);
          carA.setAttribute("transform", `translate(${toX(aAt.x)},${toY(aAt.y)}) rotate(${angA})`);
          carB.setAttribute("transform", `translate(${toX(bAt.x)},${toY(bAt.y)}) rotate(${angB})`);
          if (frac < 1) requestAnimationFrame(step);
          else animating = false;
        }
        requestAnimationFrame(step);
      });

      [aY0Slider, aSpeedSlider, bX0Slider, bHeadSlider, bSpeedSlider].forEach((el) => el.addEventListener("input", render));
      render();
    })();

    /* ---- Mode B: thrown projectile vs moving target ---- */
    (function () {
      const v0Slider = document.getElementById("thV0Slider"), thSlider = document.getElementById("thThSlider");
      const x0Slider = document.getElementById("thX0Slider"), vtSlider = document.getElementById("thVtSlider");
      const v0Val = document.getElementById("thV0Val"), thVal = document.getElementById("thThVal");
      const x0Val = document.getElementById("thX0Val"), vtVal = document.getElementById("thVtVal");
      const flightVal = document.getElementById("thFlight"), landVal = document.getElementById("thLand"), targetPosVal = document.getElementById("thTargetPos"), missVal = document.getElementById("thMiss");
      const preview = document.getElementById("throwPreview"), solid = document.getElementById("throwPath");
      const ball = document.getElementById("throwBall"), targetRect = document.getElementById("throwTarget");
      const launchBtn = document.getElementById("throwLaunch");
      const verdict = document.getElementById("throwVerdict");
      if (!v0Slider) return;

      const G = 9.8, MARGIN_L = 20, DOMAIN_X = 70, DOMAIN_Y = 35, GROUND = 220, TOP = 20;
      const PXM_X = (470 - MARGIN_L) / DOMAIN_X, PXM_Y = (GROUND - TOP) / DOMAIN_Y;
      const toX = (xm) => MARGIN_L + xm * PXM_X;
      const toY = (ym) => GROUND - ym * PXM_Y;

      let currentPoints = null, animating = false;

      function render() {
        const v0 = +v0Slider.value, th = +thSlider.value, x0 = +x0Slider.value, vt = +vtSlider.value;
        v0Val.textContent = v0 + " m/s"; thVal.textContent = th + "°"; x0Val.textContent = x0 + " m"; vtVal.textContent = vt.toFixed(1) + " m/s";
        const ideal = computeIdealTrajectory(v0, th, 0, G);
        currentPoints = ideal.points;
        preview.setAttribute("d", pathD(ideal.points, toX, toY));
        const targetAtT = x0 + vt * ideal.T;
        const miss = Math.abs(ideal.R - targetAtT);
        flightVal.textContent = ideal.T.toFixed(2) + " s";
        landVal.textContent = ideal.R.toFixed(1) + " m";
        targetPosVal.textContent = targetAtT.toFixed(1) + " m";
        missVal.innerHTML = miss < 1.2
          ? '<span class="verdict-badge good">' + miss.toFixed(1) + " m — close enough!</span>"
          : '<span class="verdict-badge bad">' + miss.toFixed(1) + " m</span>";
        if (!animating) {
          ball.setAttribute("cx", toX(0)); ball.setAttribute("cy", toY(0));
          targetRect.setAttribute("x", toX(x0) - 8); targetRect.setAttribute("y", 205);
        }
        verdict.textContent = "";
      }

      launchBtn.addEventListener("click", () => {
        if (!currentPoints || animating) return;
        animating = true; solid.style.display = ""; solid.setAttribute("d", preview.getAttribute("d"));
        const v0 = +v0Slider.value, th = +thSlider.value, x0 = +x0Slider.value, vt = +vtSlider.value;
        const T = computeIdealTrajectory(v0, th, 0, G).T;
        const start = performance.now(), duration = 1500;
        function step(now) {
          const frac = Math.max(0, Math.min(1, (now - start) / duration));
          const idx = Math.floor(frac * (currentPoints.length - 1));
          const p = currentPoints[idx];
          ball.setAttribute("cx", toX(p.x)); ball.setAttribute("cy", toY(p.y));
          const tSim = frac * T;
          targetRect.setAttribute("x", toX(x0 + vt * tSim) - 8);
          if (frac < 1) requestAnimationFrame(step);
          else {
            animating = false;
            const finalTargetX = x0 + vt * T;
            const finalMiss = Math.abs(p.x - finalTargetX);
            verdict.textContent = finalMiss < 1.2 ? "HIT" : "MISS";
            verdict.setAttribute("fill", finalMiss < 1.2 ? "#1baf7a" : "#e34948");
          }
        }
        requestAnimationFrame(step);
      });

      [v0Slider, thSlider, x0Slider, vtSlider].forEach((el) => el.addEventListener("input", render));
      render();
    })();
  }

  /* ===================== WIDGET 4: 3D INTERCEPT ===================== */
  function init3DIntercept() {
    const x0tSlider = document.getElementById("m_x0tSlider");
    if (!x0tSlider) return;
    const z0tSlider = document.getElementById("m_z0tSlider"), y0tSlider = document.getElementById("m_y0tSlider"), vtSlider = document.getElementById("m_vtSlider"), headSlider = document.getElementById("m_headSlider");
    const v0Slider = document.getElementById("m_v0Slider"), thSlider = document.getElementById("m_thSlider"), phSlider = document.getElementById("m_phSlider"), tcSlider = document.getElementById("m_tcSlider");
    const x0tVal = document.getElementById("m_x0tVal"), z0tVal = document.getElementById("m_z0tVal"), y0tVal = document.getElementById("m_y0tVal"), vtVal = document.getElementById("m_vtVal"), headVal = document.getElementById("m_headVal");
    const v0Val = document.getElementById("m_v0Val"), thVal = document.getElementById("m_thVal"), phVal = document.getElementById("m_phVal"), tcVal = document.getElementById("m_tcVal");
    const targetPosEl = document.getElementById("m_targetPos"), interceptPosEl = document.getElementById("m_interceptPos"), missDistEl = document.getElementById("m_missDist"), verdictEl = document.getElementById("m_verdict");
    const launchBtn = document.getElementById("m_launch");

    const topTargetPath = document.getElementById("topTargetPath"), topInterceptPath = document.getElementById("topInterceptPath");
    const topTargetDot = document.getElementById("topTargetDot"), topInterceptDot = document.getElementById("topInterceptDot");
    const sideTargetPath = document.getElementById("sideTargetPath"), sideInterceptPath = document.getElementById("sideInterceptPath");
    const sideTargetDot = document.getElementById("sideTargetDot"), sideInterceptDot = document.getElementById("sideInterceptDot");

    const G = 9.8;
    // top-down: x (downrange) horizontal, z (crossrange) vertical, origin at (20,150)
    const topToX = (xm) => 20 + xm * 4.333, topToZ = (zm) => 150 - zm * 4.333;
    // side: x (downrange) horizontal, y (altitude) vertical, origin at (20,280)
    const sideToX = (xm) => 20 + xm * 4.333, sideToY = (ym) => 280 - ym * 7.43;

    let animating = false;

    function computeAll() {
      const x0t = +x0tSlider.value, z0t = +z0tSlider.value, y0t = +y0tSlider.value, vt = +vtSlider.value, head = +headSlider.value;
      const v0 = +v0Slider.value, th = +thSlider.value, ph = +phSlider.value, Tc = +tcSlider.value;

      const headRad = head * D2R;
      const vxt = vt * Math.cos(headRad), vzt = vt * Math.sin(headRad);
      const target = (t) => ({ x: x0t + vxt * t, z: z0t + vzt * t, y: y0t });

      const thRad = th * D2R, phRad = ph * D2R;
      const vxi = v0 * Math.cos(thRad) * Math.cos(phRad);
      const vzi = v0 * Math.cos(thRad) * Math.sin(phRad);
      const vyi = v0 * Math.sin(thRad);
      const interceptor = (t) => ({ x: vxi * t, z: vzi * t, y: vyi * t - 0.5 * G * t * t });

      return { x0t, z0t, y0t, vt, head, v0, th, ph, Tc, target, interceptor };
    }

    function render() {
      const c = computeAll();
      x0tVal.textContent = c.x0t + " m"; z0tVal.textContent = c.z0t + " m"; y0tVal.textContent = c.y0t + " m";
      vtVal.textContent = c.vt.toFixed(1) + " m/s"; headVal.textContent = c.head + "°";
      v0Val.textContent = c.v0 + " m/s"; thVal.textContent = c.th + "°"; phVal.textContent = c.ph + "°"; tcVal.textContent = c.Tc.toFixed(1) + " s";

      const tgt = c.target(c.Tc), inter = c.interceptor(c.Tc);
      const tgt0 = c.target(0);
      topTargetPath.setAttribute("d", `M ${topToX(tgt0.x)} ${topToZ(tgt0.z)} L ${topToX(tgt.x)} ${topToZ(tgt.z)}`);
      topInterceptPath.setAttribute("d", `M ${topToX(0)} ${topToZ(0)} L ${topToX(inter.x)} ${topToZ(inter.z)}`);
      sideTargetPath.setAttribute("d", `M ${sideToX(tgt0.x)} ${sideToY(tgt0.y)} L ${sideToX(tgt.x)} ${sideToY(tgt.y)}`);
      let sidePath = `M ${sideToX(0)} ${sideToY(0)}`;
      for (let i = 1; i <= 30; i++) { const t = (i / 30) * c.Tc; const p = c.interceptor(t); sidePath += ` L ${sideToX(p.x)} ${sideToY(p.y)}`; }
      sideInterceptPath.setAttribute("d", sidePath);

      if (!animating) {
        topTargetDot.setAttribute("cx", topToX(tgt.x)); topTargetDot.setAttribute("cy", topToZ(tgt.z));
        topInterceptDot.setAttribute("cx", topToX(inter.x)); topInterceptDot.setAttribute("cy", topToZ(inter.z));
        sideTargetDot.setAttribute("cx", sideToX(tgt.x)); sideTargetDot.setAttribute("cy", sideToY(tgt.y));
        sideInterceptDot.setAttribute("cx", sideToX(inter.x)); sideInterceptDot.setAttribute("cy", sideToY(inter.y));
      }

      const missDist = Math.hypot(tgt.x - inter.x, tgt.z - inter.z, tgt.y - inter.y);
      targetPosEl.textContent = `(${tgt.x.toFixed(1)}, ${tgt.z.toFixed(1)}, ${tgt.y.toFixed(1)}) m`;
      interceptPosEl.textContent = `(${inter.x.toFixed(1)}, ${inter.z.toFixed(1)}, ${inter.y.toFixed(1)}) m`;
      missDistEl.textContent = missDist.toFixed(1) + " m";
      verdictEl.innerHTML = missDist < 3
        ? '<span class="verdict-badge good">🎯 Intercept!</span>'
        : '<span class="verdict-badge bad">Miss by ' + missDist.toFixed(1) + ' m</span>';
    }

    launchBtn.addEventListener("click", () => {
      if (animating) return;
      animating = true;
      const c = computeAll();
      const start = performance.now(), duration = 1800;
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const t = frac * c.Tc;
        const tgt = c.target(t), inter = c.interceptor(t);
        topTargetDot.setAttribute("cx", topToX(tgt.x)); topTargetDot.setAttribute("cy", topToZ(tgt.z));
        topInterceptDot.setAttribute("cx", topToX(inter.x)); topInterceptDot.setAttribute("cy", topToZ(inter.z));
        sideTargetDot.setAttribute("cx", sideToX(tgt.x)); sideTargetDot.setAttribute("cy", sideToY(tgt.y));
        sideInterceptDot.setAttribute("cx", sideToX(inter.x)); sideInterceptDot.setAttribute("cy", sideToY(inter.y));
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    [x0tSlider, z0tSlider, y0tSlider, vtSlider, headSlider, v0Slider, thSlider, phSlider, tcSlider].forEach((el) => el.addEventListener("input", render));
    render();
  }

  /* ===================== CONSTANT VELOCITY: WIDGET 1 (motion graphs) ===================== */
  function initMotionGraphLab() {
    const x0Slider = document.getElementById("cvX0Slider");
    if (!x0Slider) return;
    const vSlider = document.getElementById("cvVSlider");
    const x0Val = document.getElementById("cvX0Val"), vVal = document.getElementById("cvVVal");
    const playBtn = document.getElementById("cvPlayBtn");
    const tVal = document.getElementById("cvTVal"), xVal = document.getElementById("cvXVal"), dispVal = document.getElementById("cvDispVal");
    const ticks = document.getElementById("cvTrackTicks"), dot = document.getElementById("cvDot");
    const xtGrid = document.getElementById("cvXtGrid"), xtLine = document.getElementById("cvXtLine"), xtMarker = document.getElementById("cvXtMarker");
    const vtGrid = document.getElementById("cvVtGrid"), vtLine = document.getElementById("cvVtLine"), vtMarker = document.getElementById("cvVtMarker"), vtArea = document.getElementById("cvVtArea");

    const toXTrack = (xm) => 250 + xm * 11.5;
    for (let i = -20; i <= 20; i += 5) {
      ticks.appendChild(svgEl("line", { x1: toXTrack(i), y1: 28, x2: toXTrack(i), y2: 42, class: "svg-grid" }));
    }

    const toXt = (t) => 40 + t * 44, toYpos = (x) => 80 - x * 3;
    const toYv = (v) => 60 - v * 5;
    for (let x = -20; x <= 20; x += 10) xtGrid.appendChild(svgEl("line", { x1: 40, y1: toYpos(x), x2: 480, y2: toYpos(x), class: "svg-grid" }));
    for (let t = 0; t <= 10; t += 2) xtGrid.appendChild(svgEl("line", { x1: toXt(t), y1: 20, x2: toXt(t), y2: 140, class: "svg-grid" }));
    for (let v = -10; v <= 10; v += 5) vtGrid.appendChild(svgEl("line", { x1: 40, y1: toYv(v), x2: 480, y2: toYv(v), class: "svg-grid" }));
    for (let t = 0; t <= 10; t += 2) vtGrid.appendChild(svgEl("line", { x1: toXt(t), y1: 10, x2: toXt(t), y2: 110, class: "svg-grid" }));

    let animating = false;

    function render() {
      const x0 = +x0Slider.value, v = +vSlider.value;
      x0Val.textContent = x0.toFixed(0) + " m"; vVal.textContent = v.toFixed(1) + " m/s";

      xtLine.setAttribute("x1", toXt(0)); xtLine.setAttribute("y1", toYpos(x0));
      let texit = v > 0 ? (20 - x0) / v : v < 0 ? (-20 - x0) / v : Infinity;
      const tEnd = Math.min(10, texit > 0 ? texit : 10);
      xtLine.setAttribute("x2", toXt(tEnd)); xtLine.setAttribute("y2", toYpos(x0 + v * tEnd));

      vtLine.setAttribute("x1", toXt(0)); vtLine.setAttribute("y1", toYv(v));
      vtLine.setAttribute("x2", toXt(10)); vtLine.setAttribute("y2", toYv(v));

      if (!animating) {
        dot.setAttribute("cx", toXTrack(x0));
        xtMarker.setAttribute("cx", toXt(0)); xtMarker.setAttribute("cy", toYpos(x0));
        vtMarker.setAttribute("cx", toXt(0)); vtMarker.setAttribute("cy", toYv(v));
        vtArea.setAttribute("d", "");
        tVal.textContent = "0.0 s"; xVal.textContent = x0.toFixed(1) + " m"; dispVal.textContent = "0.0 m";
      }
      return { x0, v, tEnd };
    }

    playBtn.addEventListener("click", () => {
      if (animating) return;
      const { x0, v, tEnd } = render();
      animating = true;
      const duration = Math.max(300, tEnd * 400);
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * tEnd;
        const x = x0 + v * simT;
        dot.setAttribute("cx", toXTrack(x));
        xtMarker.setAttribute("cx", toXt(simT)); xtMarker.setAttribute("cy", toYpos(x));
        vtMarker.setAttribute("cx", toXt(simT)); vtMarker.setAttribute("cy", toYv(v));
        vtArea.setAttribute("d", `M ${toXt(0)} ${toYv(0)} L ${toXt(0)} ${toYv(v)} L ${toXt(simT)} ${toYv(v)} L ${toXt(simT)} ${toYv(0)} Z`);
        tVal.textContent = simT.toFixed(1) + " s"; xVal.textContent = x.toFixed(1) + " m"; dispVal.textContent = (x - x0).toFixed(1) + " m";
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    [x0Slider, vSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== CONSTANT VELOCITY: WIDGET 2 (catch-up) ===================== */
  function initTwoRunner() {
    const vASlider = document.getElementById("raceVASlider");
    if (!vASlider) return;
    const gapSlider = document.getElementById("raceGapSlider"), vBSlider = document.getElementById("raceVBSlider");
    const vAVal = document.getElementById("raceVAVal"), gapVal = document.getElementById("raceGapVal"), vBVal = document.getElementById("raceVBVal");
    const runBtn = document.getElementById("raceRunBtn");
    const meetT = document.getElementById("raceMeetT"), meetX = document.getElementById("raceMeetX"), verdict = document.getElementById("raceVerdict");
    const ticks = document.getElementById("raceTicks"), dotA = document.getElementById("raceDotA"), dotB = document.getElementById("raceDotB"), catchMark = document.getElementById("raceCatchMark");

    const toXRace = (xm) => 20 + (xm + 10) * 6.571;
    for (let i = -10; i <= 60; i += 10) {
      ticks.appendChild(svgEl("line", { x1: toXRace(i), y1: 49, x2: toXRace(i), y2: 61, class: "svg-grid" }));
    }

    let animating = false;

    function compute() {
      const vA = +vASlider.value, gap = +gapSlider.value, vB = +vBSlider.value;
      const xA0 = 0, xB0 = -gap;
      const tStar = vB > vA ? gap / (vB - vA) : null;
      return { vA, gap, vB, xA0, xB0, tStar };
    }

    function render() {
      const c = compute();
      vAVal.textContent = c.vA.toFixed(1) + " m/s"; gapVal.textContent = c.gap + " m"; vBVal.textContent = c.vB.toFixed(1) + " m/s";

      let tDisplayMax = c.tStar ? Math.min(c.tStar * 1.3, 15) : 8;
      tDisplayMax = Math.min(tDisplayMax, 58 / c.vA);

      if (c.tStar && c.tStar <= tDisplayMax) {
        catchMark.style.display = "";
        catchMark.setAttribute("cx", toXRace(c.xA0 + c.vA * c.tStar));
        meetT.textContent = c.tStar.toFixed(1) + " s";
        meetX.textContent = (c.xA0 + c.vA * c.tStar).toFixed(1) + " m";
        verdict.innerHTML = '<span class="verdict-badge good">B catches up</span>';
      } else {
        catchMark.style.display = "none";
        meetT.textContent = "—"; meetX.textContent = "—";
        verdict.innerHTML = '<span class="verdict-badge bad">B never catches up</span>';
      }

      if (!animating) {
        dotA.setAttribute("cx", toXRace(c.xA0));
        dotB.setAttribute("cx", toXRace(c.xB0));
      }
      return { ...c, tDisplayMax };
    }

    runBtn.addEventListener("click", () => {
      if (animating) return;
      const c = render();
      animating = true;
      const duration = 3000;
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const t = frac * c.tDisplayMax;
        dotA.setAttribute("cx", toXRace(c.xA0 + c.vA * t));
        dotB.setAttribute("cx", toXRace(c.xB0 + c.vB * t));
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    [vASlider, gapSlider, vBSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== CONSTANT VELOCITY: WIDGET 3 (relative velocity) ===================== */
  function initRelativeVelocity() {
    const toggle = document.getElementById("cvRelToggle");
    if (!toggle) return;
    const riverMode = document.getElementById("cvRiverMode"), windMode = document.getElementById("cvWindMode");
    toggle.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn) return;
      Array.from(toggle.children).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      riverMode.style.display = btn.dataset.mode === "river" ? "" : "none";
      windMode.style.display = btn.dataset.mode === "wind" ? "" : "none";
    });

    /* ---- River crossing ---- */
    (function () {
      const widthSlider = document.getElementById("riverWidthSlider"), currentSlider = document.getElementById("riverCurrentSlider");
      const boatSpeedSlider = document.getElementById("riverBoatSpeedSlider"), headingSlider = document.getElementById("riverHeadingSlider");
      const widthVal = document.getElementById("riverWidthVal"), currentVal = document.getElementById("riverCurrentVal"), boatSpeedVal = document.getElementById("riverBoatSpeedVal"), headingVal = document.getElementById("riverHeadingVal");
      const runBtn = document.getElementById("riverRunBtn");
      const boatVecEl = document.getElementById("riverBoatVec"), currentVecEl = document.getElementById("riverCurrentVec"), resultVecEl = document.getElementById("riverResultVec");
      const crossTimeEl = document.getElementById("riverCrossTime"), driftEl = document.getElementById("riverDrift");
      const targetLine = document.getElementById("riverTargetLine"), pathLine = document.getElementById("riverPathLine");
      const vecBoat = document.getElementById("riverVecBoat"), vecCurrent = document.getElementById("riverVecCurrent"), vecResult = document.getElementById("riverVecResult");
      const boatDot = document.getElementById("riverBoatDot");

      const START_X = 230, START_Y = 280, FAR_Y = 20, PXPER_DOWN = 5.25, PXPER_MS = 15;
      const toXDown = (dx) => START_X + dx * PXPER_DOWN;
      let animating = false;

      function compute() {
        const W = +widthSlider.value, vCurrent = +currentSlider.value, vBoat = +boatSpeedSlider.value, headDeg = +headingSlider.value;
        const th = headDeg * D2R;
        const acrossComp = vBoat * Math.cos(th);
        const boatDownComp = vBoat * Math.sin(th);
        const resultDown = boatDownComp + vCurrent;
        const crossTime = acrossComp > 0.01 ? W / acrossComp : Infinity;
        const drift = resultDown * crossTime;
        return { W, vCurrent, vBoat, headDeg, acrossComp, boatDownComp, resultDown, crossTime, drift };
      }

      function render() {
        const c = compute();
        widthVal.textContent = c.W + " m"; currentVal.textContent = c.vCurrent.toFixed(1) + " m/s";
        boatSpeedVal.textContent = c.vBoat.toFixed(1) + " m/s"; headingVal.textContent = c.headDeg + "°";

        boatVecEl.textContent = `(${c.boatDownComp.toFixed(1)}, ${c.acrossComp.toFixed(1)}) m/s`;
        currentVecEl.textContent = `(${c.vCurrent.toFixed(1)}, 0.0) m/s`;
        resultVecEl.textContent = `(${c.resultDown.toFixed(1)}, ${c.acrossComp.toFixed(1)}) m/s`;
        crossTimeEl.textContent = isFinite(c.crossTime) ? c.crossTime.toFixed(1) + " s" : "never crosses";
        const driftAbs = Math.abs(c.drift);
        driftEl.innerHTML = driftAbs < 0.5
          ? '<span class="verdict-badge good">🎯 Landed straight across!</span>'
          : `${driftAbs.toFixed(1)} m ${c.drift >= 0 ? "downstream" : "upstream"}`;

        targetLine.setAttribute("d", `M ${START_X} ${START_Y} L ${START_X} ${FAR_Y}`);
        const landX = toXDown(isFinite(c.drift) ? c.drift : 0);
        pathLine.setAttribute("d", `M ${START_X} ${START_Y} L ${landX} ${FAR_Y}`);

        if (!animating) {
          boatDot.setAttribute("cx", START_X); boatDot.setAttribute("cy", START_Y);
          setVecFrom(vecBoat, START_X, START_Y, c.boatDownComp, c.acrossComp);
          setVecFrom(vecCurrent, START_X, START_Y, c.vCurrent, 0);
          setVecFrom(vecResult, START_X, START_Y, c.resultDown, c.acrossComp);
        }
        return c;
      }

      function setVecFrom(line, x, y, downComp, acrossComp) {
        line.setAttribute("x1", x); line.setAttribute("y1", y);
        line.setAttribute("x2", x + downComp * PXPER_MS); line.setAttribute("y2", y - acrossComp * PXPER_MS);
      }

      runBtn.addEventListener("click", () => {
        if (animating || !isFinite(compute().crossTime)) return;
        const c = render();
        animating = true;
        const duration = 2200;
        const start = performance.now();
        function step(now) {
          const frac = Math.max(0, Math.min(1, (now - start) / duration));
          const simT = frac * c.crossTime;
          const curX = toXDown(c.resultDown * simT);
          const acrossPx = (c.acrossComp * simT) * ((START_Y - FAR_Y) / c.W);
          const curY = START_Y - acrossPx;
          boatDot.setAttribute("cx", curX); boatDot.setAttribute("cy", curY);
          setVecFrom(vecBoat, curX, curY, c.boatDownComp, c.acrossComp);
          setVecFrom(vecCurrent, curX, curY, c.vCurrent, 0);
          setVecFrom(vecResult, curX, curY, c.resultDown, c.acrossComp);
          pathLine.setAttribute("d", `M ${START_X} ${START_Y} L ${curX} ${curY}`);
          if (frac < 1) requestAnimationFrame(step);
          else animating = false;
        }
        requestAnimationFrame(step);
      });

      [widthSlider, currentSlider, boatSpeedSlider, headingSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
      render();
    })();

    /* ---- Headwind / tailwind ---- */
    (function () {
      const airSlider = document.getElementById("windAirSlider"), windSlider = document.getElementById("windSpeedSlider"), distSlider = document.getElementById("windDistSlider");
      const airVal = document.getElementById("windAirVal"), windVal = document.getElementById("windSpeedVal"), distVal = document.getElementById("windDistVal");
      const groundSpeedEl = document.getElementById("windGroundSpeed"), timeEl = document.getElementById("windTime"), timeNoWindEl = document.getElementById("windTimeNoWind"), deltaEl = document.getElementById("windDelta");
      const runBtn = document.getElementById("windRunBtn");
      const planeDot = document.getElementById("windPlaneDot");
      if (!airSlider) return;

      const TRACK_MID = 250, PXPER_MS_WIND = 0.6;
      let animating = false;

      function compute() {
        const air = +airSlider.value, wind = +windSlider.value, distKm = +distSlider.value;
        const ground = air + wind;
        const timeHr = (distKm * 1000) / ground / 3600;
        const timeNoWindHr = (distKm * 1000) / air / 3600;
        return { air, wind, distKm, ground, timeHr, timeNoWindHr };
      }

      function render() {
        const c = compute();
        airVal.textContent = c.air + " m/s"; windVal.textContent = (c.wind >= 0 ? "+" : "") + c.wind + " m/s"; distVal.textContent = c.distKm + " km";
        groundSpeedEl.textContent = c.ground.toFixed(0) + " m/s";
        timeEl.textContent = c.timeHr.toFixed(2) + " h";
        timeNoWindEl.textContent = c.timeNoWindHr.toFixed(2) + " h";
        const delta = c.timeNoWindHr - c.timeHr;
        deltaEl.innerHTML = delta >= 0
          ? `<span class="verdict-badge good">${delta.toFixed(2)} h saved</span>`
          : `<span class="verdict-badge bad">${Math.abs(delta).toFixed(2)} h lost</span>`;
        if (!animating) { planeDot.setAttribute("cx", TRACK_MID); planeDot.setAttribute("cy", 35); }
        return c;
      }

      runBtn.addEventListener("click", () => {
        if (animating) return;
        const c = render();
        animating = true;
        const duration = 2000;
        const start = performance.now();
        const endCx = Math.max(30, Math.min(470, TRACK_MID + c.ground * PXPER_MS_WIND));
        function step(now) {
          const frac = Math.max(0, Math.min(1, (now - start) / duration));
          planeDot.setAttribute("cx", TRACK_MID + (endCx - TRACK_MID) * frac);
          if (frac < 1) requestAnimationFrame(step);
          else animating = false;
        }
        requestAnimationFrame(step);
      });

      [airSlider, windSlider, distSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
      render();
    })();
  }

  /* ===================== CONSTANT ACCELERATION: WIDGET 1 (motion graphs) ===================== */
  function computeAccelSeries(u, a, domain, capT, dt) {
    domain = domain || 30; capT = capT || 12; dt = dt || 0.05;
    let t = 0, v = u, x = 0;
    const points = [{ t, x, v }];
    while (t < capT) {
      const tNext = t + dt;
      const vNext = u + a * tNext;
      const xNext = u * tNext + 0.5 * a * tNext * tNext;
      if (a !== 0 && u !== 0 && Math.sign(a) !== Math.sign(u) && v * vNext <= 0) {
        const tStop = -u / a;
        const xStop = u * tStop + 0.5 * a * tStop * tStop;
        points.push({ t: tStop, x: xStop, v: 0 });
        return { points, tEnd: Math.max(tStop, 0.3), stopped: true };
      }
      if (Math.abs(xNext) > domain) {
        const frac = (domain * Math.sign(xNext) - x) / (xNext - x);
        const tCross = t + frac * dt;
        const vCross = u + a * tCross;
        points.push({ t: tCross, x: domain * Math.sign(xNext), v: vCross });
        return { points, tEnd: Math.max(tCross, 0.3), stopped: false };
      }
      points.push({ t: tNext, x: xNext, v: vNext });
      t = tNext; x = xNext; v = vNext;
    }
    return { points, tEnd: capT, stopped: false };
  }

  function initAccelMotionGraph() {
    const uSlider = document.getElementById("caUSlider");
    if (!uSlider) return;
    const aSlider = document.getElementById("caASlider");
    const uVal = document.getElementById("caUVal"), aVal = document.getElementById("caAVal");
    const playBtn = document.getElementById("caPlayBtn");
    const tVal = document.getElementById("caTVal"), vVal = document.getElementById("caVVal"), sVal = document.getElementById("caSVal");
    const ticks = document.getElementById("caTrackTicks"), dot = document.getElementById("caDot");
    const xtGrid = document.getElementById("caXtGrid"), xtPath = document.getElementById("caXtPath"), xtMarker = document.getElementById("caXtMarker");
    const vtGrid = document.getElementById("caVtGrid"), vtLine = document.getElementById("caVtLine"), vtMarker = document.getElementById("caVtMarker"), vtArea = document.getElementById("caVtArea");
    const presetRow = document.getElementById("caPresetRow");

    const DOMAIN = 30;
    const toXTrack = (xm) => 250 + xm * 7.667;
    for (let i = -30; i <= 30; i += 10) ticks.appendChild(svgEl("line", { x1: toXTrack(i), y1: 28, x2: toXTrack(i), y2: 42, class: "svg-grid" }));

    const toYpos = (x) => 80 - x * 2, toYv = (v) => 60 - v * 1.25;
    for (let x = -DOMAIN; x <= DOMAIN; x += 15) xtGrid.appendChild(svgEl("line", { x1: 40, y1: toYpos(x), x2: 480, y2: toYpos(x), class: "svg-grid" }));
    for (let v = -40; v <= 40; v += 20) vtGrid.appendChild(svgEl("line", { x1: 40, y1: toYv(v), x2: 480, y2: toYv(v), class: "svg-grid" }));

    let animating = false;

    function render() {
      const u = +uSlider.value, a = +aSlider.value;
      uVal.textContent = u.toFixed(1) + " m/s"; aVal.textContent = a.toFixed(1) + " m/s²";
      const series = computeAccelSeries(u, a, DOMAIN);
      const toXt = (t) => 40 + (t / series.tEnd) * 440;

      xtPath.setAttribute("d", "M " + series.points.map((p) => toXt(p.t) + " " + toYpos(p.x)).join(" L "));
      const vFinal = series.points[series.points.length - 1].v;
      vtLine.setAttribute("x1", toXt(0)); vtLine.setAttribute("y1", toYv(u));
      vtLine.setAttribute("x2", toXt(series.tEnd)); vtLine.setAttribute("y2", toYv(vFinal));

      if (!animating) {
        dot.setAttribute("cx", toXTrack(0));
        xtMarker.setAttribute("cx", toXt(0)); xtMarker.setAttribute("cy", toYpos(0));
        vtMarker.setAttribute("cx", toXt(0)); vtMarker.setAttribute("cy", toYv(u));
        vtArea.setAttribute("d", "");
        tVal.textContent = "0.0 s"; vVal.textContent = u.toFixed(1) + " m/s"; sVal.textContent = "0.0 m";
      }
      return { u, a, series, toXt };
    }

    playBtn.addEventListener("click", () => {
      if (animating) return;
      const { u, a, series, toXt } = render();
      animating = true;
      const duration = Math.max(300, series.tEnd * 400);
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * series.tEnd;
        const v = u + a * simT, x = u * simT + 0.5 * a * simT * simT;
        dot.setAttribute("cx", toXTrack(x));
        xtMarker.setAttribute("cx", toXt(simT)); xtMarker.setAttribute("cy", toYpos(x));
        vtMarker.setAttribute("cx", toXt(simT)); vtMarker.setAttribute("cy", toYv(v));
        vtArea.setAttribute("d", `M ${toXt(0)} ${toYv(0)} L ${toXt(0)} ${toYv(u)} L ${toXt(simT)} ${toYv(v)} L ${toXt(simT)} ${toYv(0)} Z`);
        tVal.textContent = simT.toFixed(1) + " s"; vVal.textContent = v.toFixed(1) + " m/s"; sVal.textContent = x.toFixed(1) + " m";
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    const presets = {
      car: { u: 0, a: 3 }, train: { u: 0, a: 1 }, elevator: { u: 0, a: 1.2 },
      sprinter: { u: 0, a: 4 }, brake: { u: 8, a: -5 },
    };
    presetRow.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-preset]");
      if (!btn) return;
      Array.from(presetRow.children).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const p = presets[btn.dataset.preset];
      uSlider.value = p.u; aSlider.value = p.a;
      render();
    });

    [uSlider, aSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== CONSTANT ACCELERATION: WIDGET 2 (braking) ===================== */
  function initBraking() {
    const v0Slider = document.getElementById("brakeV0Slider");
    if (!v0Slider) return;
    const tRSlider = document.getElementById("brakeTRSlider"), aSlider = document.getElementById("brakeASlider");
    const v0Val = document.getElementById("brakeV0Val"), tRVal = document.getElementById("brakeTRVal"), aVal = document.getElementById("brakeAVal");
    const hazardToggle = document.getElementById("brakeHazardToggle"), hazardRow = document.getElementById("brakeHazardRow"), hazardSlider = document.getElementById("brakeHazardSlider"), hazardVal = document.getElementById("brakeHazardVal");
    const testBtn = document.getElementById("brakeTestBtn"), testStatus = document.getElementById("brakeTestStatus");
    const runBtn = document.getElementById("brakeRunBtn");
    const reactVal = document.getElementById("brakeReactVal"), brakeVal = document.getElementById("brakeBrakeVal"), totalVal = document.getElementById("brakeTotalVal");
    const verdictRow = document.getElementById("brakeVerdictRow"), verdict = document.getElementById("brakeVerdict");
    const ticks = document.getElementById("brakeTicks"), reactSeg = document.getElementById("brakeReactionSeg"), brakeSeg = document.getElementById("brakeBrakingSeg");
    const hazardLine = document.getElementById("brakeHazard"), carDot = document.getElementById("brakeCarDot");
    const roadPresets = document.querySelectorAll('#panel-constant-acceleration .preset-row button[data-brake]');

    const toXBrake = (d) => 20 + d * 2.875;
    for (let d = 0; d <= 160; d += 20) ticks.appendChild(svgEl("line", { x1: toXBrake(d), y1: 49, x2: toXBrake(d), y2: 61, class: "svg-grid" }));

    let animating = false;

    function compute() {
      const v0 = +v0Slider.value, tR = +tRSlider.value, a = +aSlider.value;
      const reactDist = v0 * tR;
      const brakeDist = (v0 * v0) / (2 * a);
      const totalDist = reactDist + brakeDist;
      const hazardOn = hazardToggle.checked, hazardDist = +hazardSlider.value;
      return { v0, tR, a, reactDist, brakeDist, totalDist, hazardOn, hazardDist };
    }

    function render() {
      const c = compute();
      v0Val.textContent = c.v0 + " m/s"; tRVal.textContent = c.tR.toFixed(1) + " s"; aVal.textContent = c.a.toFixed(1) + " m/s²";
      reactVal.textContent = c.reactDist.toFixed(1) + " m"; brakeVal.textContent = c.brakeDist.toFixed(1) + " m"; totalVal.textContent = c.totalDist.toFixed(1) + " m";

      reactSeg.setAttribute("d", `M ${toXBrake(0)} 35 L ${toXBrake(c.reactDist)} 35`);
      brakeSeg.setAttribute("d", `M ${toXBrake(c.reactDist)} 35 L ${toXBrake(c.totalDist)} 35`);

      if (c.hazardOn) {
        hazardLine.style.display = ""; hazardLine.setAttribute("x1", toXBrake(c.hazardDist)); hazardLine.setAttribute("x2", toXBrake(c.hazardDist));
        verdictRow.style.display = "";
        verdict.innerHTML = c.totalDist <= c.hazardDist
          ? '<span class="verdict-badge good">Stops in time ✓</span>'
          : '<span class="verdict-badge bad">Hits the hazard ✕</span>';
      } else {
        hazardLine.style.display = "none"; verdictRow.style.display = "none";
      }

      if (!animating) { carDot.setAttribute("cx", toXBrake(0)); }
      return c;
    }

    runBtn.addEventListener("click", () => {
      if (animating) return;
      const c = render();
      animating = true;
      const t2 = c.a > 0 ? c.v0 / c.a : 0;
      const simDuration = Math.max(0.2, c.tR + t2);
      const duration = 2500;
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * simDuration;
        let pos;
        if (simT <= c.tR) pos = c.v0 * simT;
        else {
          const te = simT - c.tR;
          pos = c.reactDist + c.v0 * te - 0.5 * c.a * te * te;
        }
        carDot.setAttribute("cx", toXBrake(Math.min(pos, c.totalDist)));
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    hazardToggle.addEventListener("change", () => { hazardRow.style.display = hazardToggle.checked ? "" : "none"; render(); });
    roadPresets.forEach((btn) => btn.addEventListener("click", () => {
      roadPresets.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      aSlider.value = btn.dataset.brake;
      render();
    }));

    let testState = "idle", readyTime = 0;
    testBtn.addEventListener("click", () => {
      if (testState === "idle") {
        testState = "waiting";
        testStatus.textContent = "Wait for it to turn green...";
        testBtn.textContent = "…";
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          if (testState !== "waiting") return;
          testState = "ready";
          readyTime = performance.now();
          testBtn.textContent = "CLICK NOW!";
          testStatus.textContent = "";
        }, delay);
      } else if (testState === "ready") {
        const rt = (performance.now() - readyTime) / 1000;
        testState = "idle";
        testBtn.textContent = "⏱ Test your reaction time";
        testStatus.innerHTML = `Your reaction time: <strong>${rt.toFixed(2)} s</strong> — <a href="#" id="useRtLink">use this value</a>`;
        const link = document.getElementById("useRtLink");
        if (link) link.addEventListener("click", (e) => {
          e.preventDefault();
          tRSlider.value = Math.max(0.1, Math.min(3, rt));
          render();
        });
      } else {
        testState = "idle";
        testBtn.textContent = "⏱ Test your reaction time";
        testStatus.textContent = "Too soon! Try again.";
      }
    });

    [v0Slider, tRSlider, aSlider, hazardSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== CONSTANT ACCELERATION: WIDGET 3 (ramp) ===================== */
  function initRamp() {
    const angleSlider = document.getElementById("rampAngleSlider");
    if (!angleSlider) return;
    const lenSlider = document.getElementById("rampLenSlider");
    const angleVal = document.getElementById("rampAngleVal"), lenVal = document.getElementById("rampLenVal");
    const releaseBtn = document.getElementById("rampReleaseBtn"), timerBtn = document.getElementById("rampTimerBtn");
    const aVal = document.getElementById("rampAVal"), trueTVal = document.getElementById("rampTrueTVal"), measuredTVal = document.getElementById("rampMeasuredTVal"), measuredAVal = document.getElementById("rampMeasuredAVal");
    const surface = document.getElementById("rampSurface"), cart = document.getElementById("rampCart");

    const G = 9.8, TOPX = 40, TOPY = 40, PXPER_M = 75;
    let animating = false, timerRunning = false, timerStart = 0;

    function compute() {
      const angleDeg = +angleSlider.value, L = +lenSlider.value;
      const th = angleDeg * D2R;
      const a = G * Math.sin(th);
      const trueT = Math.sqrt((2 * L) / a);
      const bottomX = TOPX + L * Math.cos(th) * PXPER_M;
      const bottomY = TOPY + L * Math.sin(th) * PXPER_M;
      return { angleDeg, L, a, trueT, bottomX, bottomY };
    }

    function render() {
      const c = compute();
      angleVal.textContent = c.angleDeg + "°"; lenVal.textContent = c.L.toFixed(1) + " m";
      aVal.textContent = c.a.toFixed(2) + " m/s²"; trueTVal.textContent = c.trueT.toFixed(2) + " s";
      surface.setAttribute("d", `M ${TOPX} ${TOPY} L ${c.bottomX} ${c.bottomY}`);
      if (!animating) { cart.setAttribute("cx", TOPX); cart.setAttribute("cy", TOPY); }
      return c;
    }

    releaseBtn.addEventListener("click", () => {
      if (animating) return;
      const c = render();
      animating = true;
      const duration = Math.max(400, c.trueT * 1000);
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * c.trueT;
        const dist = 0.5 * c.a * simT * simT;
        const f = c.L > 0 ? Math.min(1, dist / c.L) : 1;
        cart.setAttribute("cx", TOPX + f * (c.bottomX - TOPX));
        cart.setAttribute("cy", TOPY + f * (c.bottomY - TOPY));
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    timerBtn.addEventListener("click", () => {
      if (!timerRunning) {
        timerRunning = true; timerStart = performance.now();
        timerBtn.textContent = "⏱ Stop timer";
      } else {
        timerRunning = false;
        const measured = (performance.now() - timerStart) / 1000;
        timerBtn.textContent = "⏱ Start / stop your timer";
        measuredTVal.textContent = measured.toFixed(2) + " s";
        const L = +lenSlider.value;
        const measuredA = (2 * L) / (measured * measured);
        measuredAVal.textContent = measuredA.toFixed(2) + " m/s²";
      }
    });

    [angleSlider, lenSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== FREE FALL: WIDGET 1 (graphs) ===================== */
  function initFreeFallGraphs() {
    const y0Slider = document.getElementById("ffY0Slider");
    if (!y0Slider) return;
    const v0Slider = document.getElementById("ffV0Slider"), gSlider = document.getElementById("ffGSlider");
    const y0Val = document.getElementById("ffY0Val"), v0Val = document.getElementById("ffV0Val"), gVal = document.getElementById("ffGVal");
    const playBtn = document.getElementById("ffPlayBtn");
    const tVal = document.getElementById("ffTVal"), yVal = document.getElementById("ffYVal"), vVal = document.getElementById("ffVVal"), landVal = document.getElementById("ffLandVal");
    const ticks = document.getElementById("ffTrackTicks"), dot = document.getElementById("ffDot");
    const ytGrid = document.getElementById("ffYtGrid"), ytPath = document.getElementById("ffYtPath"), ytMarker = document.getElementById("ffYtMarker");
    const vtGrid = document.getElementById("ffVtGrid"), vtLine = document.getElementById("ffVtLine"), vtMarker = document.getElementById("ffVtMarker");
    const atLine = document.getElementById("ffAtLine");
    const presetRow = document.getElementById("ffPresetRow");

    const toYTrack = (y) => 280 - y * 2.364;
    for (let y = 0; y <= 100; y += 20) ticks.appendChild(svgEl("line", { x1: 25, y1: toYTrack(y), x2: 40, y2: toYTrack(y), class: "svg-grid" }));

    const toYposGraph = (y) => 140 - y * 1.091, toYv = (v) => 60 - v * 1.25, toYa = (a) => 10 - a * 2;
    for (let y = 0; y <= 100; y += 25) ytGrid.appendChild(svgEl("line", { x1: 40, y1: toYposGraph(y), x2: 480, y2: toYposGraph(y), class: "svg-grid" }));
    for (let v = -40; v <= 40; v += 20) vtGrid.appendChild(svgEl("line", { x1: 40, y1: toYv(v), x2: 480, y2: toYv(v), class: "svg-grid" }));

    let animating = false;

    function render() {
      const y0 = +y0Slider.value, v0 = +v0Slider.value, g = +gSlider.value;
      y0Val.textContent = y0 + " m"; v0Val.textContent = v0.toFixed(1) + " m/s"; gVal.textContent = g.toFixed(1) + " m/s²";
      const series = computeIdealTrajectory(v0, 90, y0, g);
      const toXt = (t) => 40 + (t / Math.max(series.T, 0.05)) * 440;

      ytPath.setAttribute("d", "M " + series.points.map((p) => toXt(p.t) + " " + toYposGraph(p.y)).join(" L "));
      const vFinal = v0 - g * series.T;
      vtLine.setAttribute("x1", toXt(0)); vtLine.setAttribute("y1", toYv(v0));
      vtLine.setAttribute("x2", toXt(series.T)); vtLine.setAttribute("y2", toYv(vFinal));
      atLine.setAttribute("y1", toYa(-g)); atLine.setAttribute("y2", toYa(-g));
      landVal.textContent = series.T.toFixed(2) + " s";

      if (!animating) {
        dot.setAttribute("cy", toYTrack(y0));
        ytMarker.setAttribute("cx", toXt(0)); ytMarker.setAttribute("cy", toYposGraph(y0));
        vtMarker.setAttribute("cx", toXt(0)); vtMarker.setAttribute("cy", toYv(v0));
        tVal.textContent = "0.0 s"; yVal.textContent = y0.toFixed(1) + " m"; vVal.textContent = v0.toFixed(1) + " m/s";
      }
      return { y0, v0, g, series, toXt };
    }

    playBtn.addEventListener("click", () => {
      if (animating) return;
      const { v0, g, series, toXt } = render();
      animating = true;
      const duration = Math.max(300, series.T * 400);
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * series.T;
        const y = Math.max(0, series.points[0].y + v0 * simT - 0.5 * g * simT * simT);
        const v = v0 - g * simT;
        dot.setAttribute("cy", toYTrack(y));
        ytMarker.setAttribute("cx", toXt(simT)); ytMarker.setAttribute("cy", toYposGraph(y));
        vtMarker.setAttribute("cx", toXt(simT)); vtMarker.setAttribute("cy", toYv(v));
        tVal.textContent = simT.toFixed(1) + " s"; yVal.textContent = y.toFixed(1) + " m"; vVal.textContent = v.toFixed(1) + " m/s";
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    const presets = { drop: { y0: 20, v0: 0 }, up: { y0: 0, v0: 10 }, down: { y0: 20, v0: -5 } };
    presetRow.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-preset]");
      if (!btn) return;
      Array.from(presetRow.children).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const p = presets[btn.dataset.preset];
      y0Slider.value = p.y0; v0Slider.value = p.v0;
      render();
    });

    [y0Slider, v0Slider, gSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== FREE FALL: WIDGET 2 (drop comparison) ===================== */
  function integrateFallSeries(height, b, g) {
    if (b <= 0) {
      const T = Math.sqrt((2 * height) / g);
      const points = [];
      for (let i = 0; i <= 60; i++) { const t = (i / 60) * T; points.push({ t, d: 0.5 * g * t * t }); }
      return { points, T };
    }
    const dt = 0.02;
    let s = 0, d = 0, t = 0;
    const points = [{ t, d }];
    for (let i = 0; i < 3000; i++) {
      const a = g - b * s * s;
      s += a * dt; const dNext = d + s * dt; t += dt;
      if (dNext >= height) { points.push({ t, d: height }); return { points, T: t }; }
      d = dNext;
      points.push({ t, d });
    }
    return { points, T: t };
  }

  function dAtTime(series, simT) {
    const pts = series.points;
    if (simT <= 0) return 0;
    if (simT >= series.T) return pts[pts.length - 1].d;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].t >= simT) {
        const p0 = pts[i - 1], p1 = pts[i];
        const f = (simT - p0.t) / (p1.t - p0.t || 1);
        return p0.d + f * (p1.d - p0.d);
      }
    }
    return pts[pts.length - 1].d;
  }

  function initDropComparison() {
    const heightSlider = document.getElementById("dropHeightSlider");
    if (!heightSlider) return;
    const bSlider = document.getElementById("dropBSlider"), vacuum = document.getElementById("dropVacuum");
    const heightVal = document.getElementById("dropHeightVal"), bVal = document.getElementById("dropBVal");
    const runBtn = document.getElementById("dropRunBtn");
    const compactTEl = document.getElementById("dropCompactT"), dragTEl = document.getElementById("dropDragT"), terminalVEl = document.getElementById("dropTerminalV");
    const ticks = document.getElementById("dropTicks"), ballCompact = document.getElementById("dropBallCompact"), ballDrag = document.getElementById("dropBallDrag");

    const G = 9.8, B_COMPACT = 0.01, TOP_Y = 30, PXM = 2.0;
    for (let d = 0; d <= 120; d += 20) ticks.appendChild(svgEl("line", { x1: 10, y1: TOP_Y + d * PXM, x2: 25, y2: TOP_Y + d * PXM, class: "svg-grid" }));

    let animating = false;

    function render() {
      const height = +heightSlider.value, b2 = +bSlider.value, isVacuum = vacuum.checked;
      heightVal.textContent = height + " m"; bVal.textContent = b2.toFixed(3);
      const seriesCompact = integrateFallSeries(height, isVacuum ? 0 : B_COMPACT, G);
      const seriesDrag = integrateFallSeries(height, isVacuum ? 0 : b2, G);
      compactTEl.textContent = seriesCompact.T.toFixed(2) + " s";
      dragTEl.textContent = seriesDrag.T.toFixed(2) + " s";
      terminalVEl.textContent = isVacuum ? "n/a (vacuum)" : Math.sqrt(G / b2).toFixed(1) + " m/s";
      if (!animating) {
        ballCompact.setAttribute("cy", TOP_Y); ballDrag.setAttribute("cy", TOP_Y);
      }
      return { height, seriesCompact, seriesDrag };
    }

    runBtn.addEventListener("click", () => {
      if (animating) return;
      const c = render();
      animating = true;
      const simTMax = Math.max(c.seriesCompact.T, c.seriesDrag.T);
      const duration = Math.min(6000, simTMax * 350);
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * simTMax;
        const dCompact = Math.min(c.height, dAtTime(c.seriesCompact, simT));
        const dDrag = Math.min(c.height, dAtTime(c.seriesDrag, simT));
        ballCompact.setAttribute("cy", TOP_Y + dCompact * PXM);
        ballDrag.setAttribute("cy", TOP_Y + dDrag * PXM);
        if (frac < 1) requestAnimationFrame(step);
        else animating = false;
      }
      requestAnimationFrame(step);
    });

    vacuum.addEventListener("change", render);
    [heightSlider, bSlider].forEach((el) => el.addEventListener("input", () => { if (!animating) render(); }));
    render();
  }

  /* ===================== FREE FALL: WIDGET 3 (ruler drop) ===================== */
  function initRulerDrop() {
    const testBtn = document.getElementById("rulerTestBtn");
    if (!testBtn) return;
    const status = document.getElementById("rulerStatus");
    const distVal = document.getElementById("rulerDistVal"), timeVal = document.getElementById("rulerTimeVal");
    const rulerRect = document.getElementById("rulerRect"), ticks = document.getElementById("rulerTicks");

    for (let cm = 0; cm <= 30; cm += 5) ticks.appendChild(svgEl("line", { x1: 85, y1: 10 + cm * 6, x2: 92, y2: 10 + cm * 6, class: "svg-grid" }));

    const BASE_Y = 10, PXM = 6, G = 9.8;
    let state = "idle", dropStartTime = 0;

    function fallLoop() {
      if (state !== "ready") return;
      const elapsed = (performance.now() - dropStartTime) / 1000;
      const fallPx = 0.5 * G * elapsed * elapsed * PXM;
      rulerRect.setAttribute("y", BASE_Y + Math.min(fallPx, 260));
      requestAnimationFrame(fallLoop);
    }

    testBtn.addEventListener("click", () => {
      if (state === "idle") {
        state = "waiting";
        status.textContent = "Get ready...";
        testBtn.textContent = "…";
        rulerRect.setAttribute("y", BASE_Y);
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          if (state !== "waiting") return;
          state = "ready";
          dropStartTime = performance.now();
          testBtn.textContent = "🖐 Catch it!";
          status.textContent = "Catch it NOW!";
          requestAnimationFrame(fallLoop);
        }, delay);
      } else if (state === "ready") {
        const reactionTime = (performance.now() - dropStartTime) / 1000;
        state = "idle";
        testBtn.textContent = "🎯 Drop the ruler";
        status.textContent = "";
        const distM = 0.5 * G * reactionTime * reactionTime;
        distVal.textContent = (distM * 100).toFixed(1) + " cm";
        timeVal.textContent = (reactionTime * 1000).toFixed(0) + " ms";
      } else {
        state = "idle";
        testBtn.textContent = "🎯 Drop the ruler";
        status.textContent = "Too soon! Wait for it to actually fall.";
      }
    });
  }

  /* ===================== RELATIVE MOTION: WIDGET (vectors + dual frame) ===================== */
  function initRelMotionExplorer() {
    const svg = document.getElementById("relVecSvg");
    if (!svg) return;
    const grid = document.getElementById("relGrid");
    for (let i = 0; i <= 400; i += 40) {
      grid.appendChild(svgEl("line", { x1: i, y1: 0, x2: i, y2: 400, class: "svg-grid" }));
      grid.appendChild(svgEl("line", { x1: 0, y1: i, x2: 400, y2: i, class: "svg-grid" }));
    }

    const handleA = document.getElementById("relHandleA"), vecA = document.getElementById("relVecA");
    const handleB = document.getElementById("relHandleB"), vecB = document.getElementById("relVecB");
    const vecR = document.getElementById("relVecR"), tailBtoR = document.getElementById("relTailBtoR");
    const aVal = document.getElementById("relAVal"), bVal = document.getElementById("relBVal"), rVal = document.getElementById("relRVal");
    const resetBtn = document.getElementById("relResetBtn");
    const presetRow = document.getElementById("relPresetRow");

    const SCALE = 20, ORIGIN = 200, LIMIT = 9.4;
    const toScreen = (x, y) => ({ sx: ORIGIN + x * SCALE, sy: ORIGIN - y * SCALE });
    const toWorld = (sx, sy) => ({ x: (sx - ORIGIN) / SCALE, y: (ORIGIN - sy) / SCALE });

    let A = { x: 4, y: 2 }, B = { x: -4, y: 5 };

    function fmt(v) {
      const mag = Math.hypot(v.x, v.y);
      let ang = (Math.atan2(v.y, v.x) * 180) / Math.PI;
      if (ang < 0) ang += 360;
      return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}) | ${mag.toFixed(1)} @ ${ang.toFixed(0)}°`;
    }

    function render() {
      const sA = toScreen(A.x, A.y), sB = toScreen(B.x, B.y);
      vecA.setAttribute("x2", sA.sx); vecA.setAttribute("y2", sA.sy);
      handleA.setAttribute("cx", sA.sx); handleA.setAttribute("cy", sA.sy);
      vecB.setAttribute("x2", sB.sx); vecB.setAttribute("y2", sB.sy);
      handleB.setAttribute("cx", sB.sx); handleB.setAttribute("cy", sB.sy);

      const R = { x: B.x - A.x, y: B.y - A.y };
      const sR = toScreen(R.x, R.y);
      vecR.setAttribute("x2", sR.sx); vecR.setAttribute("y2", sR.sy);
      tailBtoR.setAttribute("x1", sA.sx); tailBtoR.setAttribute("y1", sA.sy);
      tailBtoR.setAttribute("x2", sB.sx); tailBtoR.setAttribute("y2", sB.sy);

      aVal.textContent = fmt(A); bVal.textContent = fmt(B); rVal.textContent = fmt(R);
      return { A, B, R };
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
    resetBtn.addEventListener("click", () => { A = { x: 4, y: 2 }; B = { x: -4, y: 5 }; render(); });

    const presets = {
      passing: { A: { x: 8, y: 0 }, B: { x: -8, y: 0 } },
      overtake: { A: { x: 5, y: 0 }, B: { x: 8, y: 0 } },
      cross: { A: { x: 6, y: 2 }, B: { x: -2, y: 7 } },
    };
    if (presetRow) {
      presetRow.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-preset]");
        if (!btn) return;
        Array.from(presetRow.children).forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const p = presets[btn.dataset.preset];
        A = { ...p.A }; B = { ...p.B };
        render();
      });
    }

    render();

    /* dual-frame track */
    const playBtn = document.getElementById("relPlayBtn"), tVal = document.getElementById("relTVal");
    const groundA = document.getElementById("relGroundA"), groundB = document.getElementById("relGroundB");
    const aFrameB = document.getElementById("relAFrameB");
    if (!playBtn) return;
    const CX = 250, PXPER = 8, SIM_T_MAX = 3;
    let trackAnimating = false;

    playBtn.addEventListener("click", () => {
      if (trackAnimating) return;
      trackAnimating = true;
      const { A: a0, B: b0 } = render();
      const duration = 3000;
      const start = performance.now();
      function step(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / duration));
        const simT = frac * SIM_T_MAX;
        groundA.setAttribute("cx", clamp(CX + a0.x * simT * PXPER, 30, 470));
        groundB.setAttribute("cx", clamp(CX + b0.x * simT * PXPER, 30, 470));
        aFrameB.setAttribute("cx", clamp(CX + (b0.x - a0.x) * simT * PXPER, 30, 470));
        tVal.textContent = simT.toFixed(1) + " s";
        if (frac < 1) requestAnimationFrame(step);
        else trackAnimating = false;
      }
      requestAnimationFrame(step);
    });
  }

  /* ===================== CROSS-TAB LINKS ===================== */
  function initJumpLinks() {
    document.querySelectorAll("[data-jump-tab]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const btn = document.querySelector('#tabbar button[data-target="' + a.dataset.jumpTab + '"]');
        if (btn) btn.click();
      });
    });
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
    initJumpLinks();
    initMotionGraphLab();
    initTwoRunner();
    initRelativeVelocity();
    initAccelMotionGraph();
    initBraking();
    initRamp();
    initExplorer();
    initTargetChallenge();
    initInterceptionLab();
    init3DIntercept();
    initFreeFallGraphs();
    initDropComparison();
    initRulerDrop();
    initRelMotionExplorer();
  });
})();
