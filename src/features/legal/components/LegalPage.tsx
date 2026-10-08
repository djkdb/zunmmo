import type { ReactNode } from "react";

import { SiteFooter } from "@/features/landing/components/SiteFooter";
import { SiteHeader } from "@/features/landing/components/SiteHeader";
import { formatGameDate } from "@/lib/utils/format";

import { CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from "../constants";

/** Long-form legal text: Modern side of the art direction, readable line length. */
export function LegalPage({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="flex flex-col gap-2">
          <p className="font-pixel text-pixel text-text-muted">{label}</p>
          <h1 className="text-h1">{title}</h1>
          <p className="text-small text-text-muted">
            시행일 {LEGAL_EFFECTIVE_DATE.slice(0, 4)}년 {formatGameDate(LEGAL_EFFECTIVE_DATE)}
          </p>
        </header>
        <div className="flex flex-col gap-8 text-body text-text-secondary [&_h2]:text-h2 [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc [&_section]:flex [&_section]:flex-col [&_section]:gap-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
          <section>
            <h2>문의</h2>
            <p>
              {CONTACT_EMAIL ? (
                <>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-text hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  으로 연락해 주세요.
                </>
              ) : (
                "운영자 연락처는 서비스 공개 시 이곳에 안내해요."
              )}
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
