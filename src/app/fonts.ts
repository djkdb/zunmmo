import localFont from "next/font/local";

/**
 * Galmuri11 — Korean pixel font (OFL). Subset to KS X 1001 Hangul (2,350) + Latin + symbols.
 * Designed on a 12px grid, so it is only used at 12 / 24 / 36px (`text-pixel*` tokens).
 * Glyphs outside the subset fall back to Pretendard.
 */
export const galmuri = localFont({
  src: "../styles/fonts/galmuri/Galmuri11.subset.woff2",
  variable: "--font-galmuri",
  display: "swap",
  adjustFontFallback: false,
});
