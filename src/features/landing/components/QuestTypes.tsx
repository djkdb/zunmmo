import { QUEST_TYPE_META } from "@/components/game/quest-meta";
import { QuestTypeTag } from "@/components/game/QuestTypeTag";
import { PixelFrame } from "@/components/pixel/PixelFrame";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { QuestType } from "@/lib/game";

const ENTRIES: ReadonlyArray<{ type: QuestType; description: string; example: string }> = [
  {
    type: "main",
    description: "오래 붙잡고 갈 핵심 목표. 단계별로 나눠 진행률을 채워요.",
    example: "나만의 웹서비스 출시하기",
  },
  {
    type: "daily",
    description: "매일 쌓아 가는 습관. 연속 기록이 보너스가 돼요.",
    example: "운동 30분",
  },
  { type: "side", description: "취미와 여가도 당당한 퀘스트예요.", example: "토요일 축구하기" },
  {
    type: "boss",
    description: "시험·마감처럼 큰 도전. 처치하면 보상이 2.5배!",
    example: "AI 중간고사",
  },
];

/** The quest board: one wood frame holding parchment notes — not another card grid. */
export function QuestTypes() {
  return (
    <section aria-labelledby="quest-types-title" className="bg-bg-subtle">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <p className="font-pixel text-pixel text-text-muted">QUEST BOARD</p>
          <h2 id="quest-types-title" className="text-h1">
            모든 일에는 어울리는 퀘스트가 있어요
          </h2>
        </header>
        <PixelFrame variant="wood" className="p-4 sm:p-6">
          <ul className="grid gap-5 sm:grid-cols-2">
            {ENTRIES.map(({ type, description, example }) => (
              <li key={type}>
                <PixelFrame variant="parchment" flat className="flex h-full gap-3 p-4">
                  <PixelIcon name={QUEST_TYPE_META[type].icon} />
                  <div className="flex flex-col items-start gap-2">
                    <QuestTypeTag type={type} />
                    <p className="text-small">{description}</p>
                    <p className="text-caption text-parchment-900">예: {example}</p>
                  </div>
                </PixelFrame>
              </li>
            ))}
          </ul>
        </PixelFrame>
      </div>
    </section>
  );
}
