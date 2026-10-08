/** Token swatches. Values are read from CSS variables so this page can never drift from tokens.css. */
const RAMPS: Record<string, string[]> = {
  ink: ["950", "900", "850", "800", "700", "600", "500", "400", "300", "200", "100"],
  parchment: ["100", "300", "500", "700", "900"],
  royal: ["200", "300", "400", "500", "600", "700", "800"],
  gold: ["100", "200", "300", "400", "500", "600", "700"],
  emerald: ["200", "300", "400", "500", "600", "700"],
  teal: ["200", "300", "400", "500", "700"],
  violet: ["200", "300", "400", "500", "700"],
  crimson: ["200", "300", "400", "500", "700"],
  ember: ["300", "400", "500", "700"],
};

const SEMANTIC = [
  "bg",
  "surface",
  "surface-raised",
  "border",
  "border-strong",
  "outline",
  "text",
  "text-muted",
  "primary",
  "secondary",
  "accent",
  "success",
  "danger",
  "warning",
  "info",
  "xp-fill",
];

const QUEST = ["main", "daily", "side", "boss", "hidden"];
const STATS = ["int", "foc", "vit", "soc", "cre"];

function Chip({ variable, name }: { variable: string; name: string }) {
  return (
    <div className="flex w-24 flex-col gap-1">
      <span
        className="h-10 w-full border border-border"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <span className="truncate text-caption text-text-muted">{name}</span>
    </div>
  );
}

export function SemanticSwatches() {
  return (
    <div className="flex flex-wrap gap-3">
      {SEMANTIC.map((t) => (
        <Chip key={t} variable={`--color-${t}`} name={t} />
      ))}
    </div>
  );
}

export function QuestAndStatSwatches() {
  return (
    <div className="flex flex-wrap gap-3">
      {QUEST.map((t) => (
        <Chip key={t} variable={`--color-quest-${t}`} name={`quest-${t}`} />
      ))}
      {STATS.map((t) => (
        <Chip key={t} variable={`--color-stat-${t}`} name={`stat-${t}`} />
      ))}
    </div>
  );
}

export function RampSwatches() {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(RAMPS).map(([ramp, steps]) => (
        <div key={ramp} className="flex items-center gap-3">
          <span className="w-20 text-caption text-text-muted">{ramp}</span>
          <div className="flex flex-1 flex-wrap">
            {steps.map((step) => (
              <span
                key={step}
                title={`${ramp}-${step}`}
                className="h-8 min-w-8 flex-1"
                style={{ backgroundColor: `var(--color-${ramp}-${step})` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
