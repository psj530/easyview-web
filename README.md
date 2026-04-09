# PwC Easy View 3.0 - Web Service

> 삼일회계법인 Worldwide Easy View 서비스의 웹 버전
> **Frontend:** Next.js 16 (TypeScript, Tailwind CSS 4) | **Backend:** FastAPI + SQLite

---

## 빠른 시작

### 전제조건
- Node.js 18+ / Python 3.10+ / npm 9+

### 1. 백엔드 실행 (터미널 1)
```bash
cd backend
pip install -r requirements.txt
python run.py
# → http://localhost:8000 (API 문서: /docs)
```

### 2. 프론트엔드 실행 (터미널 2)
```bash
cd frontend
npm install
npm run dev -- -p 3003
# → http://localhost:3003/dashboard
```

---

## 프로젝트 구조

```
easyview-web/
├── backend/
│   ├── main.py              # FastAPI 서버 (15개 엔드포인트)
│   ├── database.py          # SQLite DB 모듈
│   ├── run.py               # 실행 스크립트
│   └── input/               # TB.csv, JE.csv
│
├── frontend/src/
│   ├── app/                 # Next.js App Router (홈, 대시보드)
│   ├── components/          # Dashboard 5탭 + Chart 3종
│   └── lib/                 # API 클라이언트, 유틸리티
│
├── docs/                    # SETUP, API, DEPLOYMENT 등
└── PROJECT_CONTEXT.md       # AI 대화 인수인계 문서
```

---

## 주요 기능

| 탭 | 기능 |
|-----|------|
| Summary | KPI 4개, 손익/유동성 지표, TOP3 증감, 시나리오 카운트 |
| 손익분석 | PL 요약, 추이분석(drill-down), 계정분석, 매출분석, 분기별 손익 |
| 재무상태분석 | BS 요약, 추이분석(계정 선택), 계정별 증감(drill-up/down) |
| 전표분석 | 전표 요약(일별 추이), 전표검색(필터/페이지네이션) |
| 시나리오분석 | 6개 시나리오 (동일금액 중복, 주말 현금지급 등) |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Chart.js |
| Backend | FastAPI, SQLite (WAL), Uvicorn |
| 배포 | Vercel (Frontend) + Render (Backend) |

---

## 문의

- **이메일**: kr_easyview@pwc.com
- **GitHub**: https://github.com/psj530/easyview-web
