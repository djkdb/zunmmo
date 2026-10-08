const numberFormatter = new Intl.NumberFormat("ko-KR");

/** 1000 → "1,000" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 70 → "+70 XP" (UI_GUIDE §11: XP always carries its sign). */
export function formatXpGain(xp: number): string {
  return `${xp >= 0 ? "+" : "−"}${formatNumber(Math.abs(xp))} XP`;
}

/** 95 → "1시간 35분", 30 → "30분" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
