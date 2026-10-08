import type { Metadata, Viewport } from "next";

import "@/styles/fonts/pretendard/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { galmuri } from "./fonts";

export const metadata: Metadata = {
  title: {
    default: "LIFE RPG",
    template: "%s · LIFE RPG",
  },
  description: "내 현실을 MMORPG처럼 플레이하는 Life RPG",
};

export const viewport: Viewport = {
  themeColor: "#15111f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={galmuri.variable}>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
