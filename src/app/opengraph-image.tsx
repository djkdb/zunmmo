import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "LIFE RPG — 오늘의 할 일이 퀘스트가 된다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OG_DIR = join(process.cwd(), "src/app/_og");

/**
 * Background is pre-rendered at exactly 6× by `pnpm art:build`, so no resampling happens.
 * Galmuri text uses multiples of its 12px design size (72 / 36) to stay crisp.
 * The font file is subset to the glyphs below — update it if the copy changes (PIXEL_RULES §8).
 * Colors are LIFE-32 literals (gold-400, ink-100, ink-200): ImageResponse cannot read CSS variables.
 */
async function loadAssets() {
  "use cache";
  const [scene, font] = await Promise.all([
    readFile(join(OG_DIR, "og-scene.png"), "base64"),
    readFile(join(OG_DIR, "Galmuri11.og.ttf")),
  ]);
  return { scene, font: new Uint8Array(font) };
}

export default async function OpenGraphImage() {
  const { scene, font } = await loadAssets();

  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
      <img src={`data:image/png;base64,${scene}`} width={1200} height={630} alt="" />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 120,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          fontFamily: "Galmuri11",
        }}
      >
        <span style={{ fontSize: 36, color: "#f7b733" }}>현실 플레이 RPG</span>
        <span style={{ fontSize: 72, color: "#eeeaf8" }}>LIFE RPG</span>
        <span style={{ fontSize: 36, color: "#cfc8e6" }}>오늘의 할 일이</span>
        <span style={{ fontSize: 36, color: "#cfc8e6" }}>퀘스트가 된다</span>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Galmuri11", data: font.buffer, style: "normal", weight: 400 }] },
  );
}
