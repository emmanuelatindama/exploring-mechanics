// Interactive widgets for docs/10-capstones/index.html.
// Drop-in replacement: preserves all existing element IDs; new widgets are
// self-building and no-op unless their host <div> exists.
(function () {
  const G = 9.8;
  const NS = "http://www.w3.org/2000/svg";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ============ 1. BOWLING PHYSICS ============ */
  function initBowling() {
    const v0Slider = document.getElementById("bowlV0Slider");
    if (!v0Slider) return;
    const muSlider = document.getElementById("bowlMuSlider");
    const v0Val = document.getElementById("bowlV0Val");
    const muVal = document.getElementById("bowlMuVal");
    const rollSpeedVal = document.getElementById("bowlRollSpeedVal");
    const skidTimeVal = document.getElementById("bowlSkidTimeVal");
    const skidDistVal = document.getElementById("bowlSkidDistVal");
    const pinSpeedVal = document.getElementById("bowlPinSpeedVal");
    const ball = document.getElementById("bowlBall");
    const pin = document.getElementById("bowlPin");
    const skidMarker = document.getElementById("bowlSkidMarker");
    const goBtn = document.getElementById("bowlGoBtn");
    const LANE_M = 18.3, LANE_PX = 260, X0 = 20;
    let running = false, t0 = 0, rafId = null;

    function compute() {
      const v0 = +v0Slider.value, mu = +muSlider.value;
      const tSkid = v0 / (3.5 * mu * G);
      const vRoll = (5 / 7) * v0;
      const dSkid = v0 * tSkid - 0.5 * mu * G * tSkid * tSkid;
      // Speed when the ball actually reaches the pins (lane end). If the skid
      // finishes before the lane runs out, that's just vRoll (friction no
      // longer matters). But if the lane isn't long enough for the skid to
      // finish, the ball is still slowing down under friction when it hits
      // the pins, so its speed there is higher than vRoll and does depend on mu.
      let vAtPins;
      if (dSkid <= LANE_M) {
        vAtPins = vRoll;
      } else {
        const t = (v0 - Math.sqrt(Math.max(0, v0 * v0 - 2 * mu * G * LANE_M))) / (mu * G);
        vAtPins = v0 - mu * G * t;
      }
      return { v0, mu, tSkid, vRoll, dSkid, vAtPins };
    }
    function render() {
      v0Val.textContent = (+v0Slider.value).toFixed(1) + " m/s";
      muVal.textContent = (+muSlider.value).toFixed(2);
      const c = compute();
      rollSpeedVal.textContent = c.vRoll.toFixed(2) + " m/s";
      skidTimeVal.textContent = c.tSkid.toFixed(2) + " s";
      skidDistVal.textContent = c.dSkid.toFixed(2) + " m";
      const skidPx = clamp((c.dSkid / LANE_M) * LANE_PX, 0, LANE_PX);
      skidMarker.setAttribute("x1", X0 + skidPx);
      skidMarker.setAttribute("x2", X0 + skidPx);
    }
    [v0Slider, muSlider].forEach((s) => s.addEventListener("input", render));
    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000, c = compute();
      let x;
      if (t < c.tSkid) x = c.v0 * t - 0.5 * c.mu * G * t * t;
      else x = c.dSkid + c.vRoll * (t - c.tSkid);
      const xPx = (x / LANE_M) * LANE_PX;
      ball.setAttribute("cx", X0 + Math.min(xPx, LANE_PX));
      if (xPx >= LANE_PX) {
        const mb = 7, mp = 1.6, e = 0.3;
        pinSpeedVal.textContent = (((1 + e) * mb * c.vAtPins) / (mb + mp)).toFixed(2) + " m/s";
        pin.setAttribute("cx", X0 + LANE_PX + 12);
        running = false; return;
      }
      rafId = requestAnimationFrame(frame);
    }
    goBtn.addEventListener("click", () => {
      if (running) { running = false; if (rafId) cancelAnimationFrame(rafId); return; }
      running = true; t0 = performance.now();
      pin.setAttribute("cx", X0 + LANE_PX + 4);
      pinSpeedVal.textContent = "—";
      rafId = requestAnimationFrame(frame);
    });
    render();
  }

  /* ============ 2. BICYCLE MECHANICS ============ */
  function initBicycle() {
    const cadenceSlider = document.getElementById("bikeCadenceSlider");
    if (!cadenceSlider) return;
    const frontSlider = document.getElementById("bikeFrontSlider");
    const rearSlider = document.getElementById("bikeRearSlider");
    const slopeSlider = document.getElementById("bikeSlopeSlider");
    const powerSlider = document.getElementById("bikePowerSlider");
    const cadenceVal = document.getElementById("bikeCadenceVal");
    const frontVal = document.getElementById("bikeFrontVal");
    const rearVal = document.getElementById("bikeRearVal");
    const slopeVal = document.getElementById("bikeSlopeVal");
    const powerVal = document.getElementById("bikePowerVal");
    const wheelSpeedVal = document.getElementById("bikeWheelSpeedVal");
    const speedVal = document.getElementById("bikeSpeedVal");
    const maxSpeedVal = document.getElementById("bikeMaxSpeedVal");
    const torqueVal = document.getElementById("bikeTorqueVal");
    const wheelEl = document.getElementById("bikeWheel");
    const WHEEL_R = 0.34, MASS = 80;
    function render() {
      const cadence = +cadenceSlider.value, front = +frontSlider.value, rear = +rearSlider.value;
      const slopeDeg = +slopeSlider.value, power = +powerSlider.value;
      cadenceVal.textContent = cadence + " rpm";
      frontVal.textContent = front + " teeth";
      rearVal.textContent = rear + " teeth";
      slopeVal.textContent = slopeDeg + "°";
      powerVal.textContent = power + " W";
      const gearRatio = front / rear;
      const wheelOmega = ((cadence * 2 * Math.PI) / 60) * gearRatio;
      const wheelSpeed = wheelOmega * WHEEL_R;
      wheelSpeedVal.textContent = wheelSpeed.toFixed(2) + " m/s (" + (wheelSpeed * 3.6).toFixed(1) + " km/h)";
      const slope = (slopeDeg * Math.PI) / 180;
      const gravityForce = MASS * G * Math.sin(slope), rollingResist = 0.005 * MASS * G;
      const maxSpeed = power / Math.max(gravityForce + rollingResist, 1);
      maxSpeedVal.textContent = maxSpeed.toFixed(2) + " m/s (power-limited on this grade)";
      const actualSpeed = Math.min(wheelSpeed, maxSpeed);
      speedVal.textContent = actualSpeed.toFixed(2) + " m/s";
      const chainForce = actualSpeed > 0.01 ? power / actualSpeed : 0;
      torqueVal.textContent = (chainForce * WHEEL_R).toFixed(1) + " N·m at the rear wheel";
      if (wheelEl) wheelEl.style.animationDuration = wheelOmega > 0.01 ? Math.max(0.15, (2 * Math.PI) / wheelOmega) + "s" : "999s";
    }
    [cadenceSlider, frontSlider, rearSlider, slopeSlider, powerSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 3. ROLLER-COASTER DESIGN ============ */
  function initCoasterDesign() {
    const hillSlider = document.getElementById("coasterHillSlider");
    if (!hillSlider) return;
    const loopRSlider = document.getElementById("coasterLoopRSlider");
    const lossSlider = document.getElementById("coasterLossSlider");
    const hillVal = document.getElementById("coasterHillVal");
    const loopRVal = document.getElementById("coasterLoopRVal");
    const lossVal = document.getElementById("coasterLossVal");
    const speedAtLoopVal = document.getElementById("coasterSpeedAtLoopVal");
    const minSpeedVal = document.getElementById("coasterMinSpeedVal");
    const verdict = document.getElementById("coasterVerdict");
    const hillPath = document.getElementById("coasterHillPath");
    const loopCircle = document.getElementById("coasterLoopCircle");
    function render() {
      const H = +hillSlider.value, r = +loopRSlider.value, lossPct = +lossSlider.value;
      hillVal.textContent = H.toFixed(0) + " m";
      loopRVal.textContent = r.toFixed(1) + " m";
      lossVal.textContent = lossPct + "%";
      const heightAtLoopTop = 2 * r;
      const availableH = H * (1 - lossPct / 100);
      const dropToLoopTop = availableH - heightAtLoopTop;
      const vAtLoopTop = dropToLoopTop > 0 ? Math.sqrt(2 * G * dropToLoopTop) : 0;
      speedAtLoopVal.textContent = vAtLoopTop.toFixed(2) + " m/s at the top of the loop";
      const vMin = Math.sqrt(G * r);
      minSpeedVal.textContent = vMin.toFixed(2) + " m/s minimum to keep contact";
      if (dropToLoopTop <= 0) { verdict.textContent = "The hill isn't even tall enough to reach the top of the loop."; verdict.className = "verdict-badge bad"; }
      else if (vAtLoopTop < vMin) { verdict.textContent = "Cart loses contact with the track before the top — redesign needed."; verdict.className = "verdict-badge bad"; }
      else { verdict.textContent = "Cart clears the loop with " + (vAtLoopTop - vMin).toFixed(2) + " m/s of speed to spare."; verdict.className = "verdict-badge good"; }
      const scale = 3, hillPx = Math.min(H * scale, 150);
      hillPath.setAttribute("d", `M20,180 L110,${180 - hillPx} L180,180`);
      const loopRpx = Math.min(r * scale, 55);
      loopCircle.setAttribute("cx", 220); loopCircle.setAttribute("cy", 180 - loopRpx); loopCircle.setAttribute("r", loopRpx);
    }
    [hillSlider, loopRSlider, lossSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 4. BRIDGE RESONANCE ============ */
  function initBridgeResonance() {
    const kSlider = document.getElementById("bridgeKSlider");
    if (!kSlider) return;
    const mSlider = document.getElementById("bridgeMSlider");
    const zetaSlider = document.getElementById("bridgeZetaSlider");
    const freqSlider = document.getElementById("bridgeFreqSlider");
    const kVal = document.getElementById("bridgeKVal");
    const mVal = document.getElementById("bridgeMVal");
    const zetaVal = document.getElementById("bridgeZetaVal");
    const freqVal = document.getElementById("bridgeFreqVal");
    const wnVal = document.getElementById("bridgeWnVal");
    const ampVal = document.getElementById("bridgeAmpVal");
    const warnEl = document.getElementById("bridgeWarn");
    const curvePath = document.getElementById("bridgeCurvePath");
    const marker = document.getElementById("bridgeMarker");
    const ampAt = (r, zeta) => 1 / Math.max(Math.sqrt((1 - r * r) ** 2 + (2 * zeta * r) ** 2), 1e-6);
    // Expose current amplitude for the animated-deck widget.
    initBridgeResonance._amp = 1;
    function render() {
      const k = +kSlider.value, m = +mSlider.value, zeta = +zetaSlider.value / 100, freq = +freqSlider.value;
      kVal.textContent = k.toFixed(0) + " N/m";
      mVal.textContent = m.toFixed(0) + " kg";
      zetaVal.textContent = zeta.toFixed(2);
      freqVal.textContent = freq.toFixed(2) + " Hz";
      const wn = Math.sqrt(k / m);
      wnVal.textContent = (wn / (2 * Math.PI)).toFixed(2) + " Hz";
      const r = (freq * 2 * Math.PI) / wn, amp = ampAt(r, zeta);
      initBridgeResonance._amp = amp;
      initBridgeResonance._freq = freq;
      ampVal.textContent = amp.toFixed(2) + "× static deflection";
      if (amp > 5) { warnEl.textContent = "Danger: driving frequency is close to resonance — amplitude is growing large (this is what happened at the Tacoma Narrows and early Millennium Bridge)."; warnEl.className = "verdict-badge bad"; }
      else { warnEl.textContent = "Amplitude stays modest at this driving frequency."; warnEl.className = "verdict-badge good"; }
      let d = ""; const N = 100, rMax = 3;
      for (let i = 0; i <= N; i++) {
        const rr = (i / N) * rMax;
        d += (i === 0 ? "M" : "L") + (40 + (rr / rMax) * 440) + " " + (90 - Math.min(ampAt(rr, zeta), 10) * 8) + " ";
      }
      curvePath.setAttribute("d", d);
      marker.setAttribute("cx", 40 + (r / rMax) * 440);
      marker.setAttribute("cy", 90 - Math.min(amp, 10) * 8);
    }
    [kSlider, mSlider, zetaSlider, freqSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 5. BOW ENERGY MODEL ============ */
  function initBowEnergy() {
    const kSlider = document.getElementById("bowKSlider");
    if (!kSlider) return;
    const drawSlider = document.getElementById("bowDrawSlider");
    const massSlider = document.getElementById("bowMassSlider");
    const effSlider = document.getElementById("bowEffSlider");
    const kVal = document.getElementById("bowKVal");
    const drawVal = document.getElementById("bowDrawVal");
    const massVal = document.getElementById("bowMassVal");
    const effVal = document.getElementById("bowEffVal");
    const peVal = document.getElementById("bowPeVal");
    const speedVal = document.getElementById("bowSpeedVal");
    const forceCurve = document.getElementById("bowForceCurve");
    const areaRect = document.getElementById("bowAreaFill");
    function render() {
      const k = +kSlider.value, draw = +drawSlider.value, mass = +massSlider.value / 1000, eff = +effSlider.value / 100;
      kVal.textContent = k.toFixed(0) + " N/m";
      drawVal.textContent = draw.toFixed(2) + " m";
      massVal.textContent = (mass * 1000).toFixed(0) + " g";
      effVal.textContent = (eff * 100).toFixed(0) + "%";
      const pe = 0.5 * k * draw * draw;
      peVal.textContent = pe.toFixed(1) + " J";
      const v = Math.sqrt((2 * pe * eff) / mass);
      speedVal.textContent = v.toFixed(1) + " m/s";
      const scaleX = 220 / 0.9, scaleY = 100 / (k * 0.9);
      forceCurve.setAttribute("d", `M20,120 L${20 + draw * scaleX},${120 - k * draw * scaleY}`);
      areaRect.setAttribute("points", `20,120 ${20 + draw * scaleX},120 ${20 + draw * scaleX},${120 - k * draw * scaleY}`);
    }
    [kSlider, drawSlider, massSlider, effSlider].forEach((s) => s.addEventListener("input", render));
    render();
  }

  /* ============ 6. CATAPULT MOTION MODEL ============ */
  function initCatapult() {
    const armSlider = document.getElementById("catapultArmSlider");
    if (!armSlider) return;
    const torqueSlider = document.getElementById("catapultTorqueSlider");
    const massSlider = document.getElementById("catapultMassSlider");
    const releaseSlider = document.getElementById("catapultReleaseSlider");
    const armVal = document.getElementById("catapultArmVal");
    const torqueVal = document.getElementById("catapultTorqueVal");
    const massVal = document.getElementById("catapultMassVal");
    const releaseVal = document.getElementById("catapultReleaseVal");
    const launchSpeedVal = document.getElementById("catapultLaunchSpeedVal");
    const rangeVal = document.getElementById("catapultRangeVal");
    const trajPath = document.getElementById("catapultTrajPath");
    const goBtn = document.getElementById("catapultGoBtn");
    const projectile = document.getElementById("catapultProjectile");
    let running = false, t0 = 0, rafId = null;
    function compute() {
      const L = +armSlider.value, tau = +torqueSlider.value, m = +massSlider.value, releaseDeg = +releaseSlider.value;
      const alpha = tau / (m * L * L);
      const releaseRad = (releaseDeg * Math.PI) / 180;
      const v = Math.sqrt(2 * alpha * releaseRad) * L;
      return { v, releaseRad, L };
    }
    function render() {
      armVal.textContent = (+armSlider.value).toFixed(1) + " m";
      torqueVal.textContent = (+torqueSlider.value).toFixed(0) + " N·m";
      massVal.textContent = (+massSlider.value).toFixed(1) + " kg";
      releaseVal.textContent = (+releaseSlider.value).toFixed(0) + "°";
      const c = compute();
      launchSpeedVal.textContent = c.v.toFixed(2) + " m/s";
      const launchAngle = Math.PI / 2 - c.releaseRad;
      const vx = c.v * Math.cos(launchAngle), vy = c.v * Math.sin(launchAngle);
      const range = (2 * vx * vy) / G;
      rangeVal.textContent = Math.max(range, 0).toFixed(2) + " m";
      let d = "M20,180 ";
      const steps = 40, tMax = (2 * vy) / G;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.max(tMax, 0.01);
        const x = vx * t, y = vy * t - 0.5 * G * t * t, scale = 220 / Math.max(range, 1);
        d += `L${20 + x * scale},${180 - y * scale} `;
      }
      trajPath.setAttribute("d", d);
    }
    [armSlider, torqueSlider, massSlider, releaseSlider].forEach((s) => s.addEventListener("input", render));
    function frame(now) {
      if (!running) return;
      const c = compute(), launchAngle = Math.PI / 2 - c.releaseRad;
      const vx = c.v * Math.cos(launchAngle), vy = c.v * Math.sin(launchAngle);
      const range = (2 * vx * vy) / G, scale = 220 / Math.max(range, 1);
      const t = (now - t0) / 1000, x = vx * t, y = vy * t - 0.5 * G * t * t;
      if (y < 0 || t > 5) { running = false; return; }
      projectile.setAttribute("cx", 20 + x * scale);
      projectile.setAttribute("cy", 180 - y * scale);
      rafId = requestAnimationFrame(frame);
    }
    goBtn.addEventListener("click", () => { running = true; t0 = performance.now(); rafId = requestAnimationFrame(frame); });
    render();
  }

  /* ============ NEW A. ROLLER-COASTER RIDE  [#coasterRideHost] ============
     Wavy track; cart runs the full profile. Shows live speed, the velocity /
     normal-force / weight vectors, a G-meter, a track colour-coded by G
     (purple = airtime, green = comfy, orange/red = high-G), and a G-vs-position
     graph with a moving marker. Energy conservation with optional friction. */
  function initCoasterRide() {
    const host = document.getElementById("coasterRideHost");
    if (!host) return;
    host.classList.add("cap-widget");
    host.innerHTML =
      '<div class="cap-controls">' +
      '  <label>Lift-hill height <input type="range" min="20" max="45" step="1" value="40" data-r="H"> <span data-o="H"></span> m</label>' +
      '  <label>Friction <input type="range" min="0" max="0.08" step="0.005" value="0.01" data-r="fric"> <span data-o="fric"></span></label>' +
      '  <label>Speed <input type="range" min="0.5" max="3" step="0.5" value="1.5" data-r="sp"> <span data-o="sp"></span>×</label>' +
      '  <button class="cap-go" data-go>Launch the cart</button>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 480 240", class: "cap-svg" });
    const trackG = el("g", {});             // colour-coded track segments
    const gGraph = el("path", { fill: "none", stroke: "#8a94a6", "stroke-width": 1.5 });
    const gAxis = el("line", { x1: 300, y1: 210, x2: 470, y2: 210, stroke: "#e2e6ea", "stroke-width": 1 });
    svg.appendChild(trackG);
    const nArrow = el("line", { stroke: "#2a78d6", "stroke-width": 3, "marker-end": "url(#capArrow)" });
    const wArrow = el("line", { stroke: "#c94b4b", "stroke-width": 3, "marker-end": "url(#capArrow)" });
    const vArrow = el("line", { stroke: "#1baf7a", "stroke-width": 3, "marker-end": "url(#capArrow)" });
    const cart = el("circle", { r: 8, fill: "#33415c", stroke: "#fff", "stroke-width": 2 });
    const defs = el("defs", {});
    const mk = el("marker", { id: "capArrow", markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto" });
    mk.appendChild(el("path", { d: "M0,0 L6,3 L0,6 Z", fill: "#555" }));
    defs.appendChild(mk); svg.appendChild(defs);
    svg.appendChild(nArrow); svg.appendChild(wArrow); svg.appendChild(vArrow); svg.appendChild(cart);
    host.appendChild(svg);

    const readouts = document.createElement("div");
    readouts.className = "cap-readouts";
    readouts.innerHTML =
      '<div>Speed: <b data-o="v">—</b></div>' +
      '<div>Height: <b data-o="h">—</b></div>' +
      '<div>G-force (normal): <b data-o="g">—</b></div>' +
      '<div class="cap-gmeter"><div class="cap-gmeter-fill" data-o="gbar"></div><span class="cap-gmeter-1g"></span></div>' +
      '<div class="cap-verdict" data-o="status">Green = normal • purple = airtime (G&lt;0) • red = high-G</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const HS = q('[data-r="H"]'), fricS = q('[data-r="fric"]'), spS = q('[data-r="sp"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const START_X = 6, END_X = 42;

    function hRaw(x, H) {
      const g = (c, w, a) => a * Math.exp(-((x - c) * (x - c)) / (2 * w * w));
      // First hill scales with the slider; the rest are fixed, all lower.
      return g(6, 2.6, H) + g(15, 2.4, 20) + g(24, 1.8, 26) + g(33, 2.2, 10) + 4;
    }
    const hp = (x, H) => (hRaw(x + 0.05, H) - hRaw(x - 0.05, H)) / 0.1;
    const hpp = (x, H) => (hRaw(x + 0.1, H) - 2 * hRaw(x, H) + hRaw(x - 0.1, H)) / 0.01;

    // Screen fit computed from the sampled track.
    let map = null, samples = [], startH = 0;
    function build() {
      const H = +HS.value, fric = +fricS.value;
      out("H").textContent = H; out("fric").textContent = fric.toFixed(3); out("sp").textContent = (+spS.value).toFixed(1);
      startH = hRaw(START_X, H);
      // sample track + arc length + speed + G
      samples = [];
      let s = 0, prev = null;
      for (let i = 0; i <= 240; i++) {
        const x = START_X + (END_X - START_X) * (i / 240);
        const h = hRaw(x, H);
        if (prev) s += Math.hypot((x - prev.x), (h - prev.h));
        const drop = startH - h;
        const v2 = 2 * G * drop - 2 * fric * G * s;
        const v = Math.sqrt(Math.max(v2, 0));
        const slope = hp(x, H), theta = Math.atan(slope);
        const kappa = hpp(x, H) / Math.pow(1 + slope * slope, 1.5);
        const gForce = Math.cos(theta) + (v * v * kappa) / G;
        const pt = { x, h, s, v, theta, gForce };
        samples.push(pt); prev = pt;
      }
      // fit
      let minX = Infinity, maxX = -Infinity, minH = Infinity, maxH = -Infinity;
      samples.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minH = Math.min(minH, p.h); maxH = Math.max(maxH, p.h); });
      const pad = 26, W = 280, Htot = 200;
      const sc = Math.min((W - 2 * pad) / (maxX - minX), (Htot - 2 * pad) / (maxH - minH));
      map = {
        toX: (x) => pad + (x - minX) * sc,
        toY: (h) => (Htot - pad) - (h - minH) * sc, // height up
      };
      // colour-coded track segments
      trackG.innerHTML = "";
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1], b = samples[i];
        trackG.appendChild(el("line", {
          x1: map.toX(a.x), y1: map.toY(a.h), x2: map.toX(b.x), y2: map.toY(b.h),
          stroke: gColor(b.gForce), "stroke-width": 4, "stroke-linecap": "round",
        }));
      }
      // G-vs-position graph on the right
      const gx0 = 300, gx1 = 470, gy = 210, gh = 150;
      trackG.appendChild(gAxis);
      let d = "";
      samples.forEach((p, i) => {
        const px = gx0 + (gx1 - gx0) * (i / (samples.length - 1));
        const py = gy - clamp(p.gForce, -1, 5) * (gh / 6);
        d += (i === 0 ? "M" : "L") + px.toFixed(1) + "," + py.toFixed(1) + " ";
      });
      gGraph.setAttribute("d", d);
      trackG.appendChild(gGraph);
      trackG.appendChild(el("text", { x: 300, y: 228, "font-size": 10, fill: "#555" })).textContent = "G-force vs. position";
      placeCart(0);
    }
    function gColor(g) {
      if (g < 0.25) return "#7b5cff";     // airtime
      if (g < 1.6) return "#1baf7a";      // comfy
      if (g < 3) return "#eb9d34";        // strong
      return "#e34948";                    // high-G
    }
    let gMarker = null;
    function placeCart(idx) {
      const p = samples[idx] || samples[0];
      const px = map.toX(p.x), py = map.toY(p.h);
      cart.setAttribute("cx", px); cart.setAttribute("cy", py);
      cart.setAttribute("fill", gColor(p.gForce));
      // tangent (screen): (1, -slope) normalised, motion +x
      const tlen = Math.hypot(1, p.theta ? Math.tan(p.theta) : 0);
      const tx = Math.cos(p.theta), ty = -Math.sin(p.theta);
      // normal "up" for the rider = rotate tangent -90°
      const nx = -ty, ny = tx; // points generally up-ish
      const vScale = 2.2, nScale = 10;
      vArrow.setAttribute("x1", px); vArrow.setAttribute("y1", py);
      vArrow.setAttribute("x2", px + tx * clamp(p.v * vScale, 6, 46));
      vArrow.setAttribute("y2", py + ty * clamp(p.v * vScale, 6, 46));
      wArrow.setAttribute("x1", px); wArrow.setAttribute("y1", py);
      wArrow.setAttribute("x2", px); wArrow.setAttribute("y2", py + 26); // weight always down
      nArrow.setAttribute("x1", px); nArrow.setAttribute("y1", py);
      nArrow.setAttribute("x2", px + nx * p.gForce * nScale);
      nArrow.setAttribute("y2", py + ny * p.gForce * nScale);
      // readouts
      out("v").textContent = p.v.toFixed(1) + " m/s (" + (p.v * 3.6).toFixed(0) + " km/h)";
      out("h").textContent = p.h.toFixed(1) + " m";
      out("g").textContent = p.gForce.toFixed(2) + " G";
      const bar = out("gbar");
      bar.style.width = clamp((p.gForce / 5) * 100, 0, 100) + "%";
      bar.style.background = gColor(p.gForce);
      out("status").textContent = p.gForce < 0.1 ? "Airtime! Riders lift out of their seats." :
        p.gForce > 3.5 ? "Very high G — near the limit real coasters allow briefly." :
        p.gForce > 2 ? "Strong positive G through this valley." : "Comfortable ride here.";
      // graph marker
      if (!gMarker) { gMarker = el("circle", { r: 4, fill: "#e34948" }); svg.appendChild(gMarker); }
      const gx0 = 300, gx1 = 470, gy = 210, gh = 150;
      gMarker.setAttribute("cx", gx0 + (gx1 - gx0) * (idx / (samples.length - 1)));
      gMarker.setAttribute("cy", gy - clamp(p.gForce, -1, 5) * (gh / 6));
    }
    [HS, fricS].forEach((s) => s.addEventListener("input", build));
    spS.addEventListener("input", () => { out("sp").textContent = (+spS.value).toFixed(1); });
    build();

    // Animate by advancing arc length s = ∫v dt, mapping back to sample index.
    let running = false, rafId = null, sPos = 0, last = 0;
    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) * (+spS.value);
      last = now;
      // find current v by nearest sample to sPos
      let idx = 0;
      while (idx < samples.length - 1 && samples[idx].s < sPos) idx++;
      const v = samples[idx].v;
      sPos += v * dt;
      if (idx >= samples.length - 1 || v < 0.05) { running = false; return; }
      placeCart(idx);
      rafId = requestAnimationFrame(frame);
    }
    q("[data-go]").addEventListener("click", () => {
      if (running) { running = false; if (rafId) cancelAnimationFrame(rafId); placeCart(0); sPos = 0; return; }
      // Sample 0 sits exactly at the crest of the first hill, where v = 0 by
      // construction (drop = 0 there) -- starting sPos there would trip the
      // v < 0.05 "stopped" check on the very first frame. Start just past the
      // crest, at the first sample with meaningful speed, instead.
      let startIdx = 0;
      while (startIdx < samples.length - 1 && samples[startIdx].v < 0.05) startIdx++;
      sPos = samples[startIdx].s;
      running = true; last = performance.now(); rafId = requestAnimationFrame(frame);
    });
  }

  /* ============ NEW B. BOWLING HOOK (top-down)  [#bowlingHookHost] ============
     Shows the lateral drift of a hooking ball during the skid phase, then a
     straight roll once it grips. Rev-rate & friction sliders; entry-angle read. */
  function initBowlingHook() {
    const host = document.getElementById("bowlingHookHost");
    if (!host) return;
    host.classList.add("cap-widget");
    host.innerHTML =
      '<div class="cap-controls">' +
      '  <label>Ball speed <input type="range" min="6" max="11" step="0.5" value="8" data-r="v"> <span data-o="v"></span> m/s</label>' +
      '  <label>Rev rate (side spin) <input type="range" min="0" max="500" step="20" value="300" data-r="rev"> <span data-o="rev"></span> rpm</label>' +
      '  <label>Oil / friction <input type="range" min="0.02" max="0.12" step="0.01" value="0.06" data-r="mu"> <span data-o="mu"></span></label>' +
      '  <button class="cap-go" data-go>Roll</button>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 120 320", class: "cap-svg", style: "max-height:320px" });
    svg.appendChild(el("rect", { x: 20, y: 10, width: 80, height: 300, fill: "#f4efe4", stroke: "#d9cdb0" }));
    // gutter lines + head pins area
    svg.appendChild(el("line", { x1: 20, y1: 10, x2: 20, y2: 310, stroke: "#c9b98f", "stroke-width": 2 }));
    svg.appendChild(el("line", { x1: 100, y1: 10, x2: 100, y2: 310, stroke: "#c9b98f", "stroke-width": 2 }));
    const pinLayout = [[60, 40], [52, 28], [68, 28], [44, 16], [60, 16], [76, 16]];
    pinLayout.forEach(([px, py]) => svg.appendChild(el("circle", { cx: px, cy: py, r: 3.5, fill: "#fff", stroke: "#c94b4b", "stroke-width": 1.5 })));
    const path = el("path", { fill: "none", stroke: "#2a78d6", "stroke-width": 2, "stroke-dasharray": "4 3", opacity: 0.6 });
    const ball = el("circle", { r: 6, fill: "#2a2a2a" });
    svg.appendChild(path); svg.appendChild(ball);
    host.appendChild(svg);
    const readouts = document.createElement("div");
    readouts.className = "cap-readouts";
    readouts.innerHTML =
      '<div>Skid distance: <b data-o="skid">—</b></div>' +
      '<div>Total hook: <b data-o="hook">—</b></div>' +
      '<div>Entry angle: <b data-o="angle">—</b></div>' +
      '<div class="cap-verdict">Side spin does nothing while the ball skids on oil; once it grips (v = Rω) friction converts spin into a curving hook, giving a better entry angle into the pocket.</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const vS = q('[data-r="v"]'), revS = q('[data-r="rev"]'), muS = q('[data-r="mu"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const LANE_M = 18.3, START = { x: 60, y: 300 }, END_Y = 40;

    // Build the hook path (down-lane y, lateral x). Lateral drift grows during
    // skid ~ proportional to rev rate; then straight after grip.
    function build() {
      const v = +vS.value, rev = +revS.value, mu = +muS.value;
      out("v").textContent = v.toFixed(1); out("rev").textContent = rev; out("mu").textContent = mu.toFixed(2);
      const tSkid = v / (3.5 * mu * G);
      const dSkid = Math.min(v * tSkid - 0.5 * mu * G * tSkid * tSkid, LANE_M);
      const skidFrac = clamp(dSkid / LANE_M, 0, 1);
      const hookMag = (rev / 500) * 34 * (mu / 0.06); // px of lateral break, illustrative
      out("skid").textContent = dSkid.toFixed(1) + " m";
      out("hook").textContent = (hookMag / 80 * 1.06).toFixed(2) + " boards (approx)";
      // path points
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const f = i / 60; // 0 at foul line (bottom) -> 1 at pins (top)
        const yDown = f; // fraction down the lane
        let lateral;
        if (yDown < skidFrac || skidFrac >= 1) lateral = 0; // pure skid, straight (never grips within the lane)
        else {
          const g = (yDown - skidFrac) / (1 - skidFrac);
          lateral = -hookMag * g * g; // curves toward the pocket (left here)
        }
        const px = START.x + lateral;
        const py = START.y - (START.y - END_Y) * f;
        pts.push({ px, py });
      }
      path.setAttribute("d", "M" + pts.map((p) => p.px.toFixed(1) + "," + p.py.toFixed(1)).join(" L"));
      // entry angle from last two points
      const a = pts[pts.length - 2], b = pts[pts.length - 1];
      const ang = Math.atan2(b.px - a.px, -(b.py - a.py)) * 180 / Math.PI;
      out("angle").textContent = Math.abs(ang).toFixed(1) + "° into the pocket";
      ball.setAttribute("cx", START.x); ball.setAttribute("cy", START.y);
      return pts;
    }
    let pts = build();
    [vS, revS, muS].forEach((s) => s.addEventListener("input", () => { pts = build(); }));

    let running = false, rafId = null, i = 0;
    q("[data-go]").addEventListener("click", () => {
      if (running) { running = false; if (rafId) cancelAnimationFrame(rafId); }
      pts = build(); i = 0; running = true;
      function frame() {
        if (!running) return;
        i += 1;
        if (i >= pts.length) { running = false; return; }
        ball.setAttribute("cx", pts[i].px); ball.setAttribute("cy", pts[i].py);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    });
  }

  /* ============ NEW C. ANIMATED BRIDGE DECK  [#bridgeDeckHost] ============
     A deck that oscillates; amplitude follows the resonance response, so as the
     driving frequency nears the natural frequency the deck visibly whips up. */
  function initBridgeDeck() {
    const host = document.getElementById("bridgeDeckHost");
    if (!host) return;
    host.classList.add("cap-widget");
    host.innerHTML =
      '<div class="cap-controls">' +
      '  <label>Natural freq f<sub>n</sub> <input type="range" min="0.3" max="2" step="0.05" value="1" data-r="fn"> <span data-o="fn"></span> Hz</label>' +
      '  <label>Driving freq f <input type="range" min="0.3" max="2" step="0.05" value="0.6" data-r="fd"> <span data-o="fd"></span> Hz</label>' +
      '  <label>Damping ζ <input type="range" min="0.02" max="0.4" step="0.02" value="0.08" data-r="z"> <span data-o="z"></span></label>' +
      '</div>';
    const svg = el("svg", { viewBox: "0 0 480 180", class: "cap-svg" });
    // towers + deck
    svg.appendChild(el("rect", { x: 60, y: 40, width: 8, height: 110, fill: "#8a94a6" }));
    svg.appendChild(el("rect", { x: 412, y: 40, width: 8, height: 110, fill: "#8a94a6" }));
    const deck = el("path", { fill: "none", stroke: "#33415c", "stroke-width": 5, "stroke-linecap": "round" });
    const cable = el("path", { fill: "none", stroke: "#c7ced6", "stroke-width": 1.5 });
    svg.appendChild(cable); svg.appendChild(deck);
    const car = el("circle", { r: 6, fill: "#c94b4b" });
    svg.appendChild(car);
    host.appendChild(svg);
    const readouts = document.createElement("div");
    readouts.className = "cap-readouts";
    readouts.innerHTML =
      '<div>Frequency ratio r: <b data-o="r">—</b></div>' +
      '<div>Amplification: <b data-o="amp">—</b></div>' +
      '<div class="cap-verdict" data-o="status">—</div>';
    host.appendChild(readouts);

    const q = (s) => host.querySelector(s);
    const fnS = q('[data-r="fn"]'), fdS = q('[data-r="fd"]'), zS = q('[data-r="z"]');
    const out = (n) => host.querySelector('[data-o="' + n + '"]');
    const X0 = 64, X1 = 416, Y0 = 95;
    const ampAt = (r, z) => 1 / Math.max(Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2), 1e-6);

    let last = performance.now(), phase = 0;
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
      const fn = +fnS.value, fd = +fdS.value, z = +zS.value;
      const r = fd / fn, amp = ampAt(r, z);
      out("fn").textContent = fn.toFixed(2); out("fd").textContent = fd.toFixed(2); out("z").textContent = z.toFixed(2);
      out("r").textContent = r.toFixed(2);
      out("amp").textContent = amp.toFixed(2) + "× static";
      out("status").textContent = amp > 5 ? "⚠ Near resonance — the deck is whipping up toward failure (Tacoma Narrows territory)."
        : amp > 2 ? "Noticeable resonant amplification." : "Safe: driving frequency well away from resonance.";
      phase += fd * 2 * Math.PI * dt;
      const A = clamp(amp * 4, 2, 46); // px, capped for display
      let d = "", cd = "";
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const f = i / N, x = X0 + (X1 - X0) * f;
        const shape = Math.sin(Math.PI * f); // fixed ends, antinode at centre
        const y = Y0 + A * shape * Math.sin(phase);
        d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
        cd += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + (40 + (y - Y0) * 0.4).toFixed(1) + " ";
      }
      deck.setAttribute("d", d);
      cable.setAttribute("d", cd);
      const cf = 0.5 + 0.3 * Math.sin(phase * 0.3);
      const cx = X0 + (X1 - X0) * cf;
      car.setAttribute("cx", cx);
      car.setAttribute("cy", Y0 + A * Math.sin(Math.PI * cf) * Math.sin(phase));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBowling();
    initBicycle();
    initCoasterDesign();
    initBridgeResonance();
    initBowEnergy();
    initCatapult();
    // New interactive visuals (safe no-op until their host div is added):
    initCoasterRide();
    initBowlingHook();
    initBridgeDeck();
  });
})();
