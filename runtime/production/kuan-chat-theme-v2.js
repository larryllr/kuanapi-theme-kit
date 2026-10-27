import { gsap } from './kuan-tc1003-e92a67dc3f.js';
import { mountPunctuationKnot } from './kuan-punctuation-knot.js';
import { runThemeTransition } from './kuan-theme-transition.js';

(() => {
  if (window.__kuanChatThemeV2) return;
  window.__kuanChatThemeV2 = true;
  const THEME_KEY = 'kuan-chat-design-theme';
  const THEMES = { 'd-teacher': ['D老师', 'D Teacher'], mono: ['素境', 'MONO'] };
  const animations = new Map();
  const appearance = matchMedia('(prefers-color-scheme: dark)');
  let activeRoot, observer, scheduled = false;
  const english = () => /^en/i.test(document.documentElement.lang || '');
  const text = (zh, en) => english() ? en : zh;
  function readTheme() {
    try { return Object.hasOwn(THEMES, localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : 'd-teacher'; }
    catch { return 'd-teacher'; }
  }
  function applyTheme(root) {
    const theme = readTheme();
    if (root.dataset.kuanDesignTheme !== theme) root.dataset.kuanDesignTheme = theme;
    for (const value of Object.keys(THEMES)) root.classList.toggle('kuan-design-' + value, theme === value);
    if (document.documentElement.dataset.kuanDesignTheme !== theme) document.documentElement.dataset.kuanDesignTheme = theme;
    const scheme = theme === 'mono' ? (appearance.matches ? 'dark' : 'light') : '';
    if (document.documentElement.style.colorScheme !== scheme) document.documentElement.style.colorScheme = scheme;
    for (const button of root.querySelectorAll('[data-theme-choice]')) {
      const selected = button.dataset.themeChoice === theme;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-checked', String(selected));
    }
  }
  function settings(root) {
    const panel = root.querySelector('.kuan-settings:not(.kuan-password-settings):not(.kuan-sync-settings)');
    const body = panel?.querySelector('.kuan-settings-body');
    if (!body) return;
    if (!body.querySelector('[data-kuan-design-theme-setting]')) {
      const section = document.createElement('section');
      section.className = 'kuan-design-theme-setting';
      section.dataset.kuanDesignThemeSetting = '';
      section.innerHTML = `<h3>${text('外观', 'Appearance')}</h3><div class="kuan-theme-options" role="radiogroup" aria-label="${text('界面主题', 'Interface theme')}">${Object.entries(THEMES).map(([key, labels]) => `<button type="button" class="kuan-theme-option" data-theme-choice="${key}" role="radio" aria-checked="false"><span class="kuan-theme-preview kuan-theme-preview-${key}" aria-hidden="true"><i></i><i></i><i></i></span><span class="kuan-theme-copy"><strong>${labels[english() ? 1 : 0]}</strong><small>${key === 'mono' ? text('跟随系统明暗', 'System light and dark') : text('经典界面', 'Classic interface')}</small></span><svg class="kuan-theme-check" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4 10-10"/></svg></button>`).join('')}</div>`;
      for (const button of section.querySelectorAll('[data-theme-choice]')) button.addEventListener('click', () => {
        const nextTheme = button.dataset.themeChoice;
        if (nextTheme === readTheme() || root.dataset.kuanThemeTransitionBusy === 'true') return;
        void runThemeTransition(root, () => {
          try { localStorage.setItem(THEME_KEY, nextTheme); } catch {}
          applyTheme(root);
        });
      });
      body.prepend(section);
    }
    if (!panel.dataset.kuanUnifiedSettings) {
      panel.dataset.kuanUnifiedSettings = 'true';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      const title = panel.querySelector('h2');
      if (title) { title.id = 'kuan-unified-settings-title'; title.textContent = text('设置', 'Settings'); panel.setAttribute('aria-labelledby', title.id); }
      const subtitle = panel.querySelector('header p');
      if (subtitle) subtitle.hidden = true;
      const close = panel.querySelector('header button');
      const escape = event => { if (event.key === 'Escape' && panel.isConnected) { event.stopPropagation(); close?.click(); } };
      panel.addEventListener('keydown', escape);
      requestAnimationFrame(() => close?.focus({ preventScroll: true }));
    }
  }
  function removeKnot(host) {
    animations.get(host)?.dispose();
    animations.delete(host);
    host.remove();
  }
  function createKnot(className) {
    const host = document.createElement('div');
    host.className = className;
    const stage = document.createElement('div');
    stage.className = 'kuan-punctuation-knot';
    host.append(stage);
    return host;
  }
  function startKnot(host) {
    if (!animations.has(host)) animations.set(host, mountPunctuationKnot(host.querySelector('.kuan-punctuation-knot'), { gsap }));
  }
  function artwork(root) {
    const openai = root.dataset.kuanGroupPlatform === 'openai';
    const empty = root.querySelector('.kuan-empty');
    const grid = empty?.querySelector('.kuan-prompt-grid');
    empty?.classList.toggle('kuan-openai-welcome', openai);
    let welcome = empty?.querySelector('.kuan-openai-welcome-art');
    if (openai && grid) {
      if (!welcome) { welcome = createKnot('kuan-openai-welcome-art'); grid.after(welcome); }
      startKnot(welcome);
    } else if (welcome) removeKnot(welcome);
    const retained = new Set(welcome && openai ? [welcome] : []);
    for (const progress of root.querySelectorAll('.kuan-image-progress')) {
      if (!openai) continue;
      const activity = progress.closest('.kuan-assistant-activity');
      if (!activity) continue;
      let loader = activity.nextElementSibling;
      if (!loader?.classList.contains('kuan-openai-image-loader')) {
        loader = createKnot('kuan-openai-image-loader');
        const percent = document.createElement('span'); percent.className = 'kuan-knot-image-percent'; loader.append(percent);
        activity.after(loader);
      }
      retained.add(loader); startKnot(loader);
      const value = Number(progress.value), max = Number(progress.max);
      const label = progress.hasAttribute('value') && Number.isFinite(value) && max > 0
        ? Math.round(Math.max(0, Math.min(1, value / max)) * 100) + '%' : '…';
      const percent = loader.querySelector('.kuan-knot-image-percent');
      if (percent.textContent !== label) percent.textContent = label;
    }
    for (const host of animations.keys()) if (!host.isConnected || !root.contains(host) || !retained.has(host)) removeKnot(host);
  }
  function refresh() {
    scheduled = false;
    if (!activeRoot?.isConnected) return;
    settings(activeRoot); applyTheme(activeRoot); artwork(activeRoot);
  }
  function queue() { if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); } }
  function scan() {
    const root = document.querySelector('.kuan-chat-shell');
    if (root === activeRoot) return;
    observer?.disconnect();
    for (const host of animations.keys()) removeKnot(host);
    activeRoot = root;
    if (!root) return;
    observer = new MutationObserver(queue);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-kuan-group-platform', 'value', 'max'] });
    refresh();
  }
  appearance.addEventListener('change', queue);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
