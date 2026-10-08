/**
 * Visual QA gate for shipped pixel art (PIXEL_RULES §5):
 *   - every opaque pixel is a LIFE-32 color
 *   - alpha is exactly 0 or 255 (no semi-transparent pixels)
 *
 *   pnpm art:check
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { PALETTE_KEYS, decodePng } from "./lib";

const ROOT = join(import.meta.dirname, "..", "..");
const TARGETS = ["public/sprites", "public/icons", "src/app/icon.png", "src/app/_og"];

function* pngFiles(path: string): Generator<string> {
  const stat = statSync(path, { throwIfNoEntry: false });
  if (!stat) return;
  if (stat.isFile()) {
    if (path.endsWith(".png")) yield path;
    return;
  }
  for (const entry of readdirSync(path)) yield* pngFiles(join(path, entry));
}

export function checkPng(buffer: Buffer): string[] {
  const png = decodePng(buffer);
  const problems: string[] = [];
  for (let i = 0; i < png.data.length; i += 4) {
    const alpha = png.data[i + 3]!;
    if (alpha === 0) continue;
    const px = (i / 4) % png.width;
    const py = Math.floor(i / 4 / png.width);
    if (alpha !== 255) problems.push(`semi-transparent pixel (alpha ${alpha}) at (${px}, ${py})`);
    const key = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`;
    if (!PALETTE_KEYS.has(key)) problems.push(`off-palette color rgb(${key}) at (${px}, ${py})`);
    if (problems.length > 10) break;
  }
  return problems;
}

if (import.meta.filename === process.argv[1]) {
  let failures = 0;
  let checked = 0;
  for (const target of TARGETS) {
    for (const file of pngFiles(join(ROOT, target))) {
      checked++;
      const problems = checkPng(readFileSync(file));
      if (problems.length) {
        failures++;
        console.error(`✗ ${relative(ROOT, file)}\n    ${problems.join("\n    ")}`);
      }
    }
  }
  console.log(`${checked} PNG(s) checked, ${failures} failing.`);
  process.exit(failures ? 1 : 0);
}
