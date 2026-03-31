# PwC Easy View 3.0 - Web Service

> 삼일회계법인 Worldwide Easy View 서비스의 웹 버전
> **Frontend:** Next.js (TypeScript, Tailwind CSS) | **Backend:** FastAPI (Python)

---

## 목차

- [프로젝트 구조](#프로젝트-구조)
- [빠른 시작 (Quick Start)](#빠른-시작)
- [상세 문서](#상세-문서)
- [기술 스택](#기술-스택)
- [문의](#문의)

---

## 프로젝트 구조

```
easyview-web/
├── backend/                      # FastAPI 백엔드
│   ├── main.py                   # API 서버 (12개 엔드포인트)
│   ├── data_processor.py         # CSV → JSON 데이터 변환 엔진
│   ├── run.py                    # 로컬 실행 스크립트
│   ├── requirements.txt          # Python 의존성
│   └── input/                    # 원본 CSV 데이터
│       ├── TB.csv                # 시산표 (Trial Balance)
│       └── JE.csv                # 전표 (Journal Entry)
│
├── frontend/                     # Next.js 프론트엔드
│   └── src/
│       ├── app/                  # Pages (홈, 대시보드)
│       ├── components/           # React 컴포넌트
│       │   ├── dashboard/        # Summary, PL, BS, Journal, Scenario
│       │   └── charts/           # Bar, Line, Doughnut 차트
│       └── lib/                  # API 클라이언트, 유틸리티
│
├── docs/                         # 프로젝트 문서
│   ├── SETUP.md                  # 환경 설정 가이드
│   ├── DEVELOPMENT.md            # 개발 가이드
│   ├── DEPLOYMENT.md             # 배포 가이드
│   ├── API.md                    # API 명세
│   └── DATA_SPEC.md              # 데이터 규격
│
└── README.md
```

---

## 빠른 시작

### 전제조건
- **Node.js** 18+ (`node --version`)
- **Python** 3.10+ (`python --version`)
- **npm** 9+ (`npm --version`)

### 1. 저장소 클론
```bash
git clone https://github.com/psj530/easyview-web.git
cd easyview-web
```

### 2. 백엔드 실행 (터미널 1)
```bash
cd backend
pip install -r requirements.txt
python run.py
```
> http://localhost:8000 에서 실행
> API 문서: http://localhost:8000/docs

### 3. 프론트엔드 실행 (터미널 2)
```bash
cd frontend
npm install
npm run dev
```
> http://localhost:3000 에서 실행

---

## 상세 문서

| 문서 | 내용 | 대상 |
|------|------|------|
| [docs/SETUP.md](docs/SETUP.md) | 환경 설정, 전제조건, 설치 | 신규 합류자 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | 개발 가이드, 코드 구조, 컨벤션 | 개발자 |
| [docs/API.md](docs/API.md) | API 엔드포인트 상세 명세 | 프론트/백 개발자 |
| [docs/DATA_SPEC.md](docs/DATA_SPEC.md) | CSV 데이터 규격, 컬럼 정의 | 데이터 담당자 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | 배포 가이드 (Vercel + Render) | DevOps/배포 담당자 |

---

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js (App Router) | 16+ |
| Frontend | TypeScript | 5+ |
| Frontend | Tailwind CSS | 4+ |
| Frontend | Chart.js + react-chartjs-2 | 4.4+ |
| Backend | FastAPI | 0.100+ |
| Backend | Python | 3.10+ |
| Backend | Uvicorn | 0.30+ |
| 배포 | Vercel (Frontend) | - |
| 배포 | Render (Backend) | - |

---

## 문의

| 항목 | 내용 |
|------|------|
| 이메일 | kr_easyview@pwc.com |
| 연락처 | 010-9136-7136 |
| 팀 | 삼일회계법인 Worldwide Easy View 서비스팀 |
| GitHub | https://github.com/psj530/easyview-web |
