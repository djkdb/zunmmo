import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/components/LegalPage";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <LegalPage label="TERMS" title="이용약관">
      <section>
        <h2>서비스</h2>
        <p>
          LIFE RPG는 일정·목표·습관을 퀘스트로 기록하고 완료에 따라 캐릭터가 성장하는 개인용 웹
          앱이에요. 현재 베타 단계라 기능과 화면이 바뀔 수 있어요.
        </p>
      </section>
      <section>
        <h2>계정</h2>
        <ul>
          <li>이메일 로그인 코드나 Google 계정으로 가입해요. 계정은 본인만 사용해 주세요.</li>
          <li>언제든 설정에서 계정을 삭제할 수 있고, 삭제하면 기록을 되돌릴 수 없어요.</li>
        </ul>
      </section>
      <section>
        <h2>내 데이터</h2>
        <p>
          입력한 퀘스트와 기록의 권리는 이용자에게 있어요. 서비스는 기능 제공에 필요한 범위에서만
          처리해요 (개인정보처리방침 참고).
        </p>
      </section>
      <section>
        <h2>금지 행위</h2>
        <ul>
          <li>서비스나 다른 이용자의 데이터에 무단으로 접근하려는 시도</li>
          <li>자동화된 대량 요청 등 서비스 운영을 방해하는 행위</li>
        </ul>
      </section>
      <section>
        <h2>책임의 한계</h2>
        <p>
          XP·레벨·추천은 동기 부여를 위한 게임 장치이며 의료·학업·업무 성과를 보장하지 않아요. 베타
          기간에는 예고 없이 점검하거나 기능을 바꿀 수 있어요. 중요한 일정은 별도로도 관리해 주세요.
        </p>
      </section>
      <section>
        <h2>약관 변경</h2>
        <p>약관이 바뀌면 시행 7일 전에 이 페이지에 알려요.</p>
      </section>
    </LegalPage>
  );
}
