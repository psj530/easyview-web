# API 명세 (API Reference)

> FastAPI 백엔드 REST API 엔드포인트 상세 명세
> Swagger UI: http://localhost:8000/docs

---

## Base URL

| 환경 | URL |
|------|-----|
| 로컬 개발 | `http://localhost:8000` |
| 프로덕션 | Render 배포 URL |

---

## 엔드포인트 목록

### 시스템

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 및 데이터 로드 여부 |
| GET | `/api/meta` | 기준일, 회사명 메타 정보 |

### 데이터 조회

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/data` | 전체 재무 데이터 (한 번에 모두) |
| GET | `/api/summary` | Summary 대시보드 데이터 |
| GET | `/api/pl` | 손익분석 데이터 |
| GET | `/api/bs` | 재무상태분석 데이터 |
| GET | `/api/sales` | 매출분석 데이터 |
| GET | `/api/journal` | 전표분석 데이터 |
| GET | `/api/scenarios` | 전체 시나리오 데이터 |
| GET | `/api/scenarios/{id}` | 개별 시나리오 (scenario1~scenario6) |

### 데이터 업로드

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/upload` | TB/JE CSV 파일 업로드 및 재처리 |

---

## 상세 명세

### GET /api/health

서버 상태 확인.

**Response 200:**
```json
{
  "status": "ok",
  "loaded": true
}
```

---

### GET /api/meta

기준일과 회사명.

**Response 200:**
```json
{
  "baseDate": "2025년 09월",
  "companyName": "ABC Company"
}
```

---

### GET /api/summary

Summary 대시보드에 필요한 모든 데이터.

**Response 200:**
```json
{
  "revenue": {
    "current": 133930227921,
    "prior": 114199589362,
    "changeRate": 17.3
  },
  "operatingProfit": { "current": ..., "prior": ..., "changeRate": ... },
  "assets": { "current": ..., "prior": ..., "changeRate": ... },
  "liabilities": { "current": ..., "prior": ..., "changeRate": ... },
  "revenueTopCustomers": [
    { "name": "AA면세점", "amount": 7449303316 },
    ...
  ],
  "expenseTopAccounts": [ { "name": "...", "amount": ... }, ... ],
  "assetTopAccounts": [ ... ],
  "liabilityTopAccounts": [ ... ],
  "profitIndicators": {
    "grossMargin": 60.5,
    "operatingMargin": 20.7,
    "netMargin": 18.6
  },
  "liquidityIndicators": {
    "debtRatio": 48.5,
    "currentRatio": 670.8
  },
  "scenarioCounts": {
    "duplicateAmount": 128,
    "cashAfterLiability": 0,
    "weekendCash": 768,
    "cashAndExpense": 50
  }
}
```

---

### GET /api/pl

손익분석 데이터.

**Response 200:**
```json
{
  "plItems": [
    {
      "account": "매출액",
      "current": 133930227921,
      "prior": 114199589362,
      "change": 19730638559,
      "changeRate": 17.3,
      "level": 0,
      "bold": true,
      "highlight": false
    },
    ...
  ],
  "monthlyRevenue": {
    "current": [14200, 15800, ...],  // 월별 매출 (백만원)
    "prior": [11500, 13200, ...]
  },
  "quarterlyPL": { ... }
}
```

**plItems.level 값:**
- `0`: 대분류 (매출액, 매출원가, 판매비와관리비 등)
- `1`: 소분류 (급여, 광고선전비 등)

---

### GET /api/bs

재무상태분석 데이터.

**Response 200:**
```json
{
  "bsItems": [
    {
      "category": "자산",
      "endBal": 125499014220,
      "beginBal": 103620341622,
      "change": 21878672598,
      "level": 0,
      "bold": true
    },
    ...
  ],
  "bsTrend": {
    "labels": ["2024-01", "2024-02", ...],
    "assets": { "current": [...], "nonCurrent": [...] },
    "liabilities": { "current": [...], "nonCurrent": [...] },
    "equity": [...]
  },
  "activityMetrics": {
    "arTurnover": { "days": 53.0, "avgBalance": ..., "dailyRevenue": ... },
    "inventoryTurnover": { "days": 68.4, "avgBalance": ..., "dailyCOGS": ... }
  }
}
```

---

### GET /api/sales

매출분석 데이터.

**Response 200:**
```json
{
  "customerCount": { "current": 251, "prior": 121, "change": 130, "changeRate": 107.4 },
  "topCustomerShare": [
    { "name": "찡동", "share": 41.46 },
    ...
  ],
  "topIncreaseCustomers": [
    { "name": "AA면세점", "amount": 7449303316 },
    ...
  ],
  "topDecreaseCustomers": [
    { "name": "찡동", "amount": -3671000000 },
    ...
  ]
}
```

---

### GET /api/scenarios

6개 시나리오 전체.

**Response 200:**
```json
{
  "scenario1": {
    "title": "동일 금액 중복 전표",
    "risk": "동일월에 동일한 증빙으로 이중 청구",
    "count": 128,
    "exceptions": [ ... ]
  },
  "scenario2": { ... },
  "scenario3": { ... },
  "scenario4": { ... },
  "scenario5": { ... },
  "scenario6": { ... }
}
```

---

### POST /api/upload

CSV 파일 업로드로 데이터 갱신.

**Request:** `multipart/form-data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `tb_file` | File | 시산표 CSV |
| `je_file` | File | 전표 CSV |

**Response 200:**
```json
{
  "status": "success",
  "message": "데이터가 성공적으로 업로드 및 처리되었습니다.",
  "summary": {
    "revenue": 133930227921,
    "plItems": 37,
    "bsItems": 32
  }
}
```

---

## 에러 응답

모든 에러는 아래 형태로 반환됩니다:

```json
{
  "detail": "에러 메시지"
}
```

| 상태 코드 | 의미 |
|----------|------|
| 404 | 데이터 미로드 또는 리소스 없음 |
| 500 | 서버 처리 실패 |
