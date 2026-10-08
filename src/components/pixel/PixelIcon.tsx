import type { CSSProperties } from "react";

import { cn } from "@/lib/utils/cn";

import type { PixelScale } from "./scale";
import { GLYPH_ATLAS, type GlyphName, ICON_ATLAS, type IconName } from "./icons.generated";

export type { PixelScale } from "./scale";

type Atlas = typeof ICON_ATLAS | typeof GLYPH_ATLAS;

interface AtlasSpriteProps {
  /** Accessible name. Omit for decorative icons (they are hidden from assistive tech). */
  label?: string;
  /** Integer scale only (PIXEL_RULES §1.2). UI icons default to 2×. */
  scale?: PixelScale;
  className?: string;
}

function atlasStyle(atlas: Atlas, index: number, scale: number): CSSProperties {
  const { size, columns, sheetSize, src } = atlas;
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    width: size * scale,
    height: size * scale,
    backgroundImage: `url(${src})`,
    backgroundSize: `${sheetSize.w * scale}px ${sheetSize.h * scale}px`,
    backgroundPosition: `-${col * size * scale}px -${row * size * scale}px`,
    backgroundRepeat: "no-repeat",
  };
}

function AtlasSprite({
  atlas,
  index,
  label,
  scale = 2,
  className,
}: AtlasSpriteProps & { atlas: Atlas; index: number }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("pixel-art inline-block shrink-0", className)}
      style={atlasStyle(atlas, index, scale)}
    />
  );
}

/** 16×16 icon from the generated atlas (`pnpm art:build`). */
export function PixelIcon({ name, ...props }: AtlasSpriteProps & { name: IconName }) {
  return <AtlasSprite atlas={ICON_ATLAS} index={ICON_ATLAS.names.indexOf(name)} {...props} />;
}

/** 8×8 inline glyph (stars, etc.). */
export function PixelGlyph({ name, ...props }: AtlasSpriteProps & { name: GlyphName }) {
  return <AtlasSprite atlas={GLYPH_ATLAS} index={GLYPH_ATLAS.names.indexOf(name)} {...props} />;
}
