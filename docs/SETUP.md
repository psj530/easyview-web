# 환경 설정 가이드 (SETUP)

> 신규 합류자를 위한 개발 환경 구성 가이드

---

## 1. 전제조건

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 확인 명령어 | 설치 링크 |
|-----------|----------|-----------|---------|
| **Node.js** | 18.0+ | `node --version` | https://nodejs.org |
| **npm** | 9.0+ | `npm --version` | Node.js와 함께 설치됨 |
| **Python** | 3.10+ | `python --version` | https://python.org |
| **pip** | 23.0+ | `pip --version` | Python과 함께 설치됨 |
| **Git** | 2.30+ | `git --version` | https://git-scm.com |

### 선택 소프트웨어

| 소프트웨어 | 용도 | 비고 |
|-----------|------|------|
| VS Code | 코드 편집기 | 권장 |
| GitHub CLI (gh) | GitHub 작업 자동화 | 선택 |

### 권장 VS Code 확장

```
# 설치 명령어
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension dbaeumer.vscode-eslint
```

---

## 2. 프로젝트 클론

```bash
git clone https://github.com/psj530/easyview-web.git
cd easyview-web
```

---

## 3. 백엔드 설정

```bash
cd backend

# (권장) 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 실행 확인
python run.py
```

정상 실행 시 출력:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 확인
- 브라우저에서 http://localhost:8000/docs 접속 → Swagger UI 표시
- http://localhost:8000/api/health → `{"status":"ok","loaded":true}`

---

## 4. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

정상 실행 시 출력:
```
▲ Next.js 16.x
- Local: http://localhost:3000
✓ Ready
```

### 확인
- 브라우저에서 http://localhost:3000 접속 → 홈페이지 표시
- http://localhost:3000/dashboard → 대시보드 표시 (백엔드 실행 필요)

---

## 5. 전체 실행 순서

```
터미널 1 (백엔드):
  cd backend && python run.py

터미널 2 (프론트엔드):
  cd frontend && npm run dev

브라우저:
  http://localhost:3000
```

> **주의:** 프론트엔드는 백엔드가 실행 중이어야 데이터를 표시합니다.
> 반드시 백엔드를 먼저 실행하세요.

---

## 6. 데이터 파일

프로젝트에 샘플 데이터가 포함되어 있습니다:

| 파일 | 위치 | 내용 |
|------|------|------|
| TB.csv | `backend/input/TB.csv` | 시산표 (83개 계정, 기초잔액) |
| JE.csv | `backend/input/JE.csv` | 전표 (134,784건, 2024.01~2025.09) |

다른 고객사 데이터를 사용하려면 [DATA_SPEC.md](DATA_SPEC.md)의 CSV 컬럼 규격을 참고하세요.

---

## 7. 문제 해결

### "데이터가 로드되지 않았습니다" 오류
- 백엔드가 실행 중인지 확인
- `backend/input/` 폴더에 TB.csv, JE.csv 파일이 있는지 확인

### 프론트엔드에서 데이터가 표시되지 않음
- 백엔드가 http://localhost:8000 에서 실행 중인지 확인
- 브라우저 개발자도구(F12) > Network 탭에서 API 호출 확인

### npm install 실패
- Node.js 버전 확인: `node --version` (18.0 이상 필요)
- 캐시 삭제 후 재설치: `npm cache clean --force && npm install`

### Python 패키지 설치 실패
- Python 버전 확인: `python --version` (3.10 이상 필요)
- pip 업그레이드: `pip install --upgrade pip`
