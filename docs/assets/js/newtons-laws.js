// Interactive widgets for docs/02-newtons-laws/index.html.
// Reuses toolkit.js for initTabs(); each widget below is self-contained.
(function () {
  const G = 9.8;
  const SVGNS = "http://www.w3.org/2000/svg";

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Create an SVG element with attributes (used to inject missing pieces
  // like the hanging mass, so no HTML edits are required).
  function svgEl(name, attrs) {
    const el = document.createElementNS(SVGNS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
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
  // Widget 1 (Inertia) -- Coin, Card, and Cup
  // ---------------------------------------------------------------
  function initCoinCard() {
    const svg = document.getElementById("ccSvg");
    if (!svg) return;
    const card = document.getElementById("ccCard");
    const coin = document.getElementById("ccCoin");
    const vSlider = document.getElementById("ccVSlider");
    const vVal = document.getElementById("ccVVal");
    const muSlider = document.getElementById("ccMuSlider");
    const muVal = document.getElementById("ccMuVal");
    const flickBtn = document.getElementById("ccFlickBtn");
    const status = document.getElementById("ccStatus");
    const aVal = document.getElementById("ccAVal");
    const tVal = document.getElementById("ccTVal");
    const driftVal = document.getElementById("ccDriftVal");

    const D = 0.15, H = 0.10, R = 0.055, PXPM = 300, SLOWMO = 3;
    const CARD_X0 = 90, COIN_CX0 = 150, COIN_CY0 = 130;

    let animating = false;
    let rafId = null;

    function updateSliders() {
      vVal.textContent = parseFloat(vSlider.value).toFixed(1) + " m/s";
      muVal.textContent = parseFloat(muSlider.value).toFixed(2);
    }
    vSlider.addEventListener("input", updateSliders);
    muSlider.addEventListener("input", updateSliders);
    updateSliders();

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      flickBtn.disabled = false;
      card.setAttribute("x", CARD_X0);
      card.setAttribute("opacity", 1);
      coin.setAttribute("cx", COIN_CX0);
      coin.setAttribute("cy", COIN_CY0);
      coin.setAttribute("opacity", 1);
      status.textContent = "";
    }
    reset();

    flickBtn.addEventListener("click", () => {
      if (animating) return;
      reset();
      animating = true;
      flickBtn.disabled = true;

      const vCard = parseFloat(vSlider.value);
      const mu = parseFloat(muSlider.value);
      const a = mu * G;
      const disc = vCard * vCard - 2 * a * D;
      const start = performance.now();

      aVal.textContent = a.toFixed(2) + " m/s²";

      if (disc < 0) {
        // Coin's speed catches up to the card's before the card clears it:
        // friction never lets go, so both slide off together.
        tVal.textContent = "never clears";
        driftVal.textContent = "dragged along with the card";
        const tMatch = vCard / a;
        const xAtMatch = 0.5 * a * tMatch * tMatch;

        function frameFail(now) {
          const t = Math.max(0, (now - start) / 1000) / SLOWMO;
          const cardX = CARD_X0 - vCard * t * PXPM;
          card.setAttribute("x", cardX);
          let coinX;
          if (t < tMatch) {
            coinX = COIN_CX0 - 0.5 * a * t * t * PXPM;
          } else {
            coinX = COIN_CX0 - xAtMatch * PXPM - vCard * (t - tMatch) * PXPM;
          }
          coin.setAttribute("cx", coinX);
          if (cardX < -160) {
            card.setAttribute("opacity", 0);
            status.textContent = "🙈 The coin got dragged away with the card — flick harder, or use a smoother card.";
            animating = false;
            flickBtn.disabled = false;
            return;
          }
          rafId = requestAnimationFrame(frameFail);
        }
        rafId = requestAnimationFrame(frameFail);
        return;
      }

      const tContact = (vCard - Math.sqrt(disc)) / a;
      const vCoinEnd = a * tContact;
      const xCoinEnd = 0.5 * a * tContact * tContact;
      const tFall = Math.sqrt((2 * H) / G);
      const xTotal = xCoinEnd + vCoinEnd * tFall;
      const caught = Math.abs(xTotal) <= R;

      tVal.textContent = tContact.toFixed(3) + " s";
      driftVal.textContent = (xTotal * 100).toFixed(1) + " cm";

      function frameOk(now) {
        const t = Math.max(0, (now - start) / 1000) / SLOWMO;
        if (t <= tContact) {
          card.setAttribute("x", CARD_X0 - vCard * t * PXPM);
          coin.setAttribute("cx", COIN_CX0 - 0.5 * a * t * t * PXPM);
          rafId = requestAnimationFrame(frameOk);
        } else if (t <= tContact + tFall) {
          const tf = t - tContact;
          const cardX = CARD_X0 - vCard * t * PXPM;
          card.setAttribute("x", cardX);
          if (cardX < -140) card.setAttribute("opacity", 0);
          coin.setAttribute("cx", COIN_CX0 - xCoinEnd * PXPM - vCoinEnd * tf * PXPM);
          coin.setAttribute("cy", COIN_CY0 + 0.5 * G * tf * tf * PXPM);
          rafId = requestAnimationFrame(frameOk);
        } else {
          card.setAttribute("opacity", 0);
          coin.setAttribute("cx", clamp(COIN_CX0 - xTotal * PXPM, 40, 260));
          coin.setAttribute("cy", caught ? 195 : 222);
          status.textContent = caught
            ? "🎉 Caught! The coin barely moved before the card was gone."
            : "🙈 Missed — the coin drifted too far sideways before it fell.";
          animating = false;
          flickBtn.disabled = false;
        }
      }
      rafId = requestAnimationFrame(frameOk);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Inertia) -- Passenger Lurch During Braking
  // ---------------------------------------------------------------
  function initLurch() {
    const svg = document.getElementById("lurchSvg");
    if (!svg) return;
    const pax = document.getElementById("lurchPax");
    const windshield = document.getElementById("lurchWindshield");
    const road = svg.querySelector("line[stroke-dasharray]");
    const v0Slider = document.getElementById("lurchV0Slider");
    const v0Val = document.getElementById("lurchV0Val");
    const aSlider = document.getElementById("lurchASlider");
    const aVal = document.getElementById("lurchAVal");
    const belt = document.getElementById("lurchBelt");
    const goBtn = document.getElementById("lurchGoBtn");
    const tStopVal = document.getElementById("lurchTStopVal");
    const driftVal = document.getElementById("lurchDriftVal");
    const outcomeVal = document.getElementById("lurchOutcomeVal");

    const PAX_X0 = 115, WINDSHIELD_X = 140, CABIN_ROOM_M = 0.5, PXPM = (WINDSHIELD_X - PAX_X0) / CABIN_ROOM_M;
    const SLOWMO = 2.5;

    let animating = false, rafId = null;

    function updateSliders() {
      v0Val.textContent = v0Slider.value + " m/s";
      aVal.textContent = aSlider.value + " m/s²";
    }
    v0Slider.addEventListener("input", updateSliders);
    aSlider.addEventListener("input", updateSliders);
    updateSliders();

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      pax.setAttribute("cx", PAX_X0);
      windshield.setAttribute("opacity", 0);
      if (road) road.setAttribute("stroke-dashoffset", 0);
    }
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      reset();
      animating = true;
      goBtn.disabled = true;

      const v0 = parseFloat(v0Slider.value);
      const a = parseFloat(aSlider.value);
      const tStop = v0 / a;
      tStopVal.textContent = tStop.toFixed(2) + " s";

      if (belt.checked) {
        driftVal.textContent = "≈ 0 m (restrained)";
        outcomeVal.textContent = "Seatbelt holds — no lurch";
        const start = performance.now();
        function frameBelt(now) {
          const t = Math.max(0, (now - start) / 1000) / SLOWMO;
          if (t <= tStop) {
            const xCar = v0 * t - 0.5 * a * t * t;
            if (road) road.setAttribute("stroke-dashoffset", -xCar * 8);
            rafId = requestAnimationFrame(frameBelt);
          } else {
            animating = false;
            goBtn.disabled = false;
          }
        }
        rafId = requestAnimationFrame(frameBelt);
        return;
      }

      // Unbelted: relative drift = 0.5*a*t^2 while braking, then grows
      // linearly (v0*t - v0^2/2a) once the car has already stopped.
      const tDuringBrake = Math.sqrt(1 / a); // time drift would hit 0.5 m if within braking
      let tImpact, phase;
      if (tDuringBrake <= tStop) {
        tImpact = tDuringBrake;
        phase = "during braking";
      } else {
        tImpact = (0.5 + (v0 * v0) / (2 * a)) / v0;
        phase = "after the car had already stopped";
      }
      driftVal.textContent = CABIN_ROOM_M.toFixed(2) + " m (hits windshield)";
      outcomeVal.textContent = "💥 Impact at t = " + tImpact.toFixed(2) + " s (" + phase + ")";

      const start = performance.now();
      function frameNoBelt(now) {
        const t = Math.max(0, (now - start) / 1000) / SLOWMO;
        const tBrake = Math.min(t, tStop);
        const xCar = v0 * tBrake - 0.5 * a * tBrake * tBrake;
        if (road) road.setAttribute("stroke-dashoffset", -xCar * 8);

        const drift = t <= tStop ? 0.5 * a * t * t : v0 * t - (v0 * v0) / (2 * a);
        const paxX = PAX_X0 + Math.min(drift, CABIN_ROOM_M) * PXPM;
        pax.setAttribute("cx", paxX);

        if (drift >= CABIN_ROOM_M) {
          windshield.setAttribute("opacity", 1);
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frameNoBelt);
      }
      rafId = requestAnimationFrame(frameNoBelt);
    });
  }

  // ---------------------------------------------------------------
  // Widget 3 (Inertia) -- Coasting Toward the Frictionless Ideal
  // ---------------------------------------------------------------
  function initPuckCoast() {
    const svg = document.getElementById("puckSvg");
    if (!svg) return;
    const puckIce = document.getElementById("puckIce");
    const puckCarpet = document.getElementById("puckCarpet");
    const icePath = document.getElementById("puckIcePath");
    const carpetPath = document.getElementById("puckCarpetPath");
    const v0Slider = document.getElementById("puckV0Slider");
    const v0Val = document.getElementById("puckV0Val");
    const muSlider = document.getElementById("puckMuSlider");
    const muVal = document.getElementById("puckMuVal");
    const goBtn = document.getElementById("puckGoBtn");
    const iceDistVal = document.getElementById("puckIceDistVal");
    const carpetDistVal = document.getElementById("puckCarpetDistVal");
    const ratioVal = document.getElementById("puckRatioVal");

    const MU_ICE = 0.03, TRACK_X0 = 30, TRACK_X1 = 430, ANIM_SECONDS = 4.5;

    let animating = false, rafId = null;

    function updateSliders() {
      v0Val.textContent = parseFloat(v0Slider.value).toFixed(1) + " m/s";
      muVal.textContent = parseFloat(muSlider.value).toFixed(2);
    }
    v0Slider.addEventListener("input", updateSliders);
    muSlider.addEventListener("input", updateSliders);
    updateSliders();

    function vtPath(v0, a, tStop, tMax, toX, toY) {
      const N = 60;
      let d = "";
      for (let i = 0; i <= N; i++) {
        const t = (tMax * i) / N;
        const v = t <= tStop ? v0 - a * t : 0;
        d += (i === 0 ? "M" : "L") + toX(t) + "," + toY(v) + " ";
      }
      return d;
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      goBtn.disabled = false;
      puckIce.setAttribute("cx", TRACK_X0);
      puckCarpet.setAttribute("cx", TRACK_X0);
      icePath.setAttribute("d", "");
      carpetPath.setAttribute("d", "");
    }
    reset();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      reset();
      animating = true;
      goBtn.disabled = true;

      const v0 = parseFloat(v0Slider.value);
      const muCarpet = parseFloat(muSlider.value);
      const aIce = MU_ICE * G;
      const aCarpet = muCarpet * G;
      const distIce = (v0 * v0) / (2 * aIce);
      const distCarpet = (v0 * v0) / (2 * aCarpet);
      const tStopIce = v0 / aIce;
      const tStopCarpet = v0 / aCarpet;
      const dMax = Math.max(distIce, distCarpet);

      iceDistVal.textContent = distIce.toFixed(1) + " m";
      carpetDistVal.textContent = distCarpet.toFixed(1) + " m";
      ratioVal.textContent = (distIce / distCarpet).toFixed(1) + "× farther";

      const tMax = Math.max(tStopIce, tStopCarpet);
      const toX = (t) => 40 + (t / Math.max(tMax, 0.05)) * 400;
      const toY = (v) => 110 - (v / Math.max(v0, 0.1)) * 95;
      icePath.setAttribute("d", vtPath(v0, aIce, tStopIce, tMax, toX, toY));
      carpetPath.setAttribute("d", vtPath(v0, aCarpet, tStopCarpet, tMax, toX, toY));

      const start = performance.now();
      function frame(now) {
        const realElapsed = Math.max(0, (now - start) / 1000);
        const t = Math.min(1, realElapsed / ANIM_SECONDS) * tMax;
        const tIce = Math.min(t, tStopIce);
        const tCarp = Math.min(t, tStopCarpet);
        const sIce = v0 * tIce - 0.5 * aIce * tIce * tIce;
        const sCarp = v0 * tCarp - 0.5 * aCarpet * tCarp * tCarp;
        puckIce.setAttribute("cx", TRACK_X0 + ((TRACK_X1 - TRACK_X0) * sIce) / dMax);
        puckCarpet.setAttribute("cx", TRACK_X0 + ((TRACK_X1 - TRACK_X0) * sCarp) / dMax);
        if (t >= tMax) {
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
  // Widget 1 (Second Law) -- Cart-and-Mass Lab
  // ---------------------------------------------------------------
  function initCartMass() {
    const svg = document.getElementById("cmTrackSvg");
    if (!svg) return;
    const cart = document.getElementById("cmCart");
    const forceArrow = document.getElementById("cmForceArrow");
    const axisLabel = document.getElementById("cmAxisLabel");
    const curvePath = document.getElementById("cmCurvePath");
    const marker = document.getElementById("cmCurveMarker");
    const fSlider = document.getElementById("cmFSlider");
    const fVal = document.getElementById("cmFVal");
    const mSlider = document.getElementById("cmMSlider");
    const mVal = document.getElementById("cmMVal");
    const pushBtn = document.getElementById("cmPushBtn");
    const aVal = document.getElementById("cmAVal");
    const tVal = document.getElementById("cmTVal");
    const modeButtons = Array.from(document.querySelectorAll("#cmModeToggle button"));

    const CART_X0 = 20, ANIM_SECONDS = 3;
    let mode = "mass";
    let animating = false, rafId = null;

    function redraw() {
      const F = parseFloat(fSlider.value);
      const m = parseFloat(mSlider.value);
      const a = F / m;
      fVal.textContent = F + " N";
      mVal.textContent = m + " kg";
      aVal.textContent = a.toFixed(2) + " m/s²";
      tVal.textContent = isFinite(5 / a) ? (5 / a).toFixed(2) + " s" : "—";
      forceArrow.setAttribute("x2", 10 + clamp(F * 0.4, 5, 40));

      let xs = [], ys = [], markerX;
      if (mode === "mass") {
        axisLabel.textContent = "m";
        for (let mm = 2; mm <= 20; mm += 0.5) { xs.push(mm); ys.push(F / mm); }
        markerX = m;
      } else {
        axisLabel.textContent = "F";
        for (let ff = 5; ff <= 50; ff += 1) { xs.push(ff); ys.push(ff / m); }
        markerX = F;
      }
      const xMin = xs[0], xMax = xs[xs.length - 1];
      const yMax = Math.max.apply(null, ys.concat([1]));
      const toX = (x) => 40 + ((x - xMin) / (xMax - xMin)) * 400;
      const toY = (y) => 140 - (y / yMax) * 130;
      let d = "";
      xs.forEach((x, i) => { d += (i === 0 ? "M" : "L") + toX(x) + "," + toY(ys[i]) + " "; });
      curvePath.setAttribute("d", d);
      marker.setAttribute("cx", toX(markerX));
      marker.setAttribute("cy", toY(a));
    }

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        mode = btn.dataset.mode;
        redraw();
      });
    });
    fSlider.addEventListener("input", redraw);
    mSlider.addEventListener("input", redraw);
    redraw();

    pushBtn.addEventListener("click", () => {
      if (animating) return;
      animating = true;
      pushBtn.disabled = true;
      cart.setAttribute("x", CART_X0);

      const F = parseFloat(fSlider.value);
      const m = parseFloat(mSlider.value);
      const a = F / m;
      const distM = 0.5 * a * ANIM_SECONDS * ANIM_SECONDS;
      const pxpm = 400 / Math.max(distM, 0.01);

      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        cart.setAttribute("x", CART_X0 + 0.5 * a * t * t * pxpm);
        if (t >= ANIM_SECONDS) {
          animating = false;
          pushBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 2 (Second Law) -- Sled Simulator
  // FIXED: the sled now speeds up while pulled, then friction
  // decelerates it to a stop once the pull is released.
  // ---------------------------------------------------------------
  function initSled() {
    const svg = document.getElementById("sledSvg");
    if (!svg) return;
    const body = document.getElementById("sledBody");
    const pullArrow = document.getElementById("sledPullArrow");
    const fSlider = document.getElementById("sledFSlider");
    const fVal = document.getElementById("sledFVal");
    const mSlider = document.getElementById("sledMSlider");
    const mVal = document.getElementById("sledMVal");
    const muSlider = document.getElementById("sledMuSlider");
    const muVal = document.getElementById("sledMuVal");
    const goBtn = document.getElementById("sledGoBtn");
    const frictionVal = document.getElementById("sledFrictionVal");
    const netVal = document.getElementById("sledNetVal");
    const aVal = document.getElementById("sledAVal");
    const verdictVal = document.getElementById("sledVerdictVal");

    const BODY_X0 = 30, TRACK_PX = 380, PUSH_TIME = 1.2, SLOWMO = 1.6;
    let animating = false, rafId = null;

    function current() {
      const F = parseFloat(fSlider.value);
      const m = parseFloat(mSlider.value);
      const mu = parseFloat(muSlider.value);
      const fk = mu * m * G;          // limiting / kinetic friction
      const net = F - fk;
      const a = net > 0 ? net / m : 0; // acceleration while the pull is applied
      return { F, m, mu, fk, net, a };
    }

    function redraw() {
      const { F, m, mu, fk, net, a } = current();
      fVal.textContent = F + " N";
      mVal.textContent = m + " kg";
      muVal.textContent = mu.toFixed(2);
      frictionVal.textContent = fk.toFixed(1) + " N";
      netVal.textContent = net.toFixed(1) + " N";
      aVal.textContent = a.toFixed(2) + " m/s²";
      verdictVal.textContent = a > 0
        ? "Accelerates while pulled → friction brakes it to a stop"
        : "Doesn't move — static friction holds it";
      pullArrow.setAttribute("x2", 5 + clamp(F * 0.35, 5, 60));
    }
    fSlider.addEventListener("input", () => { if (!animating) redraw(); });
    mSlider.addEventListener("input", () => { if (!animating) redraw(); });
    muSlider.addEventListener("input", () => { if (!animating) redraw(); });
    redraw();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      if (rafId) cancelAnimationFrame(rafId);
      body.setAttribute("x", BODY_X0);
      const { m, fk, a: a1 } = current();
      if (a1 <= 0) { redraw(); return; }   // never overcomes friction

      // Phase 1 (pulling): accelerate at a1 = (F - fk)/m for PUSH_TIME.
      // Phase 2 (released): decelerate at aDecel = fk/m until it stops.
      const aDecel = fk / m;
      const vEnd = a1 * PUSH_TIME;
      const d1 = 0.5 * a1 * PUSH_TIME * PUSH_TIME;
      const tCoast = aDecel > 0 ? vEnd / aDecel : 0;
      const d2 = aDecel > 0 ? (vEnd * vEnd) / (2 * aDecel) : 0;
      const totalDist = d1 + d2;
      const pxpm = TRACK_PX / Math.max(totalDist, 0.01);
      const tEnd = PUSH_TIME + tCoast;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000) / SLOWMO;
        let x, phase;
        if (t <= PUSH_TIME) {
          x = 0.5 * a1 * t * t;
          phase = "Pulling — speeding up (a = " + a1.toFixed(2) + " m/s²)";
        } else if (t <= tEnd) {
          const tc = t - PUSH_TIME;
          x = d1 + vEnd * tc - 0.5 * aDecel * tc * tc;
          phase = "Released — friction slowing it (a = −" + aDecel.toFixed(2) + " m/s²)";
        } else {
          x = totalDist;
          phase = "Stopped by friction";
        }
        body.setAttribute("x", BODY_X0 + x * pxpm);
        verdictVal.textContent = phase;
        if (t >= tEnd) {
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
  // Widget 3 (Second Law) -- Interactive Force Balance
  // ---------------------------------------------------------------
  function initForceBalance() {
    const svg = document.getElementById("fbSvg");
    if (!svg) return;
    const f1Line = document.getElementById("fbF1Line");
    const f2Line = document.getElementById("fbF2Line");
    const f1Handle = document.getElementById("fbF1Handle");
    const f2Handle = document.getElementById("fbF2Handle");
    const netLine = document.getElementById("fbNetLine");
    const block = document.getElementById("fbBlock");
    const mSlider = document.getElementById("fbMSlider");
    const mVal = document.getElementById("fbMVal");
    const releaseBtn = document.getElementById("fbReleaseBtn");
    const f1Val = document.getElementById("fbF1Val");
    const f2Val = document.getElementById("fbF2Val");
    const sumVal = document.getElementById("fbSumVal");
    const aValEl = document.getElementById("fbAVal");

    const ORIGIN = 150, SCALE = 3, MAX_PX = 130;
    const BLOCK_X0 = 140, BLOCK_Y0 = 140;
    let animating = false, rafId = null;

    function clampVec(dx, dy, maxLen) {
      const len = Math.hypot(dx, dy);
      if (len <= maxLen || len === 0) return { dx, dy };
      return { dx: (dx / len) * maxLen, dy: (dy / len) * maxLen };
    }

    function recompute() {
      const f1x = (parseFloat(f1Handle.getAttribute("cx")) - ORIGIN) / SCALE;
      const f1y = (ORIGIN - parseFloat(f1Handle.getAttribute("cy"))) / SCALE;
      const f2x = (parseFloat(f2Handle.getAttribute("cx")) - ORIGIN) / SCALE;
      const f2y = (ORIGIN - parseFloat(f2Handle.getAttribute("cy"))) / SCALE;
      const sumX = f1x + f2x, sumY = f1y + f2y;
      const sumMag = Math.hypot(sumX, sumY);
      let angleDeg = (Math.atan2(sumY, sumX) * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;
      const m = parseFloat(mSlider.value);

      f1Val.textContent = f1x.toFixed(1) + ", " + f1y.toFixed(1) + " N";
      f2Val.textContent = f2x.toFixed(1) + ", " + f2y.toFixed(1) + " N";
      sumVal.textContent = sumMag.toFixed(1) + " N @ " + angleDeg.toFixed(0) + "°";
      aValEl.textContent = (sumMag / m).toFixed(2) + " m/s²";
      mVal.textContent = m + " kg";

      const disp = clampVec(sumX * SCALE, -sumY * SCALE, MAX_PX);
      netLine.setAttribute("x2", ORIGIN + disp.dx);
      netLine.setAttribute("y2", ORIGIN + disp.dy);

      return { sumX, sumY, sumMag, m };
    }

    function wireHandle(handle, line) {
      makeDraggable(handle, svg, (pt) => {
        const dx = pt.x - ORIGIN, dy = pt.y - ORIGIN;
        const c = clampVec(dx, dy, MAX_PX);
        const cx = ORIGIN + c.dx, cy = ORIGIN + c.dy;
        handle.setAttribute("cx", cx);
        handle.setAttribute("cy", cy);
        line.setAttribute("x2", cx);
        line.setAttribute("y2", cy);
        recompute();
      });
    }
    wireHandle(f1Handle, f1Line);
    wireHandle(f2Handle, f2Line);
    mSlider.addEventListener("input", recompute);
    recompute();

    releaseBtn.addEventListener("click", () => {
      if (animating) return;
      block.setAttribute("x", BLOCK_X0);
      block.setAttribute("y", BLOCK_Y0);
      const { sumX, sumY, sumMag } = recompute();
      if (sumMag < 0.5) return;

      animating = true;
      releaseBtn.disabled = true;
      const ux = sumX / sumMag, uy = sumY / sumMag;
      const DIST = 60, DURATION = 1.2;
      const start = performance.now();
      function frame(now) {
        const frac = Math.max(0, Math.min(1, (now - start) / 1000 / DURATION));
        block.setAttribute("x", BLOCK_X0 + ux * DIST * frac);
        block.setAttribute("y", BLOCK_Y0 - uy * DIST * frac);
        if (frac >= 1) {
          animating = false;
          releaseBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  // ---------------------------------------------------------------
  // Widget 1 (Third Law) -- Push-Off Simulator
  // ---------------------------------------------------------------
  function initPushOff() {
    const svg = document.getElementById("poSvg");
    if (!svg) return;
    const circA = document.getElementById("poA");
    const circB = document.getElementById("poB");
    const labelA = document.getElementById("poALabel");
    const labelB = document.getElementById("poBLabel");
    const fSlider = document.getElementById("poFSlider");
    const fVal = document.getElementById("poFVal");
    const maSlider = document.getElementById("poMASlider");
    const maVal = document.getElementById("poMAVal");
    const mbSlider = document.getElementById("poMBSlider");
    const mbVal = document.getElementById("poMBVal");
    const goBtn = document.getElementById("poGoBtn");
    const faVal = document.getElementById("poFAVal");
    const fbVal = document.getElementById("poFBVal");
    const vaVal = document.getElementById("poVAVal");
    const vbVal = document.getElementById("poVBVal");
    const presetButtons = Array.from(document.querySelectorAll("#poPresetRow button"));

    const CENTER = 230, DT = 0.3, ANIM_SECONDS = 2, WALL_MASS = 1e6;
    let wallMode = false, animating = false, rafId = null;

    function current() {
      const F = parseFloat(fSlider.value);
      const mA = parseFloat(maSlider.value);
      const mB = wallMode ? WALL_MASS : parseFloat(mbSlider.value);
      const impulse = F * DT;
      return { F, mA, mB, vA: impulse / mA, vB: impulse / mB };
    }

    function redraw() {
      const { F, mA, mB, vA, vB } = current();
      fVal.textContent = F + " N";
      maVal.textContent = mA + " kg";
      mbVal.textContent = wallMode ? "≈ ∞ (Earth via the wall)" : mB + " kg";
      faVal.textContent = F.toFixed(1) + " N";
      fbVal.textContent = "−" + F.toFixed(1) + " N";
      vaVal.textContent = vA.toFixed(2) + " m/s";
      vbVal.textContent = wallMode ? vB.toExponential(1) + " m/s (unmeasurable)" : vB.toFixed(2) + " m/s";
      labelB.textContent = wallMode ? "Wall" : "B";
      mbSlider.disabled = wallMode;
    }

    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        wallMode = btn.dataset.preset === "wall";
        if (btn.dataset.preset === "skaters") { maSlider.value = 50; mbSlider.value = 70; }
        else if (btn.dataset.preset === "boat") { maSlider.value = 65; mbSlider.value = 120; }
        else if (btn.dataset.preset === "wall") { maSlider.value = 65; }
        redraw();
      });
    });
    fSlider.addEventListener("input", redraw);
    maSlider.addEventListener("input", redraw);
    mbSlider.addEventListener("input", redraw);
    redraw();

    goBtn.addEventListener("click", () => {
      if (animating) return;
      circA.setAttribute("cx", CENTER);
      circB.setAttribute("cx", CENTER);
      const { vA, vB } = current();
      const vMax = Math.max(vA, wallMode ? 0 : vB, 0.01);
      const pxpm = 200 / (vMax * ANIM_SECONDS);

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        const ax = CENTER - vA * t * pxpm;
        const bx = CENTER + vB * t * pxpm;
        circA.setAttribute("cx", ax);
        circB.setAttribute("cx", bx);
        labelA.setAttribute("x", ax);
        labelB.setAttribute("x", bx);
        if (t >= ANIM_SECONDS) {
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
  // Widget 2 (Third Law) -- Force-Sensor Pair
  // ---------------------------------------------------------------
  function initForceSensor() {
    const svg = document.getElementById("fsSvg");
    if (!svg) return;
    const fSlider = document.getElementById("fsFSlider");
    const fVal = document.getElementById("fsFVal");
    const cheatSlider = document.getElementById("fsCheatSlider");
    const cheatVal = document.getElementById("fsCheatVal");
    const msg = document.getElementById("fsMsg");
    const readF = document.getElementById("fsReadF");
    const readBack = document.getElementById("fsReadBack");
    const arrowRight = document.getElementById("fsArrowRight");
    const arrowLeft = document.getElementById("fsArrowLeft");

    function sync() {
      const F = parseFloat(fSlider.value);
      fVal.textContent = F + " N";
      readF.textContent = F.toFixed(1) + " N";
      readBack.textContent = F.toFixed(1) + " N";
      cheatSlider.value = F;
      cheatVal.textContent = F + " N (locked to match)";
      arrowRight.setAttribute("x2", 100 + clamp(F * 0.4, 10, 90));
      arrowLeft.setAttribute("x2", 200 - clamp(F * 0.4, 10, 90));
    }
    fSlider.addEventListener("input", () => { sync(); msg.textContent = ""; });
    cheatSlider.addEventListener("input", () => {
      sync();
      msg.textContent = "No matter how hard you try, they're always equal — that's not a rule about the objects, it's a rule about the interaction itself.";
    });
    sync();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Friction) -- Static vs. Kinetic Friction
  // ---------------------------------------------------------------
  function initStaticKinetic() {
    const svg = document.getElementById("frBoxSvg");
    if (!svg) return;
    const pushArrow = document.getElementById("frPushArrow");
    const frictionArrow = document.getElementById("frFrictionArrow");
    const box = document.getElementById("frBox");
    const fSlider = document.getElementById("frFSlider");
    const fVal = document.getElementById("frFVal");
    const mSlider = document.getElementById("frMSlider");
    const mVal = document.getElementById("frMVal");
    const muSSlider = document.getElementById("frMuSSlider");
    const muSVal = document.getElementById("frMuSVal");
    const muKSlider = document.getElementById("frMuKSlider");
    const muKVal = document.getElementById("frMuKVal");
    const fsMaxVal = document.getElementById("frFsMaxVal");
    const frictionVal = document.getElementById("frFrictionVal");
    const stateVal = document.getElementById("frStateVal");
    const aVal = document.getElementById("frAVal");
    const graphPath = document.getElementById("frGraphPath");
    const marker = document.getElementById("frGraphMarker");

    function redraw() {
      const F = parseFloat(fSlider.value);
      const m = parseFloat(mSlider.value);
      const muS = parseFloat(muSSlider.value);
      const muK = parseFloat(muKSlider.value);
      const N = m * G;
      const fsMax = muS * N;
      const fk = muK * N;
      const sliding = F > fsMax;
      const friction = sliding ? fk : F;
      const a = sliding ? (F - fk) / m : 0;

      fVal.textContent = F + " N";
      mVal.textContent = m + " kg";
      muSVal.textContent = muS.toFixed(2);
      muKVal.textContent = muK.toFixed(2);
      fsMaxVal.textContent = fsMax.toFixed(1) + " N";
      frictionVal.textContent = friction.toFixed(1) + " N";
      stateVal.textContent = sliding ? "Sliding!" : "Holding still (static friction)";
      aVal.textContent = a.toFixed(2) + " m/s²";

      pushArrow.setAttribute("x2", 118 - clamp(F * 0.3, 5, 38));
      pushArrow.setAttribute("x1", 118 - clamp(F * 0.3, 5, 38) - 30);
      frictionArrow.setAttribute("x2", 167 + clamp(friction * 0.3, 5, 38));

      const xMax = 100;
      const toX = (x) => 35 + (x / xMax) * 250;
      const toY = (y) => 140 - (y / (xMax * 0.9)) * 130;
      const d = "M" + toX(0) + "," + toY(0) + " L" + toX(fsMax) + "," + toY(fsMax) + " L" + toX(xMax) + "," + toY(fk);
      graphPath.setAttribute("d", d);
      marker.setAttribute("cx", toX(F));
      marker.setAttribute("cy", toY(friction));
    }
    [fSlider, mSlider, muSSlider, muKSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Friction) -- Surface Comparison
  // ---------------------------------------------------------------
  function initSurfaceComparison() {
    const svg = document.getElementById("surfSvg");
    if (!svg) return;
    const box = document.getElementById("surfBox");
    const pushArrow = document.getElementById("surfPushArrow");
    const fSlider = document.getElementById("surfFSlider");
    const fVal = document.getElementById("surfFVal");
    const mSlider = document.getElementById("surfMSlider");
    const mVal = document.getElementById("surfMVal");
    const muVal = document.getElementById("surfMuVal");
    const fsMaxVal = document.getElementById("surfFsMaxVal");
    const verdictVal = document.getElementById("surfVerdictVal");
    const presetButtons = Array.from(document.querySelectorAll("#surfPresetRow button"));

    let muS = 0.9, muK = 0.7;
    const BOX_REST_X = 90, BOX_SLIDE_X = 175;

    function redraw() {
      const F = parseFloat(fSlider.value);
      const m = parseFloat(mSlider.value);
      const N = m * G;
      const fsMax = muS * N;
      const slides = F > fsMax;
      fVal.textContent = F + " N";
      mVal.textContent = m + " kg";
      muVal.textContent = muS.toFixed(2) + " / " + muK.toFixed(2);
      fsMaxVal.textContent = fsMax.toFixed(1) + " N";
      verdictVal.textContent = slides ? "Slides!" : "Doesn't move";
      box.setAttribute("x", slides ? BOX_SLIDE_X : BOX_REST_X);
      const arrowLen = 10 + Math.min(F, 60) * 0.55;
      const boxX = slides ? BOX_SLIDE_X : BOX_REST_X;
      pushArrow.setAttribute("x1", boxX - 5 - arrowLen);
      pushArrow.setAttribute("x2", boxX - 3);
    }
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        muS = parseFloat(btn.dataset.mus);
        muK = parseFloat(btn.dataset.muk);
        redraw();
      });
    });
    fSlider.addEventListener("input", redraw);
    mSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 3 (Friction) -- Traction Limit: Braking and Turning
  // ---------------------------------------------------------------
  function initTraction() {
    const svg = document.getElementById("tractionSvg");
    if (!svg) return;
    const dot = document.getElementById("tractionDot");
    const circle = document.getElementById("tractionCircle");
    const vSlider = document.getElementById("tracVSlider");
    const vVal = document.getElementById("tracVVal");
    const muSlider = document.getElementById("tracMuSlider");
    const muVal = document.getElementById("tracMuVal");
    const aVal = document.getElementById("tracAVal");
    const brakeVal = document.getElementById("tracBrakeVal");
    const turnVal = document.getElementById("tracTurnVal");
    const PX_PER_MS2 = 80 / 9.8;

    function redraw() {
      const v = parseFloat(vSlider.value);
      const mu = parseFloat(muSlider.value);
      const a = mu * G;
      const brake = (v * v) / (2 * a);
      const turn = (v * v) / a;
      vVal.textContent = v + " m/s";
      muVal.textContent = mu.toFixed(2);
      aVal.textContent = a.toFixed(2) + " m/s²";
      brakeVal.textContent = brake.toFixed(1) + " m";
      turnVal.textContent = turn.toFixed(1) + " m";
      const r = a * PX_PER_MS2;
      circle.setAttribute("r", r);
      dot.setAttribute("cy", 100 - r);
      dot.setAttribute("cx", 130);
    }
    vSlider.addEventListener("input", redraw);
    muSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Inclined Planes) -- Incline Force-Component Explorer
  // ---------------------------------------------------------------
  function initInclineComponents() {
    const svg = document.getElementById("incSvg");
    if (!svg) return;
    const rampFill = document.getElementById("incRampFill");
    const block = document.getElementById("incBlock");
    const gravity = document.getElementById("incGravity");
    const parArrow = document.getElementById("incParArrow");
    const normalArrow = document.getElementById("incNormalArrow");
    const frictionArrow = document.getElementById("incFrictionArrow");
    const thetaSlider = document.getElementById("incThetaSlider");
    const thetaVal = document.getElementById("incThetaVal");
    const mSlider = document.getElementById("incMSlider");
    const mVal = document.getElementById("incMVal");
    const muSSlider = document.getElementById("incMuSSlider");
    const muSVal = document.getElementById("incMuSVal");
    const muKSlider = document.getElementById("incMuKSlider");
    const muKVal = document.getElementById("incMuKVal");
    const mgVal = document.getElementById("incMgVal");
    const parVal = document.getElementById("incParVal");
    const nVal = document.getElementById("incNVal");
    const frictionVal = document.getElementById("incFrictionVal");
    const stateVal = document.getElementById("incStateVal");

    const BASE = { x: 20, y: 200 }, LEN = 220, ARROW_SCALE = 0.5, ARROW_MIN = 12;

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const m = parseFloat(mSlider.value);
      const muS = parseFloat(muSSlider.value);
      const muK = parseFloat(muKSlider.value);
      const mg = m * G;
      const along = mg * Math.sin(theta);
      const N = mg * Math.cos(theta);
      const fsMax = muS * N;
      const sliding = along > fsMax;
      const friction = sliding ? muK * N : along;

      thetaVal.textContent = thetaDeg + "°";
      mVal.textContent = m + " kg";
      muSVal.textContent = muS.toFixed(2);
      muKVal.textContent = muK.toFixed(2);
      mgVal.textContent = mg.toFixed(1) + " N";
      parVal.textContent = along.toFixed(1) + " N";
      nVal.textContent = N.toFixed(1) + " N";
      frictionVal.textContent = friction.toFixed(1) + " N (" + (sliding ? "kinetic" : "static") + ")";
      stateVal.textContent = sliding ? "Slides down!" : "Holds";

      const run = LEN * Math.cos(theta), rise = LEN * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      const bottomRight = { x: BASE.x + run, y: BASE.y };
      rampFill.setAttribute("d", "M" + BASE.x + "," + BASE.y + " L" + top.x + "," + top.y + " L" + bottomRight.x + "," + bottomRight.y + " Z");

      const f = 0.55;
      const bx = BASE.x + f * run, by = BASE.y - f * rise;
      const uPerpOut = { x: -Math.sin(theta), y: -Math.cos(theta) };
      const blockCx = bx + uPerpOut.x * 14, blockCy = by + uPerpOut.y * 14;
      block.setAttribute("transform", "translate(" + blockCx + "," + blockCy + ") rotate(" + -thetaDeg + ") translate(-13,-9)");

      const uPar = { x: -Math.cos(theta), y: Math.sin(theta) };
      const uPerpInto = { x: Math.sin(theta), y: Math.cos(theta) };
      const uUpSlope = { x: -uPar.x, y: -uPar.y };

      function arrow(el, ux, uy, mag) {
        const len = Math.max(ARROW_MIN, mag * ARROW_SCALE);
        el.setAttribute("x1", blockCx);
        el.setAttribute("y1", blockCy);
        el.setAttribute("x2", blockCx + ux * len);
        el.setAttribute("y2", blockCy + uy * len);
      }
      arrow(gravity, 0, 1, mg);
      arrow(parArrow, uPar.x, uPar.y, along);
      arrow(normalArrow, uPerpOut.x, uPerpOut.y, N);
      arrow(frictionArrow, uUpSlope.x, uUpSlope.y, friction);
    }
    [thetaSlider, mSlider, muSSlider, muKSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 2 (Inclined Planes) -- Critical Angle Experiment
  // ---------------------------------------------------------------
  function initCriticalAngle() {
    const svg = document.getElementById("critGraphSvg");
    if (!svg) return;
    const curvePath = document.getElementById("critCurvePath");
    const muLine = document.getElementById("critMuLine");
    const marker = document.getElementById("critMarker");
    const thetaSlider = document.getElementById("critThetaSlider");
    const thetaVal = document.getElementById("critThetaVal");
    const muSlider = document.getElementById("critMuSlider");
    const tanVal = document.getElementById("critTanVal");
    const angleVal = document.getElementById("critAngleVal");
    const verdictVal = document.getElementById("critVerdictVal");

    const THETA_MAX = 80, MU_MAX = 1.2;
    const toX = (t) => 35 + (t / THETA_MAX) * 250;
    const toY = (mu) => 140 - (Math.min(mu, MU_MAX) / MU_MAX) * 130;

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const mu = parseFloat(muSlider.value);
      const tanTheta = Math.tan((thetaDeg * Math.PI) / 180);
      const critDeg = (Math.atan(mu) * 180) / Math.PI;

      thetaVal.textContent = thetaDeg + "°";
      tanVal.textContent = tanTheta.toFixed(3);
      angleVal.textContent = critDeg.toFixed(1) + "°";
      verdictVal.textContent = tanTheta > mu ? "Slides" : "Holds";

      let d = "";
      for (let t = 0; t <= THETA_MAX; t += 2) {
        d += (t === 0 ? "M" : "L") + toX(t) + "," + toY(Math.tan((t * Math.PI) / 180)) + " ";
      }
      curvePath.setAttribute("d", d);
      muLine.setAttribute("y1", toY(mu));
      muLine.setAttribute("y2", toY(mu));
      marker.setAttribute("cx", toX(thetaDeg));
      marker.setAttribute("cy", toY(tanTheta));
    }
    thetaSlider.addEventListener("input", redraw);
    muSlider.addEventListener("input", redraw);
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 3 (Inclined Planes) -- Ladder-Balance Explorer
  // ---------------------------------------------------------------
  function initLadder() {
    const svg = document.getElementById("ladderSvg");
    if (!svg) return;
    const ladderLine = document.getElementById("ladderLine");
    const person = document.getElementById("ladderPerson");
    const thetaSlider = document.getElementById("ladThetaSlider");
    const thetaVal = document.getElementById("ladThetaVal");
    const dSlider = document.getElementById("ladDSlider");
    const dVal = document.getElementById("ladDVal");
    const mSlider = document.getElementById("ladMSlider");
    const mVal = document.getElementById("ladMVal");
    const muSlider = document.getElementById("ladMuSlider");
    const muVal = document.getElementById("ladMuVal");
    const reqVal = document.getElementById("ladReqVal");
    const maxVal = document.getElementById("ladMaxVal");
    const verdictVal = document.getElementById("ladVerdictVal");

    const BASE = { x: 15, y: 200 }, L_LADDER = 3, L_PX = 190, M_LADDER = 8;

    function redraw() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const frac = parseFloat(dSlider.value) / 100;
      const m = parseFloat(mSlider.value);
      const mu = parseFloat(muSlider.value);
      const d = frac * L_LADDER;

      const nWall = (G * Math.cos(theta) * (M_LADDER * L_LADDER / 2 + m * d)) / (L_LADDER * Math.sin(theta));
      const floorFriction = nWall;
      const nFloor = (M_LADDER + m) * G;
      const maxFriction = mu * nFloor;
      const stable = floorFriction <= maxFriction;

      thetaVal.textContent = thetaDeg + "°";
      dVal.textContent = dSlider.value + "%";
      mVal.textContent = m + " kg";
      muVal.textContent = mu.toFixed(2);
      reqVal.textContent = floorFriction.toFixed(1) + " N";
      maxVal.textContent = maxFriction.toFixed(1) + " N";
      verdictVal.textContent = stable ? "Stable" : "Slips!";

      const topX = BASE.x + L_PX * Math.cos(theta);
      const topY = BASE.y - L_PX * Math.sin(theta);
      ladderLine.setAttribute("x2", topX);
      ladderLine.setAttribute("y2", topY);
      person.setAttribute("cx", BASE.x + frac * L_PX * Math.cos(theta));
      person.setAttribute("cy", BASE.y - frac * L_PX * Math.sin(theta));
    }
    [thetaSlider, dSlider, mSlider, muSlider].forEach((s) => s.addEventListener("input", redraw));
    redraw();
  }

  // ---------------------------------------------------------------
  // Widget 1 (Tension) -- Two Blocks Connected on a Table
  // ---------------------------------------------------------------
  function initTableBlocks() {
    const svg = document.getElementById("tcTableSvg");
    if (!svg) return;
    const rope = document.getElementById("tcRope");
    const block1 = document.getElementById("tcBlock1");
    const block2 = document.getElementById("tcBlock2");
    const forceArrow = document.getElementById("tcForceArrow");
    const fSlider = document.getElementById("tcFSlider");
    const fVal = document.getElementById("tcFVal");
    const m1Slider = document.getElementById("tcM1Slider");
    const m1Val = document.getElementById("tcM1Val");
    const m2Slider = document.getElementById("tcM2Slider");
    const m2Val = document.getElementById("tcM2Val");
    const goBtn = document.getElementById("tcGoBtn");
    const aVal = document.getElementById("tcAVal");
    const tVal = document.getElementById("tcTVal");

    const B1_X0 = 300, GAP = 45, ANIM_SECONDS = 2.5;
    let animating = false, rafId = null;

    function current() {
      const F = parseFloat(fSlider.value);
      const m1 = parseFloat(m1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const a = F / (m1 + m2);
      const T = m2 * a;
      return { F, m1, m2, a, T };
    }

    function place(x1) {
      block1.setAttribute("x", x1);
      block2.setAttribute("x", x1 - GAP);
      rope.setAttribute("x1", x1 - GAP + 35);
      rope.setAttribute("x2", x1);
      forceArrow.setAttribute("x1", x1 + 55);
      forceArrow.setAttribute("y1", 52);
      forceArrow.setAttribute("x2", x1 + 37);
      forceArrow.setAttribute("y2", 52);
    }

    function redraw() {
      const { F, m1, m2, a, T } = current();
      fVal.textContent = F + " N";
      m1Val.textContent = m1 + " kg";
      m2Val.textContent = m2 + " kg";
      aVal.textContent = a.toFixed(2) + " m/s²";
      tVal.textContent = T.toFixed(1) + " N";
    }
    fSlider.addEventListener("input", redraw);
    m1Slider.addEventListener("input", redraw);
    m2Slider.addEventListener("input", redraw);
    redraw();
    place(B1_X0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      place(B1_X0);
      const { a } = current();
      const distM = 0.5 * a * ANIM_SECONDS * ANIM_SECONDS;
      const pxpm = 100 / Math.max(distM, 0.01);

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        place(B1_X0 + 0.5 * a * t * t * pxpm);
        if (t >= ANIM_SECONDS) {
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
  // Widget 2 (Tension) -- Atwood Machine
  // ---------------------------------------------------------------
  function initAtwood() {
    const svg = document.getElementById("atwSvg");
    if (!svg) return;
    const massA = document.getElementById("atwMassA");
    const massB = document.getElementById("atwMassB");
    const ropeLeft = document.getElementById("atwRopeLeft");
    const ropeRight = document.getElementById("atwRopeRight");
    const maSlider = document.getElementById("atwMASlider");
    const maVal = document.getElementById("atwMAVal");
    const mbSlider = document.getElementById("atwMBSlider");
    const mbVal = document.getElementById("atwMBVal");
    const goBtn = document.getElementById("atwGoBtn");
    const aVal = document.getElementById("atwAVal");
    const tVal = document.getElementById("atwTVal");
    const gVal = document.getElementById("atwGVal");

    const Y0 = 100, ANIM_SECONDS = 2, MAX_TRAVEL = 50;
    let animating = false, rafId = null;

    function current() {
      const mA = parseFloat(maSlider.value);
      const mB = parseFloat(mbSlider.value);
      const a = ((mA - mB) * G) / (mA + mB);
      const T = (2 * mA * mB * G) / (mA + mB);
      return { mA, mB, a, T };
    }

    function place(yOffset) {
      massA.setAttribute("y", Y0 + yOffset);
      massB.setAttribute("y", Y0 - yOffset);
      ropeLeft.setAttribute("y2", Y0 + yOffset);
      ropeRight.setAttribute("y2", Y0 - yOffset);
    }

    function redraw() {
      const { mA, mB, a, T } = current();
      maVal.textContent = mA + " kg";
      mbVal.textContent = mB + " kg";
      aVal.textContent = a.toFixed(2) + " m/s²";
      tVal.textContent = T.toFixed(1) + " N";
      gVal.textContent = G + " m/s²";
    }
    maSlider.addEventListener("input", redraw);
    mbSlider.addEventListener("input", redraw);
    redraw();
    place(0);

    goBtn.addEventListener("click", () => {
      if (animating) return;
      place(0);
      const { a } = current();
      if (Math.abs(a) < 0.01) return;
      const travel = Math.min(MAX_TRAVEL, 0.5 * Math.abs(a) * ANIM_SECONDS * ANIM_SECONDS * 20);
      const sign = a > 0 ? 1 : -1;

      animating = true;
      goBtn.disabled = true;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(ANIM_SECONDS, Math.max(0, (now - start) / 1000));
        const frac = t / ANIM_SECONDS;
        place(sign * travel * frac * frac);
        if (t >= ANIM_SECONDS) {
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
  // Widget 3 (Tension) -- Incline Connected to a Hanging Mass
  // FIXED: was static (sliders updated numbers only, no m2 drawn).
  // Now draws a hanging mass + rope (created in JS) and animates the
  // block sliding along the ramp with Release / Reset controls.
  // ---------------------------------------------------------------
  function initInclineTension() {
    const svg = document.getElementById("itSvg");
    if (!svg) return;
    const rampFill = document.getElementById("itRampFill");
    const block = document.getElementById("itBlock");
    const ropeUp = document.getElementById("itRopeUp");
    const thetaSlider = document.getElementById("itThetaSlider");
    const thetaVal = document.getElementById("itThetaVal");
    const m1Slider = document.getElementById("itM1Slider");
    const m1Val = document.getElementById("itM1Val");
    const m2Slider = document.getElementById("itM2Slider");
    const m2Val = document.getElementById("itM2Val");
    const muSlider = document.getElementById("itMuSlider");
    const muVal = document.getElementById("itMuVal");
    const aVal = document.getElementById("itAVal");
    const tVal = document.getElementById("itTVal");
    const verdictVal = document.getElementById("itVerdictVal");

    const PULLEY = { x: 240, y: 20 };
    const BASE = { x: 20, y: 200 };
    const RAMP_PX = 190, RAMP_M = 3, PXPM = RAMP_PX / RAMP_M;
    const F_REST = 0.42, F_MIN = 0.12, F_MAX = 0.82;
    const HANG_Y0 = 78, HANG_MIN = 40, HANG_MAX = 178;

    // --- inject hanging mass + rope (no HTML edit required) ---
    let hangRope = document.getElementById("itHangRope");
    if (!hangRope) {
      hangRope = svgEl("line", { id: "itHangRope", stroke: "#6b7280", "stroke-width": 2 });
      svg.appendChild(hangRope);
    }
    let hangMass = document.getElementById("itHangMass");
    if (!hangMass) {
      hangMass = svgEl("rect", {
        id: "itHangMass", width: 22, height: 18, rx: 2,
        fill: "#c0392b", stroke: "#7b241c", "stroke-width": 1.5
      });
      svg.appendChild(hangMass);
    }
    let hangLabel = document.getElementById("itHangLabel");
    if (!hangLabel) {
      hangLabel = svgEl("text", {
        id: "itHangLabel", "text-anchor": "middle", "font-size": 10, fill: "#fff"
      });
      hangLabel.textContent = "m\u2082";
      svg.appendChild(hangLabel);
    }

    // --- inject Release / Reset controls ---
    const widget = svg.closest(".widget") || svg.parentElement;
    let btnRow = widget ? widget.querySelector(".nl-anim-row[data-for='it']") : null;
    let goBtn, resetBtn;
    if (!btnRow) {
      btnRow = document.createElement("div");
      btnRow.className = "nl-anim-row";
      btnRow.setAttribute("data-for", "it");
      goBtn = document.createElement("button");
      goBtn.type = "button";
      goBtn.className = "nl-btn";
      goBtn.textContent = "\u25B6 Release";
      resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "nl-btn nl-btn-secondary";
      resetBtn.textContent = "\u21BA Reset";
      btnRow.appendChild(goBtn);
      btnRow.appendChild(resetBtn);
      svg.insertAdjacentElement("afterend", btnRow);
    } else {
      goBtn = btnRow.querySelector(".nl-btn:not(.nl-btn-secondary)");
      resetBtn = btnRow.querySelector(".nl-btn-secondary");
    }

    let animating = false, rafId = null;

    function state() {
      const thetaDeg = parseFloat(thetaSlider.value);
      const theta = (thetaDeg * Math.PI) / 180;
      const m1 = parseFloat(m1Slider.value);
      const m2 = parseFloat(m2Slider.value);
      const mu = parseFloat(muSlider.value);
      const netDriving = m2 * G - m1 * G * Math.sin(theta);
      const frictionMag = mu * m1 * G * Math.cos(theta);
      let a = 0, T, dir = 0, verdict;
      if (Math.abs(netDriving) <= frictionMag) {
        a = 0; T = m2 * G; dir = 0;
        verdict = "Static equilibrium — friction holds it";
      } else if (netDriving > frictionMag) {
        a = (netDriving - frictionMag) / (m1 + m2);
        T = m2 * (G - a); dir = 1;
        verdict = "Hanging mass wins — block slides up the ramp";
      } else {
        a = (-netDriving - frictionMag) / (m1 + m2);
        T = m2 * (G + a); dir = -1;
        verdict = "Block wins — slides down, hanging mass rises";
      }
      return { thetaDeg, theta, m1, m2, mu, a, T, dir, verdict };
    }

    function placeBlock(f) {
      const { theta, thetaDeg } = state();
      const run = RAMP_PX * Math.cos(theta), rise = RAMP_PX * Math.sin(theta);
      const bx = BASE.x + f * run, by = BASE.y - f * rise;
      const uPerpOut = { x: -Math.sin(theta), y: -Math.cos(theta) };
      const blockCx = bx + uPerpOut.x * 14, blockCy = by + uPerpOut.y * 14;
      block.setAttribute("transform",
        "translate(" + blockCx + "," + blockCy + ") rotate(" + -thetaDeg + ") translate(-13,-9)");
      ropeUp.setAttribute("x1", blockCx);
      ropeUp.setAttribute("y1", blockCy);
      ropeUp.setAttribute("x2", PULLEY.x);
      ropeUp.setAttribute("y2", PULLEY.y + 14);
    }

    function placeHang(y) {
      hangRope.setAttribute("x1", PULLEY.x);
      hangRope.setAttribute("y1", PULLEY.y + 14);
      hangRope.setAttribute("x2", PULLEY.x);
      hangRope.setAttribute("y2", y);
      hangMass.setAttribute("x", PULLEY.x - 11);
      hangMass.setAttribute("y", y);
      hangLabel.setAttribute("x", PULLEY.x);
      hangLabel.setAttribute("y", y + 13);
    }

    function drawRamp() {
      const { theta } = state();
      const run = RAMP_PX * Math.cos(theta), rise = RAMP_PX * Math.sin(theta);
      const top = { x: BASE.x + run, y: BASE.y - rise };
      rampFill.setAttribute("d",
        "M" + BASE.x + "," + BASE.y + " L" + top.x + "," + top.y +
        " L" + (BASE.x + run) + "," + BASE.y + " Z");
    }

    function redraw() {
      if (rafId) cancelAnimationFrame(rafId);
      animating = false;
      if (goBtn) goBtn.disabled = false;
      const s = state();
      thetaVal.textContent = s.thetaDeg + "°";
      m1Val.textContent = s.m1 + " kg";
      m2Val.textContent = s.m2 + " kg";
      muVal.textContent = s.mu.toFixed(2);
      aVal.textContent = s.a.toFixed(2) + " m/s²";
      tVal.textContent = s.T.toFixed(1) + " N";
      verdictVal.textContent = s.verdict;
      drawRamp();
      placeBlock(F_REST);
      placeHang(HANG_Y0);
    }

    [thetaSlider, m1Slider, m2Slider, muSlider].forEach((sl) =>
      sl.addEventListener("input", redraw));

    goBtn.addEventListener("click", () => {
      if (animating) return;
      const s = state();
      if (s.dir === 0 || s.a <= 0) { redraw(); return; }

      animating = true;
      goBtn.disabled = true;
      const SLOWMO = 1.4;
      const start = performance.now();
      function frame(now) {
        const t = Math.max(0, (now - start) / 1000) / SLOWMO;
        const dist = 0.5 * s.a * t * t;                 // metres along the rope
        const f = F_REST + s.dir * (dist / RAMP_M);      // fraction along ramp
        const hangY = HANG_Y0 + s.dir * dist * PXPM;     // mass drops as block climbs
        const cf = clamp(f, F_MIN, F_MAX);
        const cy = clamp(hangY, HANG_MIN, HANG_MAX);
        placeBlock(cf);
        placeHang(cy);
        const hitLimit = f !== cf || hangY !== cy;
        if (hitLimit || t > 4) {
          animating = false;
          goBtn.disabled = false;
          return;
        }
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });

    resetBtn.addEventListener("click", redraw);

    redraw();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCoinCard();
    initLurch();
    initPuckCoast();
    initCartMass();
    initSled();
    initForceBalance();
    initPushOff();
    initForceSensor();
    initStaticKinetic();
    initSurfaceComparison();
    initTraction();
    initInclineComponents();
    initCriticalAngle();
    initLadder();
    initTableBlocks();
    initAtwood();
    initInclineTension();
  });
})();
