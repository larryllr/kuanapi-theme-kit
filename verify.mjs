import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = process.env.THEME_KIT_PORT || '5195';
const origin = `http://127.0.0.1:${port}/`;
let server;
try {
  await fetch(origin);
} catch {
  server = spawn(process.execPath, ['serve.mjs'], { cwd: root, env: { ...process.env, PORT: port }, stdio: 'inherit' });
  await new Promise(resolve => setTimeout(resolve, 500));
}
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const session = `theme-kit-${Date.now()}`;
const run = args => spawnSync(npx, ['--yes', '--package', '@playwright/cli', 'playwright-cli', `-s=${session}`, ...args], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
let exit = 0;
try {
  exit = run(['open', origin]).status || 0;
  if (!exit) exit = run(['run-code', '--filename', 'verify-theme-kit.js']).status || 0;
} finally {
  run(['close']);
  server?.kill();
}
process.exit(exit);
