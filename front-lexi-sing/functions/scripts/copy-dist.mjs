import { cp, rm, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'front-lexi-sing');
const functions = join(root, 'functions');

const serverSrc = join(dist, 'server');
const browserSrc = join(dist, 'browser');
const serverDst = join(functions, 'server');
const browserDst = join(functions, 'browser');

await Promise.all([
  rm(serverDst, { recursive: true, force: true }),
  rm(browserDst, { recursive: true, force: true }),
]);

await mkdir(serverDst, { recursive: true });
await mkdir(browserDst, { recursive: true });

await Promise.all([
  cp(serverSrc, serverDst, { recursive: true }),
  cp(browserSrc, browserDst, { recursive: true }),
]);

console.log('SSR server + browser copiados a functions/');