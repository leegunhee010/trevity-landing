# 트래비티 KOC 비법서 랜딩 — 광고 전환 세팅 가이드

구글 애즈 / 메타 애즈 **전환 페이지**로 쓰기 위한 추적이 미리 깔려 있습니다.
**`tracking.js` 맨 위 ID 5개만 교체**하면 바로 전환이 잡힙니다. (지금은 placeholder = 자동 비활성 상태라 에러 없이 동작)

---

## 1. 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 신청 랜딩(폼) — 제출 성공 시 `thanks.html`로 자동 이동 |
| `thanks.html` | **전환 발사 페이지** — 여기 진입 = 리드 1건 (픽셀 Lead / Ads 전환) |
| `privacy.html` | 개인정보처리방침 (메타·구글 정책 심사용, 필수) |
| `tracking.js` | **★ 광고 ID 한 곳에서 관리** + 픽셀/태그 자동 로더 |
| `google-apps-script/Code.gs` | **신청 → 구글 시트 자동저장 + 이메일 알림** (선택, 권장) |

---

## ★ 신청은 어디에 저장되나 (저장 방식 선택)

| 방식 | 저장 위치 | 설정 |
|---|---|---|
| **기본(현재)** | Gmail 받은편지함 (formsubmit 이메일) | 없음 — 바로 동작 |
| **구글 시트** ⭐ | 스프레드시트에 한 줄씩 누적 + 메일 알림 | 아래 4단계 |

### 구글 시트로 바꾸기 (5분)
1. https://script.google.com → **새 프로젝트**
2. `google-apps-script/Code.gs` 내용 전체 붙여넣기 → 저장
3. 함수 `setup` 실행 → 권한 승인 → 실행 로그에 **신청 DB 시트 주소**가 찍힘
4. **[배포] → [새 배포] → 웹 앱** (실행: 나 / 액세스: 모든 사용자) → **웹 앱 URL(.../exec)** 복사
5. `index.html` 의 `SHEET_ENDPOINT = ''` 에 그 URL 붙여넣기 → `git push`

> 설정 전까지는 자동으로 **이메일 방식**으로 동작합니다. URL을 넣는 순간 시트 저장으로 전환돼요.
> 시트 컬럼: 신청일시 · 이름 · 매장명 · 업종 · 전화번호 · 이메일 · 추가내용

---

## 2. ID 받으면 여기만 교체 (`tracking.js` 상단)

```js
window.TRACKING = {
  GTM_ID:        'GTM-XXXXXXX',          // (선택) GTM 쓸 때만
  META_PIXEL_ID: 'XXXXXXXXXXXXXXX',      // Meta 픽셀 ID
  GADS_ID:       'AW-XXXXXXXXXX',        // Google Ads 전환 ID
  GADS_LABEL:    'XXXXXXXXXXXXXXXXXXXX', // Google Ads 전환 라벨
  GA4_ID:        'G-XXXXXXXXXX'          // (선택) GA4 측정 ID
};
```

- `X`가 들어간 값은 **자동으로 꺼져 있음** → 가진 것만 채우면 됨.
- **권장:** '직접 ID 방식'(META/GADS) 또는 'GTM 방식' 중 **하나만** 사용. 둘 다 같은 Lead를 잡으면 전환이 2배로 집계됨.

### ID 어디서 받나
- **Meta 픽셀 ID**: Meta 이벤트 관리자 → 데이터 소스 → 픽셀 (15~16자리 숫자)
- **Google Ads 전환 ID/라벨**: Google Ads → 도구 → 전환 → 새 전환(웹) → "직접 설치" 시 `AW-000000000` 와 `AbCdEf...` 라벨
- **GA4 측정 ID**: GA4 → 관리 → 데이터 스트림 → `G-XXXXXXXXXX`

---

## 3. 전환 동작 흐름

```
광고 클릭 → index.html (픽셀 PageView)
   → 폼 작성·제출
   → FormSubmit 접수(이메일 발송)
   → thanks.html 자동 이동
        → fbq('track','Lead')           ← Meta 전환
        → gtag('event','conversion')     ← Google Ads 전환
        → GA4 generate_lead
```

`thanks.html` 도착 = "신청 완료" 1건. 메타·구글 캠페인 목표를 **이 Lead/전환**에 맞추면 자동 최적화됩니다.

---

## 4. 광고 플랫폼 쪽 설정 (요약)

**메타**
1. 이벤트 관리자에서 픽셀 생성 → ID를 `META_PIXEL_ID`에 입력
2. 게시 후 사이트 1회 방문 → "Lead" 이벤트 수신 확인 (테스트 이벤트 도구)
3. 캠페인 목표: **잠재고객(Leads)**, 전환 이벤트 = **Lead**
4. (권장) 도메인 인증 + 전환 API(CAPI)로 정확도 보강

**구글 애즈**
1. 전환 → 웹 → "리드 양식 제출" 전환 생성 → `AW-…` ID와 라벨을 입력
2. 캠페인 입찰: **전환 수 최대화**, 전환 액션 = 위에서 만든 리드
3. (권장) GA4 연결 후 `generate_lead`를 전환으로 가져오기

---

## 5. 발사 확인 방법 (게시 후)
- **Meta Pixel Helper**(크롬 확장)으로 `thanks.html`에서 **Lead** 뜨는지 확인
- **Google Tag Assistant**로 `thanks.html`에서 conversion 발사 확인
- GA4 실시간 보고서에서 `generate_lead` 이벤트 확인

---

## 6. 남은 체크리스트
- [ ] `tracking.js`에 실제 ID 입력
- [ ] FormSubmit 첫 신청 1건으로 **이메일 활성화 승인** (최초 1회)
- [ ] 메타: 도메인 인증 + Lead 전환 설정
- [ ] 구글: 전환 액션 + 입찰전략 설정
- [ ] (권장) 커스텀 도메인 연결 — 신뢰도·정책 통과·추적 정확도 ↑
