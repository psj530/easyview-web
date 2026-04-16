# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - FastAPI Backend
Serves financial data from SQLite database as REST API endpoints.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import shutil
import smtplib
import ssl
from email.message import EmailMessage
from datetime import datetime

from database import Database
from auth import auth_db, verify_jwt

app = FastAPI(
    title="Easy View API",
    description="PwC Worldwide Easy View 3.0 Backend API",
    version="3.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
        os.environ.get("FRONTEND_URL", ""),
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "input")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# Global database
db = Database(BASE_DIR)


def _get_env_setting(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.environ.get(name, default)
    if value is not None:
        value = value.strip()
    return value or default


def _send_demo_notification(request_data: dict) -> bool:
    smtp_host = _get_env_setting("SMTP_HOST")
    smtp_port = int(_get_env_setting("SMTP_PORT", "587"))
    smtp_user = _get_env_setting("SMTP_USER")
    smtp_password = _get_env_setting("SMTP_PASSWORD")
    smtp_from = _get_env_setting("SMTP_FROM", "kr_easyview@pwc.com")
    notify_to = _get_env_setting("DEMO_NOTIFICATION_RECIPIENT", "kr_easyview@pwc.com")
    use_ssl = _get_env_setting("SMTP_USE_SSL", "false").lower() in ("1", "true", "yes")

    if not smtp_host or not smtp_user or not smtp_password:
        print("[Demo Notification] SMTP 설정 불완전: 이메일을 전송하지 않습니다.")
        return False

    message = EmailMessage()
    message["Subject"] = f"Easy View Demo Request - {request_data['company']}"
    message["From"] = smtp_from
    message["To"] = notify_to
    body = (
        f"Easy View 데모 요청이 접수되었습니다.\n\n"
        f"Name: {request_data['name']}\n"
        f"Company: {request_data['company']}\n"
        f"Email: {request_data['email']}\n"
        f"Phone: {request_data['phone']}\n"
        f"Requested at: {request_data['created_at']}\n"
    )
    message.set_content(body)

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ssl.create_default_context()) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls(context=ssl.create_default_context())
                server.login(smtp_user, smtp_password)
                server.send_message(message)
        return True
    except Exception as err:
        print(f"[Demo Notification] 이메일 전송 실패: {err}")
        return False


# ===== Auth Dependency =====
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and verify JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")
    token = authorization.split(" ", 1)[1]
    payload = verify_jwt(token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    return payload


@app.on_event("startup")
async def startup():
    """Load data on startup from existing DB or CSV files."""
    db.try_load(INPUT_DIR)


# ===== Auth Endpoints =====
@app.post("/api/auth/login")
async def login(body: dict):
    """User login with email and password."""
    email = body.get("email", "")
    password = body.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="이메일과 비밀번호를 입력해주세요.")

    result = auth_db.login(email, password)
    if not result:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    return result


@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    """Get current user info and companies."""
    user_info = auth_db.get_user_by_id(user["user_id"])
    if not user_info:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    companies = auth_db.get_user_companies(user["user_id"])
    return {"user": user_info, "companies": companies}


@app.get("/api/auth/companies")
async def get_companies(user=Depends(get_current_user)):
    """Get companies accessible by the current user."""
    return {"companies": auth_db.get_user_companies(user["user_id"])}


@app.get("/api/reports")
async def get_reports(user=Depends(get_current_user)):
    """Get all reports accessible by the current user."""
    reports = auth_db.get_user_reports(user["user_id"])
    return {"reports": reports}


# ===== Health Check =====
@app.get("/api/health")
async def health():
    return {"status": "ok", "loaded": db.is_loaded}


# ===== Full Financial Data =====
@app.get("/api/data")
async def get_financial_data(
    period: Optional[str] = Query("ytd", description="비교기간: ytd(전년누적), yoy_month(전년동월), mom(전월비교)"),
    month: Optional[str] = Query(None, description="기준월 (예: 2025-09)"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터가 로드되지 않았습니다. CSV 파일을 업로드해주세요.")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    data = db.get_full_data(period, month)
    data["filter"] = {"period": period, "month": month}
    return data


# ===== Available Months =====
@app.get("/api/months")
async def get_months():
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return {"months": db.get_available_months()}


# ===== Summary =====
@app.get("/api/summary")
async def get_summary(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
    bs_compare: Optional[str] = Query("year_start", description="BS 비교대상: year_start(연초), month_start(월초)"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    summary = db.get_summary_data(period, month, bs_compare)
    summary["filter"] = {"period": period, "month": month, "bsCompare": bs_compare}
    return summary


# ===== PL (Income Statement) =====
@app.get("/api/pl")
async def get_pl(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    pl = db.get_pl_data(period, month)
    pl["filter"] = {"period": period, "month": month}
    return pl


# ===== BS (Balance Sheet) =====
@app.get("/api/bs")
async def get_bs(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
    bs_compare: Optional[str] = Query("year_start", description="BS 비교대상: year_start(연초), month_start(월초)"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    bs = db.get_bs_data(period, month, bs_compare)
    return bs


# ===== Sales Analysis =====
@app.get("/api/sales")
async def get_sales(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    return db.get_sales_data(period, month)


# ===== Journal =====
@app.get("/api/journal")
async def get_journal(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    return db.get_journal_data(period, month)


# ===== Scenarios =====
@app.get("/api/scenarios")
async def get_scenarios(
    period: Optional[str] = Query("ytd", description="비교기간"),
    month: Optional[str] = Query(None, description="기준월"),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    return db.get_scenario_data(period, month)


@app.get("/api/scenarios/{scenario_id}")
async def get_scenario(
    scenario_id: str,
    period: Optional[str] = Query("ytd"),
    month: Optional[str] = Query(None),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    scenarios = db.get_scenario_data(period, month)
    if scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail=f"시나리오 '{scenario_id}' 없음")
    return scenarios[scenario_id]


# ===== Journal Search =====
@app.get("/api/journal/search")
async def journal_search(
    startDate: Optional[str] = Query("2024-01-01"),
    endDate: Optional[str] = Query("2025-09-30"),
    account: Optional[str] = Query(""),
    customer: Optional[str] = Query(""),
    memo: Optional[str] = Query(""),
    page: Optional[int] = Query(1),
    pageSize: Optional[int] = Query(50),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return db.get_journal_search(startDate, endDate, account, customer, memo, page, pageSize)


# ===== BS Account Detail =====
@app.get("/api/bs/account")
async def bs_account_detail(
    account: str = Query(..., description="계정명"),
    period: Optional[str] = Query("ytd"),
    month: Optional[str] = Query(None),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    if not month:
        months = db.get_available_months()
        month = months[-1] if months else "2025-09"
    return db.get_bs_account_detail(account, period, month)


# ===== PL Journal Entries (drill-down) =====
@app.get("/api/pl/journal")
async def pl_journal_entries(
    monthKey: str = Query(..., description="월 (예: 2025-07)"),
    disclosure: Optional[str] = Query(""),
    limit: Optional[int] = Query(50),
):
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return db.get_pl_journal_entries(monthKey, disclosure, limit)


# ===== CSV Upload (legacy - no auth) =====
@app.post("/api/upload")
async def upload_csv(
    tb_file: UploadFile = File(..., description="시산표 CSV"),
    je_file: UploadFile = File(..., description="전표 CSV"),
):
    """Upload TB and JE CSV files and rebuild SQLite database."""
    try:
        tb_path = os.path.join(INPUT_DIR, "TB.csv")
        with open(tb_path, "wb") as f:
            shutil.copyfileobj(tb_file.file, f)

        je_path = os.path.join(INPUT_DIR, "JE.csv")
        with open(je_path, "wb") as f:
            shutil.copyfileobj(je_file.file, f)

        # Rebuild DB
        db.import_csv(tb_path, je_path)

        # Quick validation
        pl = db.get_pl_data()
        return {
            "status": "success",
            "message": "데이터가 성공적으로 업로드 및 처리되었습니다.",
            "summary": {
                "revenue": pl['revenue']['current'],
                "plItems": len(pl['plItems']),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"처리 실패: {str(e)}")


# ===== Enhanced Upload (with auth & 4 file categories) =====
@app.post("/api/upload/v2")
async def upload_files(
    company_code: str = Query(..., description="회사 코드"),
    year: str = Query(..., description="결산연도"),
    month: str = Query(..., description="결산월"),
    je_file: UploadFile = File(..., description="분개장(JE) 또는 계정별원장(GL) - 필수"),
    tb_file: UploadFile = File(..., description="시산표(TB) - 필수"),
    bs_file: Optional[UploadFile] = None,
    etc_file: Optional[UploadFile] = None,
    user=Depends(get_current_user),
):
    """Upload financial data files with company and period context."""
    import traceback

    # Verify company access
    if not auth_db.verify_company_access(user["user_id"], company_code):
        raise HTTPException(status_code=403, detail="해당 회사에 대한 접근 권한이 없습니다.")

    try:
        # Create company-specific directory
        company_dir = os.path.join(INPUT_DIR, company_code, f"{year}-{month.zfill(2)}")
        os.makedirs(company_dir, exist_ok=True)

        uploaded_files = []

        # 1. JE/GL (required)
        je_path = os.path.join(company_dir, "JE.csv")
        with open(je_path, "wb") as f:
            shutil.copyfileobj(je_file.file, f)
        uploaded_files.append({"type": "JE/GL", "name": je_file.filename, "status": "uploaded"})

        # 2. TB (required)
        tb_path = os.path.join(company_dir, "TB.csv")
        with open(tb_path, "wb") as f:
            shutil.copyfileobj(tb_file.file, f)
        uploaded_files.append({"type": "TB", "name": tb_file.filename, "status": "uploaded"})

        # 3. BS/PL (optional)
        if bs_file and bs_file.filename:
            bs_path = os.path.join(company_dir, "BS_PL.csv")
            with open(bs_path, "wb") as f:
                shutil.copyfileobj(bs_file.file, f)
            uploaded_files.append({"type": "BS/PL", "name": bs_file.filename, "status": "uploaded"})

        # 4. Others (optional)
        if etc_file and etc_file.filename:
            etc_path = os.path.join(company_dir, f"ETC_{etc_file.filename}")
            with open(etc_path, "wb") as f:
                shutil.copyfileobj(etc_file.file, f)
            uploaded_files.append({"type": "기타", "name": etc_file.filename, "status": "uploaded"})

        # Also copy primary files to main input dir for current processing
        shutil.copy2(os.path.join(company_dir, "TB.csv"), os.path.join(INPUT_DIR, "TB.csv"))
        shutil.copy2(os.path.join(company_dir, "JE.csv"), os.path.join(INPUT_DIR, "JE.csv"))

        # Rebuild DB
        db.import_csv(
            os.path.join(INPUT_DIR, "TB.csv"),
            os.path.join(INPUT_DIR, "JE.csv"),
        )

        pl = db.get_pl_data()
        revenue = pl["revenue"]["current"]
        pl_items_count = len(pl["plItems"])

        companies = auth_db.get_user_companies(user["user_id"])
        comp = next((c for c in companies if c["code"] == company_code), None)
        if comp:
            auth_db.save_report(
                company_id=comp["id"], company_code=company_code,
                company_name=comp["name"], year=int(year), month=int(month),
                user_id=user["user_id"], user_name=user.get("name", ""),
                revenue=revenue, pl_items=pl_items_count,
            )

        return {
            "status": "success",
            "message": f"{company_code} 회사의 {year}년 {month}월 데이터가 성공적으로 처리되었습니다.",
            "company": company_code,
            "period": f"{year}-{month.zfill(2)}",
            "files": uploaded_files,
            "summary": {
                "revenue": revenue,
                "plItems": pl_items_count,
            },
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"처리 실패: {str(e)}")


# ===== Demo Request =====
@app.post("/api/demo-request")
async def demo_request(body: dict):
    """
    Handle demo request from the homepage.
    Receives user information, stores it in auth.db, and sends notification email.
    """
    try:
        required_fields = ["firstName", "lastName", "email", "phone", "company"]
        for field in required_fields:
            if field not in body or not str(body[field]).strip():
                raise HTTPException(status_code=400, detail=f"{field}는 필수 항목입니다.")

        first_name = str(body.get("firstName", "")).strip()
        last_name = str(body.get("lastName", "")).strip()
        email = str(body.get("email", "")).strip()
        phone = str(body.get("phone", "")).strip()
        company = str(body.get("company", "")).strip()
        created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        request_data = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "company": company,
            "note": str(body.get("note", "")).strip() if body.get("note") else None,
            "source": "homepage",
            "created_at": created_at,
        }

        saved = auth_db.save_demo_request(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            company=company,
            note=request_data["note"],
            source=request_data["source"],
        )

        email_sent = _send_demo_notification({
            "name": f"{last_name} {first_name}",
            "company": company,
            "email": email,
            "phone": phone,
            "created_at": created_at,
        })

        return {
            "status": "success",
            "message": "데모 요청이 접수되었습니다. 빠르게 연락드리겠습니다.",
            "saved": saved,
            "emailSent": email_sent,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"요청 처리 실패: {str(e)}")


@app.get("/api/demo-requests")
async def get_demo_requests(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    requests = auth_db.get_demo_requests()
    return {"requests": requests}


# ===== Meta Info =====
@app.get("/api/meta")
async def get_meta():
    if not db.is_loaded:
        raise HTTPException(status_code=404, detail="데이터 미로드")
    return db.get_meta()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
