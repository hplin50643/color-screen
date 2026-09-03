import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHex, parseChannel, rgbToHex, rgbToHsv, hsvToRgb, contrastingInk, clamp, hsvRangeColors } from '../color.js';

test('HEX accepts shorthand, optional #, case and surrounding whitespace', () => {
  for (const text of ['#abc', 'ABC', ' #aAbBcC ']) assert.equal(rgbToHex(parseHex(text)), '#AABBCC');
  for (const text of ['', '#12', '#12345', '#GG0000', '#1234567', '#a bc', 'rgba(0,0,0,1)', null, 123]) assert.equal(parseHex(text), null);
});
test('RGB validates whole input and never treats an empty draft as zero', () => {
  for (const text of ['0', '255', ' 128 ', '001']) assert.equal(parseChannel(text), Number(text));
  for (const text of ['', ' ', '256', '-1', '1.2', '12x', '1e2', 'NaN', 'Infinity', null]) assert.equal(parseChannel(text), null);
});
test('canonical colors round trip exactly', () => {
  for (const hex of ['#000000','#FFFFFF','#808080','#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF','#123456']) {
    const rgb = parseHex(hex);
    assert.equal(rgbToHex(hsvToRgb(rgbToHsv(rgb))), hex);
  }
});
test('RGB conversion round trips across a grid without drift', () => {
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
    const rgb = { r, g, b };
    assert.deepEqual(hsvToRgb(rgbToHsv(rgb)), rgb);
  }
});
test('black retains hue and saturation, nonblack gray retains hue only', () => {
  const black = rgbToHsv({ r:0,g:0,b:0 }, { h:120,s:1 });
  assert.deepEqual(black, { h:120,s:1,v:0 });
  assert.equal(rgbToHex(hsvToRgb({ ...black, v:1 })), '#00FF00');
  const gray = rgbToHsv({ r:128,g:128,b:128 }, { h:240,s:1 });
  assert.equal(gray.h, 240); assert.equal(gray.s, 0);
  assert.equal(rgbToHex(hsvToRgb({ ...gray, s:1 })), '#000080');
});
test('SV corners, hue wrap, bounds and contrasting labels', () => {
  assert.equal(rgbToHex(hsvToRgb({h:120,s:0,v:1})), '#FFFFFF');
  assert.equal(rgbToHex(hsvToRgb({h:120,s:1,v:1})), '#00FF00');
  for (const s of [0,1]) assert.equal(rgbToHex(hsvToRgb({h:120,s,v:0})), '#000000');
  for (const h of [0,360,720,-360]) assert.equal(rgbToHex(hsvToRgb({h,s:1,v:1})), '#FF0000');
  assert.equal(clamp(-5,0,1), 0); assert.equal(clamp(4,0,1), 1);
  assert.equal(contrastingInk(parseHex('#000000')), '#FFFFFF');
  assert.equal(contrastingInk(parseHex('#FFFFFF')), '#000000');
});

test('HSV range gradients show actual endpoint colors, including gray and black', () => {
  assert.deepEqual(hsvRangeColors({ h:120,s:1,v:0 }).saturation, ['#000000','#000000']);
  assert.deepEqual(hsvRangeColors({ h:240,s:0,v:.5 }).brightness, ['#000000','#FFFFFF']);
  assert.deepEqual(hsvRangeColors({ h:0,s:.5,v:.5 }), { saturation:['#808080','#800000'],brightness:['#000000','#FF8080'] });
});
