# Easy View 3.0 - 프로젝트 컨텍스트

> 이 문서는 Claude와의 대화에서 진행한 전체 작업 내역과 현재 상태, 남은 TODO를 정리한 것입니다.
> 새 대화 시작 시 이 파일을 첨부하면 이어서 작업할 수 있습니다.
> 최종 업데이트: 2026-04-09

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
│   ├── main.py                   # FastAPI 서버 (19개 엔드포인트)
│   ├── auth.py                   # 인증 모듈 (JWT, 사용자/회사/리포트 관리)
│   ├── database.py               # SQLite DB 모듈 (쿼리, 필터, 캐시)
│   ├── run.py                    # 실행 스크립트 (python run.py → localhost:8000)
│   ├── requirements.txt          # fastapi, uvicorn, python-multipart, aiofiles
│   ├── auth.db                   # 인증 DB (사용자, 회사, 리포트)
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
│       │   ├── globals.css       # Tailwind + PwC 색상 + 인쇄 CSS
│       │   ├── icon.png          # PwC 파비콘
│       │   ├── login/
│       │   │   └── page.tsx      # 로그인 (이메일/비밀번호 + 자동로그인)
│       │   ├── reports/
│       │   │   └── page.tsx      # 리포트 목록 (생성된 리포트 조회)
│       │   ├── upload/
│       │   │   └── page.tsx      # 데이터 업로드 & 리포트 생성
│       │   └── dashboard/
│       │       ├── layout.tsx    # 대시보드 레이아웃 (라이트 헤더)
│       │       └── page.tsx      # 대시보드 (5탭, 필터, sticky 탭)
│       ├── components/
│       │   ├── PwCLogo.tsx       # PwC 로고 SVG (라이트/다크 지원)
│       │   ├── dashboard/
│       │   │   ├── Summary.tsx       # Summary 탭
│       │   │   ├── PLAnalysis.tsx    # 손익분석 (5 서브탭, drill-down)
│       │   │   ├── BSAnalysis.tsx    # 재무상태분석 (3 서브탭)
│       │   │   ├── JournalAnalysis.tsx  # 전표분석 (2 서브탭)
│       │   │   └── ScenarioAnalysis.tsx # 시나리오분석 (6 시나리오)
│       │   └── charts/
│       │       ├── ChartSetup.ts     # Chart.js 전역 등록
│       │       ├── BarChart.tsx
│       │       ├── LineChart.tsx
│       │       └── DoughnutChart.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx    # 인증 상태 관리 + 라우트 보호
│       └── lib/
│           ├── api.ts            # API 클라이언트 (타입 정의 포함)
│           ├── auth.ts           # 인증 유틸 (토큰, 자동로그인)
│           └── utils.ts          # 숫자 포맷, 차트 색상, 스파크라인
│
├── docs/                         # 프로젝트 문서
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
```

### 공통 헤더 네비게이션
```
[pwc 로고 | Easy View]   [리포트]  [새 리포트]  [서비스 소개]     사용자명 | 로그아웃
```

---

## 완료된 작업

### Phase 1: 핵심 대시보드 (이전 완료)
- ✅ SQLite DB 모듈 (CSV 임포트, 인덱스, WAL 모드)
- ✅ 15개 API 엔드포인트 (필터 파라미터 지원)
- ✅ 필터 동작 (전년누적/전년동월/전월비교 + 월 선택)
- ✅ Summary 탭 (KPI 4개, 손익지표, 유동성지표, 시나리오 카운트)
- ✅ 손익분석 5개 서브탭 (PL 요약, 추이분석, 계정분석, 매출분석, 손익항목)
- ✅ 재무상태분석 3개 서브탭 (BS 요약, 추이분석, 계정분석)
- ✅ 전표분석 2개 서브탭 (전표분석내역, 전표검색)
- ✅ 시나리오분석 6개 시나리오 (동일금액 중복, 현금지급 후 부채인식 등)
- ✅ 전표 Drill-down, BS 계정 상세, 전표검색 (페이지네이션)
- ✅ PDF Export (window.print 기반, 인쇄 CSS 최적화)
- ✅ 홈페이지 (서비스 안내, 매뉴얼, Digital & AI, Managed Service, Contact)

### Phase 2: 인증 & 업로드 (2026-04-09 완료)
- ✅ **로그인 페이지** - 이메일/비밀번호 인증, 자동로그인, 삼일 보안 정책 안내
- ✅ **JWT 인증** - PBKDF2-HMAC-SHA256 비밀번호 해싱, JWT 토큰 (24시간 만료)
- ✅ **회사별 접근 통제** - 사용자별 회사 접근 권한 (user_companies 테이블)
- ✅ **데이터 업로드 페이지** - 4개 파일 카테고리 (JE/GL 필수, TB 필수, BS/PL 선택, 기타 선택)
- ✅ **리포트 생성 플로우** - "Report 생성하기" → 변환 애니메이션 → 완료 → 대시보드
- ✅ **리포트 목록 페이지** - 생성된 리포트 조회, 리포트 보기, 새 리포트 생성
- ✅ **라이트 테마** - 전체 페이지 화이트 배경, PwC 로고 다크 모드 대응
- ✅ **통합 네비게이션** - 리포트/새 리포트/서비스 소개 탭, PwC 로고 클릭 시 리포트 목록
- ✅ **Sticky 탭 바** - 대시보드 메인탭 + 서브탭이 스크롤 시 상단 고정
- ✅ **PwC 파비콘** - 브라우저 탭 아이콘

### 성능 최적화
- ✅ Summary API: 11.8초 → 0.7초 (경량화된 독립 쿼리)
- ✅ PL API: 9.3초 → 0.7초 (분기별 PL을 월별 캐시에서 계산)

### 데이터 검증 (PDF 원본과 100% 일치)
| 항목 | 값 |
|------|------|
| 매출액 | 133,930,227,921 |
| 매출총이익 | 81,082,125,844 |
| 영업이익 | 27,770,723,534 |
| 당기순이익 | 21,803,252,164 |
| 전표 수 | 134,784건 |
| 계정 수 | 83개 |

---

## 미완료 TODO (우선순위순)

### 🟠 P1: PDF Export 개선
1. **전체 PDF** - 모든 탭을 순차 렌더링하여 하나의 PDF로 내보내기
2. **html2pdf.js 호환** - Tailwind CSS v4의 oklab/lab 색상 비호환. 대안: Puppeteer 서버사이드

### 🟡 P2: UI/UX 개선
3. **반응형 모바일 레이아웃** - 현재 데스크톱 최적화
4. **Waterfall 차트** - 손익 흐름 시각화 (원본 PDF p.11)
5. **거래처 2개 비교 차트** - 원본 PDF의 "거래처별 비교" 기능
6. **리포트별 데이터 로드** - 리포트 목록에서 선택한 리포트의 데이터로 대시보드 렌더링

### 🟢 P3: 배포 및 기타
7. **Vercel + Render 실제 배포** - docs/DEPLOYMENT.md 참고
8. **다크 모드** - 선택적

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
| POST | /api/upload | - | CSV 업로드 (레거시) |

---

## 테스트 계정

| 계정 | 비밀번호 | 역할 | 접근 회사 |
|------|----------|------|-----------|
| admin@samil.com | admin1234 | 관리자 | ABC, XYZ, 삼일전자 |
| user@samil.com | user1234 | 사용자 | ABC만 |

---

## 디자인 가이드

- **PwC 오렌지**: #D04A02
- **다크**: #2D2D2D
- **헤더**: 라이트 배경 (화이트), PwC 로고 다크, 오렌지 액센트
- **메인탭 바**: 다크 배경 (#2D2D2D), 오렌지 하단 인디케이터
- **Tailwind CSS 4**: rounded-md, shadow-xs
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
```

---

## 다음 대화에서 요청할 내용 (예시)

```
프로젝트 경로: c:\Users\spark068\Desktop\Study\Claude\easyview-web
첨부된 PROJECT_CONTEXT.md를 읽고 이어서 작업해주세요.

다음 작업:
1. 리포트별 데이터 로드 (리포트 목록에서 클릭 시 해당 리포트 데이터로 대시보드 표시)
2. 전체 PDF 내보내기 개선
```
