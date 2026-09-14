import { cp, rm } from 'node:fs/promises';

const browser = 'dist/front-lexi-sing/browser';
await rm(`${browser}/index.html`, { force: true });
await cp(`${browser}/index.csr.html`, `${browser}/index.html`);
console.log('index.html generado desde index.csr.html');