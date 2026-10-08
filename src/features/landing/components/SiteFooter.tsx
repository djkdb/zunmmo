import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-small text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="font-pixel text-pixel">© LIFE RPG</span>
        <nav aria-label="법적 고지" className="flex gap-4">
          <Link href="/privacy" className="hover:text-text hover:underline">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-text hover:underline">
            이용약관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
