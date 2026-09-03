import test from 'node:test';
import assert from 'node:assert/strict';
import { DisplayController } from '../display.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness(request) {
  let native = false, exits = 0;
  const changes = [];
  const controller = new DisplayController({
    requestFullscreen: request,
    exitFullscreen: () => { native = false; exits++; },
    isFullscreen: () => native,
    onChange: value => changes.push(value)
  });
  return { controller, changes, setNative: value => { native = value; }, get exits() { return exits; } };
}
test('unsupported, synchronous rejection and asynchronous rejection retain pure display', async () => {
  for (const request of [undefined, () => { throw new Error('Denied'); }, () => Promise.reject(new Error('Denied'))]) {
    const h = harness(request); h.controller.enter(); await tick();
    assert.equal(h.controller.displaying, true); assert.deepEqual(h.changes, [true]);
    h.controller.leave(); assert.deepEqual(h.changes, [true,false]);
  }
});
test('browser-native exit restores the interface exactly once', async () => {
  const h = harness(() => { h.setNative(true); });
  h.controller.enter(); h.controller.fullscreenChanged(); await tick();
  h.setNative(false); h.controller.fullscreenChanged(); h.controller.fullscreenChanged(); h.controller.leave();
  assert.deepEqual(h.changes, [true,false]);
});
test('click exit handles a late fullscreen success without rehiding the editor', async () => {
  let resolve;
  const h = harness(() => new Promise(done => { resolve = done; }));
  h.controller.enter(); h.controller.leave(); h.setNative(true); resolve(); await tick();
  assert.deepEqual(h.changes, [true,false]); assert.equal(h.exits, 1); assert.equal(h.controller.displaying, false);
});
test('late native event after exit is safely dismissed', async () => {
  const h = harness(() => Promise.resolve());
  h.controller.enter(); h.controller.leave(); h.setNative(true); h.controller.fullscreenChanged(); await tick();
  assert.equal(h.exits, 1); assert.deepEqual(h.changes, [true,false]);
});
test('duplicate entry, re-entry, and old late success preserve the newest user intent', async () => {
  const resolves = [];
  const h = harness(() => new Promise(done => resolves.push(done)));
  h.controller.enter(); h.controller.enter(); assert.equal(resolves.length, 1);
  h.controller.leave(); h.controller.enter(); h.setNative(true);
  resolves[0](); resolves[1](); await tick();
  assert.equal(h.controller.displaying, true); assert.equal(h.exits, 0); assert.deepEqual(h.changes, [true,false,true]);
});
test('failed fullscreen exit still leaves accessible viewport controls', async () => {
  const h = harness(() => { h.setNative(true); });
  h.controller.exitFullscreen = () => Promise.reject(new Error('Already exited'));
  h.controller.enter(); await tick(); h.controller.leave(); await tick();
  assert.equal(h.controller.displaying, false); assert.equal(h.controller.exiting, false);
});

test('a pending old exit cannot close a newly entered viewport session', async () => {
  let finishExit;
  const h = harness(() => { h.setNative(true); });
  h.controller.exitFullscreen = () => new Promise(resolve => { finishExit = () => { h.setNative(false); resolve(); }; });
  h.controller.enter(); h.controller.fullscreenChanged(); await tick();
  h.controller.leave(); h.controller.enter();
  assert.equal(h.controller.nativeEntered, false);
  finishExit(); h.controller.fullscreenChanged(); await tick(); h.controller.fullscreenChanged();
  assert.equal(h.controller.displaying, true);
  assert.deepEqual(h.changes, [true,false,true]);
});
