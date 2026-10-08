import type { MetadataRoute } from "next";

/**
 * Installable PWA (ROADMAP Phase 9). Colors mirror `--color-bg` / viewport themeColor:
 * the manifest is read by the OS, so it cannot reference CSS tokens.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIFE RPG",
    short_name: "LIFE RPG",
    description: "일정·목표·습관을 퀘스트로 바꾸고, 완료할 때마다 캐릭터가 성장하는 Life RPG.",
    lang: "ko",
    start_url: "/adventure",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#15111f",
    theme_color: "#15111f",
    categories: ["productivity", "lifestyle", "games"],
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "퀘스트 추가", url: "/quests/new" },
      { name: "캘린더", url: "/calendar" },
    ],
  };
}
