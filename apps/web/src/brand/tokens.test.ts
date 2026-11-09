import { textOnAccent, textOnButton, textOnSurface } from "./tokens";

function channel(hex: string, start: number): number {
  const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: string, background: string): number {
  const luminance = (hex: string) =>
    0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("brand contrast", () => {
  it("keeps text on the surface and on the button at 4.5 or more", () => {
    expect(contrast(textOnSurface.fg, textOnSurface.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(textOnButton.fg, textOnButton.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("does not use the accent as a text color", () => {
    expect(contrast(textOnAccent.fg, textOnAccent.bg)).toBeLessThan(4.5);
  });
});
