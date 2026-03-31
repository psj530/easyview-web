# PwC Easy View 3.0 - Web Service

## 구조
```
easyview-web/
├── backend/          # FastAPI 백엔드 (Python)
│   ├── main.py       # API 서버
│   ├── data_processor.py  # CSV 데이터 처리
│   ├── run.py        # 실행 스크립트
│   └── input/        # CSV 파일 (TB, JE)
├── frontend/         # Next.js 프론트엔드
│   └── src/
└── README.md
```

## 실행 방법

### 1. 백엔드 (FastAPI)
```bash
cd backend
pip install fastapi uvicorn python-multipart aiofiles
python run.py
# http://localhost:8000 에서 실행
# API docs: http://localhost:8000/docs
```

### 2. 프론트엔드 (Next.js)
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000 에서 실행
```

### 3. 데이터 업데이트
- `backend/input/` 폴더에 TB.csv, JE.csv 파일 교체
- 백엔드 재시작 또는 `/api/upload` 엔드포인트로 업로드

## API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/health | 헬스체크 |
| GET | /api/data | 전체 재무 데이터 |
| GET | /api/meta | 기준일, 회사명 |
| GET | /api/summary | Summary 데이터 |
| GET | /api/pl | 손익 데이터 |
| GET | /api/bs | 재무상태 데이터 |
| GET | /api/sales | 매출분석 데이터 |
| GET | /api/journal | 전표분석 데이터 |
| GET | /api/scenarios | 시나리오분석 데이터 |
| POST | /api/upload | CSV 파일 업로드 |
