# -*- coding: utf-8 -*-
"""
PwC Easy View 3.0 - Authentication Module
Handles user management, JWT tokens, and company access control.
"""

import sqlite3
import hashlib
import hmac
import os
import json
import time
import base64
from typing import Optional, Dict, List
from datetime import datetime

AUTH_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auth.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "easyview-secret-key-change-in-production")
JWT_EXPIRY = 7 * 24 * 60 * 60  # 7 days


def _hash_password(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
    """Hash password with PBKDF2-HMAC-SHA256."""
    if salt is None:
        salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return base64.b64encode(salt).decode(), base64.b64encode(key).decode()


def _verify_password(password: str, salt_b64: str, hash_b64: str) -> bool:
    """Verify password against stored hash."""
    salt = base64.b64decode(salt_b64)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return hmac.compare_digest(base64.b64encode(key).decode(), hash_b64)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict) -> str:
    """Create a simple JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload["exp"] = int(time.time()) + JWT_EXPIRY
    payload["iat"] = int(time.time())

    h = _b64url_encode(json.dumps(header).encode())
    p = _b64url_encode(json.dumps(payload).encode())
    signature = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
    s = _b64url_encode(signature)
    return f"{h}.{p}.{s}"


def verify_jwt(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        h, p, s = parts
        expected_sig = hmac.new(JWT_SECRET.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()
        actual_sig = _b64url_decode(s)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64url_decode(p))
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


class AuthDB:
    """Manages user authentication and company access control."""

    def __init__(self, db_path: str = AUTH_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self):
        conn = self._get_conn()
        try:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    department TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now')),
                    last_login TEXT
                );

                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    country TEXT DEFAULT '',
                    erp_system TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS user_companies (
                    user_id INTEGER NOT NULL,
                    company_id INTEGER NOT NULL,
                    role TEXT DEFAULT 'viewer',
                    PRIMARY KEY (user_id, company_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER NOT NULL,
                    company_code TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    created_by INTEGER NOT NULL,
                    created_by_name TEXT NOT NULL,
                    revenue REAL,
                    pl_items INTEGER,
                    created_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (company_id) REFERENCES companies(id),
                    FOREIGN KEY (created_by) REFERENCES users(id)
                );
                CREATE TABLE IF NOT EXISTS demo_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    company TEXT NOT NULL,
                    note TEXT,
                    source TEXT NOT NULL DEFAULT 'web',
                    created_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS doc_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT DEFAULT '',
                    is_required INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS doc_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT DEFAULT '',
                    file_name TEXT DEFAULT '',
                    file_path TEXT DEFAULT '',
                    file_size INTEGER DEFAULT 0,
                    company_id INTEGER,
                    company_name TEXT DEFAULT '',
                    author_id INTEGER NOT NULL,
                    author_name TEXT NOT NULL,
                    view_count INTEGER DEFAULT 0,
                    period_start TEXT DEFAULT '',
                    period_end TEXT DEFAULT '',
                    created_at TEXT DEFAULT (datetime('now')),
                    updated_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (category_id) REFERENCES doc_categories(id),
                    FOREIGN KEY (company_id) REFERENCES companies(id),
                    FOREIGN KEY (author_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS doc_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    company_id INTEGER NOT NULL,
                    company_name TEXT NOT NULL,
                    due_date TEXT NOT NULL,
                    message TEXT DEFAULT '',
                    created_by INTEGER NOT NULL,
                    created_by_name TEXT NOT NULL,
                    created_at TEXT DEFAULT (datetime('now')),
                    email_sent_at TEXT DEFAULT NULL,
                    FOREIGN KEY (category_id) REFERENCES doc_categories(id),
                    FOREIGN KEY (company_id) REFERENCES companies(id),
                    FOREIGN KEY (created_by) REFERENCES users(id)
                );
            """)

            # Migration: add new columns to existing tables (safe — ignored if already exist)
            for sql in [
                "ALTER TABLE companies ADD COLUMN country TEXT DEFAULT ''",
                "ALTER TABLE companies ADD COLUMN erp_system TEXT DEFAULT ''",
                "ALTER TABLE doc_categories ADD COLUMN is_required INTEGER DEFAULT 1",
                "ALTER TABLE doc_posts ADD COLUMN period_start TEXT DEFAULT ''",
                "ALTER TABLE doc_posts ADD COLUMN period_end TEXT DEFAULT ''",
            ]:
                try:
                    conn.execute(sql)
                except Exception:
                    pass
            conn.commit()

            # Seed default admin and sample data if empty
            cursor = conn.execute("SELECT COUNT(*) FROM users")
            if cursor.fetchone()[0] == 0:
                self._seed_data(conn)

            # Seed doc_categories if empty
            cursor = conn.execute("SELECT COUNT(*) FROM doc_categories")
            if cursor.fetchone()[0] == 0:
                self._seed_doc_categories(conn)

            conn.commit()
        finally:
            conn.close()

    def _seed_data(self, conn: sqlite3.Connection):
        """Seed initial admin user and sample companies."""
        # Admin user: admin@samil.com / admin1234
        salt, pw_hash = _hash_password("admin1234")
        conn.execute(
            "INSERT INTO users (email, password_salt, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin@samil.com", salt, pw_hash, "관리자", "admin", "감사본부"),
        )

        # Sample user: user@samil.com / user1234
        salt2, pw_hash2 = _hash_password("user1234")
        conn.execute(
            "INSERT INTO users (email, password_salt, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?)",
            ("user@samil.com", salt2, pw_hash2, "박수정", "user", "감사본부"),
        )

        # Sample companies (name, code, country, erp_system)
        conn.execute("INSERT INTO companies (name, code, country, erp_system) VALUES (?, ?, ?, ?)", ("ABC Company", "ABC", "한국", "SAP"))
        conn.execute("INSERT INTO companies (name, code, country, erp_system) VALUES (?, ?, ?, ?)", ("XYZ Corporation", "XYZ", "미국", "QuickBooks"))
        conn.execute("INSERT INTO companies (name, code, country, erp_system) VALUES (?, ?, ?, ?)", ("삼일전자", "SE001", "한국", "더존"))

        # Assign companies to users (admin gets all, user gets ABC only)
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 1, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 2, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (1, 3, 'admin')")
        conn.execute("INSERT INTO user_companies (user_id, company_id, role) VALUES (2, 1, 'viewer')")

        # Sample reports
        conn.execute(
            "INSERT INTO reports (company_id, company_code, company_name, year, month, created_by, created_by_name, revenue, pl_items, created_at) VALUES (1,'ABC','ABC Company',2025,9,1,'관리자',133930227921,38,'2025-10-15 09:30:00')"
        )
        conn.execute(
            "INSERT INTO reports (company_id, company_code, company_name, year, month, created_by, created_by_name, revenue, pl_items, created_at) VALUES (1,'ABC','ABC Company',2025,8,2,'박수정',128500000000,38,'2025-09-12 14:20:00')"
        )

    def _seed_doc_categories(self, conn: sqlite3.Connection):
        """Seed default document categories matching actual data request structure."""
        # (name, description, is_required)
        categories = [
            ("전표 (JE/GL)", "기초~결산월 누적 전표 (General Ledger / Journal Entry). SAP: BKPF·ACDOCA 등", 1),
            ("시산표 (Trial Balance)", "기초~결산월 누적 계정별 잔액. SAP: T-Code S_ALR_87012277 또는 F.08", 1),
            ("재무상태표/손익계산서 (BS/PL)", "회계기간 전체 BS 및 PL 데이터", 1),
            ("거래처 코드 Mapping", "판매처·구매처 코드-거래처명 매핑 테이블 (KUNNR, LIFNR)", 0),
            ("Cost Center 배부기준", "원가/보조부서 제조원가 배부기준 (RCNTR)", 0),
            ("계정과목표 (Chart of Accounts)", "계정과목 레벨 정보 또는 GL mapping table (SKAS, SKAT)", 0),
            ("세미커넥터 전표", "본사 해외법인 전표 (세미커넥터 방식)", 0),
            ("기타", "위 항목에 해당하지 않는 기타 자료", 0),
        ]
        for name, desc, required in categories:
            conn.execute(
                "INSERT INTO doc_categories (name, description, is_required) VALUES (?, ?, ?)",
                (name, desc, required),
            )

    # ===== Documents =====

    def get_doc_categories(self) -> List[Dict]:
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT id, name, description, is_required, created_at FROM doc_categories ORDER BY is_required DESC, id")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def add_doc_category(self, name: str, description: str = "") -> Dict:
        conn = self._get_conn()
        try:
            conn.execute(
                "INSERT INTO doc_categories (name, description) VALUES (?, ?)",
                (name, description),
            )
            conn.commit()
            cat_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": cat_id, "name": name, "description": description}
        finally:
            conn.close()

    def get_doc_posts(
        self,
        user_id: int,
        is_admin: bool,
        category_id: Optional[int] = None,
        company_id: Optional[int] = None,
        period_year: Optional[int] = None,
        required_only: bool = False,
        page: int = 1,
        per_page: int = 20,
    ) -> Dict:
        conn = self._get_conn()
        try:
            conditions = []
            params = []

            if not is_admin:
                # Non-admin: only see posts from their accessible companies
                conditions.append("""
                    p.company_id IN (
                        SELECT company_id FROM user_companies WHERE user_id = ?
                    )
                """)
                params.append(user_id)

            if category_id:
                conditions.append("p.category_id = ?")
                params.append(category_id)

            if company_id and is_admin:
                conditions.append("p.company_id = ?")
                params.append(company_id)

            if period_year:
                conditions.append("p.period_start != '' AND strftime('%Y', p.period_start) = ?")
                params.append(str(period_year))

            if required_only:
                conditions.append("c.is_required = 1")

            where = "WHERE " + " AND ".join(conditions) if conditions else ""

            total_cursor = conn.execute(
                f"SELECT COUNT(*) FROM doc_posts p LEFT JOIN doc_categories c ON p.category_id = c.id {where}", params
            )
            total = total_cursor.fetchone()[0]

            offset = (page - 1) * per_page
            cursor = conn.execute(
                f"""
                SELECT p.id, p.title, p.file_name, p.file_size, p.company_id, p.company_name,
                       p.author_id, p.author_name, p.view_count, p.created_at,
                       p.period_start, p.period_end,
                       c.name AS category_name, c.is_required, p.category_id
                FROM doc_posts p
                LEFT JOIN doc_categories c ON p.category_id = c.id
                {where}
                ORDER BY p.id DESC
                LIMIT ? OFFSET ?
                """,
                params + [per_page, offset],
            )
            posts = [dict(row) for row in cursor.fetchall()]
            return {"posts": posts, "total": total, "page": page, "per_page": per_page}
        finally:
            conn.close()

    def add_doc_post(
        self,
        category_id: int,
        title: str,
        content: str,
        file_name: str,
        file_path: str,
        file_size: int,
        company_id: Optional[int],
        company_name: str,
        author_id: int,
        author_name: str,
        period_start: str = "",
        period_end: str = "",
    ) -> Dict:
        conn = self._get_conn()
        try:
            conn.execute(
                """
                INSERT INTO doc_posts (category_id, title, content, file_name, file_path,
                    file_size, company_id, company_name, author_id, author_name,
                    period_start, period_end)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (category_id, title, content, file_name, file_path, file_size,
                 company_id, company_name, author_id, author_name,
                 period_start, period_end),
            )
            conn.commit()
            post_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": post_id}
        finally:
            conn.close()

    def get_doc_post(self, post_id: int) -> Optional[Dict]:
        conn = self._get_conn()
        try:
            conn.execute("UPDATE doc_posts SET view_count = view_count + 1 WHERE id = ?", (post_id,))
            conn.commit()
            cursor = conn.execute(
                """
                SELECT p.*, c.name AS category_name
                FROM doc_posts p
                LEFT JOIN doc_categories c ON p.category_id = c.id
                WHERE p.id = ?
                """,
                (post_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def delete_doc_post(self, post_id: int, user_id: int, is_admin: bool) -> bool:
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT author_id, file_path FROM doc_posts WHERE id = ?", (post_id,))
            row = cursor.fetchone()
            if not row:
                return False
            if not is_admin and row["author_id"] != user_id:
                return False
            conn.execute("DELETE FROM doc_posts WHERE id = ?", (post_id,))
            conn.commit()
            return row["file_path"]  # return file_path for cleanup
        finally:
            conn.close()

    def get_doc_post_years(self) -> List[int]:
        """Return distinct years found in doc_posts period_start."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT DISTINCT strftime('%Y', period_start) AS y
                FROM doc_posts
                WHERE period_start != '' AND period_start IS NOT NULL
                ORDER BY y DESC
            """)
            return [int(row["y"]) for row in cursor.fetchall() if row["y"]]
        finally:
            conn.close()

    def get_doc_file_path(self, post_id: int) -> Optional[str]:
        conn = self._get_conn()
        try:
            cursor = conn.execute(
                "SELECT file_path, file_name FROM doc_posts WHERE id = ?", (post_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def get_submission_status(self) -> List[Dict]:
        """Return per-company, per-category submission status for admin."""
        conn = self._get_conn()
        try:
            # Get all companies
            companies = [dict(r) for r in conn.execute(
                "SELECT id, name, code, country, erp_system FROM companies ORDER BY name"
            ).fetchall()]

            # Get all categories
            categories = [dict(r) for r in conn.execute(
                "SELECT id, name, is_required FROM doc_categories ORDER BY is_required DESC, id"
            ).fetchall()]

            # Get latest post per company per category (include period info)
            cursor = conn.execute("""
                SELECT company_id, category_id, MAX(created_at) AS submitted_at,
                       author_name, file_name, period_start, period_end
                FROM doc_posts
                GROUP BY company_id, category_id
            """)
            submitted = {}
            for row in cursor.fetchall():
                key = (row["company_id"], row["category_id"])
                submitted[key] = {
                    "submitted_at": row["submitted_at"],
                    "author_name": row["author_name"],
                    "file_name": row["file_name"],
                    "period_start": row["period_start"],
                    "period_end": row["period_end"],
                }

            # Get pending requests
            cursor2 = conn.execute("""
                SELECT company_id, category_id, due_date, email_sent_at
                FROM doc_requests
                ORDER BY created_at DESC
            """)
            requests_map = {}
            for row in cursor2.fetchall():
                key = (row["company_id"], row["category_id"])
                if key not in requests_map:
                    requests_map[key] = {
                        "due_date": row["due_date"],
                        "email_sent_at": row["email_sent_at"],
                    }

            result = []
            for company in companies:
                row = {
                    "company_id": company["id"],
                    "company_name": company["name"],
                    "company_code": company["code"],
                    "country": company.get("country", ""),
                    "erp_system": company.get("erp_system", ""),
                    "categories": [],
                }
                for cat in categories:
                    key = (company["id"], cat["id"])
                    sub = submitted.get(key)
                    req = requests_map.get(key)
                    row["categories"].append({
                        "category_id": cat["id"],
                        "category_name": cat["name"],
                        "is_required": bool(cat.get("is_required", 1)),
                        "submitted": sub is not None,
                        "submitted_at": sub["submitted_at"] if sub else None,
                        "author_name": sub["author_name"] if sub else None,
                        "file_name": sub["file_name"] if sub else None,
                        "period_start": sub["period_start"] if sub else None,
                        "period_end": sub["period_end"] if sub else None,
                        "due_date": req["due_date"] if req else None,
                        "email_sent_at": req["email_sent_at"] if req else None,
                    })
                result.append(row)
            return result
        finally:
            conn.close()

    def add_doc_request(
        self,
        category_id: int,
        company_id: int,
        company_name: str,
        due_date: str,
        message: str,
        created_by: int,
        created_by_name: str,
    ) -> Dict:
        conn = self._get_conn()
        try:
            conn.execute(
                """
                INSERT INTO doc_requests (category_id, company_id, company_name,
                    due_date, message, created_by, created_by_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (category_id, company_id, company_name, due_date, message,
                 created_by, created_by_name),
            )
            conn.commit()
            req_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": req_id}
        finally:
            conn.close()

    def mark_email_sent(self, request_id: int):
        conn = self._get_conn()
        try:
            conn.execute(
                "UPDATE doc_requests SET email_sent_at = datetime('now') WHERE id = ?",
                (request_id,),
            )
            conn.commit()
        finally:
            conn.close()

    def login(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user and return JWT token."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if not user:
                return None

            if not _verify_password(password, user["password_salt"], user["password_hash"]):
                return None

            # Update last login
            conn.execute("UPDATE users SET last_login = datetime('now') WHERE id = ?", (user["id"],))
            conn.commit()

            # Get user's companies
            companies = self.get_user_companies(user["id"])

            token = create_jwt({
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            })

            return {
                "token": token,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "role": user["role"],
                    "department": user["department"],
                },
                "companies": companies,
            }
        finally:
            conn.close()

    def get_user_companies(self, user_id: int) -> List[Dict]:
        """Get companies accessible by a user."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT c.id, c.name, c.code, uc.role
                FROM companies c
                JOIN user_companies uc ON c.id = uc.company_id
                WHERE uc.user_id = ?
                ORDER BY c.name
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Get user info by ID."""
        conn = self._get_conn()
        try:
            cursor = conn.execute(
                "SELECT id, email, name, role, department FROM users WHERE id = ?",
                (user_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def verify_company_access(self, user_id: int, company_code: str) -> bool:
        """Check if user has access to a company."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT 1 FROM user_companies uc
                JOIN companies c ON uc.company_id = c.id
                WHERE uc.user_id = ? AND c.code = ?
            """, (user_id, company_code))
            return cursor.fetchone() is not None
        finally:
            conn.close()

    def get_all_companies(self) -> List[Dict]:
        """Get all companies (admin only)."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT id, name, code FROM companies ORDER BY name")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    # ===== Reports =====

    def save_report(self, company_id: int, company_code: str, company_name: str,
                    year: int, month: int, user_id: int, user_name: str,
                    revenue: float = 0, pl_items: int = 0) -> Dict:
        """Save a generated report record."""
        conn = self._get_conn()
        try:
            conn.execute("""
                INSERT INTO reports (company_id, company_code, company_name, year, month,
                                     created_by, created_by_name, revenue, pl_items)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (company_id, company_code, company_name, year, month,
                  user_id, user_name, revenue, pl_items))
            conn.commit()
            report_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": report_id}
        finally:
            conn.close()

    def get_user_reports(self, user_id: int) -> List[Dict]:
        """Get all reports accessible by a user (via their companies)."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("""
                SELECT r.* FROM reports r
                JOIN user_companies uc ON r.company_id = uc.company_id
                WHERE uc.user_id = ?
                ORDER BY r.created_at DESC
            """, (user_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def add_company(self, name: str, code: str) -> Dict:
        """Add a new company."""
        conn = self._get_conn()
        try:
            conn.execute("INSERT INTO companies (name, code) VALUES (?, ?)", (name, code))
            conn.commit()
            company_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": company_id, "name": name, "code": code}
        finally:
            conn.close()

    def save_demo_request(self, first_name: str, last_name: str, email: str, phone: str,
                          company: str, note: Optional[str] = None, source: str = "web") -> Dict:
        """Save a demo request to the auth database."""
        conn = self._get_conn()
        try:
            conn.execute(
                "INSERT INTO demo_requests (first_name, last_name, email, phone, company, note, source) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (first_name, last_name, email, phone, company, note, source),
            )
            conn.commit()
            request_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            return {"id": request_id}
        finally:
            conn.close()

    def get_demo_requests(self) -> List[Dict]:
        """Get all demo requests stored in the auth database."""
        conn = self._get_conn()
        try:
            cursor = conn.execute("SELECT * FROM demo_requests ORDER BY created_at DESC")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()


# Global instance
auth_db = AuthDB()
