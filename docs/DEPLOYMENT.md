# 배포 가이드 (DEPLOYMENT)

> Vercel (프론트엔드) + Render (백엔드) 배포 절차

---

## 배포 아키텍처

```
사용자 브라우저
      │
      ▼
┌─────────────────┐     HTTPS/JSON     ┌─────────────────┐
│  Vercel          │ ◄────────────────► │  Render          │
│  (Next.js)       │                    │  (FastAPI)       │
│  *.vercel.app    │                    │  *.onrender.com  │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │  CSV 데이터       │
                                       │  (서버 내 저장)    │
                                       └─────────────────┘
```

---

## Phase 1. 백엔드 배포 (Render)

> 백엔드를 먼저 배포해야 프론트엔드에서 API URL을 설정할 수 있습니다.

### 1-1. Render 계정 생성
1. https://render.com 접속
2. **GitHub 계정으로 가입/로그인**

### 1-2. Web Service 생성
1. Dashboard에서 **"New +"** > **"Web Service"** 클릭
2. **"Build and deploy from a Git repository"** 선택
3. GitHub에서 `psj530/easyview-web` 저장소 연결

### 1-3. 서비스 설정

| 설정 항목 | 값 |
|----------|------|
| **Name** | `easyview-api` (또는 원하는 이름) |
| **Region** | Singapore (Asia 권장) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 1-4. 환경변수 (선택)

| Key | Value | 설명 |
|-----|-------|------|
| `FRONTEND_URL` | (Phase 2 완료 후 설정) | Vercel 배포 URL |

### 1-5. 배포
1. **"Create Web Service"** 클릭
2. 빌드 및 배포 완료까지 약 2~5분 소요
3. 배포 완료 후 URL 확인: `https://easyview-api.onrender.com` (예시)

### 1-6. 배포 확인
```
https://easyview-api.onrender.com/api/health
→ {"status":"ok","loaded":true}

https://easyview-api.onrender.com/docs
→ Swagger UI 표시
```

> **주의:** Render Free Tier는 15분 비활성 시 슬립 모드로 전환됩니다.
> 첫 요청 시 30초~1분 정도 시작 시간이 소요될 수 있습니다.

---

## Phase 2. 프론트엔드 배포 (Vercel)

### 2-1. Vercel 계정 생성
1. https://vercel.com 접속
2. **GitHub 계정으로 가입/로그인**

### 2-2. 프로젝트 생성
1. Dashboard에서 **"Add New..."** > **"Project"** 클릭
2. **"Import Git Repository"** 에서 `psj530/easyview-web` 선택

### 2-3. 프로젝트 설정

| 설정 항목 | 값 |
|----------|------|
| **Project Name** | `easyview-web` (또는 원하는 이름) |
| **Framework Preset** | Next.js (자동 감지) |
| **Root Directory** | `frontend` ← **반드시 변경** |

### 2-4. 환경변수 설정

**"Environment Variables"** 섹션에서:

| Key | Value | 설명 |
|-----|-------|------|
| `NEXT_PUBLIC_API_URL` | `https://easyview-api.onrender.com` | Phase 1에서 받은 Render URL |

> **중요:** `NEXT_PUBLIC_` 접두사가 반드시 필요합니다 (클라이언트에서 접근하기 위함)

### 2-5. 배포
1. **"Deploy"** 클릭
2. 빌드 및 배포 완료까지 약 1~2분 소요
3. 배포 완료 후 URL 확인: `https://easyview-web.vercel.app` (예시)

### 2-6. 배포 확인
- `https://easyview-web.vercel.app` → 홈페이지 표시
- `https://easyview-web.vercel.app/dashboard` → 대시보드에 데이터 표시

---

## Phase 3. 연결 확인 & 마무리

### 3-1. 전체 동작 확인

| 확인 항목 | URL | 예상 결과 |
|----------|-----|----------|
| 백엔드 Health | `https://easyview-api.onrender.com/api/health` | `{"status":"ok","loaded":true}` |
| 프론트엔드 홈 | `https://easyview-web.vercel.app` | 홈페이지 |
| 대시보드 | `https://easyview-web.vercel.app/dashboard` | 재무 데이터 표시 |
| API 문서 | `https://easyview-api.onrender.com/docs` | Swagger UI |

### 3-2. (선택) Render CORS 설정 업데이트
Render 환경변수에 Vercel URL 추가:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://easyview-web.vercel.app` |

### 3-3. (선택) 커스텀 도메인 연결
- **Vercel**: Settings > Domains > 커스텀 도메인 추가
- **Render**: Settings > Custom Domains > 도메인 추가

---

## 자동 배포 (CI/CD)

GitHub `main` 브랜치에 push하면:
- **Vercel**: 자동으로 프론트엔드 재빌드 및 배포
- **Render**: 자동으로 백엔드 재빌드 및 배포

```bash
# 코드 수정 후
git add -A
git commit -m "feat: 새 기능 추가"
git push origin main
# → Vercel + Render 자동 배포 트리거
```

---

## 데이터 업데이트 (운영)

### 방법 1: API 업로드 (서버 재시작 불필요)
```bash
curl -X POST https://easyview-api.onrender.com/api/upload \
  -F "tb_file=@새로운_TB.csv" \
  -F "je_file=@새로운_JE.csv"
```

### 방법 2: Git으로 파일 교체
1. `backend/input/TB.csv`, `JE.csv` 교체
2. `git push origin main`
3. Render 자동 재배포 → 새 데이터 로드

---

## 문제 해결

### 대시보드에 데이터가 표시되지 않음
1. Render 서비스가 실행 중인지 확인 (Sleep 모드일 수 있음)
2. 브라우저 개발자도구(F12) > Console에서 에러 확인
3. `NEXT_PUBLIC_API_URL` 환경변수가 올바른지 확인

### Render Free Tier 슬립 문제
- Free Tier는 15분 비활성 시 슬립
- 해결: Render Cron Job으로 5분마다 `/api/health` 호출
- 또는: Paid Plan ($7/월) 으로 업그레이드

### Vercel 빌드 실패
- Root Directory가 `frontend`로 설정되었는지 확인
- `npm run build`를 로컬에서 실행하여 에러 확인
