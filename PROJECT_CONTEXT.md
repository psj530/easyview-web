# Easy View 3.0 - 프로젝트 컨텍스트

> 이 문서는 Claude와의 대화에서 진행한 전체 작업 내역과 현재 상태, 남은 TODO를 정리한 것입니다.
> 새 대화 시작 시 이 파일을 첨부하면 이어서 작업할 수 있습니다.
> 최종 업데이트: 2026-04-20

---

## 프로젝트 개요

- **프로젝트명**: PwC Worldwide Easy View 3.0 Web Service
- **목적**: 삼일회계법인의 Power BI 기반 Easy View Report를 웹 환경(Next.js + FastAPI)으로 구현
- **원본**: Power BI로 만들어진 재무분석 대시보드 (PDF 58페이지 리포트 기반)
- **고객사 샘플 데이터**: ABC Company, 2024.01 ~ 2025.09
- **GitHub**: https://github.com/psj530/easyview-web
- **담당자**: psj530 (parksoujeong@gmail.com)

---

## 기술 스택

| 구분 | 기술 | 비고 |
|------|------|------|
| **프론트엔드** | Next.js 16 (TypeScript, Tailwind CSS 4, App Router) | src/app 구조 |
| **백엔드** | FastAPI (Python 3.11) | REST API |
| **인증** | JWT (PBKDF2-HMAC-SHA256) | 자체 구현 |
| **DB** | SQLite (WAL 모드) × 2 | easyview.db (재무), auth.db (인증) |
| **차트** | Chart.js 4.4 + react-chartjs-2 | Bar, Line, Doughnut |
| **배포** | Vercel (프론트) + Render (백엔드) | 미배포 |
| **Docker** | 사용하지 않음 | |

---

## 현재 파일 구조

```
easyview-web/
├── backend/
│   ├── main.py                   # FastAPI 서버 (30+ 엔드포인트)
│   ├── auth.py                   # 인증 모듈 (JWT, 사용자/회사/자료게시판 관리)
│   ├── database.py               # SQLite DB 모듈 (쿼리, 필터, 캐시)
│   ├── run.py                    # 실행 스크립트 (python run.py → localhost:8000)
│   ├── requirements.txt          # fastapi, uvicorn, python-multipart, aiofiles
│   ├── seed_demo_docs.py         # 자료게시판 데모 데이터 시더 (periods/requests/posts 생성)
│   ├── auth.db                   # 인증 DB (gitignored)
│   ├── documents/                # 업로드된 파일 저장소 (gitignored)
│   │   └── {company_id}/         # 회사별 폴더
│   └── input/
│       ├── TB.csv                # 시산표 83계정 (cp949 인코딩)
│       └── JE.csv                # 전표 134,784건 (cp949 인코딩)
│
├── frontend/
│   ├── next.config.ts            # /api/* 프록시 + proxyClientMaxBodySize 100mb
│   ├── package.json              # chart.js, react-chartjs-2, html2pdf.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        # 루트 레이아웃 (Noto Sans KR + AuthProvider)
│       │   ├── page.tsx          # 홈페이지 (서비스 소개)
│       │   ├── globals.css       # Tailwind + PwC 색상 + 인쇄 CSS + .documents-page 체크박스
│       │   ├── icon.png          # PwC 파비콘
│       │   ├── login/
│       │   │   └── page.tsx      # 로그인 (이메일/비밀번호 + 자동로그인)
│       │   ├── reports/
│       │   │   └── page.tsx      # 리포트 목록 (생성된 리포트 조회)
│       │   ├── upload/
│       │   │   └── page.tsx      # 데이터 업로드 & 리포트 생성
│       │   ├── documents/
│       │   │   ├── page.tsx      # 자료게시판 메인 (월별 제출현황 매트릭스 + 상세 모달)
│       │   │   └── new/
│       │   │       └── page.tsx  # 자료 업로드 & 게시글 작성
│       │   └── dashboard/
│       │       ├── layout.tsx    # 대시보드 레이아웃 (라이트 헤더)
│       │       └── page.tsx      # 대시보드 (5탭, 필터, sticky 탭)
│       ├── components/
│       │   ├── PwCLogo.tsx
│       │   ├── dashboard/
│       │   │   ├── Summary.tsx
│       │   │   ├── PLAnalysis.tsx
│       │   │   ├── BSAnalysis.tsx
│       │   │   ├── JournalAnalysis.tsx
│       │   │   └── ScenarioAnalysis.tsx
│       │   └── charts/
│       │       ├── ChartSetup.ts
│       │       ├── BarChart.tsx
│       │       ├── LineChart.tsx
│       │       └── DoughnutChart.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx    # 인증 상태 관리 + 라우트 보호
│       └── lib/
│           ├── api.ts
│           ├── auth.ts
│           └── utils.ts
│
├── docs/
│   ├── SETUP.md, DEVELOPMENT.md, API.md, DATA_SPEC.md, DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── PROJECT_CONTEXT.md            # 이 파일
```

---

## 페이지 구조 & 네비게이션

```
/ (홈)              서비스 소개 페이지
    ↓ "Easy View Report 바로가기"
/login              로그인 (이메일/비밀번호, 자동로그인)
    ↓ 로그인 성공
/reports            리포트 목록 (생성된 리포트 조회 + 새 리포트 생성 버튼)
    ↓ "리포트 보기"         ↓ "새 리포트 생성"
/dashboard          대시보드 (5탭)     /upload    데이터 업로드 & 리포트 생성

/documents          자료게시판
    - admin: 월별 제출현황 매트릭스 (기간 탭 전환) + 클릭 시 상세 모달 (파일 다운로드 + 댓글)
    - 일반 유저: 본인 회사 파일 목록만 (향후 admin과 동일하게 맞출 예정)
/documents/new      자료 업로드 & 게시글 작성
```

### 공통 헤더 네비게이션
```
[pwc 로고 | Easy View]   [리포트]  [새 리포트]  [자료실]  [서비스 소개]     사용자명 | 로그아웃
```

---

## 완료된 작업

### Phase 1: 핵심 대시보드 (이전 완료)
- ✅ SQLite DB 모듈 (CSV 임포트, 인덱스, WAL 모드)
- ✅ 15개 API 엔드포인트 (필터 파라미터 지원)
- ✅ Summary 탭 (KPI 4개, 손익지표, 유동성지표, 시나리오 카운트)
- ✅ 손익분석 5개 서브탭 (PL 요약, 추이분석, 계정분석, 매출분석, 손익항목)
- ✅ 재무상태분석 3개 서브탭 (BS 요약, 추이분석, 계정분석)
- ✅ 전표분석 2개 서브탭 (전표분석내역, 전표검색)
- ✅ 시나리오분석 6개 시나리오
- ✅ 전표 Drill-down, BS 계정 상세, 전표검색 (페이지네이션)
- ✅ PDF Export (window.print 기반, 인쇄 CSS 최적화)
- ✅ 홈페이지 (서비스 안내, 매뉴얼, Digital & AI, Managed Service, Contact)
- ✅ Summary API: 11.8초 → 0.7초, PL API: 9.3초 → 0.7초 (쿼리 최적화)

### Phase 2: 인증 & 업로드 (2026-04-09 완료)
- ✅ 로그인 페이지 — 이메일/비밀번호 인증, 자동로그인
- ✅ JWT 인증 — PBKDF2-HMAC-SHA256 해싱, 24시간 만료
- ✅ 회사별 접근 통제 — user_companies 테이블
- ✅ 데이터 업로드 페이지 — 4개 파일 카테고리
- ✅ 리포트 생성 플로우 — 변환 애니메이션 → 완료 → 대시보드
- ✅ 리포트 목록 페이지
- ✅ 라이트 테마, 통합 네비게이션, Sticky 탭 바, PwC 파비콘

### Phase 3: 자료게시판 초기 (2026-04-16 완료)
- ✅ 자료게시판 페이지 `/documents` — admin 제출현황 매트릭스 + 파일 아카이브
- ✅ 게시글 작성 페이지 `/documents/new` — 카테고리/결산기간/파일 업로드
- ✅ 카테고리 8개 — 필수 3개 + 선택 5개
- ✅ 제출 요청 이메일 (SMTP 미설정 시 DB 기록만)
- ✅ 결산기간 필드 (period_start, period_end)
- ✅ ERP/국가 정보 배지

**새 DB 테이블:** `doc_categories`, `doc_posts`, `doc_requests`
**확장된 테이블:** `companies` (+country, +erp_system)

### Phase 3 확장: 자료게시판 고도화 (2026-04-20 완료)
- ✅ 월별 제출현황 매트릭스 — doc_periods 기반 기간 탭, 회사 × 카테고리 상태표
- ✅ 제출 요청 등록 모달 (RequestRegisterModal) — 기간/카테고리/회사/기한 선택, PwC 디자인 적용
- ✅ 상세 모달 (DocumentDetailModal) — 파일 클릭 시 파일 목록 + 댓글 스레드 + 다운로드 링크 (directFile prop으로 즉시 표시)
- ✅ 댓글 시스템 — 포럼 스타일, 날짜 구분선, 본인 댓글 편집/삭제, "(수정됨)" 배지, updated_at 타임스탬프
- ✅ 미읽음 알림 (오렌지 점) — 새 댓글 및 편집 모두 트리거, 모달 열 때 로컬 패치로 스크롤 유지
- ✅ doc_posts ↔ doc_requests 연결 — request_id 컬럼 추가 + 기존 데이터 백필 마이그레이션
- ✅ 체크박스 오렌지 스타일 — `.documents-page` 스코프로 자료실에만 적용
- ✅ seed_demo_docs.py — 3개 기간 × 3개 회사 × 3개 카테고리 데모 데이터 생성

**새 DB 테이블:** `doc_periods`, `doc_comments`, `doc_comment_reads`
**확장된 테이블:** `doc_requests` (+period_id, +requestee_email/name), `doc_posts` (+request_id, +rejected), `doc_comments` (+updated_at)

**미완료 (향후):**
- [ ] 사용자 뷰를 admin 뷰와 동일하게 (월별 매트릭스 + 상세 모달 + 댓글)
- [ ] 사용자 파일 업로드/편집/삭제 (`/documents/new` 개선 + 모달 내 파일 관리)
- [ ] 알림 — admin 댓글 시 사용자 알림, 사용자 댓글 시 admin 알림
- [ ] 날짜 입력 형식 YYYY-MM-DD 통일
- [ ] 댓글 편집/삭제 아이콘 전용 버튼 + 호버 툴팁 "편집"
- [ ] 미제출 건수 네비게이션 배지 (`자료실 (5)`)
- [ ] 일괄 제출 요청 (전체 미제출 회사 한 번에 이메일)
- [ ] 제출현황 CSV 내보내기

---

## 미완료 TODO (우선순위순)

### 🟠 P1: PDF Export 개선
1. **전체 PDF** — 모든 탭 순차 렌더링 후 하나의 PDF로 내보내기
2. **html2pdf.js 호환** — Tailwind CSS v4 oklab/lab 색상 비호환 → Puppeteer 서버사이드 고려

### 🟡 P2: 대시보드 기능
3. **반응형 모바일 레이아웃** — 현재 데스크톱 최적화
4. **Waterfall 차트** — 손익 흐름 시각화 (원본 PDF p.11)
5. **리포트별 데이터 로드** — 리포트 목록에서 선택한 리포트 데이터로 대시보드 렌더링

### 🟢 P3: 배포 및 기타
6. **Vercel + Render 실제 배포** — docs/DEPLOYMENT.md 참고

### 🟠 P1: PDF Export 개선
7. **전체 PDF** — 모든 탭 순차 렌더링 후 하나의 PDF로 내보내기
8. **html2pdf.js 호환** — Tailwind CSS v4 oklab/lab 색상 비호환 → Puppeteer 서버사이드 고려

### 🟡 P2: 대시보드 기능
9. **반응형 모바일 레이아웃**
10. **Waterfall 차트** (원본 PDF p.11)
11. **리포트별 데이터 로드** — 리포트 목록에서 선택한 리포트 데이터로 대시보드 렌더링

### 🟢 P3: 기타
12. **Vercel + Render 실제 배포** — docs/DEPLOYMENT.md 참고
13. **일괄 제출 요청** — 미제출 전체 회사에 한 번에 이메일

---

## API 엔드포인트 현황

| Method | Path | 인증 | 비고 |
|--------|------|------|------|
| POST | /api/auth/login | - | 로그인 |
| GET | /api/auth/me | JWT | 현재 사용자 정보 |
| GET | /api/auth/companies | JWT | 접근 가능 회사 목록 |
| GET | /api/reports | JWT | 리포트 목록 |
| POST | /api/upload/v2 | JWT | 파일 업로드 & 리포트 생성 |
| GET | /api/health | - | 서버 상태 |
| GET | /api/meta | - | 기준일, 회사명 |
| GET | /api/months | - | 21개월 목록 |
| GET | /api/data | - | 전체 데이터 (필터) |
| GET | /api/summary | - | Summary KPI |
| GET | /api/pl | - | PL + 분기별 + 월별 추이 |
| GET | /api/bs | - | BS + 재무비율 추이 |
| GET | /api/bs/account | - | BS 계정별 잔액추이 |
| GET | /api/sales | - | 매출 거래처 분석 |
| GET | /api/journal | - | 전표 요약 + 일별 추이 |
| GET | /api/journal/search | - | 전표 검색 (페이지네이션) |
| GET | /api/pl/journal | - | PL drill-down 전표 |
| GET | /api/scenarios | - | 시나리오 6개 |
| GET | /api/scenarios/{id} | - | 개별 시나리오 |
| GET | /api/documents/categories | JWT | 카테고리 목록 |
| POST | /api/documents/categories | JWT(admin) | 카테고리 추가 |
| GET | /api/documents/years | JWT | 결산기간 연도 목록 |
| GET | /api/documents | JWT | 게시글 목록 (필터, 페이지네이션) |
| POST | /api/documents | JWT | 게시글 작성 + 파일 업로드 |
| GET | /api/documents/{id} | JWT | 게시글 상세 |
| DELETE | /api/documents/{id} | JWT | 게시글 삭제 |
| GET | /api/documents/{id}/download | JWT | 파일 다운로드 |
| GET | /api/documents/admin/status | JWT(admin) | 회사별 제출현황 (구형) |
| GET | /api/documents/admin/monthly-status | JWT(admin) | 월별 제출현황 매트릭스 |
| GET | /api/documents/admin/periods | JWT(admin) | 기간 목록 |
| POST | /api/documents/admin/periods | JWT(admin) | 기간 생성 |
| PATCH | /api/documents/admin/periods/{id} | JWT(admin) | 기간 수정 |
| DELETE | /api/documents/admin/periods/{id} | JWT(admin) | 기간 삭제 |
| PATCH | /api/documents/admin/company/{cid}/period/{pid}/due-date | JWT(admin) | 회사별 기한 수정 |
| DELETE | /api/documents/admin/company/{cid}/period/{pid}/requests | JWT(admin) | 회사+기간 요청 일괄 삭제 |
| POST | /api/documents/admin/request | JWT(admin) | 제출 요청 생성 |
| PATCH | /api/documents/admin/requests/{id} | JWT(admin) | 제출 요청 수정 |
| DELETE | /api/documents/admin/requests/{id} | JWT(admin) | 제출 요청 삭제 |
| POST | /api/documents/admin/request/{id}/send-email | JWT(admin) | 제출 요청 이메일 발송 |
| POST | /api/documents/admin/bulk-request/{cid}/{period} | JWT(admin) | 회사+기간 일괄 요청 |
| POST | /api/documents/admin/bulk-request-all/{period} | JWT(admin) | 전체 회사 일괄 요청 |
| POST | /api/documents/admin/files/{id}/reject | JWT(admin) | 파일 반려 |
| GET | /api/documents/admin/download-zip/{cid}/{period} | JWT(admin) | 기간별 ZIP 다운로드 |
| GET | /api/documents/requests/{id}/files | JWT | 요청별 제출 파일 목록 |
| GET | /api/documents/requests/{id}/comments | JWT | 댓글 목록 |
| POST | /api/documents/requests/{id}/comments | JWT | 댓글 작성 |
| POST | /api/documents/requests/{id}/comments/read | JWT | 댓글 읽음 처리 |
| PATCH | /api/documents/comments/{id} | JWT | 댓글 편집 (본인만) |
| DELETE | /api/documents/comments/{id} | JWT | 댓글 삭제 (본인 또는 admin) |

---

## 테스트 계정

| 계정 | 비밀번호 | 역할 | 접근 회사 |
|------|----------|------|-----------|
| admin@samil.com | admin1234 | 관리자 | ABC, XYZ, 삼일전자 |
| user@samil.com | user1234 | 사용자 | ABC만 |

---

## 디자인 가이드

- **PwC 오렌지 (진)**: #D04A02 — 관리자 이름, 주요 액센트
- **PwC 오렌지 (밝)**: #F68600 — 버튼, 체크박스, 필수 항목 ★
- **다크**: #2D2D2D — 본문 텍스트, 헤더 배경
- **미드 그레이**: #464646 — 일반 사용자 이름
- **헤더**: 라이트 배경 (화이트), PwC 로고 다크, 오렌지 액센트
- **메인탭 바**: 다크 배경 (#2D2D2D), 오렌지 하단 인디케이터
- **Tailwind CSS 4**: rounded-md, shadow-xs (일부 색상 클래스 미작동 → inline style 사용)
- **폰트**: Noto Sans KR

---

## 실행 방법

```bash
# 백엔드 (터미널 1)
cd easyview-web/backend
pip install -r requirements.txt
python run.py
# → http://localhost:8000

# 프론트엔드 (터미널 2)
cd easyview-web/frontend
npm install
npm run dev -- -p 3003
# → http://localhost:3003/login

# 데모 데이터 시딩 (선택, 최초 1회)
cd easyview-web/backend
python seed_demo_docs.py
```

---

## 다음 대화에서 요청할 내용 (예시)

```
프로젝트 경로: c:\Users\syoon112\Desktop\Work\easyview-web
첨부된 PROJECT_CONTEXT.md를 읽고 이어서 작업해주세요.

다음 작업:
1. 사용자 뷰를 admin 뷰와 동일하게 맞추기 (월별 매트릭스 + 상세 모달 + 댓글)
2. 댓글 편집/삭제 버튼 아이콘 전용으로 변경 + 호버 툴팁
```
