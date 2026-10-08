// Avvia il VERO server.js per i test, con @vercel/blob simulato in memoria.
// Stessa interfaccia del vecchio harness (start, BLOBS, blobCtl): le suite non cambiano.
// I blob "pubblici" sono serviti da un secondo server locale, come farebbe lo store.
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── mock @vercel/blob ──
export const BLOBS = new Map(); // pathname -> { url, pathname, uploadedAt, body }
export const blobCtl = { fail: false, port: 0, ops: [] };
let lastTs = 0;
const rnd = (n) => crypto.randomBytes(n * 2).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, n);
const blobMock = {
  async put(pathname, body, opts = {}) {
    blobCtl.ops.push('put ' + pathname);
    if (blobCtl.fail) throw new Error('blob down (mock)');
    let p = pathname;
    if (opts.addRandomSuffix) { const i = p.lastIndexOf('.'); p = p.slice(0, i) + '-' + rnd(30) + p.slice(i); }
    lastTs = Math.max(Date.now(), lastTs + 1);
    const url = `http://localhost:${blobCtl.port}/${p}`;
    BLOBS.set(p, { url, pathname: p, uploadedAt: new Date(lastTs), body: String(body) });
    return { url, pathname: p };
  },
  async list({ prefix = '', limit } = {}) {
    blobCtl.ops.push('list ' + prefix);
    if (blobCtl.fail) throw new Error('blob down (mock)');
    let blobs = [...BLOBS.values()].filter((b) => b.pathname.startsWith(prefix)).sort((a, b) => a.pathname.localeCompare(b.pathname));
    if (limit) blobs = blobs.slice(0, limit);
    return { blobs: blobs.map(({ url, pathname, uploadedAt }) => ({ url, pathname, uploadedAt, size: 1 })), hasMore: false };
  },
  async del(urls) {
    blobCtl.ops.push('del');
    if (blobCtl.fail) throw new Error('blob down (mock)');
    for (const u of [].concat(urls)) for (const [k, v] of BLOBS) if (v.url === u) BLOBS.delete(k);
  },
};
const clientMock = {
  async handleUpload({ body, onBeforeGenerateToken }) {
    const b = typeof body === 'string' ? JSON.parse(body) : body;
    if (b && b.type === 'blob.generate-client-token') {
      await onBeforeGenerateToken(b.payload && b.payload.pathname);
      return { type: 'blob.generate-client-token', clientToken: 'fake-client-token' };
    }
    throw new Error('richiesta upload non valida');
  },
};
const FAKE = { '@vercel/blob': path.join(ROOT, '__mock__', 'vercel-blob.js'), '@vercel/blob/client': path.join(ROOT, '__mock__', 'vercel-blob-client.js') };
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) { return FAKE[request] || origResolve.call(this, request, ...rest); };
for (const [k, exp] of [[FAKE['@vercel/blob'], blobMock], [FAKE['@vercel/blob/client'], clientMock]]) {
  const m = new Module(k); m.filename = k; m.loaded = true; m.exports = exp; Module._cache[k] = m;
}

// start(root, port): root ignorato (si testa sempre questo repo), tenuto per compatibilità
export async function start(_root, port) {
  const blobSrv = http.createServer((req, res) => {
    const b = BLOBS.get(decodeURIComponent(new URL(req.url, 'http://x').pathname.slice(1)));
    if (!b) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(b.body);
  });
  await new Promise((r) => blobSrv.listen(port + 1, r));
  blobCtl.port = port + 1;
  const server = createRequire(import.meta.url)('../server.js');
  await new Promise((r) => server.listen(port, r));
  const close = server.close.bind(server);
  server.close = (cb) => { blobSrv.close(); return close(cb); };
  return server;
}
