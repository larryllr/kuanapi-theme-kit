import { createRequire } from 'node:module';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const local = createRequire(import.meta.url);
const { build } = local('esbuild');
await mkdir(path.join(root, 'dist'), { recursive: true });
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/app.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['chrome110', 'safari16'],
  outfile: path.join(root, 'dist/app.js'),
});
await cp(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true });
console.log('DESIGN_LAB_BUILD_OK');
