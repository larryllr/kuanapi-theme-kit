import { gsap } from 'gsap';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function profile() {
  const forced = window.__KUAN_THEME_TRANSITION_PROFILE__;
  if (forced === 'low') return { count: 18, duration: 0.72, spread: 80 };
  if (forced === 'full') return { count: 44, duration: 1.08, spread: 160 };
  const cores = Number(navigator.hardwareConcurrency) || 8;
  const memory = Number(navigator.deviceMemory) || 8;
  return cores <= 4 || memory <= 3 ? { count: 18, duration: 0.72, spread: 80 } : { count: 36, duration: 0.96, spread: 130 };
}

export function runThemeTransition(root, change) {
  if (!root || reduceMotion() || root.dataset.themeTransitionBusy === 'true') {
    change();
    return Promise.resolve();
  }
  root.dataset.themeTransitionBusy = 'true';
  const { count, duration, spread } = profile();
  const layer = document.createElement('div');
  layer.className = 'theme-transition-layer';
  layer.setAttribute('aria-hidden', 'true');
  const particles = Array.from({ length: count }, (_, index) => {
    const node = document.createElement('i');
    node.className = 'theme-transition-particle';
    node.dataset.index = String(index);
    layer.append(node);
    return node;
  });
  document.body.append(layer);
  const clean = () => {
    gsap.killTweensOf(particles);
    gsap.killTweensOf(layer);
    layer.remove();
    delete root.dataset.themeTransitionBusy;
  };
  const random = index => (Math.sin(index * 17.31) + 1) / 2;
  const timeline = gsap.timeline({ onComplete: clean });
  timeline.set(layer, { autoAlpha: 1 });
  timeline.fromTo(particles,
    { autoAlpha: 0, x: 0, y: 0, scale: 0.2, rotate: -18 },
    {
      autoAlpha: index => 0.25 + random(index) * 0.7,
      x: index => (random(index + 3) - 0.5) * spread,
      y: index => (random(index + 9) - 0.5) * spread * 0.72,
      scale: index => 0.75 + random(index + 15) * 1.8,
      rotate: index => (random(index + 21) - 0.5) * 180,
      duration: duration * 0.62,
      stagger: { each: duration / Math.max(18, count * 2), from: 'random' },
      ease: 'power2.out',
    }, 0);
  timeline.call(change, [], duration * 0.31);
  timeline.to(layer, { autoAlpha: 0, duration: duration * 0.34, ease: 'power1.inOut' }, duration * 0.66);
  return timeline.then?.() || Promise.resolve();
}
