import { gsap } from 'gsap';
import { mountPunctuationKnot } from '../runtime/production/kuan-punctuation-knot.js';
import '../runtime/production/kuan-punctuation-knot.css';
import { runThemeTransition } from './theme-transition.js';
import { createIcons, ArrowUp, ArrowDownToLine, ArrowUpRight, AudioLines, BookOpen, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy, File, FileCode, FileText, Folder, Image, LayoutGrid, Leaf, ListChecks, Menu, MessageCircle, MessagesSquare, Monitor, Moon, MoreHorizontal, PanelLeftClose, PanelRight, PanelsTopLeft, Paperclip, Pencil, Play, Plus, RotateCcw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Square, Sun, TerminalSquare, Trash2, X } from 'lucide';

const icons = { ArrowUp, ArrowDownToLine, ArrowUpRight, AudioLines, BookOpen, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Copy, File, FileCode, FileText, Folder, Image, LayoutGrid, Leaf, ListChecks, Menu, MessageCircle, MessagesSquare, Monitor, Moon, MoreHorizontal, PanelLeftClose, PanelRight, PanelsTopLeft, Paperclip, Pencil, Play, Plus, RotateCcw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Square, Sun, TerminalSquare, Trash2, X };
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const button = (action, name, label, extra = '') => `<button type="button" class="icon-button" data-action="${action}" aria-label="${label}" data-tooltip="${label}" ${extra}>${icon(name)}</button>`;
const themes = [
  { id: 'clear', name: '澄明', en: 'CLEAR', icon: 'leaf', note: '轻盈留白 / 专注对话' },
  { id: 'folio', name: '序页', en: 'FOLIO', icon: 'book-open', note: '编辑排版 / 沉浸阅读' },
  { id: 'studio', name: '工坊', en: 'STUDIO', icon: 'panels-top-left', note: '专业工作台 / 信息密度' },
  { id: 'canvas', name: '场域', en: 'CANVAS', icon: 'layout-grid', note: '双区画布 / 并行创作' },
  { id: 'native', name: '随行', en: 'NATIVE', icon: 'messages-square', note: '原生触感 / 轻松交流' },
  { id: 'mono', name: '素境', en: 'MONO', icon: 'message-circle', note: 'GPT 风格 / 自然对话 / 独立 React 主题' },
];
const levels = ['即答', '轻量', '标准', '深入', '尽全力'];
const groups = { openai: 'OpenAI', grok: 'Grok', gemini: 'Gemini', china: '国模' };
const models = { gpt: ['GPT-6', 'GPT-5.6'], work: ['GPT-6', 'Claude Sonnet', 'Grok'] };
const prompt = '想找个不赶路的海边周末。两个人，从厦门出发，帮我安排两天行程，留一点发呆的时间。';
const seedChats = [
  { id: 'sea', title: '把周末留给山海', section: '今天', messages: [{ role: 'user', text: prompt }, { role: 'assistant', type: 'itinerary' }] },
  { id: 'site', title: '官网首页的交互细节', section: '今天', messages: [{ role: 'user', text: '帮我整理官网首页的交互细节。' }, { role: 'assistant', text: '先保持主流程清楚，再打磨细节。\n\n1. 导航状态与当前位置保持一致。\n2. 按钮反馈及时，等待过程有明确状态。\n3. 在小屏幕上优先保留核心操作。\n\n可以先从导航和表单的焦点状态开始。' }] },
  { id: 'readme', title: '整理项目 README', section: '昨天', messages: [{ role: 'user', text: '给新项目整理一份清楚的 README 结构。' }, { role: 'assistant', text: '建议依次包含：项目用途、快速启动、环境配置、目录结构、常用命令和部署方式。\n\n把最短可运行步骤放在前面，详细说明放在后面。这样新成员能先启动项目，再逐步了解实现。' }] },
  { id: 'coffee', title: '咖啡店的品牌灵感', section: '昨天', messages: [{ role: 'user', text: '一家社区咖啡店，想要自然、亲切的品牌气质。' }, { role: 'assistant', text: '可以围绕“日常的一小段停留”展开。\n\n视觉上保持克制的字标、真实的材质和自然光照片。空间里用菜单、包装和门头重复同一种排版节奏，而不是增加装饰。' }] },
];
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('浏览器存储已满，本次内容仅在页面内保留'); } },
};
let chats = storage.get('kuan-design-chats', structuredClone(seedChats));
if (!Array.isArray(chats) || !chats.length) chats = structuredClone(seedChats);
let state = { theme: document.documentElement.dataset.theme, appearance: document.documentElement.dataset.appearance, active: chats[0].id, mode: 'gpt', model: 'GPT-6', level: 2, panel: null, drawer: false, collapsed: false, files: false, artifactHidden: false, artifact: 'document', attachments: [], search: '', busy: false, draft: storage.get('kuan-design-draft', ''), selected: null, font: 'standard', view: 'chat', projectApproval: false };
let projectEvents = [
  { type: 'user', text: '在这个项目里检查 200 个文件，先读取目录，再告诉我最可能的入口。' },
  { type: 'plan', text: '已建立计划：索引项目 → 选择性读取 → 输出结论。' },
  { type: 'command', command: 'find . -maxdepth 2 -type f | sort | head -80', result: 'src/app.ts\nsrc/components/Composer.tsx\npackage.json\nREADME.md' },
  { type: 'approval', text: '需要允许读取项目目录；命令与结果默认折叠。' },
];
let motion;
state.group = storage.get('kuan-design-group', 'openai');
if (!groups[state.group]) state.group = 'openai';
let welcomeAnimation;
function mountWelcome() {
  welcomeAnimation?.dispose();
  welcomeAnimation = null;
  const host = $('.openai-welcome .kuan-punctuation-knot');
  if (host) welcomeAnimation = mountPunctuationKnot(host, { gsap });
}
let generation;
let editing = null;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const systemColor = window.matchMedia('(prefers-color-scheme: dark)');
const objectUrls = new Set();
const chat = () => chats.find(item => item.id === state.active) || chats[0];
const currentTheme = () => themes.find(item => item.id === state.theme);
function persist() { storage.set('kuan-design-chats', chats); }
function refreshIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.65 } }); }
function applyColor() {
  document.documentElement.dataset.color = state.appearance === 'system' ? (systemColor.matches ? 'dark' : 'light') : state.appearance;
  document.documentElement.dataset.appearance = state.appearance;
  localStorage.setItem('kuan-design-appearance', state.appearance);
  syncEmbeddedAppearance();
}
function syncEmbeddedAppearance() { $('#mono-theme')?.contentWindow?.postMessage({ type: 'kuan-lab-appearance', appearance: state.appearance }, location.origin); }
window.addEventListener('message', event => {
  const frame = $('#mono-theme');
  if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'kuan-theme-appearance') return;
  if (!['system', 'light', 'dark'].includes(event.data.appearance) || state.appearance === event.data.appearance) return;
  state.appearance = event.data.appearance; applyColor(); lab(); refreshIcons();
});
systemColor.addEventListener('change', applyColor);
applyColor();

function lab() {
  $('#lab').innerHTML = `<div class="lab-identity"><span class="lab-mark">K.</span><strong>设计试用</strong><span class="local-badge">本地演示</span></div>
    <nav class="theme-tabs" aria-label="设计主题">${themes.map((theme, index) => `<button class="theme-tab ${state.theme === theme.id ? 'active' : ''}" data-theme-choice="${theme.id}" aria-pressed="${state.theme === theme.id}" title="${theme.note}"><span class="theme-index">0${index + 1}</span>${icon(theme.icon)}<span>${theme.name}</span></button>`).join('')}</nav>
    <div class="lab-actions"><button class="lab-project-entry ${state.view === 'project' ? 'active' : ''}" type="button" data-action="project">${icon('file-code')}<span>工程项目</span></button><div class="appearance" role="group" aria-label="外观模式">${[['system', 'monitor', '跟随系统'], ['light', 'sun', '浅色模式'], ['dark', 'moon', '深色模式']].map(([value, name, label]) => `<button class="icon-button ${state.appearance === value ? 'selected' : ''}" data-color-choice="${value}" aria-label="${label}" aria-pressed="${state.appearance === value}" data-tooltip="${label}">${icon(name)}</button>`).join('')}</div></div>`;
}

function brand() { return `<a class="brand" href="?theme=${state.theme}" aria-label="宽 API 设计试用"><img src="./assets/logo.png" alt="" width="30" height="30"><span>宽 API<small>${currentTheme().en}</small></span></a>`; }
function history() {
  const filtered = chats.filter(item => item.title.toLowerCase().includes(state.search.toLowerCase()));
  let section = '';
  return filtered.length ? filtered.map(item => {
    const heading = section !== item.section ? `<div class="history-label">${esc(item.section)}</div>` : '';
    section = item.section;
    return `${heading}<button class="history-item ${state.active === item.id ? 'active' : ''}" data-chat="${item.id}">${icon('message-circle')}<span>${esc(item.title)}</span>${state.active === item.id ? '<span class="active-dot"></span>' : ''}</button>`;
  }).join('') : '<p class="history-empty">没有找到对话</p>';
}
function sidebar() {
  return `<aside class="sidebar" aria-label="对话历史"><div class="sidebar-head">${brand()}${button('close-sidebar', 'panel-left-close', '收起侧栏')}</div>
    <button class="new-chat" data-action="new-chat">${icon('plus')}<span>新对话</span><span class="keyhint">N</span></button>
    <label class="history-search">${icon('search')}<input id="history-search" placeholder="搜索对话" value="${esc(state.search)}" aria-label="搜索对话"><span>⌕</span></label>
    <div class="workspace-label">${icon('folder')}<span>我的空间</span><span>${chats.length}</span></div>
    <button class="project-entry ${state.view === 'project' ? 'active' : ''}" data-action="project">${icon('file-code')}<span>工程项目</span><small>Work</small></button>
    <div class="history-list">${history()}</div>
    <div class="sidebar-footer"><button class="account" data-action="settings"><span class="avatar">K</span><span><strong>我的工作空间</strong><small>个人账户</small></span>${icon('settings-2')}</button><div class="sidebar-edition"><span>宽 API</span><span>DESIGN / 2026</span></div></div>
  </aside>`;
}
function rail() {
  return `<nav class="tool-rail" aria-label="工作空间导航"><img src="./assets/logo.png" alt="宽 API" width="32" height="32">${button('history', 'messages-square', '对话历史')}${button('new-chat', 'plus', '新对话')}${button('files', 'folder', '对话文件')}${button('project', 'file-code', '工程项目')}<span class="rail-spacer"></span>${button('settings', 'settings-2', '设置')}<button class="rail-avatar" data-action="settings" aria-label="个人设置">K</button></nav>`;
}
function header() {
  return `<header class="topbar"><div class="topbar-left">${button('history', 'menu', '展开对话历史')}<div class="header-copy"><div class="breadcrumb">个人空间<span>/</span>对话</div><h1>${esc(chat().title)}</h1></div><span class="saved-mark">${icon('check')}已保存</span></div>
    <div class="topbar-actions"><span class="session-label"><span></span>本地预览</span>${button('files', 'panel-right', '展开或收起文件')}${button('export', 'arrow-down-to-line', '导出对话')}${button('settings', 'settings-2', '打开设置')}</div></header>
    <div class="section-nav"><span class="folio-wordmark">宽 API<span> / 对话手记</span></span><div class="section-tabs"><button class="active" data-action="view-chat">${icon('message-circle')}对话</button><button data-action="files">${icon('file-text')}产物 <span>2</span></button></div><span class="section-date">OCT 23, 2026</span></div>`;
}

const itineraryText = '把周末留给山海\n\n第一天：到海边，把节奏放慢。上午出发，午后入住，傍晚沿海岸散步。\n第二天：睡到自然醒，再慢慢回家。上午找家咖啡馆，午后返程。\n\n不把时间排满，每天只保留一个目的地。';
function itinerary() {
  return `<div class="answer-intro"><span class="answer-eyebrow">A LITTLE ESCAPE</span><h2>让周末，慢一点。</h2><p>不赶景点，也不设闹钟。把这两天留给海风、日落，和彼此。</p></div>
    <div class="trip-cover"><img src="./assets/coast.jpg" alt="阳光下的蓝色海面与沿岸浪花" width="1400" height="760"><span class="photo-caption">海边 · 两天一夜</span><button class="photo-expand" data-action="image" aria-label="查看海边图片" data-tooltip="查看图片">${icon('arrow-up-right')}</button></div>
    <div class="itinerary-days"><section class="day"><span class="day-number">01</span><div><h3>到海边，把节奏放慢</h3><p>上午从厦门出发，午后入住。等太阳柔和一点，再沿海岸散步，找一家能看日落的小店。</p><span class="day-tag">第一天 · 海岸与日落</span></div></section><section class="day"><span class="day-number">02</span><div><h3>睡到自然醒，再慢慢回家</h3><p>把上午留给咖啡和海风。午后出发返程，不绕路打卡，也不用赶时间。</p><span class="day-tag">第二天 · 咖啡与返程</span></div></section></div>
    <div class="answer-note">${icon('leaf')}<p>每天只保留一个目的地，剩下的时间，随心一点。</p></div>
    <button class="output-file" data-action="download-plan">${icon('file-text')}<span><strong>海边周末计划.md</strong><small>行程已整理 · Markdown</small></span>${icon('arrow-down-to-line')}</button>`;
}
function actions(index) {
  return `<div class="message-actions">${button('copy', 'copy', '复制回复', `data-index="${index}"`)}${button('download-message', 'arrow-down-to-line', '下载回复', `data-index="${index}"`)}${button('regenerate', 'rotate-ccw', '重新生成演示回复', `data-index="${index}"`)}<span>GPT-6 <span>·</span> ${levels[state.level]}</span></div>`;
}
function messages() {
  const items = chat().messages;
  if (!items.length && state.group === 'openai') return '<div class="empty-state openai-welcome"><div class="kuan-punctuation-knot"></div></div>';
  if (!items.length) return `<div class="empty-state"><span class="empty-symbol">${icon('sparkles')}</span><span class="eyebrow">宽 API</span><h2>今天，从哪里开始？</h2><div class="suggestions"><button data-suggestion="帮我安排一个轻松的周末">${icon('leaf')}安排一个周末${icon('arrow-up-right')}</button><button data-suggestion="帮我梳理一个项目的思路">${icon('file-code')}梳理项目思路${icon('arrow-up-right')}</button><button data-suggestion="给一个新品牌找些灵感">${icon('sparkles')}找一点新灵感${icon('arrow-up-right')}</button></div></div>`;
  return `<div class="conversation-date">今天 <span>10:24</span></div>${items.map((item, index) => `<article class="message ${item.role}" data-message="${index}"><div class="message-person">${item.role === 'assistant' ? `<span class="ai-mark">${icon('sparkles')}</span><strong>宽 API</strong><span class="message-model">${state.model}</span>` : '<span class="user-mark">K</span><strong>你</strong>'}</div><div class="message-body">${item.role === 'assistant' ? `<details class="reasoning"><summary>${icon('check')}<span>${item.type === 'itinerary' ? '已整理出行条件' : '本地演示回复'}</span>${icon('chevron-down')}</summary><p>这是用于体验界面排版和交互的示例，不代表真实模型推理。本地预览未连接任何线上账号。</p></details>` : ''}${item.type === 'itinerary' ? itinerary() : `<div class="prose">${esc(item.text || '').replace(/\n/g, '<br>')}</div>`}${item.attachments?.length ? `<div class="message-files">${item.attachments.map(file => `<span>${icon('file')} ${esc(file.name)}</span>`).join('')}</div>` : ''}</div>${item.role === 'assistant' ? actions(index) : `<div class="user-actions">${button('edit', 'pencil', '编辑这条消息', `data-index="${index}"`)}</div>`}</article>`).join('')}${state.busy ? '<div class="generating" role="status"><span></span><span></span><span></span><small>正在生成本地演示回复</small></div>' : ''}`;
}

function inlinePanel() {
  if (state.panel === 'group') return `<div class="inline-panel group-panel"><div class="panel-heading"><strong>选择分组</strong></div><div class="model-options">${Object.entries(groups).map(([value, label]) => `<button data-group="${value}" aria-pressed="${state.group === value}"><strong>${label}</strong>${state.group === value ? icon('check') : ''}</button>`).join('')}</div></div>`;
  if (state.panel === 'model') return `<div class="inline-panel model-panel"><div class="panel-heading"><strong>选择模型</strong><span>演示目录</span></div><div class="mode-switch" role="group" aria-label="调用模式">${['gpt', 'work'].map(mode => `<button data-mode="${mode}" class="${mode === state.mode ? 'active' : ''}" aria-pressed="${mode === state.mode}">${mode === 'gpt' ? 'GPT' : 'GPT Work'}</button>`).join('')}</div><div class="model-options">${models[state.mode].map((model, i) => `<button data-model="${model}" class="${state.model === model ? 'active' : ''}"><span class="model-symbol">${icon(i ? 'audio-lines' : 'sparkles')}</span><span><strong>${model}</strong><small>${i ? '轻快而可靠' : '适合复杂思考与创作'}</small></span>${state.model === model ? icon('check') : ''}</button>`).join('')}</div></div>`;
  if (state.panel === 'reasoning') return `<div class="inline-panel reasoning-panel"><div class="panel-heading"><strong>思考深度</strong><span id="level-readout">${levels[state.level]}</span></div><div class="reasoning-slider"><div class="slider-ticks">${levels.map((_, i) => `<span class="${i <= state.level ? 'filled' : ''}"></span>`).join('')}</div><input id="reasoning-range" type="range" min="0" max="4" step="1" value="${state.level}" aria-label="思考深度" aria-valuetext="${levels[state.level]}" style="--range:${state.level * 25}%"><div class="slider-labels">${levels.map((level, i) => `<button data-level="${i}" class="${i === state.level ? 'active' : ''}">${level}</button>`).join('')}</div></div></div>`;
  return '';
}
function composer() {
  return `<div class="composer-area">${inlinePanel()}${editing !== null ? `<div class="editing-note">${icon('pencil')}正在编辑消息<button data-action="cancel-edit" aria-label="取消编辑">${icon('x')}</button></div>` : ''}<form class="composer" id="compose-form"><div class="attachment-tray">${state.attachments.map((file, i) => `<div class="attachment-chip">${file.url && file.type.startsWith('image/') ? `<img src="${file.url}" alt="">` : icon('file-text')}<span>${esc(file.name)}</span><button type="button" data-remove-file="${i}" aria-label="移除 ${esc(file.name)}">${icon('x')}</button></div>`).join('')}</div><textarea id="message-input" rows="2" placeholder="有什么想法，聊聊吧…" aria-label="消息内容">${esc(state.draft)}</textarea><div class="composer-tools"><div class="composer-left">${button('attach', 'plus', '添加附件')}<button type="button" class="group-trigger" data-action="group" aria-label="选择分组" aria-expanded="${state.panel === 'group'}">${icon('layout-grid')}<span>${groups[state.group]}</span>${icon('chevron-down')}</button><span class="tool-divider"></span><button type="button" class="model-trigger ${state.panel === 'model' ? 'active' : ''}" data-action="model" aria-expanded="${state.panel === 'model'}">${icon('sparkles')}<span>${state.model}</span>${icon('chevron-down')}</button><button type="button" class="reasoning-trigger ${state.panel === 'reasoning' ? 'active' : ''}" data-action="reasoning" aria-expanded="${state.panel === 'reasoning'}">${icon('brain')}<span>思考 · ${levels[state.level]}</span>${icon('chevron-down')}</button></div><button class="send-button" type="${state.busy ? 'button' : 'submit'}" ${state.busy ? 'data-action="stop"' : ''} aria-label="${state.busy ? '停止生成' : '发送消息'}" data-tooltip="${state.busy ? '停止生成' : '发送消息'}">${icon(state.busy ? 'square' : 'arrow-up')}</button></div></form><div class="composer-foot"><span>${state.mode === 'work' ? 'GPT Work' : 'GPT'} <span class="tiny-dot"></span>本地演示，不产生扣费</span><span>内容仅保存在本机</span></div></div>`;
}
function artifact() {
  const selected = state.selected;
  return `<aside class="artifact" aria-label="文件与产物"><div class="artifact-heading"><span>${icon('folder')}对话产物 <small>02</small></span>${button('files-close', 'x', '收起文件面板')}</div><div class="artifact-tabs"><button data-artifact="document" class="${state.artifact === 'document' ? 'active' : ''}">${icon('file-text')}行程计划</button><button data-artifact="image" class="${state.artifact === 'image' ? 'active' : ''}">${icon('image')}参考图片</button></div><div class="artifact-scroll">${selected ? `<div class="selected-file"><span class="eyebrow">附件预览</span><h2>${esc(selected.name)}</h2>${selected.type.startsWith('image/') ? `<img src="${selected.url}" alt="${esc(selected.name)}">` : `<pre>${esc(selected.text || '此类型仅展示文件信息，预览版不上传附件。')}</pre>`}</div>` : state.artifact === 'image' ? `<div class="image-preview"><img src="./assets/coast.jpg" alt="蓝色海面与白色海浪"><div><strong>海边的片刻</strong><span>参考图片 · JPG</span></div></div>` : `<div class="document-preview"><div class="document-topline"><span>TRAVEL NOTES</span>${icon('leaf')}</div><h2>把周末<br>留给山海</h2><p class="document-subtitle">厦门出发 / 两人 / 两天一夜</p><img src="./assets/coast.jpg" alt="海岸浪花"><div class="document-line"><span>01</span><div><h3>海岸与日落</h3><p>出发、散步、看一次日落。<br>让节奏慢下来。</p></div></div><div class="document-line"><span>02</span><div><h3>咖啡与返程</h3><p>睡到自然醒。<br>留一段不安排的时间。</p></div></div><div class="document-bottom">周末计划 <span>1 / 1</span></div></div>`}</div><div class="artifact-footer"><span>${selected ? esc(selected.name) : state.artifact === 'document' ? '海边周末计划.md' : 'coast.jpg'}</span>${button(selected ? 'download-selected' : state.artifact === 'document' ? 'download-plan' : 'download-image', 'arrow-down-to-line', '下载当前文件')}</div></aside>`;
}
function settings() {
  return `<section class="settings-panel" aria-label="预览设置"><div class="settings-heading"><h2>设置</h2>${button('settings', 'x', '关闭设置')}</div><div class="settings-account"><span class="avatar">K</span><div><strong>我的工作空间</strong><span>本地设计试用</span></div></div><div class="settings-section"><span class="eyebrow">外观</span><label>显示模式</label><div class="settings-colors">${[['system', '跟随系统'], ['light', '浅色'], ['dark', '深色']].map(([key, name]) => `<button data-color-choice="${key}" class="${state.appearance === key ? 'active' : ''}">${name}</button>`).join('')}</div><label>阅读字号</label><div class="settings-colors">${[['standard', '标准'], ['large', '较大']].map(([key, name]) => `<button data-font="${key}" class="${state.font === key ? 'active' : ''}">${name}</button>`).join('')}</div></div><div class="settings-section"><span class="eyebrow">数据</span><button class="settings-row" data-action="export">${icon('arrow-down-to-line')}导出当前对话${icon('chevron-right')}</button><button class="settings-row danger" data-action="reset">${icon('rotate-ccw')}重置演示数据${icon('chevron-right')}</button></div><p class="settings-note">所有交互均在本地进行。没有连接真实账号，也不会上传选择的文件。</p></section>`;
}

function projectPage() {
  const eventMarkup = projectEvents.map((event, index) => {
    if (event.type === 'user') return `<article class="project-message project-message-user"><span class="project-avatar user-mark">K</span><div><small>你 · 现在</small><p>${esc(event.text)}</p></div></article>`;
    if (event.type === 'plan') return `<details class="project-card project-plan" open><summary>${icon('list-checks')}计划与进度 <span>已保存</span></summary><ol><li class="done">索引项目文件</li><li class="active">选择性读取入口</li><li>整理结论并等待确认</li></ol></details>`;
    if (event.type === 'command') return `<details class="project-card project-command"><summary>${icon('terminal-square')}命令与结果 <span>已完成</span></summary><pre class="project-command-line">${esc(event.command)}</pre><pre class="project-command-result">${esc(event.result)}</pre></details>`;
    if (event.type === 'approval') return `<details class="project-card project-approval" open><summary>${icon('shield-check')}等待确认 <span>默认折叠</span></summary><p>${esc(event.text)}</p><div class="project-card-actions"><button data-action="project-approval">${state.projectApproval ? '已允许执行' : '允许这类命令'}</button><button class="quiet" data-action="project-cancel">暂不允许</button></div></details>`;
    return `<article class="project-card"><small>事件 ${index + 1}</small><p>${esc(event.text || '')}</p></article>`;
  }).join('');
  return `<section class="project-screen" aria-label="工程模式项目入口"><header class="project-header"><div><div class="project-breadcrumb">我的空间 <span>/</span> 工程项目</div><h2>宽 API 主题工作台</h2><p>代码、文件、命令和长期任务在同一个项目里保持可见。</p></div><div class="project-header-actions"><button class="project-action" data-action="back-chat">${icon('message-circle')}回到对话</button><button class="project-action" data-action="project-run">${icon('play')}继续任务</button></div></header><div class="project-grid"><aside class="project-files project-card"><div class="project-card-title"><strong>${icon('folder')}项目文件</strong><button aria-label="添加文件" data-action="project-files">${icon('plus')}</button></div><div class="project-file active"><span>${icon('file-code')}src/app.ts</span><small>12 KB</small></div><div class="project-file"><span>${icon('file-code')}src/components</span><small>18 项</small></div><div class="project-file"><span>${icon('file-text')}README.md</span><small>4 KB</small></div><div class="project-file"><span>${icon('file-text')}package.json</span><small>1 KB</small></div><div class="project-files-note">主题只改变外观；文件、工具、审批和结果仍由宿主功能控制。</div></aside><main class="project-conversation"><div class="project-status"><span class="status-dot"></span><strong>开发模式</strong><span>本地项目 · 自动保存</span><button class="work-approval-toggle ${state.projectApproval ? 'active' : ''}" data-action="project-approval">${state.projectApproval ? '免审批已开' : '需要审批'}</button></div><div class="project-events">${eventMarkup}</div><form class="project-composer" id="project-form"><textarea id="project-input" rows="2" placeholder="告诉项目下一步要做什么…" aria-label="工程模式项目消息"></textarea><div><span>${icon('paperclip')}附件可见 · ${icon('terminal-square')}命令结果可展开</span><button class="project-primary" type="submit">${icon('arrow-up')}发送任务</button></div></form></main><aside class="work-inspector project-card"><div class="project-card-title"><strong>${icon('sliders-horizontal')}项目设置</strong>${button('settings', 'settings-2', '打开主题设置')}</div><label>调用模式</label><div class="work-segmented"><button class="active">GPT Work</button><button>网页模型</button></div><label>推理强度</label><div class="work-effort"><span>深入</span><strong>●</strong><span>尽全力</span></div><label>命令策略</label><div class="work-setting-row"><span>免审批</span><button class="switch ${state.projectApproval ? 'active' : ''}" data-action="project-approval" aria-pressed="${state.projectApproval}"><i></i></button></div><label>任务恢复</label><div class="work-setting-row"><span>自动重试并继续</span><span class="setting-check">${icon('check')}</span></div><p class="inspector-note">所有主题必须能清楚展示这组项目控件，不能因换肤隐藏关键状态。</p></aside></div></section>`;
}

function render({ animate = false } = {}) {
  welcomeAnimation?.dispose();
  welcomeAnimation = null;
  motion?.revert();
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.font = state.font;
  lab();
  if (state.theme === 'mono' && state.view !== 'project') {
    $('#app').innerHTML = `<iframe id="mono-theme" class="theme-frame" src="./mono/index.html?embedded=1&appearance=${state.appearance}" title="宽 API 素境主题"></iframe>`;
    $('#mono-theme').addEventListener('load', syncEmbeddedAppearance);
    refreshIcons();
    return;
  }
  const mainContent = state.view === 'project' ? projectPage() : `${header()}<div class="stage"><div class="thread-wrap"><div class="messages" role="log" aria-label="对话消息">${messages()}</div>${composer()}</div>${artifact()}</div>`;
  $('#app').innerHTML = `<div class="app-shell ${state.drawer ? 'sidebar-open' : ''} ${state.collapsed ? 'sidebar-collapsed' : ''} ${state.artifactHidden ? 'artifact-hidden' : ''} ${state.files ? 'files-open' : ''} ${state.panel === 'settings' ? 'settings-open' : ''}">${rail()}${sidebar()}<main class="main-shell">${mainContent}</main>${state.panel === 'settings' ? settings() : ''}</div>`;
  refreshIcons();
  mountWelcome();
  const textarea = $('#message-input');
  if (textarea) autoSize(textarea);
  if (animate && !reduce.matches) motion = gsap.context(() => {
    gsap.from('.main-shell', { opacity: 0, y: 9, duration: 0.38, ease: 'power2.out', clearProps: 'all' });
    gsap.from('.history-item', { opacity: 0, x: -6, duration: 0.28, stagger: 0.025, clearProps: 'all' });
  }, $('#app'));
}
function autoSize(input) { input.style.height = 'auto'; input.style.height = `${Math.min(152, Math.max(58, input.scrollHeight))}px`; }
function refreshComposer(focus = false) {
  const area = $('.composer-area');
  area.outerHTML = composer();
  refreshIcons();
  autoSize($('#message-input'));
  if (focus) $('#message-input').focus();
  if (state.panel && $('.inline-panel') && !reduce.matches) gsap.from('.inline-panel', { opacity: 0, y: 10, scale: 0.985, transformOrigin: 'bottom left', duration: 0.24, ease: 'power2.out', clearProps: 'all' });
}
function refreshMessages() {
  welcomeAnimation?.dispose();
  $('.messages').innerHTML = messages();
  mountWelcome();
  refreshIcons();
}
function scrollEnd() { const el = $('.messages'); el.scrollTo({ top: el.scrollHeight, behavior: reduce.matches ? 'instant' : 'smooth' }); }
let toastTimeout;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2600);
}
function download(text, name, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('文件已交给浏览器下载');
}
function cancelGeneration() { clearTimeout(generation); state.busy = false; }
function makeDemoReply(text) {
  if (/周末|海边|旅行/.test(text)) return { role: 'assistant', type: 'itinerary' };
  return { role: 'assistant', text: `收到：${text.slice(0, 100)}${text.length > 100 ? '…' : ''}\n\n这是本地设计试用中的演示回复。你可以继续试用消息编辑、复制、文件下载、模型选择和思考滑块；所有主题共享同一份演示对话，不会上传到服务器。` };
}
function send(event) {
  event?.preventDefault();
  if (state.busy) return;
  const text = state.draft.trim();
  if (!text && !state.attachments.length) return;
  const item = chat();
  if (editing !== null) { item.messages.splice(editing); editing = null; }
  item.messages.push({ role: 'user', text: text || '查看附件', attachments: state.attachments.map(file => ({ name: file.name })) });
  if (item.title === '新对话') item.title = (text || state.attachments[0]?.name || '附件对话').slice(0, 18);
  state.draft = ''; state.attachments = []; state.panel = null; state.busy = true;
  storage.set('kuan-design-draft', '');
  persist(); render(); scrollEnd();
  generation = setTimeout(() => {
    item.messages.push(makeDemoReply(text));
    state.busy = false; persist();
    if (state.active === item.id && state.theme !== 'mono') { refreshMessages(); refreshComposer(); scrollEnd(); }
  }, reduce.matches ? 150 : 950);
}
function updateLevel(value) {
  state.level = Number(value);
  const range = $('#reasoning-range');
  if (range) { range.value = state.level; range.style.setProperty('--range', `${state.level * 25}%`); range.setAttribute('aria-valuetext', levels[state.level]); }
  if ($('#level-readout')) $('#level-readout').textContent = levels[state.level];
  $$('.slider-labels button').forEach((el, index) => el.classList.toggle('active', index === state.level));
  $$('.slider-ticks span').forEach((el, index) => el.classList.toggle('filled', index <= state.level));
  $('.reasoning-trigger span').textContent = `思考 · ${levels[state.level]}`;
  if (!reduce.matches) gsap.fromTo('#level-readout', { y: 3, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.2, overwrite: true });
}

document.addEventListener('click', async event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.themeChoice) {
    const nextTheme = target.dataset.themeChoice;
    await runThemeTransition(document.body, () => {
      state.theme = nextTheme;
      state.panel = null; state.drawer = false; state.files = false; state.collapsed = false; state.artifactHidden = false;
      localStorage.setItem('kuan-design-theme', state.theme);
      const url = new URL(location.href); url.searchParams.set('theme', state.theme); historyReplace(url);
      render({ animate: true });
    }); return;
  }
  if (target.dataset.colorChoice) { state.appearance = target.dataset.colorChoice; applyColor(); lab(); if (state.panel === 'settings') render(); refreshIcons(); return; }
  if (target.dataset.font) { state.font = target.dataset.font; render(); return; }
  if (target.dataset.chat) { cancelGeneration(); state.active = target.dataset.chat; state.drawer = false; state.panel = null; editing = null; render({ animate: true }); return; }
  if (target.dataset.suggestion) { state.draft = target.dataset.suggestion; refreshComposer(true); return; }
  if (target.dataset.group) { state.group = target.dataset.group; storage.set('kuan-design-group', state.group); state.panel = null; render(); return; }
  if (target.dataset.model) { state.model = target.dataset.model; state.panel = null; refreshComposer(); return; }
  if (target.dataset.mode) { state.mode = target.dataset.mode; state.model = models[state.mode][0]; refreshComposer(); return; }
  if (target.dataset.level !== undefined) { updateLevel(target.dataset.level); return; }
  if (target.dataset.removeFile !== undefined) { state.attachments.splice(Number(target.dataset.removeFile), 1); refreshComposer(); return; }
  if (target.dataset.artifact) { state.artifact = target.dataset.artifact; state.selected = null; $('.artifact').outerHTML = artifact(); refreshIcons(); return; }
  const index = Number(target.dataset.index);
  switch (target.dataset.action) {
    case 'project': state.view = 'project'; state.panel = null; state.drawer = false; render({ animate: true }); break;
    case 'back-chat': state.view = 'chat'; state.panel = null; render({ animate: true }); break;
    case 'project-approval': state.projectApproval = !state.projectApproval; render(); toast(state.projectApproval ? '演示：已允许命令执行' : '演示：仍需逐条确认'); break;
    case 'project-run': projectEvents.push({ type: 'command', command: 'npm test -- --runInBand', result: 'PASS 主题组件 · 12 tests\nPASS 工具状态 · 8 tests' }); render({ animate: true }); toast('演示任务已继续'); break;
    case 'project-cancel': toast('演示：没有执行这条命令'); break;
    case 'project-files': toast('演示：文件入口已保留，等待选择文件'); break;
    case 'history': {
      if (innerWidth > 900 && !['canvas', 'folio'].includes(state.theme)) { state.collapsed = !state.collapsed; $('.app-shell').classList.toggle('sidebar-collapsed', state.collapsed); }
      else { state.collapsed = false; state.drawer = !state.drawer; $('.app-shell').classList.remove('sidebar-collapsed'); $('.app-shell').classList.toggle('sidebar-open', state.drawer); }
      break;
    }
    case 'close-sidebar': state.drawer = false; state.collapsed = innerWidth > 900 && !['canvas', 'folio'].includes(state.theme); $('.app-shell').classList.remove('sidebar-open'); $('.app-shell').classList.toggle('sidebar-collapsed', state.collapsed); break;
    case 'new-chat': {
      cancelGeneration(); const id = crypto.randomUUID(); chats.unshift({ id, title: '新对话', section: '今天', messages: [] }); state.active = id; state.drawer = false; state.draft = ''; state.panel = null; editing = null; persist(); render({ animate: true }); $('#message-input').focus(); break;
    }
    case 'group': case 'model': case 'reasoning': state.panel = state.panel === target.dataset.action ? null : target.dataset.action; refreshComposer(); break;
    case 'settings': state.panel = state.panel === 'settings' ? null : 'settings'; render(); break;
    case 'attach': $('#file-input').click(); break;
    case 'files': { const visible = getComputedStyle($('.artifact')).display !== 'none'; state.files = !visible; state.artifactHidden = visible; $('.app-shell').classList.toggle('files-open', state.files); $('.app-shell').classList.toggle('artifact-hidden', state.artifactHidden); $('.artifact').outerHTML = artifact(); refreshIcons(); break; }
    case 'files-close': state.files = false; state.artifactHidden = true; $('.app-shell').classList.remove('files-open'); $('.app-shell').classList.add('artifact-hidden'); break;
    case 'image': state.artifact = 'image'; state.files = true; state.artifactHidden = false; state.selected = null; $('.app-shell').classList.remove('artifact-hidden'); $('.app-shell').classList.add('files-open'); $('.artifact').outerHTML = artifact(); refreshIcons(); break;
    case 'view-chat': state.files = false; $('.app-shell').classList.remove('files-open'); break;
    case 'download-plan': download(itineraryText, '海边周末计划.md'); break;
    case 'download-image': { const a = document.createElement('a'); a.href = './assets/coast.jpg'; a.download = 'coast.jpg'; a.click(); break; }
    case 'download-selected': if (state.selected) { const a = document.createElement('a'); a.href = state.selected.url; a.download = state.selected.name; a.click(); } break;
    case 'copy': try { await navigator.clipboard.writeText(chat().messages[index].type === 'itinerary' ? itineraryText : chat().messages[index].text); toast('回复已复制'); } catch { toast('浏览器未允许剪贴板访问'); } break;
    case 'download-message': download(chat().messages[index].type === 'itinerary' ? itineraryText : chat().messages[index].text, '宽API回复.md'); break;
    case 'edit': editing = index; state.draft = chat().messages[index].text; refreshComposer(true); break;
    case 'cancel-edit': editing = null; state.draft = ''; refreshComposer(); break;
    case 'regenerate': {
      const previous = chat().messages.slice(0, index).findLast(item => item.role === 'user');
      chat().messages[index] = makeDemoReply(previous?.text || ''); persist(); refreshMessages();
      toast('演示回复已重新生成'); if (!reduce.matches) gsap.fromTo(`[data-message="${index}"]`, { opacity: 0.3 }, { opacity: 1, duration: 0.5 });
      break;
    }
    case 'stop': cancelGeneration(); refreshMessages(); refreshComposer(); toast('已停止生成'); break;
    case 'export': download(chat().messages.map(item => `## ${item.role === 'user' ? '你' : '宽 API'}\n\n${item.type === 'itinerary' ? itineraryText : item.text}`).join('\n\n'), `${chat().title}.md`); break;
    case 'reset': if (target.dataset.confirm === 'yes') { cancelGeneration(); chats = structuredClone(seedChats); state.active = chats[0].id; state.draft = ''; state.attachments = []; state.panel = null; persist(); storage.set('kuan-design-draft', ''); render(); toast('演示数据已重置'); } else { target.dataset.confirm = 'yes'; target.innerHTML = `${icon('check')}确认重置演示数据`; refreshIcons(); } break;
  }
});
function historyReplace(url) { window.history.replaceState(null, '', url); }
document.addEventListener('submit', event => {
  if (event.target.id === 'compose-form') send(event);
  if (event.target.id === 'project-form') {
    event.preventDefault();
    const input = $('#project-input');
    if (!input?.value.trim()) return;
    projectEvents.push({ type: 'user', text: input.value.trim() }, { type: 'plan', text: '已记录新的项目任务，等待模型选择性读取并继续。' });
    input.value = '';
    render({ animate: true });
    toast('项目任务已加入演示队列');
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'message-input') { state.draft = event.target.value; storage.set('kuan-design-draft', state.draft); autoSize(event.target); }
  if (event.target.id === 'history-search') { state.search = event.target.value; $('.history-list').innerHTML = history(); refreshIcons(); }
  if (event.target.id === 'reasoning-range') updateLevel(event.target.value);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { state.panel = null; state.drawer = false; state.files = false; render(); }
  if (event.target.id === 'message-input' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send(); }
  if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, [contenteditable]')) { const el = $('[data-action="new-chat"]', $('.sidebar')); el?.click(); }
});
$('#file-input').addEventListener('change', async event => {
  for (const file of event.target.files) {
    const url = URL.createObjectURL(file); objectUrls.add(url);
    const text = /text|json|javascript|xml/.test(file.type) || /\.(md|py|js|ts|txt|json|csv)$/i.test(file.name) ? await file.slice(0, 100_000).text() : '';
    state.attachments.push({ name: file.name, type: file.type, size: file.size, url, text });
    state.selected = state.attachments.at(-1);
  }
  event.target.value = ''; refreshComposer(true);
  toast(`已添加 ${state.attachments.length} 个附件，仅保留在本机`);
});
window.addEventListener('pagehide', () => { motion?.revert(); objectUrls.forEach(url => URL.revokeObjectURL(url)); });
render({ animate: true });
