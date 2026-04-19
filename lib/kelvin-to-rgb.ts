export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Approximate RGB values for a color temperature in Kelvin.
 * Neil Bartlett approximation (http://www.zombieprototypes.com/?p=210).
 * Input range: 1000K – 40000K. Output channels clamped to [0, 255].
 */
export function kelvinToRGB(kelvin: number): RGB {
  const k = kelvin / 100;
  let r: number, g: number, b: number;

  if (k < 66) {
    r = 255;
  } else {
    r = 351.97690566805693 + 0.114206453784165 * (k - 55) - 40.25366309332127 * Math.log(k - 55);
  }

  if (k < 66) {
    g = -155.25485562709179 - 0.44596950469579133 * (k - 2) + 104.49216199393888 * Math.log(k - 2);
  } else {
    g = 325.4494125711974 + 0.07943456536662342 * (k - 50) - 28.0852963507957 * Math.log(k - 50);
  }

  if (k >= 66) {
    b = 255;
  } else if (k <= 19) {
    b = 0;
  } else {
    b = -254.76935184120902 + 0.8274096064007395 * (k - 10) + 115.67994401066147 * Math.log(k - 10);
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r))),
    g: Math.max(0, Math.min(255, Math.round(g))),
    b: Math.max(0, Math.min(255, Math.round(b))),
  };
}
