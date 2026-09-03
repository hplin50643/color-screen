import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
function worker(scope, version = '1.0.0', stores = new Map()) {
  const handlers = {}, deleted = [];
  let claimed = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) { for (const req of requests) store.set(req.url, { url:req.url, release:version }); },
        async match(url) { return store.get(url); }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { deleted.push(name); return stores.delete(name); }
  };
  vm.runInNewContext(source.replace(/const VERSION = '[^']+';/, `const VERSION = ${JSON.stringify(version)};`), {
    URL, Request, caches,
    fetch: request => ({ network:true,url:request.url }),
    self: { registration:{scope}, clients:{claim:async () => { claimed = true; }}, addEventListener:(type, fn) => { handlers[type] = fn; } }
  });
  return {
    stores, deleted, get claimed() { return claimed; },
    async lifecycle(type) { let work; handlers[type]({ waitUntil:promise => { work = promise; } }); await work; },
    async fetch(url, method = 'GET') { let response; handlers.fetch({request:{url,method},respondWith:value => { response = value; }}); return response; }
  };
}

test('every precached asset exists and manifest/icon paths are portable', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './'); assert.equal(manifest.id, './');
  assert.equal(manifest.background_color, '#000000'); assert.equal(manifest.theme_color, '#000000');
  for (const icon of manifest.icons) {
    const data = await readFile(new URL('../' + icon.src, import.meta.url));
    const [width,height] = icon.sizes.split('x').map(Number);
    assert.equal(data.readUInt32BE(16), width); assert.equal(data.readUInt32BE(20), height);
  }
  const h = worker('https://example.github.io/repository/'); await h.lifecycle('install');
  for (const store of h.stores.values()) for (const url of store.keys()) {
    const relative = new URL(url).pathname.replace('/repository/', '') || 'index.html';
    assert.ok((await stat(new URL('../' + relative, import.meta.url))).isFile(), relative);
  }
});
test('cached shell works offline at root and project subpaths, including query strings', async () => {
  for (const scope of ['https://example.github.io/', 'https://example.github.io/repository/']) {
    const h = worker(scope); await h.lifecycle('install'); await h.lifecycle('activate');
    for (const relative of ['', 'index.html', 'styles.css', 'app.js', 'color.js', 'display.js', 'manifest.webmanifest']) {
      const response = await h.fetch(scope + relative + '?test=1'); assert.equal(response.release, '1.0.0');
    }
    assert.equal(h.claimed, true);
  }
});
test('requests outside scope, foreign origins, unknown files and non-GET are untouched', async () => {
  const h = worker('https://example.github.io/app/'); await h.lifecycle('install');
  for (const url of ['https://example.github.io/other/app.js','https://example.github.io/application/app.js','https://other.test/app/app.js','https://example.github.io/app/unknown']) assert.equal(await h.fetch(url), undefined);
  assert.equal(await h.fetch('https://example.github.io/app/app.js','POST'), undefined);
});
test('waiting release never replaces old client cache; activation removes only same-scope old versions', async () => {
  const stores = new Map([['another-application-cache',new Map()]]);
  const old = worker('https://example.github.io/app/', '1.0.0', stores); await old.lifecycle('install');
  const other = worker('https://example.github.io/another/', '1.0.0', stores); await other.lifecycle('install');
  const next = worker('https://example.github.io/app/', '1.0.1', stores); await next.lifecycle('install');
  assert.equal((await old.fetch('https://example.github.io/app/app.js')).release, '1.0.0');
  assert.equal(next.deleted.length, 0);
  await next.lifecycle('activate'); assert.equal(next.deleted.length, 1);
  assert.equal((await next.fetch('https://example.github.io/app/app.js')).release, '1.0.1');
  assert.equal((await other.fetch('https://example.github.io/another/app.js')).release, '1.0.0');
  assert.ok(stores.has('another-application-cache'));
  assert.equal(source.includes('skipWaiting('), false);
});
