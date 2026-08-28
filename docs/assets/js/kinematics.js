// docs/01-kinematics/index.html widgets. Only the Projectile Motion tab is
// fully built out for now (see mechanics-section-writer skill) -- the other
// four tabs are plain outline stubs until they get the same treatment.
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    return el;
  }
  const D2R = Math.PI / 180;

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

    const MARGIN_L = 40, DOMAIN_X = 80, DOMAIN_Y = 45, GROUND = 220, TOP = 20;
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
        const frac = Math.min(1, (now - start) / duration);
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

    const MARGIN_L = 20, DOMAIN_X = 60, DOMAIN_Y = 30, GROUND = 220, TOP = 20, G = 9.8;
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
        const frac = Math.min(1, (now - start) / duration);
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
          const frac = Math.min(1, (now - start) / duration);
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
          const frac = Math.min(1, (now - start) / duration);
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
        const frac = Math.min(1, (now - start) / duration);
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
    initExplorer();
    initTargetChallenge();
    initInterceptionLab();
    init3DIntercept();
  });
})();
