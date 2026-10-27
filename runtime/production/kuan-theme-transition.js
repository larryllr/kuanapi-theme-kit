const TAU = Math.PI * 2;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function transitionProfile() {
  const forced = window.__KUAN_THEME_TRANSITION_PROFILE__;
  if (forced === 'low') return { name: 'low', dpr: 1, particleBudget: 15000, fps: 30, duration: 1.12, timeout: 1450 };
  if (forced === 'full') return { name: 'full', dpr: 1.25, particleBudget: 54000, fps: 60, duration: 1.35, timeout: 1700 };

  const nav = window.navigator || {};
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  const cores = Number(nav.hardwareConcurrency) || 0;
  const memory = Number(nav.deviceMemory) || 0;
  const mobile = /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '');
  const lowPower = Boolean(connection?.saveData)
    || (cores > 0 && cores <= 4)
    || (memory > 0 && memory <= 3)
    || (mobile && cores > 0 && cores <= 6 && memory > 0 && memory <= 4);

  return lowPower
    ? { name: 'low', dpr: 1, particleBudget: 15000, fps: 30, duration: 1.12, timeout: 1450 }
    : { name: 'full', dpr: 1.25, particleBudget: 54000, fps: 60, duration: 1.35, timeout: 1700 };
}

function random(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function backgroundColor(root) {
  const value = getComputedStyle(root).backgroundColor;
  const match = value.match(/[\d.]+/g);
  if (!match || match.length < 3) return 'rgb(255, 255, 255)';
  return `rgb(${match.slice(0, 3).map(Number).join(', ')})`;
}

function viewport(profile) {
  return {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, profile.dpr),
  };
}

function makeParticles(snapshot, width, height, budget) {
  const pixels = snapshot.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  const step = Math.max(4, Math.sqrt(width * height / budget));
  const particles = [];
  let index = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const px = Math.min(width - 1, Math.floor(x));
      const py = Math.min(height - 1, Math.floor(y));
      const offset = (py * width + px) * 4;
      const alpha = pixels[offset + 3] / 255;
      if (alpha < 0.08) continue;
      const seed = ++index;
      particles.push({
        x: x / width,
        y: y / height,
        color: `rgba(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]}, ${alpha.toFixed(3)})`,
        size: 1 + random(seed + 3) * Math.max(1.5, step * 0.64),
        delay: random(seed + 7) * 0.18,
        drift: random(seed + 11),
        curl: random(seed + 17) * TAU,
      });
    }
  }
  return particles;
}

function drawParticles(context, particles, width, height, time) {
  const progress = Math.max(0, Math.min(1, (time - 0.08) / 1.12));
  const eased = 1 - Math.pow(1 - progress, 2.4);
  for (const particle of particles) {
    const age = Math.max(0, progress - particle.delay);
    if (!age) continue;
    const wind = 80 + particle.drift * 170;
    const lift = -26 - particle.drift * 92;
    const wave = Math.sin(particle.curl + age * 11) - Math.sin(particle.curl);
    const x = particle.x * width + wind * eased * (0.35 + age * 1.75) + wave * age * 18;
    const y = particle.y * height + lift * eased * (0.35 + age * 1.45) + wave * age * 12;
    const fade = Math.max(0, 1 - Math.max(0, progress - 0.62) / 0.38);
    context.globalAlpha = fade * (0.65 + particle.drift * 0.35);
    context.fillStyle = particle.color;
    context.fillRect(x, y, particle.size * (1 - eased * 0.2), particle.size * (1 - eased * 0.2));
  }
  context.globalAlpha = 1;
}

async function capture(root, { width, height, dpr }) {
  if (!window.htmlToImage?.toCanvas) throw new Error('snapshot renderer unavailable');
  return window.htmlToImage.toCanvas(root, {
    width,
    height,
    pixelRatio: dpr,
    skipFonts: true,
    cacheBust: false,
    style: { transform: `translateY(${-window.scrollY}px)`, overflow: 'visible' },
  });
}

function reveal(root) {
  root.classList.remove('kuan-theme-transitioning');
}

export async function runThemeTransition(root, change) {
  if (!root || root.dataset.kuanThemeTransitionBusy === 'true') return;
  const reduced = window.matchMedia(REDUCED_MOTION).matches;
  if (reduced) {
    change();
    return;
  }

  root.dataset.kuanThemeTransitionBusy = 'true';
  const profile = transitionProfile();
  const size = viewport(profile);
  const layer = document.createElement('div');
  layer.className = 'kuan-theme-transition-layer';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  layer.append(canvas);
  document.body.append(layer);
  let snapshot;
  let particles;
  let captureTimer = 0;
  try {
    snapshot = await Promise.race([
      capture(root, size),
      new Promise((_, reject) => {
        captureTimer = window.setTimeout(() => reject(new Error('theme snapshot timeout')), profile.name === 'low' ? 650 : 900);
      }),
    ]);
    const scratch = document.createElement('canvas');
    scratch.width = Math.max(1, Math.round(size.width * size.dpr));
    scratch.height = Math.max(1, Math.round(size.height * size.dpr));
    scratch.getContext('2d').drawImage(snapshot, 0, 0, scratch.width, scratch.height);
    particles = makeParticles(scratch, scratch.width, scratch.height, profile.particleBudget);
  } catch {
    if (captureTimer) clearTimeout(captureTimer);
    layer.remove();
    delete root.dataset.kuanThemeTransitionBusy;
    change();
    return;
  }
  if (captureTimer) clearTimeout(captureTimer);

  canvas.width = Math.max(1, Math.round(size.width * size.dpr));
  canvas.height = Math.max(1, Math.round(size.height * size.dpr));
  canvas.style.width = `${size.width}px`;
  canvas.style.height = `${size.height}px`;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('theme transition canvas unavailable');
  context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  context.imageSmoothingEnabled = false;
  const background = backgroundColor(root);
  const start = performance.now();
  const duration = profile.duration;
  const frameBudget = 1000 / profile.fps;
  let lastDraw = -Infinity;
  let frame = 0;
  let watchdog = 0;
  let finished = false;
  root.classList.add('kuan-theme-transitioning');
  change();

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    if (watchdog) clearTimeout(watchdog);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reveal(root);
    layer.remove();
    delete root.dataset.kuanThemeTransitionBusy;
  };
  const onVisibilityChange = () => {
    if (document.hidden) finish();
  };
  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  const draw = now => {
    const elapsed = Math.min(duration, (now - start) / 1000);
    if (elapsed < duration && now - lastDraw < frameBudget) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastDraw = now;
    const fade = Math.min(1, elapsed / (profile.name === 'low' ? 0.18 : 0.22));
    context.clearRect(0, 0, size.width, size.height);
    context.fillStyle = background;
    context.fillRect(0, 0, size.width, size.height);
    context.globalAlpha = Math.max(0, 1 - fade);
    context.drawImage(snapshot, 0, 0, size.width, size.height);
    context.globalAlpha = 1;
    drawParticles(context, particles, size.width, size.height, elapsed);
    if (elapsed >= duration) finish();
    else frame = requestAnimationFrame(draw);
  };
  watchdog = window.setTimeout(finish, profile.timeout);
  frame = requestAnimationFrame(draw);
}
