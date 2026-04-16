# 개발 가이드 (DEVELOPMENT)

> 코드 구조, 개발 컨벤션, 주요 모듈 설명

---

## 1. 아키텍처 개요

```
┌─────────────────┐      HTTP/JSON      ┌─────────────────┐
│   Next.js       │ ◄──────────────────► │   FastAPI        │
│   (Frontend)    │     /api/*           │   (Backend)      │
│   Port 3000     │                      │   Port 8000      │
└─────────────────┘                      └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │   CSV Files      │
                                         │   (TB, JE)       │
                                         └─────────────────┘
```

- **프론트엔드**: Next.js App Router, 클라이언트 컴포넌트로 차트/인터랙션 처리
- **백엔드**: FastAPI가 CSV를 읽어 JSON으로 가공, REST API로 제공
- **데이터 흐름**: CSV → DataProcessor → JSON → FastAPI → Next.js → Chart.js

---

## 2. 백엔드 구조

### 파일 역할

| 파일 | 역할 |
|------|------|
| `main.py` | FastAPI 앱, 라우트 정의, CORS 설정 |
| `data_processor.py` | CSV 파싱, PL/BS 집계, 시나리오 분석 로직 |
| `run.py` | uvicorn 실행 스크립트 |
| `requirements.txt` | Python 의존성 목록 |

### DataProcessor 클래스

```python
processor = DataProcessor(input_dir)
processor.try_load()        # input/ 폴더에서 자동 탐색 및 로드
processor.load(tb, je)      # 명시적 파일 경로로 로드
processor.data              # 가공된 전체 데이터 (dict)
processor.is_loaded         # 로드 상태 (bool)
```

### 데이터 가공 흐름

1. **TB 읽기**: 시산표에서 83개 계정의 기초잔액 추출
2. **JE 읽기**: 134,784건의 전표를 파싱
3. **PL 집계**: 공시용계정/관리계정 기준 손익 집계 (당기 vs 전기)
4. **BS 계산**: 기초잔액 + JE 이동분 = 기말잔액
5. **시나리오**: 6가지 Exception 룰 기반 전표 탐지
6. **매출분석**: 거래처별 매출, TOP 증가/감소
7. **전표분석**: 계정별/거래처별 차변/대변 합계

### API 엔드포인트 추가 방법

```python
# main.py에 추가
@app.get("/api/new-endpoint")
async def new_endpoint():
    if not processor.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    # processor.data에서 필요한 데이터 추출/가공
    return {"result": "..."}
```

---

## 3. 프론트엔드 구조

### 디렉토리 구조

```
src/
├── app/
│   ├── layout.tsx            # 루트 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx              # 홈페이지 (/)
│   ├── globals.css           # Tailwind + PwC 커스텀 색상
│   └── dashboard/
│       ├── layout.tsx        # 대시보드 레이아웃 (헤더, 회사명)
│       └── page.tsx          # 대시보드 (/dashboard) - 5탭 네비게이션
│
├── components/
│   ├── dashboard/
│   │   ├── Summary.tsx       # Summary 탭
│   │   ├── PLAnalysis.tsx    # 손익분석 탭 (4개 서브탭)
│   │   ├── BSAnalysis.tsx    # 재무상태분석 탭 (2개 서브탭)
│   │   ├── JournalAnalysis.tsx  # 전표분석 탭
│   │   └── ScenarioAnalysis.tsx # 시나리오분석 탭 (6개 시나리오)
│   └── charts/
│       ├── ChartSetup.ts     # Chart.js 전역 등록
│       ├── BarChart.tsx      # 바 차트 래퍼
│       ├── LineChart.tsx     # 라인 차트 래퍼
│       └── DoughnutChart.tsx # 도넛 차트 래퍼
│
└── lib/
    ├── api.ts                # API 클라이언트 (fetch 래퍼, 타입 정의)
    └── utils.ts              # 숫자 포맷팅 유틸리티
```

### 주요 컨벤션

- **'use client'**: 차트, 상태, 인터랙션이 있는 컴포넌트에 필수
- **데이터 fetching**: `lib/api.ts`의 함수를 사용 (`fetchFullData`, `fetchSummary` 등)
- **숫자 포맷**: `lib/utils.ts`의 `formatNumber`, `formatMillions`, `formatPercent` 사용
- **스타일링**: Tailwind CSS 클래스 사용, PwC 색상은 `globals.css`에 정의

### PwC 커스텀 색상 (Tailwind)

```css
/* globals.css에 정의됨 */
--pwc-orange: #D04A02;
--pwc-orange-dark: #B8420A;
--pwc-black: #2D2D2D;
--pwc-gray: #6D6D6D;
--pwc-gray-dark: #464646;
--pwc-gray-light: #DEDEDE;
--pwc-gray-bg: #F5F5F5;
```

### 새 대시보드 컴포넌트 추가 방법

1. `src/components/dashboard/NewTab.tsx` 생성
2. `'use client'` 디렉티브 추가
3. `lib/api.ts`에서 데이터 fetch
4. `app/dashboard/page.tsx`의 탭 목록에 추가

---

## 4. 개발 워크플로우

### 브랜치 전략

```
main          ← 프로덕션 (Vercel/Render 자동 배포)
└── feature/* ← 기능 개발
└── fix/*     ← 버그 수정
```

### 커밋 컨벤션

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (기능 변경 없음)
refactor: 리팩토링
```

### PR 체크리스트

- [ ] `npm run build` 성공
- [ ] 백엔드 API 정상 응답 확인
- [ ] 새 기능의 경우 해당 문서 업데이트
