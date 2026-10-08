import type { Metadata } from "next";

import { LegalPage } from "@/features/legal/components/LegalPage";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <LegalPage label="PRIVACY" title="개인정보처리방침">
      <section>
        <h2>어떤 정보를 모으나요</h2>
        <ul>
          <li>로그인용 이메일 주소 (Google로 로그인하면 Google 계정 이메일과 이름)</li>
          <li>
            직접 입력한 게임 데이터: 캐릭터 이름·외형, 퀘스트, 메인 퀘스트라인, 일정,
            설정(시간대·하루 시작 시각·하루 모험 시간)
          </li>
          <li>플레이 기록: 퀘스트 완료 시각, XP 원장, 업적, 오늘의 모험 기록</li>
        </ul>
        <p>광고 식별자, 위치, 연락처는 모으지 않아요. 외부 AI 서비스로 데이터를 보내지 않아요.</p>
      </section>
      <section>
        <h2>왜 쓰나요</h2>
        <ul>
          <li>로그인과 계정 보호</li>
          <li>퀘스트·XP·레벨·업적 계산과 오늘의 모험 추천 (모두 서비스 안의 규칙으로 계산)</li>
          <li>서비스 오류 확인과 개선 (개인을 식별하지 않는 집계로만)</li>
        </ul>
      </section>
      <section>
        <h2>어디에 저장하나요</h2>
        <p>
          데이터는 Supabase(데이터베이스·인증)에 저장되고, 웹 앱은 Vercel에서 실행돼요. 두 서비스는
          운영을 위한 처리 위탁 업체이며, 저장 지역은 서비스 공개 시 이 문서에 명시해요.
        </p>
      </section>
      <section>
        <h2>쿠키</h2>
        <p>로그인 상태를 유지하는 세션 쿠키만 써요. 추적·광고 쿠키는 없어요.</p>
      </section>
      <section>
        <h2>얼마나 보관하나요</h2>
        <p>
          계정을 삭제할 때까지 보관해요. <strong>설정 → 계정 삭제</strong>를 누르면 모든 데이터가
          즉시 지워져요. 장애 복구용 백업에는 최대 7일 동안 남을 수 있고, 이후 자동으로 사라져요.
        </p>
      </section>
      <section>
        <h2>내 권리</h2>
        <ul>
          <li>열람·수정: 앱 안에서 언제든 확인하고 고칠 수 있어요.</li>
          <li>삭제: 설정에서 직접 계정과 모든 기록을 지울 수 있어요.</li>
          <li>그 밖의 요청은 아래 문의처로 보내 주세요.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
