// tailwind.css deve corrispondere alle classi usate oggi in index.html, script.js e
// catalog-data.js: lo rigenera in una cartella temporanea e lo confronta con quello committato.
// Se fallisce: npm run build:css e committa tailwind.css. (Serve rete la prima volta, per npx.)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './testsrv.mjs';

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'magix-css-')), 'tailwind.css');
execFileSync('npx', ['-y', 'tailwindcss@3.4.17', '-c', 'tailwind.config.js', '-i', 'tailwind.src.css', '-o', tmp, '--minify'], { cwd: ROOT, stdio: 'pipe', shell: process.platform === 'win32' });
const norm = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').trim();
const ok = norm(tmp) === norm(path.join(ROOT, 'tailwind.css'));
console.log(ok ? '  ✔ tailwind.css aggiornato' : '  ✘ tailwind.css NON aggiornato: esegui npm run build:css e committalo');
console.log(`\n${ok ? 1 : 0} ok, ${ok ? 0 : 1} falliti`);
process.exit(ok ? 0 : 1);
