/**
 * Theme contract for the Kuan API theme kit.
 * Keep the component names stable so the same theme can style Chat and Work.
 */
export const themeTemplate = {
  id: 'your-theme-id',
  label: '你的主题',
  englishLabel: 'YOUR THEME',
  description: '一句话说明视觉气质，不添加新的产品功能。',
  tokens: {
    bg: '#f7f8f7',
    surface: '#ffffff',
    surfaceMuted: '#eef1ef',
    ink: '#18211d',
    muted: '#68756d',
    line: '#dfe6e1',
    accent: '#1d7b59',
    accentSoft: '#e3f2ea',
    accentInk: '#ffffff',
    userBubble: '#e3f2ea',
    danger: '#a83c35',
    radius: '10px',
    controlRadius: '7px',
    shadow: '0 12px 36px rgba(22, 44, 33, .08)',
    font: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  },
  // These are slots, not extra features. The host still owns the actual buttons.
  slots: [
    'shell', 'rail', 'sidebar', 'header', 'conversation', 'message', 'reasoning',
    'composer', 'attachment', 'group-picker', 'model-picker', 'reasoning-slider',
    'settings', 'file-panel', 'image-workbench', 'work-project', 'work-files',
    'work-plan', 'work-command', 'work-approval', 'work-terminal', 'toast',
  ],
};

export function tokensToCss(theme) {
  return Object.entries(theme.tokens).map(([key, value]) => `--kuan-${key}:${value};`).join('');
}
