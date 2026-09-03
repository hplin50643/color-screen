import { clamp, parseHex, parseChannel, rgbToHex, rgbToHsv, hsvToRgb, contrastingInk, hsvRangeColors } from './color.js';
import { DisplayController } from './display.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const editor = $('editor'), stage = $('colorStage'), hexInput = $('hexInput');
const numberInputs = [...document.querySelectorAll('[data-number]')];
const channelRanges = [...document.querySelectorAll('[data-channel]')];
const presets = [...document.querySelectorAll('[data-hex]')];
let rgb = { r: 0, g: 0, b: 0 }, hsv = { h: 0, s: 0, v: 0 };

function render(source = null) {
  const hex = rgbToHex(rgb);
  root.style.setProperty('--selected-color', hex);
  root.style.setProperty('--canvas-ink', contrastingInk(rgb));
  root.style.setProperty('--hue', hsv.h);
  $('largeHex').textContent = hex;
  $('largeRgb').textContent = `RGB ${rgb.r} / ${rgb.g} / ${rgb.b}`;
  stage.setAttribute('aria-label', `純色顯示 ${hex}。點一下畫面或按 Escape 返回調色盤。`);
  if (source !== hexInput) hexInput.value = hex;
  $('hexError').hidden = true;
  hexInput.setAttribute('aria-invalid', 'false');
  for (const input of numberInputs) {
    if (source !== input) input.value = rgb[input.dataset.number];
    input.setAttribute('aria-invalid', 'false');
  }
  $('rgbError').hidden = true;
  for (const input of channelRanges) input.value = rgb[input.dataset.channel];
  $('hue').value = hsv.h;
  $('hueValue').textContent = `${Math.round(hsv.h)}°`;
  $('saturation').value = hsv.s * 100;
  $('saturationValue').textContent = `${Math.round(hsv.s * 100)}%`;
  $('brightness').value = hsv.v * 100;
  $('brightnessValue').textContent = `${Math.round(hsv.v * 100)}%`;
  $('svThumb').style.left = `${hsv.s * 100}%`;
  $('svThumb').style.top = `${(1 - hsv.v) * 100}%`;
  const tracks = hsvRangeColors(hsv);
  $('saturation').style.setProperty('--track', `linear-gradient(to right, ${tracks.saturation.join(', ')})`);
  $('brightness').style.setProperty('--track', `linear-gradient(to right, ${tracks.brightness.join(', ')})`);
  $('red').style.setProperty('--track', `linear-gradient(to right, rgb(0 ${rgb.g} ${rgb.b}), rgb(255 ${rgb.g} ${rgb.b}))`);
  $('green').style.setProperty('--track', `linear-gradient(to right, rgb(${rgb.r} 0 ${rgb.b}), rgb(${rgb.r} 255 ${rgb.b}))`);
  $('blue').style.setProperty('--track', `linear-gradient(to right, rgb(${rgb.r} ${rgb.g} 0), rgb(${rgb.r} ${rgb.g} 255))`);
  for (const button of presets) button.setAttribute('aria-pressed', String(button.dataset.hex === hex));
}

function setRgb(next, source = null) {
  rgb = next;
  hsv = rgbToHsv(rgb, hsv);
  render(source);
}

function setHsv(next) {
  hsv = next;
  rgb = hsvToRgb(hsv);
  render();
}

hexInput.addEventListener('input', () => {
  const parsed = parseHex(hexInput.value);
  if (parsed) setRgb(parsed, hexInput);
  else { hexInput.setAttribute('aria-invalid', 'true'); $('hexError').hidden = false; }
});
hexInput.addEventListener('blur', () => { if (parseHex(hexInput.value)) hexInput.value = rgbToHex(rgb); });
hexInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && parseHex(hexInput.value)) hexInput.value = rgbToHex(rgb);
});
for (const input of numberInputs) {
  input.addEventListener('input', () => {
    const parsed = parseChannel(input.value);
    if (parsed !== null) setRgb({ ...rgb, [input.dataset.number]: parsed }, input);
    else { input.setAttribute('aria-invalid', 'true'); $('rgbError').hidden = false; }
  });
  input.addEventListener('blur', () => { if (parseChannel(input.value) !== null) input.value = rgb[input.dataset.number]; });
}
for (const input of channelRanges) input.addEventListener('input', () => setRgb({ ...rgb, [input.dataset.channel]: Number(input.value) }));
for (const button of presets) button.addEventListener('click', () => setRgb(parseHex(button.dataset.hex)));
$('hue').addEventListener('input', event => setHsv({ ...hsv, h: Number(event.target.value) }));
$('saturation').addEventListener('input', event => setHsv({ ...hsv, s: Number(event.target.value) / 100 }));
$('brightness').addEventListener('input', event => setHsv({ ...hsv, v: Number(event.target.value) / 100 }));

const picker = $('svPicker');
let activePointer = null;
function pick(event) {
  const box = picker.getBoundingClientRect();
  if (!box.width || !box.height) return;
  setHsv({ ...hsv, s: clamp((event.clientX - box.left) / box.width, 0, 1), v: clamp(1 - (event.clientY - box.top) / box.height, 0, 1) });
}
picker.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || activePointer !== null) return;
  event.preventDefault();
  activePointer = event.pointerId;
  picker.setPointerCapture(activePointer);
  pick(event);
});
picker.addEventListener('pointermove', event => { if (event.pointerId === activePointer) pick(event); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) picker.addEventListener(type, event => {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  if (picker.hasPointerCapture(event.pointerId)) picker.releasePointerCapture(event.pointerId);
});

const display = new DisplayController({
  requestFullscreen: () => document.fullscreenEnabled && root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : undefined,
  exitFullscreen: () => document.exitFullscreen?.(),
  isFullscreen: () => document.fullscreenElement === root,
  onChange(active) {
    root.classList.toggle('is-displaying', active);
    editor.hidden = active;
    editor.inert = active;
    stage.setAttribute('aria-hidden', String(!active));
    if (active) stage.focus({ preventScroll: true });
    else $('displayButton').focus({ preventScroll: true });
  }
});
$('displayButton').addEventListener('click', () => display.enter());
stage.addEventListener('click', () => display.leave());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && display.displaying) { event.preventDefault(); display.leave(); }
});
document.addEventListener('fullscreenchange', () => display.fullscreenChanged());
if (!document.fullscreenEnabled) $('displayHelp').textContent = '此瀏覽器使用純色網頁模式；點一下畫面或按 Esc 返回。';

let installPrompt = null;
const installButton = $('installButton');
const standalone = matchMedia('(display-mode: standalone)');
function updateInstalled() { installButton.hidden = standalone.matches || navigator.standalone === true; }
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; installButton.hidden = false;
});
window.addEventListener('appinstalled', () => { installPrompt = null; installButton.hidden = true; });
standalone.addEventListener('change', updateInstalled);
installButton.addEventListener('click', async () => {
  if (!installPrompt) { $('installDialog').showModal(); return; }
  const prompt = installPrompt; installPrompt = null;
  try { await prompt.prompt(); await prompt.userChoice; }
  catch { $('installDialog').showModal(); }
});
updateInstalled();

function offlineStatus(message, ready = false) {
  $('offlineStatus').textContent = message;
  $('offlineStatus').classList.toggle('ready', ready);
}
async function prepareOffline() {
  if (!['https:', 'http:'].includes(location.protocol) || !window.isSecureContext || !('serviceWorker' in navigator)) {
    offlineStatus('離線功能需 HTTPS 或 localhost'); return;
  }
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    let ready = Boolean(registration.active);
    const report = () => offlineStatus(registration.waiting ? '新版已備妥，關閉分頁後啟用' : ready ? '已可離線使用' : '正在準備離線使用', ready);
    function watch(worker) {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') ready = true;
        if (worker.state === 'redundant' && !ready) offlineStatus('離線準備失敗，連線後請重新整理');
        else report();
      });
    }
    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing));
    navigator.serviceWorker.ready.then(() => { ready = true; report(); });
    report();
  } catch { offlineStatus('離線功能不可用，仍可正常調色'); }
}
render();
prepareOffline();

// Optional page-scoped WebMCP; no dependency and no effect in other browsers.
const context = document.modelContext;
if (typeof context?.registerTool === 'function') {
  const lifecycle = new AbortController();
  const readColor = () => ({ hex: rgbToHex(rgb), rgb: { ...rgb }, displaying: display.displaying });
  const tools = [
    {
      name: 'get_color', title: '讀取目前顏色', description: 'Read the currently displayed sRGB color without changing it.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: readColor
    },
    {
      name: 'set_color', title: '設定顏色', description: 'Set the displayed opaque sRGB color and synchronize all picker controls. Does not enter fullscreen.',
      inputSchema: { type: 'object', properties: { hex: { type: 'string', description: 'Three or six hexadecimal digits, with optional #.' } }, required: ['hex'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => key !== 'hex')) throw new Error('Expected { hex: string }.');
        const color = parseHex(input.hex);
        if (!color) throw new Error('Invalid HEX color. Expected three or six hexadecimal digits.');
        setRgb(color);
        return readColor();
      }
    }
  ];
  for (const tool of tools) {
    try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); }
    catch { /* An optional integration must never block the visible picker. */ }
  }
  window.addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); });
}
