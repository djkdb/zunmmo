import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { GameEffectsProvider } from "@/features/progress/components/GameEffects";

export default function GameLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <GameEffectsProvider>
        <AppShell>{children}</AppShell>
      </GameEffectsProvider>
    </ToastProvider>
  );
}
