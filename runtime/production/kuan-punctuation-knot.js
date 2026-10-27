const TAU = Math.PI * 2;
const TURN_SECONDS = 18;
const BREATH_SECONDS = TURN_SECONDS * 1.5;
const LOOP_SECONDS = TURN_SECONDS * 3;
const SUPERSAMPLE = 3;
const PALETTE = ' .,:;+*#';
const LOGO_PATH = 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

let petals;
function getPetals() {
  if (petals) return petals;
  const path = new Path2D(LOGO_PATH);
  petals = Array.from({ length: 6 }, (_, index) => {
    const angle = (-102 + index * 60) * Math.PI / 180;
    const image = document.createElement('canvas');
    image.width = image.height = 384;
    const drawing = image.getContext('2d');
    drawing.scale(16, 16);
    drawing.beginPath();
    drawing.moveTo(12, 12);
    drawing.arc(12, 12, 40, angle - Math.PI / 6 - .001, angle + Math.PI / 6 + .001);
    drawing.closePath();
    drawing.clip();
    drawing.fillStyle = '#fff';
    drawing.fill(path);
    return { image, x: Math.cos(angle), y: Math.sin(angle) };
  });
  return petals;
}

// One renderer for Chat, the design lab, and React. The visible canvas contains only glyphs.
export function mountPunctuationKnot(host, { gsap } = {}) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'OpenAI');
  canvas.draggable = false;
  host.append(canvas);
  const context = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const maskContext = mask.getContext('2d', { willReadFrequently: true });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = matchMedia('(prefers-color-scheme: dark)');
  const clock = { seconds: 0 };
  const shape = getPetals();
  let width = 0, height = 0, columns = 0, rows = 0, cellWidth = 0, cellHeight = 0;
  let foreground = '', lastFrame = -Infinity, frame = 0, previousTime = 0;
  let onScreen = false, disposed = false, suspended = false, tween;

  function draw(force = false) {
    if (!width || !height || disposed) return;
    const now = performance.now();
    if (!force && now - lastFrame < 1000 / 30) return;
    lastFrame = now;
    const openness = (1 - Math.cos(clock.seconds / BREATH_SECONDS * TAU)) / 2;
    // Keep the original 4:3 silhouette even inside a tall phone or a wide desktop region.
    const unit = Math.min(height, width * .75) / 28;
    maskContext.setTransform(1, 0, 0, 1, 0, 0);
    maskContext.clearRect(0, 0, mask.width, mask.height);
    maskContext.translate(mask.width / 2, mask.height / 2);
    maskContext.scale(unit * 1.12 * mask.width / width, unit * mask.height / height);
    maskContext.rotate(clock.seconds / TURN_SECONDS * TAU);
    for (const petal of shape) {
      maskContext.save();
      maskContext.translate(petal.x * .34 * openness, petal.y * .34 * openness);
      maskContext.translate(petal.x * 4.8, petal.y * 4.8);
      maskContext.rotate(-.022 * openness);
      maskContext.translate(-petal.x * 4.8, -petal.y * 4.8);
      maskContext.drawImage(petal.image, -12, -12, 24, 24);
      maskContext.restore();
    }
    const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
    context.clearRect(0, 0, width, height);
    context.fillStyle = foreground;
    let glyphs = 0;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        let alpha = 0;
        for (let dy = 0; dy < SUPERSAMPLE; dy++) {
          for (let dx = 0; dx < SUPERSAMPLE; dx++) {
            alpha += pixels[((row * SUPERSAMPLE + dy) * mask.width + column * SUPERSAMPLE + dx) * 4 + 3];
          }
        }
        const coverage = alpha / (255 * SUPERSAMPLE * SUPERSAMPLE);
        if (coverage < .035) continue;
        const index = Math.min(PALETTE.length - 1, Math.ceil(coverage * (PALETTE.length - 1)));
        context.fillText(PALETTE[index], (column + .5) * cellWidth, (row + .5) * cellHeight);
        glyphs++;
      }
    }
    host.dataset.seconds = clock.seconds.toFixed(3);
    host.dataset.glyphs = String(glyphs);
  }

  function refresh() {
    foreground = getComputedStyle(host).color;
    draw(true);
  }

  function resize() {
    const bounds = host.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width), nextHeight = Math.round(bounds.height);
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth; height = nextHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const glyphSize = width < 420 ? 9 : 11;
    context.font = `500 ${glyphSize}px "Cascadia Mono", Consolas, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    cellWidth = context.measureText('#').width;
    cellHeight = glyphSize * 1.02;
    columns = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / cellHeight);
    mask.width = columns * SUPERSAMPLE;
    mask.height = rows * SUPERSAMPLE;
    refresh();
  }

  function tick(now) {
    const delta = previousTime ? Math.min((now - previousTime) / 1000, .1) : 0;
    previousTime = now;
    clock.seconds = (clock.seconds + delta) % LOOP_SECONDS;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const running = onScreen && !document.hidden && !motion.matches && !disposed && !suspended;
    tween?.paused(!running);
    cancelAnimationFrame(frame);
    frame = 0; previousTime = 0;
    if (!tween && running) frame = requestAnimationFrame(tick);
    host.dataset.playing = String(running);
    if (!running) draw(true);
  }

  const preventSelection = event => event.preventDefault();
  host.addEventListener('contextmenu', preventSelection);
  host.addEventListener('selectstart', preventSelection);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); });
  intersectionObserver.observe(host);
  const themeObserver = new MutationObserver(refresh);
  for (let parent = host; parent; parent = parent.parentElement) {
    themeObserver.observe(parent, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-color', 'data-color-theme', 'data-kuan-design-theme'] });
  }
  const hide = () => { suspended = true; sync(); };
  const show = () => { suspended = false; resize(); refresh(); sync(); };
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', show);
  motion.addEventListener('change', sync);
  colors.addEventListener('change', refresh);
  resize();
  if (gsap) tween = gsap.to(clock, { id: 'kuan-punctuation-knot', seconds: LOOP_SECONDS, duration: LOOP_SECONDS, repeat: -1, ease: 'none', paused: true, onUpdate: () => draw() });
  sync();

  return {
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      tween?.kill();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect(); themeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show);
      motion.removeEventListener('change', sync); colors.removeEventListener('change', refresh);
      host.removeEventListener('contextmenu', preventSelection); host.removeEventListener('selectstart', preventSelection);
      canvas.remove();
      delete host.dataset.seconds; delete host.dataset.glyphs; delete host.dataset.playing;
    },
  };
}
