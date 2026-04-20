# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - FastAPI Backend
Serves financial data from SQLite database as REST API endpoints.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from typing import Optional, List
import os
import io
import zipfile
import shutil
import uuid
import smtplib
import ssl
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
DOCS_DIR = os.path.join(BASE_DIR, "documents")
os.makedirs(INPUT_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

# Email config (optional — set env vars to enable real sending)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@pwc.com")

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


# ===== Document Board =====

def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Send email via SMTP. Returns True if sent, False if SMTP not configured."""
    if not SMTP_HOST or not SMTP_USER:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(body, "html", "utf-8"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


@app.get("/api/documents/categories")
async def get_doc_categories(user=Depends(get_current_user)):
    return {"categories": auth_db.get_doc_categories()}


@app.post("/api/documents/categories")
async def add_doc_category(body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 카테고리를 추가할 수 있습니다.")
    name = body.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="카테고리명을 입력하세요.")
    try:
        cat = auth_db.add_doc_category(name, body.get("description", ""), int(body.get("is_required", 1)))
        return cat
    except Exception:
        raise HTTPException(status_code=400, detail="이미 존재하는 카테고리명입니다.")


@app.get("/api/documents")
async def get_doc_posts(
    category_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    period_year: Optional[int] = Query(None),
    required_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
):
    is_admin = user.get("role") == "admin"
    return auth_db.get_doc_posts(
        user_id=user["user_id"],
        is_admin=is_admin,
        category_id=category_id,
        company_id=company_id if is_admin else None,
        period_year=period_year,
        required_only=required_only,
        page=page,
        per_page=per_page,
    )


@app.get("/api/documents/years")
async def get_doc_years(user=Depends(get_current_user)):
    """Return distinct years available in doc_posts for period filter."""
    return {"years": auth_db.get_doc_post_years()}


@app.post("/api/documents")
async def create_doc_post(
    category_id: int = Form(...),
    title: str = Form(...),
    content: str = Form(""),
    company_id: Optional[int] = Form(None),
    period_start: str = Form(""),
    period_end: str = Form(""),
    file: Optional[UploadFile] = File(None),
    user=Depends(get_current_user),
):
    is_admin = user.get("role") == "admin"

    # Determine company
    if not is_admin:
        # Use user's first (and usually only) accessible company
        companies = auth_db.get_user_companies(user["user_id"])
        if not companies:
            raise HTTPException(status_code=403, detail="접근 가능한 회사가 없습니다.")
        comp = companies[0]
        company_id = comp["id"]
        company_name = comp["name"]
    else:
        if company_id:
            all_companies = auth_db.get_all_companies()
            comp = next((c for c in all_companies if c["id"] == company_id), None)
            company_name = comp["name"] if comp else ""
        else:
            company_name = "삼일회계법인"

    # Handle file upload
    file_name = ""
    file_path = ""
    file_size = 0
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1]
        safe_name = f"{uuid.uuid4().hex}{ext}"
        company_dir = os.path.join(DOCS_DIR, str(company_id or "admin"))
        os.makedirs(company_dir, exist_ok=True)
        dest = os.path.join(company_dir, safe_name)
        with open(dest, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)
        file_name = file.filename
        file_path = dest
        file_size = os.path.getsize(dest)

    result = auth_db.add_doc_post(
        category_id=category_id,
        title=title,
        content=content,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        company_id=company_id,
        company_name=company_name,
        author_id=user["user_id"],
        author_name=user.get("name", ""),
        period_start=period_start,
        period_end=period_end,
    )
    return result


@app.get("/api/documents/{post_id}")
async def get_doc_post(post_id: int, user=Depends(get_current_user)):
    post = auth_db.get_doc_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    return post


@app.delete("/api/documents/{post_id}")
async def delete_doc_post(post_id: int, user=Depends(get_current_user)):
    is_admin = user.get("role") == "admin"
    result = auth_db.delete_doc_post(post_id, user["user_id"], is_admin)
    if result is False:
        raise HTTPException(status_code=403, detail="삭제 권한이 없거나 게시물이 존재하지 않습니다.")
    # Cleanup file
    if result and isinstance(result, str) and os.path.exists(result):
        os.remove(result)
    return {"status": "deleted"}


@app.get("/api/documents/{post_id}/download")
async def download_doc_file(post_id: int, user=Depends(get_current_user)):
    info = auth_db.get_doc_file_path(post_id)
    if not info:
        raise HTTPException(status_code=404, detail="게시물을 찾을 수 없습니다.")
    if not info["file_path"] or not os.path.exists(info["file_path"]):
        raise HTTPException(status_code=404, detail="파일이 존재하지 않습니다.")
    return FileResponse(
        path=info["file_path"],
        filename=info["file_name"],
        media_type="application/octet-stream",
    )


@app.get("/api/documents/admin/status")
async def get_submission_status(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return {"status": auth_db.get_submission_status()}


@app.get("/api/documents/admin/monthly-status")
async def get_monthly_status(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return {"companies": auth_db.get_monthly_status(user_id=user["user_id"])}


@app.get("/api/documents/admin/periods")
async def get_periods(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    return {"periods": auth_db.get_periods()}


@app.post("/api/documents/admin/periods")
async def create_period(body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    period = body.get("period", "").strip()   # "2026-05"
    label = body.get("label", "").strip()     # "2026년 5월"
    due_date = body.get("due_date", "").strip()
    if not period or not label:
        raise HTTPException(status_code=400, detail="period와 label은 필수입니다.")
    try:
        new_id = auth_db.create_period(period, label, due_date, user["user_id"])
        return {"id": new_id, "period": period, "label": label}
    except Exception as e:
        if "UNIQUE" in str(e):
            raise HTTPException(status_code=409, detail="이미 존재하는 기간입니다.")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/documents/admin/periods/{period_id}")
async def delete_period(period_id: int, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    auth_db.delete_period(period_id)
    return {"status": "deleted"}


@app.post("/api/documents/admin/request")
async def create_doc_request(body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    category_id = body.get("category_id")
    company_id = body.get("company_id")
    due_date = body.get("due_date", "")
    message = body.get("message", "")
    period_id = body.get("period_id")
    if not category_id or not company_id:
        raise HTTPException(status_code=400, detail="카테고리와 회사를 선택하세요.")

    # Look up company name
    all_companies = auth_db.get_all_companies()
    comp = next((c for c in all_companies if c["id"] == company_id), None)
    if not comp:
        raise HTTPException(status_code=404, detail="회사를 찾을 수 없습니다.")

    req = auth_db.add_doc_request(
        category_id=category_id,
        company_id=company_id,
        company_name=comp["name"],
        due_date=due_date,
        message=message,
        created_by=user["user_id"],
        created_by_name=user.get("name", ""),
        period_id=period_id,
    )
    return req


@app.post("/api/documents/admin/request/{request_id}/send-email")
async def send_request_email(
    request_id: int,
    body: dict,
    user=Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")

    to_email = body.get("to_email", "")
    to_name = body.get("to_name", "")
    subject = body.get("subject", "")
    email_body = body.get("body", "")

    if not to_email:
        raise HTTPException(status_code=400, detail="수신자 이메일을 입력하세요.")

    sent = _send_email(to_email, subject, email_body)
    auth_db.mark_email_sent(request_id, requestee_email=to_email, requestee_name=to_name)

    return {
        "status": "sent" if sent else "logged",
        "message": "이메일이 발송되었습니다." if sent else "요청이 저장되었습니다. (SMTP 미설정 — 실제 발송 없음)",
    }


@app.delete("/api/documents/admin/requests/{request_id}")
async def delete_doc_request(request_id: int, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    conn = auth_db._get_conn()
    try:
        conn.execute("DELETE FROM doc_requests WHERE id = ?", (request_id,))
        conn.commit()
    finally:
        conn.close()
    return {"status": "deleted"}


@app.patch("/api/documents/admin/requests/{request_id}")
async def update_doc_request(request_id: int, body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    due_date = body.get("due_date", "").strip()
    conn = auth_db._get_conn()
    try:
        conn.execute("UPDATE doc_requests SET due_date = ? WHERE id = ?", (due_date, request_id))
        conn.commit()
    finally:
        conn.close()
    return {"status": "updated"}


@app.post("/api/documents/admin/files/{post_id}/reject")
async def reject_doc_file(post_id: int, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    auth_db.reject_file(post_id)
    return {"status": "rejected"}


@app.patch("/api/documents/admin/periods/{period_id}")
async def update_period(period_id: int, body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    due_date = body.get("due_date", "").strip()
    auth_db.update_period(period_id, due_date)
    return {"status": "updated"}


@app.patch("/api/documents/admin/company/{company_id}/period/{period_id}/due-date")
async def bulk_update_company_period_due_date(company_id: int, period_id: int, body: dict, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    due_date = body.get("due_date", "").strip()
    auth_db.bulk_update_due_date(company_id, period_id, due_date)
    return {"status": "updated"}


@app.delete("/api/documents/admin/company/{company_id}/period/{period_id}/requests")
async def delete_company_period_requests(company_id: int, period_id: int, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    auth_db.delete_company_period_requests(company_id, period_id)
    return {"status": "deleted"}


@app.post("/api/documents/admin/bulk-request/{company_id}/{period}")
async def bulk_create_requests(company_id: int, period: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    new_ids = auth_db.bulk_create_requests(
        company_id=company_id,
        period=period,
        created_by=user["user_id"],
        created_by_name=user.get("name", ""),
    )
    return {"created": len(new_ids), "ids": new_ids}


@app.post("/api/documents/admin/bulk-request-all/{period}")
async def bulk_create_requests_all(period: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    companies = auth_db.get_all_companies()
    total_created = 0
    for company in companies:
        new_ids = auth_db.bulk_create_requests(
            company_id=company["id"],
            period=period,
            created_by=user["user_id"],
            created_by_name=user.get("name", ""),
        )
        total_created += len(new_ids)
    return {"created": total_created}


@app.get("/api/documents/requests/{request_id}/files")
async def get_request_files(request_id: int, user=Depends(get_current_user)):
    return {"files": auth_db.get_files_for_request(request_id)}


@app.get("/api/documents/requests/{request_id}/comments")
async def get_comments(request_id: int, user=Depends(get_current_user)):
    return {"comments": auth_db.get_comments(request_id)}


@app.post("/api/documents/requests/{request_id}/comments")
async def add_comment(request_id: int, body: dict, user=Depends(get_current_user)):
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="내용을 입력하세요.")
    comment = auth_db.add_comment(
        request_id=request_id,
        author_id=user["user_id"],
        author_name=user.get("name", user.get("email", "")),
        author_role=user.get("role", "user"),
        content=content,
    )
    return comment


@app.post("/api/documents/requests/{request_id}/comments/read")
async def mark_comments_read(request_id: int, user=Depends(get_current_user)):
    auth_db.mark_comments_read(user_id=user["user_id"], request_id=request_id)
    return {"status": "ok"}


@app.patch("/api/documents/comments/{comment_id}")
async def edit_comment(comment_id: int, body: dict, user=Depends(get_current_user)):
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="내용을 입력하세요.")
    updated = auth_db.edit_comment(comment_id=comment_id, user_id=user["user_id"], content=content)
    if updated is None:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    return updated


@app.delete("/api/documents/comments/{comment_id}")
async def delete_comment(comment_id: int, user=Depends(get_current_user)):
    ok = auth_db.delete_comment(
        comment_id=comment_id,
        user_id=user["user_id"],
        is_admin=user.get("role") == "admin",
    )
    if not ok:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    return {"status": "ok"}


@app.get("/api/documents/admin/download-zip/{company_id}/{period}")
async def download_period_zip(company_id: int, period: str, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    files = auth_db.get_files_for_period(company_id, period)
    if not files:
        raise HTTPException(status_code=404, detail="다운로드할 파일이 없습니다.")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            if f["file_path"] and os.path.exists(f["file_path"]):
                arcname = f"{f['category_name']}_{f['file_name'] or f['title']}"
                zf.write(f["file_path"], arcname=arcname)
    buf.seek(0)

    zip_name = f"{period}_files.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_name}"'},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
