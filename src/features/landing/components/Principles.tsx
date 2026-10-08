import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { IconName } from "@/components/pixel/icons.generated";

const PRINCIPLES: ReadonlyArray<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "stat-vit",
    title: "평가가 아니라 성장 기록",
    body: "못 한 날에 XP를 빼앗지 않아요. 쉬어 가는 것도 모험의 일부예요.",
  },
  {
    icon: "quest-boss",
    title: "마감은 보스로, 습관은 데일리로",
    body: "시험과 마감은 큰 보상의 보스 퀘스트, 매일의 습관은 연속 기록이 쌓이는 데일리로.",
  },
  {
    icon: "ui-check",
    title: "한 손으로 두 번 탭",
    body: "앱을 열고 완료 버튼을 누르면 끝. 이동 중에도 바로 기록할 수 있어요.",
  },
];

export function Principles() {
  return (
    <section
      aria-labelledby="principles-title"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8"
    >
      <h2 id="principles-title" className="text-h1">
        오래 플레이할 수 있게 만들었어요
      </h2>
      <ul className="grid gap-8 md:grid-cols-3">
        {PRINCIPLES.map(({ icon, title, body }) => (
          <li key={title} className="flex gap-4">
            <PixelIcon name={icon} scale={3} />
            <div className="flex flex-col gap-1">
              <h3 className="text-title">{title}</h3>
              <p className="text-small text-text-secondary">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
