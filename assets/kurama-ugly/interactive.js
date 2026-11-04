(() => {
  'use strict';

  // --- Synthesized Rubber Stretch & Snap Audio (Squeak) ---
  function createRubberAudio() {
    let ctx = null, master = null, creak = null, creakGain = null, creakFilter = null;
    function wake() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!ctx) {
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.45;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx.state === 'running';
    }
    function startCreak() {
      if (creak || !ctx) return;
      creak = ctx.createOscillator();
      creak.type = 'sawtooth';
      creak.frequency.value = 110;
      creakFilter = ctx.createBiquadFilter();
      creakFilter.type = 'bandpass';
      creakFilter.frequency.value = 600;
      creakFilter.Q.value = 4.0;
      creakGain = ctx.createGain();
      creakGain.gain.value = 0;
      creak.connect(creakFilter);
      creakFilter.connect(creakGain);
      creakGain.connect(master);
      creak.start();
    }
    return {
      unlock() { wake(); startCreak(); },
      updateStretch(pull, speed) {
        if (!ctx || ctx.state !== 'running') return;
        startCreak();
        const t = ctx.currentTime;
        const active = pull > 0.02 && speed > 0.03;
        const targetGain = active ? Math.min(0.26, speed * 0.09) * Math.min(1, pull * 3.5) : 0;
        const pitch = 95 + pull * 420 + Math.min(220, speed * 55);
        creak.frequency.setTargetAtTime(pitch, t, 0.02);
        creakFilter.frequency.setTargetAtTime(pitch * 3.2, t, 0.02);
        creakGain.gain.setTargetAtTime(targetGain, t, active ? 0.015 : 0.04);
      },
      boing(strength = 0.5) {
        if (!wake()) return;
        if (creakGain) creakGain.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
        const t = ctx.currentTime;
        const dur = Math.min(0.65, 0.25 + strength * 0.6);
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const g = ctx.createGain();
        osc.type = 'triangle';
        const base = 155 + strength * 170;
        osc.frequency.setValueAtTime(base * 1.45, t);
        osc.frequency.exponentialRampToValueAtTime(base * 0.82, t + dur);
        lfo.frequency.value = 14;
        lfoGain.gain.setValueAtTime(strength * 95, t);
        lfoGain.gain.exponentialRampToValueAtTime(1, t + dur);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        g.gain.setValueAtTime(Math.min(0.45, 0.14 + strength * 0.45), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + dur);
        lfo.stop(t + dur);
      },
      silence() {
        if (creakGain && ctx) creakGain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      }
    };
  }

  // --- Exaggerated WebGL Upside-Down Kurama Plushie Engine ---
  const VERT_SHADER = `
    attribute vec2 aHome;
    attribute vec2 aDisp;
    attribute vec3 aShade;
    uniform vec2 uGrid;
    uniform float uPad;
    varying vec2 vUv;
    varying vec3 vShade;
    void main() {
      vec2 p = (aHome + aDisp) / uGrid;
      vUv = aHome / uGrid * (1.0 + 2.0 * uPad) - uPad;
      vShade = aShade;
      gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
    }
  `;

  // Includes real-time extra ugly bulge & swirl warps centered on the active grab/poke point!
  const FRAG_SHADER = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D uTexA;
    uniform sampler2D uTexB;
    uniform float uMix;
    uniform float uRelief;
    uniform vec4 uWarp; // (cx, cy, bulgeStrength, swirlAngle) in UV space
    varying vec2 vUv;
    varying vec3 vShade;

    const vec3 LIGHT = vec3(-0.42, -0.55, 0.72);

    void main() {
      if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;

      // Extra real-time nonlinear bulge & swirl distortion around the grabbed/poked facial feature
      vec2 uv = vUv;
      float shoulderMask = clamp((uv.y - 0.10) / 0.12, 0.0, 1.0);
      vec2 d = uv - uWarp.xy;
      float r2 = dot(d, d) / (0.22 * 0.22);
      if (r2 < 6.0) {
        float w = exp(-r2) * shoulderMask;
        // Swirl + radial pinch/bulge
        float ang = uWarp.w * w;
        float ca = cos(ang), sa = sin(ang);
        vec2 dRot = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
        uv = uWarp.xy + dRot * (1.0 - 0.42 * uWarp.z * w);
      }
      uv = clamp(uv, 0.001, 0.999);

      vec4 tex = mix(texture2D(uTexA, uv), texture2D(uTexB, uv), uMix);
      float alpha = tex.a;
      if (alpha < 0.004) discard;
      vec3 rgb = tex.rgb / max(alpha, 0.0001);

      vec3 n = normalize(vec3(-vShade.xy * uRelief, 1.0));
      vec3 l = normalize(LIGHT);
      float lit = dot(n, l) / l.z;
      float bump = 1.0 - n.z;
      rgb *= clamp(mix(1.0, lit, 0.92), 0.58, 1.38);

      float stretch = clamp(vShade.z, -1.0, 2.2);
      rgb = mix(rgb, rgb * vec3(1.12, 1.06, 1.04) + 0.03, clamp(stretch * 0.5, 0.0, 0.6) * uRelief);
      rgb *= mix(vec3(1.0), vec3(0.90, 0.78, 0.78), clamp(-stretch * 1.2, 0.0, 0.7) * uRelief);
      vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));
      rgb += pow(max(dot(n, h), 0.0), 26.0) * smoothstep(0.0, 0.05, bump) * 0.18 * uRelief;

      gl_FragColor = vec4(rgb * alpha, alpha);
    }
  `;

  function compileProgram(gl, vsSrc, fsSrc) {
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function decodeImg(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function createGlTexture(gl, img) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  async function initUglyPlush(canvas, hitEl, faceSources, callbacks) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) throw new Error('WebGL unavailable');

    const G = 72;
    const S = G + 1;
    const N = S * S;
    const pad = 0.16;
    const cellsPerImage = G / (1 + 2 * pad);
    const toGrid = (t) => ((t + pad) / (1 + 2 * pad)) * G;
    const toImage = (g) => (g / G) * (1 + 2 * pad) - pad;

    const ux = new Float32Array(N), uy = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N);
    const ax = new Float32Array(N), ay = new Float32Array(N);
    const fixed = new Uint8Array(N);
    const lift = new Float32Array(N);
    const bob = new Float32Array(N);
    const dyn = new Float32Array(N * 5);
    const head = { tilt: 0, tiltV: 0, x: 0, xV: 0, y: 0, yV: 0 };

    // Anchor TOP edge (v <= 0.03) because Kurama hangs upside-down from the top!
    const neckX = 0.5, neckY = 0.12;
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const k = j * S + i;
        const v = toImage(j);
        fixed[k] = i === 0 || j === 0 || i === G || j === G || v <= 0.025 ? 1 : 0;
        const t = Math.max(0, Math.min(1, (v - neckY) / 0.22));
        bob[k] = t * t * (3 - 2 * t);
      }
    }

    const prog = compileProgram(gl, VERT_SHADER, FRAG_SHADER);
    gl.useProgram(prog);
    const U = {
      grid: gl.getUniformLocation(prog, 'uGrid'),
      pad: gl.getUniformLocation(prog, 'uPad'),
      texA: gl.getUniformLocation(prog, 'uTexA'),
      texB: gl.getUniformLocation(prog, 'uTexB'),
      mix: gl.getUniformLocation(prog, 'uMix'),
      relief: gl.getUniformLocation(prog, 'uRelief'),
      warp: gl.getUniformLocation(prog, 'uWarp'),
    };

    const home = new Float32Array(N * 2);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        home[(j * S + i) * 2] = i;
        home[(j * S + i) * 2 + 1] = j;
      }
    }
    const homeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, homeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, home, gl.STATIC_DRAW);
    const aHome = gl.getAttribLocation(prog, 'aHome');
    gl.enableVertexAttribArray(aHome);
    gl.vertexAttribPointer(aHome, 2, gl.FLOAT, false, 0, 0);

    const dynBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
    gl.bufferData(gl.ARRAY_BUFFER, dyn, gl.DYNAMIC_DRAW);
    const aDisp = gl.getAttribLocation(prog, 'aDisp');
    const aShade = gl.getAttribLocation(prog, 'aShade');
    gl.enableVertexAttribArray(aDisp);
    gl.vertexAttribPointer(aDisp, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(aShade);
    gl.vertexAttribPointer(aShade, 3, gl.FLOAT, false, 20, 8);

    const tris = new Uint16Array(G * G * 6);
    let ti = 0;
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const a = j * S + i, b = a + 1, c = a + S, d = c + 1;
        if ((i + j) & 1) tris.set([a, b, d, a, d, c], ti);
        else tris.set([a, b, c, b, d, c], ti);
        ti += 6;
      }
    }
    const triBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tris, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // Load all textures
    const textures = {};
    const keys = Object.keys(faceSources);
    const imgs = await Promise.all(keys.map((k) => decodeImg(faceSources[k])));
    keys.forEach((k, idx) => {
      textures[k] = createGlTexture(gl, imgs[idx]);
    });

    let faceA = 'smile', faceB = 'smile', faceMix = 1.0, faceSpeed = 9.0;
    const warpState = { cx: 0.5, cy: 0.45, bulge: 0.0, swirl: 0.0, targetBulge: 0.0, targetSwirl: 0.0 };

    function setFace(name, speed = 10.0) {
      if (!textures[name] || name === faceB) return;
      if (faceMix > 0.5) faceA = faceB;
      faceB = name;
      faceMix = 0.0;
      faceSpeed = speed;
    }

    function shove(u, v, du, dv, prod = 1.2) {
      const cx = toGrid(u), cy = toGrid(v), R = 0.24 * cellsPerImage;
      for (let k = 0; k < N; k++) {
        if (fixed[k]) continue;
        const rx = (k % S) - cx, ry = Math.floor(k / S) - cy;
        const d = Math.hypot(rx, ry) / R;
        if (d >= 1) continue;
        const wt = (1 - d * d) ** 2;
        vx[k] += (du * cellsPerImage * 38 - rx * prod * 28) * wt;
        vy[k] += (dv * cellsPerImage * 38 - ry * prod * 28) * wt;
      }
    }

    // Pointer & immediate touch-grab state
    let grab = null;
    const hand = { x: G * 0.5, y: G * 0.5, px: G * 0.5, py: G * 0.5 };
    let lastTime = performance.now();

    function eventToGrid(e) {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * G, ((e.clientY - r.top) / r.height) * G];
    }

    function updateGrabPull(gx, gy) {
      const dx = gx - grab.startX, dy = gy - grab.startY;
      // Exaggerated maxPull (0.85) so the player can stretch Kurama's face super far!
      const len = Math.hypot(dx, dy), max = 0.85 * cellsPerImage;
      const eased = len > 0 ? (max * Math.tanh(len / max)) / len : 0;
      const clampG = (g) => Math.max(1, Math.min(G - 1, g));
      grab.pullX = clampG(grab.startX + dx * eased) - grab.startX;
      grab.pullY = clampG(grab.startY + dy * eased) - grab.startY;

      const stepDist = Math.hypot(gx - grab.lastGx, gy - grab.lastGy) / cellsPerImage;
      grab.travel += stepDist;
      grab.lastGx = gx;
      grab.lastGy = gy;

      // Update real-time shader bulge & swirl around grabbed region
      const u = Math.max(0.2, Math.min(0.8, toImage(grab.startX)));
      const v = Math.max(0.2, Math.min(0.75, toImage(grab.startY)));
      warpState.cx = u;
      warpState.cy = v;
      const pullNorm = Math.hypot(grab.pullX, grab.pullY) / cellsPerImage;
      warpState.targetBulge = Math.min(1.35, 0.55 + pullNorm * 1.8);
      warpState.targetSwirl = Math.max(-0.85, Math.min(0.85, (grab.pullX - grab.pullY * 0.6) / cellsPerImage * 1.4));

      // If dragging continuously for a large distance without lifting finger, also count next grimaces!
      if (grab.travel > 0.62 && performance.now() - grab.lastCountAt > 620) {
        grab.travel = 0;
        grab.lastCountAt = performance.now();
        if (callbacks.onContinuousGrimace) callbacks.onContinuousGrimace(u, v);
      }
    }

    hitEl.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      try { hitEl.setPointerCapture(e.pointerId); } catch {}
      const [gx, gy] = eventToGrid(e);
      grab = {
        id: e.pointerId,
        startX: gx,
        startY: gy,
        lastGx: gx,
        lastGy: gy,
        pullX: 0,
        pullY: 0,
        travel: 0,
        downAt: performance.now(),
        lastCountAt: performance.now()
      };
      hand.x = hand.px = gx;
      hand.y = hand.py = gy;
      const u = Math.max(0.25, Math.min(0.75, toImage(gx)));
      const v = Math.max(0.25, Math.min(0.70, toImage(gy)));
      warpState.cx = u;
      warpState.cy = v;
      warpState.targetBulge = 0.85;
      warpState.targetSwirl = (u < 0.5 ? -0.45 : 0.45);
      shove(u, v, (u - 0.5) * 0.16, (v - 0.45) * 0.14, 1.3);
      if (callbacks.onGrabStart) callbacks.onGrabStart(u, v);
    });

    window.addEventListener('pointermove', (e) => {
      if (!grab || e.pointerId !== grab.id) return;
      const [gx, gy] = eventToGrid(e);
      updateGrabPull(gx, gy);
    }, { passive: true });

    function finishGrab(e) {
      if (!grab || (e && e.pointerId !== undefined && e.pointerId !== grab.id)) return;
      if (e && e.type === 'pointerup') {
        const [gx, gy] = eventToGrid(e);
        updateGrabPull(gx, gy);
      }
      const pulled = Math.hypot(grab.pullX, grab.pullY) / cellsPerImage;
      const u = Math.max(0.25, Math.min(0.75, toImage(grab.startX)));
      const v = Math.max(0.25, Math.min(0.70, toImage(grab.startY)));

      // If it was a quick tap or short pull, inject an extra violent elastic grimace shove!
      if (pulled < 0.08) {
        const dirX = (u < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.1);
        const dirY = (v < 0.45 ? -1 : 1) * (0.16 + Math.random() * 0.08);
        shove(u, v, dirX, dirY, 1.8);
        warpState.targetBulge = 1.15;
        warpState.targetSwirl = (Math.random() > 0.5 ? 0.65 : -0.65);
      } else {
        warpState.targetBulge = 0.75;
        warpState.targetSwirl *= -0.6;
      }

      grab = null;
      if (callbacks.onGrabRelease) callbacks.onGrabRelease(pulled, u, v);
    }

    window.addEventListener('pointerup', finishGrab);
    window.addEventListener('pointercancel', finishGrab);

    function stepSimulation(elapsed) {
      const w = 2 * Math.PI * 2.55;
      const c = 0.125 * cellsPerImage * w;
      const w2 = w * w, c2 = c * c;
      const gamma = 2 * 0.115 * w;
      const nu = 0.30 * c;
      const limit = (0.85 * cellsPerImage) ** 2;

      hand.px = hand.x;
      hand.py = hand.y;
      if (grab) {
        hand.x = grab.startX + grab.pullX;
        hand.y = grab.startY + grab.pullY;
      }
      const hvx = (hand.x - hand.px) / elapsed;
      const hvy = (hand.y - hand.py) / elapsed;
      const radius = Math.max(2.4, 0.145 * cellsPerImage);
      const r2 = radius * radius;
      const steps = 16;
      const dt = elapsed / steps;

      for (let s = 1; s <= steps; s++) {
        for (let j = 1; j < G; j++) {
          for (let i = 1; i < G; i++) {
            const k = j * S + i;
            if (fixed[k]) continue;
            const x = ux[k], y = uy[k];
            const hard = w2 * Math.min(9.0, 1 + (x * x + y * y) / limit);
            ax[k] = c2 * (ux[k - 1] + ux[k + 1] + ux[k - S] + ux[k + S] - 4 * x) - hard * x - gamma * vx[k]
              + nu * (vx[k - 1] + vx[k + 1] + vx[k - S] + vx[k + S] - 4 * vx[k]);
            ay[k] = c2 * (uy[k - 1] + uy[k + 1] + uy[k - S] + uy[k + S] - 4 * y) - hard * y - gamma * vy[k]
              + nu * (vy[k - 1] + vy[k + 1] + vy[k - S] + vy[k + S] - 4 * vy[k]);
          }
        }
        for (let k = 0; k < N; k++) {
          if (fixed[k]) continue;
          vx[k] += ax[k] * dt;
          vy[k] += ay[k] * dt;
        }
        if (grab) {
          const f = s / steps;
          const hx = hand.px + (hand.x - hand.px) * f;
          const hy = hand.py + (hand.y - hand.py) * f;
          for (let j = 1; j < G; j++) {
            for (let i = 1; i < G; i++) {
              const k = j * S + i;
              if (fixed[k]) continue;
              const dx = i + ux[k] - hx, dy = j + uy[k] - hy;
              const d2 = dx * dx + dy * dy;
              if (d2 >= r2) continue;
              const q = 1 - d2 / r2;
              const hold = Math.min(1, q * q * 2.6);
              const blend = 1 - Math.exp(-2200 * hold * dt);
              vx[k] += (hvx - vx[k]) * blend;
              vy[k] += (hvy - vy[k]) * blend;
            }
          }
        }
        // Head sway around upside-down neck
        const px = grab ? grab.pullX / cellsPerImage : 0;
        const py = grab ? grab.pullY / cellsPerImage : 0;
        const hw = 2 * Math.PI * 1.4, hk = hw * hw, hc = 2 * 0.18 * hw;
        const tiltTo = -px * 0.28, xTo = px * 0.08, yTo = py * 0.08;
        head.tiltV += (hk * (tiltTo - head.tilt) - hc * head.tiltV) * dt;
        head.tilt += head.tiltV * dt;
        head.xV += (hk * (xTo - head.x) - hc * head.xV) * dt;
        head.x += head.xV * dt;
        head.yV += (hk * (yTo - head.y) - hc * head.yV) * dt;
        head.y += head.yV * dt;

        for (let k = 0; k < N; k++) {
          if (fixed[k]) continue;
          ux[k] += vx[k] * dt;
          uy[k] += vy[k] * dt;
        }
      }

      const pull = grab ? Math.hypot(grab.pullX, grab.pullY) / cellsPerImage : 0;
      const speed = grab ? Math.hypot(hvx, hvy) / cellsPerImage : 0;
      if (callbacks.onPhysicsStep) callbacks.onPhysicsStep(pull, speed);
    }

    function updateShadingAndDraw() {
      for (let j = 1; j < G; j++) {
        for (let i = 1; i < G; i++) {
          const k = j * S + i;
          const uxx = (ux[k + 1] - ux[k - 1]) * 0.5, uxy = (ux[k + S] - ux[k - S]) * 0.5;
          const uyx = (uy[k + 1] - uy[k - 1]) * 0.5, uyy = (uy[k + S] - uy[k - S]) * 0.5;
          const area = (1 + uxx) * (1 + uyy) - uxy * uyx - 1;
          dyn[k * 5 + 4] = area;
          lift[k] = Math.hypot(ux[k], uy[k]) * 0.18 - Math.max(-1, Math.min(1.5, area)) * 0.95;
        }
      }
      const nx = toGrid(neckX), ny = toGrid(neckY);
      const cosT = Math.cos(head.tilt), sinT = Math.sin(head.tilt);
      const hx = head.x * cellsPerImage, hy = head.y * cellsPerImage;
      for (let j = 1; j < G; j++) {
        for (let i = 1; i < G; i++) {
          const k = j * S + i;
          const rx = i - nx, ry = j - ny, b = bob[k];
          dyn[k * 5] = ux[k] + b * (cosT * rx - sinT * ry - rx + hx);
          dyn[k * 5 + 1] = uy[k] + b * (sinT * rx + cosT * ry - ry + hy);
          dyn[k * 5 + 2] = (lift[k + 1] - lift[k - 1]) * 0.5;
          dyn[k * 5 + 3] = (lift[k + S] - lift[k - S]) * 0.5;
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const ch = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, dyn);
      gl.uniform2f(U.grid, G, G);
      gl.uniform1f(U.pad, pad);
      gl.uniform1f(U.mix, faceMix);
      gl.uniform1f(U.relief, 0.52);
      gl.uniform4f(U.warp, warpState.cx, warpState.cy, warpState.bulge, warpState.swirl);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[faceA]);
      gl.uniform1i(U.texA, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[faceB]);
      gl.uniform1i(U.texB, 1);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triBuf);
      gl.drawElements(gl.TRIANGLES, tris.length, gl.UNSIGNED_SHORT, 0);
    }

    function loop(now) {
      const elapsed = Math.max(0.001, Math.min(0.045, (now - lastTime) / 1000 || 0.016));
      lastTime = now;
      stepSimulation(elapsed);
      if (faceMix < 1.0) faceMix = Math.min(1.0, faceMix + elapsed * faceSpeed);
      if (!grab) {
        warpState.targetBulge *= Math.exp(-elapsed * 2.2);
        warpState.targetSwirl *= Math.exp(-elapsed * 2.2);
      }
      warpState.bulge += (warpState.targetBulge - warpState.bulge) * Math.min(1, elapsed * 14);
      warpState.swirl += (warpState.targetSwirl - warpState.swirl) * Math.min(1, elapsed * 14);
      updateShadingAndDraw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return {
      setFace,
      shove,
      resetPose() {
        ux.fill(0); uy.fill(0); vx.fill(0); vy.fill(0);
        warpState.bulge = warpState.swirl = warpState.targetBulge = warpState.targetSwirl = 0;
        setFace('smile', 12.0);
      }
    };
  }

  // --- Main Flow Controller (Intro Video -> 5 Interactive Grimaces -> Kaito Laughing Video) ---
  window.addEventListener('DOMContentLoaded', async () => {
    const stage = document.getElementById('stage');
    const introVideo = document.getElementById('introVideo');
    const outroVideo = document.getElementById('outroVideo');
    const interactiveLayer = document.getElementById('interactiveLayer');
    const jungleBg = document.getElementById('jungleBg');
    const blurBg = document.getElementById('blurBg');
    const canvas = document.getElementById('kuramaCanvas');
    const hitArea = document.getElementById('hitArea');
    const startBtn = document.getElementById('startBtn');
    const replayBtn = document.getElementById('replayBtn');
    const dots = Array.from(document.querySelectorAll('.dot'));

    const assets = window.UGLY_KURAMA_ASSETS || {};
    if (assets.bg) {
      jungleBg.src = assets.bg;
      blurBg.style.backgroundImage = `url("${assets.bg}")`;
    }

    const rubberAudio = createRubberAudio();
    const uglySequence = ['ugly1', 'ugly2', 'ugly3', 'ugly4', 'ugly5'];
    let grimaceCount = 0;
    let phase = 'intro'; // 'intro' | 'play' | 'finishing' | 'outro'
    let outroPrimed = false;
    let plush = null;

    function primeOutroVideo() {
      if (outroPrimed) return;
      outroPrimed = true;
      outroVideo.muted = true;
      const p = outroVideo.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          outroVideo.pause();
          outroVideo.currentTime = 0;
          outroVideo.muted = false;
        }).catch(() => {
          outroPrimed = false;
        });
      }
    }

    function updateDots() {
      dots.forEach((d, idx) => {
        d.classList.toggle('is-lit', idx < grimaceCount);
      });
    }

    function enterInteractivePhase() {
      phase = 'play';
      grimaceCount = 0;
      updateDots();
      stage.dataset.phase = 'play';
      introVideo.pause();
      outroVideo.pause();
      replayBtn.hidden = true;
      startBtn.hidden = true;
      if (plush) plush.resetPose();
    }

    function enterOutroPhase() {
      phase = 'outro';
      rubberAudio.silence();
      stage.dataset.phase = 'outro';
      outroVideo.muted = false;
      outroVideo.currentTime = 0;
      const p = outroVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          outroVideo.muted = true;
          outroVideo.play().catch(() => {});
        });
      }
    }

    function registerGrimace(pulledStrength = 0.5) {
      if (phase !== 'play') return;
      grimaceCount = Math.min(5, grimaceCount + 1);
      updateDots();
      rubberAudio.boing(Math.max(0.4, pulledStrength));

      if (grimaceCount >= 5) {
        phase = 'finishing';
        // Let the 5th ugly grimace bounce & show for 850ms, snap briefly to deadpan, then cut to Kaito laughing!
        setTimeout(() => {
          if (plush) plush.setFace('deadpan', 14.0);
        }, 680);
        setTimeout(() => {
          enterOutroPhase();
        }, 1050);
      }
    }

    // Initialize WebGL Kurama
    try {
      plush = await initUglyPlush(canvas, hitArea, assets.faces, {
        onGrabStart() {
          rubberAudio.unlock();
          primeOutroVideo();
          if (phase !== 'play') return;
          const nextFace = uglySequence[Math.min(4, grimaceCount)];
          plush.setFace(nextFace, 12.0);
        },
        onContinuousGrimace(u, v) {
          if (phase !== 'play') return;
          registerGrimace(0.65);
          if (phase === 'play') {
            const nextFace = uglySequence[Math.min(4, grimaceCount)];
            plush.setFace(nextFace, 12.0);
            plush.shove(u, v, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.22, 1.4);
          }
        },
        onGrabRelease(pulled) {
          if (phase !== 'play') return;
          const shownFace = uglySequence[Math.min(4, grimaceCount)];
          plush.setFace(shownFace, 14.0);
          registerGrimace(pulled);
        },
        onPhysicsStep(pull, speed) {
          if (phase === 'play') rubberAudio.updateStretch(pull, speed);
        }
      });
    } catch (err) {
      console.error(err);
    }

    // Intro video lifecycle
    introVideo.addEventListener('ended', () => {
      enterInteractivePhase();
    });

    outroVideo.addEventListener('ended', () => {
      replayBtn.hidden = false;
    });

    let introStartedAt = 0;

    function startIntroWithSound() {
      rubberAudio.unlock();
      primeOutroVideo();
      startBtn.hidden = true;
      replayBtn.hidden = true;
      phase = 'intro';
      stage.dataset.phase = 'intro';
      introVideo.muted = false;
      introVideo.currentTime = 0;
      introStartedAt = performance.now();
      const p = introVideo.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          startBtn.hidden = false;
        });
      }
    }

    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startIntroWithSound();
    });

    stage.addEventListener('click', () => {
      if (phase === 'intro') {
        if (!startBtn.hidden || introVideo.paused) {
          startIntroWithSound();
        } else if (performance.now() - introStartedAt > 450) {
          enterInteractivePhase();
        }
      }
    });

    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startIntroWithSound();
    });

    // Attempt immediate autoplay on load; if blocked by browser, show pure SVG play button
    introStartedAt = performance.now();
    const autoPlayPromise = introVideo.play();
    if (autoPlayPromise && typeof autoPlayPromise.then === 'function') {
      autoPlayPromise.then(() => {
        startBtn.hidden = true;
      }).catch(() => {
        startBtn.hidden = false;
      });
    }
  });
})();
