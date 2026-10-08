/**
 * The link-preview image (`src/app/opengraph-image.png`), rendered once by `pnpm art:build`
 * instead of on request: a static file keeps the image renderer (resvg/yoga, ~1.5 MB) out of
 * the server bundle, which is what lets the app fit a Cloudflare Workers free-plan worker
 * (docs/DEPLOY.md §6). Nothing in it changes per request.
 *
 * The background is the 6× pixel scene, so no resampling happens. Galmuri text uses multiples
 * of its 12px design size (72 / 36) to stay crisp; the font is subset to these glyphs — update
 * it if the copy changes (PIXEL_RULES §8). Colors are LIFE-32 literals (gold-400, ink-100,
 * ink-200): ImageResponse cannot read CSS variables.
 */
import { ImageResponse } from "next/og";

export const OG_ALT = "LIFE RPG — 오늘의 할 일이 퀘스트가 된다";
export const OG_SIZE = { width: 1200, height: 630 } as const;

export async function renderOgImage(scenePng: Buffer, font: Buffer): Promise<Buffer> {
  const response = new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
      {/* Satori renders plain <img>; next/image does not exist here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${scenePng.toString("base64")}`}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        alt=""
      />
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
    {
      ...OG_SIZE,
      fonts: [
        { name: "Galmuri11", data: new Uint8Array(font).buffer, style: "normal", weight: 400 },
      ],
    },
  );
  return Buffer.from(await response.arrayBuffer());
}
