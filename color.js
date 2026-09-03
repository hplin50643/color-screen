// All displayed colors are opaque, 8-bit sRGB. HSV retains editing intent at black.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function parseHex(input) {
  if (typeof input !== 'string') return null;
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? [...match[1]].map(c => c + c).join('') : match[1];
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

export function parseChannel(input) {
  if (typeof input !== 'string' || !/^\d{1,3}$/.test(input.trim())) return null;
  const value = Number(input.trim());
  return value <= 255 ? value : null;
}

export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(c => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsv({ r, g, b }, previous = { h: 0, s: 0 }) {
  const [red, green, blue] = [r, g, b].map(c => c / 255);
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
  let hue = previous.h;
  if (delta > 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { h: hue, s: max === 0 ? previous.s : delta / max, v: max };
}

export function hsvToRgb({ h, s, v }) {
  const hue = ((h % 360) + 360) % 360 / 60;
  const saturation = clamp(s, 0, 1), value = clamp(v, 0, 1);
  const chroma = value * saturation, x = chroma * (1 - Math.abs(hue % 2 - 1)), m = value - chroma;
  const sectors = [[chroma,x,0],[x,chroma,0],[0,chroma,x],[0,x,chroma],[x,0,chroma],[chroma,0,x]];
  const [r, g, b] = sectors[Math.floor(hue)].map(c => Math.round((c + m) * 255));
  return { r, g, b };
}

export function contrastingInk({ r, g, b }) {
  const [red, green, blue] = [r,g,b].map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return .2126 * red + .7152 * green + .0722 * blue > .179 ? '#000000' : '#FFFFFF';
}

export function hsvRangeColors(hsv) {
  const hex = values => rgbToHex(hsvToRgb(values));
  return {
    saturation: [hex({ ...hsv, s: 0 }), hex({ ...hsv, s: 1 })],
    brightness: [hex({ ...hsv, v: 0 }), hex({ ...hsv, v: 1 })]
  };
}
