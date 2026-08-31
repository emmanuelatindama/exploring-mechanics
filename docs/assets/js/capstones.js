// Interactive widgets for docs/10-capstones/index.html.
(function () {
  const G = 9.8;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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
    const svg = document.getElementById("bowlSvg");
    const ball = document.getElementById("bowlBall");
    const pin = document.getElementById("bowlPin");
    const skidMarker = document.getElementById("bowlSkidMarker");
    const goBtn = document.getElementById("bowlGoBtn");
    const R = 0.11; // m, bowling ball radius
    const LANE_M = 18.3; // m, real lane length
    const LANE_PX = 260, X0 = 20;

    function compute() {
      const v0 = +v0Slider.value;
      const mu = +muSlider.value;
      const tSkid = v0 / (3.5 * mu * G);
      const vRoll = (5 / 7) * v0;
      const dSkid = v0 * tSkid - 0.5 * mu * G * tSkid * tSkid;
      return { v0, mu, tSkid, vRoll, dSkid };
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

    let running = false, t0 = 0;
    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000;
      const c = compute();
      let x, collided = false;
      if (t < c.tSkid) x = c.v0 * t - 0.5 * c.mu * G * t * t;
      else {
        x = c.dSkid + c.vRoll * (t - c.tSkid);
      }
      const xPx = (x / LANE_M) * LANE_PX;
      ball.setAttribute("cx", X0 + Math.min(xPx, LANE_PX));
      if (xPx >= LANE_PX) {
        collided = true;
        // simple 1D collision: ball (m=7kg) hits pin (m=1.6kg), e~0.3
        const mb = 7, mp = 1.6, e = 0.3;
        const vBall = c.vRoll;
        const vPinAfter = ((1 + e) * mb * vBall) / (mb + mp);
        pinSpeedVal.textContent = vPinAfter.toFixed(2) + " m/s";
        pin.setAttribute("cx", X0 + LANE_PX + 12);
      }
      if (!collided) requestAnimationFrame(frame);
      else running = false;
    }
    goBtn.addEventListener("click", () => {
      running = true; t0 = performance.now();
      pin.setAttribute("cx", X0 + LANE_PX + 4);
      pinSpeedVal.textContent = "—";
      requestAnimationFrame(frame);
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

    const WHEEL_R = 0.34; // m
    const MASS = 80; // kg rider + bike

    function render() {
      const cadence = +cadenceSlider.value; // rpm
      const front = +frontSlider.value, rear = +rearSlider.value;
      const slopeDeg = +slopeSlider.value;
      const power = +powerSlider.value;
      cadenceVal.textContent = cadence + " rpm";
      frontVal.textContent = front + " teeth";
      rearVal.textContent = rear + " teeth";
      slopeVal.textContent = slopeDeg + "°";
      powerVal.textContent = power + " W";

      const gearRatio = front / rear;
      const cadenceRadS = (cadence * 2 * Math.PI) / 60;
      const wheelOmega = cadenceRadS * gearRatio;
      const wheelSpeed = wheelOmega * WHEEL_R;
      wheelSpeedVal.textContent = wheelSpeed.toFixed(2) + " m/s (" + (wheelSpeed * 3.6).toFixed(1) + " km/h)";

      const slope = (slopeDeg * Math.PI) / 180;
      const gravityForce = MASS * G * Math.sin(slope);
      const rollingResist = 0.005 * MASS * G;
      const maxSpeed = power / Math.max(gravityForce + rollingResist, 1);
      maxSpeedVal.textContent = maxSpeed.toFixed(2) + " m/s (power-limited on this grade)";

      const actualSpeed = Math.min(wheelSpeed, maxSpeed);
      speedVal.textContent = actualSpeed.toFixed(2) + " m/s";

      const chainForce = actualSpeed > 0.01 ? power / actualSpeed : 0;
      const rearWheelTorque = chainForce * WHEEL_R;
      torqueVal.textContent = rearWheelTorque.toFixed(1) + " N·m at the rear wheel";

      wheelEl.style.animationDuration = wheelOmega > 0.01 ? Math.max(0.15, (2 * Math.PI) / wheelOmega) + "s" : "999s";
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
    const svg = document.getElementById("coasterSvg");
    const hillPath = document.getElementById("coasterHillPath");
    const loopCircle = document.getElementById("coasterLoopCircle");

    function render() {
      const H = +hillSlider.value;
      const r = +loopRSlider.value;
      const lossPct = +lossSlider.value;
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

      if (dropToLoopTop <= 0) {
        verdict.textContent = "The hill isn't even tall enough to reach the top of the loop.";
        verdict.className = "verdict-badge bad";
      } else if (vAtLoopTop < vMin) {
        verdict.textContent = "Cart loses contact with the track before the top — redesign needed.";
        verdict.className = "verdict-badge bad";
      } else {
        verdict.textContent = "Cart clears the loop with " + (vAtLoopTop - vMin).toFixed(2) + " m/s of speed to spare.";
        verdict.className = "verdict-badge good";
      }

      const scale = 3;
      const hillPx = Math.min(H * scale, 150);
      hillPath.setAttribute("d", `M20,180 L110,${180 - hillPx} L180,180`);
      const loopRpx = Math.min(r * scale, 55);
      loopCircle.setAttribute("cx", 220);
      loopCircle.setAttribute("cy", 180 - loopRpx);
      loopCircle.setAttribute("r", loopRpx);
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

    function ampAt(r, zeta) {
      const denom = Math.sqrt((1 - r * r) * (1 - r * r) + (2 * zeta * r) * (2 * zeta * r));
      return 1 / Math.max(denom, 1e-6);
    }
    function render() {
      const k = +kSlider.value, m = +mSlider.value, zeta = +zetaSlider.value / 100, freq = +freqSlider.value;
      kVal.textContent = k.toFixed(0) + " N/m";
      mVal.textContent = m.toFixed(0) + " kg";
      zetaVal.textContent = zeta.toFixed(2);
      freqVal.textContent = freq.toFixed(2) + " Hz";
      const wn = Math.sqrt(k / m);
      const wnHz = wn / (2 * Math.PI);
      wnVal.textContent = wnHz.toFixed(2) + " Hz";
      const wDrive = freq * 2 * Math.PI;
      const r = wDrive / wn;
      const amp = ampAt(r, zeta);
      ampVal.textContent = amp.toFixed(2) + "× static deflection";
      if (amp > 5) { warnEl.textContent = "Danger: driving frequency is close to resonance — amplitude is growing large (this is what happened at the Tacoma Narrows and early Millennium Bridge)."; warnEl.className = "verdict-badge bad"; }
      else { warnEl.textContent = "Amplitude stays modest at this driving frequency."; warnEl.className = "verdict-badge good"; }

      let d = "";
      const N = 100, rMax = 3;
      for (let i = 0; i <= N; i++) {
        const rr = (i / N) * rMax;
        const a = ampAt(rr, zeta);
        const px = 40 + (rr / rMax) * 440;
        const py = 90 - Math.min(a, 10) * 8;
        d += (i === 0 ? "M" : "L") + px + " " + py + " ";
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
      const ke = pe * eff;
      const v = Math.sqrt((2 * ke) / mass);
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

    function compute() {
      const L = +armSlider.value;
      const tau = +torqueSlider.value;
      const m = +massSlider.value;
      const releaseDeg = +releaseSlider.value;
      const I = m * L * L; // point mass at arm end, simplified
      const alpha = tau / I;
      const releaseRad = (releaseDeg * Math.PI) / 180;
      const omega = Math.sqrt(2 * alpha * releaseRad);
      const v = omega * L;
      return { v, releaseRad, L };
    }
    function render() {
      armVal.textContent = (+armSlider.value).toFixed(1) + " m";
      torqueVal.textContent = (+torqueSlider.value).toFixed(0) + " N·m";
      massVal.textContent = (+massSlider.value).toFixed(1) + " kg";
      releaseVal.textContent = (+releaseSlider.value).toFixed(0) + "°";
      const c = compute();
      launchSpeedVal.textContent = c.v.toFixed(2) + " m/s";
      const launchAngle = Math.PI / 2 - c.releaseRad; // release angle measured from vertical arm swing
      const vx = c.v * Math.cos(launchAngle), vy = c.v * Math.sin(launchAngle);
      const range = (2 * vx * vy) / G;
      rangeVal.textContent = Math.max(range, 0).toFixed(2) + " m";

      let d = "M20,180 ";
      const steps = 40, tMax = (2 * vy) / G;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.max(tMax, 0.01);
        const x = vx * t, y = vy * t - 0.5 * G * t * t;
        const scale = 220 / Math.max(range, 1);
        d += `L${20 + x * scale},${180 - y * scale} `;
      }
      trajPath.setAttribute("d", d);
    }
    [armSlider, torqueSlider, massSlider, releaseSlider].forEach((s) => s.addEventListener("input", render));

    let running = false, t0 = 0;
    function frame(now) {
      if (!running) return;
      const c = compute();
      const launchAngle = Math.PI / 2 - c.releaseRad;
      const vx = c.v * Math.cos(launchAngle), vy = c.v * Math.sin(launchAngle);
      const range = (2 * vx * vy) / G;
      const scale = 220 / Math.max(range, 1);
      const t = (now - t0) / 1000;
      const x = vx * t, y = vy * t - 0.5 * G * t * t;
      if (y < 0 || t > 5) { running = false; return; }
      projectile.setAttribute("cx", 20 + x * scale);
      projectile.setAttribute("cy", 180 - y * scale);
      requestAnimationFrame(frame);
    }
    goBtn.addEventListener("click", () => { running = true; t0 = performance.now(); requestAnimationFrame(frame); });
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBowling();
    initBicycle();
    initCoasterDesign();
    initBridgeResonance();
    initBowEnergy();
    initCatapult();
  });
})();
